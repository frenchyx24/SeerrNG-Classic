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
const specPath = '/app/seerr-api.yml';
let spec = fs.readFileSync(specPath, 'utf8');
const idParameter = [
  '        - in: path',
  '          name: id',
  '          required: true',
  '          schema:',
  '            type: string',
].join('\n');
const versionParameter = [
  '        - in: query',
  '          name: v',
  '          required: false',
  '          schema:',
  '            type: string',
].join('\n');
if (!spec.includes(versionParameter)) {
  if (!spec.includes(idParameter)) throw new Error('Theme stylesheet id parameter not found in OpenAPI spec');
  spec = spec.replace(idParameter, idParameter + '\n' + versionParameter);
  fs.writeFileSync(specPath, spec, 'utf8');
}
const documentPath = '/app/.next/server/pages/_document.js';
const oldHref = 'href:"/api/v1/interface-themes/seerrng-classic/theme.css"';
const newHref = 'href:"/api/v1/interface-themes/seerrng-classic/theme.css?v=1.0.7"';
let document = fs.readFileSync(documentPath, 'utf8');
if (!document.includes(newHref)) {
  if (!document.includes(oldHref)) throw new Error('Theme stylesheet link not found in compiled document');
  document = document.replace(oldHref, newHref);
  fs.writeFileSync(documentPath, document, 'utf8');
}
console.log('Applied homepage carousel sizing, cache busting, and OpenAPI query parameter.');
