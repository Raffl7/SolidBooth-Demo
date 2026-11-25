'use strict';
// Only migrate the demo welcome background once; later editor changes remain editable.
(()=>{try{
 const marker='solidbooth-demo-background-version',key='solidbooth-demo-settings';
 if(localStorage.getItem(marker)==='1')return;
 const saved=JSON.parse(localStorage.getItem(key)||'null');
 if(saved&&typeof saved==='object'&&Array.isArray(saved.Events)){
  Object.assign(saved,{HomeBackgroundMode:'image',ShowHomePreview:false,StartBackgroundImage:'demo/start-background.png'});
  localStorage.setItem(key,JSON.stringify(saved));
 }
 localStorage.setItem(marker,'1');
}catch{}})();
