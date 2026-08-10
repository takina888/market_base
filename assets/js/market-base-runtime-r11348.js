(function(global){
  'use strict';
  const build=global.MARKET_BASE_BUILD||{id:'MARKET_BASE_V333_19_ANDROID_INSTALL_STABILITY_20260810',assetVersion:'20260810-v333-19-android-install-stability'};
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
          if(existing.dataset.mbRuntimeState==='loaded'){
            if(!globalName||global[globalName]){
              resolve(globalName?global[globalName]:true);
              return;
            }
            existing.remove();
          }
          if(existing.isConnected&&existing.dataset.mbRuntimeState!=='error'){
            existing.addEventListener('load',()=>resolve(globalName?global[globalName]:true),{once:true});
            existing.addEventListener('error',()=>reject(new Error(`script load failed: ${path}`)),{once:true});
            return;
          }
          existing.remove();
        }
        const script=document.createElement('script');
        script.src=this.assetUrl(path);
        script.async=false;
        script.dataset.mbRuntimePath=path;
        script.dataset.mbRuntimeState='loading';
        script.onload=()=>{
          script.dataset.mbRuntimeState='loaded';
          resolve(globalName?global[globalName]:true);
        };
        script.onerror=()=>{
          script.dataset.mbRuntimeState='error';
          script.remove();
          reject(new Error(`script load failed: ${path}`));
        };
        document.head.append(script);
      });
    }
  });
  // Service Worker registration is owned only by the global update controller.
  // Keeping registration out of this shared runtime prevents competing versions.
})(window);
