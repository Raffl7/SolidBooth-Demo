'use strict';
/* Web-Demo · Einrichtung: Änderungen für den Demo-Kiosk merken und „Kiosk starten“ im Browser öffnen.
   Läuft nur in der veröffentlichten Web-Demo, nie in der Windows-App. */
(()=>{
 const KEY='solidbooth-demo-settings';
 const remember=s=>{try{localStorage.setItem(KEY,JSON.stringify(s));}catch{}};
 /* Die simulierte Brücke wird erst nach diesem Skript geladen; danach umhüllen. */
 const wrap=()=>{const bridge=window.chrome?.webview;if(!bridge||bridge.demoWrapped)return;bridge.demoWrapped=true;const forward=bridge.postMessage;
 bridge.postMessage=m=>{
  if(m?.settings)remember(m.settings);
  /* Laufenden Befehl wie ein Speichern abschließen, damit die Befehlswarteschlange weiterläuft. */
  if(m?.cmd==='launch'){window.open('kiosk.html?editor&demo','solidbooth-kiosk');return forward({...m,cmd:'save'});}
  return forward(m);
 };};
 /* Beim Laden zuletzt gespeicherte Demo-Gestaltung übernehmen, damit Einrichtung und Kiosk übereinstimmen. */
 window.demoLoad=data=>{try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object'&&Array.isArray(s.Events))return {...data,...s,Events:data.Events,ActiveEvent:data.ActiveEvent};}catch{}return data;};
 document.addEventListener('DOMContentLoaded',()=>{
  wrap();
  const back=document.createElement('a');back.href='index.html';back.textContent='← Demo-Übersicht';
  back.style.cssText='position:fixed;bottom:66px;left:12px;z-index:10000;background:#252c32;color:#d4e1ea;border:1px solid #64727d;padding:5px 9px;border-radius:5px;font:12px sans-serif;text-decoration:none';
  document.body.append(back);
 });
})();
