(function(){
  var DV = window.DV;
  DV.renderHead();
  DV.renderAccount();
  DV.ensure('account');
  if(window.dpEnhanceAll) window.dpEnhanceAll(document);
  DV.icons();
})();
