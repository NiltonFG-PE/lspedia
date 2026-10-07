const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

test('reaplicar configuración no vuelve a descargar ni reinicia el mismo video',()=>{
    const source=fs.readFileSync(path.join(__dirname,'../js/web-config.js'),'utf8');
    const code=source.slice(source.indexOf('function media('),source.indexOf('function mask('));
    const attrs={src:'video/logo.webm'};
    let loads=0,plays=0;
    const video={tagName:'VIDEO',getAttribute:k=>attrs[k],setAttribute(k,v){attrs[k]=v;},load(){loads++;},play(){plays++;return Promise.resolve();},set src(v){attrs.src=v;}};
    const context={recurso:v=>v,video:v=>v.endsWith('.webm')};
    vm.createContext(context);vm.runInContext(code,context);
    context.media(video,'video/logo.webm');
    context.media(video,'video/logo.webm');
    assert.equal(loads,0);assert.equal(plays,0);
    context.media(video,'video/nuevo.webm');
    context.media(video,'video/nuevo.webm');
    assert.equal(loads,1);assert.equal(plays,1);
});

test('animaciones decorativas se pausan fuera de pantalla, sin tocar videos de señas',()=>{
    let callback;
    const events={};
    let pauses=0,plays=0;
    const decoration={tagName:'VIDEO',isConnected:true,autoplay:true,paused:false,
      hasAttribute:()=>false,matches:()=>true, getBoundingClientRect:()=>({width:100,height:100,top:0,bottom:100}),
      pause(){this.paused=true;pauses++;},play(){this.paused=false;plays++;return Promise.resolve();}};
    const signVideo={tagName:'VIDEO',isConnected:true,autoplay:true,matches:()=>false,hasAttribute:()=>true};
    const document={hidden:false,documentElement:{clientHeight:700},querySelectorAll:s=>s==='video,audio'?[decoration,signVideo]:[],addEventListener(k,fn){events[k]=fn;}};
    const context={document,window:{innerHeight:700},IntersectionObserver:class {constructor(fn){callback=fn;}observe(){}unobserve(){} }};
    context.window.IntersectionObserver=context.IntersectionObserver;
    vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/rendimiento-movil.js'),'utf8'),context);
    callback([{target:decoration,isIntersecting:false}]);assert.equal(pauses,1);
    callback([{target:decoration,isIntersecting:true}]);assert.equal(plays,1);
    document.hidden=true;events.visibilitychange();assert.equal(pauses,2);
    assert.equal(signVideo.paused,undefined);
});
