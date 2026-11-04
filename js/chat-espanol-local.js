/* No request or model download occurs until activate() is called by the user. */
(function(root){
"use strict";
const base=new URL("chat-espanol-worker.js?v=20261104-1",document.currentScript.src);
let worker=null, ready=false, serial=0, resetting=Promise.resolve();
const pending=new Map();
function stop(){
  if(worker)worker.terminate();worker=null;ready=false;
  pending.forEach(p=>{clearTimeout(p.timer);p.reject(new Error("IA local detenida."));});pending.clear();
}
function request(type,payload,timeout,onProgress){
  return new Promise((resolve,reject)=>{
    const id=++serial;
    const timer=setTimeout(()=>stop(),timeout);
    pending.set(id,{resolve,reject,timer,onProgress});
    worker.postMessage({id,type,...payload});
  });
}
async function activate(onProgress){
  if(ready)return;
  if(!root.isSecureContext||!navigator.gpu||!root.Worker)throw new Error("Este navegador no permite IA local. Puedes usar todas las prácticas guiadas.");
  stop();
  worker=new Worker(base,{type:"module"});
  const ownWorker=worker;
  worker.onmessage=({data})=>{
    const p=pending.get(data.id);if(!p)return;
    if(data.type==="progress"){p.onProgress?.(data.text);return;}
    pending.delete(data.id);clearTimeout(p.timer);
    if(data.type==="error")p.reject(new Error(data.message||"No se pudo cargar la IA local."));else p.resolve(data.result);
  };
  worker.onerror=()=>stop();
  try{await request("init",{},600000,onProgress);if(worker!==ownWorker)throw new Error("Activación cancelada.");ready=true;}
  catch(error){if(worker===ownWorker)stop();throw error;}
}
async function reply(scenario,history){
  await resetting;
  if(!ready)throw new Error("La IA local no está activa.");
  return request("reply",{scenario:{name:scenario.name,situation:scenario.situation,goal:scenario.goal,level:scenario.level},history:history.slice(-12)},90000);
}
function reset(){resetting=(async()=>{if(ready)try{await request("reset",{},10000);}catch(_){stop();}})();return resetting;}
root.LSPChatLocal={activate,reply,stop,reset,isReady:()=>ready};
root.addEventListener("pagehide",stop);
})(window);
