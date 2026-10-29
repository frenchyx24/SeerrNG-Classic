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
const interfaceThemePath = path.join(sourceRoot, 'server/utils/interfaceTheme.ts');
const themeContextPath = path.join(sourceRoot, 'src/context/ThemeContext.tsx');
const themeContextTestPath = path.join(sourceRoot, 'src/context/ThemeContext.test.ts');
const providerTestPath = path.join(sourceRoot, 'src/context/ThemeProvider.vitest.test.tsx');
const documentPath = path.join(sourceRoot, 'src/pages/_document.tsx');
const profileTestPath = path.join(sourceRoot, 'src/styles/interfaceThemeProfiles.test.mjs');
const serverIndexPath = path.join(sourceRoot, 'server/index.ts');
const routesIndexPath = path.join(sourceRoot, 'server/routes/index.ts');
const manifestSource = path.join(overlayRoot, 'overlays/themes/seerrng-classic/manifest.json');
const cssSource = path.join(overlayRoot, 'overlays/themes/seerrng-classic/theme.css');

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

async function replaceRequired(filename, before, after, label) {
  let text = await readFile(filename, 'utf8');
  if (text.includes(after)) return;
  if (!text.includes(before)) {
    throw new Error('Could not safely patch ' + label + ' in ' + path.relative(sourceRoot, filename));
  }
  text = text.replace(before, after);
  await writeFile(filename, text, 'utf8');
}

// Server-rendered pages call the same Express API over 127.0.0.1. These requests
// share one loopback rate-limit bucket and can exhaust 600 requests/minute,
// turning ordinary media-detail navigation into an HTTP 500. Do not apply the
// public-client limiter to loopback server-to-self requests.
await replaceRequired(
  serverIndexPath,
  "skip: () =>\n    process.env.NODE_ENV === 'test' || process.env.E2E_TESTS === 'true',",
  "skip: (req) => {\n    const remoteAddress = req.socket.remoteAddress?.toLowerCase();\n    const isLoopbackRequest =\n      remoteAddress === '127.0.0.1' ||\n      remoteAddress === '::1' ||\n      remoteAddress === '::ffff:127.0.0.1';\n    return (\n      isLoopbackRequest ||\n      process.env.NODE_ENV === 'test' ||\n      process.env.E2E_TESTS === 'true'\n    );\n  },",
  'API rate limit for internal loopback requests'
);

// The metadata limiter is stricter (60/minute) and is shared by all metadata
// endpoints per user. A single SSR render can call the loopback API repeatedly;
// allow these server-to-self calls through while retaining the user limit for
// requests arriving from browsers and other clients.
await replaceRequired(
  routesIndexPath,
  "skip: () =>\n    process.env.NODE_ENV === 'test' || process.env.E2E_TESTS === 'true',\n  keyGenerator: (req) => `user:${req.user!.id}`,",
  "skip: (req) => {\n    const remoteAddress = req.socket.remoteAddress?.toLowerCase();\n    const isLoopbackRequest =\n      remoteAddress === '127.0.0.1' ||\n      remoteAddress === '::1' ||\n      remoteAddress === '::ffff:127.0.0.1';\n    return (\n      isLoopbackRequest ||\n      process.env.NODE_ENV === 'test' ||\n      process.env.E2E_TESTS === 'true'\n    );\n  },\n  keyGenerator: (req) => `user:${req.user!.id}`,",
  'per-user external metadata limiter for internal SSR requests'
);

const targetThemeDir = path.join(sourceRoot, 'themes/seerrng-classic');
await mkdir(targetThemeDir, { recursive: true });
await cp(manifestSource, path.join(targetThemeDir, 'manifest.json'));
await cp(cssSource, path.join(targetThemeDir, 'theme.css'));

// Register the theme with the server registry. A built-in theme must be listed here
// (a picker-only catalog entry would be silently rejected by the server).
await replaceRequired(
  interfaceThemePath,
  "export const DEFAULT_INTERFACE_THEME_ID = 'seerrOrig';",
  "export const DEFAULT_INTERFACE_THEME_ID = 'seerrng-classic';",
  'the default interface theme'
);
await replaceRequired(
  interfaceThemePath,
  "export const INTERFACE_THEME_IDS = ['seerrOrig', 'seerrNGJ'] as const;",
  "export const INTERFACE_THEME_IDS = ['seerrOrig', 'seerrNGJ', 'seerrng-classic'] as const;",
  'the built-in theme allowlist'
);

// Keep the server-rendered first paint in sync with the client default.
let document = await readFile(documentPath, 'utf8');
if (!document.includes("data-interface-theme='seerrng-classic'") &&
    !document.includes('data-interface-theme="seerrng-classic"')) {
  if (!document.includes('seerrOrig')) {
    throw new Error('Could not safely update the default theme stylesheet in _document.tsx.');
  }
  document = document.replaceAll('seerrOrig', 'seerrng-classic');
  await writeFile(documentPath, document, 'utf8');
}

// Register the manifest in the frontend fallback catalog.
let catalog = await readFile(catalogPath, 'utf8');
const importLine = "import seerrngClassic from '../../themes/seerrng-classic/manifest.json';";
if (!catalog.includes(importLine)) {
  const anchor = "import seerrOrig from '../../themes/seerrOrig/manifest.json';";
  if (!catalog.includes(anchor)) {
    throw new Error('Could not find the SeerrOrig manifest import in interfaceThemeCatalog.ts.');
  }
  catalog = catalog.replace(anchor, anchor + '\n' + importLine);
}
if (!catalog.includes('  seerrngClassic,') && !catalog.includes('  seerrngClassic as InterfaceThemeManifest,')) {
  const listAnchor = /^[ \t]*seerrOrig,[ \t]*$/m;
  if (!listAnchor.test(catalog)) {
    throw new Error('Could not find seerrOrig in BUILT_IN_INTERFACE_THEME_MANIFESTS.');
  }
  catalog = catalog.replace(listAnchor, '$&\n  seerrngClassic,');
}
await writeFile(catalogPath, catalog, 'utf8');

// JSON-imported manifests widen numeric fields in TypeScript. Validate the manifest
// schema at runtime, then narrow the built-in catalog entries to its declared type.
await replaceRequired(
  catalogPath,
  "  seerrOrig,\n  seerrngClassic,\n  seerrNGJ,",
  "  seerrOrig as InterfaceThemeManifest,\n  seerrngClassic as InterfaceThemeManifest,\n  seerrNGJ as InterfaceThemeManifest,",
  'built-in manifest literal types'
);

// Preserve SeerrOrig's accent/preset behavior when the new theme is active.
await replaceRequired(
  themeContextPath,
  "interfaceTheme === 'seerrOrig' && palette === DEFAULT_THEME_PALETTE_ID",
  "(interfaceTheme === 'seerrOrig' || interfaceTheme === 'seerrng-classic') && palette === DEFAULT_THEME_PALETTE_ID",
  'classic accent behavior'
);
await replaceRequired(
  themeContextPath,
  "else if (interfaceTheme === 'seerrOrig' && overrides?.preset)",
  "else if ((interfaceTheme === 'seerrOrig' || interfaceTheme === 'seerrng-classic') && overrides?.preset)",
  'classic preset behavior'
);

// Keep the explicit contract tests aligned with the new built-in default.
await replaceRequired(
  themeContextTestPath,
  "assert.equal(DEFAULT_INTERFACE_THEME_ID, 'seerrOrig');",
  "assert.equal(DEFAULT_INTERFACE_THEME_ID, 'seerrng-classic');",
  'the default-theme test'
);
await replaceRequired(
  themeContextTestPath,
  "assert.deepEqual(INTERFACE_THEME_IDS, ['seerrOrig', 'seerrNGJ']);",
  "assert.deepEqual(INTERFACE_THEME_IDS, ['seerrOrig', 'seerrNGJ', 'seerrng-classic']);",
  'the theme allowlist test'
);
await replaceRequired(
  themeContextTestPath,
  "assert.equal(parseInterfaceTheme('seerrNGJ'), 'seerrNGJ');",
  "assert.equal(parseInterfaceTheme('seerrNGJ'), 'seerrNGJ');\n    assert.equal(parseInterfaceTheme('seerrng-classic'), 'seerrng-classic');",
  'the theme identifier test'
);

await replaceRequired(
  themeContextTestPath,
  "defaults to SeerrOrig and validates built-in or custom theme IDs",
  "defaults to SeerrNG Classic and validates built-in or custom theme IDs",
  'the theme test description'
);
await replaceRequired(
  themeContextTestPath,
  "ships two separately scoped, materially different interface sheets",
  "ships separately scoped, materially different interface sheets",
  'the interface sheet test description'
);

let providerTest = await readFile(providerTestPath, 'utf8');
const oldDefaultExpectation = "expect(document.documentElement.dataset.themeMode).toBe('light');\n  expect(theme.interfaceTheme).toBe('seerrOrig');\n  expect(document.documentElement.dataset.interfaceTheme).toBe('seerrOrig');";
const newDefaultExpectation = "expect(document.documentElement.dataset.themeMode).toBe('light');\n  expect(theme.interfaceTheme).toBe('seerrng-classic');\n  expect(document.documentElement.dataset.interfaceTheme).toBe('seerrng-classic');";
if (providerTest.includes(oldDefaultExpectation)) {
  providerTest = providerTest.replace(oldDefaultExpectation, newDefaultExpectation);
  await writeFile(providerTestPath, providerTest, 'utf8');
} else if (!providerTest.includes(newDefaultExpectation)) {
  throw new Error('Could not safely update the default-theme provider test.');
}

await replaceRequired(
  profileTestPath,
  "/api\\/v1\\/interface-themes\\/seerrOrig\\/theme\\.css/",
  "/api\\/v1\\/interface-themes\\/seerrng-classic\\/theme\\.css/",
  'the server-rendered theme stylesheet test'
);

console.log('SeerrNG Classic 3.5.1 overlay applied.');
console.log('Default interface theme: seerrng-classic');
console.log('Routes, APIs, permissions and media handling remain SeerrNG.');

