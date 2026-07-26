(function(global){
  'use strict';
  const build=global.MARKET_BASE_BUILD||{id:'MARKET_BASE_R113_48_SPECIALIST_CSS_OWNERSHIP_20260725',assetVersion:'20260725-r11348'};
  global.MarketBaseRuntime=Object.freeze({
    build,
    isFile:global.location?.protocol==='file:',
    assetUrl(path){
      const join=String(path).includes('?')?'&':'?';
      return `${path}${join}v=${encodeURIComponent(build.assetVersion)}`;
    },
    loadScript(path,globalName){
      if(globalName&&global[globalName]) return Promise.resolve(global[globalName]);
      return new Promise((resolve,reject)=>{
        const existing=[...document.scripts].find(node=>node.dataset.mbRuntimePath===path);
        if(existing){
          existing.addEventListener('load',()=>resolve(globalName?global[globalName]:true),{once:true});
          existing.addEventListener('error',()=>reject(new Error(`script load failed: ${path}`)),{once:true});
          return;
        }
        const script=document.createElement('script');
        script.src=this.assetUrl(path);
        script.async=false;
        script.dataset.mbRuntimePath=path;
        script.onload=()=>resolve(globalName?global[globalName]:true);
        script.onerror=()=>reject(new Error(`script load failed: ${path}`));
        document.head.append(script);
      });
    }
  });
  if(/^https?:$/.test(global.location?.protocol||'')&&'serviceWorker' in navigator){
    global.addEventListener('load',()=>{
      const runtimeScript=[...document.scripts].find(node=>/market-base-runtime-r11348\.js(?:[?#]|$)/.test(node.src));
      const rootUrl=new URL(runtimeScript?.dataset.mbRoot||'../../',runtimeScript?.src||document.baseURI);
      const swUrl=new URL(`sw.js?v=${encodeURIComponent(build.assetVersion)}`,rootUrl);
      navigator.serviceWorker.register(swUrl.href,{scope:rootUrl.pathname})
        .then(reg=>reg.update()).catch(err=>console.warn('MARKET BASE service worker registration skipped',err));
    },{once:true});
  }
})(window);
