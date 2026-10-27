import {format} from './geometry.mjs?v=20261028a';
import {translate,estimateKey} from './i18n.mjs?v=20261028a';
export function localDate(date=new Date()){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');}
export function safePart(value,fallback){let s=String(value).normalize('NFC').replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g,'_').replace(/[\u202a-\u202e\u2066-\u2069]/g,'').trim().replace(/[. ]+$/g,'');s=Array.from(s).slice(0,60).join('');if(!s)s=fallback;if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(s))s='_'+s;return s;}
export function filename(info,lang){return safePart(info.horse,translate(lang,'unnamed'))+'_'+translate(lang,info.limb+'file')+'_'+(/^\d{4}-\d{2}-\d{2}$/.test(info.date)?info.date:'undated')+'.png';}
export function wrapText(ctx,text,width){const lines=[];for(const paragraph of text.split('\n')){let line='';for(const ch of Array.from(paragraph)){if(line&&ctx.measureText(line+ch).width>width){lines.push(line);line=ch;}else line+=ch;}lines.push(line);}return lines;}
// All metadata is below the photo. A minimum output width keeps long labels legible.
export async function makePNG(image,overlays,result,info,lang){
 await document.fonts.ready;
 const scale=Math.min(1,2400/Math.max(image.width,image.height));
 const iw=Math.round(image.width*scale),ih=Math.round(image.height*scale),width=Math.max(1000,iw);
 const unit=width/1000,padding=24*unit,font=24*unit,lineHeight=36*unit;
 const out=document.createElement('canvas');const ctx=out.getContext('2d');
 ctx.font=font+'px system-ui, sans-serif';
 const t=k=>translate(lang,k);
 const text=[t('app')+' · v1.2',t('horse')+': '+(info.horse.trim()||t('unnamed')),t('limb')+': '+t(info.limb),t('date')+': '+(info.date||t('dateMissing')),t('angle')+': '+format(result.angle)+'°',t(estimateKey(info.limb))+': '+format(result.estimate)+'°',t('pngFormula'),t('pngNote')];
 const lines=text.flatMap(s=>wrapText(ctx,s,width-2*padding));
 out.width=width;out.height=Math.ceil(ih+2*padding+lineHeight*lines.length);
 ctx.fillStyle='#f5f5ef';ctx.fillRect(0,0,out.width,out.height);
 const offset=(width-iw)/2;ctx.drawImage(image,offset,0,iw,ih);
 overlays(ctx,{x:offset,y:0,scale},unit);
 ctx.font=font+'px system-ui, sans-serif';ctx.textBaseline='top';ctx.textAlign='left';ctx.fillStyle='#173f35';
 lines.forEach((line,i)=>ctx.fillText(line,padding,ih+padding+i*lineHeight));
 const blob=await new Promise(resolve=>out.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG encoding failed');
 return {blob,name:filename(info,lang)};
}

