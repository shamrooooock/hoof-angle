import test from 'node:test';
import assert from 'node:assert/strict';
import {measure,toImage,toScreen} from './geometry.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const fixture=[{x:100,y:100},{x:400,y:100+300*Math.tan(Math.PI/6)},{x:100,y:400},{x:400,y:400}];
test('写真と4点を一緒に360度回転しても相対角度は不変',()=>{
 for(let deg=-360;deg<=360;deg++){
  const rad=deg*Math.PI/180,ps=fixture.map(p=>({x:p.x*Math.cos(rad)-p.y*Math.sin(rad)+123,y:p.x*Math.sin(rad)+p.y*Math.cos(rad)-87}));
  near(measure(...ps).angle,30);
 }
});
test('前後交換・左右反転・垂直基準でも180度に飛ばない',()=>{
 const [a,b,c,d]=fixture;
 for(const ps of [[a,b,c,d],[b,a,c,d],[a,b,d,c],[b,a,d,c],[c,d,a,b]])near(measure(...ps).angle,30);
 near(measure(...fixture.map(p=>({x:-p.x,y:p.y}))).angle,30);
 near(measure({x:0,y:0},{x:0,y:100},{x:10,y:0},{x:10,y:100}).angle,0);
 near(measure({x:0,y:0},{x:100,y:0},{x:10,y:0},{x:10,y:100}).angle,90);
});
test('各点の移動を再計算',()=>{
 for(let i=0;i<4;i++){
  const ps=fixture.map(p=>({...p}));ps[i].y+=20;const r=measure(...ps);
  assert.notEqual(r.angle,measure(...fixture).angle);
  const u={x:ps[1].x-ps[0].x,y:ps[1].y-ps[0].y},v={x:ps[3].x-ps[2].x,y:ps[3].y-ps[2].y};
  near(r.angle,Math.acos(Math.abs(u.x*v.x+u.y*v.y)/(Math.hypot(u.x,u.y)*Math.hypot(v.x,v.y)))*180/Math.PI);
 }
});
test('欠損・非数・短すぎる線では結果を出さない',()=>{
 for(let i=0;i<4;i++)for(const bad of [null,undefined,{x:NaN,y:0},{x:0,y:Infinity}]){const ps=[...fixture];ps[i]=bad;assert.equal(measure(...ps),null);}
 assert.equal(measure(fixture[0],fixture[0],fixture[2],fixture[3]),null);
 assert.equal(measure(...fixture.slice(0,2),fixture[2],{x:100.1,y:400.1}),null);
 assert.equal(measure(...fixture.slice(0,2)),null);
});
test('4点の拡大・パン・リサイズに独立した元画像座標',()=>{
 for(const scale of [.03,.2,1,12]){const v={scale,x:-222,y:113},ps=fixture.map(p=>toImage(toScreen(p,v),v));near(measure(...ps).angle,30);}
});
