'use strict';
/* Livebild aus dem nativen Host: holt nur neue Kamerabilder (Bildkennung „s“), dekodiert jedes
   genau einmal außerhalb des sichtbaren Bildes und tauscht es danach ohne erneuten Abruf ein. */
function createLiveStream(base,{interval=40,active=()=>true,target,onFrame}={}){
 let id='',busy=false,url='',stopped=false,generation=0;
 const tick=async()=>{
  if(stopped||busy||document.hidden||!active())return;if(!target())return;
  busy=true;const mine=generation,abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),3000);
  try{
   const response=await fetch(base+'?s='+encodeURIComponent(id)+'&t='+Date.now(),{cache:'no-store',signal:abort.signal});
   if(response.status===204||!response.ok)return;
   const blob=await response.blob();if(!blob.size||mine!==generation)return;
   const next=URL.createObjectURL(blob),probe=new Image();probe.src=next;
   try{await probe.decode();}catch{URL.revokeObjectURL(next);return;}
   if(mine!==generation||stopped){URL.revokeObjectURL(next);return;}
   const img=target();if(img){img.src=next;img.style.visibility='visible';}
   const old=url;url=next;id=response.headers.get('X-Frame')||'';if(old)setTimeout(()=>URL.revokeObjectURL(old),1500);onFrame?.();
  }catch{}finally{clearTimeout(timeout);busy=false;}
 };
 const timer=setInterval(tick,interval);setTimeout(tick,0);
 return {current:()=>url,reset(){generation++;id='';},stop(){stopped=true;clearInterval(timer);if(url)setTimeout(()=>URL.revokeObjectURL(url),1500);}};
}
