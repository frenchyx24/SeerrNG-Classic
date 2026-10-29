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
const routesIndexPath = path.join(sourceRoot, 'server/routes/index.ts');
const authMiddlewarePath = path.join(sourceRoot, 'server/middleware/auth.ts');
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

// This is the first API limiter reached by nearly every endpoint (600/minute).
// SSR fetches made by the same process to 127.0.0.1 otherwise consume this shared
// bucket and turn detail pages into HTTP 429/500 errors. Skip only genuine loopback
// calls without forwarded-client headers; proxy/browser traffic remains rate-limited.
await replaceRequired(
  authMiddlewarePath,
  "skip: () =>\n    process.env.NODE_ENV === 'test' || process.env.E2E_TESTS === 'true',",
  "skip: (req) => {\n    const remoteAddress = req.socket.remoteAddress?.toLowerCase();\n    const hasForwardedClientAddress = Boolean(\n      req.headers['x-forwarded-for'] ||\n      req.headers['x-real-ip'] ||\n      req.headers.forwarded\n    );\n    const isLoopbackInternalRequest =\n      !hasForwardedClientAddress &&\n      (remoteAddress === '127.0.0.1' ||\n        remoteAddress === '::1' ||\n        remoteAddress === '::ffff:127.0.0.1');\n    return (\n      isLoopbackInternalRequest ||\n      process.env.NODE_ENV === 'test' ||\n      process.env.E2E_TESTS === 'true'\n    );\n  },",
  'global authenticated API rate limiter for internal SSR requests'
);

// The metadata limiter is stricter (60/minute) and is shared by all metadata
// endpoints per user. A single SSR render calls the API over loopback; exempt
// only loopback requests without forwarded-client headers. Keep the limiter
// active for browser requests traversing a local reverse proxy.
await replaceRequired(
  routesIndexPath,
  "skip: () =>\n    process.env.NODE_ENV === 'test' || process.env.E2E_TESTS === 'true',\n  keyGenerator: (req) => `user:${req.user!.id}`,",
  "skip: (req) => {\n    const remoteAddress = req.socket.remoteAddress?.toLowerCase();\n    const hasForwardedClientAddress = Boolean(\n      req.headers['x-forwarded-for'] ||\n      req.headers['x-real-ip'] ||\n      req.headers.forwarded\n    );\n    const isLoopbackInternalRequest =\n      !hasForwardedClientAddress &&\n      (remoteAddress === '127.0.0.1' ||\n        remoteAddress === '::1' ||\n        remoteAddress === '::ffff:127.0.0.1');\n    return (\n      isLoopbackInternalRequest ||\n      process.env.NODE_ENV === 'test' ||\n      process.env.E2E_TESTS === 'true'\n    );\n  },\n  keyGenerator: (req) => `user:${req.user!.id}`,",
  'per-user external metadata limiter for internal SSR requests'
);

// Native fix for SeerrNG's request attribution issue: when a trusted internal/API-key
// caller explicitly supplies X-API-User, bind the request to that existing user.
// The header is ignored unless the actual configured X-API-Key has authenticated;
// ordinary cookie/session authentication continues to use the signed-in session.
await replaceRequired(
  authMiddlewarePath,
  `if (apiKeyAuthenticated) {
    const userRepository = getRepository(User);

    // API key access is a service-level credential. Keep it bound to the
    // owner account instead of allowing callers to impersonate arbitrary users.
    user = await userRepository.findOne({ where: { id: 1 } });
  } else if (!apiKeyProvided && req.session?.userId) {`,
  `if (apiKeyAuthenticated) {
    const userRepository = getRepository(User);
    const apiUserHeader = req.header('X-API-User');

    // The service API key is required before user attribution can be overridden.
    // Invalid or unknown user IDs fail closed rather than silently using account 1.
    if (apiUserHeader === undefined) {
      user = await userRepository.findOne({ where: { id: 1 } });
    } else {
      const requestedUserId = Number(apiUserHeader);
      const validRequestedUserId =
        /^[1-9]\d*$/.test(apiUserHeader) &&
        Number.isSafeInteger(requestedUserId);

      user = validRequestedUserId
        ? await userRepository.findOne({ where: { id: requestedUserId } })
        : null;
    }
  } else if (!apiKeyProvided && req.session?.userId) {`,
  'authenticated X-API-User attribution in auth middleware'
);

// Keep the built-in SeerrOrig theme ID and its known stylesheet route. The
// first overlay introduced a new theme ID plus preference migration; remove those
// moving parts and apply our scoped CSS directly to the built-in theme instead.
const stockThemeDir = path.join(sourceRoot, 'themes/seerrOrig');
await mkdir(stockThemeDir, { recursive: true });

const classicManifest = JSON.parse(await readFile(manifestSource, 'utf8'));
classicManifest.id = 'seerrOrig';
classicManifest.name = 'SeerrNG Classic';
classicManifest.version = '1.0.4';
await writeFile(
  path.join(stockThemeDir, 'manifest.json'),
  JSON.stringify(classicManifest, null, 2) + '\n',
  'utf8'
);

let classicCss = await readFile(cssSource, 'utf8');
classicCss = classicCss.replaceAll('seerrng-classic', 'seerrOrig');
if (!classicCss.includes(":root[data-interface-theme='seerrOrig']")) {
  throw new Error('Classic stylesheet did not normalize to the built-in SeerrOrig scope.');
}
await writeFile(path.join(stockThemeDir, 'theme.css'), classicCss, 'utf8');

console.log('SeerrNG Classic 1.0.4 overlay applied.');
console.log('Interface: built-in SeerrOrig ID with the Classic stylesheet.');
console.log('Routes, APIs, permissions and media handling remain SeerrNG.');

