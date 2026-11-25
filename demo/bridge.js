'use strict';
(()=>{
 window.fotoboxPreviewMode=true;window.remoteMode=new URLSearchParams(location.search).has('mobile');
 if(window.remoteMode){document.documentElement.classList.add('remote');const css=document.createElement('link');css.rel='stylesheet';css.href='remote.css';document.head.append(css);window.remoteLogout=async()=>location.reload();}
 let settings,defaults,revision=1;const listeners=[],profiles=new Map();
 const fixture=fetch('demo/model.json?v=background-20261125').then(r=>r.json()).then(d=>window.demoLoad?window.demoLoad(d):d).then(data=>{settings=data;defaults=structuredClone(data);profiles.set(settings.ActiveEvent,structuredClone(settings));});
 const emit=d=>setTimeout(()=>listeners.forEach(fn=>fn({data:{...d,revision}})),0);
 const model=()=>({type:'model',settings,defaults,eventPreviews:Object.fromEntries(settings.Events.map(e=>[e.Id,{PhotoCount:0,BackgroundColor:settings.BackgroundColor,ShowSingle:settings.ShowSingle,ShowCollage:settings.ShowCollage,ShowGallery:settings.ShowGallery}])),eventHealth:{FreeBytes:0,MissingAssets:[]},fonts:['Segoe UI','Arial','Georgia','Verdana'],revisions:[],cameraReady:false,runtime:{camera:'Demo ohne Kamera',kioskOpen:false,captureBusy:false,photoCount:0,history:[]},access:{urls:[],status:'Lokale Entwurfsvorschau',pinConfigured:false},latestPhoto:'261116_184200.jpg',display:{width:1920,height:1080}});
 async function post(m){await fixture;try{
  if(m.cmd==='ready'||m.cmd==='refreshHealth'){emit(model());return;}
  if(m.settings){settings={...m.settings,Events:settings.Events,ActiveEvent:settings.ActiveEvent};profiles.set(settings.ActiveEvent,structuredClone(settings));}revision++;
  if(m.cmd==='save'){emit({type:'saved'});return;}
  if(m.cmd==='create'){const id=crypto.randomUUID(),events=[...settings.Events,{Id:id,Name:m.name||'Demo-Event',Date:'',Client:'',Venue:'',IsPlaceholder:false}];settings={...(m.duplicate?settings:defaults),ActiveEvent:id,Events:events};profiles.set(id,structuredClone(settings));emit(model());return;}
  if(m.cmd==='switch'){const events=settings.Events;settings={...(profiles.get(m.id)||defaults),Events:events,ActiveEvent:m.id};emit(model());return;}
  if(m.cmd==='rename'){settings.Events=settings.Events.map(e=>e.Id===settings.ActiveEvent?{...e,Name:m.name}:e);emit(model());return;}
  if(m.cmd==='deleteEvent'){if(settings.Events.length<2)throw Error('In der Demo bleibt mindestens ein Event bestehen.');settings.Events=settings.Events.filter(e=>e.Id!==m.id);if(settings.ActiveEvent===m.id)settings.ActiveEvent=settings.Events[0].Id;emit(model());return;}
  if(m.cmd==='resetEvent'){settings={...structuredClone(defaults),Events:settings.Events,ActiveEvent:settings.ActiveEvent};emit(model());return;}
  if(m.cmd==='cameraOptions'){emit({type:'cameraOptions',camera:{settings:{UseExposureProfiles:true,Preview:{Iso:104,Aperture:43,Shutter:96,AutoAperture:true},Photo:{Iso:88,Aperture:61,Shutter:117,AutoAperture:false},FocusMode:0,WhiteBalance:0,ColorTemperature:5200},whiteBalance:[{Code:0,Label:'Automatisch'},{Code:1,Label:'Tageslicht'},{Code:8,Label:'Schatten'},{Code:2,Label:'Bewölkt'},{Code:3,Label:'Kunstlicht (Glühlampe)'},{Code:4,Label:'Leuchtstofflampe'},{Code:5,Label:'Blitz'},{Code:6,Label:'Manuell (an der Kamera gemessen)'},{Code:9,Label:'Farbtemperatur (Kelvin)'}],iso:[{Code:88,Label:'400'},{Code:104,Label:'1600'}],aperture:[{Code:43,Label:'f/4,5'},{Code:61,Label:'f/10'}],shutter:[{Code:96,Label:'1/30 s'},{Code:117,Label:'1/200 s'}],status:'Simuliert · keine Kamera'}});return;}
  emit({type:'notice',message:'Diese Funktion bitte in der Windows-App prüfen. Die Browservorschau verändert keine echten Daten.'});
 }catch(e){emit({type:'error',message:e.message});}}
 window.chrome={webview:{postMessage:post,addEventListener:(name,fn)=>{if(name==='message')listeners.push(fn);}}};
 document.addEventListener('DOMContentLoaded',()=>{const badge=document.createElement('div');badge.textContent='Web-Demo · simulierte Daten';badge.style.cssText='position:fixed;bottom:66px;right:12px;z-index:10000;background:#252c32;color:#d4e1ea;border:1px solid #64727d;padding:5px 9px;border-radius:5px;font:12px sans-serif;pointer-events:none';document.body.append(badge);});
})();
