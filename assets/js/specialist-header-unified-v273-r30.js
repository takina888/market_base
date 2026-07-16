(function(){
  document.querySelectorAll('[data-mbu-refresh]').forEach(function(button){
    button.addEventListener('click',function(){
      var url=new URL(window.location.href);
      url.searchParams.set('refresh',Date.now().toString());
      window.location.replace(url.toString());
    });
  });
})();
