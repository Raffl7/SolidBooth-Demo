'use strict';
function showKioskCamera(data){
 if(!data){notify('Kameraeinstellungen sind nicht verfügbar.');return;}
 modal='camera';const prefs=structuredClone(data.settings);prefs.WhiteBalance??=0;prefs.ColorTemperature??=5200;
 const wbList=(data.whiteBalance||[]).length?data.whiteBalance:[{Code:0,Label:'Automatisch'}],kelvinList=Array.from({length:76},(_,i)=>({Code:2500+i*100,Label:(2500+i*100)+' K'}));
 const choices=(list,value,auto=false)=>`${auto?'<option value="auto">Auto</option>':''}${list.map(c=>`<option value="${c.Code}" ${String(c.Code)===String(value)?'selected':''}>${esc(c.Label)}</option>`).join('')}`;
 const profile=(key,title)=>`<fieldset><legend>${title}</legend>${[['Iso','ISO','iso'],['Aperture','Blende','aperture'],['Shutter','Zeit','shutter']].map(([property,label,list])=>`<label>${label}<select data-profile="${key}" data-value="${property}">${choices(data[list],prefs[key][property],key==='Preview'&&property==='Aperture')}</select></label>`).join('')}</fieldset>`;
 dialog(`<h2>Kameraeinstellungen</h2><p id="kiosk-camera-status" role="status">${esc(data.status)}</p><label class="camera-enabled"><input type="checkbox" id="kiosk-camera-enabled" ${prefs.UseExposureProfiles?'checked':''}> Belichtungsprofile verwenden</label><div class="camera-profile-columns">${profile('Preview','Livebild')}${profile('Photo','Foto')}</div><label class="camera-focus">Fokus<select id="kiosk-camera-focus"><option value="0">Fokus festhalten</option><option value="1">AF vor jeder Aufnahme</option></select></label><div class="camera-wb"><label>Weißabgleich<select id="kiosk-camera-wb">${choices(wbList,prefs.WhiteBalance)}</select></label><label id="kiosk-camera-kelvin-row" ${prefs.WhiteBalance===9?'':'hidden'}>Farbtemperatur<select id="kiosk-camera-kelvin">${choices(kelvinList,prefs.ColorTemperature)}</select></label></div><div class="actions"><button class="btn" id="camera-reconnect"><i class="fa fa-plug"></i> Neu verbinden</button><button class="btn" id="camera-back"><i class="fa fa-arrow-left"></i> Adminbereich</button><button class="btn" id="camera-apply"><i class="fa fa-check"></i> Werte übernehmen</button></div>`,true);
 $('#modal-layer .dialog').classList.add('camera-dialog','system-dialog');
 $('#kiosk-camera-focus').value=prefs.FocusMode;
 if(prefs.Preview.AutoAperture)$('#modal-layer select[data-profile="Preview"][data-value="Aperture"]').value='auto';
 $('#kiosk-camera-wb').onchange=()=>{$('#kiosk-camera-kelvin-row').hidden=$('#kiosk-camera-wb').value!=='9';};
 $('#camera-back').onclick=adminMenu;
 $('#camera-reconnect').onclick=()=>{$('#kiosk-camera-status').textContent='Kamera wird neu verbunden …';$('#camera-reconnect').disabled=true;send('cameraReconnect');};
 $('#camera-apply').onclick=()=>{
  prefs.UseExposureProfiles=$('#kiosk-camera-enabled').checked;prefs.FocusMode=+$('#kiosk-camera-focus').value;prefs.WhiteBalance=+$('#kiosk-camera-wb').value;prefs.ColorTemperature=+$('#kiosk-camera-kelvin').value;
  document.querySelectorAll('#modal-layer select[data-profile]').forEach(s=>{const key=s.dataset.profile,property=s.dataset.value;if(key==='Preview'&&property==='Aperture')prefs.Preview.AutoAperture=s.value==='auto';if(s.value!=='auto')prefs[key][property]=+s.value;});
  $('#kiosk-camera-status').textContent='Kamerawerte werden übernommen …';$('#camera-apply').disabled=true;$('#camera-back').disabled=true;
  send('cameraApply',{cameraSettings:prefs});
 };
}
function kioskCameraError(message){if($('#kiosk-camera-status')){$('#kiosk-camera-status').textContent=message;$('#camera-apply').disabled=false;$('#camera-back').disabled=false;if($('#camera-reconnect'))$('#camera-reconnect').disabled=false;}else notify(message);}
