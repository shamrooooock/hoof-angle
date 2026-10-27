export function measure(a,b){if(!a||!b||![a.x,a.y,b.x,b.y].every(Number.isFinite))return null;const dx=Math.abs(b.x-a.x),dy=Math.abs(a.y-b.y);if(Math.hypot(dx,dy)<1)return null;const angle=Math.atan2(dy,dx)*180/Math.PI;return {angle,estimate:30-angle};}
export function format(n){return (Number(n.toFixed(1))||0).toFixed(1);}
export function direction(n){return Math.abs(n)<.05?'水平（0.0°）':`${n>0?'前方':'後方'}へ ${format(Math.abs(n))}°`;}
export function toImage(p,v){return {x:(p.x-v.x)/v.scale,y:(p.y-v.y)/v.scale};}
export function toScreen(p,v){return {x:p.x*v.scale+v.x,y:p.y*v.scale+v.y};}
