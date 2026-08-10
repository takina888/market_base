import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const navigation=read('assets/js/market-base-navigation-v333-18.js');
const deferred=read('assets/js/market-base-home-deferred-v333-18.js');
const css=read('assets/css/market-base-navigation-v333-18.css');

assert(!/\btransform\s*:/.test(css),'navigation CSS must never transform root, body, views, or fixed-UI ancestors');
assert(!css.includes('html.mb-page-entering body {'),'page enter must not animate the body');
assert(css.includes('html.mb-page-entering body > main'),'page enter feedback must be limited to document content');
assert(!navigation.includes("addEventListener('touchstart'"),'touchstart must never trigger an eager document prefetch');
assert(navigation.includes("event.pointerType!=='mouse'&&event.pointerType!=='pen'"),'only true hover pointers may prefetch');
assert(!navigation.includes('mb-page-leaving'),'the unused leaving-state path must remain removed');
assert(!navigation.includes("addEventListener('DOMContentLoaded',revealPage"),'DOMContentLoaded must not duplicate pageshow entry');
assert(navigation.includes("scrollRestoration='manual'"),'in-page history must own scroll restoration');
assert(navigation.includes("new CustomEvent('marketbase:viewrendered'")===false,'navigation must consume, not emit, app render completion');
assert(navigation.includes("addEventListener('marketbase:viewrendered'"),'scroll restoration must wait for deferred route rendering');
assert(deferred.includes('delete promises[group]'),'a failed deferred group must be retryable');
assert(deferred.includes('script.remove();'),'a failed fallback script node must not poison retries');
assert(deferred.includes('optionalWarmupAllowed()'),'nonessential observer loads must have a shared warmup gate');
assert(!deferred.includes('requestIdleCallback'),'country data must not return as an automatic idle warmup');

class ClassList{
  constructor(log){this.values=new Set();this.log=log;}
  add(...names){for(const name of names){this.values.add(name);this.log.push(['add',name]);}}
  remove(...names){for(const name of names){this.values.delete(name);this.log.push(['remove',name]);}}
  contains(name){return this.values.has(name);}
}

function createNavigationVm(){
  const documentListeners=new Map();
  const windowListeners=new Map();
  const classLog=[];
  const raf=[];
  const timers=[];
  const fetches=[];
  let timerId=0;
  const documentElement={classList:new ClassList(classLog),scrollTop:0};
  const document={
    currentScript:{src:'https://example.test/assets/js/market-base-navigation-v333-18.js'},
    readyState:'loading',visibilityState:'visible',documentElement,
    head:{appendChild(){}},
    querySelector(selector){return selector==='link[data-mb-navigation-style]'?{}:null;},
    createElement(){return {dataset:{}};},
    addEventListener(type,fn){if(!documentListeners.has(type))documentListeners.set(type,[]);documentListeners.get(type).push(fn);}
  };
  const location=new URL('https://example.test/index.html');
  const history={state:{mbRoute:true,mbView:'',mbScrollY:0},scrollRestoration:'auto',replaceState(state,_title,url){this.state={...state};this.lastUrl=String(url);}};
  const navigator={onLine:true,connection:{effectiveType:'4g',saveData:false}};
  const localStorage={getItem(){return null;}};
  const window={
    document,location,history,navigator,localStorage,scrollY:0,
    matchMedia(){return {matches:false};},
    requestAnimationFrame(fn){raf.push(fn);return raf.length;},
    setTimeout(fn,ms){const item={id:++timerId,fn,ms,cancelled:false};timers.push(item);return item.id;},
    clearTimeout(id){const item=timers.find(entry=>entry.id===id);if(item)item.cancelled=true;},
    addEventListener(type,fn){if(!windowListeners.has(type))windowListeners.set(type,[]);windowListeners.get(type).push(fn);},
    scrollTo(options){this.scrollY=Number(options.top||0);}
  };
  const fetch=async url=>{fetches.push(String(url));return new Response('ok',{status:200});};
  const context=vm.createContext({window,document,location,history,navigator,localStorage,URL,Response,fetch,Date,console});
  vm.runInContext(navigation,context,{filename:'market-base-navigation-v333-18.js'});
  const emitWindow=(type,event={})=>{for(const fn of windowListeners.get(type)||[])fn({type,...event});};
  const emitDocument=(type,event={})=>{for(const fn of documentListeners.get(type)||[])fn({type,...event});};
  const flushFrames=()=>{let guard=0;while(raf.length&&guard++<20){const batch=raf.splice(0);for(const fn of batch)fn();}};
  const runTimers=ms=>{for(const item of timers){if(!item.cancelled&&!item.ran&&(ms===undefined||item.ms===ms)){item.ran=true;item.fn();}}};
  return {window,document,history,classLog,fetches,documentListeners,emitWindow,emitDocument,flushFrames,runTimers};
}

{
  const h=createNavigationVm();
  assert.equal(h.history.scrollRestoration,'manual');
  assert.equal((h.documentListeners.get('DOMContentLoaded')||[]).length,0);
  h.emitWindow('pageshow',{persisted:false});
  h.emitWindow('pageshow',{persisted:false});
  assert.equal(h.classLog.filter(([action,name])=>action==='add'&&name==='mb-page-entering').length,1,'normal entry must reveal once');
  assert.equal(h.classLog.some(([action,name])=>action==='remove'&&name==='mb-page-entering'),false,'entry class must not be removed after two frames');
  h.runTimers(220);
  assert(h.classLog.some(([action,name])=>action==='remove'&&name==='mb-page-entering'),'entry class must clear after the full animation');

  const anchor={href:'https://example.test/news.html',target:'',hasAttribute(){return false;},getAttribute(){return null;},contains(){return false;},closest(){return this;}};
  h.emitDocument('pointerover',{target:anchor,pointerType:'touch'});
  h.runTimers(90);
  assert.equal(h.fetches.length,0,'touch pointer hover must not prefetch');
  h.emitDocument('pointerover',{target:anchor,pointerType:'mouse'});
  h.runTimers(90);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(h.fetches.length,1,'desktop mouse hover must retain intent prefetch');

  // Exact regression: Home -> Countries -> scroll 1200 -> Back -> Forward.
  h.history.state={mbRoute:true,mbView:'countries',mbScrollY:0};
  h.window.scrollY=1200;
  h.emitWindow('scroll');
  h.flushFrames();
  assert.equal(h.history.state.mbScrollY,1200,'scroll must update the current history entry');
  const countriesState={...h.history.state};
  const homeState={mbRoute:true,mbView:'',mbScrollY:0};
  h.history.state=homeState;
  h.emitWindow('popstate',{state:homeState});
  h.emitDocument('marketbase:before-viewchange',{detail:{from:'countries',to:'home'}});
  h.emitDocument('marketbase:viewchange',{detail:{from:'countries',to:'home'}});
  h.flushFrames();
  assert.equal(h.window.scrollY,0,'Back must restore Home');
  assert.equal(h.history.state.mbScrollY,0,'Back traversal must not overwrite the destination entry with the old view scroll');
  h.history.state=countriesState;
  h.emitWindow('popstate',{state:countriesState});
  h.emitDocument('marketbase:before-viewchange',{detail:{from:'home',to:'countries'}});
  h.emitDocument('marketbase:viewchange',{detail:{from:'home',to:'countries'}});
  h.emitDocument('marketbase:viewrendered',{detail:{view:'countries'}});
  h.flushFrames();
  assert.equal(h.window.scrollY,1200,'Forward must restore Countries at 1200 after the target view renders');
}

function createDeferredVm({online=true,radio=false,failFirst=false}={}){
  const documentListeners=new Map();
  const windowListeners=new Map();
  const loads=[];
  const observers=[];
  let shouldFail=failFirst;
  function element(id){
    return {
      id,dataset:{},children:[],textContent:'',open:false,
      classList:{contains(){return false;}},
      setAttribute(){},removeAttribute(){},querySelector(){return null;},querySelectorAll(){return [];},
      appendChild(node){this.children.push(node);},getBoundingClientRect(){return {top:10,bottom:100};}
    };
  }
  const historyMount=element('historyLearningMount');
  const ids=new Map([['historyLearningMount',historyMount]]);
  const document={
    baseURI:'https://example.test/index.html',readyState:'loading',visibilityState:'visible',body:element('body'),head:{appendChild(){}},
    getElementById(id){return ids.get(id)||null;},querySelector(){return null;},createElement(){return element('created');},
    addEventListener(type,fn){if(!documentListeners.has(type))documentListeners.set(type,[]);documentListeners.get(type).push(fn);},dispatchEvent(){return true;}
  };
  class IntersectionObserverMock{
    constructor(callback){this.callback=callback;this.unobserved=[];observers.push(this);}observe(){}unobserve(target){this.unobserved.push(target);}
  }
  class CustomEventMock{constructor(type,init={}){this.type=type;this.detail=init.detail;}}
  const navigator={onLine:online,connection:{effectiveType:'4g',saveData:false}};
  const location={search:'',hash:''};
  const window={
    document,navigator,location,innerHeight:800,localStorage:{getItem(){return null;}},
    IntersectionObserver:IntersectionObserverMock,
    MarketBaseNavigation:{isRadioPlaying(){return radio;}},
    MarketBaseRuntime:{async loadScript(path){loads.push(path);if(shouldFail){shouldFail=false;throw new Error('transient');}return true;}},
    addEventListener(type,fn){if(!windowListeners.has(type))windowListeners.set(type,[]);windowListeners.get(type).push(fn);},setTimeout
  };
  const quietConsole={...console,warn(){}};
  const context=vm.createContext({window,document,navigator,location,IntersectionObserver:IntersectionObserverMock,URL,URLSearchParams,CustomEvent:CustomEventMock,Date,Promise,console:quietConsole,setTimeout});
  vm.runInContext(deferred,context,{filename:'market-base-home-deferred-v333-18.js'});
  return {window,loads,observers,historyMount,setRadio(value){radio=value;}};
}

{
  const h=createDeferredVm({radio:true});
  h.observers[0].callback([{isIntersecting:true,target:h.historyMount}]);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(h.loads.length,0,'radio playback must suppress nonessential observer warmup');
  assert.equal(h.observers[0].unobserved.length,0,'suppressed target must remain observable for a later retry');
  h.setRadio(false);
  h.observers[0].callback([{isIntersecting:true,target:h.historyMount}]);
  await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(h.loads,['data/world-history-today-v028.js','assets/js/world-history-learn-r11330.js']);
}

{
  const h=createDeferredVm({online:false});
  h.observers[0].callback([{isIntersecting:true,target:h.historyMount}]);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(h.loads.length,0,'offline mode must suppress nonessential observer warmup');
}

{
  const h=createDeferredVm({failFirst:true});
  assert.equal(await h.window.MarketBaseHomeDeferred.ensureCountryDetail(),false);
  assert.equal(h.window.MarketBaseHomeDeferred.status('country'),'error');
  assert.equal(await h.window.MarketBaseHomeDeferred.ensureCountryDetail(),true,'a later explicit intent must retry a failed group');
  assert.equal(h.window.MarketBaseHomeDeferred.status('country'),'ready');
  assert(h.loads.length>=4,'retry must issue a new script load after the transient failure');
}

console.log('V333.18 navigation/deferred stability contracts passed.');
