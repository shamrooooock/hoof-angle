import {measure,format,toImage,toScreen} from './geometry.mjs?v=20261028a';
import {chooseLanguage,translate,estimateKey} from './i18n.mjs?v=20261028a';
import {localDate,makePNG} from './export.mjs?v=20261028a';
import {setupUpdates} from './updates.mjs?v=20261028a';
const $=id=>document.getElementById(id),canvas=$('canvas'),ctx=canvas.getContext('2d'),vp=$('viewport');
let image=null,points=[null,null],selected=0,view={x:0,y:0,scale:1},baseScale=1,w=0,h=0,loadId=0,exportURL=null;
const pointers=new Map();let gesture=null;
let savedLanguage=null,savedTheme='system';
try{savedLanguage=localStorage.getItem('hoof-language');savedTheme=localStorage.getItem('hoof-theme')||'system';}catch{}
let lang=chooseLanguage(savedLanguage,navigator.languages||[navigator.language]),messageKey=null,offlineKey='offlinePreparing',fileName='';
const t=(key,params)=>translate(lang,key,params);
const info=()=>({horse:$('horse').value,limb:$('limb').value,date:$('photoDate').value});
$('photoDate').value=localDate();
$('language').value=lang;
function applyTheme(){document.documentElement.dataset.theme=$('theme').value;}
$('theme').value=['system','light','dark'].includes(savedTheme)?savedTheme:'system';applyTheme();
$('theme').onchange=()=>{applyTheme();try{localStorage.setItem('hoof-theme',$('theme').value);}catch{}};
function direction(n){return Math.abs(n)<.05?t('level'):t(n>0?'forward':'backward',{n:format(Math.abs(n))});}
function translateUI(){
 document.documentElement.lang=lang;document.title=t('app')+' | '+t('club');
 document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));
 document.querySelectorAll('[data-i18n-aria]').forEach(el=>el.setAttribute('aria-label',t(el.dataset.i18nAria)));
 document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>el.placeholder=t(el.dataset.i18nPlaceholder));
 $('fileName').textContent=fileName||t('noPhoto');$('offline').textContent=t(offlineKey);update();
}
$('language').onchange=()=>{lang=$('language').value;try{localStorage.setItem('hoof-language',lang);}catch{}translateUI();};
['horse','limb','photoDate'].forEach(id=>$(id).addEventListener('input',()=>update()));

function result(){return measure(...points);}
function fit(){if(!image)return;baseScale=Math.min(w/image.width,h/image.height);view={scale:baseScale,x:(w-image.width*baseScale)/2,y:(h-image.height*baseScale)/2};draw();}
function resize(){const oldW=w,oldH=h;w=vp.clientWidth;h=vp.clientHeight;const dpr=devicePixelRatio||1;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);if(image){if(!oldW)fit();else{const center=toImage({x:oldW/2,y:oldH/2},view);const nextBase=Math.min(w/image.width,h/image.height);view.scale*=nextBase/baseScale;baseScale=nextBase;view.x=w/2-center.x*view.scale;view.y=h/2-center.y*view.scale;}}draw();}
function overlays(c,v,unit=1){
 const a=points[0]&&toScreen(points[0],v),b=points[1]&&toScreen(points[1],v),r=result();
 c.save();c.lineWidth=2*unit;
 if(a&&b){c.strokeStyle='#fff';c.setLineDash([7*unit,5*unit]);c.beginPath();c.moveTo(Math.min(a.x,b.x)-30*unit,a.y);c.lineTo(Math.max(a.x,b.x)+30*unit,a.y);c.stroke();c.setLineDash([]);c.strokeStyle='#f2c15c';c.lineWidth=3*unit;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();
 if(r){const label=format(r.angle)+'°',x=(a.x+b.x)/2,y=(a.y+b.y)/2-18*unit;c.font='600 '+14*unit+'px sans-serif';const tw=c.measureText(label).width;c.fillStyle='#173f35';c.fillRect(x-tw/2-7*unit,y-15*unit,tw+14*unit,22*unit);c.fillStyle='#fff';c.textAlign='center';c.fillText(label,x,y);}}
 [a,b].forEach((p,i)=>{if(!p)return;c.fillStyle=i?'rgba(80,139,121,.35)':'rgba(219,162,57,.35)';c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=unit;c.beginPath();c.arc(p.x,p.y,9*unit,0,2*Math.PI);c.fill();c.stroke();
 c.beginPath();c.moveTo(p.x-6*unit,p.y);c.lineTo(p.x+6*unit,p.y);c.moveTo(p.x,p.y-6*unit);c.lineTo(p.x,p.y+6*unit);c.strokeStyle='#101010';c.lineWidth=3*unit;c.stroke();c.strokeStyle='#fff';c.lineWidth=unit;c.stroke();c.font='bold '+13*unit+'px sans-serif';c.textAlign='center';c.textBaseline='middle';c.lineWidth=4*unit;c.strokeStyle='#173f35';c.strokeText(i?'B':'A',p.x,p.y-22*unit);c.fillStyle='#fff';c.fillText(i?'B':'A',p.x,p.y-22*unit);});c.restore();
}
function draw(){ctx.clearRect(0,0,w,h);if(!image)return;ctx.drawImage(image,view.x,view.y,image.width*view.scale,image.height*view.scale);overlays(ctx,view);$('zoomBadge').textContent=Math.round(view.scale/baseScale*100)+'%';}
function update(){const r=result();$('angle').textContent=r?format(r.angle):'—';$('estimate').textContent=r?format(r.estimate):'—';$('estimateLabel').textContent=t(estimateKey($('limb').value));$('direction').textContent=r?direction(r.estimate):t('pending');$('save').disabled=!r;
 ['A','B'].forEach((s,i)=>{$('state'+s).textContent=t(points[i]?'set':'unset');$('select'+s).classList.toggle('selected',selected===i);});
 $('status').textContent=t(messageKey||(!image?'needPhoto':points[0]&&points[1]?r?'ready':'tooClose':selected===0?'setA':'setB'));
 [1,2,3].forEach(n=>$('step'+n).classList.toggle('active',n===(r?3:image?2:1)));
 if(exportURL){URL.revokeObjectURL(exportURL);exportURL=null;$('download').hidden=true;}draw();
}
function clamp(p){return {x:Math.max(0,Math.min(image.width,p.x)),y:Math.max(0,Math.min(image.height,p.y))};}
function inside(p){return p.x>=0&&p.y>=0&&p.x<=image.width&&p.y<=image.height;}
function pos(e){const b=canvas.getBoundingClientRect();return {x:e.clientX-b.left,y:e.clientY-b.top};}
function zoom(factor,anchor={x:w/2,y:h/2}){if(!image)return;const p=toImage(anchor,view);view.scale=Math.max(baseScale,Math.min(baseScale*12,view.scale*factor));view.x=anchor.x-p.x*view.scale;view.y=anchor.y-p.y*view.scale;draw();}
canvas.addEventListener('pointerdown',e=>{if(!image)return;messageKey=null;e.preventDefault();canvas.setPointerCapture(e.pointerId);const p=pos(e);pointers.set(e.pointerId,p);if(pointers.size===2){const [a,b]=[...pointers.values()],mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};gesture={kind:'pinch',distance:Math.hypot(b.x-a.x,b.y-a.y),scale:view.scale,anchor:toImage(mid,view)};return;}if(pointers.size>2)return;const hit=points.findIndex(q=>q&&Math.hypot(toScreen(q,view).x-p.x,toScreen(q,view).y-p.y)<26);if(hit>=0){selected=hit;gesture={kind:'drag',start:p,index:hit,original:{...points[hit]}};update();}else gesture={kind:'tap',start:p,last:p};});
canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId)||!gesture)return;const p=pos(e);pointers.set(e.pointerId,p);if(gesture.kind==='pinch'&&pointers.size>=2){const [a,b]=[...pointers.values()],mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};view.scale=Math.max(baseScale,Math.min(baseScale*12,gesture.scale*Math.hypot(b.x-a.x,b.y-a.y)/Math.max(gesture.distance,1)));view.x=mid.x-gesture.anchor.x*view.scale;view.y=mid.y-gesture.anchor.y*view.scale;draw();}else if(gesture.kind==='drag'){const d=gesture;points[d.index]=clamp({x:d.original.x+(p.x-d.start.x)/view.scale,y:d.original.y+(p.y-d.start.y)/view.scale});update();}else if(gesture.kind==='tap'||gesture.kind==='pan'){if(Math.hypot(p.x-gesture.start.x,p.y-gesture.start.y)>7)gesture.kind='pan';if(gesture.kind==='pan'){view.x+=p.x-gesture.last.x;view.y+=p.y-gesture.last.y;draw();}gesture.last=p;}});
function end(e){if(!pointers.has(e.pointerId))return;if(e.type==='pointerup'&&gesture?.kind==='tap'&&pointers.size===1){const p=toImage(pos(e),view);if(inside(p)){points[selected]=p;if(!points[1-selected])selected=1-selected;update();}}pointers.delete(e.pointerId);gesture=null;}
canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('lostpointercapture',end);
canvas.addEventListener('wheel',e=>{if(image){e.preventDefault();zoom(Math.exp(-e.deltaY*.002),pos(e));}},{passive:false});
canvas.addEventListener('keydown',e=>{if(!image||!points[selected])return;const moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]},d=moves[e.key];if(d){e.preventDefault();points[selected]=clamp({x:points[selected].x+d[0]*(e.shiftKey?10:1),y:points[selected].y+d[1]*(e.shiftKey?10:1)});update();}});
async function decode(file){if('createImageBitmap' in window){try{return await createImageBitmap(file,{imageOrientation:'from-image'});}catch{}}const url=URL.createObjectURL(file);try{const img=new Image();img.src=url;await img.decode();return img;}finally{URL.revokeObjectURL(url);}}
async function load(file){if(!file)return;const id=++loadId;messageKey='loading';update();try{const next=await decode(file);if(id!==loadId){next.close?.();return;}const width=next.width||next.naturalWidth,height=next.height||next.naturalHeight;if(!width||!height)throw Error();image?.close?.();image=next;points=[null,null];selected=0;pointers.clear();gesture=null;$('empty').hidden=true;$('zoomBadge').hidden=false;fileName=file.name;$('fileName').textContent=fileName;messageKey=null;['zoomOut','zoomIn','fit','reset','selectA','selectB'].forEach(s=>$(s).disabled=false);fit();update();}catch{if(id===loadId){messageKey='loadError';update();}}}
['file','capture'].forEach(id=>$(id).addEventListener('change',e=>{load(e.target.files[0]);e.target.value='';}));
$('emptyPick').onclick=$('pick').onclick=()=>$('file').click();$('camera').onclick=()=>$('capture').click();
$('reset').onclick=()=>{points=[null,null];selected=0;messageKey=null;update();};$('fit').onclick=fit;$('zoomIn').onclick=()=>zoom(1.4);$('zoomOut').onclick=()=>zoom(1/1.4);
['A','B'].forEach((s,i)=>$('select'+s).onclick=()=>{selected=i;update();canvas.focus({preventScroll:true});});
$('save').onclick=async()=>{
 const r=result();if(!r)return;$('save').disabled=true;
 try{
  const snapshot=info(),exportLang=lang;
  // Snapshot the rendered photo and overlays before awaiting fonts/encoding.
  const src=document.createElement('canvas');src.width=image.width;src.height=image.height;src.getContext('2d').drawImage(image,0,0);
  const overlay=document.createElement('canvas');overlay.width=Math.max(1000,Math.round(image.width*Math.min(1,2400/Math.max(image.width,image.height))));overlay.height=Math.round(image.height*Math.min(1,2400/Math.max(image.width,image.height)));
  const exportScale=Math.min(1,2400/Math.max(image.width,image.height));
  overlays(overlay.getContext('2d'),{x:(overlay.width-image.width*exportScale)/2,y:0,scale:exportScale},overlay.width/1000);
  const output=await makePNG(src,(c)=>c.drawImage(overlay,0,0),r,snapshot,exportLang);
  if(exportURL)URL.revokeObjectURL(exportURL);exportURL=URL.createObjectURL(output.blob);
  const link=$('download');link.href=exportURL;link.download=output.name;link.hidden=false;link.click();
  messageKey='saved';$('status').textContent=t(messageKey);
 }catch{messageKey='saveError';$('status').textContent=t(messageKey);}finally{$('save').disabled=!result();}
};
new ResizeObserver(resize).observe(vp);translateUI();
setupUpdates({t,setOffline:key=>{offlineKey=key;$('offline').textContent=t(key);},hasWork:()=>Boolean(image||$('horse').value),getMetadata:()=>({...info(),lang}),restoreMetadata:data=>{if(data){$('horse').value=data.horse||'';$('limb').value=['RF','LF','RH','LH'].includes(data.limb)?data.limb:'RF';$('photoDate').value=data.date||localDate();}update();}});
