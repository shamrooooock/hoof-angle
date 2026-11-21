// Image Y points down. Compare undirected lines, retaining the legacy 0–90° magnitude.
export function measure(a,b,c,d){
 if(![a,b,c,d].every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)))return null;
 if(Math.hypot(b.x-a.x,b.y-a.y)<1||Math.hypot(d.x-c.x,d.y-c.y)<1)return null;
 const coronet=Math.atan2(a.y-b.y,b.x-a.x),ground=Math.atan2(c.y-d.y,d.x-c.x);
 const delta=coronet-ground;
 const angle=Math.atan2(Math.abs(Math.sin(delta)),Math.abs(Math.cos(delta)))*180/Math.PI;
 return {angle,estimate:30-angle};
}
export function format(n){return (Number(n.toFixed(1))||0).toFixed(1);}
export function direction(n){return Math.abs(n)<.05?'水平（0.0°）':`${n>0?'前方':'後方'}へ ${format(Math.abs(n))}°`;}
export function toImage(p,v){return {x:(p.x-v.x)/v.scale,y:(p.y-v.y)/v.scale};}
export function toScreen(p,v){return {x:p.x*v.scale+v.x,y:p.y*v.scale+v.y};}
