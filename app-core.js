'use strict';
/* SolidBooth Einrichtung · Kern: Zustand, Befehlsbrücke, Speichern, Rückgängig, Bausteine.
   Die Box (ProjectStore) bleibt die einzige Datenquelle. Jede Änderung läuft über dieselben
   Befehle wie bisher: save, switch, create, eventDetails, asset, secret, … */

let model=null,defaults={},eventPreviews={},eventHealth={},fonts=[],revisions=[],runtime={},remoteAccess={},cameraReady=false,cameraInfo=null,serverRevision=0,display=null,latestPhoto=null;
let dirty=false,saveTimer=null,queue=[],inflight=null,undo=[],redo=[],saveError='';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],copy=v=>structuredClone(v);
const hooks={model:[],beforeChange:[],runtime:[],device:[],view:null};

/* ---------- DOM-Helfer ---------- */
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined&&text!==null)n.textContent=text;return n;}
function icon(name){const n=el('i','fa fa-'+name);n.setAttribute('aria-hidden','true');return n;}
function button(text,fn,cls='',glyph){const b=el('button',cls);b.type='button';if(glyph)b.append(icon(glyph));if(text)b.append(el('span','',text));if(!text&&glyph)b.classList.add('icon-only');b.onclick=fn;return b;}
function iconButton(glyph,label,fn,cls=''){const b=button('',fn,cls,glyph);b.title=label;b.setAttribute('aria-label',label);return b;}
function mediaUrl(path){if(!path)return '';if(window.fotoboxPreviewMode&&path==='demo/neutral-background.png')return path;if(window.fotoboxPreviewMode)return 'demo/party-photo.png';return (window.remoteMode?'/media/':'https://media.local/')+encodeURIComponent(String(path).split(/[\\/]/).at(-1));}
function fileName(path){return path?String(path).split(/[\\/]/).at(-1):'';}
/* Bildschirm der Box: echte Größe des Kioskbildschirms (von der Box gemeldet), sonst dieser Bildschirm. */
function kioskSize(){const w=display?.width||screen.width||1280,h=display?.height||screen.height||720;return {width:Math.round(w),height:Math.round(h),ratio:w/h};}

/* ---------- Rückmeldungen ---------- */
function notify(text,kind='info'){
 const stack=$('#toast-stack');if(!stack||!text)return;
 const t=el('div','toast '+kind);t.setAttribute('role',kind==='error'?'alert':'status');
 t.append(icon(kind==='error'?'exclamation-circle':kind==='success'?'check-circle':'info-circle'),el('span','',text),iconButton('times','Meldung schließen',()=>t.remove(),'toast-close'));
 stack.append(t);while(stack.children.length>3)stack.firstChild.remove();
 setTimeout(()=>{t.classList.add('leaving');setTimeout(()=>t.remove(),300);},kind==='error'?9000:4500);
}
function state(text,kind=''){const n=$('#save-state');if(!n)return;n.querySelector('span').textContent=text;n.dataset.kind=kind;n.title=text;}
function refreshSaveState(){
 if(inflight&&inflight.cmd==='save')state('Speichert …','busy');
 else if(saveError)state('Nicht gespeichert','error');
 else if(dirty)state('Änderungen offen','dirty');
 else state('Gespeichert','ok');
 const u=$('#undo'),r=$('#redo');if(u)u.disabled=!undo.length;if(r)r.disabled=!redo.length;
}

/* ---------- Befehlsbrücke ---------- */
function command(cmd,extra={}){return new Promise((resolve,reject)=>{queue.push({cmd,extra,resolve,reject});dispatch();});}
function dispatch(){
 if(inflight||!queue.length)return;
 inflight=queue.shift();inflight.signature=model?JSON.stringify(model):'';
 if(!['save','ready','refreshHealth','cameraOptions'].includes(inflight.cmd))document.body.classList.add('busy');
 refreshSaveState();
 window.chrome.webview.postMessage({cmd:inflight.cmd,revision:serverRevision,...(model&&inflight.cmd!=='ready'?{settings:copy(model)}:{}),...inflight.extra});
}
function action(cmd,extra={}){clearTimeout(saveTimer);return command(cmd,extra).catch(()=>{});}
function scheduleSave(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>command('save').catch(()=>{}),600);}
function saveNow(){clearTimeout(saveTimer);return command('save').catch(()=>{});}

window.chrome.webview.addEventListener('message',e=>{
 const d=e.data;if(!d)return;
 if(d.revision!==undefined&&d.type!=='externalChange'&&!(d.type==='error'&&d.code==='conflict'))serverRevision=d.revision;
 if(d.type==='revision')return;
 if(d.type==='externalChange'){
  if(d.revision===serverRevision)return;
  if(!dirty&&!inflight&&!queue.length)command('ready').catch(()=>{});
  else{state('Auf anderem Gerät geändert','error');offerExternalReload();}
  return;
 }
 if(d.type==='updateProgress'){applyUpdateState(d.state);return;}
 if(d.type==='runtime'){runtime=d.runtime||{};if(d.cameraReady!==undefined)cameraReady=!!d.cameraReady;if(runtime.latestPhoto!==undefined)latestPhoto=runtime.latestPhoto;hooks.runtime.forEach(f=>f());return;}
 if(d.type==='device'){cameraReady=!!d.cameraReady;cameraInfo=d.camera||cameraInfo;hooks.device.forEach(f=>f());return;}
 if(d.type==='fonts'){fonts=d.fonts||fonts;$$('select[data-font-select]').forEach(fillFontSelect);return;}
 if(d.type==='cameraNotice'){notify(d.message,'error');return;}
 const job=inflight;inflight=null;document.body.classList.remove('busy');
 if(d.type==='error'){
  if(d.code==='conflict')offerExternalReload();
  saveError=d.message||'Nicht gespeichert';notify(d.message,'error');refreshSaveState();
  job?.reject(new Error(d.message));for(const q of queue)q.reject(new Error(d.message));queue=[];return;
 }
 if(d.type==='model'){
  runtime=d.runtime||runtime;remoteAccess=d.access||remoteAccess;model=d.settings;eventPreviews=d.eventPreviews||{};eventHealth=d.eventHealth||{};
  defaults=d.defaults||defaults;fonts=d.fonts||fonts;revisions=d.revisions||[];cameraReady=!!d.cameraReady;display=d.display||display;
  latestPhoto=d.latestPhoto!==undefined?d.latestPhoto:(runtime.latestPhoto??latestPhoto);
  dirty=false;saveError='';undo=[];redo=[];hooks.model.forEach(f=>f());render();refreshSaveState();
 }
 else if(d.type==='saved'){saveError='';dirty=job?.signature!==JSON.stringify(model);if(dirty)scheduleSave();refreshSaveState();}
 else if(d.type==='notice'){saveError='';notify(d.message,'success');refreshSaveState();}
 job?.resolve(d);dispatch();
});

/* ---------- Modell bearbeiten ---------- */
function get(path){return path.split('.').reduce((o,k)=>o?.[k],model);}
function set(path,value){const p=path.split('.');let target=model;for(const part of p.slice(0,-1))target=target[part];target[p.at(-1)]=value;}
function remember(){undo.push(copy(model));if(undo.length>80)undo.shift();redo=[];}
/* Vorschau und abhängige Felder höchstens etwa 30-mal pro Sekunde aktualisieren (z. B. beim Ziehen eines Schiebereglers). */
let viewRefreshTimer=0;
function scheduleViewRefresh(){if(viewRefreshTimer)return;viewRefreshTimer=setTimeout(()=>{viewRefreshTimer=0;updatePreview();refreshConditions();},32);}
function changed(){hooks.beforeChange.forEach(f=>f());dirty=true;saveError='';refreshSaveState();scheduleSave();scheduleViewRefresh();}
function update(path,value){
 remember();set(path,value);
 if(path.startsWith('ScreenElements.')&&path.endsWith('.Binding')&&value===''){const item=get(path.split('.').slice(0,-1).join('.'));if(item.Kind==='viewport')item.Kind='image';}
 if(typeof editorAfterUpdate==='function')editorAfterUpdate(path);
 changed();
}
/* Zusammengehörige Änderungen als ein Rückgängig-Schritt, ohne die Seite neu aufzubauen. */
function applyMany(values,opts={}){remember();for(const [k,v]of Object.entries(values))set(k,v);changed();if(opts.render)render();}
function refreshView(){if(typeof hooks.view==='function')hooks.view();else render();}
function undoStep(){if(!undo.length)return;redo.push(copy(model));model=undo.pop();changed();refreshView();}
function redoStep(){if(!redo.length)return;undo.push(copy(model));model=redo.pop();changed();refreshView();}
function currentEvent(){return model.Events.find(e=>e.Id===model.ActiveEvent)||model.Events[0];}
function formatDate(value){if(!value)return '';const d=new Date(value+'T12:00:00');return isNaN(d)?value:d.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'});}

/* ---------- Bedingte Bereiche ohne Neuaufbau (keine Sprünge) ---------- */
let conditions=[];
function when(node,test){conditions.push([node,test]);node.hidden=!test();return node;}
function refreshConditions(){conditions=conditions.filter(([n])=>n.isConnected);for(const [n,t]of conditions){const show=!!t();if(n.hidden===show)n.hidden=!show;}}
function resetConditions(){conditions=[];}
function group(parent){const g=el('div','field-group');parent.append(g);return g;}

/* ---------- Formularbausteine ---------- */
let fieldSeq=0;
function fieldId(path){return 'setting-'+path.replaceAll('.','-');}
function card(parent,title,hint,opts={}){
 const s=el('section','card'+(opts.cls?' '+opts.cls:''));
 if(title||opts.actions){const h=el('div','card-head');const t=el('div','card-titles');if(opts.icon){const i=el('span','card-icon');i.append(icon(opts.icon));h.append(i);}if(title)t.append(el('h2','',title));if(hint)t.append(el('p','hint',hint));h.append(t);if(opts.actions){const a=el('div','card-actions');a.append(...opts.actions);h.append(a);}s.append(h);}
 parent.append(s);return s;
}
function row(parent,label,control,opts={}){
 const r=el('div','field'+(opts.cls?' '+opts.cls:''));const head=el('div','field-label');const l=el('label','',label);head.append(l);
 if(opts.reset)head.append(opts.reset);
 if(opts.hint)head.append(el('small','hint',opts.hint));
 r.append(head);const c=el('div','field-control');c.append(control);r.append(c);
 const focusable=control.classList?.contains('color-picker')?control.querySelector('button'):control.matches?.('input,select,textarea')?control:control.querySelector?.('input:not([type=color]),select,textarea');
 if(focusable){if(!focusable.id)focusable.id='f'+(++fieldSeq);l.htmlFor=focusable.id;}
 parent.append(r);return r;
}
function resetButton(path,label){
 if(path.includes('.')||defaults[path]===undefined)return null;
 return iconButton('undo',label+' auf Standard zurücksetzen',()=>{update(path,copy(defaults[path]));refreshView();},'setting-reset');
}
function switchInput(checked,onChange,id){const input=el('input');input.type='checkbox';input.className='switch';input.checked=!!checked;input.setAttribute('role','switch');if(id)input.id=id;input.onchange=()=>{if(onChange(input.checked)===false)input.checked=!input.checked;};return input;}
function fToggle(parent,path,label,opts={}){
 const input=switchInput(get(path),v=>{if(opts.guard&&!opts.guard(v))return false;update(path,v);opts.onChange?.(v);if(opts.rerender)refreshView();},fieldId(path));input.disabled=!!opts.disabled;
 row(parent,label,input,{hint:opts.hint,cls:'toggle-field',reset:opts.noReset?null:resetButton(path,label)});return input;
}
function fNumber(parent,path,label,min,max,unit='',opts={}){
 const factor=['UiScale','CountdownScale'].includes(path)?1.5:['DeleteDialogScale','DownloadDialogScale'].includes(path)?1.2:1;const display=v=>factor===1?v:Math.round(v/factor),stored=v=>factor===1?v:Math.round(v*factor);
 const wrap=el('div','number-control'),input=el('input');input.type='number';input.min=min;input.max=max;input.step=opts.step||1;input.value=display(get(path))??'';input.id=fieldId(path);input.inputMode='decimal';
 let range;if(opts.slider){range=el('input','range');range.type='range';range.min=min;range.max=max;range.step=opts.step||1;range.value=display(get(path))??min;range.setAttribute('aria-label',label);let started=false;range.oninput=()=>{if(!started){remember();started=true;}input.value=range.value;set(path,stored(Number(range.value)));if(typeof editorAfterUpdate==='function')editorAfterUpdate(path);changed();};range.onchange=()=>{started=false;opts.onChange?.(Number(range.value));};wrap.append(range);}
 input.onchange=()=>{const v=Number(input.value);if(input.value===''||!Number.isFinite(v)||v<min||v>max){notify(`${label}: Wert zwischen ${min} und ${max} eingeben.`,'error');input.value=display(get(path));return;}update(path,stored(v));if(range)range.value=v;opts.onChange?.(v);if(opts.rerender)refreshView();};
 wrap.append(input);if(unit)wrap.append(el('span','unit',unit));
 row(parent,label,wrap,{hint:opts.hint,reset:resetButton(path,label),cls:opts.slider?'slider-field':''});return input;
}
function fText(parent,path,label,opts={}){
 const input=el(opts.multiline?'textarea':'input');if(!opts.multiline)input.type='text';input.value=get(path)??'';input.maxLength=opts.max||(path.includes('Instructions')?500:100);input.id=fieldId(path);input.autocomplete='off';if(opts.placeholder)input.placeholder=opts.placeholder;if(opts.multiline)input.rows=opts.rows||2;
 input.onchange=()=>{if(opts.required&&!input.value.trim()){notify(label+' darf nicht leer sein.','error');input.value=get(path);return;}update(path,input.value);opts.onChange?.(input.value);if(opts.rerender)refreshView();};
 row(parent,label,input,{hint:opts.hint,reset:resetButton(path,label),cls:opts.multiline?'stack-field':''});return input;
}
function selectControl(items,value,onChange){
 const s=el('select');for(const item of items){const [v,t]=Array.isArray(item)?item:[item,item];const o=el('option','',t);o.value=v;s.append(o);}
 s.value=String(value);s.onchange=()=>onChange(s.value);return s;
}
function fSelect(parent,path,label,items,opts={}){
 const value=get(path);const s=selectControl(items,value,v=>{update(path,typeof value==='number'?Number(v):v);opts.onChange?.(v);if(opts.rerender)refreshView();});s.id=fieldId(path);
 row(parent,label,s,{hint:opts.hint,reset:resetButton(path,label)});return s;
}
function segmented(items,value,onChange,label){
 const g=el('div','segmented');g.setAttribute('role','radiogroup');if(label)g.setAttribute('aria-label',label);
 const paint=v=>{for(const b of g.children){const on=b.dataset.value===String(v);b.classList.toggle('active',on);b.setAttribute('aria-checked',String(on));}};
 for(const [v,t,glyph]of items){const b=button(t,()=>{if(b.dataset.value===g.dataset.value)return;g.dataset.value=b.dataset.value;paint(b.dataset.value);onChange(v);},'',glyph);b.dataset.value=String(v);b.setAttribute('role','radio');if(!t&&glyph){b.title=b.title||String(v);}g.append(b);}
 g.dataset.value=String(value);paint(value);g.setValue=v=>{g.dataset.value=String(v);paint(v);};return g;
}
function fSegment(parent,path,label,items,opts={}){
 const value=get(path);const g=segmented(items,value,v=>{update(path,typeof value==='number'?Number(v):v);opts.onChange?.(v);if(opts.rerender)refreshView();},label);g.id=fieldId(path);
 row(parent,label,g,{hint:opts.hint,reset:resetButton(path,label),cls:items.length>2&&!opts.inline?'stack-field':''});return g;
}

/* ---------- Farben: Farbfeld + Hex + im Projekt verwendete Farben ---------- */
const hexColor=/^#[\da-f]{6}$/i;
const presetColors=['#FFFFFF','#000000','#191919','#303033','#A6C7D8','#E8C547','#E5677A','#7FCF9A','#4A90D9','#9B6BD6','#F29E4C','#C9C9C9'];
function projectColors(limit=18){
 const counts=new Map();const walk=v=>{if(typeof v==='string'){if(hexColor.test(v)){const k=v.toUpperCase();counts.set(k,(counts.get(k)||0)+1);}}else if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')Object.values(v).forEach(walk);};
 walk(model);return [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,limit).map(e=>e[0]);
}
let colorPopover=null;
function closeColorPopover(){colorPopover?.remove();colorPopover=null;}
function openColorPopover(anchor,value,onPick,onLive){
 closeColorPopover();const pop=el('div','popover-menu color-popover');pop.setAttribute('role','dialog');pop.setAttribute('aria-label','Farbe wählen');
 const top=el('div','color-top'),native=el('input'),hex=el('input');native.type='color';native.value=hexColor.test(value)?value:'#000000';hex.value=(value||'').toUpperCase();hex.maxLength=7;hex.spellcheck=false;hex.setAttribute('aria-label','Hexwert');
 let started=false;native.oninput=()=>{hex.value=native.value.toUpperCase();if(!started){started=true;onLive?.('start');}onLive?onLive(native.value.toUpperCase()):null;};native.onchange=()=>{onPick(native.value.toUpperCase());started=false;};
 hex.onchange=()=>{let v=hex.value.trim();if(/^[\da-f]{6}$/i.test(v))v='#'+v;if(!hexColor.test(v)){notify('Farbe als #RRGGBB eingeben.','error');return;}native.value=v;onPick(v.toUpperCase());};
 hex.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();hex.onchange();closeColorPopover();}};
 top.append(native,hex);pop.append(top);
 const swatches=(title,list)=>{if(!list.length)return;pop.append(el('div','color-title',title));const g=el('div','swatches');for(const c of list){const s=el('button','swatch'+(c===String(value).toUpperCase()?' active':''));s.type='button';s.style.background=c;s.title=c;s.setAttribute('aria-label',c);s.onclick=()=>{onPick(c);closeColorPopover();};g.append(s);}pop.append(g);};
 swatches('Im Projekt verwendet',projectColors());swatches('Standard',presetColors.filter(c=>!projectColors().includes(c)));
 document.body.append(pop);const r=anchor.getBoundingClientRect();pop.style.top=Math.max(8,Math.min(r.bottom+6,innerHeight-pop.offsetHeight-8))+'px';pop.style.left=Math.max(8,Math.min(r.left,innerWidth-pop.offsetWidth-8))+'px';colorPopover=pop;if(!matchMedia('(pointer:coarse)').matches){hex.focus();hex.select();}else{const first=pop.querySelector('button');first?.focus({preventScroll:true});}
}
document.addEventListener('pointerdown',e=>{if(colorPopover&&!colorPopover.contains(e.target)&&!e.target.closest('.color-swatch-button'))closeColorPopover();});
function colorControl(value,onPick,opts={}){
 const wrap=el('div','color-picker'),sw=el('button','color-swatch-button'),hex=el('input');sw.type='button';sw.style.setProperty('--swatch',value||'transparent');sw.setAttribute('aria-label',(opts.label||'Farbe')+' wählen');sw.title='Farbe wählen · im Projekt verwendete Farben';
 hex.value=(value||'').toUpperCase();hex.maxLength=7;hex.spellcheck=false;if(opts.id)hex.id=opts.id;hex.setAttribute('aria-label',(opts.label||'Farbe')+' als Hexwert');
 const paint=v=>{v=v||'';sw.style.setProperty('--swatch',v||'transparent');hex.value=v.toUpperCase();};
 const pick=v=>{paint(v);onPick(v.toUpperCase());};
 sw.onclick=()=>{if(colorPopover?.anchor===sw){closeColorPopover();return;}openColorPopover(sw,hex.value,pick,opts.onLive?v=>{if(v==='start')return opts.onLive('start');paint(v);opts.onLive(v);}:null);};
 hex.onchange=()=>{let v=hex.value.trim();if(/^[\da-f]{6}$/i.test(v))v='#'+v;if(!hexColor.test(v)){notify('Farbe als #RRGGBB eingeben.','error');hex.value=value;return;}pick(v);};
 wrap.append(sw,hex);wrap.setValue=paint;return wrap;
}
function fColor(parent,path,label,opts={}){
 let liveStarted=false;
 const control=colorControl(get(path),v=>{if(liveStarted){liveStarted=false;set(path,v);if(typeof editorAfterUpdate==='function')editorAfterUpdate(path);changed();}else update(path,v);opts.onChange?.(v);},{label,id:fieldId(path),onLive:v=>{if(v==='start'){remember();liveStarted=true;return;}set(path,v);if(typeof editorAfterUpdate==='function')editorAfterUpdate(path);changed();}});
 row(parent,label,control,{hint:opts.hint,reset:resetButton(path,label)});return control.querySelector('input');
}
function fillFontSelect(sel){const value=sel.value||sel.dataset.value;const list=[...new Set([...(sel.dataset.allowGlobal?['']:[]),'Segoe UI','Dosis',...fonts,value].filter(v=>v!==undefined))];sel.replaceChildren(...list.map(f=>{const o=el('option','',f||'Globale Schrift');o.value=f;if(f)o.style.fontFamily=f;return o;}));sel.value=value;}
function fontSelect(value,onChange,allowGlobal=false){const s=el('select');s.dataset.fontSelect='1';s.dataset.value=value||'';if(allowGlobal)s.dataset.allowGlobal='1';fillFontSelect(s);s.style.fontFamily=value||'inherit';s.onchange=()=>{s.style.fontFamily=s.value||'inherit';onChange(s.value);};return s;}
function fFont(parent,path,label,opts={}){
 const s=fontSelect(get(path),v=>update(path,v),opts.allowGlobal);s.id=fieldId(path);
 row(parent,label,s,{hint:opts.hint,reset:resetButton(path,label)});return s;
}
function assetControl(value,choose,remove,opts={}){
 const wrap=el('div','asset-control');
 const thumb=el('div','asset-thumb');if(value&&!/\.(mp4|webm)$/i.test(value)){const img=el('img');img.alt='';img.src=mediaUrl(value);thumb.append(img);}else thumb.append(icon(value?'film':'image'));
 const info=el('div','asset-info');info.append(el('strong','',value?fileName(value):(opts.empty||'Keine Datei')),el('small','',opts.formats||'PNG, JPG oder GIF · bis 64 MB'));
 const actions=el('div','asset-actions');actions.append(button(value?'Ersetzen':'Auswählen',choose,'small',value?'refresh':'upload'));if(value&&remove)actions.append(iconButton('trash-o','Datei entfernen',remove,'ghost small'));
 wrap.append(thumb,info,actions);return wrap;
}
function fAsset(parent,path,label,opts={}){
 const value=get(path);
 const control=assetControl(value,()=>action('asset',{key:opts.key||path,...(opts.extra||{})}),()=>{remember();set(path,'');opts.onRemove?.();changed();refreshView();},{formats:path==='StartBackgroundVideo'?'MP4, WebM oder GIF · bis 64 MB':undefined});
 row(parent,label,control,{hint:opts.hint,cls:'asset-field'});if(value&&['StartBackgroundImage','WelcomeScreenImage','GalleryBackgroundImage','StartLogo','PhotoFrame','IdleBackgroundImage','StartBackgroundVideo','CapturePromptImage'].includes(path))mediaPlacementFields(parent,path);return control;
}
function fSecret(parent,key,label,saved,hint){
 const wrap=el('div','secret-control'),input=el('input');input.type='password';input.placeholder=saved?'Gespeichert · neu eingeben':'Noch nicht hinterlegt';input.autocomplete='new-password';if(key==='pin'){input.inputMode='numeric';input.maxLength=8;}
 const apply=button('Übernehmen',()=>{const v=input.value;if(!v){input.focus();return;}if(key==='pin'&&!/^\d{4,8}$/.test(v)){notify('PIN: 4 bis 8 Ziffern eingeben.','error');return;}input.value='';action('secret',{key,value:v}).then(()=>notify(key==='pin'?'PIN gespeichert.':'WLAN-Passwort gespeichert.','success'));},'small');
 input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();apply.click();}};
 wrap.append(input,apply);const r=row(parent,label,wrap,{hint});r.querySelector('.field-label').append(el('span','badge '+(saved?'ok':'warn'),saved?'Hinterlegt':'Fehlt'));return input;
}
function hintBox(parent,text,kind='info'){const n=el('div','callout '+kind);n.append(icon(kind==='warn'?'exclamation-triangle':kind==='ok'?'check-circle':'info-circle'),el('p','',text));parent.append(n);return n;}
function linkButton(text,fn,glyph='arrow-right'){const b=button(text,fn,'link-button');b.append(icon(glyph));return b;}

/* ---------- Symbolauswahl ---------- */
const iconChoices=['camera','camera-retro','picture-o','th-large','th','film','qrcode','download','share-alt','envelope-o','print','home','arrow-left','arrow-right','angle-left','angle-right','chevron-left','chevron-right','times','check','trash-o','undo','refresh','adjust','magic','star','heart','smile-o','hand-pointer-o','hand-o-up','thumbs-o-up','gift','glass','birthday-cake','music','bolt','sun-o','moon-o','user-o','users','info-circle','question-circle','play','pause','expand','compress','search','cog','lock','unlock'];
function openIconPicker(anchor,value,onPick){
 closeColorPopover();const pop=el('div','popover-menu icon-popover');pop.setAttribute('role','dialog');pop.setAttribute('aria-label','Symbol wählen');
 const none=button('Kein Symbol',()=>{onPick('');closeColorPopover();},'small'+(value?'':' active'),'ban');pop.append(none);
 const g=el('div','icon-grid');for(const name of iconChoices){const b=iconButton(name,name.replace(/-o$/,'').replace(/-/g,' '),()=>{onPick(name);closeColorPopover();},'icon-choice'+(name===value?' active':''));g.append(b);}pop.append(g);
 document.body.append(pop);const r=anchor.getBoundingClientRect();pop.style.top=Math.max(8,Math.min(r.bottom+6,innerHeight-pop.offsetHeight-8))+'px';pop.style.left=Math.max(8,Math.min(r.left,innerWidth-pop.offsetWidth-8))+'px';colorPopover=pop;
}

/* ---------- Dialoge ---------- */
function openDialog(title,build,opts={}){
 return new Promise(resolve=>{
  const d=el('dialog','app-dialog'+(opts.cls?' '+opts.cls:''));const f=el('form');f.method='dialog';
  const head=el('header');head.append(el('h2','',title));head.append(iconButton('times','Schließen',()=>d.close('cancel'),'ghost'));f.append(head);
  const body=el('div','dialog-body');f.append(body);const actions=el('div','dialog-actions');
  let result;const ctx={close:v=>{result=v;d.close('ok');},body,dialog:d};
  build(body,ctx);
  if(opts.cancel!==false){const c=button(opts.cancelText||'Abbrechen',()=>d.close('cancel'));actions.append(c);}
  if(opts.confirm){const ok=button(opts.confirm,()=>{if(opts.validate&&!opts.validate(body))return;result=opts.value?opts.value(body):true;d.close('ok');},opts.danger?'danger':'primary',opts.confirmIcon);ok.dataset.role='confirm';actions.append(ok);}
  if(actions.children.length)f.append(actions);
  f.onsubmit=e=>{e.preventDefault();actions.querySelector('[data-role=confirm]')?.click();};
  d.append(f);document.body.append(d);d.addEventListener('close',()=>{opts.onClose?.();d.remove();resolve(d.returnValue==='ok'?result:undefined);});d.showModal();
  (body.querySelector('input:not([type=checkbox]),select,textarea')||actions.querySelector('[data-role=confirm]')||actions.firstChild)?.focus();
 });
}
function confirmDialog(title,text,confirm='Bestätigen',opts={}){return openDialog(title,b=>b.append(el('p','',text)),{confirm,danger:opts.danger,confirmIcon:opts.icon}).then(v=>v===true);}
function confirmAction(title,description,accept){confirmDialog(title,description,'Entfernen',{danger:true,icon:'trash-o'}).then(ok=>{if(ok)accept();});}

function offerExternalReload(){
 if(window.remoteMode||$('.sync-conflict'))return;
 const bar=el('div','sync-conflict');bar.setAttribute('role','status');
 bar.append(icon('exclamation-triangle'),el('span','','Auf einem anderen Gerät geändert. Deine offenen Eingaben bleiben erhalten.'),button('Stand der Box laden',async()=>{if(await confirmDialog('Stand der Box laden?','Offene Eingaben werden verworfen. Gespeicherte Einstellungen bleiben erhalten.','Eingaben verwerfen',{danger:true})){bar.remove();action('ready');}},'small'));
 document.body.append(bar);
}
