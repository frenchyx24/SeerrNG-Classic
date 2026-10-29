#!/usr/bin/env node
import { cp, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const overlayRoot = path.resolve(scriptDir, '..');
const sourceRoot = process.argv[2] ? path.resolve(process.argv[2]) : null;

if (!sourceRoot) {
  console.error('Usage: node scripts/apply-overrides.mjs <path-to-seerrng-source>');
  process.exit(2);
}

const packagePath = path.join(sourceRoot, 'package.json');
const catalogPath = path.join(sourceRoot, 'src/utils/interfaceThemeCatalog.ts');
const manifestSource = path.join(overlayRoot, 'overlays/themes/seerrngClassic/manifest.json');
const cssSource = path.join(overlayRoot, 'overlays/themes/seerrngClassic/theme.css');

let packageJson;
try {
  packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
} catch {
  console.error('The target directory does not contain a readable package.json.');
  process.exit(2);
}

if (packageJson.name !== 'seerrng') {
  console.error(
    'Unexpected source tree: expected package.json name "seerrng", found "' +
      String(packageJson.name) +
      '". Refusing to patch an unrelated project.'
  );
  process.exit(2);
}

const targetThemeDir = path.join(sourceRoot, 'themes/seerrngClassic');
await mkdir(targetThemeDir, { recursive: true });
await cp(manifestSource, path.join(targetThemeDir, 'manifest.json'));
await cp(cssSource, path.join(targetThemeDir, 'theme.css'));

let catalog = await readFile(catalogPath, 'utf8');
const importLine = "import seerrNGClassic from '../../themes/seerrngClassic/manifest.json';";

if (!catalog.includes(importLine)) {
  const anchor = "import seerrOrig from '../../themes/seerrOrig/manifest.json';";
  if (!catalog.includes(anchor)) {
    throw new Error('Could not find the SeerrOrig manifest import in interfaceThemeCatalog.ts.');
  }
  catalog = catalog.replace(anchor, anchor + '\n' + importLine);
}

if (!catalog.includes('  seerrNGClassic,')) {
  const listAnchor = /^[ \\t]*seerrOrig,[ \\t]*$/m;
  if (!listAnchor.test(catalog)) {
    throw new Error('Could not find seerrOrig in BUILT_IN_INTERFACE_THEME_MANIFESTS.');
  }
  catalog = catalog.replace(listAnchor, '$1\n  seerrNGClassic,');
}

await writeFile(catalogPath, catalog, 'utf8');
console.log('SeerrNG Classic 3.5.1 overlay applied.');
console.log('New interface theme: seerrngClassic');
console.log('Original routes, APIs, permissions and media features are unchanged.');

