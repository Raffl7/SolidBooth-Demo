'use strict';
function showPowerMenu(){modal='power';dialog(`<h2>Windows beenden</h2><p>Kamera und Speicherung werden zuerst sauber beendet.</p><div class="admin-menu-actions">${btn('powerConfirmShutdown','Herunterfahren','power-off')}${btn('powerConfirmRestart','Neu starten','refresh')}${btn('adminBack','Zurück zum Adminbereich','arrow-left')}</div>`,true);}
function confirmPower(action){modal='powerConfirm';dialog(`<h2>${action==='restart'?'Windows neu starten?':'Windows herunterfahren?'}</h2><p>Die Fotobox wird geschlossen. Laufende Dateien werden vorher gesichert.</p><div class="actions">${btn('adminBack','Abbrechen','arrow-left')}${btn(action==='restart'?'doRestart':'doShutdown',action==='restart'?'Neu starten':'Herunterfahren','power-off',false,'danger')}</div>`,true);}
// App gestures are blocked; single-finger scrolling and gallery swipes remain available.
document.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('dragstart',e=>e.preventDefault());
document.addEventListener('selectstart',e=>{if(!e.target.closest('input,textarea,select'))e.preventDefault();});
document.addEventListener('touchmove',e=>{if(e.touches.length>1)e.preventDefault();},{passive:false});
for(const name of ['gesturestart','gesturechange','gestureend'])document.addEventListener(name,e=>e.preventDefault(),{passive:false});
document.addEventListener('wheel',e=>{if(e.ctrlKey)e.preventDefault();},{passive:false});
