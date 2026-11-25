'use strict';
/* SolidBooth Einrichtung · Seiten. Grundsatz: „Gästeablauf“ legt fest, WAS passiert.
   „Gestaltung“ legt fest, WIE es aussieht und WAS dort steht. Jede Einstellung gibt es genau einmal.
   Abhängige Felder werden ein- und ausgeblendet statt die Seite neu aufzubauen (keine Sprünge). */

function customToggle(parent,label,checked,onChange,opts={}){
 const input=switchInput(checked,v=>onChange(v),opts.id);input.disabled=!!opts.disabled;
 row(parent,label,input,{cls:'toggle-field',hint:opts.hint});return input;
}
function statusRow(parent,label,value,stateKind=''){const r=el('div','status-row'+(stateKind?' '+stateKind:''));r.append(el('span','',label),el('strong','',String(value)));parent.append(r);return r;}
function photoCount(){return runtime.photoCount??eventPreviews[model.ActiveEvent]?.PhotoCount??0;}
const showQr=()=>!!(model.ShowQr||model.ShowDownload);
function sub(parent,title,test){const s=el('div','sub-section');if(title)s.append(el('h3','',title));parent.append(s);if(test)when(s,test);return s;}

/* =================== Übersicht =================== */
function overviewPage(){
 const root=$('#content');root.className='dashboard';const ev=currentEvent();dashboardQuickActions(root);
 $('#page-actions').append(button('Kiosk starten',()=>action('launch'),'primary small','play'));
 const hero=card(root,'',null,{cls:'hero'});
 const info=el('div','hero-info');info.append(el('h2','',ev.IsPlaceholder?'Noch kein Event':ev.Name));
 const meta=el('div','hero-meta');for(const [glyph,text]of [['calendar-o',formatDate(ev.Date)||''],['map-marker',ev.Venue||''],['user-o',ev.Client||'']]){if(!text)continue;const m=el('span');m.append(icon(glyph),document.createTextNode(text));meta.append(m);}
 info.append(meta);if(ev.Notes){const notes=el('details','dashboard-notes');notes.append(el('summary','','Eventnotizen'),el('p','',ev.Notes));info.append(notes);}
 const stats=el('div','hero-stats');const stat=(value,label,id)=>{const s=el('div','stat');const v=el('strong','',String(value));if(id)v.id=id;s.append(v,el('span','',label));stats.append(s);};
 stat(photoCount(),'Fotos','stat-photos');stat([model.ShowSingle&&'Einzelfoto',model.ShowCollage&&'Collage'].filter(Boolean).join(' + '),'Aufnahme');stat(showQr()?'QR an':'QR aus','Download');
 info.append(stats,linkButton('Eventdaten bearbeiten',()=>navigate('events')));
 const last=el('figure','latest-photo');last.id='latest-photo';hero.append(info,last);fillLatestPhoto();

 const checks=readiness(),open=checks.filter(c=>c.state==='warn').length;
 const ready=card(root,'Startklar',open?open+(open===1?' Punkt offen':' Punkte offen'):'Alles bereit',{cls:'readiness'+(open?'':' all-ok'),icon:open?'exclamation-circle':'check-circle',actions:[iconButton('refresh','Erneut prüfen',()=>action('refreshHealth'),'ghost small')]});
 const list=el('ul','check-list');for(const c of checks){const li=el('li',c.state);li.append(icon(c.state==='ok'?'check-circle':c.state==='warn'?'exclamation-circle':'info-circle'));const t=el('div');t.append(el('strong','',c.title),el('small','',c.detail));li.append(t);if(c.fix)li.append(button(c.fixLabel||'Öffnen',c.fix,'small'+(c.state==='warn'?' primary':'')));list.append(li);}const issue=checks.find(c=>c.state==='warn');if(issue){const notice=el('div','dashboard-issue');notice.append(icon('exclamation-circle'),el('span','',issue.title));if(issue.fix)notice.append(button(issue.fixLabel||'Öffnen',issue.fix,'small'));ready.append(notice);}const details=el('details','dashboard-details');details.append(el('summary','','Alle Prüfpunkte anzeigen'),list);ready.append(details);

 const side=el('div','stack');root.append(side);
 const cam=card(side,'Kamera',null,{cls:'camera-card',icon:'camera'});cam.id='camera-card';fillCameraCard(cam);
 const run=card(side,'Betrieb',null,{cls:'runtime-card',icon:'heartbeat'});const panel=el('div');panel.id='runtime-panel';run.append(panel);refreshRuntimePanel();
}
function fillLatestPhoto(){
 const fig=$('#latest-photo');if(!fig)return;const url=latestPhotoUrl();if(fig.dataset.src===url)return;fig.dataset.src=url;fig.replaceChildren();
 if(!url){const e=el('div','latest-empty');e.append(icon('picture-o'),el('span','',photoCount()>0?photoCount()+' Fotos · keine Vorschau verfügbar':'Noch keine Fotos in diesem Event'));fig.append(e);return;}
 const img=el('img');img.alt='Letztes Foto';img.src=url;img.onerror=()=>{img.remove();if(!fig.querySelector('.latest-empty')){const e=el('div','latest-empty');e.append(icon('picture-o'),el('span','','Vorschau nicht verfügbar'));fig.prepend(e);}};
 const cap=el('figcaption');cap.append(el('span','badge','Letztes Foto'),el('small','',photoTime(latestPhoto)));img.tabIndex=0;img.style.cursor='zoom-in';img.onclick=()=>showPhotoLarge(url);img.onkeydown=e=>{if(e.key==='Enter')showPhotoLarge(url);};fig.append(img,cap);
}
function fillCameraCard(cam){
 cam.querySelector('.camera-body')?.remove();const body=el('div','camera-body');
 const s=el('div','camera-state '+(cameraReady?'ready':'off'));s.append(el('span','dot'),el('div'));s.lastChild.append(el('strong','',$('#camera-label')?.textContent||'Kamera'),el('small','',cameraInfo?.detail||(cameraReady?'Livebild läuft. Aufnahmen sind möglich.':'Einschalten, per USB verbinden und „Verbinden“ wählen.')));
 const actions=el('div','button-row');const connect=button('Verbinden',()=>action('connect'),'small'+(cameraReady?'':' primary'),'plug');connect.disabled=cameraReady||!!cameraInfo?.busy;
 actions.append(connect,button('Belichtung & Fokus',openCameraSettings,'small','sliders'));if(!window.remoteMode)actions.append(button('Livebild & Testfoto',openCameraTest,'small','video-camera'));
 body.append(s,actions);cam.append(body);
}
hooks.device.push(()=>{cameraStatus();const cam=$('#camera-card');if(cam){const sig=cameraReady+'|'+JSON.stringify(cameraInfo);if(cam.dataset.sig!==sig){cam.dataset.sig=sig;fillCameraCard(cam);}}});
hooks.runtime.push(()=>{cameraStatus();refreshRuntimePanel();fillLatestPhoto();const s=$('#stat-photos');if(s)s.textContent=photoCount();});
function refreshRuntimePanel(){
 const panel=$('#runtime-panel');if(!panel)return;const signature=JSON.stringify({...runtime,started:0});if(panel.dataset.signature===signature)return;
 const historyScroll=panel.querySelector('.runtime-history')?.scrollTop||0;panel.dataset.signature=signature;panel.replaceChildren();
 const grid=el('div','status-grid');
 statusRow(grid,'Kiosk',runtime.kioskOpen?'Geöffnet':'Einrichtung');statusRow(grid,'Aufnahme',runtime.captureBusy?'Läuft':'Bereit');statusRow(grid,'Download',runtime.download||'Nicht aktiv');statusRow(grid,'USB',runtime.usb||'Nicht aktiv');if(runtime.usbDevice){statusRow(grid,'USB-Stick',runtime.usbDevice.Name);statusRow(grid,'USB frei',(runtime.usbDevice.FreeBytes/1073741824).toLocaleString('de-DE',{maximumFractionDigits:1})+' GB');}panel.append(grid);
 const entries=runtime.history||[];if(!entries.length){panel.append(el('p','hint muted-line','Noch keine Betriebsmeldungen.'));return;}
 const history=el('div','runtime-history');
 for(const item of entries.slice(-30).reverse()){const r=el('div','runtime-entry');r.append(el('small','',new Date(item.Time).toLocaleString('de-DE',{dateStyle:'short',timeStyle:'short'})),el('span','',item.Title+(item.Detail?' – '+item.Detail:'')));history.append(r);}
 const details=el('details','dashboard-details');const summary=el('summary','','Letzte Betriebsmeldungen ('+entries.length+')');details.append(summary,history);panel.append(details);history.scrollTop=historyScroll;
}

/* =================== Events =================== */
let eventFilter='';
function eventsPage(){
 const root=$('#content');root.className='two-col events-layout';const ev=currentEvent();
 $('#page-actions').append(button('Neues Event',()=>openNewEvent(),'primary small','plus'));
 const listCard=card(root,null,null,{cls:'event-list-card'});
 const search=el('input','search');search.type='search';search.placeholder='Suchen nach Name, Ort oder Kunde';search.value=eventFilter;search.setAttribute('aria-label','Events suchen');listCard.append(search);
 const list=el('div','event-list');list.dataset.keepScroll='events';listCard.append(list);
 const fill=()=>{list.replaceChildren();const q=eventFilter.trim().toLowerCase();const events=model.Events.filter(e=>!e.IsPlaceholder).filter(e=>!q||(e.Name+' '+e.Venue+' '+e.Client).toLowerCase().includes(q)).sort((a,b)=>(b.Date||'').localeCompare(a.Date||'')||a.Name.localeCompare(b.Name));
  if(!events.length){list.append(el('p','empty',model.Events.some(e=>!e.IsPlaceholder)?'Kein Event passt zur Suche.':'Noch keine Events. Lege mit „Neues Event“ das erste an.'));return;}
  for(const item of events){const active=item.Id===ev.Id,profile=active?model:(eventPreviews[item.Id]||model);
   const b=button('',()=>{if(!active)switchEvent(item.Id);},'event-row'+(active?' active':''));b.setAttribute('aria-current',String(active));
   const thumb=el('span','event-thumb');thumb.style.backgroundColor=profile.BackgroundColor||'#222';if(profile.StartBackgroundImage)thumb.style.backgroundImage='url("'+mediaUrl(profile.StartBackgroundImage)+'")';thumb.append(icon(profile.ShowCollage&&!profile.ShowSingle?'th-large':'camera'));
   const text=el('span','event-row-text');text.append(el('strong','',item.Name),el('small','',[formatDate(item.Date)||'Ohne Datum',item.Venue,item.Client].filter(Boolean).join(' · ')));
   const count=el('span','event-count',String(eventPreviews[item.Id]?.PhotoCount??0));count.title='Fotos';
   b.append(thumb,text,count);if(active)b.append(el('span','badge ok','Aktiv'));list.append(b);}};
 search.oninput=()=>{eventFilter=search.value;fill();};fill();

 const side=el('div','stack');root.append(side);
 if(ev.IsPlaceholder){const c=card(side,'Kein aktives Event','Lege ein Event an, um Ablauf und Gestaltung einzurichten.');c.append(button('Neues Event',()=>openNewEvent(),'primary','plus'));return;}
 const details=card(side,'Eventdaten',null,{icon:'pencil',actions:[button('Duplizieren',()=>openNewEvent(true),'small','clone')]});const inputs={};
 const grid=el('div','form-grid');details.append(grid);
 for(const [key,label,type,max]of [['name','Name','text',80],['date','Datum','date',10],['client','Kunde','text',100],['venue','Ort','text',100],['notes','Notizen','textarea',4000]]){
  const i=el(type==='textarea'?'textarea':'input');if(type!=='textarea')i.type=type;i.maxLength=max;i.value=ev[key==='name'?'Name':key[0].toUpperCase()+key.slice(1)]||'';i.id='event-'+key;
  i.onchange=()=>{const values=Object.fromEntries(Object.entries(inputs).map(([k,v])=>[k,v.value.trim()]));if(!values.name){notify('Der Eventname darf nicht leer sein.','error');i.value=ev.Name;return;}action('eventDetails',values);};
  inputs[key]=i;const w=el('label','grid-field'+(key==='name'?' wide':''));w.append(el('span','',label),i);grid.append(w);
 }
 const rev=card(side,'Zwischenstände','Stand von Ablauf und Gestaltung sichern und zurückholen.',{icon:'history',actions:[button('Jetzt sichern',async()=>{const name=await nameSnapshot();if(name!==null){await action('snapshot',{name});action('refreshHealth');}},'small','floppy-o')]});
 if(!revisions.length)rev.append(el('p','hint muted-line','Noch keine Zwischenstände für dieses Event.'));
 else{const l=el('div','revision-list');for(const file of revisions){const m=file.match(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/);const when=m?new Date(Date.UTC(+m[1],m[2]-1,+m[3],+m[4],+m[5],+m[6])).toLocaleString('de-DE',{dateStyle:'medium',timeStyle:'short'}):file;
  const r=el('div','revision-row');r.append(el('span','',file.includes('_')?file.slice(file.indexOf('_')+1,file.length-38)+' · '+when:when),button('Wiederherstellen',async()=>{if(await confirmDialog('Zwischenstand wiederherstellen?','Ablauf und Gestaltung werden auf den Stand vom '+when+' gesetzt. Fotos und Geräteeinstellungen bleiben unverändert.','Wiederherstellen'))action('restore',{id:file});},'small ghost'));l.append(r);}rev.append(l);}
 const danger=card(side,'Zurücksetzen oder entfernen',null,{cls:'danger-zone',icon:'exclamation-triangle'});
 const r1=el('div','danger-row');r1.append(el('div'),button('Zurücksetzen',async()=>{if(await confirmDialog('Event zurücksetzen?','Ablauf, Gestaltung und Vorlagen werden auf Standard gesetzt. Fotos bleiben erhalten. Vorher wird automatisch ein Zwischenstand gesichert.','Zurücksetzen',{danger:true}))action('resetEvent');},'small','undo'));
 r1.firstChild.append(el('strong','','Auf Standard zurücksetzen'),el('small','','Ablauf und Gestaltung neu beginnen.'));
 const r2=el('div','danger-row');r2.append(el('div'),button('Entfernen',()=>confirmAction('Event entfernen?','„'+ev.Name+'“ wird aus der Liste entfernt und archiviert. Seine Fotos bleiben auf dieser Box erhalten.',()=>action('deleteEvent',{id:ev.Id})),'danger small','trash-o'));
 r2.firstChild.append(el('strong','','Event entfernen'),el('small','','Fotos bleiben auf der Box.'));
 danger.append(r1,r2);
}

/* =================== Gästeablauf =================== */
const filterNames={bw:'Schwarz-Weiß',sepia:'Sepia'};
function flowStations(){
 const share=showQr(),singleChoice=model.ShowSingle&&model.ChooseSingleLayout&&model.SingleTemplates.length>1,collageChoice=model.ShowCollage&&model.ChooseCollageLayout&&model.CollageTemplates.length>1;
 return [
  {id:'welcome',title:'Auftakt',glyph:'hand-o-up',optional:true,on:model.WelcomeScreenEnabled,summary:model.WelcomeScreenEnabled?'Antippen öffnet die Startseite':'aus',preview:'welcome',build:flowWelcome},
  {id:'idle',title:'Bildschirmschoner',glyph:'moon-o',optional:true,on:model.IdleScreenEnabled,summary:model.IdleScreenEnabled?`nach ${model.IdleScreenSeconds} s · ${model.IdleScreenMode==='slideshow'?'Diashow':'Text'}`:'aus',preview:'idle',build:flowIdle},
  {id:'start',title:'Startseite',glyph:'home',on:true,summary:(model.StartTrigger==='tap'?'Antippen startet':'Buttons')+' · '+[model.ShowSingle&&'Einzelfoto',model.ShowCollage&&'Collage',model.ShowGallery&&'Galerie'].filter(Boolean).join(', '),preview:'home',build:flowStart},
  {id:'choose',title:'Vorlagenwahl',glyph:'th-large',optional:true,on:model.UnifiedTemplateSelection||singleChoice||collageChoice,summary:singleChoice||collageChoice?[singleChoice&&'Einzelfoto',collageChoice&&'Collage'].filter(Boolean).join(' & '):'feste Vorlage',preview:model.UnifiedTemplateSelection?'templates':collageChoice||!singleChoice?'layouts':'singleLayouts',build:flowChoose},
  {id:'capture',title:'Aufnahme',glyph:'clock-o',on:true,summary:`${model.CountdownSeconds} s Countdown`+(model.ShowCollage?` · Collage ${model.CollageCountdown} s`:''),preview:'capture',build:flowCapture},
  {id:'result',title:'Ergebnis',glyph:'picture-o',on:true,summary:[share&&'QR',model.FiltersEnabled&&'Filter',model.ShowRetake&&'Neu',model.ShowDelete&&'Löschen'].filter(Boolean).join(' · ')||'nur ansehen',preview:'result',build:flowResult},
  {id:'share',title:'Foto mitnehmen',glyph:'qrcode',optional:true,on:share,summary:share?(model.ResultAutoShare?'öffnet automatisch':({wifi:'WLAN + Foto-QR',network:'Foto-QR',public:'öffentlicher Link'})[model.DownloadMode]):'aus',preview:'downloadPreview',build:flowShare},
  {id:'gallery',title:'Galerie',glyph:'th',optional:true,on:model.ShowGallery,summary:model.ShowGallery?(model.GalleryNewestFirst?'neueste zuerst':'älteste zuerst'):'aus',preview:'gallery',build:flowGallery},
  {id:'end',title:'Zurück zum Start',glyph:'refresh',on:true,summary:`nach ${model.ReturnSeconds} s ohne Berührung`,preview:'home',build:flowEnd}
 ];
}
function flowPage(){
 const root=$('#content');root.className='flow-layout';

 const map=el('ol','flow-map');map.setAttribute('aria-label','Stationen des Gästeablaufs');root.append(map);
 const panel=el('div','flow-panel');root.append(panel);
 const paintMap=()=>{const stations=flowStations();map.replaceChildren();stations.forEach((s,i)=>{
  const li=el('li','flow-node'+(s.id===flowStep?' active':'')+(s.on?'':' off'));
  const b=button('',()=>{if(flowStep===s.id)return;flowStep=s.id;showStation();},'flow-node-button');b.setAttribute('aria-current',String(s.id===flowStep));
  const badge=el('span','flow-icon');badge.append(icon(s.glyph));const text=el('span','flow-text');text.append(el('strong','',s.title));
  const num=el('span','flow-num',String(i+1));b.append(badge,text,num);li.append(b);map.append(li);});};
 const showStation=()=>{
  resetConditions();const stations=flowStations();if(!stations.some(s=>s.id===flowStep))flowStep='start';const station=stations.find(s=>s.id===flowStep),index=stations.indexOf(station);
  paintMap();panel.replaceChildren();
  const c=card(panel,station.title,station.optional?'Optionale Station':null,{cls:'flow-station',icon:station.glyph});const body=el('div','station-body');c.append(body);station.build(body);
  const nav=el('div','station-nav');
  if(index>0)nav.append(button(stations[index-1].title,()=>{flowStep=stations[index-1].id;showStation();},'ghost small','arrow-left'));
  nav.append(el('span','spacer'));
  if(index<stations.length-1){const n=button(stations[index+1].title,()=>{flowStep=stations[index+1].id;showStation();},'ghost small');n.append(icon('arrow-right'));nav.append(n);}
  c.append(nav);preview(station.preview,{note:'Vorschau dieser Station · „Ausprobieren“ zum Durchklicken.'});updatePreview();
 };
 hooks.beforeChange.flowMap=paintMap;
 showStation();
}
hooks.beforeChange.push(()=>{if(route.page==='flow'&&$('.flow-map'))queueMicrotask(()=>hooks.beforeChange.flowMap?.());});
function flowIdle(b){
 fToggle(b,'IdleScreenEnabled','Bildschirmschoner verwenden',{hint:'Erscheint auf der Startseite, wenn niemand die Box benutzt. Eine Berührung führt zurück.'});
 const g=sub(b,'',()=>model.IdleScreenEnabled);
 fNumber(g,'IdleScreenSeconds','Erscheint nach',15,900,'s',{slider:true,step:5});
 fSegment(g,'IdleScreenMode','Inhalt',[['slideshow','Diashow','picture-o'],['text','Hinweistext','font']],{inline:true});
 g.append(linkButton('Text gestalten',()=>navigate('design','idle')));
}
function flowStart(b){
 const g=sub(b,'Angebote auf der Startseite');
 const modes=(k,v)=>{const other=k==='ShowSingle'?'ShowCollage':'ShowSingle';if(!v&&!model[other]){notify('Mindestens Einzelfoto oder Collage muss aktiv bleiben.','error');return false;}const values={[k]:v};if(!v&&model.StartTapAction===(k==='ShowSingle'?'photo':'collage'))values.StartTapAction=k==='ShowSingle'?'collage':'photo';applyMany(values);paintTap();};
 customToggle(g,'Einzelfoto',model.ShowSingle,v=>modes('ShowSingle',v),{id:fieldId('ShowSingle')});
 customToggle(g,'Collage',model.ShowCollage,v=>modes('ShowCollage',v),{id:fieldId('ShowCollage')});
 fToggle(g,'ShowGallery','Galerie',{hint:'Gäste sehen bisherige Fotos dieses Events.'});
 g.append(linkButton('Gemeinsamen Start und Vorlagenauswahl einstellen',()=>navigate('flow','',{step:'choose'})));
 const t=sub(b,'Start');
 fSegment(t,'StartTrigger','Start durch',[['buttons','Buttons','hand-pointer-o'],['tap','Bildschirm antippen','hand-o-up']],{inline:true});
 const tapRow=when(el('div'),()=>model.StartTrigger==='tap');t.append(tapRow);
 let tapSelect;const paintTap=()=>{tapRow.replaceChildren();tapSelect=fSegment(tapRow,'StartTapAction','Antippen startet',[...(model.ShowSingle?[['photo','Einzelfoto']]:[]),...(model.ShowCollage?[['collage','Collage']]:[])],{inline:true});};paintTap();
 b.append(linkButton('Texte, Hintergrund und Buttons gestalten',()=>navigate('design','home')));
}
function flowChoose(b){
 fToggle(b,'UnifiedTemplateSelection','Einzelfoto und Collage gemeinsam auswählen',{hint:'Ein Startbutton öffnet alle angebotenen Vorlagen ohne Gruppentitel.'});
 b.append(linkButton('Vorlagenauswahl gestalten',()=>navigate('design','templates')));
 if(model.ShowSingle){const g=sub(b,'Einzelfoto');templatePolicy(g,true);g.append(linkButton('Einzelfotovorlagen',()=>navigate('templates','single')));}
 if(model.ShowCollage){const g=sub(b,'Collage');templatePolicy(g,false);g.append(linkButton('Collagevorlagen',()=>navigate('templates','collage')));}
 fToggle(sub(b,'Darstellung'),'LayoutSelectionLive','Livebild hinter der Auswahl');
}
function flowCapture(b){
 let g=sub(b,'Countdown');
 if(model.ShowSingle)fNumber(g,'CountdownSeconds','Einzelfoto',1,15,'s',{slider:true});
 if(model.ShowCollage){fNumber(g,'CollageCountdown','Je Collagebild',1,15,'s',{slider:true});fNumber(g,'CollagePauseSeconds','Pause dazwischen',0,15,'s',{slider:true});fToggle(g,'CollageConfirmNext','Jedes Collagebild bestätigen',{hint:'Gäste sehen jede Aufnahme und starten das nächste Bild selbst.'});}
 g=sub(b,'Während der Aufnahme');fToggle(g,'ShowCancel','Abbrechen erlauben');fToggle(g,'Mirror','Livebild spiegeln',{hint:'Nur die Anzeige; gespeicherte Fotos bleiben seitenrichtig.'});
 g=sub(b,'Nach dem Auslösen');fNumber(g,'ShutterDurationMs','Blitzeffekt',0,2000,'ms',{step:50});fNumber(g,'ProcessingDelayMs','Verarbeitung mind.',0,5000,'ms',{step:100});
 b.append(linkButton('Countdown und Texte gestalten',()=>navigate('design','capture')));
}
function qrToggle(parent){return customToggle(parent,'Foto per QR-Code mitnehmen',showQr(),v=>{applyMany({ShowQr:v,ShowDownload:v?model.ShowDownload:false,...(v?{}:{ResultAutoShare:false})});$$('#'+fieldId('ShowQr')).forEach(i=>i.checked=v);},{id:fieldId('ShowQr')});}
function flowResult(b){
 const g=sub(b,'Angebote');qrToggle(g);
 const auto=when(el('div'),showQr);g.append(auto);fToggle(auto,'ResultAutoShare','QR-Code automatisch öffnen',{hint:'Downloadfenster erscheint direkt nach der Aufnahme.'});
 fToggle(g,'FiltersEnabled','Filter anbieten',{hint:'„Original“ bleibt immer verfügbar.'});
 const f=when(el('div'),()=>model.FiltersEnabled);g.append(f);
 const chips=el('div','chip-toggles');const paintChips=()=>{chips.replaceChildren();for(const [key,label]of Object.entries(filterNames)){const on=model.AllowedFilters.includes(key);const c=button(label,()=>{remember();model.AllowedFilters=on?model.AllowedFilters.filter(x=>x!==key):[...new Set([...model.AllowedFilters,key])];changed();paintChips();},'chip-toggle'+(on?' active':''),on?'check':'plus');c.setAttribute('aria-pressed',String(on));chips.append(c);}};paintChips();
 row(f,'Filter',chips);fToggle(f,'ResultAutoFilters','Filterauswahl automatisch öffnen');
 fToggle(g,'ShowRetake','Neue Aufnahme anbieten');fToggle(g,'ShowDelete','Löschen erlauben',{hint:'Mit Bestätigung; landet im Papierkorb der Box.'});
 b.append(linkButton('Ergebnisbildschirm gestalten',()=>navigate('design','result')));
}
function flowShare(b){
 qrToggle(b);const g=when(el('div'),showQr);b.append(g);
 fToggle(g,'ResultAutoShare','Nach jeder Aufnahme automatisch öffnen');
 const s=el('div','summary-box');statusRow(s,'Verbindung',({wifi:'Gäste-WLAN + Foto-QR',network:'Foto-QR im Netzwerk',public:'Öffentlicher Link'})[model.DownloadMode]);statusRow(s,'Downloadserver',model.DownloadEnabled?'Aktiv':'Aus',model.DownloadEnabled?'':'warn');statusRow(s,'Gäste-WLAN',model.WifiName||'Nicht eingetragen',model.DownloadMode==='wifi'&&!model.WifiName?'warn':'');g.append(s);
 g.append(linkButton('Verbindung und WLAN einrichten',()=>navigate('sharing')));
}
function flowGallery(b){
 fToggle(b,'ShowGallery','Galerie für Gäste');const g=when(el('div'),()=>model.ShowGallery);b.append(g);
 fSegment(g,'GalleryNewestFirst','Reihenfolge',[[true,'Neueste zuerst'],[false,'Älteste zuerst']],{inline:true});
 const q=when(el('div'),showQr);g.append(q);fToggle(q,'GalleryShowDownload','Mehrere Fotos gemeinsam herunterladen');fToggle(q,'ViewerShowDownload','Download im geöffneten Foto');
 const d=when(el('div'),()=>model.ShowDelete);g.append(d);fToggle(d,'ViewerShowDelete','Löschen im geöffneten Foto');
 g.append(linkButton('Galerie gestalten',()=>navigate('design','gallery')));
}
function flowEnd(b){
 fNumber(b,'ReturnSeconds','Zurück zum Start nach',10,300,'s',{slider:true,step:5,hint:'Gilt für Ergebnis, Galerie und Bildansicht ohne Berührung. Ein offenes Downloadfenster wird nicht unterbrochen.'});
}

/* =================== Gestaltung =================== */
const freePages={welcome:'welcome',home:'home',result:'result',gallery:'gallery',viewer:'viewer',selection:'selection',download:'download'};
const designPreview={style:'home',home:'home',capture:'capture',result:'result',gallery:'gallery',viewer:'viewer',selection:'selectionPreview',download:'downloadPreview',idle:'idle',messages:'error',welcome:'welcome',templates:'templates'};
const positionItems=[['bottom-center','Unten mittig'],['bottom-left','Unten links'],['bottom-right','Unten rechts'],['top-center','Oben mittig'],['center','Mitte']];
const corners=[['top-right','Oben rechts'],['top-left','Oben links'],['bottom-right','Unten rechts'],['bottom-left','Unten links'],['top-center','Oben mittig'],['bottom-center','Unten mittig']];
function designPage(){
 const subKey=route.sub,root=$('#content');root.className='design-layout';
 const free=freePages[subKey];
 if(free){
  const key=designKey(free);const mode=segmented([[false,'Standardaufbau','list-alt'],[true,'Frei gestalten','object-group']],!!model[key],v=>setFreeDesign(free,v),'Aufbau');mode.classList.add('mode-switch');
  $('#page-actions').append(mode);
  if(model[key]){freeScreenEditor(root,free);return;}
 }
 const form=el('div','form-column');form.dataset.keepScroll='design-form';root.append(form);
 ({style:designStyle,home:designHome,capture:designCapture,result:designResult,gallery:designGallery,viewer:designViewer,selection:designSelection,download:designDownload,templates:designTemplatePicker,welcome:designWelcome,idle:designIdle,messages:designMessages})[subKey](form);
 if(free)standardButtonPanel(form,free);
 preview(designPreview[subKey]);
}
function themeCard(parent,prefix,label){
 const c=card(parent,'Eigene Farben',`Nur für ${label}; sonst gilt der Grundstil.`,{icon:'tint'});fToggle(c,'Custom'+prefix+'Theme','Eigene Farben verwenden');
 const g=when(el('div'),()=>model['Custom'+prefix+'Theme']);c.append(g);for(const [k,t]of [['Background','Hintergrund'],['Foreground','Text'],['Button','Buttons']])fColor(g,prefix+k,t);
}
function positionCard(parent,prefix){
 const c=card(parent,'Buttons anordnen',null,{icon:'arrows'});fSegment(c,prefix+'ActionOrientation','Richtung',[['horizontal','Nebeneinander'],['vertical','Untereinander']],{inline:true});fSelect(c,prefix+'ActionPosition','Position',positionItems);
 const d=el('details','fine');d.append(el('summary','','Feinjustierung'));c.append(d);fNumber(d,prefix+'OffsetX','Horizontal',-40,40,'%',{slider:true});fNumber(d,prefix+'OffsetY','Vertikal',-40,40,'%',{slider:true});return c;
}
function designStyle(f){
 let c=card(f,'Farben','Gelten überall, wo kein Bildschirm eigene Farben hat.',{icon:'tint'});fColor(c,'BackgroundColor','Hintergrund');fColor(c,'ForegroundColor','Text');fColor(c,'ButtonColor','Buttons');fColor(c,'Accent','Akzent');
 c=card(f,'Schrift',null,{icon:'font'});fFont(c,'FontName','Schriftart');fNumber(c,'HeadingSize','Überschriften',24,72,'px');
 c=card(f,'Buttons',null,{icon:'square-o'});fNumber(c,'StartButtonWidth','Breite',120,400,'px');fNumber(c,'ButtonHeight','Höhe',44,100,'px');fNumber(c,'ButtonSize','Textgröße',14,30,'px');fNumber(c,'ButtonRadius','Rundung',0,40,'px',{slider:true});fToggle(c,'GlassButtons','Glaseffekt');
 c=card(f,'Größe',null,{icon:'arrows-alt'});fNumber(c,'UiScale','Oberfläche skalieren',40,200,'%',{slider:true,hint:'100 % entspricht der bisherigen Größe von 150 %. Bestehende Events behalten ihre Darstellung.'});
}
function designHome(f){
 if(model.UnifiedTemplateSelection){const start=card(f,'Gemeinsamer Start',null,{icon:'play'});fText(start,'UnifiedStartLabel','Buttontext',{required:true});}
 let c=card(f,'Hintergrund',null,{icon:'image'});
 if(model.HomeBackgroundMode==='auto')model.HomeBackgroundMode=model.ShowHomePreview?'live':model.StartBackgroundImage?'image':'color';
 row(c,'Art',segmented([['live','Livebild','video-camera'],['image','Bild','image'],['video','Video','film'],['color','Farbe','tint']],model.HomeBackgroundMode,v=>update('HomeBackgroundMode',v),'Hintergrund'),{cls:'stack-field'});
 const img=when(el('div'),()=>model.HomeBackgroundMode==='image');c.append(img);fAsset(img,'StartBackgroundImage','Hintergrundbild',{hint:'Wird flächenfüllend dargestellt.'});
 const vid=when(el('div'),()=>model.HomeBackgroundMode==='video');c.append(vid);fAsset(vid,'StartBackgroundVideo','Video oder GIF');
 c=card(f,'Begrüßung',null,{icon:'header'});fAsset(c,'StartLogo','Logo');fToggle(c,'ShowWelcome','Überschrift');
 const w=when(el('div'),()=>model.ShowWelcome);c.append(w);fText(w,'Welcome','Überschrift',{required:true});fText(w,'Subtitle','Untertitel',{max:200});
 c=card(f,'Beschriftungen',null,{icon:'tag'});
 const tap=when(el('div'),()=>model.StartTrigger==='tap');c.append(tap);fText(tap,'StartTapHint','Hinweis zum Antippen',{required:true});
 const btns=when(el('div'),()=>model.StartTrigger!=='tap');c.append(btns);
 if(model.ShowSingle)fText(btns,'SingleLabel','Einzelfoto',{required:true});if(model.ShowCollage)fText(btns,'CollageLabel','Collage',{required:true});
 if(model.ShowGallery)fText(c,'GalleryLabel','Galerie',{required:true});
 when(positionCard(f,'Home'),()=>model.StartTrigger!=='tap');
 themeCard(f,'Home','die Startseite');
}
function designCapture(f){
 let c=card(f,'Hinweis beim Auslösen',null,{icon:'smile-o'});fText(c,'CapturePrompt','Text',{placeholder:'Lächeln!'});fAsset(c,'CapturePromptImage','Stattdessen ein Bild',{hint:'Ersetzt den Text.'});
 c=card(f,'Countdown',null,{icon:'clock-o'});fNumber(c,'CountdownScale','Größe',30,200,'%',{slider:true});fColor(c,'CountdownColor','Farbe');fFont(c,'CountdownFontName','Schrift');fToggle(c,'CountdownAnimation','Zahlen animieren');
 fToggle(c,'CountdownRing','Ablaufender Kreis');const ring=when(el('div'),()=>model.CountdownRing);c.append(ring);fNumber(ring,'CountdownRingWidth','Kreisstärke',2,20,'px');fColor(ring,'CountdownRingColor','Kreisfarbe');
 c=card(f,'Verarbeitung',null,{icon:'cog'});fText(c,'CaptureProcessingText','Text Einzelfoto');if(model.ShowCollage)fText(c,'CollageProcessingText','Text Collage');fColor(c,'ProcessingColor','Text und Symbol');fColor(c,'ProcessingBackground','Hintergrund');
 if(model.ShowCollage){c=card(f,'Collageserie',null,{icon:'th-large'});fNumber(c,'CollageThumbWidth','Vorschaubilder',100,400,'px');fNumber(c,'CaptureReviewScale','Bild bei Bestätigung',40,90,'%',{slider:true});}
 c=card(f,'Abbrechen-Button',model.ShowCancel?null:'Im Gästeablauf ausgeschaltet.',{icon:'times'});const cancel=when(el('div'),()=>model.ShowCancel);c.append(cancel);fText(cancel,'CaptureCancelLabel','Beschriftung',{required:true,max:60});fColor(cancel,'CaptureCancelColor','Text');fColor(cancel,'CaptureCancelBackground','Hintergrund');fNumber(cancel,'CaptureCancelWidth','Breite',100,300,'px');fNumber(cancel,'CaptureCancelHeight','Höhe',40,80,'px');
}
function designResult(f){
 const deletion=card(f,'Löschbestätigung',null,{icon:'trash-o'});fNumber(deletion,'DeleteDialogScale','Fenstergröße',40,200,'%',{slider:true});
 let c=card(f,'Foto',null,{icon:'picture-o'});fNumber(c,'ResultScale','Größe',40,100,'%',{slider:true});fNumber(c,'ResultPhotoX','Horizontal',-50,50,'%',{slider:true});fNumber(c,'ResultPhotoY','Vertikal',-50,50,'%',{slider:true});fText(c,'ResultTitle','Bildbeschreibung',{required:true,hint:'Für Bildschirmleser.'});
 c=card(f,'Hintergrund',null,{icon:'image'});fToggle(c,'ResultBlur','Foto unscharf dahinter');const blur=when(el('div'),()=>model.ResultBlur);c.append(blur);fNumber(blur,'ResultBlurStrength','Unschärfe',0,60,'px',{slider:true});fNumber(blur,'ResultBackdropScale','Vergrößern',100,200,'%',{slider:true});
 c=card(f,'Beschriftungen',null,{icon:'tag'});fText(c,'HomeLabel','Startseite',{required:true});if(showQr())fText(c,'DownloadLabel','Download',{required:true});if(model.ShowRetake&&model.ShowSingle)fText(c,'NewPhotoLabel','Neues Foto',{required:true});if(model.ShowRetake&&model.ShowCollage)fText(c,'NewCollageLabel','Neue Collage',{required:true});if(model.ShowDelete)fText(c,'DeleteLabel','Löschen',{required:true});
 c=positionCard(f,'Result');fSelect(c,'ResultIconPosition','Symbolleiste',corners);
 themeCard(f,'Result','das Ergebnis');
}
function designGallery(f){
 let c=card(f,'Kopfbereich',null,{icon:'header'});fText(c,'GalleryTitle','Überschrift');fNumber(c,'GalleryTitleSize','Schriftgröße',18,60,'px');fColor(c,'GalleryTitleColor','Schriftfarbe');fColor(c,'GalleryHeaderBackground','Hintergrund');fNumber(c,'GalleryHeaderHeight','Höhe',100,220,'px');
 c=card(f,'Bildraster',null,{icon:'th'});fNumber(c,'GalleryColumns','Spalten',2,6,'',{slider:true});fSegment(c,'GalleryAspect','Kartenformat',[['photo','Foto'],['square','Quadrat']],{inline:true});fSegment(c,'GalleryFit','Bild',[[0,'Ganz'],[1,'Füllen']],{inline:true});
 fNumber(c,'GalleryGap','Abstand',4,48,'px',{slider:true});fNumber(c,'GallerySidePadding','Seitenrand',16,160,'px');fNumber(c,'GalleryTopGap','Abstand oben',10,80,'px');fNumber(c,'GalleryRadius','Ecken',0,30,'px',{slider:true});fToggle(c,'GalleryShadow','Schatten');fColor(c,'GalleryCardBackground','Kartenfarbe');
 c=card(f,'Datum und Uhrzeit',null,{icon:'clock-o'});fToggle(c,'GalleryShowDate','Anzeigen');const date=when(el('div'),()=>model.GalleryShowDate);c.append(date);fToggle(date,'GalleryOverlayCaption','Über dem Foto');fNumber(date,'GalleryCaptionSize','Schriftgröße',12,26,'px');fColor(date,'GalleryCaptionColor','Text');fColor(date,'GalleryCaptionBackground','Hintergrund');
 c=card(f,'Button „Startseite“',null,{icon:'home'});fNumber(c,'GalleryHomeWidth','Breite',120,360,'px');fNumber(c,'GalleryHomeHeight','Höhe',44,100,'px');fNumber(c,'GalleryHomeFontSize','Schriftgröße',14,30,'px');
 designSelection(f);standardButtonPanel(f,'selection');
 c=card(f,'Hintergrund und Schrift',null,{icon:'image'});fAsset(c,'GalleryBackgroundImage','Hintergrundbild');fFont(c,'GalleryFontName','Schrift',{allowGlobal:true});
 themeCard(f,'Gallery','die Galerie');
}
function designViewer(f){
 let c=card(f,'Darstellung',null,{icon:'expand'});fColor(c,'ViewerBackground','Hintergrund');fColor(c,'ViewerTextColor','Text');fNumber(c,'ViewerScale','Bildgröße',50,100,'%',{slider:true});fNumber(c,'ViewerPadding','Randabstand',12,80,'px');
 c=card(f,'Bildname und Zähler',null,{icon:'tag'});fToggle(c,'ViewerShowName','Dateiname');fToggle(c,'ViewerShowDate','Datum und Uhrzeit');fNumber(c,'ViewerNameSize','Schriftgröße Name',16,48,'px');fSelect(c,'ViewerNamePosition','Position Name',corners);fToggle(c,'ViewerShowCounter','Zähler „3 / 24“');fNumber(c,'ViewerCounterSize','Schriftgröße Zähler',16,48,'px');fSelect(c,'ViewerCounterPosition','Position Zähler',corners);
 c=card(f,'Aktionen',null,{icon:'hand-pointer-o'});fSegment(c,'ViewerActionOrientation','Richtung',[['horizontal','Nebeneinander'],['vertical','Untereinander']],{inline:true});fNumber(c,'ViewerActionSize','Symbolgröße',44,100,'px');fSelect(c,'ViewerActionPosition','Position',corners);fSelect(c,'ViewerClosePosition','Schließen',corners);
}
function designSelection(f){
 const c=card(f,'Auswahlleiste','Erscheint, wenn Gäste mehrere Fotos markieren.',{icon:'check-square-o'});fColor(c,'SelectionBackground','Hintergrund');fColor(c,'SelectionForeground','Text');fNumber(c,'SelectionOpacity','Deckkraft',0,100,'%',{slider:true});fNumber(c,'SelectionBlur','Unschärfe dahinter',0,40,'px',{slider:true});fNumber(c,'SelectionButtonWidth','Buttonbreite',120,360,'px');fNumber(c,'SelectionButtonHeight','Buttonhöhe',40,90,'px');fNumber(c,'SelectionFontSize','Schriftgröße',14,30,'px');
}
function designDownload(f){
 const scale=card(f,'Fenstergröße',null,{icon:'arrows-alt'});fNumber(scale,'DownloadDialogScale','QR-Fenster',40,200,'%',{slider:true});
 let c=card(f,'Fenster',null,{icon:'window-maximize'});fColor(c,'DownloadBackground','Hintergrund');fColor(c,'DownloadForeground','Text');fNumber(c,'DownloadOpacity','Deckkraft',0,100,'%',{slider:true});fNumber(c,'DownloadBlur','Unschärfe dahinter',0,40,'px',{slider:true});fNumber(c,'DownloadFontSize','Schriftgröße',14,30,'px');fNumber(c,'DownloadQrSize','QR-Code',160,340,'px',{slider:true});
 if(model.DownloadMode!=='network'){c=card(f,'Schritt 1 · WLAN','Nur sichtbar, wenn ein Gäste-WLAN eingetragen ist.',{icon:'wifi'});fText(c,'WifiStepTitle','Überschrift',{required:true});fText(c,'WifiInstructions','Hinweis',{multiline:true});fText(c,'ConnectedLabel','Button „Verbunden“',{required:true});}
 c=card(f,model.DownloadMode==='network'?'Foto öffnen':'Schritt 2 · Foto öffnen',null,{icon:'qrcode'});fText(c,'DownloadStepTitle','Überschrift',{required:true});fText(c,'DownloadInstructions','Hinweis',{multiline:true});fToggle(c,'ShowDownloadAlternative','Adresse und Code zusätzlich zeigen',{hint:'Für Handys ohne QR-Leser.'});
}
function designIdle(f){
 const enable=card(f,'Bildschirmschoner',null,{icon:'moon-o'});fToggle(enable,'IdleScreenEnabled','Bildschirmschoner verwenden');
 const c=card(f,'Text',null,{icon:'font'});fToggle(c,'IdleShowText','Hinweis anzeigen');fText(c,'IdleScreenText','Hinweis',{required:true});const d=card(f,'Diashow',null,{icon:'film'});fNumber(d,'IdleSlideSeconds','Wechsel nach',2,60,'s');fSelect(d,'IdlePhotoFit','Fotos',[['cover','Ausfüllen'],['contain','Ganz einpassen']]);fNumber(d,'IdlePhotoScale','Bildgröße',30,100,'%',{slider:true});fSelect(d,'IdleBackdrop','Hintergrund',[['blur','Aktuelles Foto weichgezeichnet'],['color','Farbe'],['image','Eigenes Bild']]);fColor(d,'IdleBackgroundColor','Hintergrundfarbe');fAsset(d,'IdleBackgroundImage','Hintergrundbild');
}
function setFreeDesign(page,on){
 remember();const key=designKey(page);model[key]=on;
 if(on){seedDesign(page);if(page==='home'){for(const area of model.ClickAreas||[])model.ScreenElements.push(seedElement(page,'clickarea','Klickfläche',area.Action,area.X,area.Y,area.Width,area.Height));model.UseClickAreas=false;}}
 changed();render();
}

/* =================== Fotovorlagen =================== */
function templatesPage(){templateEditor($('#content'),route.sub==='single');}

/* =================== Teilen =================== */
function sharingPage(){
 const root=$('#content');root.className='design-layout';const f=el('div','form-column');root.append(f);
 const off=when(el('div'),()=>!showQr());f.append(off);hintBox(off,'Am Ergebnis wird derzeit kein QR-Code angeboten.','warn').append(button('Im Gästeablauf aktivieren',()=>navigate('flow','',{step:'result'}),'small'));
 let c=card(f,'Verbindung','Wie das Handy des Gastes das Foto erreicht.',{icon:'link'});
 fSelect(c,'DownloadMode','Zugang zum Foto',[['wifi','Gäste-WLAN der Box'],['network','Vorhandenes Netzwerk'],['public','Öffentlicher Link']],{hint:'WLAN: ohne Internet. Netzwerk: Gäste sind bereits verbunden. Öffentlich: Box benötigt Internet.',onChange:v=>{if(v==='public'){applyMany({DownloadEnabled:true,ShowQr:true});const enabled=document.getElementById(fieldId('DownloadEnabled'));if(enabled)enabled.checked=true;}}});
 const pub=when(el('div'),()=>model.DownloadMode==='public');c.append(pub);hintBox(pub,'Temporärer Cloudflare-Tunnel ohne Konto und ohne Verfügbarkeitsgarantie. Die Adresse wechselt bei jedem Start; fällt er aus, bietet die Box den lokalen Download an.','warn');
 c=card(f,'Downloadserver',null,{icon:'server'});fToggle(c,'DownloadEnabled','Downloads erlauben',{hint:'Startet beim Kiosk einen kleinen Webserver auf dieser Box.'});
 const srv=when(el('div'),()=>model.DownloadEnabled);c.append(srv);fText(srv,'DownloadAddress','IPv4-Adresse der Box',{required:true,hint:'z. B. 192.168.0.10'});fNumber(srv,'DownloadPort','Port',1024,65535);fNumber(srv,'LinkMinutes','Links gültig',1,1440,'Min.');
 c=card(f,'Gäste-WLAN','Erzeugt den WLAN-QR-Code; der Router wird nicht verändert.',{icon:'wifi'});when(c,()=>model.DownloadMode!=='network');
 fText(c,'WifiName','WLAN-Name (SSID)');fSegment(c,'WifiSecurity','Verschlüsselung',[['WPA','WPA / WPA2'],['nopass','Offen']],{inline:true});
 const pw=when(el('div'),()=>model.WifiSecurity!=='nopass');c.append(pw);fSecret(pw,'wifi','WLAN-Passwort',!!model.WifiPasswordProtected,'Verschlüsselt gespeichert, nie angezeigt.');
 preview('downloadPreview');
}

/* =================== Box & System =================== */
function systemPage(){
 const root=$('#content');root.className='system-page';const access=remoteAccess||{};
 const gb=eventHealth.FreeBytes?eventHealth.FreeBytes/1073741824:null;
 /* Statuskacheln: der Zustand der Box auf einen Blick, Klick springt zur Karte. */
 const tiles=el('div','status-tiles');root.append(tiles);
 const tile=(target,glyph,title,value,kind)=>{const t=button('',()=>document.getElementById('sys-'+target)?.scrollIntoView({behavior:'smooth',block:'start'}),'status-tile '+kind);t.append(icon(glyph),el('span','tile-text'));t.lastChild.append(el('small','',title),el('strong','',value));tiles.append(t);};
 tile('camera','camera','Kamera',cameraReady?'Bereit':'Nicht verbunden',cameraReady?'ok':'warn');
 tile('access','lock','Admin-PIN',model.AdminPinHash?'Gesetzt':'Fehlt',model.AdminPinHash?'ok':'warn');
 tile('remote','mobile','Handy-Verwaltung',(access.urls||[]).length?'Erreichbar':'Nicht aktiv',(access.urls||[]).length?'ok':'muted');
 tile('backup','hdd-o','Speicher',gb===null?'Unbekannt':gb.toFixed(1)+' GB frei',gb!==null&&gb<2?'warn':gb===null?'muted':'ok');
 tile('backup','usb','USB-Sicherung',model.UsbAutoDetect?'Automatisch':model.UsbSyncEnabled?(model.UsbTarget?'Aktiv':'Ziel fehlt'):'Aus',model.UsbAutoDetect?'ok':model.UsbSyncEnabled?(model.UsbTarget?'ok':'warn'):'muted');

 const updateRow=el('div','button-row');updateRow.append(button('Software & Updates',showStudioUpdates,'small','refresh'));root.append(updateRow);
 const cols=el('div','system-columns');root.append(cols);const left=el('div','stack'),right=el('div','stack');cols.append(left,right);
 let c=card(left,'Kamera','Verbindung, Belichtung und Livebild.',{icon:'camera'});c.id='sys-camera';const camHost=el('div');camHost.id='camera-card';c.append(camHost);fillCameraCard(camHost);

 c=card(left,'Start der Box','Nach einem Neustart wird niemals automatisch ein Foto ausgelöst.',{icon:'power-off'});c.id='sys-start';
 customToggle(c,'Kamera automatisch verbinden',model.AutoConnect,v=>{applyMany(v?{AutoConnect:true}:{AutoConnect:false,LaunchDirect:false});$('#'+fieldId('LaunchDirect')).checked=model.LaunchDirect;},{id:fieldId('AutoConnect')});
 customToggle(c,'Direkt im Kiosk starten',model.LaunchDirect,v=>{applyMany(v?{LaunchDirect:true,AutoConnect:true}:{LaunchDirect:false});$('#'+fieldId('AutoConnect')).checked=model.AutoConnect;},{id:fieldId('LaunchDirect'),hint:'Schaltet die automatische Kameraverbindung mit ein.'});
 if(!window.remoteMode)fToggle(c,'WindowsAutostart','Mit Windows starten');

 c=card(left,'Fotos & Speicher',null,{icon:'hdd-o',actions:[iconButton('refresh','Speicher prüfen',()=>action('refreshHealth'),'ghost small')]});c.id='sys-backup';
 statusRow(c,'Freier Speicher',gb===null?'Unbekannt':gb.toFixed(1)+' GB');statusRow(c,'Fotos im Event',photoCount());
 statusRow(c,'Mediendateien',eventHealth.MissingAssets?.length?'Fehlen: '+eventHealth.MissingAssets.join(', '):'Alle vorhanden',eventHealth.MissingAssets?.length?'warn':'');
 fToggle(c,'SaveUnframedOriginals','Originale zusätzlich ohne Rahmen speichern');
 if(!window.remoteMode){const r=el('div','button-row');r.append(button('Bilderordner öffnen',()=>action('openPhotos'),'small','folder-open-o'));c.append(r);}

 c=card(right,'Adminzugang','Schützt das Verlassen des Kiosks und die Verwaltung per Handy.',{icon:'lock'});c.id='sys-access';
 fSecret(c,'pin','Admin-PIN',!!model.AdminPinHash,'4–8 Ziffern. Eine neue PIN meldet alle Browser ab.');
 customToggle(c,'PIN zum Verlassen des Kiosks',model.AdminEnabled,v=>{if(v&&!model.AdminPinHash){notify('Zuerst eine PIN übernehmen.','error');return false;}update('AdminEnabled',v);},{id:fieldId('AdminEnabled'),disabled:!model.AdminPinHash&&!model.AdminEnabled});
 fToggle(c,'HiddenAdminEntry','Verstecktes Admin-Feld',{hint:'Fünfmal unten rechts tippen öffnet im Kiosk den Adminbereich.'});

 c=card(right,'Verwaltung per Handy','Im selben WLAN öffnen und mit der Admin-PIN anmelden.',{icon:'mobile'});c.id='sys-remote';
 statusRow(c,'Status',access.status||'Wird gestartet …');
 if(!(access.urls||[]).length)c.append(el('p','hint muted-line','Noch keine Netzwerkadresse verfügbar.'));
 for(const url of access.urls||[]){const r=el('div','url-row');const a=el('a','network-url',url);a.href=url;a.target='_blank';a.rel='noopener';r.append(a,iconButton('copy','Adresse kopieren',()=>navigator.clipboard?.writeText(url).then(()=>notify('Adresse kopiert.','success')).catch(()=>{}),'ghost small'));c.append(r);}
 hintBox(c,model.AdminPinHash?'Nur im vertrauten Netzwerk verwenden – die Verbindung ist nicht verschlüsselt.':'Ohne Admin-PIN ist keine Anmeldung möglich.',model.AdminPinHash?'info':'warn');

 c=card(right,'USB-Sicherung','Kopiert Ergebnisbilder und Quellen geprüft; Löschungen werden nicht übertragen.',{icon:'usb'});
 fToggle(c,'UsbAutoDetect','USB-Sticks automatisch erkennen',{hint:'Einstecken genügt: Ergebnisbilder und Originale werden zusätzlich auf den Stick kopiert. Lokale Bilder bleiben erhalten.'});
 const device=el('div');device.id='usb-device-status';c.append(device);fillUsbDetails();
 const manual=when(el('div'),()=>!model.UsbAutoDetect);c.append(manual);
 const usb=el('div','usb-row'),target=el('div','usb-target');target.append(icon('folder-o'),el('span','',model.UsbTarget||'Kein Ziel zugeordnet'));usb.append(target,button('Ziel wählen',()=>action('usbFolder'),'small'));row(manual,'Manuelles Ziel',usb,{cls:'stack-field'});
 customToggle(manual,'Automatisch auf dieses Ziel sichern',model.UsbSyncEnabled,v=>{if(v&&!model.UsbTarget){notify('Zuerst ein Ziel wählen.','error');return false;}update('UsbSyncEnabled',v);},{id:fieldId('UsbSyncEnabled')});fToggle(manual,'UsbRequireRemovable','Nur auf Wechseldatenträger');
 c.append(button('Jetzt sichern',()=>action('sync'),'small','refresh'));

}

function flowWelcome(b){fToggle(b,'WelcomeScreenEnabled','Auftakt vor der Startseite',{hint:'Eine Berührung öffnet die eigentliche Startseite. Sie löst kein Foto aus.'});const g=sub(b,'',()=>model.WelcomeScreenEnabled);fToggle(g,'WelcomeScreenReturnOnHome','Nach einer Sitzung wieder zum Auftakt');g.append(linkButton('Auftakt gestalten',()=>navigate('design','welcome')));}
function designWelcome(f){const c=card(f,'Auftakt','Ein leerer Text zeigt nur deinen Hintergrund. Die ganze Fläche reagiert auf Antippen.',{icon:'hand-o-up'});fToggle(c,'WelcomeScreenEnabled','Auftakt verwenden');fText(c,'WelcomeScreenText','Hinweistext',{max:150});fAsset(c,'WelcomeScreenImage','Hintergrundbild');fColor(c,'WelcomeScreenColor','Hintergrundfarbe');fColor(c,'WelcomeTextColor','Textfarbe');fFont(c,'WelcomeTextFont','Schrift');fNumber(c,'WelcomeTextSize','Schriftgröße',12,160,'px');}
function designTemplatePicker(f){
 const screen=card(f,'Vorlagenauswahl',null,{icon:'th-large'});fColor(screen,'TemplatePickerBackground','Hintergrund');fToggle(screen,'LayoutSelectionLive','Livebild im Hintergrund');fToggle(screen,'TemplatePickerShowNames','Vorlagennamen anzeigen');fToggle(screen,'TemplatePickerShowCounts','Ergebnisse pro Vorlage anzeigen');
 const cardStyle=card(f,'Karten',null,{icon:'clone'});fToggle(cardStyle,'CustomTemplatePickerStyle','Eigene Kartengestaltung');const own=when(el('div'),()=>model.CustomTemplatePickerStyle);cardStyle.append(own);
 fNumber(own,'TemplatePickerScale','Gesamtskalierung',50,160,'%',{slider:true});fNumber(own,'TemplatePickerCardWidth','Kartenbreite',140,900,'px',{slider:true});fNumber(own,'TemplatePickerGap','Abstand',8,80,'px',{slider:true});fNumber(own,'TemplatePickerImageHeight','Vorschaubildhöhe',100,500,'px',{slider:true});fNumber(own,'TemplatePickerFontSize','Schriftgröße',14,48,'px');fColor(own,'TemplatePickerTextColor','Text');fColor(own,'TemplatePickerCardColor','Kartenfarbe');fNumber(own,'TemplatePickerCardOpacity','Deckkraft',0,100,'%',{slider:true});fNumber(own,'TemplatePickerBlur','Blur dahinter',0,40,'px',{slider:true,hint:'Bei einer transparenten Karte sichtbar.'});fNumber(own,'TemplatePickerRadius','Eckenrundung',0,100,'px');fColor(own,'TemplatePickerBorderColor','Umrandung');fNumber(own,'TemplatePickerBorderWidth','Randstärke',0,12,'px');fNumber(own,'TemplatePickerPadding','Innenabstand',0,60,'px');fNumber(own,'TemplatePickerShadow','Schatten',0,60,'px');
}

function designMessages(f){let c=card(f,'Fehlermeldungen',null,{icon:'exclamation-circle'});for(const [key,title]of [['CameraUnavailableText','Kamera nicht verbunden'],['FocusFailureText','Fokus nicht gefunden'],['CaptureFailureText','Aufnahme fehlgeschlagen'],['StorageFailureText','Foto konnte nicht gespeichert werden'],['NetworkFallbackText','Öffentlich zu lokal gewechselt'],['LocalNetworkMissingText','Lokales WLAN fehlt']])fText(c,key,title,{multiline:true,max:500,required:true});c=card(f,'Darstellung',null,{icon:'font'});fColor(c,'MessageBackground','Hintergrund');fColor(c,'MessageForeground','Text');fNumber(c,'MessageFontSize','Schriftgröße',16,48,'px');c=card(f,'Foto entfernen',null,{icon:'trash-o'});fText(c,'DeleteDialogTitle','Titel',{required:true});fText(c,'DeleteDialogText','Infotext',{multiline:true,max:500,required:true});fText(c,'DeleteConfirmText','Entfernen-Button',{required:true});fText(c,'DeleteCancelText','Behalten-Button',{required:true});}
