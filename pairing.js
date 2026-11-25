'use strict';
let pairingSelectedUrl='';
function remotePairing(data){
 modal='remotePair';const networks=data.networks?.length?data.networks:[{url:data.url,label:data.url||'Verwaltung',qr:data.qr,hotspot:false}];
 const selected=networks.find(n=>n.url===pairingSelectedUrl)||networks[0];pairingSelectedUrl=selected?.url||'';
 const wrap=document.createElement('div');wrap.className='remote-pair';
 const heading=document.createElement('h2');heading.textContent='Einrichtung über Smartphone';wrap.append(heading);
 const label=document.createElement('label');label.className='pairing-address-label';label.textContent='Verbindung zur Box';const select=document.createElement('select');select.id='pairing-address';
 for(const network of networks){const option=document.createElement('option');option.value=network.url;option.textContent=network.label;option.selected=network.url===pairingSelectedUrl;option.defaultSelected=option.selected;select.append(option);}label.append(select);wrap.append(label);
 const steps=document.createElement('div');steps.className='pairing-steps';
 for(const [title,src,text]of [['1. WLAN verbinden',selected?.hotspot?null:data.wifi,selected?.hotspot?'Handy mit dem Hotspot der Box verbinden. Falls bereits verbunden, direkt Schritt 2 verwenden.':data.wifi?'Gespeichertes Gäste-WLAN: '+(data.wifiName||'')+'. Den Code nur verwenden, wenn die Box ebenfalls dort verbunden ist. Sonst dasselbe WLAN oder denselben Handy-Hotspot manuell wählen.':'Handy und Box müssen im selben WLAN oder Hotspot sein. Internet ist für die Verwaltung nicht erforderlich.'],['2. Verwaltung öffnen',selected?.qr,'Verwaltungs-Code scannen und Admin-PIN eingeben. Bei einem Netzwerkwechsel oben die passende Adresse wählen.']]){
  const step=document.createElement('section'),h=document.createElement('h3');h.textContent=title;step.append(h);if(src){const img=new Image();img.src=src;img.alt=title;step.append(img);}const p=document.createElement('p');p.textContent=text;step.append(p);steps.append(step);
 }
 wrap.append(steps);const address=document.createElement('p');address.className='pairing-current-url';address.textContent=selected?.url||data.status||'Keine Netzwerkadresse verfügbar.';wrap.append(address);
 const status=document.createElement('p');status.id='pairing-status';status.setAttribute('role','status');status.textContent='Falls die Seite trotz gleicher Verbindung nicht lädt: lokalen Netzwerkzugriff an der Box erlauben.';wrap.append(status);
 const actions=document.createElement('div');actions.className='actions';actions.innerHTML=btn('allowAdminNetwork','Netzwerkzugriff erlauben','shield')+btn('remoteAdmin','Adressen aktualisieren','refresh')+btn('dismiss','Zurück zum Kiosk','arrow-left');wrap.append(actions);
 dialog(wrap.outerHTML,true);document.querySelector('#modal-layer .dialog')?.classList.add('remote-pair-dialog','system-dialog');const allow=document.querySelector('[data-action="allowAdminNetwork"]');if(allow){allow.id='pairing-allow';allow.disabled=!data.pinConfigured;}if(!data.pinConfigured)document.getElementById('pairing-status').textContent='Zuerst unter Box & System eine Admin-PIN festlegen.';
 const panel=document.querySelector('#modal-layer .dialog');panel.scrollTop=0;document.getElementById('pairing-address').focus({preventScroll:true});
 document.getElementById('pairing-address').onchange=e=>{pairingSelectedUrl=e.target.value;remotePairing(data);};
}
