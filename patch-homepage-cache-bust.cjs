const fs = require('node:fs');
const cssPath = '/app/dist/interface-themes/seerrng-classic/theme.css';
const cssMarker = '/* SeerrNG Classic homepage carousel sizing v2 */';
let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes(cssMarker)) {
  css += [
    '',
    cssMarker,
    '/* Size all home carousel shells, not only one historical wrapper. */',
    ":is(:root[data-interface-theme='seerrng-classic'], [data-interface-theme='seerrng-classic']) .slider-item .title-card-shell,",
    ":is(:root[data-interface-theme='seerrng-classic'], [data-interface-theme='seerrng-classic']) ul.cards-horizontal .title-card-shell {",
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
  ].join('\n');
  fs.writeFileSync(cssPath, css, 'utf8');
}
const documentPath = '/app/.next/server/pages/_document.js';
const oldHref = 'href:"/api/v1/interface-themes/seerrng-classic/theme.css"';
const newHref = 'href:"/api/v1/interface-themes/seerrng-classic/theme.css?v=1.0.6"';
let document = fs.readFileSync(documentPath, 'utf8');
if (!document.includes(newHref)) {
  if (!document.includes(oldHref)) throw new Error('Theme stylesheet link not found in compiled document');
  document = document.replace(oldHref, newHref);
  fs.writeFileSync(documentPath, document, 'utf8');
}
console.log('Applied homepage carousel sizing and versioned theme stylesheet URL.');
