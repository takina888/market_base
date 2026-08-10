#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const swSource=fs.readFileSync(path.join(ROOT,'sw.js'),'utf8');
const controllerSource=fs.readFileSync(path.join(ROOT,'assets/js/market-base-update-controller-v335.js'),'utf8');
const TOKEN='20260810-v333-19-android-install-stability';
const BUILD='MARKET_BASE_V333_19_ANDROID_INSTALL_STABILITY_20260810';

function mockResponse(label){
  return {label,ok:true,status:200,clone(){return mockResponse(`${label}:clone`);}};
}

class HeadersMock{
  constructor(values={}){this.values=new Map(Object.entries(values).map(([k,v])=>[k.toLowerCase(),String(v)]));}
  has(name){return this.values.has(String(name).toLowerCase());}
  get(name){return this.values.get(String(name).toLowerCase())??null;}
}

function request(url,options={}){
  return {
    url,method:'GET',destination:options.destination||'',mode:options.mode||'cors',
    cache:options.cache||'default',headers:new HeadersMock(options.headers)
  };
}

function harness(entries=new Map()){
  const listeners=new Map();
  const fetches=[];
  const puts=[];
  const matches=[];
  const core={
    async match(key,options){
      const url=key?.url||String(key);
      matches.push({url,options});
      if(entries.has(url))return entries.get(url);
      if(options?.ignoreSearch){
        const pathname=new URL(url).pathname;
        for(const [candidate,value] of entries){
          if(new URL(candidate).pathname===pathname)return value;
        }
      }
      return null;
    },
    async put(key,value){
      const url=key?.url||String(key);
      puts.push({url,value});
      entries.set(url,value);
    },
    async keys(){return [];}
  };
  const empty={async match(){return null;},async put(){},async keys(){return [];}};
  const caches={
    async open(name){return name==='mb-user-offline-v324-state'?empty:core;},
    async keys(){return [];},async delete(){return true;}
  };
  const self={
    location:new URL(`https://example.test/app/sw.js?v=${BUILD}`),
    registration:{navigationPreload:{async enable(){}}},
    clients:{async claim(){}},async skipWaiting(){},
    addEventListener(type,handler){const list=listeners.get(type)||[];list.push(handler);listeners.set(type,list);}
  };
  const context={
    self,caches,URL,Request,Response,AbortController,Promise,console,setTimeout,clearTimeout,
    importScripts(){},
    async fetch(value,options){fetches.push({url:value?.url||String(value),options});return mockResponse('network');}
  };
  vm.createContext(context);
  vm.runInContext(swSource,context,{filename:'sw.js'});

  function dispatchFetch(value){
    const event={
      request:value,preloadResponse:Promise.resolve(null),response:null,lifetimes:[],
      respondWith(promise){this.response=Promise.resolve(promise);},
      waitUntil(promise){this.lifetimes.push(Promise.resolve(promise));}
    };
    listeners.get('fetch')[0](event);
    return event;
  }
  function dispatchMessage(data,port){
    const event={data,ports:port?[port]:[],waitUntil(promise){this.promise=Promise.resolve(promise);}};
    listeners.get('message')[0](event);
    return event;
  }
  return {dispatchFetch,dispatchMessage,fetches,puts,matches,entries};
}

async function settle(event){
  const response=await event.response;
  await Promise.all(event.lifetimes);
  return response;
}

// Timestamped version probes are always network/no-store and never enter CacheStorage.
{
  const h=harness();
  for(let i=0;i<25;i+=1){
    const event=h.dispatchFetch(request(`https://example.test/app/version.txt?check=${i}`,{cache:'no-store'}));
    await settle(event);
  }
  assert.equal(h.puts.length,0);
  assert.equal(h.fetches.length,25);
  assert.ok(h.fetches.every(call=>call.options?.cache==='no-store'));
}

// Query-driven views share one canonical document entry and can return it immediately.
{
  const canonical='https://example.test/app/index.html';
  const cached=mockResponse('canonical');
  const h=harness(new Map([[canonical,cached]]));
  const result=await settle(h.dispatchFetch(request(
    'https://example.test/app/index.html?view=rankings&q=rice',
    {destination:'document',mode:'navigate'}
  )));
  assert.equal(result,cached);
  assert.equal(h.fetches.length,1,'cached document should revalidate only in the background');
  assert.ok(h.puts.every(item=>item.url===canonical));
}

// Script-driven intent prefetch has destination="", but mb-prefetch still
// populates the exact canonical document used by the later navigation.
{
  const canonical='https://example.test/app/news.html';
  const h=harness();
  const result=await settle(h.dispatchFetch(request(
    'https://example.test/app/news.html?view=latest&mb-prefetch=1'
  )));
  assert.match(result.label,/^network/);
  assert.deepEqual(h.puts.map(item=>item.url),[canonical]);
}

// Only this release token is immutable. Legacy tokens are reloaded and not duplicated.
{
  const current=`https://example.test/app/assets/app.js?v=${TOKEN}`;
  const cached=mockResponse('current');
  const h=harness(new Map([[current,cached]]));
  assert.equal(await settle(h.dispatchFetch(request(current,{destination:'script'}))),cached);
  assert.equal(h.fetches.length,0);

  const legacy='https://example.test/app/assets/app.js?v=old-release';
  const legacyResult=await settle(h.dispatchFetch(request(legacy,{destination:'script'})));
  assert.equal(legacyResult.label,'network');
  assert.equal(h.fetches.at(-1).options?.cache,'reload');
  assert.equal(h.puts.filter(item=>item.url===legacy).length,0);
}

// Explicit offline-save fetches belong only to the dedicated user offline cache.
{
  const h=harness();
  const event=h.dispatchFetch(request(`https://example.test/app/data/db.json?v=${TOKEN}&mb-offline-save=1`));
  await settle(event);
  assert.equal(h.puts.length,0);
  assert.equal(h.fetches[0].options?.cache,'reload');
}

// The controller verifies worker bytes and waits for activation before reload.
assert.match(swSource,new RegExp(`const BUILD_ID='${BUILD}'`));
assert.match(swSource,/GET_BUILD_INFO/);
assert.match(swSource,/BEGIN_MANUAL_REFRESH/);
assert.match(swSource,/navigationPreload\.disable/);
assert.match(swSource,/MANUAL_REFRESH_CACHE/);
assert.match(swSource,/BEGIN_MANUAL_REFRESH_ACK/);
assert.match(swSource,/OFFLINE_MODE_CHANGED_ACK/);
assert.match(swSource,/documentNetworkInflight/);
assert.doesNotMatch(swSource,/cache\.match\(new URL\(`\.\/version\.txt/);
assert.match(swSource,/precache build mismatch/);
assert.match(swSource,/Never remove the active generation's recovery cache/);
assert.doesNotMatch(controllerSource,/pruneOldSiteCaches/);
assert.match(controllerSource,/workerBuildInfo\(worker\)/);
assert.match(controllerSource,/service worker build handshake failed/);
assert.match(controllerSource,/fetchRemoteVersion\(\{ force: true \}\)/);
assert.match(controllerSource,/LAST_VERSION_CHECK_KEY/);
assert.match(controllerSource,/VERSION_CHECK_TTL_MS/);
assert.match(controllerSource,/event\.persisted\) checkOnOpen\(\{ force: true, resume: true \}\)/);
assert.match(controllerSource,/closeUpdateChannel\(\)/);
assert.match(controllerSource,/withCrossTabLock\('online-transition'/);
assert.match(controllerSource,/market-base-worker-update-v3/);
assert.match(controllerSource,/BEGIN_MANUAL_REFRESH_ACK/);
assert.match(controllerSource,/OFFLINE_MODE_CHANGED_ACK/);
assert.match(controllerSource,/mb-network-only/);

console.log('V333.19 cache coherence: PASS');
