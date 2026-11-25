'use strict';
/* Fotobox Einrichtung · Start: Kopfzeile verbinden und Stand der Box laden. */
$('#event-switch').onclick=e=>{if($('.event-menu'))closeMenus();else eventMenu(e.currentTarget);};
$('#camera-pill').onclick=e=>{if($('.popover-menu:not(.event-menu)'))closeMenus();else cameraMenu(e.currentTarget);};
$('#launch').onclick=async()=>{if(dirty)await saveNow();action('launch');};
$('#test-flow').onclick=openFlowTest;
$('#undo').onclick=undoStep;$('#redo').onclick=redoStep;
if(window.remoteMode)document.documentElement.classList.add('remote');
const startApp=()=>command('ready').catch(()=>{});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startApp,{once:true});else queueMicrotask(startApp);
