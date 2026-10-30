const fs = require('node:fs');
const source = '/tmp/quiet-cinema.css';
const target = '/app/dist/interface-themes/seerrng-classic/theme.css';
const css = fs.readFileSync(source, 'utf8');
for (const required of ['Quiet Cinema', '.media-detail-card', '.cards-vertical', '@media (max-width: 767px)', '@media (prefers-reduced-motion: reduce)']) {
  if (!css.includes(required)) throw new Error('Missing required theme section: ' + required);
}
if ((css.match(/{/g) || []).length !== (css.match(/}/g) || []).length) throw new Error('Unbalanced CSS blocks');
fs.writeFileSync(target, css, 'utf8');
const documentPath = '/app/.next/server/pages/_document.js';
let document = fs.readFileSync(documentPath, 'utf8');
const oldUrl = 'theme.css?v=1.1.1';
const newUrl = 'theme.css?v=1.2.0';
if (!document.includes(newUrl)) {
  if (!document.includes(oldUrl)) throw new Error('Theme stylesheet URL not found in compiled document');
  document = document.replace(oldUrl, newUrl);
  fs.writeFileSync(documentPath, document, 'utf8');
}
console.log('Installed Quiet Cinema theme (' + css.length + ' bytes).');
