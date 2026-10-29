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
const mediaSliderPath = path.join(sourceRoot, 'src/components/MediaSlider/index.tsx');
const rowSnapshotHookPath = path.join(sourceRoot, 'src/hooks/useDiscoverRowSnapshot.ts');
const personalizedRowsPath = path.join(sourceRoot, 'src/components/Discover/PersonalizedRows.tsx');
const recentlyAddedSliderPath = path.join(sourceRoot, 'src/components/Discover/RecentlyAddedSlider/index.tsx');
const recentRequestsSliderPath = path.join(sourceRoot, 'src/components/Discover/RecentRequestsSlider/index.tsx');
const movieGenreSliderPath = path.join(sourceRoot, 'src/components/Discover/MovieGenreSlider/index.tsx');
const tvGenreSliderPath = path.join(sourceRoot, 'src/components/Discover/TvGenreSlider/index.tsx');
const plexWatchlistSliderPath = path.join(sourceRoot, 'src/components/Discover/PlexWatchlistSlider/index.tsx');
const dockerfilePath = path.join(sourceRoot, 'Dockerfile');
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
        /^[1-9]\\d*$/.test(apiUserHeader) &&
        Number.isSafeInteger(requestedUserId);

      user = validRequestedUserId
        ? await userRepository.findOne({ where: { id: requestedUserId } })
        : null;
    }
  } else if (!apiKeyProvided && req.session?.userId) {`,
  'authenticated X-API-User attribution in auth middleware'
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

// Existing database backups may carry the stock seerrOrig preference. In this
// dedicated Classic build, map that legacy preference to the packaged stylesheet
// so current users receive the actual custom profile without manual theme selection.
await replaceRequired(
  themeContextPath,
  "const savedInterfaceTheme =\n      parseInterfaceTheme(user?.settings?.interfaceTheme) ??\n      DEFAULT_INTERFACE_THEME_ID;",
  "const parsedSavedInterfaceTheme =\n      parseInterfaceTheme(user?.settings?.interfaceTheme) ??\n      DEFAULT_INTERFACE_THEME_ID;\n    const savedInterfaceTheme =\n      parsedSavedInterfaceTheme === 'seerrOrig'\n        ? 'seerrng-classic'\n        : parsedSavedInterfaceTheme;",
  'legacy saved interface theme migration'
);

// Bound homepage/discovery requests so a stalled API response cannot leave the
// homepage rendering loading placeholders forever.
await replaceRequired(
  rowSnapshotHookPath,
  "fetcher: ([requestUrl]: [string, string]) =>\n        axios.get<T>(requestUrl).then((response) => response.data),",
  "fetcher: ([requestUrl]: [string, string]) =>\n        axios.get<T>(requestUrl, { timeout: 20_000 }).then((response) => response.data),",
  'discover row snapshot request timeout'
);
await replaceRequired(
  rowSnapshotHookPath,
  "return {\n    data,\n    error,\n    isLoading: hydrated && shouldLoad && data === undefined && !error,\n  };",
  "return {\n    data,\n    error,\n    isLoading: hydrated && shouldLoad && data === undefined && !error,\n    mutate,\n  };",
  'discover row snapshot retry action'
);
await replaceRequired(
  personalizedRowsPath,
  ".get<ProviderTitlesResponse>(endpoint)\n        .then((response) => response.data),",
  ".get<ProviderTitlesResponse>(endpoint, { timeout: 20_000 })\n        .then((response) => response.data),",
  'personalized discovery request timeout'
);
await replaceRequired(
  mediaSliderPath,
  "fetcher: ([requestUrl]: [string, string]) =>\n      axios.get<MixedResult>(requestUrl).then((response) => response.data),",
  "fetcher: ([requestUrl]: [string, string]) =>\n      axios.get<MixedResult>(requestUrl, { timeout: 20_000 }).then((response) => response.data),",
  'media discovery slider request timeout'
);
await replaceRequired(
  mediaSliderPath,
  "  tryAgain: 'Try Again',",
  "  tryAgain: 'Try Again',\n  sectionUnavailable: 'This section could not be loaded',\n  sectionUnavailableHint: 'The request timed out or the server returned an error. Check the SeerrNG logs and try again.',",
  'media slider failure messages'
);
await replaceRequired(
  mediaSliderPath,
  "  const showProviderError =\n    isTmdbMovieFeed && !!error && !renderableTitles.length;",
  "  const showProviderError =\n    isTmdbMovieFeed && !!error && !renderableTitles.length;\n  const showSectionError = !!error && !renderableTitles.length;",
  'media slider error state'
);
await replaceRequired(
  mediaSliderPath,
  "        notice={\n          showingSavedResults || showProviderError ? (\n            <PageErrorMessage\n              title={intl.formatMessage(messages.tmdbUnavailable)}\n              description={\n                showingSavedResults\n                  ? intl.formatMessage(messages.showingSavedResults)\n                  : undefined\n              }",
  "        notice={\n          showingSavedResults || showProviderError || showSectionError ? (\n            <PageErrorMessage\n              title={intl.formatMessage(\n                showSectionError && !isTmdbMovieFeed\n                  ? messages.sectionUnavailable\n                  : messages.tmdbUnavailable\n              )}\n              description={\n                showingSavedResults\n                  ? intl.formatMessage(messages.showingSavedResults)\n                  : showSectionError && !isTmdbMovieFeed\n                    ? intl.formatMessage(messages.sectionUnavailableHint)\n                    : undefined\n              }",
  'media slider timeout/error banner'
);

// The main "Recently Added" row shares the same timeout/retry behavior.
await replaceRequired(
  recentlyAddedSliderPath,
  "const messages = defineMessages('components.Discover.RecentlyAddedSlider', {\n  recentlyAdded: 'Recently Added',\n});",
  "const messages = defineMessages('components.Discover.RecentlyAddedSlider', {\n  recentlyAdded: 'Recently Added',\n  loadFailed: 'Recently added items could not be loaded.',\n  tryAgain: 'Retry loading this section',\n});",
  'recently added failure messages'
);
await replaceRequired(
  recentlyAddedSliderPath,
  "    data: media,\n    error: mediaError,\n    isLoading,",
  "    data: media,\n    error: mediaError,\n    isLoading,\n    mutate,",
  'recently added retry action'
);
await replaceRequired(
  recentlyAddedSliderPath,
  "        }\n        sliderKey=\"media\"\n        isLoading={isLoading}",
  "        }\n        notice={\n          mediaError ? (\n            <PageErrorMessage\n              title={intl.formatMessage(messages.loadFailed)}\n              retry={{\n                onClick: () => mutate(),\n                tooltip: intl.formatMessage(messages.tryAgain),\n              }}\n            />\n          ) : undefined\n        }\n        sliderKey=\"media\"\n        isLoading={isLoading}",
  'recently added error banner'
);
await replaceRequired(
  recentlyAddedSliderPath,
  "import Slider from '@app/components/Slider';",
  "import PageErrorMessage from '@app/components/Common/PageErrorMessage';\nimport Slider from '@app/components/Slider';",
  'recently added error component import'
);

// Keep failed recent-request cards distinct from a request-feed loading failure.
await replaceRequired(
  recentRequestsSliderPath,
  "const messages = defineMessages('components.Discover.RecentRequestsSlider', {\n  unableToConnect:",
  "const messages = defineMessages('components.Discover.RecentRequestsSlider', {\n  loadFailed: 'Recent requests could not be loaded.',\n  tryAgain: 'Retry loading recent requests',\n  unableToConnect:",
  'recent requests failure messages'
);
await replaceRequired(
  recentRequestsSliderPath,
  "    data: requests,\n    error: requestError,\n    isLoading,",
  "    data: requests,\n    error: requestError,\n    isLoading,\n    mutate,",
  'recent requests retry action'
);
await replaceRequired(
  recentRequestsSliderPath,
  "import { sliderTitles } from '@app/components/Discover/constants';",
  "import PageErrorMessage from '@app/components/Common/PageErrorMessage';\nimport { sliderTitles } from '@app/components/Discover/constants';",
  'recent requests error component import'
);
await replaceRequired(
  recentRequestsSliderPath,
  "        notice={\n          hasServiceErrors &&",
  "        notice={\n          requestError ? (\n            <PageErrorMessage\n              title={intl.formatMessage(messages.loadFailed)}\n              retry={{\n                onClick: () => mutate(),\n                tooltip: intl.formatMessage(messages.tryAgain),\n              }}\n            />\n          ) : hasServiceErrors &&",
  'recent requests error banner'
);

// Genre shelves also need to expose timed-out requests instead of silent emptiness.
await replaceRequired(
  movieGenreSliderPath,
  "const messages = defineMessages('components.Discover.MovieGenreSlider', {\n  moviegenres: 'Movie Genres',\n});",
  "const messages = defineMessages('components.Discover.MovieGenreSlider', {\n  moviegenres: 'Movie Genres',\n  loadFailed: 'Movie genres could not be loaded.',\n  tryAgain: 'Retry loading movie genres',\n});",
  'movie genre failure messages'
);
await replaceRequired(
  movieGenreSliderPath,
  "import { genreColorMap } from '@app/components/Discover/constants';",
  "import PageErrorMessage from '@app/components/Common/PageErrorMessage';\nimport { genreColorMap } from '@app/components/Discover/constants';",
  'movie genre error component import'
);
await replaceRequired(
  movieGenreSliderPath,
  "  const { data, error, isLoading } = useDiscoverRowSnapshot<GenreSliderItem[]>({",
  "  const { data, error, isLoading, mutate } = useDiscoverRowSnapshot<GenreSliderItem[]>({",
  'movie genre retry action'
);
await replaceRequired(
  movieGenreSliderPath,
  "        compact\n        sliderKey=\"movie-genres\"",
  "        notice={\n          error ? (\n            <PageErrorMessage\n              title={intl.formatMessage(messages.loadFailed)}\n              retry={{\n                onClick: () => mutate(),\n                tooltip: intl.formatMessage(messages.tryAgain),\n              }}\n            />\n          ) : undefined\n        }\n        compact\n        sliderKey=\"movie-genres\"",
  'movie genre error banner'
);
await replaceRequired(
  tvGenreSliderPath,
  "const messages = defineMessages('components.Discover.TvGenreSlider', {\n  tvgenres: 'Series Genres',\n});",
  "const messages = defineMessages('components.Discover.TvGenreSlider', {\n  tvgenres: 'Series Genres',\n  loadFailed: 'Series genres could not be loaded.',\n  tryAgain: 'Retry loading series genres',\n});",
  'series genre failure messages'
);
await replaceRequired(
  tvGenreSliderPath,
  "import { genreColorMap } from '@app/components/Discover/constants';",
  "import PageErrorMessage from '@app/components/Common/PageErrorMessage';\nimport { genreColorMap } from '@app/components/Discover/constants';",
  'series genre error component import'
);
await replaceRequired(
  tvGenreSliderPath,
  "  const { data, error, isLoading } = useDiscoverRowSnapshot<GenreSliderItem[]>({",
  "  const { data, error, isLoading, mutate } = useDiscoverRowSnapshot<GenreSliderItem[]>({",
  'series genre retry action'
);
await replaceRequired(
  tvGenreSliderPath,
  "        compact\n        sliderKey=\"tv-genres\"",
  "        notice={\n          error ? (\n            <PageErrorMessage\n              title={intl.formatMessage(messages.loadFailed)}\n              retry={{\n                onClick: () => mutate(),\n                tooltip: intl.formatMessage(messages.tryAgain),\n              }}\n            />\n          ) : undefined\n        }\n        compact\n        sliderKey=\"tv-genres\"",
  'series genre error banner'
);

// Do not hide the entire watchlist shelf on failure; show a retryable message.
await replaceRequired(
  plexWatchlistSliderPath,
  "  emptywatchlist: 'Items added to your watchlist will appear here.',",
  "  emptywatchlist: 'Items added to your watchlist will appear here.',\n  loadFailed: 'Your watchlist could not be loaded.',\n  tryAgain: 'Retry loading your watchlist',",
  'watchlist failure messages'
);
await replaceRequired(
  plexWatchlistSliderPath,
  "import Slider from '@app/components/Slider';",
  "import PageErrorMessage from '@app/components/Common/PageErrorMessage';\nimport Slider from '@app/components/Slider';",
  'watchlist error component import'
);
await replaceRequired(
  plexWatchlistSliderPath,
  "    data: watchlistItems,\n    error: watchlistError,\n    isLoading,",
  "    data: watchlistItems,\n    error: watchlistError,\n    isLoading,\n    mutate,",
  'watchlist retry action'
);
await replaceRequired(
  plexWatchlistSliderPath,
  "  if (\n    (isWatchlistEmpty &&\n      !user?.settings?.watchlistSyncMovies &&\n      !user?.settings?.watchlistSyncTv &&\n      !user?.settings?.watchlistSyncMusic &&\n      !user?.settings?.watchlistSyncBooks &&\n      !user?.settings?.watchlistSyncComics &&\n      !user?.settings?.watchlistSyncMagazines) ||\n    watchlistError\n  ) {\n    return null;\n  }",
  "  if (\n    isWatchlistEmpty &&\n    !user?.settings?.watchlistSyncMovies &&\n    !user?.settings?.watchlistSyncTv &&\n    !user?.settings?.watchlistSyncMusic &&\n    !user?.settings?.watchlistSyncBooks &&\n    !user?.settings?.watchlistSyncComics &&\n    !user?.settings?.watchlistSyncMagazines\n  ) {\n    return null;\n  }",
  'keep watchlist row visible when the feed fails'
);
await replaceRequired(
  plexWatchlistSliderPath,
  "        sliderKey=\"watchlist\"\n        isLoading={isLoading}\n        isEmpty={isWatchlistEmpty}",
  "        sliderKey=\"watchlist\"\n        notice={\n          watchlistError ? (\n            <PageErrorMessage\n              title={intl.formatMessage(messages.loadFailed)}\n              retry={{\n                onClick: () => mutate(),\n                tooltip: intl.formatMessage(messages.tryAgain),\n              }}\n            />\n          ) : undefined\n        }\n        isLoading={isLoading && !watchlistError}\n        isEmpty={isWatchlistEmpty && !watchlistError}",
  'watchlist error banner'
);

// New UI messages are extracted from the component defaults. Run extraction before
// the upstream sync check so the custom copy can build without hand-maintaining
// generated locale JSON in this overlay repository.
await replaceRequired(
  dockerfilePath,
  "RUN pnpm i18n:check && pnpm build:next && pnpm build:server",
  "RUN pnpm i18n:extract && pnpm i18n:check && pnpm build:next && pnpm build:server",
  'extract custom UI messages before the i18n consistency check'
);

console.log('Classic preferences, timed discovery requests, and retryable shelf errors enabled.');

console.log('SeerrNG Classic 3.5.1 overlay applied.');
console.log('Default interface theme: seerrng-classic');
console.log('Routes, APIs, permissions and media handling remain SeerrNG.');

