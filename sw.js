const CACHE='shamrock-hoof-20261028a';
const FILES=['./','./index.html','./style.css?v=20261028a','./app.js?v=20261028a','./geometry.mjs?v=20261028a','./i18n.mjs?v=20261028a','./export.mjs?v=20261028a','./updates.mjs?v=20261028a','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{
 // Fetch from network without the HTTP cache. Do not activate over a working session.
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(url=>new Request(url,{cache:'reload'})))));
});
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('shamrock-hoof-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
 // Pin an active page to this release. register().update() detects new releases independently.
 if(request.mode==='navigate'){event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match('./index.html'))||fetch(request)));return;}
 event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(request))||fetch(request)));
});

