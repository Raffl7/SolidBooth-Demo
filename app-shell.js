'use strict';
/* SolidBooth Einrichtung · Rahmen: Navigation, Kopfzeile, Vorschau, Kamera und Betrieb. */

const pages=[
 {id:'overview',title:'Dashboard',short:'Dashboard',icon:'tachometer',description:'Startklar-Prüfung, Kamera, letztes Foto und laufender Betrieb.'},
 {id:'events',title:'Events',short:'Events',icon:'calendar',description:'Veranstaltungen anlegen, wechseln, sichern und wiederherstellen.'},
 {id:'flow',title:'Gästeablauf',short:'Ablauf',icon:'sitemap',description:'Was Gäste erleben – Station für Station.'},
 {id:'design',title:'Gestaltung',short:'Design',icon:'paint-brush',description:'Aussehen und Texte jedes Gästebildschirms.',subs:[['style','Grundstil','sliders'],['home','Startseite','home'],['templates','Vorlagenauswahl','th-large'],['capture','Aufnahme','clock-o'],['result','Ergebnis','picture-o'],['gallery','Galerie','th'],['viewer','Bildansicht','expand'],['download','Download','qrcode'],['messages','Meldungen','info-circle'],['welcome','Auftakt','hand-o-up'],['idle','Bildschirmschoner','moon-o']]},
 {id:'templates',title:'Fotovorlagen',short:'Vorlagen',icon:'th-large',description:'Format, Rahmen und Bildfelder der gespeicherten Fotos.',subs:[['single','Einzelfoto','square-o'],['collage','Collage','th-large']]},
 {id:'sharing',title:'Teilen & Download',short:'Teilen',icon:'qrcode',description:'Wie Gäste ihre Fotos aufs Handy bekommen.'},
 {id:'system',title:'Box & System',short:'System',icon:'cog',description:'Kamera, Start, Zugang, Fernverwaltung und Sicherung dieser Box.'}
];
let route={page:'overview',sub:''};
try{const saved=JSON.parse(sessionStorage.getItem('fotobox-route')||'null');if(saved&&pages.some(p=>p.id===saved.page))route=saved;}catch{}
if(window.startRoute)route=window.startRoute;
let flowStep='start';

function pageDef(id=route.page){return pages.find(p=>p.id===id)||pages[0];}
function navigate(page,sub,opts={}){
 const def=pageDef(page);route={page:def.id,sub:sub||(def.subs?(page===route.page&&!sub?route.sub:def.subs[0][0]):'')};
 if(def.subs&&!def.subs.some(s=>s[0]===route.sub))route.sub=def.subs[0][0];
 if(opts.step)flowStep=opts.step;
 try{sessionStorage.setItem('fotobox-route',JSON.stringify(route));}catch{}
 if(typeof editorResetSelection==='function')editorResetSelection();
 render();$('#main').scrollTop=0;
}
/* Frühere Bereichsnamen bleiben ansprechbar (Fernverwaltung, automatische Prüfungen). */
function switchArea(area,part){
 const map={'events/overview':['events'],'events/dashboard':['overview'],'flow/capture':['flow','','capture'],'design/appearance':['design','style'],'design/home':['design','home'],'design/resultDesign':['design','result'],'design/gallery':['design','gallery'],'design/viewer':['design','viewer'],'design/selectionDesign':['design','gallery'],'design/downloadDesign':['design','download'],'layouts/single':['templates','single'],'layouts/templates':['templates','collage'],'sharing/download':['sharing'],'sharing/email':['sharing'],'sharing/print':['sharing'],'run/startup':['system'],'run/admin':['system'],'run/backup':['system']};
 const key=area+'/'+(part||({events:'overview',flow:'capture',design:'appearance',layouts:'single',sharing:'download',run:'startup'})[area]||'');
 const target=map[key]||({run:['system'],layouts:['templates','collage'],flow:['flow'],events:['events'],sharing:['sharing']})[area]||[area,part];navigate(target[0],target[1],{step:target[2]});
}

/* ---------- Rendern ---------- */
const renderCleanups=[];
function render(){
 if(!model)return;
 const main=$('#main'),scroll=main.scrollTop,sameRoute=main.dataset.route===route.page+'/'+route.sub,focus=document.activeElement?.id;
 const keepScroll=[...document.querySelectorAll('[data-keep-scroll]')].map(n=>[n.dataset.keepScroll,n.scrollTop]);
 for(const cleanup of renderCleanups.splice(0))cleanup();
 resetConditions();hooks.view=null;closeMenus();closeColorPopover();
 const def=pageDef();
 renderTopbar();renderNav();
 $('#page-title').textContent=def.subs?def.subs.find(s=>s[0]===route.sub)?.[1]||def.title:def.title;
 $('#page-description').textContent=def.subs?def.title+' · '+def.description:def.description;$('#page-actions').replaceChildren();
 const sub=$('#subnav');sub.hidden=!def.subs;sub.replaceChildren();
 if(def.subs)for(const [key,title,glyph]of def.subs){const b=button(title,()=>navigate(def.id,key),key===route.sub?'active':'',glyph);b.setAttribute('role','tab');b.setAttribute('aria-selected',String(key===route.sub));sub.append(b);}
 document.body.dataset.page=def.id;document.body.dataset.sub=route.sub||'';document.body.classList.remove('custom-editor','editor-page');
 const content=$('#content');content.className='';content.replaceChildren();hidePreview();
 ({overview:overviewPage,events:eventsPage,flow:flowPage,design:designPage,templates:templatesPage,sharing:sharingPage,system:systemPage})[def.id]();
 if(window.remoteMode)remotePageActions();
 updatePreview();main.dataset.route=route.page+'/'+route.sub;
 if(sameRoute){main.scrollTop=scroll;for(const [k,v]of keepScroll){const n=document.querySelector(`[data-keep-scroll="${k}"]`);if(n)n.scrollTop=v;}}
 if(focus)document.getElementById(focus)?.focus({preventScroll:true});
 sub.querySelector('.active')?.scrollIntoView({block:'nearest',inline:'nearest'});
}
function renderTopbar(){
 const ev=currentEvent();$('#event-name').textContent=ev.IsPlaceholder?'Kein Event':ev.Name;
 $('#event-meta').textContent=[formatDate(ev.Date),ev.Venue].filter(Boolean).join(' · ')||((eventPreviews[ev.Id]?.PhotoCount??0)+' Fotos');
 $('#launch').disabled=!!ev.IsPlaceholder;cameraStatus();refreshSaveState();
 if(window.remoteMode&&!$('#remote-logout')){const out=iconButton('sign-out','Abmelden',()=>window.remoteLogout().catch(e=>notify(e.message,'error')),'ghost');out.id='remote-logout';$('#topbar').append(out);}
}
function renderNav(){
 const side=$('#sidebar'),tabs=$('#tabbar');side.replaceChildren();tabs.replaceChildren();
 const list=el('div','nav-list');const issues=readiness().filter(r=>r.state==='warn').length;
 for(const p of pages){
  const b=button(p.title,()=>navigate(p.id),'nav-item'+(p.id===route.page?' active':''),p.icon);b.title=p.title;if(p.id===route.page)b.setAttribute('aria-current','page');
  if(p.id==='overview'&&issues){const badge=el('span','nav-badge',String(issues));badge.title=issues+' offene Punkte';b.append(badge);}
  list.append(b);
  const t=button(p.short,()=>navigate(p.id),'tab-item'+(p.id===route.page?' active':''),p.icon);if(p.id===route.page)t.setAttribute('aria-current','page');if(p.id==='overview'&&issues)t.append(el('span','tab-badge'));tabs.append(t);
 }
 side.append(list);
 const foot=el('div','nav-foot');foot.append(el('small','version',window.remoteMode?'Verbunden über WLAN':'Automatisch gespeichert · 0.26'));side.append(foot);
}

/* ---------- Vorschau (exaktes Abbild des Kioskbildschirms) ---------- */
let previewPanel=null,previewFrame=null,previewPage='home',previewInteractive=false,standardCaptureActive=false,lastPreviewSend='';
function fitFrame(frame,viewport,size){const scale=viewport.clientWidth/size.width||.3;frame.style.width=size.width+'px';frame.style.height=size.height+'px';frame.style.transform='scale('+scale+')';}
function preview(page,opts={}){
 previewPage=page;
 if(!previewPanel){
  previewPanel=el('div','preview-panel');const head=el('div','preview-head');
  const title=el('div','preview-title');title.append(el('span','live-dot'),el('span','','Gästevorschau'),el('small','preview-size',''));
  const tools=el('div','preview-tools');
  const tryIt=button('Ausprobieren',()=>{previewInteractive=!previewInteractive;tryIt.classList.toggle('active',previewInteractive);previewPanel.classList.toggle('interactive',previewInteractive);lastPreviewSend='';updatePreview();},'small','hand-pointer-o');tryIt.id='preview-try';
  tools.append(tryIt,iconButton('expand','Groß anzeigen',()=>openPreviewLarge(previewPage),'small'));head.append(title,tools);
  const viewport=el('div','preview-viewport');previewFrame=el('iframe');previewFrame.src='kiosk.html?editor&v=0.26.1';previewFrame.title='Gästevorschau';previewFrame.onload=()=>{lastPreviewSend='';updatePreview();};viewport.append(previewFrame);
  const note=el('p','preview-note');note.id='preview-note';
  previewPanel.append(head,viewport,note);$('#preview-host').append(previewPanel);
  new ResizeObserver(()=>{lastPreviewSend='';updatePreview();}).observe(viewport);
 }
 $('#preview-note').textContent=opts.note||'Zeigt genau den Kioskbildschirm der Box. Änderungen erscheinen sofort.';
 $('.workarea').classList.remove('no-preview');$('#preview-host').setAttribute('aria-hidden','false');
}
function hidePreview(){$('.workarea')?.classList.add('no-preview');$('#preview-host')?.setAttribute('aria-hidden','true');}
function previewSize(page){
 const k=kioskSize();
 if(page==='single'){const w=model.PhotoOutputWidth||1800,h=model.PhotoOutputHeight||1200;return {width:Math.round(k.height*w/h),height:k.height,ratio:w/h};}
 return k;
}
function updatePreview(){
 if(standardCaptureActive||!previewFrame||!model)return;
 const viewport=previewFrame.parentElement,size=previewSize(previewPage);
 viewport.style.aspectRatio=String(size.ratio);fitFrame(previewFrame,viewport,size);
 const label=previewPanel.querySelector('.preview-size');if(label)label.textContent=size.width+' × '+size.height;
 const message={type:'preview',settings:model,page:previewPage,interactive:previewInteractive};
 const signature=JSON.stringify(message);if(signature===lastPreviewSend)return;lastPreviewSend=signature;
 previewFrame.contentWindow?.postMessage(message,location.origin);
}
window.addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.type==='guestReady'){lastPreviewSend='';updatePreview();}});
window.addEventListener('resize',()=>{lastPreviewSend='';updatePreview();});

function kioskDialog(title,page,interactive,intro){
 openDialog(title,(body)=>{
  if(intro)body.append(el('p','hint',intro));
  const size=kioskSize(),viewport=el('div','test-viewport'),frame=el('iframe');frame.title=title;frame.src='kiosk.html?editor&v=0.26.1';viewport.append(frame);body.append(viewport);
  viewport.style.aspectRatio=String(size.ratio);viewport.style.maxWidth='calc((100dvh - 210px) * '+size.ratio.toFixed(4)+')';
  const send=nonce=>frame.contentWindow?.postMessage({type:'preview',settings:model,page,interactive,test:interactive,nonce},location.origin);
  frame.onload=()=>{fitFrame(frame,viewport,size);send();};const ro=new ResizeObserver(()=>fitFrame(frame,viewport,size));ro.observe(viewport);
  if(interactive){const restart=button('Von vorn beginnen',()=>send(Date.now()),'small','refresh');body.append(restart);}
 },{cls:'test-dialog',cancelText:'Schließen'});
}
function openFlowTest(){kioskDialog('Gästeablauf testen','home',true,'Simulation mit Beispielbildern: Tippe dich wie ein Gast durch den Ablauf. Keine Kamera, nichts wird gespeichert.');}
function openPreviewLarge(page){kioskDialog('Vorschau',page,previewInteractive,'');}

/* ---------- Kamera ---------- */
function cameraStatus(){
 const pill=$('#camera-pill');if(!pill)return;const info=cameraInfo||{};
 const text=info.busy?'Kamera beschäftigt':cameraReady?(info.name||'Kamera bereit'):(window.remoteMode&&runtime.camera&&!/nicht/i.test(runtime.camera)?runtime.camera:(info.title||'Kamera aus'));
 $('#camera-label').textContent=text;pill.dataset.state=info.busy?'busy':cameraReady?'ready':'off';pill.title=info.detail||text;
}
function cameraMenu(anchor){
 closeMenus();const menu=el('div','popover-menu');menu.setAttribute('role','menu');
 const head=el('div','menu-head');head.append(el('strong','',$('#camera-label').textContent),el('small','',cameraInfo?.detail||(cameraReady?'Livebild läuft, Aufnahme möglich.':'Kamera einschalten und per USB verbinden.')));menu.append(head);
 const add=(t,g,fn,disabled)=>{const b=button(t,()=>{closeMenus();fn();},'menu-item',g);b.setAttribute('role','menuitem');b.disabled=!!disabled;menu.append(b);};
 add('Kamera verbinden','plug',()=>action('connect'),cameraReady||cameraInfo?.busy);
 add('Belichtung & Fokus','sliders',openCameraSettings);
 if(!window.remoteMode){add('Livebild & Testfoto','video-camera',openCameraTest);add('Bilderordner öffnen','folder-open-o',()=>action('openPhotos'));}
 placeMenu(menu,anchor);
}
function placeMenu(menu,anchor){document.body.append(menu);const r=anchor.getBoundingClientRect();menu.style.top=Math.min(r.bottom+6,innerHeight-menu.offsetHeight-8)+'px';menu.style.left=Math.max(8,Math.min(r.right-menu.offsetWidth,innerWidth-menu.offsetWidth-8))+'px';menu.querySelector('button:not(:disabled),input')?.focus();}
function closeMenus(){$$('.popover-menu:not(.color-popover):not(.icon-popover)').forEach(m=>m.remove());}
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.popover-menu,#camera-pill,#event-switch,.menu-trigger'))closeMenus();});

function openCameraSettings(){
 openDialog('Belichtung & Fokus',(body)=>{
  const status=el('p','callout info','Werte werden von der Kamera geladen …');body.append(status);const content=el('div','camera-settings');body.append(content);
  command('cameraOptions').then(reply=>{
   const data=reply.camera;if(!data){status.textContent='Kameraeinstellungen sind gerade nicht verfügbar. Kamera verbinden und erneut öffnen.';return;}
   status.textContent=data.status||'Getrennte Profile für Livebild und Foto.';const prefs=data.settings;
   const enabled=switchInput(prefs.UseExposureProfiles,()=>{});row(content,'Eigene Belichtungsprofile',enabled,{cls:'toggle-field',hint:'Aus: Die Kamera nutzt ihre eigenen Einstellungen.'});
   const cols=el('div','camera-columns');content.append(cols);
   for(const [profile,label]of [['Preview','Livebild'],['Photo','Foto']]){
    const c=card(cols,label);
    for(const [key,list,title]of [['Iso','iso','ISO'],['Aperture','aperture','Blende'],['Shutter','shutter','Zeit']]){
     const items=[...(profile==='Preview'&&key==='Aperture'?[['auto','Automatisch']]:[]),...data[list].map(v=>[String(v.Code),v.Label])];
     row(c,title,selectControl(items,key==='Aperture'&&prefs[profile].AutoAperture?'auto':prefs[profile][key],v=>{if(key==='Aperture'&&profile==='Preview')prefs[profile].AutoAperture=v==='auto';if(v!=='auto')prefs[profile][key]=Number(v);}));
    }
   }
   row(content,'Fokus',selectControl([['0','Fokus festhalten'],['1','Autofokus vor jeder Aufnahme']],prefs.FocusMode,v=>prefs.FocusMode=Number(v)));
   /* Weißabgleich: gilt für Livebild und Foto. Automatisch bleibt Standard. */
   prefs.WhiteBalance??=0;prefs.ColorTemperature??=5200;
   const wbList=(data.whiteBalance||[]).map(v=>[String(v.Code),v.Label]);if(!wbList.some(v=>v[0]==='0'))wbList.unshift(['0','Automatisch']);
   let kelvinRow;
   row(content,'Weißabgleich',selectControl(wbList,prefs.WhiteBalance,v=>{prefs.WhiteBalance=Number(v);kelvinRow.hidden=prefs.WhiteBalance!==9;}),{hint:'„Automatisch“ passt die Farben laufend an. Bei festem Licht sorgt ein fester Wert für gleichbleibende Farben. Gilt für Livebild und Foto.'});
   kelvinRow=row(content,'Farbtemperatur',selectControl(Array.from({length:76},(_,i)=>[String(2500+i*100),(2500+i*100)+' K']),prefs.ColorTemperature,v=>prefs.ColorTemperature=Number(v)),{hint:'Niedrig = wärmeres Licht (Glühlampe ≈ 3200 K), hoch = kühleres Licht (Tageslicht ≈ 5200 K).'});kelvinRow.hidden=prefs.WhiteBalance!==9;
   const apply=button('Werte übernehmen',async()=>{prefs.UseExposureProfiles=enabled.checked;apply.disabled=true;status.textContent='Werte werden übernommen …';try{const r=await command('cameraApply',{cameraSettings:prefs});status.textContent=r.camera?.status||'Werte übernommen.';status.className='callout ok';}catch(e){status.textContent=e.message;status.className='callout warn';}finally{apply.disabled=false;}},'primary','check');
   content.append(apply);
  }).catch(e=>{status.textContent=e.message;status.className='callout warn';});
 },{cls:'camera-dialog',cancelText:'Schließen'});
}

/* ---------- Eventwechsler ---------- */
function eventMenu(anchor){
 closeMenus();const menu=el('div','popover-menu event-menu');menu.setAttribute('role','dialog');menu.setAttribute('aria-label','Event wechseln');
 const search=el('input','menu-search');search.type='search';search.placeholder='Event suchen …';search.setAttribute('aria-label','Event suchen');menu.append(search);
 const list=el('div','menu-list');menu.append(list);
 const fill=()=>{list.replaceChildren();const q=search.value.trim().toLowerCase();
  for(const ev of model.Events.filter(e=>!e.IsPlaceholder&&(!q||(e.Name+' '+e.Venue+' '+e.Client).toLowerCase().includes(q)))){
   const b=button('',()=>{closeMenus();if(ev.Id!==model.ActiveEvent)switchEvent(ev.Id);},'menu-item event-item'+(ev.Id===model.ActiveEvent?' active':''));
   const t=el('span','event-item-text');t.append(el('strong','',ev.Name),el('small','',[formatDate(ev.Date),ev.Venue,(eventPreviews[ev.Id]?.PhotoCount??0)+' Fotos'].filter(Boolean).join(' · ')));b.append(t);if(ev.Id===model.ActiveEvent)b.append(icon('check'));list.append(b);}
  if(!list.children.length)list.append(el('p','hint','Kein passendes Event.'));};
 search.oninput=fill;fill();
 const foot=el('div','menu-foot');foot.append(button('Neues Event',()=>{closeMenus();openNewEvent();},'primary small','plus'),button('Alle Events',()=>{closeMenus();navigate('events');},'small'));menu.append(foot);
 placeMenu(menu,anchor);menu.style.left=Math.max(8,Math.min(anchor.getBoundingClientRect().left,innerWidth-menu.offsetWidth-8))+'px';search.focus();
}
async function switchEvent(id){if(dirty)await saveNow();action('switch',{id});}
async function openNewEvent(duplicate=false){
 const ev=currentEvent();
 const result=await openDialog(duplicate?'Event duplizieren':'Neues Event',body=>{
  const name=el('input');name.maxLength=80;name.required=true;name.autocomplete='off';name.value=duplicate?ev.Name+' · Kopie':'';name.placeholder='z. B. Hochzeit Anna & Ben';row(body,'Eventname',name,{cls:'stack-field'});
  if(!duplicate){const src=segmented([['default','Standard'],['duplicate','Aktuelles Event übernehmen']],'default',()=>{},'Ausgangsbasis');src.dataset.source='1';if(ev.IsPlaceholder)src.children[1].disabled=true;row(body,'Ausgangsbasis',src,{cls:'stack-field',hint:'Fotos werden nie übernommen.'});}
 },{confirm:duplicate?'Duplizieren':'Event anlegen',confirmIcon:'plus',validate:b=>{const n=b.querySelector('input');if(!n.value.trim()){n.focus();notify('Bitte einen Eventnamen eingeben.','error');return false;}return true;},value:b=>({name:b.querySelector('input').value.trim(),duplicate:duplicate||b.querySelector('[data-source]')?.dataset.value==='duplicate'})});
 if(result){if(dirty)await saveNow();await action('create',result);navigate('overview');notify('Event „'+result.name+'“ ist jetzt aktiv.','success');}
}

/* ---------- Letztes Foto ---------- */
function latestPhotoUrl(){
 if(!latestPhoto)return '';if(window.fotoboxPreviewMode)return 'demo/sample-photo.png';
 return window.remoteMode?'/api/latest-photo?v='+encodeURIComponent(latestPhoto):'https://eventphotos.local/'+String(model.ActiveEvent).replaceAll('-','')+'/originals/'+encodeURIComponent(latestPhoto);
}
function photoTime(name){const m=/^(\d{2})(\d{2})(\d{2})_(\d{2})(\d{2})/.exec(name||'');return m?`${m[3]}.${m[2]}.20${m[1]} · ${m[4]}:${m[5]} Uhr`:'';}

/* ---------- Bereitschaft ---------- */
function readiness(){
 if(!model)return [];const list=[];const add=(state,title,detail,fix,fixLabel)=>list.push({state,title,detail,fix,fixLabel});const ev=currentEvent();
 if(ev.IsPlaceholder)add('warn','Kein Event angelegt','Lege zuerst ein Event an.',()=>openNewEvent(),'Anlegen');
 add(cameraReady?'ok':'warn',cameraReady?'Kamera bereit':'Kamera nicht verbunden',cameraReady?(cameraInfo?.name||'Livebild läuft.'):'Einschalten, per USB anschließen, verbinden.',cameraReady?null:()=>action('connect'),'Verbinden');
 const missing=eventHealth.MissingAssets||[];add(missing.length?'warn':'ok',missing.length?'Mediendateien fehlen':'Mediendateien vorhanden',missing.length?missing.join(', '):'Hintergründe, Logos und Rahmen verfügbar.',missing.length?()=>navigate('design','home'):null,'Prüfen');
 const gb=eventHealth.FreeBytes?eventHealth.FreeBytes/1073741824:null;add(gb===null?'info':gb<2?'warn':'ok',gb===null?'Speicherplatz unbekannt':gb.toFixed(1)+' GB frei',gb!==null&&gb<2?'Weniger als 2 GB – Fotos sichern.':'Fotos werden lokal gespeichert.');
 if(model.ShowQr||model.ShowDownload){const ok=model.DownloadEnabled&&(model.DownloadMode!=='wifi'||model.WifiName);add(ok?'ok':'warn',ok?'Download eingerichtet':'Download unvollständig',ok?({wifi:'Gäste-WLAN + Foto-QR',network:'Foto-QR im Netzwerk',public:'Öffentlicher Link'})[model.DownloadMode]:!model.DownloadEnabled?'Downloadserver ist aus.':'WLAN-Name fehlt.',ok?null:()=>navigate('sharing'),'Einrichten');}
 else add('info','Kein QR-Download','Gäste bekommen keinen QR-Code.',()=>navigate('flow','',{step:'result'}),'Ändern');
 add(model.AdminPinHash?'ok':'warn',model.AdminPinHash?'Admin-PIN gesetzt':'Keine Admin-PIN','Ohne PIN ist der Kiosk ungeschützt und die Handy-Verwaltung gesperrt.',model.AdminPinHash?null:()=>navigate('system'),'Festlegen');
 if(model.UsbSyncEnabled)add(model.UsbTarget?'ok':'warn','USB-Sicherung aktiv',model.UsbTarget||'Kein Zielordner.',model.UsbTarget?null:()=>navigate('system'),'Zuordnen');
 return list;
}

/* ---------- Fernverwaltung ---------- */
function remotePageActions(){
 if(route.page!=='design')return;
 const page=route.page==='templates'?'home':({style:'home',home:'home',capture:'capture',result:'result',gallery:'gallery',viewer:'viewer',templates:'templates',welcome:'welcome',selection:'gallery',download:'downloadPreview',idle:'home'})[route.sub]||'home';
 $('#page-actions').append(button('Vorschau auf der Fotobox',async()=>{await saveNow();await command('preview',{page});notify('Die Box zeigt jetzt die Einrichtungsvorschau (endet nach drei Minuten).','success');},'small','television'),button('Vorschau beenden',()=>command('preview',{page:'home'}).catch(()=>{}),'small','play'));
}

/* ---------- Tastatur ---------- */
document.addEventListener('keydown',e=>{
 const k=e.key.toLowerCase(),typing=e.target.matches?.('input,textarea,select,[contenteditable=true]');
 if((e.ctrlKey||e.metaKey)&&k==='s'){e.preventDefault();saveNow();}
 else if((e.ctrlKey||e.metaKey)&&k==='z'&&!e.shiftKey&&!typing){e.preventDefault();undoStep();}
 else if((e.ctrlKey||e.metaKey)&&(k==='y'||k==='z'&&e.shiftKey)&&!typing){e.preventDefault();redoStep();}
 else if(k==='escape'){closeMenus();closeColorPopover();}
});
