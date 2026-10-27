export function setupUpdates({t,setOffline,hasWork,getMetadata,restoreMetadata}){
 const banner=document.getElementById('updateNotice'),button=document.getElementById('applyUpdate'),status=document.getElementById('updateStatus');
 try{const raw=sessionStorage.getItem('hoof-update-metadata');if(raw){sessionStorage.removeItem('hoof-update-metadata');restoreMetadata(JSON.parse(raw));}}catch{}
 if(!('serviceWorker' in navigator)){setOffline('offlineUnsupported');return;}
 let registration=null,approved=false,reloaded=false,timer=null;
 const offer=()=>{if(registration?.waiting){banner.hidden=false;button.disabled=false;button.textContent=t('update');}};
 navigator.serviceWorker.addEventListener('controllerchange',()=>{
  // No surprise reload in this tab or in another open measurement tab.
  if(approved&&!reloaded){reloaded=true;clearTimeout(timer);location.reload();}
 });
 button.onclick=()=>{
  if(!registration?.waiting){registration?.update().catch(()=>{});return;}
  if(hasWork()&&!window.confirm(t('updateConfirm')))return;
  try{sessionStorage.setItem('hoof-update-metadata',JSON.stringify(getMetadata()));}catch{}
  approved=true;button.disabled=true;status.textContent=t('updating');
  registration.waiting.postMessage({type:'ACTIVATE_UPDATE'});
  timer=setTimeout(()=>{if(!reloaded){approved=false;button.disabled=false;status.textContent=t('updateError');}},15000);
 };
 navigator.serviceWorker.register('./sw.js?v=20261028a',{updateViaCache:'none'}).then(reg=>{
  registration=reg;offer();
  const observe=worker=>{if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='installed')offer();if(worker.state==='activated')setOffline('offlineReady');if(worker.state==='redundant'&&!reg.active)setOffline('offlineError');});};
  observe(reg.installing);reg.addEventListener('updatefound',()=>observe(reg.installing));
  navigator.serviceWorker.ready.then(()=>setOffline('offlineReady'));
  const check=()=>reg.update().then(offer).catch(()=>{if(!reg.active)setOffline('offlineError');});
  check();window.addEventListener('online',check);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check();});
 }).catch(()=>setOffline('offlineError'));
}

