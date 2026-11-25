'use strict';
// Operator tools share the existing save queue and modal layer.
function nameSnapshot(){return openDialog('Zwischenstand benennen',b=>{const i=el('input');i.maxLength=60;i.placeholder='z. B. Aufbau fertig';row(b,'Name (optional)',i);},{confirm:'Sichern',value:b=>b.querySelector('input').value.trim()}).then(v=>v===undefined?null:v);}
function editorHelp(){openDialog('Editor bedienen',b=>{for(const t of ['Ziehen verschiebt Elemente auch über den Bildrand. Der sichtbare Ausschnitt entspricht der Ausgabe.','Ecken skalieren proportional. Kanten verändern das Seitenverhältnis und schneiden Bilder passend zu.','Shift+Klick wählt mehrere Elemente. Alt umgeht das Einrasten.','Doppelklick bearbeitet Text. Rechtsklick öffnet Ebenen und Ausrichtung.','Strg+Z macht Änderungen rückgängig.'])b.append(el('p','',t));},{cancelText:'Verstanden'});}
function showPhotoLarge(url){return openDialog('Foto ansehen',b=>{const img=el('img','large-test-photo');img.src=url;img.alt='Foto in voller Ansicht';b.append(img);},{cls:'photo-lightbox',cancelText:'Schließen'});}
function openCameraTest(){
 if(window.remoteMode){notify('Livebild und Testaufnahme bitte an der Box oder am PC öffnen.');return;}
 let timer,loading=false,serial=0;
 return openDialog('Livebild & Testfoto',(b,ctx)=>{
  const grid=el('div','camera-test-grid'),live=el('img','test-live'),result=el('div','test-result'),hint=el('p','hint','Ein Testfoto wird im aktiven Event gespeichert.');live.alt='Livebild der Kamera';result.append(el('p','empty','Noch kein Testfoto.'));
  const liveBox=el('figure');liveBox.append(live,el('figcaption','','Livebild'));grid.append(liveBox,result);b.append(grid,hint);
  const shot=button('Testfoto aufnehmen',async()=>{if(shot.disabled)return;shot.disabled=true;hint.textContent='Aufnahme läuft …';hint.classList.remove('test-error');try{clearTimeout(saveTimer);await command('testCapture');const img=el('img','test-photo');img.src='https://studio-live.local/test.jpg?t='+Date.now();await img.decode();result.replaceChildren();img.alt='Testfoto · zum Vergrößern antippen';img.onclick=()=>showPhotoLarge(img.src);img.tabIndex=0;img.onkeydown=e=>{if(e.key==='Enter')showPhotoLarge(img.src);};result.append(img,el('p','hint','Testfoto · zum Vergrößern antippen'));hint.textContent='Testfoto gespeichert.';}catch(e){hint.textContent=e.message||'Testfoto nicht möglich. Kamera und Fokus prüfen.';hint.setAttribute('role','alert');hint.classList.add('test-error');}finally{shot.disabled=false;}},'primary','camera');b.append(shot);
  const stream=createLiveStream('https://studio-live.local/frame.jpg',{interval:60,target:()=>ctx.dialog.open?live:null});timer={stream};
 },{cls:'camera-test-dialog',cancelText:'Schließen',onClose:()=>{timer?.stream?.stop();}});
}
function templatePolicy(parent,single){
 const choose=single?'ChooseSingleLayout':'ChooseCollageLayout',random=single?'RandomSingleLayout':'RandomCollageLayout',fixed=single?'DefaultSingleLayout':'DefaultCollageLayout',templates=single?model.SingleTemplates:model.CollageTemplates;
 const notice=hintBox(parent,'Beim gemeinsamen Start wählen Gäste aus allen angebotenen Vorlagen.');when(notice,()=>model.UnifiedTemplateSelection);const controls=when(el('div'),()=>!model.UnifiedTemplateSelection);parent.append(controls);
 const mode=()=>model[choose]?'guest':model[random]?'random':'fixed';
 const control=selectControl([['guest','Gäste wählen'],['random','Zufällig'],['fixed','Feste Vorlage']],mode(),v=>{applyMany({[choose]:v==='guest',[random]:v==='random'});refreshConditions();});row(controls,'Vorlage bestimmen',control);
 const box=when(el('div'),()=>!model[choose]&&!model[random]);controls.append(box);
 fSelect(box,fixed,'Immer verwenden',(templates.length?templates:[{Name:single?'Einzelfoto':'Collage'}]).map((t,i)=>[i,t.Name]));
}
function mediaPlacementFields(parent,key){
 if(!model.MediaPlacements)model.MediaPlacements={};if(!model.MediaPlacements[key])model.MediaPlacements[key]={Fit:['PhotoFrame','StartLogo'].includes(key)?'contain':'cover',X:50,Y:50,Scale:100};
 const d=el('details','media-position-options');d.append(el('summary','','Bilddarstellung'));parent.append(d);
 const path='MediaPlacements.'+key;fSelect(d,path+'.Fit','Darstellung',[['cover','Ausfüllen (Beschnitt)'],['contain','Ganz einpassen']]);fNumber(d,path+'.Scale','Größe',20,300,'%',{slider:true});fNumber(d,path+'.X','Horizontal',0,100,'%',{slider:true});fNumber(d,path+'.Y','Vertikal',0,100,'%',{slider:true});
}
function dashboardQuickActions(root){
 const strip=el('div','quick-actions');for(const [name,glyph,go]of [['Belichtung & Fokus','sliders',openCameraSettings],['Hintergrundbild','image',chooseDashboardBackground],['Buttonfarbe','paint-brush',e=>dashboardButtonColor(e.currentTarget)],['Event wechseln','calendar',()=>eventMenu($('#event-switch'))]])strip.append(button(name,go,'small',glyph));root.prepend(strip);
}

// Saturation/value field and hue are available immediately; text entry is explicit.
function openColorPopover(anchor,value,onPick,onLive){
 closeColorPopover();const pop=el('div','popover-menu color-popover direct-color-picker');pop.setAttribute('role','dialog');pop.setAttribute('aria-label','Farbe wählen');
 const rgb=(hex)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255),toHsv=hex=>{const [r,g,b]=rgb(hex),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;let h=d===0?0:max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;return [(h*60+360)%360,max?d/max:0,max];};
 let [h,s,v]=toHsv(hexColor.test(value)?value:'#000000'),dragging=false;const canvas=el('canvas','color-plane');canvas.width=260;canvas.height=160;canvas.tabIndex=0;canvas.setAttribute('aria-label','Sättigung und Helligkeit · Pfeiltasten ändern die Farbe');const ctx=canvas.getContext('2d');
 const hue=el('input','color-hue');hue.type='range';hue.min=0;hue.max=360;hue.value=h;hue.setAttribute('aria-label','Farbton');const hex=el('input');hex.maxLength=7;hex.value=value;hex.setAttribute('aria-label','Hexwert');
 const asHex=()=>{const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c,parts=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return '#'+parts.map(n=>Math.round((n+m)*255).toString(16).padStart(2,'0')).join('').toUpperCase();};
 const draw=()=>{ctx.fillStyle=`hsl(${h},100%,50%)`;ctx.fillRect(0,0,260,160);let g=ctx.createLinearGradient(0,0,260,0);g.addColorStop(0,'white');g.addColorStop(1,'#fff0');ctx.fillStyle=g;ctx.fillRect(0,0,260,160);g=ctx.createLinearGradient(0,0,0,160);g.addColorStop(0,'#0000');g.addColorStop(1,'black');ctx.fillStyle=g;ctx.fillRect(0,0,260,160);ctx.beginPath();ctx.arc(s*260,(1-v)*160,6,0,Math.PI*2);ctx.strokeStyle='white';ctx.lineWidth=2;ctx.stroke();hex.value=asHex();};
 const live=()=>{const c=asHex();draw();if(onLive)onLive(c);else onPick(c);};
 const point=e=>{const r=canvas.getBoundingClientRect();s=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));v=1-Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));live();};
 canvas.onpointerdown=e=>{e.preventDefault();dragging=true;canvas.setPointerCapture(e.pointerId);onLive?.('start');point(e);};canvas.onpointermove=e=>{if(dragging)point(e);};canvas.onpointerup=canvas.onpointercancel=()=>{if(dragging){dragging=false;onPick(asHex());}};
 canvas.onkeydown=e=>{if(!e.key.startsWith('Arrow'))return;e.preventDefault();onLive?.('start');s=Math.max(0,Math.min(1,s+(e.key==='ArrowRight'?.02:e.key==='ArrowLeft'?-.02:0)));v=Math.max(0,Math.min(1,v+(e.key==='ArrowUp'?.02:e.key==='ArrowDown'?-.02:0)));live();onPick(asHex());};
 let hueStarted=false;hue.oninput=()=>{if(!hueStarted){hueStarted=true;onLive?.('start');}h=Number(hue.value);live();};hue.onchange=()=>{hueStarted=false;onPick(asHex());};hex.onchange=()=>{let c=hex.value.trim();if(/^[\da-f]{6}$/i.test(c))c='#'+c;if(!hexColor.test(c))return;[h,s,v]=toHsv(c);hue.value=h;draw();onPick(c.toUpperCase());};
 pop.append(canvas,hue,hex);const colors=projectColors();if(colors.length){pop.append(el('div','color-title','Im Projekt'));const sw=el('div','swatches');for(const c of colors){const b=button('',()=>{[h,s,v]=toHsv(c);hue.value=h;draw();onPick(c);},'swatch');b.style.background=c;b.title=c;b.setAttribute('aria-label',c);sw.append(b);}pop.append(sw);}
 document.body.append(pop);const r=anchor.getBoundingClientRect();pop.style.top=Math.max(8,Math.min(r.bottom+6,innerHeight-pop.offsetHeight-8))+'px';pop.style.left=Math.max(8,Math.min(r.left,innerWidth-pop.offsetWidth-8))+'px';colorPopover=pop;pop.anchor=anchor;draw();canvas.focus({preventScroll:true});
}

async function chooseDashboardBackground(){clearTimeout(saveTimer);try{const reply=await command('asset',{key:'StartBackgroundImage'});if(reply?.type==='model'&&model.StartBackgroundImage)applyMany({HomeBackgroundMode:'image'});}catch{}}
function dashboardButtonColor(anchor){let started=false;openColorPopover(anchor,model.ButtonColor,v=>{if(started){set('ButtonColor',v);changed();started=false;}else update('ButtonColor',v);},v=>{if(v==='start'){remember();started=true;return;}set('ButtonColor',v);changed();});}
function fillUsbDetails(){const host=document.getElementById('usb-device-status');if(!host)return;host.replaceChildren();const device=runtime.usbDevice;if(device){statusRow(host,'Erkannt',device.Name+' ('+device.Root+')');statusRow(host,'Freier Speicher',(device.FreeBytes/1073741824).toLocaleString('de-DE',{maximumFractionDigits:1})+' GB');}else host.append(el('p','hint',runtime.usb||'Warte auf einen USB-Stick …'));}
hooks.runtime.push(fillUsbDetails);
