const fs = require('node:fs');
const cssPath = '/app/dist/interface-themes/seerrng-classic/theme.css';
const marker = "/* SeerrNG Classic mobile homepage loading-card fallback */";
const css = fs.readFileSync(cssPath, 'utf8');
if (css.includes(marker)) { console.log('Mobile homepage fallback already present.'); process.exit(0); }
const override = [
  '',
  marker,
  '/* Current home carousels wrap shells differently from the older selectors. */',
  '/* Keep pending poster cards full-size instead of collapsing to tiny dots. */',
  ":is(:root[data-interface-theme='seerrng-classic'], [data-interface-theme='seerrng-classic'])",
  "  .title-card-shell[data-poster-state='loading'],",
  ":is(:root[data-interface-theme='seerrng-classic'], [data-interface-theme='seerrng-classic'])",
  "  [data-poster-state='loading'] .title-card-shell {",
  '  display: block !important;',
  '  box-sizing: border-box !important;',
  '  width: var(--poster-width, 150px) !important;',
  '  min-width: var(--poster-width, 150px) !important;',
  '  max-width: var(--poster-width, 150px) !important;',
  '  height: auto !important;',
  '  min-height: 225px !important;',
  '  aspect-ratio: 2 / 3 !important;',
  '  flex: 0 0 var(--poster-width, 150px) !important;',
  '}',
  '',
  '@media (max-width: 640px) {',
  ":is(:root[data-interface-theme='seerrng-classic'], [data-interface-theme='seerrng-classic'])",
  '    .slider-header {',
  '    display: flex;',
  '    flex-wrap: wrap;',
  '    align-items: center;',
  '    row-gap: 0.5rem;',
  '  }',
  '',
  ":is(:root[data-interface-theme='seerrng-classic'], [data-interface-theme='seerrng-classic'])",
  '    .slider-title {',
  '    flex: 1 1 100%;',
  '    min-width: 0;',
  '    white-space: normal;',
  '    overflow: visible;',
  '    text-overflow: clip;',
  '  }',
  '}'
].join('\n');
fs.writeFileSync(cssPath, css + override, 'utf8');
console.log('Added mobile homepage card and carousel-heading fallbacks.');