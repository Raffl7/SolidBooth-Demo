'use strict';
/* SolidBooth Einrichtung · Gestaltungs-Editor (eine Engine für Bildschirme, Collagen und Einzelfotos).
   Wie ein Folieneditor: Menüband, Mehrfachauswahl (Shift/Strg, Rahmen ziehen), Ausrichten und Verteilen,
   Zoom, dezente Hilfslinien, Text direkt auf Texten und Buttons, Eigenschaften ohne Neuaufbau.
   Gespeichert wird ausschließlich in den bekannten Feldern (ScreenElements, CollageTemplates, PhotoInset…). */

let selectedElement=-1,selectedSlot=-1,layoutIndex=0,singleIndex=-1,editorPage='',editorMenu=null,editorClipboard=null;
const ed={cleanups:[],kind:'',page:'',sel:new Set(),zoom:0,snap:true,grid:false,shell:null,stage:null,canvas:null,layers:null,inspector:null,ribbon:null,list:null,open:{content:true,text:true,box:false,pos:true,layer:false,slide:true},guides:[]};
const SNAP_PX=5,ROTATE_MAGNET=2;
const elementActions=[['activate','Fotobox aktivieren'],['chooseTemplate','Alle Vorlagen auswählen'],['photo','Einzelfoto starten'],['collage','Collage starten'],['gallery','Galerie öffnen'],['home','Zur Startseite'],['download','Foto herunterladen'],['filters','Filter wählen'],['confirmDelete','Foto löschen'],['previous','Vorheriges Bild'],['next','Nächstes Bild'],['selectionMode','Mehrfachauswahl starten'],['downloadSelection','Auswahl herunterladen'],['endSelection','Auswahl beenden'],['dismiss','Fenster schließen'],['connected','WLAN verbunden'],['expandResult','Bild vergrößern'],['closeGallery','Galerie schließen']];
const photoKeys={Frame:'PhotoFrame',Caption:'PhotoCaption',Background:'PhotoBackground',Width:'PhotoOutputWidth',Height:'PhotoOutputHeight',Left:'PhotoInsetLeft',Right:'PhotoInsetRight',Top:'PhotoInsetTop',Bottom:'PhotoInsetBottom',Fit:'PhotoFitMode'};
const singleFormats=[['0','Kameraformat · 3:2'],['1800x1200','Querformat · 3:2'],['1200x1800','Hochformat · 2:3'],['1800x1800','Quadrat · 1:1'],['1800x1013','Breitbild · 16:9'],['1200x1500','Porträt · 4:5']];
function editorResetSelection(){ed.sel.clear();selectedElement=-1;selectedSlot=-1;}
hooks.model.push(()=>{singleIndex=-1;layoutIndex=0;editorResetSelection();});

/* =================== Elemente anlegen =================== */
function seedElement(page,kind,text,action,x,y,w,h,extra={}){return {Id:crypto.randomUUID(),Page:page,Kind:kind,Text:text,Action:action||'home',X:x,Y:y,Width:w,Height:h,FontSize:24,Rotation:0,Image:'',Foreground:'#FFFFFF',Background:model.ButtonColor||'#303033',BorderColor:'#FFFFFF',BorderWidth:0,Radius:12,Blur:0,Opacity:100,Transparent:kind!=='button',Font:model.FontName||'Segoe UI',Bold:false,Italic:false,Shadow:0,Align:'center',Icon:'',Binding:'',ImageFit:kind==='image'?'cover':'contain',Locked:false,Visible:true,AspectRatio:0,...extra};}
function seedDesign(page){
 if(model.ScreenElements.some(e=>e.Page===page))return;const add=(...a)=>model.ScreenElements.push(seedElement(page,...a));
 if(page==='welcome'){add('text',model.WelcomeScreenText||'Zum Starten antippen','activate',.2,.6,.6,.12,{FontSize:model.WelcomeTextSize||32,Font:model.WelcomeTextFont||'Segoe UI',Foreground:model.WelcomeTextColor||'#FFFFFF'});add('button','Start','activate',.4,.78,.2,.09,{Icon:'hand-pointer-o'});}
 if(page==='home'){if(model.ShowWelcome)add('text',model.Welcome,'home',.1,.12,.8,.12,{FontSize:52});const actions=model.UnifiedTemplateSelection?[[model.UnifiedStartLabel||'Start','chooseTemplate','camera'],...(model.ShowGallery?[[model.GalleryLabel,'gallery','picture-o']]:[])]:[...(model.ShowSingle?[[model.SingleLabel,'photo','camera']]:[]),...(model.ShowCollage?[[model.CollageLabel,'collage','th-large']]:[]),...(model.ShowGallery?[[model.GalleryLabel,'gallery','picture-o']]:[])];actions.forEach((a,i)=>add('button',a[0],a[1],.15+i*.24,.8,.22,.09,{Icon:a[2]}));}
 if(page==='result'||page==='viewer'){add('viewport','Foto','home',.08,.08,.84,.8,{Binding:'photo'});if(page==='result'){add('button',model.DownloadLabel,'download',.25,.86,.22,.09,{Icon:'qrcode'});add('button','Startseite','home',.53,.86,.22,.09,{Icon:'home'});}else{add('text','Bildname','home',.03,.03,.6,.06,{Binding:'filename',Align:'left'});add('text','1 / 23','home',.03,.89,.15,.07,{Binding:'counter',Align:'left'});add('button','','gallery',.9,.03,.07,.08,{Icon:'times',Transparent:true});add('button','','previous',.02,.45,.06,.1,{Icon:'angle-left',Transparent:true});add('button','','next',.92,.45,.06,.1,{Icon:'angle-right',Transparent:true});add('button','','download',.81,.87,.07,.09,{Icon:'qrcode',Transparent:true});add('button','','confirmDelete',.9,.87,.07,.09,{Icon:'trash-o',Transparent:true});}}
 if(page==='gallery'){add('text',model.GalleryTitle||'Galerie','home',.03,.02,.4,.1,{FontSize:36,Align:'left'});add('button','Startseite','home',.79,.03,.18,.08,{Icon:'arrow-right'});add('viewport','Galerieraster','home',.03,.16,.94,.7,{Binding:'gallery'});add('button','Mehrere herunterladen','selectionMode',.68,.89,.29,.08,{Icon:'check-square-o'});}
 if(page==='selection'){add('button','Herunterladen','downloadSelection',.29,.87,.27,.09,{Icon:'qrcode'});add('button','','endSelection',.59,.87,.08,.09,{Icon:'times'});}
 if(page==='download'){add('text','1. Mit WLAN verbinden','home',.08,.06,.38,.08,{FontSize:28});add('image','WLAN QR','home',.15,.19,.24,.43,{Binding:'wifiqr'});add('text',model.WifiInstructions||'WLAN-Code scannen und Verbindung bestätigen.','home',.06,.65,.42,.12,{FontSize:22});add('button','Verbunden · weiter','connected',.09,.82,.36,.09,{Icon:'check'});add('text','2. Foto öffnen','home',.55,.06,.38,.08,{FontSize:28});add('image','Foto QR','home',.62,.19,.24,.43,{Binding:'downloadqr'});add('text',model.DownloadInstructions,'home',.53,.65,.42,.12,{FontSize:22});add('button','','dismiss',.91,.02,.06,.08,{Icon:'times',Transparent:true});}
}
function editorBackgroundKey(page){return page==='welcome'?'WelcomeScreenColor':page==='gallery'?(model.CustomGalleryTheme?'GalleryBackground':'BackgroundColor'):page==='viewer'?'ViewerBackground':page==='result'?(model.CustomResultTheme?'ResultBackground':'BackgroundColor'):page==='download'?'DownloadBackground':page==='home'&&model.CustomHomeTheme?'HomeBackground':'BackgroundColor';}
function elementLabel(item){item=presentedDesignItem(item,model);return item.Text?.trim()||({photo:'Foto',latest:'Neuestes Foto',slideshow:'Diashow',gallery:'Galerieraster',filename:'Bildname',counter:'Bildzähler',date:'Datum',downloadqr:'Foto-QR',wifiqr:'WLAN-QR'})[item.Binding]||(item.Icon?'Symbol-Button':({text:'Text',button:'Button',image:'Bild',viewport:'Bildfläche',clickarea:'Klickfläche'})[item.Kind]);}
function kindIcon(item){return item.Kind==='button'?'square-o':item.Kind==='text'?'font':item.Kind==='clickarea'?'hand-pointer-o':item.Binding==='gallery'?'th':item.Binding==='slideshow'?'film':item.Binding?.includes('qr')?'qrcode':'image';}
const hasText=item=>item&&(item.Kind==='text'||item.Kind==='button')&&!['filename','counter','date'].includes(item.Binding)||item?.Kind==='text';
function clampElement(e){e.Width=Math.max(.005,Math.min(4,e.Width));e.Height=Math.max(.005,Math.min(4,e.Height));e.X=Math.max(-3,Math.min(3,e.X));e.Y=Math.max(-3,Math.min(3,e.Y));}

/* =================== Adapter je Editorart =================== */
function screenAdapter(page){return {
 kind:'screen',ratio:()=>kioskSize().ratio,
 items:()=>visibleDesignItems(model.ScreenElements.filter(e=>e.Page===page),model),id:o=>o.Id,
 min:.01,rotate:true,clamp:o=>clampElement(o,kioskSize().ratio),locked:o=>!!o.Locked,hidden:o=>o.Visible===false,
 cls:'design-element',
 draw:(n,o,scale)=>drawScreenItem(n,presentedDesignItem(o,model),scale),
 background:c=>{c.style.background=get(editorBackgroundKey(page));const bg=page==='welcome'?model.WelcomeScreenImage:page==='home'&&model.HomeBackgroundMode==='image'?model.StartBackgroundImage:page==='gallery'?model.GalleryBackgroundImage:'';if(bg){const img=el('img','design-background');img.alt='';img.src=mediaUrl(bg);applyMediaPlacement(img,page==='welcome'?'WelcomeScreenImage':page==='gallery'?'GalleryBackgroundImage':'StartBackgroundImage',model);c.append(img);}else if(page==='home'&&model.HomeBackgroundMode==='live'){const img=el('img','design-background live');img.alt='';img.src='demo/sample-photo.png';c.append(img);}},
 write:()=>{}
};}
function collageLayout(){if(!model.CollageTemplates.length)model.CollageTemplates=[copy(model.Layout)];layoutIndex=Math.max(0,Math.min(layoutIndex,model.CollageTemplates.length-1));return model.CollageTemplates[layoutIndex];}
function collageAdapter(){const l=collageLayout();return {
 kind:'collage',ratio:()=>l.Width/l.Height,items:()=>l.Slots,id:o=>'slot-'+l.Slots.indexOf(o),
 min:.04,rotate:true,clamp:o=>{clampElement(o);o.Width=Math.max(.02,o.Width);o.Height=Math.max(.02,o.Height);o.Rotation=Math.round(o.Rotation||0);},locked:()=>false,hidden:()=>false,
 cls:'slot',
 draw:(n,o)=>{n.replaceChildren();const img=el('img','slot-photo');img.alt='';img.src='demo/sample-photo.png';img.style.objectFit=l.Fit===1?'contain':'cover';n.append(img,el('b','slot-number',String(l.Slots.indexOf(o)+1)));},
 background:c=>{c.style.background=l.Background;},
 overlay:c=>{if(l.Frame){const f=el('img','frame-overlay');f.alt='Rahmen';f.src=mediaUrl(l.Frame);applyMediaPlacement(f,'frame',{MediaPlacements:{frame:l.FramePlacement}});f.style.transform+=' rotate('+(l.FrameRotation||0)+'deg)';c.append(f);}if(l.Caption){const t=el('div','canvas-caption',l.Caption.replace('{event}',currentEvent().Name));t.style.color=l.CaptionColor||'#212121';t.style.fontFamily=model.FontName;c.append(t);}},
 write:()=>{}
};}
function singleAdapter(){
 const area={id:'photo'};const read=()=>Object.assign(area,{X:model.PhotoInsetLeft/100,Y:model.PhotoInsetTop/100,Width:1-(model.PhotoInsetLeft+model.PhotoInsetRight)/100,Height:1-(model.PhotoInsetTop+model.PhotoInsetBottom)/100,Rotation:0});read();
 return {
 kind:'single',ratio:()=>model.PhotoOutputWidth?model.PhotoOutputWidth/model.PhotoOutputHeight:1.5,items:()=>[area],id:()=>'photo',
 min:.05,rotate:false,clamp:o=>{clampElement(o);o.Width=Math.max(.05,o.Width);o.Height=Math.max(.05,o.Height);},locked:()=>false,hidden:()=>false,
 cls:'photo-area',
 draw:n=>{n.replaceChildren();const img=el('img','slot-photo');img.alt='Bildbereich';img.src='demo/sample-photo.png';img.style.objectFit=model.PhotoFitMode===0?'cover':'contain';n.append(img);},
 background:c=>{c.style.background=model.PhotoBackground;},
 overlay:c=>{if(model.PhotoFrame){const f=el('img','frame-overlay');f.alt='Rahmen';f.src=mediaUrl(model.PhotoFrame);applyMediaPlacement(f,'PhotoFrame',model);c.append(f);}if(model.PhotoCaption){const t=el('div','canvas-caption',model.PhotoCaption.replace('{event}',currentEvent().Name));t.style.color=model.PhotoCaptionColor;t.style.fontFamily=model.FontName;c.append(t);}},
 write:o=>{model.PhotoInsetLeft=Math.round(o.X*100);model.PhotoInsetTop=Math.round(o.Y*100);model.PhotoInsetRight=Math.round((1-o.X-o.Width)*100);model.PhotoInsetBottom=Math.round((1-o.Y-o.Height)*100);read();},
 reread:read
};}

/* =================== Darstellung eines Bildschirmelements =================== */
function drawScreenItem(n,item,scale){
 const visual=n.querySelector('.element-visual')||el('div','element-visual');visual.replaceChildren();visual.className='element-visual';n.prepend(visual);
 elementVisual(visual,item,scale);
 if(item.Kind==='clickarea'){n.classList.add('clickarea-element');visual.append(el('span','clickarea-label',item.Text||'Klickfläche'));return;}
 n.classList.remove('clickarea-element');
 if(item.Kind==='image'&&item.Image&&!item.Binding){const img=el('img');img.alt='';img.src=mediaUrl(item.Image);img.draggable=false;img.style.objectFit=item.ImageFit||'cover';visual.append(img);img.onload=()=>{if(item.AspectRatio)return;const ratio=img.naturalWidth/img.naturalHeight;if(!ratio)return;item.AspectRatio=ratio;item.Height=Math.max(.03,Math.min(item.Width*kioskSize().ratio/ratio,1-item.Y));item.Width=item.Height*ratio/kioskSize().ratio;clampElement(item);placeNode(n,item);changed();};return;}
 if(item.Binding==='slideshow'&&item.SlideshowMode==='conveyor'){requestAnimationFrame(()=>{if(visual.isConnected)ed.cleanups.push(createConveyor(visual,item,[{url:'demo/sample-photo.png'},{url:'demo/sample-photo.png'}],{animate:false,scale}));});return;}
 if(['photo','latest','slideshow'].includes(item.Binding)||item.Kind==='image'&&!item.Binding){const img=el('img');img.alt='';img.draggable=false;img.src=item.Kind==='image'&&!item.Binding?'demo/sample-photo.png':'demo/sample-photo.png';img.style.objectFit=item.ImageFit||'cover';visual.append(img);return;}
 if(item.Binding==='gallery'){visual.classList.add('gallery-editor-grid');for(let i=0;i<6;i++){const img=el('img');img.alt='';img.draggable=false;img.src='demo/sample-photo.png';visual.append(img);}return;}
 if(item.Binding==='downloadqr'||item.Binding==='wifiqr'){visual.classList.add('qr-placeholder');visual.append(icon('qrcode'));return;}
 if(item.Icon)visual.append(icon(item.Icon));
 const sample={filename:'261116_184200.jpg',counter:'3 / 24',date:'16.11.2026 · 18:42'}[item.Binding];
 visual.append(el('span','element-text',sample||item.Text||''));
}
function placeNode(n,o){Object.assign(n.style,{left:o.X*100+'%',top:o.Y*100+'%',width:o.Width*100+'%',height:o.Height*100+'%',transform:o.Rotation?'rotate('+o.Rotation+'deg)':''});}

/* =================== Aufbau =================== */
function editorActive(){return !!ed.shell?.isConnected;}
function editorAdapter(){return ed.kind==='screen'?screenAdapter(ed.page):ed.kind==='collage'?collageAdapter():singleAdapter();}
function freeScreenEditor(root,page){buildEditor(root,'screen',page);}
function buildEditor(root,kind,page){
 if(ed.kind!==kind||ed.page!==page){ed.sel.clear();ed.zoom=0;}
 ed.kind=kind;ed.page=page||'';editorPage=page||'';ed.adapter=editorAdapter();
 document.body.classList.add('custom-editor');hidePreview();
 const shell=el('div','ed-shell ed-'+kind);ed.shell=shell;
 ed.ribbon=el('div','ed-ribbon');ed.ribbon.setAttribute('role','toolbar');ed.ribbon.setAttribute('aria-label','Werkzeuge');
 const left=el('aside','ed-left');ed.layers=left;
 const center=el('div','ed-center');ed.stage=el('div','ed-stage');ed.stage.tabIndex=-1;center.append(ed.stage);
 ed.status=el('div','ed-status');center.append(ed.status);buildStatus();
 ed.inspector=el('aside','ed-inspector');ed.inspector.dataset.keepScroll='inspector-'+kind;
 shell.append(ed.ribbon,left,center,ed.inspector);root.append(shell);
 buildRibbon();buildCanvas();buildLeft();buildInspector();syncRibbon();
 hooks.view=editorRebuild;
 const ro=new ResizeObserver(()=>layoutCanvas());ro.observe(ed.stage);renderCleanups.push(()=>{ro.disconnect();for(const c of ed.cleanups.splice(0))try{c();}catch{}});
 ed.stage.addEventListener('pointerdown',stagePointerDown);
 ed.stage.addEventListener('dblclick',stageDoubleClick);
 ed.stage.addEventListener('contextmenu',stageContextMenu);
 ed.stage.addEventListener('wheel',e=>{if(!e.ctrlKey)return;e.preventDefault();zoomBy(e.deltaY<0?1.1:1/1.1);},{passive:false});
}
function editorRebuild(){if(!editorActive()){render();return;}ed.adapter=editorAdapter();const ids=new Set(ed.adapter.items().map(ed.adapter.id));for(const id of [...ed.sel])if(!ids.has(id))ed.sel.delete(id);buildCanvas();buildLeft();buildInspector();syncRibbon();syncSelectionIndex();}
function editorAfterUpdate(path){if(editorActive()){if(ed.kind==='single')ed.adapter.reread?.();if(path?.startsWith('MediaPlacements.'))buildCanvas();else redrawAll();}}

/* ---------- Arbeitsfläche ---------- */
function buildCanvas(){
 for(const c of ed.cleanups.splice(0))try{c();}catch{}
 ed.stage.replaceChildren();const canvas=el('div','canvas ed-canvas'+(ed.kind==='screen'?' design-canvas':' template-canvas'));ed.canvas=canvas;
 if(ed.grid)canvas.classList.add('show-grid');ed.adapter.background(canvas);
 for(const o of ed.adapter.items()){if(ed.adapter.hidden(o))continue;const n=el('div','ed-item '+ed.adapter.cls);n.dataset.id=ed.adapter.id(o);if(ed.kind==='screen')n.dataset.elementId=o.Id;canvas.append(n);}
 ed.adapter.overlay?.(canvas);
 ed.guideLayer=el('div','ed-guides');canvas.append(ed.guideLayer);
 ed.stage.append(canvas);layoutCanvas();
}
function canvasScale(){return (ed.canvas?.clientWidth||640)/1280;}
function layoutCanvas(){
 if(!ed.canvas||!ed.stage.isConnected)return;const R=ed.adapter.ratio(),pad=40,sw=ed.stage.clientWidth-pad,sh=ed.stage.clientHeight-pad;if(sw<=0||sh<=0)return;
 const fit=Math.max(120,Math.min(sw,sh*R));const w=ed.zoom?fit*ed.zoom:fit;
 ed.canvas.style.width=w+'px';ed.canvas.style.height=w/R+'px';ed.stage.classList.toggle('zoomed',!!ed.zoom&&ed.zoom>1);
 redrawAll();updateStatus();
}
function redrawAll(){
 if(!ed.canvas)return;const scale=ed.kind==='screen'?canvasScale():1;const items=ed.adapter.items();const nodes=new Map([...ed.canvas.querySelectorAll('.ed-item')].map(n=>[n.dataset.id,n]));
 for(const o of items){const n=nodes.get(ed.adapter.id(o));if(!n)continue;placeNode(n,o);ed.adapter.draw(n,o,scale);n.classList.toggle('selected',ed.sel.has(n.dataset.id));n.classList.toggle('locked',ed.adapter.locked(o));}
 if(ed.kind==='screen')ed.canvas.style.background=get(editorBackgroundKey(ed.page));
 paintHandles();
}
function redrawItem(o){const n=nodeOf(o);if(!n)return;placeNode(n,o);ed.adapter.draw(n,o,ed.kind==='screen'?canvasScale():1);paintHandles();}
function nodeOf(o){return ed.canvas?.querySelector(`.ed-item[data-id="${CSS.escape(ed.adapter.id(o))}"]`);}
function selectedItems(){return ed.adapter.items().filter(o=>ed.sel.has(ed.adapter.id(o)));}
function single(){const s=selectedItems();return s.length===1?s[0]:null;}
/* Auswahlrahmen liegen in einer eigenen Ebene über allem: ausgewählte Elemente bleiben in ihrer Ebene. */
function itemById(id){return ed.adapter.items().find(o=>ed.adapter.id(o)===id);}
function paintHandles(){
 if(!ed.canvas)return;
 ed.canvas.querySelectorAll('.ed-item').forEach(n=>n.classList.toggle('selected',ed.sel.has(n.dataset.id)));
 ed.canvas.classList.toggle('multi',ed.sel.size>1);
 let layer=ed.canvas.querySelector('.ed-selection');if(!layer){layer=el('div','ed-selection');ed.canvas.append(layer);}layer.replaceChildren();
 const items=selectedItems(),one=items.length===1?items[0]:null;
 for(const o of items){if(ed.adapter.hidden(o))continue;const f=el('div','sel-frame'+(ed.adapter.locked(o)?' locked':''));f.dataset.id=ed.adapter.id(o);placeNode(f,o);
  if(o===one&&!ed.adapter.locked(o)){for(const edge of ['n','s','e','w','ne','nw','se','sw']){const h=el('span','edge-handle');h.dataset.edge=edge;f.append(h);}
   if(ed.adapter.rotate){const r=el('span','rotate-handle');r.title='Drehen · Shift: 15°-Schritte';r.append(icon('rotate-right'));f.append(r);}}
  layer.append(f);}
}
function syncFrames(){ed.canvas?.querySelectorAll('.sel-frame').forEach(f=>{const o=itemById(f.dataset.id);if(o)placeNode(f,o);});}
function selectedAt(e){for(const f of ed.canvas?.querySelectorAll('.sel-frame:not(.locked)')||[]){const r=f.getBoundingClientRect();if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)return f.dataset.id;}return null;}
function syncSelectionIndex(){
 const o=single()||selectedItems()[0];
 selectedElement=ed.kind==='screen'&&o?model.ScreenElements.indexOf(o):-1;
 selectedSlot=ed.kind==='collage'&&o?collageLayout().Slots.indexOf(o):-1;
}
function selectIds(ids,{toggle=false}={}){
 if(!toggle)ed.sel.clear();for(const id of ids){if(toggle&&ed.sel.has(id))ed.sel.delete(id);else ed.sel.add(id);}
 syncSelectionIndex();paintHandles();paintLayerSelection();buildInspector();syncRibbon();
}
function editorSelect(id){selectIds([id]);}

/* ---------- Zeiger: Auswahl, Verschieben, Größe, Drehung, Rahmenauswahl ---------- */
function toCanvas(e){const r=ed.canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height,r};}
function stagePointerDown(e){
 if(e.button!==0||e.target.isContentEditable||!ed.canvas)return;closeEditorMenu();
 const handle=e.target.closest('.edge-handle,.rotate-handle'),frame=handle?.closest('.sel-frame');
 if(handle&&frame){e.preventDefault();transformDrag(e,frame,handle);return;}
 const additiveClick=e.shiftKey||e.ctrlKey||e.metaKey,held=!additiveClick&&selectedAt(e);
 if(held){e.preventDefault();moveDrag(e,held,false);return;}
 const node=e.target.closest('.ed-item');
 if(node){
  e.preventDefault();const id=node.dataset.id,additive=e.shiftKey||e.ctrlKey||e.metaKey;
  if(additive){selectIds([id],{toggle:true});if(!ed.sel.has(id))return;}
  else if(!ed.sel.has(id))selectIds([id]);
  moveDrag(e,id,additive);return;
 }
 marqueeDrag(e);
}
function snapElementSize(data,others,edge,rect,enabled=true){
 const guides=[];if(!enabled)return guides;
 const candidates=others.filter(o=>o!==data&&o.Visible!==false&&(!o.Id||o.Id!==data.Id));
 if(/[ew]/.test(edge)){const match=candidates.map(o=>({o,d:o.Width-data.Width})).filter(m=>Math.abs(m.d)<=SNAP_PX/rect.width).sort((a,b)=>Math.abs(a.d)-Math.abs(b.d))[0];if(match){if(edge.includes('w'))data.X-=match.d;data.Width=match.o.Width;guides.push(['x',data.X+data.Width],['x',match.o.X+match.o.Width]);}}
 if(/[ns]/.test(edge)){const match=candidates.map(o=>({o,d:o.Height-data.Height})).filter(m=>Math.abs(m.d)<=SNAP_PX/rect.height).sort((a,b)=>Math.abs(a.d)-Math.abs(b.d))[0];if(match){if(edge.includes('n'))data.Y-=match.d;data.Height=match.o.Height;guides.push(['y',data.Y+data.Height],['y',match.o.Y+match.o.Height]);}}
 return guides;
}
function snapTargets(exclude){
 const xs=[0,.5,1],ys=[0,.5,1];for(const o of ed.adapter.items()){if(exclude.has(o)||ed.adapter.hidden(o))continue;xs.push(o.X,o.X+o.Width/2,o.X+o.Width);ys.push(o.Y,o.Y+o.Height/2,o.Y+o.Height);}return {xs,ys};
}
/* Drehung: nur in unmittelbarer Nähe von 0°, 90°, 180° magnetisch. */
function snapRotation(angle,enabled=true){angle=((angle+540)%360)-180;const n90=Math.round(angle/90)*90;return Math.round(enabled&&Math.abs(angle-n90)<=ROTATE_MAGNET?n90:angle);}
function bestSnap(anchors,targets,threshold){let best=null;for(const a of anchors)for(const t of targets){const d=t-a;if(Math.abs(d)<=threshold&&(!best||Math.abs(d)<Math.abs(best.d)))best={d,t};}return best;}
/* Kompatibel: verschiebt d auf nahe Hilfslinien und liefert die verwendeten Linien. */
function snapElementMove(data,others,rect,enabled=true){const guides=[];if(!enabled)return guides;const xs=[0,.5,1],ys=[0,.5,1];for(const o of others){if(o===data||o.Id&&o.Id===data.Id||o.Visible===false)continue;xs.push(o.X,o.X+o.Width/2,o.X+o.Width);ys.push(o.Y,o.Y+o.Height/2,o.Y+o.Height);}const x=bestSnap([data.X,data.X+data.Width/2,data.X+data.Width],xs,SNAP_PX/rect.width),y=bestSnap([data.Y,data.Y+data.Height/2,data.Y+data.Height],ys,SNAP_PX/rect.height);if(x){data.X+=x.d;guides.push(['x',x.t]);}if(y){data.Y+=y.d;guides.push(['y',y.t]);}return guides;}
function drawGuides(list){if(!ed.guideLayer)return;ed.guideLayer.replaceChildren();for(const [axis,v]of list){const g=el('div','snap-guide '+(axis==='x'?'vertical':'horizontal'));g.style[axis==='x'?'left':'top']=v*100+'%';ed.guideLayer.append(g);}}
function boundsOf(list){const x=Math.min(...list.map(o=>o.X)),y=Math.min(...list.map(o=>o.Y)),r=Math.max(...list.map(o=>o.X+o.Width)),b=Math.max(...list.map(o=>o.Y+o.Height));return {X:x,Y:y,Width:r-x,Height:b-y};}
function moveDrag(e,id,additive){
 const items=selectedItems().filter(o=>!ed.adapter.locked(o));const p0=toCanvas(e);const starts=new Map(items.map(o=>[o,{X:o.X,Y:o.Y}]));
 const targets=snapTargets(new Set(items));const bounds0=items.length?boundsOf(items):null;let moved=false;
 ed.stage.setPointerCapture(e.pointerId);
 const move=ev=>{const p=toCanvas(ev);let dx=p.x-p0.x,dy=p.y-p0.y;if(!moved){if(Math.hypot((ev.clientX-e.clientX),(ev.clientY-e.clientY))<3)return;moved=true;remember();ed.canvas.classList.add('dragging');}
  if(!bounds0)return;
  const guides=[];if(ed.snap&&!ev.altKey){const b={X:bounds0.X+dx,Y:bounds0.Y+dy,Width:bounds0.Width,Height:bounds0.Height};const sx=bestSnap([b.X,b.X+b.Width/2,b.X+b.Width],targets.xs,SNAP_PX/p.r.width),sy=bestSnap([b.Y,b.Y+b.Height/2,b.Y+b.Height],targets.ys,SNAP_PX/p.r.height);if(sx){dx+=sx.d;guides.push(['x',sx.t]);}if(sy){dy+=sy.d;guides.push(['y',sy.t]);}}
  dx=Math.max(-3-bounds0.X,Math.min(3-bounds0.X,dx));dy=Math.max(-3-bounds0.Y,Math.min(3-bounds0.Y,dy));
  for(const o of items){const s=starts.get(o);o.X=s.X+dx;o.Y=s.Y+dy;if(ed.kind==='screen')ed.adapter.clamp(o);const n=nodeOf(o);if(n)placeNode(n,o);}syncFrames();
  drawGuides(guides);showReadout(ev,`X ${Math.round(items[0].X*1000)/10} %  ·  Y ${Math.round(items[0].Y*1000)/10} %`);};
 const up=()=>{ed.stage.removeEventListener('pointermove',move);ed.stage.removeEventListener('pointerup',up);ed.stage.removeEventListener('pointercancel',up);drawGuides([]);hideReadout();ed.canvas?.classList.remove('dragging');
  if(moved){for(const o of items)ed.adapter.write(o);changed();syncInspector();}
  else if(!additive&&ed.sel.size>1)selectIds([id]);};
 ed.stage.addEventListener('pointermove',move);ed.stage.addEventListener('pointerup',up);ed.stage.addEventListener('pointercancel',up);
}
function transformDrag(e,node,handle){
 const o=ed.adapter.items().find(x=>ed.adapter.id(x)===node.dataset.id);if(!o)return;const p0=toCanvas(e),r=p0.r,start={...o};const edge=handle.dataset.edge,turn=handle.classList.contains('rotate-handle');
 const cx=r.left+(start.X+start.Width/2)*r.width,cy=r.top+(start.Y+start.Height/2)*r.height,firstAngle=Math.atan2(e.clientY-cy,e.clientX-cx),rad=(start.Rotation||0)*Math.PI/180;
 const keepAspectDefault=edge?.length===2;
 const targets=snapTargets(new Set([o]));let moved=false;ed.stage.setPointerCapture(e.pointerId);
 const move=ev=>{const dx=ev.clientX-e.clientX,dy=ev.clientY-e.clientY;if(!moved){if(Math.abs(dx)+Math.abs(dy)<2)return;moved=true;remember();}
  const guides=[];
  if(turn){let a=(start.Rotation||0)+(Math.atan2(ev.clientY-cy,ev.clientX-cx)-firstAngle)*180/Math.PI;a=((a+540)%360)-180;if(ev.shiftKey)a=Math.round(a/15)*15;else{const n90=Math.round(a/90)*90;if(Math.abs(a-n90)<=ROTATE_MAGNET)a=n90;}o.Rotation=((Math.round(a)+540)%360)-180;showReadout(ev,o.Rotation+'°');}
  else{
   const lx=dx*Math.cos(rad)+dy*Math.sin(rad),ly=-dx*Math.sin(rad)+dy*Math.cos(rad);let l=-start.Width*r.width/2,t=-start.Height*r.height/2,rr=-l,bb=-t;const minW=ed.adapter.min*r.width,minH=ed.adapter.min*r.height;
   if(edge.includes('w'))l=Math.min(rr-minW,l+lx);if(edge.includes('e'))rr=Math.max(l+minW,rr+lx);if(edge.includes('n'))t=Math.min(bb-minH,t+ly);if(edge.includes('s'))bb=Math.max(t+minH,bb+ly);
   if(edge.length===2){const aspect=start.Width*r.width/(start.Height*r.height);const w=rr-l,h=bb-t;if(w/h>aspect){const nw=h*aspect;if(edge.includes('w'))l=rr-nw;else rr=l+nw;}else{const nh=w/aspect;if(edge.includes('n'))t=bb-nh;else bb=t+nh;}}
   const sx=(l+rr)/2,sy=(t+bb)/2;o.Width=(rr-l)/r.width;o.Height=(bb-t)/r.height;o.X=start.X+start.Width/2+(sx*Math.cos(rad)-sy*Math.sin(rad))/r.width-o.Width/2;o.Y=start.Y+start.Height/2+(sx*Math.sin(rad)+sy*Math.cos(rad))/r.height-o.Height/2;
   if(ed.snap&&!ev.altKey&&!start.Rotation&&edge.length===1){
    if(edge.includes('e')){const s=bestSnap([o.X+o.Width],targets.xs,SNAP_PX/r.width);if(s){o.Width+=s.d;guides.push(['x',s.t]);}}
    if(edge.includes('w')){const s=bestSnap([o.X],targets.xs,SNAP_PX/r.width);if(s){o.X+=s.d;o.Width-=s.d;guides.push(['x',s.t]);}}
    if(edge.includes('s')){const s=bestSnap([o.Y+o.Height],targets.ys,SNAP_PX/r.height);if(s){o.Height+=s.d;guides.push(['y',s.t]);}}
    if(edge.includes('n')){const s=bestSnap([o.Y],targets.ys,SNAP_PX/r.height);if(s){o.Y+=s.d;o.Height-=s.d;guides.push(['y',s.t]);}}
   }
   if(ed.snap&&!ev.altKey&&(!keepAspectDefault||edge.length!==2))guides.push(...snapElementSize(o,ed.adapter.items(),edge,r));
   if(edge.length===1){if(ed.kind==='screen')o.ImageFit='cover';if(ed.kind==='collage')collageLayout().Fit=0;if(ed.kind==='single')model.PhotoFitMode=0;}
   if(ed.kind==='screen'){o.AspectRatio=o.Width*r.width/(o.Height*r.height);if(edge.length===2&&o.Icon){const f=Math.sqrt(o.Width*o.Height/(start.Width*start.Height));o.IconSize=Math.max(4,Math.min(512,Math.round((start.IconSize||start.FontSize||24)*f)));}}
   showReadout(ev,`${Math.round(o.Width*1000)/10} × ${Math.round(o.Height*1000)/10} %`);
  }
  ed.adapter.clamp(o);drawGuides(guides);const n=nodeOf(o);if(n){placeNode(n,o);if(ed.kind==='screen'&&!turn)ed.adapter.draw(n,o,canvasScale());}syncFrames();};
 const up=()=>{ed.stage.removeEventListener('pointermove',move);ed.stage.removeEventListener('pointerup',up);ed.stage.removeEventListener('pointercancel',up);drawGuides([]);hideReadout();if(moved){ed.adapter.write(o);changed();redrawItem(o);syncInspector();}};
 ed.stage.addEventListener('pointermove',move);ed.stage.addEventListener('pointerup',up);ed.stage.addEventListener('pointercancel',up);
}
function marqueeDrag(e){
 const additive=e.shiftKey||e.ctrlKey||e.metaKey;const before=new Set(ed.sel);const p0=toCanvas(e);let box=null;ed.stage.setPointerCapture(e.pointerId);
 const move=ev=>{const p=toCanvas(ev);if(!box){if(Math.hypot(ev.clientX-e.clientX,ev.clientY-e.clientY)<4)return;box=el('div','marquee');ed.canvas.append(box);}
  const x=Math.min(p0.x,p.x),y=Math.min(p0.y,p.y),w=Math.abs(p.x-p0.x),h=Math.abs(p.y-p0.y);Object.assign(box.style,{left:x*100+'%',top:y*100+'%',width:w*100+'%',height:h*100+'%'});
  ed.sel=new Set(additive?before:[]);for(const o of ed.adapter.items()){if(ed.adapter.hidden(o))continue;if(o.X<x+w&&o.X+o.Width>x&&o.Y<y+h&&o.Y+o.Height>y)ed.sel.add(ed.adapter.id(o));}
  ed.canvas.querySelectorAll('.ed-item').forEach(n=>n.classList.toggle('selected',ed.sel.has(n.dataset.id)));};
 const up=()=>{ed.stage.removeEventListener('pointermove',move);ed.stage.removeEventListener('pointerup',up);ed.stage.removeEventListener('pointercancel',up);box?.remove();if(!box&&!additive)ed.sel.clear();selectIds([...ed.sel]);};
 ed.stage.addEventListener('pointermove',move);ed.stage.addEventListener('pointerup',up);ed.stage.addEventListener('pointercancel',up);
}
let readout=null;
function showReadout(ev,text){if(!readout){readout=el('div','drag-readout');document.body.append(readout);}readout.textContent=text;readout.style.left=ev.clientX+14+'px';readout.style.top=ev.clientY+16+'px';}
function hideReadout(){readout?.remove();readout=null;}

/* ---------- Text direkt bearbeiten (auch auf Buttons) ---------- */
function stageDoubleClick(e){
 const node=e.target.closest?.('.ed-item')||document.elementFromPoint(e.clientX,e.clientY)?.closest('.ed-item');if(!node||ed.kind!=='screen')return;const o=ed.adapter.items().find(x=>x.Id===node.dataset.id);if(!o||o.Locked||!['text','button'].includes(o.Kind)||['filename','counter','date'].includes(o.Binding))return;
 startTextEdit(node,o);
}
function startTextEdit(node,o){
 let span=node.querySelector('.element-text');if(!span){span=el('span','element-text','');node.querySelector('.element-visual').append(span);}
 node.classList.add('editing');span.contentEditable='true';span.spellcheck=false;span.focus();document.getSelection()?.selectAllChildren(span);
 const before=presentedDesignItem(o,model).Text;
 const finish=commit=>{span.contentEditable='false';node.classList.remove('editing');span.onblur=null;span.onkeydown=null;const text=span.innerText.replace(/\n+$/,'').slice(0,200);if(commit&&text!==before){remember();if(isUnifiedHomeStart(o,model))model.UnifiedStartLabel=text;else o.Text=text;changed();}redrawItem(o);buildLeft();buildInspector();};
 span.onblur=()=>finish(true);
 span.onkeydown=k=>{k.stopPropagation();if(k.key==='Escape'){k.preventDefault();span.innerText=before;finish(false);}else if(k.key==='Enter'&&!k.shiftKey){k.preventDefault();span.blur();}};
}

/* ---------- Befehle ---------- */
function screenSubset(){return model.ScreenElements.filter(e=>e.Page===ed.page);}
function editorCommand(cmd){
 const sel=selectedItems();if(!sel.length&&!['paste','selectAll'].includes(cmd))return;
 if(cmd==='selectAll'){selectIds(ed.adapter.items().filter(o=>!ed.adapter.hidden(o)).map(ed.adapter.id));return;}
 if(cmd==='copy'){editorClipboard={kind:ed.kind,items:copy(sel)};return;}
 if(cmd==='paste'){pasteItems();return;}
 remember();
 if(cmd==='duplicate'){
  if(ed.kind==='single'){undo.pop();return;}
  const list=ed.kind==='screen'?model.ScreenElements:collageLayout().Slots;if(ed.kind==='collage'&&list.length+sel.length>8){undo.pop();notify('Höchstens acht Bildfelder.','error');return;}if(ed.kind==='screen'&&list.length+sel.length>160){undo.pop();notify('Höchstens 160 Elemente.','error');return;}
  const ids=[];for(const o of sel){const d=copy(o);if(d.Id)d.Id=crypto.randomUUID();d.X=Math.min(1-d.Width,d.X+.02);d.Y=Math.min(1-d.Height,d.Y+.02);list.push(d);ids.push(ed.kind==='screen'?d.Id:'slot-'+(list.length-1));}
  changed();editorRebuild();selectIds(ids);return;
 }
 if(cmd==='delete'){
  if(ed.kind==='single'){undo.pop();return;}
  if(ed.kind==='collage'){const slots=collageLayout().Slots;if(slots.length-sel.length<2){undo.pop();notify('Eine Collage braucht mindestens zwei Bildfelder.','error');return;}collageLayout().Slots=slots.filter(s=>!sel.includes(s));}
  else{const remaining=screenSubset().filter(e=>!sel.includes(e));if(ed.page==='home'&&model.FreeHomeDesign&&!remaining.some(e=>e.Visible!==false&&['button','clickarea'].includes(e.Kind)&&['photo','collage'].includes(e.Action))){undo.pop();notify('Mindestens einen Aufnahmebutton auf der Startseite behalten.','error');return;}model.ScreenElements=model.ScreenElements.filter(e=>!sel.includes(e));}
  ed.sel.clear();changed();editorRebuild();return;
 }
 if(['front','back','up','down'].includes(cmd)&&ed.kind==='screen'){
  const page=screenSubset();let order=[...page];
  if(cmd==='front')order=[...order.filter(o=>!sel.includes(o)),...order.filter(o=>sel.includes(o))];
  else if(cmd==='back')order=[...order.filter(o=>sel.includes(o)),...order.filter(o=>!sel.includes(o))];
  else{const step=cmd==='up'?1:-1;const idx=order.map((o,i)=>sel.includes(o)?i:-1).filter(i=>i>=0);if(step>0)idx.reverse();for(const i of idx){const j=i+step;if(j<0||j>=order.length||sel.includes(order[j]))continue;[order[i],order[j]]=[order[j],order[i]];}}
  let k=0;model.ScreenElements=model.ScreenElements.map(e=>e.Page===ed.page?order[k++]:e);changed();editorRebuild();return;
 }
 if(cmd==='lock'){const lock=!sel.every(o=>o.Locked);for(const o of sel)o.Locked=lock;changed();editorRebuild();return;}
 if(cmd==='hide'){for(const o of sel)o.Visible=false;ed.sel.clear();changed();editorRebuild();return;}
 if(cmd.startsWith('align-')||cmd.startsWith('distribute-')||cmd==='center-x'||cmd==='center-y'){alignItems(cmd==='center-x'?'align-center':cmd==='center-y'?'align-middle':cmd,sel);changed();redrawAll();syncInspector();return;}
 undo.pop();
}
function alignItems(cmd,sel){
 const movable=sel.filter(o=>!ed.adapter.locked(o));if(!movable.length)return;const ref=sel.length>1?boundsOf(sel):{X:0,Y:0,Width:1,Height:1};
 if(cmd==='align-left')movable.forEach(o=>o.X=ref.X);if(cmd==='align-center')movable.forEach(o=>o.X=ref.X+(ref.Width-o.Width)/2);if(cmd==='align-right')movable.forEach(o=>o.X=ref.X+ref.Width-o.Width);
 if(cmd==='align-top')movable.forEach(o=>o.Y=ref.Y);if(cmd==='align-middle')movable.forEach(o=>o.Y=ref.Y+(ref.Height-o.Height)/2);if(cmd==='align-bottom')movable.forEach(o=>o.Y=ref.Y+ref.Height-o.Height);
 if(cmd==='distribute-h'&&movable.length>2){const s=[...movable].sort((a,b)=>a.X-b.X),total=s.reduce((n,o)=>n+o.Width,0),b=boundsOf(s),gap=(b.Width-total)/(s.length-1);let x=b.X;for(const o of s){o.X=x;x+=o.Width+gap;}}
 if(cmd==='distribute-v'&&movable.length>2){const s=[...movable].sort((a,b)=>a.Y-b.Y),total=s.reduce((n,o)=>n+o.Height,0),b=boundsOf(s),gap=(b.Height-total)/(s.length-1);let y=b.Y;for(const o of s){o.Y=y;y+=o.Height+gap;}}
 for(const o of movable){ed.adapter.clamp(o);ed.adapter.write(o);}
}
function pasteItems(){
 if(!editorClipboard||editorClipboard.kind!==ed.kind||ed.kind==='single')return;remember();const ids=[];
 for(const src of editorClipboard.items){const o=copy(src);o.X=Math.min(1-o.Width,o.X+.03);o.Y=Math.min(1-o.Height,o.Y+.03);if(ed.kind==='screen'){if(model.ScreenElements.length>=160)break;o.Id=crypto.randomUUID();o.Page=ed.page;clampElement(o);model.ScreenElements.push(o);ids.push(o.Id);}else{const l=collageLayout();if(l.Slots.length>=8)break;l.Slots.push(o);ids.push('slot-'+(l.Slots.length-1));}}
 changed();editorRebuild();selectIds(ids);
}
function editorPaste(){pasteItems();}
function editorAdd(kind){
 if(ed.kind==='collage'){const l=collageLayout();if(l.Slots.length>=8){notify('Höchstens acht Bildfelder.','error');return;}remember();l.Slots.push({X:.35,Y:.3,Width:.3,Height:.3,Rotation:0});changed();editorRebuild();selectIds(['slot-'+(l.Slots.length-1)]);return;}
 if(model.ScreenElements.length>=160){notify('Höchstens 160 Elemente.','error');return;}remember();const R=kioskSize().ratio;
 const presets={text:['text','Neuer Text',{FontSize:40,Width:.4,Height:.1}],button:['button','Button',{Width:.22,Height:.09,Transparent:false}],image:['image','Bild',{Width:.25,Height:.25*R}],photo:['viewport','Foto',{Binding:'photo',Width:.45,Height:.45*R/1.5,Transparent:true}],clickarea:['clickarea','Klickfläche',{Width:.3,Height:.2}]};
 const [k,text,extra]=presets[kind];const item=seedElement(ed.page,k,text,ed.page==='home'?(model.ShowSingle?'photo':'collage'):'home',.5-extra.Width/2,.5-extra.Height/2,extra.Width,extra.Height,extra);clampElement(item);
 model.ScreenElements.push(item);changed();editorRebuild();selectIds([item.Id]);if(kind==='image')action('asset',{key:'Element.Image',id:item.Id});
}

/* ---------- Kontextmenü ---------- */
function closeEditorMenu(){editorMenu?.remove();editorMenu=null;}
function stageContextMenu(e){
 e.preventDefault();const node=e.target.closest('.ed-item');if(node&&!ed.sel.has(node.dataset.id))selectIds([node.dataset.id]);if(!node&&ed.sel.size)selectIds([]);editorContext(e,single());
}
function editorContext(ev,item){
 closeEditorMenu();const menu=el('div','popover-menu editor-context');menu.setAttribute('role','menu');const sel=selectedItems();
 const add=(t,fn,glyph,key,disabled)=>{const b=button(t,()=>{closeEditorMenu();fn();},'menu-item',glyph);if(key)b.append(el('kbd','',key));b.disabled=!!disabled;b.setAttribute('role','menuitem');menu.append(b);};
 const sep=()=>menu.append(el('div','menu-sep'));
 if(sel.length){
  if(ed.kind==='screen'&&single()&&hasText(single()))add('Text bearbeiten',()=>startTextEdit(nodeOf(single()),single()),'i-cursor','Doppelklick');
  add('Kopieren',()=>editorCommand('copy'),'copy','Strg+C');add('Einfügen',pasteItems,'clipboard','Strg+V',!editorClipboard);add('Duplizieren',()=>editorCommand('duplicate'),'clone','Strg+D');sep();
  if(ed.kind==='screen'){add('In den Vordergrund',()=>editorCommand('front'),'angle-double-up');add('Eine Ebene nach vorn',()=>editorCommand('up'),'angle-up');add('Eine Ebene nach hinten',()=>editorCommand('down'),'angle-down');add('In den Hintergrund',()=>editorCommand('back'),'angle-double-down');sep();}
  add(sel.length>1?'Aneinander ausrichten: Mitte':'Auf der Fläche zentrieren',()=>{remember();alignItems('align-center',sel);alignItems('align-middle',sel);changed();redrawAll();syncInspector();},'crosshairs');
  if(ed.kind==='screen')add(sel.every(o=>o.Locked)?'Entsperren':'Sperren',()=>editorCommand('lock'),sel.every(o=>o.Locked)?'unlock-alt':'lock');
  sep();add('Löschen',()=>editorCommand('delete'),'trash-o','Entf',ed.kind==='single');
 }else{
  if(ed.kind==='screen')for(const [k,t,g]of [['text','Text einfügen','font'],['button','Button einfügen','square-o'],['image','Bild einfügen','image'],['clickarea','Klickfläche einfügen','hand-pointer-o']])add(t,()=>editorAdd(k),g);
  if(ed.kind==='collage')add('Bildfeld einfügen',()=>editorAdd('slot'),'plus-square-o');
  add('Einfügen',pasteItems,'clipboard','Strg+V',!editorClipboard);add('Alles auswählen',()=>editorCommand('selectAll'),'object-group','Strg+A');
 }
 document.body.append(menu);menu.style.left=Math.min(ev.clientX,innerWidth-menu.offsetWidth-12)+'px';menu.style.top=Math.min(ev.clientY,innerHeight-menu.offsetHeight-12)+'px';editorMenu=menu;
}
document.addEventListener('pointerdown',e=>{if(editorMenu&&!editorMenu.contains(e.target))closeEditorMenu();});

/* ---------- Tastatur ---------- */
document.addEventListener('keydown',e=>{
 if(!editorActive()||e.target.closest?.('input,select,textarea,[contenteditable=true]')||$('dialog[open]'))return;
 const k=e.key.toLowerCase(),mod=e.ctrlKey||e.metaKey;
 if(k==='delete'||k==='backspace'){if(ed.sel.size){e.preventDefault();editorCommand('delete');}}
 else if(mod&&k==='d'){e.preventDefault();editorCommand('duplicate');}
 else if(mod&&k==='c'){editorCommand('copy');}
 else if(mod&&k==='v'){e.preventDefault();pasteItems();}
 else if(mod&&k==='a'){e.preventDefault();editorCommand('selectAll');}
 else if(mod&&(k==='b'||k==='i')&&ed.kind==='screen'&&single()){e.preventDefault();const prop=k==='b'?'Bold':'Italic',v=!single()[prop];patchSel(o=>o[prop]=v);}
 else if(k==='escape'){closeEditorMenu();if(ed.sel.size)selectIds([]);}
 else if(k==='enter'&&single()&&ed.kind==='screen'&&hasText(single())){e.preventDefault();startTextEdit(nodeOf(single()),single());}
 else if(k.startsWith('arrow')&&ed.sel.size){e.preventDefault();const step=e.shiftKey?.01:.001;const sel=selectedItems().filter(o=>!ed.adapter.locked(o));if(!sel.length)return;if(!e.repeat)remember();for(const o of sel){if(k==='arrowleft')o.X-=step;if(k==='arrowright')o.X+=step;if(k==='arrowup')o.Y-=step;if(k==='arrowdown')o.Y+=step;ed.adapter.clamp(o);ed.adapter.write(o);}changed();redrawAll();syncInspector();}
 else if(mod&&(k==='+'||k==='=')){e.preventDefault();zoomBy(1.25);}
 else if(mod&&k==='-'){e.preventDefault();zoomBy(.8);}
 else if(mod&&k==='0'){e.preventDefault();ed.zoom=0;layoutCanvas();}
});

/* ---------- Zoom ---------- */
function zoomBy(f){ed.zoom=Math.max(.5,Math.min(4,(ed.zoom||1)*f));if(Math.abs(ed.zoom-1)<.04)ed.zoom=0;layoutCanvas();}
function buildStatus(){
 const info=el('span','ed-size'),hint=el('span','hint',ed.kind==='screen'?'Doppelklick: Text · Shift: mehrere · Alt: frei':'Shift: Seitenverhältnis · Alt: frei');
 const snap=rb('magnet','Hilfslinien',()=>{ed.snap=!ed.snap;snap.classList.toggle('active',ed.snap);snap.setAttribute('aria-pressed',String(ed.snap));});snap.classList.add('snap-toggle');snap.classList.toggle('active',ed.snap);snap.setAttribute('aria-pressed',String(ed.snap));
 const gridBtn=rb('th','Raster anzeigen',()=>{ed.grid=!ed.grid;gridBtn.classList.toggle('active',ed.grid);ed.canvas?.classList.toggle('show-grid',ed.grid);});gridBtn.classList.toggle('active',ed.grid);
 const zl=button('',()=>{ed.zoom=0;layoutCanvas();},'rb-btn rb-zoom');zl.id='ed-zoom-label';zl.title='An Fenster anpassen (Strg+0)';
 const tools=el('div','ed-view');tools.append(snap,gridBtn,el('span','ed-divider'),rb('search-minus','Verkleinern (Strg −)',()=>zoomBy(.8)),zl,rb('search-plus','Vergrößern (Strg +)',()=>zoomBy(1.25)));
 ed.status.replaceChildren(info,hint,el('span','spacer'),tools);
}
function updateStatus(){
 if(!ed.status||!ed.canvas)return;const real=ed.kind==='screen'?kioskSize().width:ed.kind==='collage'?collageLayout().Width:(model.PhotoOutputWidth||1800);const pct=Math.round(ed.canvas.clientWidth/real*100);
 const info=ed.status.querySelector('.ed-size');if(info)info.textContent=ed.kind==='screen'?`Kiosk ${kioskSize().width} × ${kioskSize().height}`:ed.kind==='collage'?`${collageLayout().Width} × ${collageLayout().Height} px`:(model.PhotoOutputWidth?`${model.PhotoOutputWidth} × ${model.PhotoOutputHeight} px`:'Kameraformat 3:2');
 const z=$('#ed-zoom-label');if(z)z.textContent=(ed.zoom?'':'Anpassen · ')+pct+' %';
}

/* =================== Menüband =================== */
function ribbonGroup(label,...nodes){const g=el('div','rb-group');const inner=el('div','rb-items');inner.append(...nodes);g.append(inner,el('span','rb-label',label));ed.ribbon.append(g);return g;}
function rb(glyph,label,fn,opts={}){const b=button(opts.text?label:'',fn,'rb-btn'+(opts.text?' with-text':''),glyph);b.title=label+(opts.key?' ('+opts.key+')':'');b.setAttribute('aria-label',label);if(opts.cmd)b.dataset.cmd=opts.cmd;return b;}
function menuButton(glyph,label,entries){
 const b=button(label,()=>{if(editorMenu){closeEditorMenu();return;}const menu=el('div','popover-menu editor-context');for(const [t,g,fn,disabled]of entries()){if(t==='-'){menu.append(el('div','menu-sep'));continue;}const m=button(t,()=>{closeEditorMenu();fn();},'menu-item',g);m.disabled=!!disabled;menu.append(m);}document.body.append(menu);const r=b.getBoundingClientRect();menu.style.left=Math.min(r.left,innerWidth-menu.offsetWidth-8)+'px';menu.style.top=r.bottom+4+'px';editorMenu=menu;},'rb-btn with-text menu-trigger',glyph);b.append(icon('caret-down'));return b;
}
function alignEntries(){const n=selectedItems().length,ref=n>1?'Auswahl':'Fläche';return [[`Links (${ref})`,'align-left',()=>editorCommand('align-left'),!n],[`Horizontal zentrieren`,'arrows-h',()=>editorCommand('align-center'),!n],[`Rechts (${ref})`,'align-right',()=>editorCommand('align-right'),!n],['-'],[`Oben (${ref})`,'long-arrow-up',()=>editorCommand('align-top'),!n],['Vertikal zentrieren','arrows-v',()=>editorCommand('align-middle'),!n],[`Unten (${ref})`,'long-arrow-down',()=>editorCommand('align-bottom'),!n],['-'],['Horizontal verteilen','ellipsis-h',()=>editorCommand('distribute-h'),n<3],['Vertikal verteilen','ellipsis-v',()=>editorCommand('distribute-v'),n<3]];}
function buildRibbon(){
 ed.ribbon.replaceChildren();
 if(ed.kind==='screen')ribbonGroup('Bildschirm',rb('repeat','Standardlayout laden',()=>confirmEditorReset(ed.page),{text:true}),rb('question-circle','Editor-Hilfe',()=>editorHelp()));
 if(ed.kind==='screen'){
  ribbonGroup('Einfügen',rb('font','Text',()=>editorAdd('text'),{text:true}),rb('square-o','Button',()=>editorAdd('button'),{text:true}),rb('image','Bild',()=>editorAdd('image'),{text:true}),rb('picture-o','Foto / Diashow',()=>editorAdd('photo')),rb('hand-pointer-o','Klickfläche',()=>editorAdd('clickarea')));
  const font=fontSelect('',v=>patchSel(o=>o.Font=v));font.className='rb-font';font.title='Schriftart';font.setAttribute('aria-label','Schriftart');
  const size=el('input','rb-size');size.type='number';size.min=4;size.max=160;size.title='Schriftgröße';size.setAttribute('aria-label','Schriftgröße');size.onchange=()=>{const v=Math.max(4,Math.min(160,Number(size.value)||24));patchSel(o=>o.FontSize=v);};
  const fg=selColor('Foreground'),textColor=colorControl('#FFFFFF',fg.pick,{label:'Textfarbe',onLive:fg.live});textColor.classList.add('rb-color');textColor.dataset.role='fg';
  const toggleAll=prop=>{const v=!selectedItems().filter(hasText).every(o=>o[prop]);patchSel(o=>o[prop]=v);};ribbonGroup('Text',font,size,rb('bold','Fett',()=>toggleAll('Bold'),{key:'Strg+B',cmd:'bold'}),rb('italic','Kursiv',()=>toggleAll('Italic'),{key:'Strg+I',cmd:'italic'}),rb('align-left','Linksbündig',()=>patchSel(o=>o.Align='left'),{cmd:'al-left'}),rb('align-center','Zentriert',()=>patchSel(o=>o.Align='center'),{cmd:'al-center'}),rb('align-right','Rechtsbündig',()=>patchSel(o=>o.Align='right'),{cmd:'al-right'}),textColor);
  const bgc=selColor('Background',o=>o.Transparent=false),fill=colorControl('#303033',bgc.pick,{label:'Füllfarbe',onLive:bgc.live});fill.classList.add('rb-color');fill.dataset.role='bg';
  ribbonGroup('Form',fill,rb('ban','Ohne Füllung',()=>{const v=!selectedItems().every(o=>o.Transparent);patchSel(o=>o.Transparent=v);},{cmd:'nofill'}),menuButton('square','Form',()=>[['Eckig','square-o',()=>patchSel(o=>o.Radius=0)],['Abgerundet','square',()=>patchSel(o=>o.Radius=12)],['Pille','circle-thin',()=>patchSel(o=>o.Radius=200)],['Kreis','circle',()=>patchSel(o=>{o.Radius=200;o.Height=o.Width*kioskSize().ratio;clampElement(o);})]]));
  ribbonGroup('Anordnen',menuButton('align-center','Ausrichten',alignEntries),rb('angle-double-up','In den Vordergrund',()=>editorCommand('front'),{cmd:'front'}),rb('angle-double-down','In den Hintergrund',()=>editorCommand('back'),{cmd:'back'}));
 }else if(ed.kind==='collage'){
  ribbonGroup('Einfügen',rb('plus-square-o','Bildfeld',()=>editorAdd('slot'),{text:true}),menuButton('th','Raster',()=>[['2 × 2','th-large',()=>applyGrid(2,2)],['2 nebeneinander','columns',()=>applyGrid(2,1)],['3 nebeneinander','columns',()=>applyGrid(3,1)],['3 untereinander','bars',()=>applyGrid(1,3)],['4 untereinander','bars',()=>applyGrid(1,4)],['3 × 2','th',()=>applyGrid(3,2)]]));
  ribbonGroup('Anordnen',menuButton('align-center','Ausrichten',alignEntries),rb('arrows-alt','Gleiche Größe wie erstes',()=>{const s=selectedItems();if(s.length<2)return;remember();for(const o of s.slice(1)){o.Width=s[0].Width;o.Height=s[0].Height;ed.adapter.clamp(o);}changed();redrawAll();syncInspector();},{cmd:'samesize'}));
 }else{
  ribbonGroup('Bildbereich',rb('expand','Randlos',()=>{applyMany({PhotoInsetLeft:0,PhotoInsetRight:0,PhotoInsetTop:0,PhotoInsetBottom:0});editorAfterUpdate();syncInspector();},{text:true}),rb('compress','Rand 5 %',()=>{applyMany({PhotoInsetLeft:5,PhotoInsetRight:5,PhotoInsetTop:5,PhotoInsetBottom:5});editorAfterUpdate();syncInspector();},{text:true}),rb('picture-o','Platz für Text unten',()=>{applyMany({PhotoInsetLeft:4,PhotoInsetRight:4,PhotoInsetTop:4,PhotoInsetBottom:16});editorAfterUpdate();syncInspector();},{text:true}));
 }
 if(ed.kind!=='single')ribbonGroup('Bearbeiten',rb('clone','Duplizieren',()=>editorCommand('duplicate'),{key:'Strg+D',cmd:'dup'}),rb('trash-o','Löschen',()=>editorCommand('delete'),{key:'Entf',cmd:'del'}));
}

function selColor(prop,extra){let live=false;const apply=(o,v)=>{o[prop]=v;extra?.(o);};return {pick:v=>{if(live){live=false;patchSel(o=>apply(o,v),{record:false});}else patchSel(o=>apply(o,v));},live:v=>{if(v==='start'){remember();live=true;return;}for(const o of selectedItems())apply(o,v);redrawAll();changed();}};}
function syncRibbon(){
 if(!ed.ribbon)return;const sel=selectedItems(),o=single(),textItems=sel.filter(hasText);const none=!sel.length;
 ed.ribbon.querySelectorAll('[data-cmd=dup],[data-cmd=del],[data-cmd=front],[data-cmd=back]').forEach(b=>b.disabled=none);
 const sameSize=ed.ribbon.querySelector('[data-cmd=samesize]');if(sameSize)sameSize.disabled=sel.length<2;
 if(ed.kind!=='screen')return;
 const ref=o||textItems[0]||sel[0];const font=ed.ribbon.querySelector('.rb-font'),size=ed.ribbon.querySelector('.rb-size');
 for(const n of [font,size,...ed.ribbon.querySelectorAll('[data-cmd=bold],[data-cmd=italic],[data-cmd^=al-],.rb-color[data-role=fg] button,.rb-color[data-role=fg] input')])n.disabled=!textItems.length;
 for(const n of ed.ribbon.querySelectorAll('.rb-color[data-role=bg] button,.rb-color[data-role=bg] input,[data-cmd=nofill]'))n.disabled=none||sel.every(x=>x.Kind==='clickarea');
 if(ref){font.dataset.value=ref.Font||'';fillFontSelect(font);font.value=ref.Font||'Segoe UI';font.style.fontFamily=ref.Font;size.value=ref.FontSize||24;
  ed.ribbon.querySelector('[data-cmd=bold]').classList.toggle('active',!!ref.Bold);ed.ribbon.querySelector('[data-cmd=italic]').classList.toggle('active',!!ref.Italic);
  for(const a of ['left','center','right'])ed.ribbon.querySelector('[data-cmd=al-'+a+']').classList.toggle('active',(ref.Align||'center')===a);
  ed.ribbon.querySelector('.rb-color[data-role=fg]').setValue(ref.Foreground||'#FFFFFF');ed.ribbon.querySelector('.rb-color[data-role=bg]').setValue(ref.Background||'#303033');ed.ribbon.querySelector('[data-cmd=nofill]').classList.toggle('active',!!ref.Transparent);}
 else{size.value='';}
}
/* Änderung an allen ausgewählten Elementen – ein Rückgängig-Schritt, kein Neuaufbau. */
function patchSel(fn,{record=true,inspector=true}={}){const sel=selectedItems();if(!sel.length)return;if(record)remember();for(const o of sel){fn(o);if(ed.kind==='screen')clampElement(o);ed.adapter.write(o);}changed();redrawAll();if(inspector)buildInspector();syncRibbon();}
function patchOne(o,fn,opts={}){if(opts.record!==false)remember();fn(o);if(ed.kind==='screen'&&opts.clamp!==false)clampElement(o);ed.adapter.write(o);changed();redrawItem(o);if(opts.inspector)buildInspector();if(opts.layers)buildLeft();syncRibbon();}
function applyGrid(cols,rows){const l=collageLayout();remember();const w=(.92-(cols-1)*.025)/cols,h=(.88-(rows-1)*.025)/rows;l.Slots=Array.from({length:cols*rows},(_,i)=>({X:.04+i%cols*(w+.025),Y:.04+Math.floor(i/cols)*(h+.025),Width:w,Height:h,Rotation:0}));ed.sel.clear();changed();editorRebuild();}

/* =================== Linke Spalte: Ebenen bzw. Vorlagen =================== */
function buildLeft(){
 const left=ed.layers;if(!left)return;const keep=left.querySelector('.layer-list')?.scrollTop||0;left.replaceChildren();
 if(ed.kind!=='screen'){buildTemplateList(left);return;}
 const head=el('div','panel-head');head.append(el('h2','','Ebenen'),el('small','hint',screenSubset().length+' Elemente'));left.append(head);
 const list=el('div','layer-list');left.append(list);
 const items=screenSubset();if(!items.length)list.append(el('p','hint empty','Noch keine Elemente. Über „Einfügen“ hinzufügen.'));
 for(const item of [...items].reverse()){
  const r=el('div','layer-row'+(ed.sel.has(item.Id)?' selected':'')+(item.Visible===false?' hidden-layer':''));r.dataset.layerId=item.Id;r.draggable=true;
  const name=button(elementLabel(item),ev=>{selectIds([item.Id],{toggle:ev.shiftKey||ev.ctrlKey||ev.metaKey});},'layer-name',kindIcon(item));
  r.append(name,iconButton(item.Visible===false?'eye-slash':'eye',item.Visible===false?'Einblenden':'Ausblenden',()=>{remember();item.Visible=item.Visible===false;if(item.Visible===false)ed.sel.delete(item.Id);changed();editorRebuild();},'ghost layer-tool'),iconButton(item.Locked?'lock':'unlock-alt',item.Locked?'Entsperren':'Sperren',()=>{remember();item.Locked=!item.Locked;changed();editorRebuild();},'ghost layer-tool'+(item.Locked?' on':'')));
  r.ondragstart=ev=>{ev.dataTransfer.setData('text/plain',item.Id);ev.dataTransfer.effectAllowed='move';r.classList.add('dragging');};
  r.ondragover=ev=>{ev.preventDefault();const after=ev.clientY>r.getBoundingClientRect().top+r.offsetHeight/2;list.querySelectorAll('.layer-row').forEach(n=>n.classList.remove('drag-before','drag-after'));r.classList.add(after?'drag-after':'drag-before');};
  r.ondrop=ev=>{ev.preventDefault();const after=ev.clientY>r.getBoundingClientRect().top+r.offsetHeight/2;reorderLayer(ev.dataTransfer.getData('text/plain'),item.Id,after);};
  r.ondragend=()=>list.querySelectorAll('.layer-row').forEach(n=>n.classList.remove('drag-before','drag-after','dragging'));
  list.append(r);
 }
 list.scrollTop=keep;
}
function paintLayerSelection(){ed.layers?.querySelectorAll('.layer-row').forEach(r=>r.classList.toggle('selected',ed.sel.has(r.dataset.layerId)));}
function reorderLayer(sourceId,targetId,after=false){
 const source=model.ScreenElements.find(e=>e.Id===sourceId),target=model.ScreenElements.find(e=>e.Id===targetId);if(!source||!target||source===target||source.Page!==target.Page)return;remember();
 const visible=model.ScreenElements.filter(e=>e.Page===source.Page).reverse();visible.splice(visible.indexOf(source),1);visible.splice(visible.indexOf(target)+(after?1:0),0,source);
 const backToFront=visible.reverse();let k=0;model.ScreenElements=model.ScreenElements.map(e=>e.Page===source.Page?backToFront[k++]:e);changed();editorRebuild();
}

/* =================== Eigenschaften (rechts) =================== */
function section(host,key,title,build){
 const d=el('details','insp-section');d.open=ed.open[key]!==false;d.ontoggle=()=>{ed.open[key]=d.open;};const s=el('summary','',title);d.append(s);const body=el('div','insp-body');d.append(body);host.append(d);build(body);return d;
}
let inspectorSync=[];
function syncInspector(){for(const f of inspectorSync)f();}
function iField(parent,label,control,cls=''){const w=el('label','insp-field'+(cls?' '+cls:''));w.append(el('span','insp-label',label),control);parent.append(w);return w;}
function iNumber(parent,label,getv,setv,min,max,step=1,unit=''){
 const wrap=el('div','insp-number'),i=el('input');i.type='number';i.min=min;i.max=max;i.step=step;wrap.append(i);if(unit)wrap.append(el('small','',unit));
 const sync=()=>{if(document.activeElement!==i){const v=getv();i.value=v===''||v===undefined?'':Math.round(v*100)/100;}};sync();inspectorSync.push(sync);
 i.onchange=()=>{const v=Number(i.value);if(i.value===''||!Number.isFinite(v))return sync();setv(Math.max(min,Math.min(max,v)));sync();};
 return iField(parent,label,wrap);
}
function iColor(parent,label,getv,setv,cls=''){let live=false;const c=colorControl(getv(),v=>{if(live){live=false;setv(v,false);}else setv(v,true);},{label,onLive:v=>{if(v==='start'){remember();live=true;return;}setv(v,false,true);}});inspectorSync.push(()=>c.setValue(getv()));return iField(parent,label,c,'color '+cls);}
function iSelect(parent,label,items,getv,setv,cls=''){const s=selectControl(items,getv(),v=>setv(v));inspectorSync.push(()=>{if(document.activeElement!==s)s.value=String(getv());});return iField(parent,label,s,cls);}
function iToggle(parent,label,getv,setv){const sw=switchInput(getv(),v=>setv(v));inspectorSync.push(()=>sw.checked=!!getv());const w=iField(parent,label,sw,'toggle');return w;}
function iSeg(parent,label,items,getv,setv){const g=segmented(items,getv(),v=>setv(v),label);inspectorSync.push(()=>g.setValue(getv()));return iField(parent,label,g,'wide');}
function geometryFields(host,o){
 const g=el('div','insp-grid');host.append(g);const set=(k,f)=>v=>patchOne(o,x=>x[k]=f(v));
 iNumber(g,'X',()=>o.X*100,set('X',v=>v/100),-300,300,.1,'%');iNumber(g,'Y',()=>o.Y*100,set('Y',v=>v/100),-300,300,.1,'%');
 iNumber(g,'Breite',()=>o.Width*100,set('Width',v=>Math.max(ed.adapter.min,v/100)),1,400,.1,'%');iNumber(g,'Höhe',()=>o.Height*100,set('Height',v=>Math.max(ed.adapter.min,v/100)),1,100,.1,'%');
 if(ed.adapter.rotate)iNumber(g,'Drehung',()=>o.Rotation||0,set('Rotation',v=>Math.round(v)),-180,180,1,'°');
}
function buildInspector(){
 const host=ed.inspector;if(!host)return;const keep=host.scrollTop;host.replaceChildren();inspectorSync=[];
 const sel=selectedItems();
 if(ed.kind==='collage')collageInspector(host,sel);else if(ed.kind==='single')singleInspector(host);
 else if(sel.length>1)multiInspector(host,sel);else if(sel.length===1)elementInspector(host,sel[0]);else screenInspector(host);
 host.scrollTop=keep;
}
function inspectorHead(host,glyph,title,actions=[]){const h=el('div','insp-head');h.append(icon(glyph),el('strong','',title));const a=el('div','insp-actions');a.append(...actions);h.append(a);host.append(h);}
function screenInspector(host){
 inspectorHead(host,'desktop','Bildschirm');
 section(host,'bg','Hintergrund',b=>{
  iColor(b,'Farbe',()=>get(editorBackgroundKey(ed.page)),(v,rec)=>{if(rec)remember();set(editorBackgroundKey(ed.page),v);changed();redrawAll();});
  if(ed.page==='welcome')b.append(assetControl(model.WelcomeScreenImage,()=>action('asset',{key:'WelcomeScreenImage'}),()=>{update('WelcomeScreenImage','');buildCanvas();}));
  if(ed.page==='home'){iSeg(b,'Art',[['live','Live'],['image','Bild'],['video','Video'],['color','Farbe']],()=>model.HomeBackgroundMode,v=>{update('HomeBackgroundMode',v);buildCanvas();buildInspector();});
   if(model.HomeBackgroundMode==='image')b.append(assetControl(model.StartBackgroundImage,()=>action('asset',{key:'StartBackgroundImage'}),()=>{remember();model.StartBackgroundImage='';changed();buildCanvas();buildInspector();}));
   if(model.HomeBackgroundMode==='video')b.append(assetControl(model.StartBackgroundVideo,()=>action('asset',{key:'StartBackgroundVideo'}),()=>{remember();model.StartBackgroundVideo='';changed();buildInspector();},{formats:'MP4, WebM oder GIF'}));}
  if(ed.page==='gallery')b.append(assetControl(model.GalleryBackgroundImage,()=>action('asset',{key:'GalleryBackgroundImage'}),()=>{remember();model.GalleryBackgroundImage='';changed();buildCanvas();buildInspector();}));
 });


}
function multiInspector(host,sel){
 inspectorHead(host,'object-group',sel.length+' Elemente',[iconButton('clone','Duplizieren',()=>editorCommand('duplicate'),'ghost small'),iconButton('trash-o','Löschen',()=>editorCommand('delete'),'ghost small')]);
 section(host,'align','Ausrichten',b=>{const g=el('div','align-grid');for(const [cmd,glyph,label]of [['align-left','align-left','Links'],['align-center','arrows-h','Mitte'],['align-right','align-right','Rechts'],['align-top','long-arrow-up','Oben'],['align-middle','arrows-v','Mittig'],['align-bottom','long-arrow-down','Unten'],['distribute-h','ellipsis-h','Horizontal verteilen'],['distribute-v','ellipsis-v','Vertikal verteilen']]){const x=iconButton(glyph,label,()=>editorCommand(cmd),'small');if(cmd.startsWith('distribute')&&sel.length<3)x.disabled=true;g.append(x);}b.append(g);b.append(el('p','hint','Bezieht sich auf die gemeinsame Auswahl.'));});
 if(ed.kind==='screen'&&sel.some(hasText))section(host,'text','Text',b=>textFields(b,sel.find(hasText),true));
}
function textFields(b,o,all=false){
 const apply=(fn,inspector=false)=>all?patchSel(fn,{inspector}):patchOne(o,fn,{inspector});
 const g=el('div','insp-grid');b.append(g);
 iField(g,'Schrift',(()=>{const s=fontSelect(o.Font,v=>apply(x=>x.Font=v));inspectorSync.push(()=>{if(document.activeElement!==s){s.value=o.Font;s.style.fontFamily=o.Font;}});return s;})(),'wide');
 iNumber(g,'Größe',()=>o.FontSize,v=>apply(x=>x.FontSize=Math.round(v)),4,160,1,'px');iNumber(g,'Zeilenhöhe',()=>o.LineHeight||1.2,v=>apply(x=>x.LineHeight=v),.8,3,.1,'');
 iColor(g,'Farbe',()=>o.Foreground,(v,rec,live)=>{if(live){for(const x of all?selectedItems():[o])x.Foreground=v;redrawAll();changed();return;}apply(x=>x.Foreground=v);},'wide');
 const style=el('div','button-row compact');for(const [k,glyph,label]of [['Bold','bold','Fett'],['Italic','italic','Kursiv']]){const t=iconButton(glyph,label,()=>{apply(x=>x[k]=!o[k]);t.classList.toggle('active',!!o[k]);},'small'+(o[k]?' active':''));style.append(t);}
 const align=segmented([['left','','align-left'],['center','','align-center'],['right','','align-right']],o.Align||'center',v=>apply(x=>x.Align=v),'Ausrichtung');style.append(align);inspectorSync.push(()=>align.setValue(o.Align||'center'));
 iField(g,'Stil',style,'wide');
}
function elementInspector(host,o){
 const idx=model.ScreenElements.indexOf(o),path='ScreenElements.'+idx;
 inspectorHead(host,kindIcon(o),elementLabel(o),[iconButton('clone','Duplizieren (Strg+D)',()=>editorCommand('duplicate'),'ghost small'),iconButton('trash-o','Löschen (Entf)',()=>editorCommand('delete'),'ghost small')]);
 section(host,'content','Inhalt',b=>{
  if(isUnifiedHomeStart(o,model)){const text=el('textarea','insp-text');text.rows=2;text.maxLength=80;text.value=model.UnifiedStartLabel||'Start';text.onchange=()=>{if(!text.value.trim())return;remember();model.UnifiedStartLabel=text.value;redrawAll();changed();buildLeft();};iField(b,'Startbuttontext',text,'wide');}
  else if(['text','button','clickarea'].includes(o.Kind)&&!['filename','counter','date'].includes(o.Binding)){const t=el('textarea','insp-text');t.rows=2;t.maxLength=200;t.value=o.Text||'';t.placeholder=o.Kind==='clickarea'?'Bezeichnung (unsichtbar)':'Text';t.oninput=()=>{o.Text=t.value;const n=nodeOf(o)?.querySelector('.element-text');if(n)n.textContent=t.value;else redrawItem(o);};t.onfocus=()=>{t.dataset.before=o.Text||'';};t.onchange=()=>{const now=t.value;o.Text=t.dataset.before;remember();o.Text=now;changed();buildLeft();};iField(b,o.Kind==='clickarea'?'Bezeichnung':'Text',t,'wide');}
  if(['button','clickarea'].includes(o.Kind))iSelect(b,'Aktion beim Antippen',elementActions,()=>o.Action,v=>patchOne(o,x=>x.Action=v),'wide');
  if(o.Kind==='text')iSelect(b,'Textquelle',[['','Eigener Text'],['filename','Bildname'],['counter','Bildzähler'],['date','Aufnahmedatum']],()=>o.Binding,v=>patchOne(o,x=>x.Binding=v,{inspector:true,layers:true}),'wide');
  if(o.Kind==='image'||o.Kind==='viewport'&&['photo','latest','slideshow',''].includes(o.Binding)){
   iSelect(b,'Bildquelle',[['','Eigene Datei'],['photo','Aktuelles Ergebnis / geöffnetes Foto'],['latest','Neuestes Foto im Event'],['slideshow','Diashow der Eventfotos'],...(o.Page==='download'?[['wifiqr','WLAN-QR-Code'],['downloadqr','Foto-QR-Code']]:[])],()=>o.Binding,v=>patchOne(o,x=>{x.Binding=v;if(v===''&&x.Kind==='viewport')x.Kind='image';if(v&&x.Kind==='image'&&['photo','latest','slideshow'].includes(v))x.Kind='viewport';},{inspector:true,layers:true}),'wide');
   iSelect(b,'Bilddarstellung',[['cover','Ausfüllen'],['contain','Ganz einpassen']],()=>o.ImageFit||'contain',v=>patchOne(o,x=>x.ImageFit=v),'wide');if(!o.Binding)b.append(assetControl(o.Image,()=>action('asset',{key:'Element.Image',id:o.Id}),null));
  }
  if(['text','button'].includes(o.Kind)&&!o.Binding){const pick=button(o.Icon?o.Icon.replace(/-o$/,'').replace(/-/g,' '):'Kein Symbol',ev=>openIconPicker(ev.currentTarget,o.Icon,v=>patchOne(o,x=>x.Icon=v,{inspector:true})),'small icon-pick',o.Icon||'ban');iField(b,'Symbol',pick,'wide');if(o.Icon)iNumber(b,'Symbolgröße',()=>o.IconSize||0,v=>patchOne(o,x=>x.IconSize=Math.round(v)),0,512,1,'px · 0 = Text');}
 });
 if(o.Binding==='slideshow')section(host,'slide','Diashow',b=>{
  iSeg(b,'Darstellung',[['single','Einzelbild'],['conveyor','Förderband']],()=>o.SlideshowMode,v=>patchOne(o,x=>x.SlideshowMode=v,{inspector:true}));
  const g=el('div','insp-grid');b.append(g);iNumber(g,o.SlideshowMode==='conveyor'?'s je Bild':'Wechsel',()=>o.SlideSeconds,v=>patchOne(o,x=>x.SlideSeconds=Math.round(v)),2,60,1,'s');
  if(o.SlideshowMode==='conveyor'){iSelect(g,'Richtung',[['right','Nach rechts'],['left','Nach links']],()=>o.ConveyorDirection,v=>patchOne(o,x=>x.ConveyorDirection=v));iNumber(g,'Format',()=>o.SlideAspect,v=>patchOne(o,x=>x.SlideAspect=v),.25,8,.05);iNumber(g,'Abstand',()=>o.SlideGap,v=>patchOne(o,x=>x.SlideGap=Math.round(v)),0,80,1,'px');iNumber(g,'Rahmen',()=>o.SlideBorderWidth,v=>patchOne(o,x=>x.SlideBorderWidth=Math.round(v)),0,20,1,'px');iColor(g,'Rahmenfarbe',()=>o.SlideBorderColor,(v,rec)=>patchOne(o,x=>x.SlideBorderColor=v,{record:rec}));iNumber(g,'Schatten',()=>o.SlideShadow,v=>patchOne(o,x=>x.SlideShadow=Math.round(v)),0,60,1,'px');iNumber(g,'Ecken',()=>o.SlideRadius,v=>patchOne(o,x=>x.SlideRadius=Math.round(v)),0,100,1,'px');b.append(button('Bildschirmbreit',()=>patchOne(o,x=>{x.X=0;x.Width=1;x.Height=Math.min(x.Height,.35);x.Y=Math.min(x.Y,1-x.Height);}),'small','arrows-h'));}
 });
 if(hasText(o)&&!['filename','counter','date'].includes(o.Binding)||o.Kind==='text')section(host,'text','Text',b=>textFields(b,o));
 if(o.Kind!=='clickarea'&&!['gallery'].includes(o.Binding))section(host,'box','Fläche & Rahmen',b=>{
  const g=el('div','insp-grid');b.append(g);
  iToggle(g,'Fläche füllen',()=>!o.Transparent,v=>patchOne(o,x=>x.Transparent=!v));
  iColor(g,'Füllfarbe',()=>o.Background,(v,rec,live)=>{if(live){o.Background=v;o.Transparent=false;redrawItem(o);changed();return;}patchOne(o,x=>{x.Background=v;x.Transparent=false;},{record:rec});});
  iNumber(g,'Deckkraft Fläche',()=>o.BackgroundOpacity??100,v=>patchOne(o,x=>x.BackgroundOpacity=Math.round(v)),0,100,1,'%');iNumber(g,'Ecken',()=>o.Radius??12,v=>patchOne(o,x=>x.Radius=Math.round(v)),0,200,1,'px');
  iColor(g,'Rahmenfarbe',()=>o.BorderColor,(v,rec,live)=>{if(live){o.BorderColor=v;redrawItem(o);changed();return;}patchOne(o,x=>x.BorderColor=v,{record:rec});});iNumber(g,'Rahmen',()=>o.BorderWidth||0,v=>patchOne(o,x=>x.BorderWidth=Math.round(v)),0,20,1,'px');
  iNumber(g,'Schatten',()=>o.Shadow||0,v=>patchOne(o,x=>x.Shadow=Math.round(v)),0,60,1,'px');iNumber(g,'Unschärfe',()=>o.Blur||0,v=>patchOne(o,x=>x.Blur=Math.round(v)),0,60,1,'px');iNumber(g,'Deckkraft',()=>o.Opacity??100,v=>patchOne(o,x=>x.Opacity=Math.round(v)),0,100,1,'%');
 });
 section(host,'pos','Position & Größe',b=>{geometryFields(b,o);const a=el('div','button-row compact');a.append(button('Zentrieren',()=>editorCommand('align-center'),'small','arrows-h'),button('Mittig',()=>editorCommand('align-middle'),'small','arrows-v'));b.append(a);});
 section(host,'layer','Ebene',b=>{const g=el('div','insp-grid');b.append(g);iToggle(g,'Sichtbar',()=>o.Visible!==false,v=>{remember();o.Visible=v;if(!v)ed.sel.delete(o.Id);changed();editorRebuild();});iToggle(g,'Gesperrt',()=>!!o.Locked,v=>{remember();o.Locked=v;changed();editorRebuild();});
  const order=el('div','button-row compact');order.append(button('Nach vorn',()=>editorCommand('up'),'small','angle-up'),button('Nach hinten',()=>editorCommand('down'),'small','angle-down'));b.append(order);});
 void path;
}
function collageInspector(host,sel){
 const l=collageLayout(),path='CollageTemplates.'+layoutIndex;
 if(sel.length===1){const o=sel[0],i=l.Slots.indexOf(o);inspectorHead(host,'square-o','Bildfeld '+(i+1),[iconButton('clone','Duplizieren',()=>editorCommand('duplicate'),'ghost small'),iconButton('trash-o','Entfernen',()=>editorCommand('delete'),'ghost small')]);section(host,'pos','Position & Größe',b=>geometryFields(b,o));}
 else if(sel.length>1)multiInspector(host,sel);
 inspectorHead(host,'th-large','Vorlage',[iconButton('clone','Vorlage duplizieren',()=>{if(model.CollageTemplates.length>=12){notify('Höchstens zwölf Vorlagen.','error');return;}remember();model.CollageTemplates.push({...copy(l),Id:crypto.randomUUID().replaceAll('-',''),Name:l.Name+' · Kopie'});layoutIndex=model.CollageTemplates.length-1;ed.sel.clear();changed();editorRebuild();},'ghost small'),iconButton('trash-o','Vorlage entfernen',async()=>{if(model.CollageTemplates.length<2){notify('Mindestens eine Collagevorlage behalten.','error');return;}if(await confirmDialog('Vorlage entfernen?','„'+l.Name+'“ wird entfernt. Gespeicherte Fotos bleiben unverändert.','Entfernen',{danger:true})){remember();if(model.DefaultCollageLayout>layoutIndex)model.DefaultCollageLayout--;else if(model.DefaultCollageLayout===layoutIndex)model.DefaultCollageLayout=0;model.CollageTemplates.splice(layoutIndex,1);layoutIndex=0;ed.sel.clear();changed();editorRebuild();}},'ghost small')]);
 section(host,'tpl','Vorlage',b=>{
  const name=el('input');name.value=l.Name;name.maxLength=80;name.onchange=()=>{if(!name.value.trim()){name.value=l.Name;return;}remember();l.Name=name.value.trim();changed();buildLeft();};iField(b,'Name',name,'wide');
  const g=el('div','insp-grid');b.append(g);
  iNumber(g,'Breite',()=>l.Width,v=>{remember();l.Width=Math.round(v);changed();layoutCanvas();buildLeft();},600,6000,1,'px');iNumber(g,'Höhe',()=>l.Height,v=>{remember();l.Height=Math.round(v);changed();layoutCanvas();buildLeft();},600,6000,1,'px');
  iSeg(b,'Fotoausschnitt',[[0,'Füllend'],[1,'Ganz einpassen']],()=>l.Fit,v=>{remember();l.Fit=Number(v);changed();redrawAll();});
  iColor(b,'Hintergrund',()=>l.Background,(v,rec)=>{if(rec)remember();l.Background=v;changed();ed.canvas.style.background=v;buildLeft();});
 });
 section(host,'frame','Rahmen & Text',b=>{
  b.append(assetControl(l.Frame,()=>action('asset',{key:'Template.Frame',index:layoutIndex}),()=>{remember();l.Frame='';changed();buildCanvas();buildInspector();},{empty:'Kein Rahmen (PNG mit Transparenz)'}));
  if(l.Frame){if(!l.FramePlacement)l.FramePlacement={Fit:'contain',X:50,Y:50,Scale:100};iSelect(b,'Rahmendarstellung',[['contain','Ganz einpassen'],['cover','Ausfüllen']],()=>l.FramePlacement.Fit,v=>{remember();l.FramePlacement.Fit=v;changed();buildCanvas();});for(const [key,title,min,max]of [['Scale','Rahmengröße',20,300],['X','Horizontal',0,100],['Y','Vertikal',0,100]])iNumber(b,title,()=>l.FramePlacement[key],v=>{remember();l.FramePlacement[key]=v;changed();buildCanvas();},min,max,1,'%');}
  if(l.Frame)iNumber(b,'Rahmen drehen',()=>l.FrameRotation||0,v=>{remember();l.FrameRotation=Math.round(v);changed();buildCanvas();},-180,180,1,'°');
  const cap=el('input');cap.value=l.Caption;cap.maxLength=150;cap.placeholder='z. B. {event} · 2026';cap.onchange=()=>{remember();l.Caption=cap.value;changed();buildCanvas();};iField(b,'Bildtext',cap,'wide');
  iColor(b,'Textfarbe',()=>l.CaptionColor||'#212121',(v,rec)=>{if(rec)remember();l.CaptionColor=v;changed();buildCanvas();});
 });
}
function singleInspector(host){
 const templates=model.SingleTemplates;
 inspectorHead(host,'square-o',singleIndex>=0&&templates[singleIndex]?templates[singleIndex].Name:'Einzelfoto',[...(templates.length&&templates.length<12?[iconButton('clone','Vorlage duplizieren',()=>{remember();const i=singleIndex<0?0:singleIndex;templates.push({...copy(templates[i]),Id:crypto.randomUUID().replaceAll('-',''),Name:templates[i].Name+' · Kopie'});chooseSingle(templates.length-1);},'ghost small')]:[]),...(templates.length>1?[iconButton('trash-o','Vorlage entfernen',async()=>{if(await confirmDialog('Vorlage entfernen?','Die Vorlage wird entfernt. Gespeicherte Fotos bleiben unverändert.','Entfernen',{danger:true})){remember();const removed=Math.max(0,singleIndex);if(model.DefaultSingleLayout>removed)model.DefaultSingleLayout--;else if(model.DefaultSingleLayout===removed)model.DefaultSingleLayout=0;templates.splice(removed,1);chooseSingle(0);}},'ghost small')]:[])]);
 section(host,'tpl','Vorlage',b=>{
  if(singleIndex>=0&&templates[singleIndex]){const name=el('input');name.value=templates[singleIndex].Name;name.maxLength=80;name.onchange=()=>{if(!name.value.trim())return;remember();templates[singleIndex].Name=name.value.trim();changed();buildLeft();};iField(b,'Name',name,'wide');}
  const formats=[...singleFormats];const current=model.PhotoOutputWidth?model.PhotoOutputWidth+'x'+model.PhotoOutputHeight:'0';if(!formats.some(f=>f[0]===current))formats.push([current,model.PhotoOutputWidth+' × '+model.PhotoOutputHeight]);
  iSelect(b,'Format',formats,()=>current,v=>{remember();const d=v==='0'?[0,0]:v.split('x').map(Number);model.PhotoOutputWidth=d[0];model.PhotoOutputHeight=d[1];changed();editorRebuild();},'wide');
  iSeg(b,'Fotoausschnitt',[[0,'Ausfüllen'],[1,'Einpassen']],()=>model.PhotoFitMode??1,v=>{update('PhotoFitMode',Number(v));redrawAll();});
  iColor(b,'Hintergrund',()=>model.PhotoBackground,(v,rec)=>{if(rec)remember();model.PhotoBackground=v;changed();ed.canvas.style.background=v;});
 });
 section(host,'frame','Rahmen & Text',b=>{
  b.append(assetControl(model.PhotoFrame,()=>action('asset',{key:'PhotoFrame',singleIndex}),()=>{remember();model.PhotoFrame='';changed();editorRebuild();},{empty:'Kein Rahmen (PNG mit Transparenz)'}));
  if(model.PhotoFrame)mediaPlacementFields(b,'PhotoFrame');const cap=el('input');cap.value=model.PhotoCaption;cap.maxLength=150;cap.placeholder='z. B. {event}';cap.onchange=()=>{remember();model.PhotoCaption=cap.value;changed();buildCanvas();};iField(b,'Bildtext',cap,'wide');
  iColor(b,'Textfarbe',()=>model.PhotoCaptionColor,(v,rec)=>{if(rec)remember();model.PhotoCaptionColor=v;changed();buildCanvas();});
 });
 section(host,'pos','Bildränder',b=>{const g=el('div','insp-grid');b.append(g);for(const [k,label]of [['Left','Links'],['Right','Rechts'],['Top','Oben'],['Bottom','Unten']])iNumber(g,label,()=>model['PhotoInset'+k],v=>{const key='PhotoInset'+k,other={Left:'Right',Right:'Left',Top:'Bottom',Bottom:'Top'}[k];remember();model[key]=Math.max(0,Math.min(40,Math.round(v),75-model['PhotoInset'+other]));changed();editorAfterUpdate();},0,40,1,'%');b.append(el('p','hint','Den Bildbereich auch direkt auf der Fläche an den Griffen ziehen.'));});
}

/* =================== Fotovorlagen =================== */
function photoDraft(name='Einzelfoto'){const t={Name:name,Id:model.SingleTemplates?.[singleIndex]?.Id||crypto.randomUUID().replaceAll('-',''),FramePlacement:copy(model.MediaPlacements?.PhotoFrame||{Fit:'contain',X:50,Y:50,Scale:100})};for(const [k,v]of Object.entries(photoKeys))t[k]=model[v];return t;}
function syncSingle(){if(model&&route.page==='templates'&&route.sub==='single'&&singleIndex>=0&&model.SingleTemplates?.[singleIndex])model.SingleTemplates[singleIndex]=photoDraft(model.SingleTemplates[singleIndex].Name);}
hooks.beforeChange.push(syncSingle);
function chooseSingle(i){singleIndex=i;model.MediaPlacements??={};model.MediaPlacements.PhotoFrame=copy(model.SingleTemplates[i].FramePlacement||{Fit:'contain',X:50,Y:50,Scale:100});for(const [k,v]of Object.entries(photoKeys))model[v]=model.SingleTemplates[i][k]??(k==='Fit'?1:0);changed();editorRebuild();}
function grid(cols,rows,portrait=false){const w=(.92-(cols-1)*.025)/cols,h=(.85-(rows-1)*.025)/rows;return {Id:crypto.randomUUID().replaceAll('-',''),Name:cols+' × '+rows,Width:portrait?1200:1800,Height:portrait?1800:1200,Background:'#FFFFFF',Caption:'',CaptionColor:'#212121',Frame:'',FrameRotation:0,Fit:0,Slots:Array.from({length:cols*rows},(_,i)=>({X:.04+i%cols*(w+.025),Y:.04+Math.floor(i/cols)*(h+.025),Width:w,Height:h,Rotation:0}))};}
function mini(layout,max=[150,84]){const box=el('div','layout-mini');const scale=Math.min(max[0]/layout.Width,max[1]/layout.Height);box.style.width=layout.Width*scale+'px';box.style.height=layout.Height*scale+'px';box.style.background=layout.Background||'#fff';for(const s of layout.Slots){const n=el('span');Object.assign(n.style,{left:s.X*100+'%',top:s.Y*100+'%',width:s.Width*100+'%',height:s.Height*100+'%',transform:`rotate(${s.Rotation||0}deg)`});box.append(n);}if(layout.Frame){const img=el('img');img.alt='';img.src=mediaUrl(layout.Frame);box.append(img);}return box;}
function singleMini(t){return mini({Width:t.Width||1800,Height:t.Height||1200,Background:t.Background,Frame:t.Frame,Slots:[{X:(t.Left||0)/100,Y:(t.Top||0)/100,Width:1-((t.Left||0)+(t.Right||0))/100,Height:1-((t.Top||0)+(t.Bottom||0))/100}]});}
function buildTemplateList(left){
 const single=ed.kind==='single';const templates=single?model.SingleTemplates:model.CollageTemplates;
 const head=el('div','panel-head');head.append(el('h2','','Vorlagen'),iconButton('plus','Vorlage hinzufügen',addTemplate,'ghost small add-template'));left.append(head);
 const list=el('div','template-list');list.dataset.keepScroll='templates';left.append(list);
 const items=templates.length?templates:[photoDraft()];
 items.forEach((t,i)=>{const selected=single?(singleIndex<0?i===0:singleIndex===i):layoutIndex===i;
  const b=button('',()=>{if(single){if(templates.length&&singleIndex!==i)chooseSingle(i);}else if(layoutIndex!==i){layoutIndex=i;ed.sel.clear();editorRebuild();}},'template-card'+(selected?' selected':''));b.setAttribute('aria-pressed',String(selected));
  const text=el('span','template-card-text');text.append(el('strong','',t.Name),el('small','',single?(t.Width?t.Width+' × '+t.Height:'Kameraformat'):t.Slots.length+' Bilder · '+t.Width+' × '+t.Height));
  b.append(el('span','template-num',String(i+1)),single?singleMini(t):mini(t),text);list.append(b);});
 list.append(el('p','hint template-hint',templates.length>1?((single?model.ChooseSingleLayout:model.ChooseCollageLayout)?'Gäste wählen zwischen diesen Vorlagen.':'Es wird Vorlage 1 verwendet. Auswahl im Gästeablauf aktivierbar.'):'Mit mehreren Vorlagen können Gäste wählen.'));
}
function addTemplate(){
 openDialog('Vorlage hinzufügen',(body,ctx)=>{
  const choices=el('div','template-choices');const single=ed.kind==='single'||route.sub==='single';
  const entries=single?singleFormats.slice(0,4):[['4','Vierer-Raster'],['3','Dreier-Streifen'],['strip','Vierer-Streifen'],['2','Zwei Bilder']];
  for(const [key,title]of entries){
   const preview=single?(()=>{const [w,h]=key==='0'?[1800,1200]:key.split('x').map(Number);return singleMini({Width:w,Height:h,Background:'#ffffff',Left:4,Right:4,Top:4,Bottom:4});})():mini(key==='3'?grid(1,3,true):key==='strip'?grid(1,4,true):key==='2'?grid(2,1):grid(2,2));
   const b=button('',()=>{
    const list=single?model.SingleTemplates:model.CollageTemplates;if(list.length>=12){notify('Höchstens zwölf Vorlagen.','error');return;}remember();
    if(single){if(!list.length)list.push(photoDraft('Einzelfoto'));const size=key==='0'?[0,0]:key.split('x').map(Number);list.push({Id:crypto.randomUUID().replaceAll('-',''),Name:title,Width:size[0],Height:size[1],Frame:'',Caption:'',Background:'#FFFFFF',Left:0,Right:0,Top:0,Bottom:0,Fit:0,FramePlacement:{Fit:'contain',X:50,Y:50,Scale:100}});singleIndex=list.length-1;model.MediaPlacements??={};model.MediaPlacements.PhotoFrame=copy(list[singleIndex].FramePlacement);for(const [k,v]of Object.entries(photoKeys))model[v]=list[singleIndex][k];}
    else{const l=key==='3'?grid(1,3,true):key==='strip'?grid(1,4,true):key==='2'?grid(2,1):grid(2,2);l.Name=title;list.push(l);layoutIndex=list.length-1;}
    ctx.close(true);ed.sel.clear();changed();if(editorActive())editorRebuild();else render();},'template-choice');
   b.append(preview,el('span','',title));choices.append(b);
  }
  body.append(choices);
 },{cls:'template-picker'});
}
function templateEditor(root,isSingle){
 if(!model.CollageTemplates.length)model.CollageTemplates=[copy(model.Layout)];if(!model.SingleTemplates)model.SingleTemplates=[];
 if(singleIndex>=model.SingleTemplates.length)singleIndex=-1;
 if(isSingle&&singleIndex<0&&model.SingleTemplates.length){singleIndex=Math.max(0,model.SingleTemplates.findIndex(t=>t.Frame===model.PhotoFrame&&t.Width===model.PhotoOutputWidth&&t.Height===model.PhotoOutputHeight));for(const [k,v]of Object.entries(photoKeys))model[v]=model.SingleTemplates[singleIndex][k];}
 document.body.classList.add('editor-page');root.className='editor-layout';
 $('#page-actions').append(button('Vorlage hinzufügen',addTemplate,'small add-template','plus'));
 buildEditor(root,isSingle?'single':'collage','');
}

/* =================== Standardaufbau als Ausgangspunkt =================== */
function confirmEditorReset(page){confirmDialog('Standardlayout laden?','Die Elemente dieses Bildschirms werden durch den aktuellen Standardaufbau ersetzt. Andere Bildschirme und Hintergründe bleiben erhalten.','Standardlayout laden').then(ok=>{if(ok)resetEditorToStandard(page);});}
function rgbInfo(value){const str=String(value),srgb=str.match(/^color\(srgb\s+(.+)\)$/),rgb=str.match(/^rgba?\((.+)\)$/);if(srgb||rgb){const parts=(srgb||rgb)[1].match(/-?[\d.]+%?/g)||[],num=(v,unit)=>v?.endsWith('%')?parseFloat(v)*unit/100:parseFloat(v),colors=parts.slice(0,3).map(v=>Math.max(0,Math.min(255,Math.round(num(v,srgb?1:255)*(srgb?255:1))))),alpha=parts[3]?num(parts[3],1):1;if(colors.length===3&&colors.every(Number.isFinite))return {hex:('#'+colors.map(v=>v.toString(16).padStart(2,'0')).join('')).toUpperCase(),opacity:Math.round(Math.max(0,Math.min(1,alpha))*100)};}const c=document.createElement('canvas');c.width=c.height=1;const x=c.getContext('2d');x.fillStyle=value||'transparent';x.fillRect(0,0,1,1);const p=x.getImageData(0,0,1,1).data;return {hex:('#'+[p[0],p[1],p[2]].map(v=>v.toString(16).padStart(2,'0')).join('')).toUpperCase(),opacity:Math.round(p[3]/255*100)};}
async function captureStandardLayout(page){
 const size=kioskSize(),host=el('div','capture-host');const frame=el('iframe');frame.src='kiosk.html?editor&v=0.26.1';frame.style.cssText=`position:fixed;left:-30000px;top:0;width:${size.width}px;height:${size.height}px;border:0;visibility:hidden`;host.append(frame);document.body.append(host);
 try{
  await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Der Standardaufbau ist noch nicht geladen. Bitte erneut versuchen.')),8000);frame.onload=()=>{const wait=()=>frame.contentWindow?.receive?(clearTimeout(t),resolve()):setTimeout(wait,30);wait();};});
  const w=frame.contentWindow,config=copy(model);config[designKey(page)]=false;if(page==='selection'){config.FreeGalleryDesign=false;config.FreeSelectionDesign=false;}
  const sheet=w.document.createElement('style');sheet.textContent='*{animation:none!important;transition:none!important}';w.document.head.append(sheet);
  w.receive({type:'preview',settings:config,page:page==='download'?'downloadPreview':page==='selection'?'selectionPreview':page,interactive:false,captureNonce:Date.now()});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  const d=w.document,root=page==='download'?d.querySelector('.dialog'):d.body,r=root.getBoundingClientRect(),scale=r.width/1280,elements=[];
  const take=(node,kind,binding='',act='home',rectangle=null)=>{if(!node)return;const cr=rectangle||node.getBoundingClientRect(),style=w.getComputedStyle(node);if(cr.width<1||cr.height<1||style.display==='none')return;const x=Math.max(0,(cr.left-r.left)/r.width),y=Math.max(0,(cr.top-r.top)/r.height),width=Math.min(1-x,cr.width/r.width),height=Math.min(1-y,cr.height/r.height);if(width<.005||height<.005)return;
   const bg=rgbInfo(style.backgroundColor),fg=rgbInfo(style.color),border=rgbInfo(style.borderTopColor),iconNode=node.querySelector('i.fa'),iconName=iconNode?[...iconNode.classList].find(c=>c.startsWith('fa-')&&!['fa-fw','fa-spin'].includes(c))?.slice(3)||'':'';const label=kind==='button'?(node.querySelector('span')?.textContent||''):node.textContent||'';
   const item=seedElement(page,kind,label.trim().slice(0,200),act,x,y,width,height,{Binding:binding,FontSize:Math.max(4,Math.min(160,Math.round(parseFloat(style.fontSize)/scale)||24)),Foreground:fg.hex,Background:bg.hex,BackgroundOpacity:bg.opacity,Transparent:bg.opacity===0,BorderColor:border.hex,BorderOpacity:border.opacity,BorderWidth:Math.min(20,Math.round(parseFloat(style.borderTopWidth)/scale)||0),Radius:Math.min(200,Math.round(parseFloat(style.borderTopLeftRadius)/scale)||0),Blur:Math.min(60,Math.round((parseFloat(style.backdropFilter.match(/[\d.]+/)?.[0])||0)/scale)),Opacity:Math.round(Number(style.opacity)*100),LineHeight:Math.max(.8,Math.min(3,(parseFloat(style.lineHeight)||parseFloat(style.fontSize)*1.2)/parseFloat(style.fontSize))),Font:style.fontFamily.split(',')[0].replace(/["']/g,'')||'Segoe UI',Bold:Number(style.fontWeight)>=600,Italic:style.fontStyle==='italic',Align:style.textAlign==='left'?'left':style.textAlign==='right'?'right':'center',Icon:/^[a-z0-9-]{0,50}$/.test(iconName)?iconName:'',IconSize:iconNode?Math.max(4,Math.min(512,Math.round(parseFloat(w.getComputedStyle(iconNode).fontSize)/scale))):0});
   if(binding==='filename'){item.Width=Math.max(item.Width,.48);item.Align='left';item.FontSize=Math.min(item.FontSize,36);}
   if(kind==='image')item.AspectRatio=cr.width/cr.height;if(binding==='photo'){item.Transparent=true;item.Text='Foto';}if(binding==='gallery'){item.Transparent=true;item.Text='Galerieraster';item.GridPadding=0;}if(!elementActions.some(a=>a[0]===item.Action))item.Action='home';elements.push(item);};
  if(page==='welcome'){const text=d.querySelector('.welcome-activate span');if(text)take(text,'text');take(d.querySelector('.welcome-activate'),'clickarea','','activate');}
  if(page==='home'){d.querySelectorAll('.welcome h1,.welcome p').forEach(n=>take(n,'text'));const logo=d.querySelector('.start-logo');if(logo){take(logo,'image');elements.at(-1).Image=model.StartLogo;}d.querySelectorAll('.start-actions button').forEach(n=>take(n,'button','',n.dataset.action));}
  else if(page==='result'){take(d.querySelector('#result>.result-photo'),'viewport','photo');d.querySelectorAll('#result .topbar button,#result .bottom-actions button').forEach(n=>take(n,'button','',n.dataset.action));}
  else if(page==='viewer'){take(d.querySelector('.viewer>.result-photo'),'viewport','photo');for(const [sel,binding]of [['.viewer-filename','filename'],['.viewer-name time','date'],['.image-counter','counter']])take(d.querySelector(sel),'text',binding);d.querySelectorAll('.viewer button').forEach(n=>take(n,'button','',n.dataset.action));}
  else if(page==='gallery'){take(d.querySelector('.gallery h1'),'text');const body=d.querySelector('.gallery-body');if(body){const rect=body.getBoundingClientRect(),s=w.getComputedStyle(body),l=parseFloat(s.paddingLeft)||0,t=parseFloat(s.paddingTop)||0;take(body,'viewport','gallery','home',{left:rect.left+l,top:rect.top+t,width:rect.width-l-(parseFloat(s.paddingRight)||0),height:rect.height-t-(parseFloat(s.paddingBottom)||0)});}d.querySelectorAll('.gallery-header-actions button,.selection-launch').forEach(n=>take(n,'button','',n.dataset.action));}
  else if(page==='selection')d.querySelectorAll('.selection-bar button').forEach(n=>take(n,'button','',n.dataset.action));
  else if(page==='download'){d.querySelectorAll('.download-dialog button').forEach(n=>take(n,'button','',n.dataset.action));d.querySelectorAll('.share-step h3,.share-step p,.single-download p').forEach(n=>take(n,'text'));for(const [sel,binding]of [['#wifi-step img','wifiqr'],['#download-step img','downloadqr']])take(d.querySelector(sel),'image',binding);}
  for(const e of elements)clampElement(e,size.ratio);
  return elements;
 }finally{host.remove();}
}
async function resetEditorToStandard(page){
 try{const elements=await captureStandardLayout(page);window.lastStandardCaptureCount=elements.length;if(!elements.length)throw Error('Der Standardaufbau ist noch nicht geladen. Bitte erneut versuchen.');remember();model.ScreenElements=model.ScreenElements.filter(e=>e.Page!==page);model.ScreenElements.push(...elements);model[designKey(page)]=true;ed.sel.clear();changed();render();notify('Standardlayout als Ausgangspunkt geladen.','success');}
 catch(error){window.lastResetError=error.message;notify(error.message||'Standardlayout konnte nicht geladen werden.','error');}
}
/* Feinere Darstellung der Standardbuttons eines Bildschirms. */
function standardButtonPanel(parent,page){
 const key=({home:'Home',result:'Result',gallery:'Gallery',viewer:'Viewer',download:'Download',selection:'Selection'})[page]+'ButtonStyle';if(!model[key])return;
 const g=card(parent,page==='selection'?'Mehrfachdownload · Buttonstil':'Buttondarstellung',page==='selection'?'Farbe und Form des Auswahlknopfs und seiner Aktionen.':'Überschreibt Farbe und Form der Buttons nur auf diesem Bildschirm.',{icon:'square-o'});fToggle(g,key+'.Enabled','Eigene Buttondarstellung');
 const body=when(el('div'),()=>model[key].Enabled);g.append(body);fToggle(body,key+'.Transparent','Ohne Hintergrund');const bg=when(el('div'),()=>!model[key].Transparent);body.append(bg);fColor(bg,key+'.Background','Hintergrund');fColor(body,key+'.Foreground','Text und Symbol');fColor(body,key+'.BorderColor','Rahmen');fNumber(body,key+'.BorderWidth','Rahmenstärke',0,20,'px');fNumber(body,key+'.Radius','Ecken',0,200,'px');fNumber(body,key+'.Blur','Unschärfe dahinter',0,60,'px');fNumber(body,key+'.Opacity','Deckkraft',0,100,'%',{slider:true});fNumber(body,key+'.Shadow','Schatten',0,60,'px');
}
