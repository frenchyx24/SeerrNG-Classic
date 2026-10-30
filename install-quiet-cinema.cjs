const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
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
// SeerrNG's UI dictionaries are JSON.parse string literals in server chunks.
// Fill missing French keys without replacing existing reviewed translations.
const overrides=JSON.parse(fs.readFileSync('/tmp/fr-overrides.json','utf8'));
const chunks='/app/.next/server/chunks';
let patchedChunk=null,added=0;
for(const name of fs.readdirSync(chunks).filter(name=>name.endsWith('.js'))){
  const file=path.join(chunks,name);
  let source=fs.readFileSync(file,'utf8');
  if(!source.includes('components.MovieDetails.Layout.overview')) continue;
  let cursor=0,changed=false;
  while((cursor=source.indexOf('JSON.parse(',cursor))!==-1){
    const quoteStart=cursor+'JSON.parse('.length;
    const quote=source[quoteStart];
    if(quote!=='\'' && quote!=='"'){cursor=quoteStart;continue;}
    let end=quoteStart+1,escaped=false;
    for(;end<source.length;end++){
      const ch=source[end];
      if(escaped){escaped=false;continue;}
      if(ch==='\\'){escaped=true;continue;}
      if(ch===quote) break;
    }
    if(end>=source.length) break;
    const literal=source.slice(quoteStart,end+1);
    let messages;
    try{messages=JSON.parse(vm.runInNewContext(literal));}catch{cursor=end+1;continue;}
    if(messages && messages['components.MovieDetails.Layout.overview']==='Résumé'){
      for(const [key,value] of Object.entries(overrides)) if(!(key in messages)){messages[key]=value;added++;}
      const replacement='JSON.parse('+JSON.stringify(JSON.stringify(messages))+')';
      source=source.slice(0,cursor)+replacement+source.slice(end+2);
      changed=true;patchedChunk=name;break;
    }
    cursor=end+1;
  }
  if(changed){fs.writeFileSync(file,source,'utf8');break;}
}
if(!patchedChunk || added<1000) throw Error('Could not patch the French UI dictionary (found '+added+' missing keys)');
// Also complete the three notification strings kept in the separate backend catalog.
const notificationFile='/app/dist/i18n/locale/fr.json';
const notifications=JSON.parse(fs.readFileSync(notificationFile,'utf8'));
Object.assign(notifications,{
  'notifications.agents.email.availabilitySubscription':'Votre abonnement de disponibilité pour {mediaType} a été mis à jour :',
  'notifications.agents.webpush.availabilitySubscription':'Votre abonnement de disponibilité pour {mediaType} a été mis à jour.',
  'notifications.common.adult':'contenu pour adultes',
});
fs.writeFileSync(notificationFile,JSON.stringify(notifications,null,2)+'\n','utf8');
console.log('Installed Quiet Cinema 1.6; French UI dictionary completed ('+added+' strings in '+patchedChunk+'); TV SSR timeout 15s.');
