'use strict';
/* Web-Demo · Kiosk: steuert den Gästeablauf im Browser ohne Windows-App.
   Nutzt den eingebauten Vorschaumodus des Kiosks (kiosk.html?editor) mit Beispielbildern.
   Optional liefert die Webcam des Vorführrechners Livebild und Fotos. Nichts verlässt den Browser. */
(()=>{
 if(window.top!==window||!location.search.includes('editor'))return;
 const KEY='solidbooth-demo-settings',params=new URLSearchParams(location.search);
 let stream=null,lastSnap=null,snapCount=0;const snaps=[];

 async function loadSettings(){
  try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object'&&Array.isArray(s.Events))return s;}catch{}
  return (await fetch('demo/model.json')).json();
 }
 const show=s=>window.postMessage({type:'preview',settings:s,page:'home',interactive:true,test:true,nonce:Date.now()},location.origin);
 /* Direkt starten: Die Bereitmeldung des Kiosks kann schon vor diesem Skript eingetroffen sein. */
 loadSettings().then(show).catch(()=>{});
 /* Änderungen aus der Einrichtung (anderer Tab) sofort übernehmen. */
 window.addEventListener('storage',e=>{if(e.key!==KEY||!e.newValue)return;try{show(JSON.parse(e.newValue));}catch{}});

 /* Echter QR-Code: führt zur Demo-Downloadseite. Fotos aus der Webcam bleiben auf diesem Rechner. */
 const downloadUrl=()=>new URL('download.html?code=DEMO'+String(1000+snapCount).slice(-3),location.href).href;
 function qrImage(text){
  if(typeof qrcode!=='function')return null;
  const q=qrcode(0,'M');q.addData(text);q.make();
  const n=q.getModuleCount(),cell=8,pad=4*cell,size=n*cell+pad*2;let path='';
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))path+=`M${pad+c*cell} ${pad+r*cell}h${cell}v${cell}h-${cell}z`;
  return 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="#fff"/><path d="${path}" fill="#000"/></svg>`);
 }
 const originalShare=window.previewShare;
 window.previewShare=function(){const url=downloadUrl(),qr=qrImage(url);if(!qr)return originalShare();share({qr,wifi:null,url:new URL(url).origin+'/'+new URL(url).searchParams.get('code'),isPublic:true});};

 /* Webcam als Demo-Kamera: Livebild gespiegelt wie ein Selfie, Foto seitenrichtig wie bei der echten Kamera. */
 const originalLive=window.live;
 window.live=function(){if(!stream)return originalLive();return '<video class="live-background demo-live mirror" autoplay muted playsinline></video>';};
 new MutationObserver(()=>document.querySelectorAll('video.demo-live').forEach(v=>{if(v.srcObject!==stream){v.srcObject=stream;v.style.visibility='visible';v.play().catch(()=>{});}})).observe(document.getElementById('stage'),{childList:true,subtree:true});
 function snap(){
  const v=document.querySelector('video.demo-live');if(!v||!v.videoWidth)return null;
  const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;const g=c.getContext('2d');
  g.drawImage(v,0,0);return c.toDataURL('image/jpeg',.9);
 }
 /* Vorschau-Leinwände auf Aufnahme- und Ergebnisseite zeigen nach einer Webcam-Aufnahme das echte Foto. */
 const src=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
 const useSnap=v=>lastSnap&&(page==='result'||page==='capture')&&/(^|\/)(?:(photo-)?sample\.svg|sample-photo\.png)$/.test(String(v));
 Object.defineProperty(HTMLImageElement.prototype,'src',{configurable:true,enumerable:src.enumerable,get(){return src.get.call(this);},set(v){src.set.call(this,useSnap(v)?lastSnap:v);}});
 const loadImage=url=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);src.set.call(i,url);});
 /* Collage aus den Webcam-Fotos nach der gewählten Collagevorlage zusammensetzen. */
 async function compose(shots){
  const t=layouts()[previewLayout]||settings.Layout,w=t.Width||1800,h=t.Height||1200,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
  g.fillStyle=t.Background||'#fff';g.fillRect(0,0,w,h);
  const images=await Promise.all(shots.map(loadImage));
  (t.Slots||[]).forEach((slot,i)=>{const img=images[i%images.length];if(!img)return;const x=slot.X*w,y=slot.Y*h,sw=slot.Width*w,sh=slot.Height*h,k=Math.max(sw/img.width,sh/img.height);g.save();g.translate(x+sw/2,y+sh/2);g.rotate((slot.Rotation||0)*Math.PI/180);g.beginPath();g.rect(-sw/2,-sh/2,sw,sh);g.clip();g.drawImage(img,-img.width*k/2,-img.height*k/2,img.width*k,img.height*k);g.restore();});
  if(t.Caption){g.fillStyle=t.CaptionColor||'#222';g.font=Math.round(h*.04)+'px '+(settings.FontName||'sans-serif');g.textAlign='center';g.fillText(t.Caption,w/2,h*.965,w*.9);}
  return c.toDataURL('image/jpeg',.9);
 }
 const stamp=()=>{const now=new Date();return now.toLocaleDateString('de-DE')+' · '+now.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});};
 const keep=url=>{snapCount++;snaps.unshift({id:'demo'+snapCount,name:'Demo-Foto '+snapCount,url,date:stamp()});photos=[...snaps,...photos.filter(p=>!String(p.id).startsWith('demo'))];};
 let shots=[],total=1;
 const originalReceive=window.receive;
 window.receive=function(d){
  if(stream&&d?.type==='progress'){if(d.index===1)shots=[];total=d.total||1;}
  if(stream&&d?.type==='shot'){const url=snap();if(url){shots.push(url);lastSnap=url;if(total<2)keep(url);d={...d,photo:{url}};}}
  if(stream&&d?.type==='processing'&&shots.length>1){const taken=shots;shots=[];originalReceive(d);compose(taken).then(url=>{lastSnap=url;keep(url);if(page==='result')render();});return;}
  originalReceive(d);
  if(d?.type==='preview'&&snaps.length){photos=[...snaps,...photos];photo=photos[0];}
 };
 /* Galerie: im Vorschaumodus zeichnet der Kiosk Beispielbilder; hier die echten Demo-Fotos zeigen. */
 new MutationObserver(()=>{if(page!=='gallery'||!snaps.length)return;document.querySelectorAll('.gallery__img canvas.gallery-preview').forEach(canvas=>{const p=photos.find(x=>x.id===canvas.closest('[data-id]')?.dataset.id);if(!p||!String(p.id).startsWith('demo'))return;const img=document.createElement('img');img.alt=p.name;src.set.call(img,p.url);canvas.replaceWith(img);});}).observe(document.getElementById('stage'),{childList:true,subtree:true});

 /* Kleine Demo-Leiste unten links: Webcam, Vollbild, zurück zur Übersicht. */
 const bar=document.createElement('div');bar.className='demo-bar';
 bar.innerHTML='<span class="demo-tag">Demo · simuliert</span><button type="button" data-demo="cam"><i class="fa fa-video-camera"></i> Webcam</button><button type="button" data-demo="full"><i class="fa fa-expand"></i> Vollbild</button><a href="index.html"><i class="fa fa-th-large"></i> Übersicht</a>';
 const style=document.createElement('style');
 style.textContent='.demo-bar{position:fixed;left:12px;bottom:12px;z-index:50;display:flex;gap:6px;align-items:center;font:13px/1 "Segoe UI",Arial,sans-serif;opacity:.35;transition:opacity .2s}.demo-bar:hover,.demo-bar:focus-within{opacity:1}.demo-bar>*{background:#17191de6;color:#e8eef2;border:1px solid #ffffff40;border-radius:6px;padding:8px 10px;text-decoration:none;cursor:pointer;min-height:0;font:inherit}.demo-bar .demo-tag{cursor:default;color:#ffcf7a}.demo-bar button.on{background:#2f6f8f;border-color:#9fd0ea}:fullscreen .demo-bar{opacity:0}:fullscreen .demo-bar:hover{opacity:1}';
 document.head.append(style);document.body.append(bar);
 const camButton=bar.querySelector('[data-demo=cam]');
 /* Der Kiosk übernimmt beim Neuzeichnen das bisherige Livebild-Element; beim Umschalten deshalb entfernen. */
 const dropLive=()=>document.querySelectorAll('.live-background').forEach(e=>e.remove());
 async function toggleCam(){
  if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;lastSnap=null;camButton.classList.remove('on');dropLive();render();return;}
  try{stream=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:1920},height:{ideal:1080}},audio:false});camButton.classList.add('on');dropLive();render();}
  catch{stream=null;notify('Keine Webcam verfügbar oder Zugriff abgelehnt. Die Demo läuft mit Beispielbildern weiter.');}
 }
 camButton.onclick=toggleCam;
 bar.querySelector('[data-demo=full]').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen?.().catch(()=>{});};
 if(params.has('webcam'))setTimeout(toggleCam,300);
})();
