import test from 'node:test';import assert from 'node:assert/strict';import {measure,format,toImage,toScreen,direction} from './geometry.mjs';
test('左右向き・符号・暫定式',()=>{for(const deg of [-35,-5,0,24,25,30,35,90])for(const sign of [-1,1]){const rad=deg*Math.PI/180,a={x:500,y:500},b={x:500+sign*100*Math.cos(rad),y:500-100*Math.sin(rad)},r=measure(a,b);assert.ok(Math.abs(r.angle-deg)<1e-10);assert.ok(Math.abs(r.estimate-(30-deg))<1e-10);}});
test('無効点・重複',()=>{assert.equal(measure(null,{x:0,y:0}),null);assert.equal(measure({x:0,y:0},{x:.1,y:.1}),null);assert.equal(measure({x:NaN,y:0},{x:10,y:0}),null);});
test('拡大・パン・リサイズに独立した座標',()=>{const a={x:73.4,y:801.9},b={x:976,y:345};for(const scale of [.03,.2,1,12]){const v={scale,x:-222,y:113};for(const p of [a,b]){const q=toImage(toScreen(p,v),v);assert.ok(Math.abs(q.x-p.x)<1e-9);assert.ok(Math.abs(q.y-p.y)<1e-9);}assert.ok(Math.abs(measure(toImage(toScreen(a,v),v),toImage(toScreen(b,v),v)).angle-measure(a,b).angle)<1e-9);}});
test('表示丸め・方向',()=>{assert.equal(format(-.001),'0.0');assert.equal(direction(0),'水平（0.0°）');assert.equal(direction(-5),'後方へ 5.0°');});

