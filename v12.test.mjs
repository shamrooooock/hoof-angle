import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {dictionaries,chooseLanguage,translate,estimateKey} from './i18n.mjs';
import {filename,safePart,localDate,wrapText} from './export.mjs';
import {setupUpdates} from './updates.mjs';
test('dictionary completeness and initial language preferences',()=>{
 for(const lang of ['en','de'])assert.deepEqual(Object.keys(dictionaries[lang]).sort(),Object.keys(dictionaries.ja).sort());
 assert.equal(chooseLanguage('de',['ja-JP']),'de');assert.equal(chooseLanguage(null,['fr-FR']),'en');assert.equal(chooseLanguage(null,['de-AT']),'de');
 const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
 for(const [,key] of html.matchAll(/data-i18n(?:-aria|-placeholder)?="([^"]+)"/g))for(const lang of ['ja','en','de'])assert.ok(dictionaries[lang][key],lang+':'+key);
});
test('limbs and multilingual safe filenames',()=>{
 for(const limb of ['RF','LF','RH','LH'])assert.equal(estimateKey(limb),limb.endsWith('H')?'estimateH':'estimateF');
 assert.equal(filename({horse:'メジャーダンディー',limb:'RF',date:'2026-10-27'},'ja'),'メジャーダンディー_右前_2026-10-27.png');
 assert.equal(filename({horse:'Fürst Weiß',limb:'LH',date:'2026-10-27'},'de'),'Fürst Weiß_HL_2026-10-27.png');
 for(const lang of ['ja','en','de']){const name=filename({horse:'',limb:'RH',date:'2026-10-27'},lang);assert.ok(name.endsWith('_2026-10-27.png'));assert.ok(!/[<>:"/\\|?*\x00-\x1f]/.test(name));}
 assert.equal(safePart('CON','x'),'_CON');assert.equal(safePart('..','x'),'x');assert.equal(safePart('a/b\\c:*?<>|"','x'),'a_b_c_______');
 assert.equal(localDate(new Date(2026,9,27,0,1)),'2026-10-27');
 assert.deepEqual(wrapText({measureText:s=>({width:Array.from(s).length*10})},'日本語äöü',30),['日本語','äöü']);
});
function workerHarness(){
 const events={},stores=new Map(),deleted=[];let skips=0,claims=0,online=true;
 const cache={addAll:async reqs=>{for(const r of reqs)stores.set(r.url,{url:r.url});},match:async key=>stores.get((typeof key==='string'?key:key.url).replace('https://test/','./'))};
 const self={location:{origin:'https://test'},addEventListener:(k,v)=>events[k]=v,skipWaiting:()=>{skips++;},clients:{claim:async()=>claims++}};
 const context={self,URL,caches:{open:async()=>cache,keys:async()=>['shamrock-hoof-v1','unrelated','shamrock-hoof-20261028a'],delete:async key=>deleted.push(key)},Request:class{constructor(url,opts){this.url=url;this.cache=opts.cache;}},fetch:async req=>{if(!online)throw Error('offline');return {network:true,url:req.url};}};
 vm.runInNewContext(fs.readFileSync(new URL('./sw.js',import.meta.url),'utf8'),context);
 const lifecycle=async name=>{let promise;events[name]({waitUntil:p=>promise=p});await promise;};
 return {events,stores,deleted,lifecycle,get skips(){return skips;},get claims(){return claims;},offline:()=>online=false};
}
test('PWA installs all local assets, waits for consent, cleans only own obsolete cache',async()=>{
 const h=workerHarness();await h.lifecycle('install');assert.equal(h.skips,0);
 for(const url of h.stores.keys()){const path=url==='./'?'./index.html':url.split('?')[0];assert.ok(fs.existsSync(new URL(path,import.meta.url)),path);}
 h.events.message({data:{type:'OTHER'}});assert.equal(h.skips,0);
 h.events.message({data:{type:'ACTIVATE_UPDATE'}});assert.equal(h.skips,1);
 await h.lifecycle('activate');assert.deepEqual(h.deleted,['shamrock-hoof-v1']);assert.equal(h.claims,1);
 h.offline();for(const url of ['./?v=anything','./app.js?v=20261028a','./i18n.mjs?v=20261028a']){let response;h.events.fetch({request:{method:'GET',url:'https://test/'+url.slice(2),mode:url.startsWith('./?')?'navigate':'cors'},respondWith:p=>response=p});
 assert.equal((await response).url,url.startsWith('./?')?'./index.html':url);
 }
});
test('PWA cached navigation is available with network disabled',async()=>{const h=workerHarness();await h.lifecycle('install');h.offline();let response;h.events.fetch({request:{url:'https://test/index.html',method:'GET',mode:'navigate'},respondWith:p=>response=p});assert.equal((await response).url,'./index.html');});
test('update UI: cancel preserves state; consent activates once; other tabs never force reload',async()=>{
 const events={},els={updateNotice:{hidden:true},applyUpdate:{},updateStatus:{}},sent=[];let reloads=0,confirm=false,restored=null;
 const storage=new Map();const worker={postMessage:m=>sent.push(m)},reg={waiting:worker,active:{},addEventListener(){},update:async()=>{}};
 const saved={navigator:globalThis.navigator,document:globalThis.document,window:globalThis.window,location:globalThis.location,sessionStorage:globalThis.sessionStorage};
 Object.defineProperty(globalThis,'navigator',{value:{serviceWorker:{addEventListener:(k,f)=>events[k]=f,register:async()=>reg,ready:Promise.resolve()}},configurable:true});
 globalThis.document={getElementById:id=>els[id],addEventListener(){}};globalThis.window={confirm:()=>confirm,addEventListener(){}};globalThis.location={reload:()=>reloads++};globalThis.sessionStorage={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
 try{
 setupUpdates({t:k=>k,setOffline(){},hasWork:()=>true,getMetadata:()=>({horse:'Ä日本',date:'2026-10-27'}),restoreMetadata:d=>restored=d});
 await new Promise(resolve=>setImmediate(resolve));assert.equal(els.updateNotice.hidden,false);
 events.controllerchange();assert.equal(reloads,0);els.applyUpdate.onclick();assert.equal(sent.length,0);
 confirm=true;els.applyUpdate.onclick();assert.equal(sent.length,1);events.controllerchange();events.controllerchange();assert.equal(reloads,1);assert.ok(storage.has('hoof-update-metadata'));
 }finally{for(const [k,v]of Object.entries(saved))Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});}
});

