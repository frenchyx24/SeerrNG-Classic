const fs = require('node:fs');
const source = '/tmp/quiet-cinema.css';
const target = '/app/dist/interface-themes/seerrng-classic/theme.css';
const css = fs.readFileSync(source, 'utf8');
for (const required of ['Quiet Cinema 1.3', '.media-detail-card', '.cards-vertical', 'button', '@media (max-width:767px)', '@media (prefers-reduced-motion:reduce)']) {
  if (!css.includes(required)) throw new Error('Missing required theme section: ' + required);
}
if ((css.match(/{/g) || []).length !== (css.match(/}/g) || []).length) throw new Error('Unbalanced CSS blocks');
fs.writeFileSync(target, css, 'utf8');
const documentPath = '/app/.next/server/pages/_document.js';
let document = fs.readFileSync(documentPath, 'utf8');
const oldUrls = ['theme.css?v=1.2.0', 'theme.css?v=1.1.1'];
const newUrl = 'theme.css?v=1.3.0';
if (!document.includes(newUrl)) {
  const oldUrl = oldUrls.find((url) => document.includes(url));
  if (!oldUrl) throw new Error('Theme stylesheet URL not found in compiled document');
  document = document.replace(oldUrl, newUrl);
  fs.writeFileSync(documentPath, document, 'utf8');
}
console.log('Installed Quiet Cinema 1.3 (' + css.length + ' bytes).');
