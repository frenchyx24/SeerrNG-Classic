const fs=require('node:fs');
const src='/tmp/quiet-cinema.css';
const dst='/app/dist/interface-themes/seerrng-classic/theme.css';
const css=fs.readFileSync(src,'utf8');
for(const x of ['Quiet Cinema 1.6','.media-detail-card','.cards-horizontal','type-slot','Title View','association-badge','media-detail-artwork-layer']) if(!css.includes(x)) throw Error('Missing theme section '+x);
if((css.match(/{/g)||[]).length!==(css.match(/}/g)||[]).length) throw Error('Unbalanced CSS');
fs.writeFileSync(dst,css,'utf8');
// TV SSR calls the local API; retain a bounded 15s timeout for cold metadata loads.
const page='/app/.next/server/pages/tv/[tvId].js';
const old='timeout:5e3,maxContentLength:0x1000000,maxBodyLength:1048576';
const replacement='timeout:15e3,maxContentLength:0x1000000,maxBodyLength:1048576';
let bundle=fs.readFileSync(page,'utf8');
const count=bundle.split(old).length-1;
if(count===1) bundle=bundle.replace(old,replacement);
else if(count!==0 || !bundle.includes(replacement)) throw Error('Expected one TV internal API timeout, found '+count);
fs.writeFileSync(page,bundle,'utf8');
const documentPath='/app/.next/server/pages/_document.js';
let document=fs.readFileSync(documentPath,'utf8');
if(!document.includes('theme.css?v=1.6.0')) {
  if(!document.includes('theme.css?v=1.4.0')) throw Error('Theme stylesheet URL not found');
  document=document.replace('theme.css?v=1.4.0','theme.css?v=1.6.0');
  fs.writeFileSync(documentPath,document,'utf8');
}
console.log('Installed Quiet Cinema 1.6; TV SSR timeout 15s.');
