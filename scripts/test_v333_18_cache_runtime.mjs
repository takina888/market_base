#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const swSource=fs.readFileSync(path.join(ROOT,'sw.js'),'utf8');
const controllerSource=fs.readFileSync(
  path.join(ROOT,'assets/js/market-base-update-controller-v335.js'),'utf8'
);
const offlineSource=fs.readFileSync(
  path.join(ROOT,'settings/assets/offline-settings-v335.js'),'utf8'
);
const BUILD='MARKET_BASE_V333_18_CACHE_RADIO_NAVIGATION_STABILITY_20260810';
const TOKEN='20260810-v333-18-cache-radio-navigation-stability';
const BASE='https://example.test/app/';
const RUNTIME=`market-base-${BUILD}`;
const OFFLINE_TEXT='mb-user-offline-v324-text';
const OFFLINE_STATE='mb-user-offline-v324-state';
const OFFLINE_SENTINEL=`${BASE}__market_base_offline_mode__`;

class HeadersMock{
  constructor(values={}){
    this.values=new Map();
    if(values instanceof HeadersMock){
      for(const [key,value] of values.values)this.values.set(key,value);
    }else{
      for(const [key,value] of Object.entries(values||{})){
        this.values.set(String(key).toLowerCase(),String(value));
      }
    }
  }
  has(name){return this.values.has(String(name).toLowerCase())}
  get(name){return this.values.get(String(name).toLowerCase())??null}
}

class RequestMock{
  constructor(input,options={}){
    const source=typeof input==='object'&&input?input:{};
    this.url=new URL(source.url||String(input),BASE).href;
    this.method=options.method||source.method||'GET';
    this.destination=options.destination??source.destination??'';
    this.mode=options.mode||source.mode||'cors';
    this.cache=options.cache||source.cache||'default';
    this.headers=new HeadersMock(options.headers||source.headers||{});
    this.signal=options.signal||source.signal;
  }
}

class ResponseMock{
  constructor(body='',options={}){
    this.body=String(body);
    this.label=options.label||this.body;
    this.status=options.status??200;
    this.ok=this.status>=200&&this.status<300;
    this.headers=new HeadersMock(options.headers||{});
    this.type=options.type||'basic';
  }
  clone(){return new ResponseMock(this.body,{label:this.label,status:this.status,type:this.type})}
  async text(){return this.body}
  async json(){return JSON.parse(this.body)}
  static error(){return new ResponseMock('',{status:0,type:'error',label:'error'})}
}

function request(url,options={}){return new RequestMock(url,options)}
function requestKey(value){return value?.url||new URL(String(value),BASE).href}

class CacheMock{
  constructor(){this.entries=new Map();this.putLog=[]}
  async match(value,options={}){
    const key=requestKey(value);
    if(this.entries.has(key))return this.entries.get(key);
    if(options.ignoreSearch){
      const target=new URL(key);
      for(const [candidate,response] of this.entries){
        const parsed=new URL(candidate);
        if(parsed.origin===target.origin&&parsed.pathname===target.pathname)return response;
      }
    }
    return null;
  }
  async put(value,response){
    const key=requestKey(value);
    this.putLog.push(key);
    this.entries.set(key,response);
  }
  async keys(){return [...this.entries.keys()].map(url=>request(url))}
}

class CacheStorageMock{
  constructor(){this.stores=new Map();this.deleteLog=[]}
  async open(name){
    if(!this.stores.has(name))this.stores.set(name,new CacheMock());
    return this.stores.get(name);
  }
  async keys(){return [...this.stores.keys()]}
  async delete(name){this.deleteLog.push(name);return this.stores.delete(name)}
}

function makeWorker(shared,{network,now=1_000_000}={}){
  const listeners=new Map();
  const fetchLog=[];
  const clock={now};
  class DateMock extends Date{static now(){return clock.now}}
  const self={
    location:new URL(`${BASE}sw.js?v=${encodeURIComponent(BUILD)}`),
    registration:{navigationPreload:{async disable(){}}},
    clients:{async claim(){}},async skipWaiting(){},
    addEventListener(type,handler){
      const handlers=listeners.get(type)||[];
      handlers.push(handler);listeners.set(type,handlers);
    }
  };
  const context={
    self,caches:shared,URL,Request:RequestMock,Response:ResponseMock,
    AbortController,Promise,Date:DateMock,console,setTimeout,clearTimeout,
    importScripts(){},
    async fetch(value,options){
      fetchLog.push({url:requestKey(value),options});
      if(network)return network(value,options);
      return new ResponseMock(`network:${requestKey(value)}`);
    }
  };
  vm.createContext(context);
  vm.runInContext(swSource,context,{filename:'sw.js'});

  function event(type,extra={}){
    const value={
      ...extra,lifetimes:[],response:null,
      respondWith(promise){this.response=Promise.resolve(promise)},
      waitUntil(promise){this.lifetimes.push(Promise.resolve(promise))}
    };
    for(const handler of listeners.get(type)||[])handler(value);
    return value;
  }
  async function settleFetch(value){
    const response=await value.response;
    await Promise.all(value.lifetimes);
    return response;
  }
  async function settleMessage(value){await Promise.all(value.lifetimes)}
  return {
    fetchLog,clock,
    fetch(req){return event('fetch',{request:req,preloadResponse:Promise.resolve(null)})},
    message(data,port){return event('message',{data,ports:port?[port]:[]})},
    settleFetch,settleMessage
  };
}

// Connectivity/version probes bypass active offline content and never hide an
// origin failure behind core or user-saved version.txt.
{
  const shared=new CacheStorageMock();
  const state=await shared.open(OFFLINE_STATE);
  const text=await shared.open(OFFLINE_TEXT);
  const runtime=await shared.open(RUNTIME);
  await state.put(OFFLINE_SENTINEL,new ResponseMock('{"enabled":true}'));
  await text.put(`${BASE}version.txt?v=saved`,new ResponseMock(BUILD));
  await runtime.put(`${BASE}version.txt?v=${TOKEN}`,new ResponseMock(BUILD));
  const worker=makeWorker(shared,{network:async()=>{throw new Error('origin offline')}});
  const result=await worker.settleFetch(worker.fetch(request(
    `${BASE}version.txt?check=1&mb-network-only=1`,
    {cache:'no-store',headers:{'X-Market-Base-Network-Only':'1'}}
  )));
  assert.equal(result.ok,false);
  assert.equal(worker.fetchLog.length,1);
  assert.equal(runtime.putLog.length,1,'probe must not write a new cache entry');
}

// OFFLINE_MODE_CHANGED invalidates a primed true memo before acknowledging.
{
  const shared=new CacheStorageMock();
  const state=await shared.open(OFFLINE_STATE);
  const text=await shared.open(OFFLINE_TEXT);
  await state.put(OFFLINE_SENTINEL,new ResponseMock('{"enabled":true}'));
  await text.put(`${BASE}saved.html`,new ResponseMock('offline-copy'));
  const worker=makeWorker(shared);
  assert.equal((await worker.settleFetch(worker.fetch(request(
    `${BASE}saved.html`,{destination:'document',mode:'navigate'}
  )))).body,'offline-copy');
  await shared.delete(OFFLINE_STATE);
  let ack=null;
  const message=worker.message({
    type:'OFFLINE_MODE_CHANGED',requestId:'offline-1',active:false,generation:'g-1'
  },{postMessage(value){ack=value}});
  await worker.settleMessage(message);
  assert.equal(ack?.type,'OFFLINE_MODE_CHANGED_ACK');
  assert.equal(ack?.requestId,'offline-1');
  assert.equal(ack?.generation,'g-1');
  assert.equal(ack?.active,false);
  assert.equal(ack?.ok,true);
  const online=await worker.settleFetch(worker.fetch(request(
    `${BASE}other.txt`,{cache:'no-store'}
  )));
  assert.match(online.body,/^network:/);

  let newerAck=null;
  await worker.settleMessage(worker.message({
    type:'OFFLINE_MODE_CHANGED',requestId:'newer',active:true,generation:'2000000-new'
  },{postMessage(value){newerAck=value}}));
  assert.equal(newerAck?.ok,true);
  let staleAck=null;
  await worker.settleMessage(worker.message({
    type:'OFFLINE_MODE_CHANGED',requestId:'older',active:false,generation:'1000000-old'
  },{postMessage(value){staleAck=value}}));
  assert.equal(staleAck?.ok,false);
  assert.equal(staleAck?.stale,true);
  assert.equal(staleAck?.active,true,'older generation must not overwrite newer memo');
}

// The manual repair record survives a brand-new worker context and forces a
// lazy current-token asset to use the network. ACK is sent only after put().
{
  const shared=new CacheStorageMock();
  const runtime=await shared.open(RUNTIME);
  const repairCache=await shared.open('mb-update-state-v333-18');
  const originalPut=repairCache.put.bind(repairCache);
  let releasePersist;
  const persistGate=new Promise(resolve=>{releasePersist=resolve});
  repairCache.put=async(value,response)=>{
    await persistGate;
    return originalPut(value,response);
  };
  const lazy=`${BASE}assets/data/lazy.json?v=${TOKEN}`;
  await runtime.put(lazy,new ResponseMock('stale-lazy'));
  const worker1=makeWorker(shared);
  let ack=null;
  const begin=worker1.message({type:'BEGIN_MANUAL_REFRESH',requestId:'manual-1'},
    {postMessage(value){ack=value}});
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(ack,null,'ACK must wait for the persistent repair record');
  releasePersist();
  await worker1.settleMessage(begin);
  assert.equal(ack?.type,'BEGIN_MANUAL_REFRESH_ACK');
  assert.equal(ack?.ok,true);
  assert.ok(Number(ack?.until)>worker1.clock.now);

  const worker2=makeWorker(shared,{now:worker1.clock.now+100});
  const result=await worker2.settleFetch(worker2.fetch(request(lazy,{destination:'script'})));
  assert.match(result.body,/^network:/);
  assert.equal(worker2.fetchLog.length,1);
}

// A current-token image never accepts an old-token pathname match, including
// during manual repair. The first render is already the network response.
{
  const shared=new CacheStorageMock();
  const runtime=await shared.open(RUNTIME);
  await runtime.put(`${BASE}assets/banner.svg?v=old`,new ResponseMock('old-svg'));
  const current=`${BASE}assets/banner.svg?v=${TOKEN}`;
  const worker=makeWorker(shared);
  const result=await worker.settleFetch(worker.fetch(request(current,{destination:'image'})));
  assert.match(result.body,/^network:/);
  assert.equal(worker.fetchLog.length,1);
  assert.ok(runtime.entries.has(current));
}

// Transient cache-bust parameters on a current release asset collapse to one
// stable CacheStorage key rather than growing once per request.
{
  const shared=new CacheStorageMock();
  const worker=makeWorker(shared);
  for(let index=0;index<20;index+=1){
    await worker.settleFetch(worker.fetch(request(
      `${BASE}assets/runtime.js?v=${TOKEN}&cacheBust=${index}`,
      {destination:'script'}
    )));
  }
  const runtime=await shared.open(RUNTIME);
  assert.deepEqual([...runtime.entries.keys()].filter(url=>/\/runtime\.js/.test(url)),[
    `${BASE}assets/runtime.js?v=${TOKEN}`
  ]);
  assert.equal(worker.fetchLog.length,1);
}

// Touch/focus prefetch and immediate navigation join one canonical in-flight
// request; the just-cached document remains fresh and does not revalidate.
{
  const shared=new CacheStorageMock();
  let releaseNetwork;
  const pending=new Promise(resolve=>{releaseNetwork=resolve});
  const worker=makeWorker(shared,{network:()=>pending});
  const prefetch=worker.fetch(request(`${BASE}news.html?mb-prefetch=1`));
  const navigate=worker.fetch(request(`${BASE}news.html`,{
    destination:'document',mode:'navigate'
  }));
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(worker.fetchLog.length,1);
  releaseNetwork(new ResponseMock('news-shell'));
  const [prefetched,navigated]=await Promise.all([
    worker.settleFetch(prefetch),worker.settleFetch(navigate)
  ]);
  assert.equal(prefetched.body,'news-shell');
  assert.equal(navigated.body,'news-shell');
  const fresh=await worker.settleFetch(worker.fetch(request(
    `${BASE}news.html?view=latest`,{destination:'document',mode:'navigate'}
  )));
  assert.equal(fresh.body,'news-shell');
  assert.equal(worker.fetchLog.length,1);
  const runtime=await shared.open(RUNTIME);
  assert.deepEqual([...runtime.entries.keys()].filter(url=>/\/news\.html$/.test(url)),[
    `${BASE}news.html`
  ]);
}

// Controller/settings contracts: acknowledgement precedes reload/save, and a
// stale generation is rejected before it can commit a later state.
assert.match(controllerSource,/await beginManualRefreshBurst\(remoteVersion\)/);
assert.match(controllerSource,/BEGIN_MANUAL_REFRESH_ACK/);
assert.match(controllerSource,/await notifyOfflineModeChanged\(false, generation\)/);
assert.match(controllerSource,/requireCurrentTransition\(\)/);
assert.match(controllerSource,/MB_STALE_OFFLINE_GENERATION/);
assert.match(controllerSource,/mb-network-only/);
assert.match(offlineSource,/await disableOfflineSentinel\(generation\)/);
assert.match(offlineSource,/await notifyOfflineModeChanged\(false, generation\)/);
assert.match(offlineSource,/requireCurrentGeneration\(generation\)/);
assert.match(offlineSource,/MB_STALE_OFFLINE_GENERATION/);

console.log('V333.18 cache/runtime lifecycle: PASS');
