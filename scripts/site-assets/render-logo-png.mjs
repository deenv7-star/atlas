import sharp from 'sharp'; import fs from 'node:fs';
let svg = fs.readFileSync(process.argv[2],'utf8').replace(/fill="#1B2656"/g,'fill="#202334"');
const h=316, w=Math.round(h*2203.3/726.9);
const mark = await sharp(Buffer.from(svg),{density:600}).resize(w,h,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
const out = await sharp({create:{width:1720,height:322,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:mark,left:Math.round((1720-w)/2),top:3}]).png().toBuffer();
for (const f of ['atlas-logo','atlas-logo-clean','atlas-logo-final','atlas-logo-source','atlas-logo-transparent']) fs.writeFileSync(`public/${f}.png`, out);
console.log('ok', w, h);
