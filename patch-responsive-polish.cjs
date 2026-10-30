const fs = require('node:fs');
const cssPath = '/app/dist/interface-themes/seerrng-classic/theme.css';
const marker = '/* SeerrNG Classic responsive polish 1.1.0 */';
let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes(marker)) {
  const scope = ":is(:root[data-interface-theme='seerrng-classic'], [data-interface-theme='seerrng-classic'])";
  const rules = [
    '',
    marker,
    scope + ' { --interface-page-gutter: clamp(0.875rem, 3vw, 1.5rem); --interface-grid-gap: clamp(0.75rem, 2vw, 1.25rem); --interface-section-gap: clamp(1rem, 2.5vw, 1.5rem); --interface-motion-duration: 120ms; }',
    scope + ' body { overflow-x: clip; }',
    scope + ' :is(.page-layout, [data-interface-role=\"main-content\"]) { min-width: 0; max-width: 100%; }',
    scope + ' :is(.app-card-main, .app-card-sub, .app-card-inset) { min-width: 0; }',
    scope + ' :is(button, a, input, select, textarea) { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }',
    scope + ' :is(.app-mobile-menu-surface, .mobile-menu-navigation) { overscroll-behavior: contain; }',
    scope + ' .app-card-poster-active { transform: translateZ(0) scale(1.015); box-shadow: 0 6px 16px rgb(0 0 0 / 0.28); }',
    '@media (max-width: 767px) {',
    '  ' + scope + ' { --interface-page-gutter: clamp(0.75rem, 3.5vw, 1.125rem); --interface-grid-gap: clamp(0.625rem, 2.4vw, 0.875rem); --interface-section-gap: 1.125rem; --poster-width: clamp(112px, 38vw, 150px); }',
    '  ' + scope + ' :is(.page-layout, [data-interface-role=\"main-content\"]) { padding-inline: var(--interface-page-gutter); padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 1rem); }',
    '  ' + scope + ' .slider-header { display: flex; flex-wrap: wrap; align-items: center; column-gap: 0.5rem; row-gap: 0.5rem; padding-block: 0.875rem 0.625rem; }',
    '  ' + scope + ' .slider-title { flex: 1 1 100%; min-width: 0; font-size: clamp(1.125rem, 5vw, 1.4rem); line-height: 1.2; white-space: normal; overflow-wrap: anywhere; }',
    '  ' + scope + ' .slider-header :is(button, a) { min-width: 44px; min-height: 44px; }',
    '  ' + scope + ' ul.cards-horizontal { scroll-snap-type: x proximity; scroll-padding-inline: var(--interface-page-gutter); overscroll-behavior-inline: contain; }',
    '  ' + scope + ' .slider-item { scroll-snap-align: start; }',
    '  ' + scope + ' :is(.main-menu-link, .preview-filter, .poster-control) { min-height: 44px; }',
    '  ' + scope + ' .poster-control { min-width: 44px; }',
    '  ' + scope + ' :is(.app-mobile-menu-surface, .mobile-menu-navigation) { padding-bottom: env(safe-area-inset-bottom, 0px); }',
    '  ' + scope + ' :is(.app-card-main, .app-card-sub, .app-card-inset, .page-overlay-card) { border-radius: 0.5rem; box-shadow: 0 1px 2px rgb(0 0 0 / 0.16); }',
    '}',
    '@media (min-width: 768px) and (max-width: 1199px) {',
    '  ' + scope + ' { --interface-page-gutter: clamp(1.25rem, 3vw, 2rem); --interface-grid-gap: 1rem; }',
    '}',
    '@media (prefers-reduced-motion: reduce) {',
    '  ' + scope + ' *, ' + scope + ' *::before, ' + scope + ' *::after { scroll-behavior: auto !important; animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }',
    '}',
  ].join('\n');
  css += rules;
  fs.writeFileSync(cssPath, css, 'utf8');
}
const documentPath = '/app/.next/server/pages/_document.js';
let document = fs.readFileSync(documentPath, 'utf8');
const from = 'theme.css?v=1.0.7';
const to = 'theme.css?v=1.1.0';
if (!document.includes(to)) {
  if (!document.includes(from)) throw new Error('Versioned theme stylesheet URL not found in compiled document');
  document = document.replace(from, to);
  fs.writeFileSync(documentPath, document, 'utf8');
}
console.log('Applied responsive UI and interaction polish; stylesheet URL versioned for cache refresh.');
