(function(){
  'use strict';
  var Q = function(s, r){ return (r || document).querySelector(s); };
  var QA = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = window.dpEsc, $m = window.dpMoney;
  var DV = window.DV = {};
  DV.Q = Q; DV.QA = QA; DV.esc = esc; DV.$m = $m;
  function icons(){ if(window.dpIcons) window.dpIcons(); }
  function toast(k, t, m){ window.dpToast(k, t, m || ''); }
  function pad(n){ return (n < 10 ? '0' : '') + n; }
  function on(el, ev, fn){ if(el) el.addEventListener(ev, fn); }
  function num(v){ var n = parseFloat(String(v).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n; }
  function ymd(d){ d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function mdy(d){ d = d instanceof Date ? d : new Date(d); return pad(d.getMonth() + 1) + '/' + pad(d.getDate()) + '/' + d.getFullYear(); }
  function fromYmd(s){ var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function seed(n){ var x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); }
  function hash(s){ var h = 7; for(var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 1000003; return h; }
  function ico(n, c){ return '<i data-lucide="' + n + '"' + (c ? ' class="' + c + '"' : '') + '></i>'; }
  function opts(sel, list, value){
    sel.innerHTML = list.map(function(o){ var v = typeof o === 'string' ? o : o[0], l = typeof o === 'string' ? o : o[1]; return '<option value="' + esc(v) + '">' + esc(l) + '</option>'; }).join('');
    if(value != null) sel.value = value;
    if(window.dpEnhanceSelect){ if(sel._dropdownRefresh) sel._dropdownRefresh(); else window.dpEnhanceSelect(sel); }
  }
  function badge(v, t){ return '<span class="badge"' + (v ? ' data-variant="' + v + '"' : '') + '>' + esc(t) + '</span>'; }
  DV.icons = icons; DV.toast = toast; DV.pad = pad; DV.on = on; DV.num = num; DV.ymd = ymd; DV.mdy = mdy; DV.fromYmd = fromYmd;
  DV.seed = seed; DV.hash = hash; DV.ico = ico; DV.opts = opts; DV.badge = badge;
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var MON3 = MONTHS.map(function(m){ return m.slice(0, 3); });
  var DOW3 = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var DOWL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  DV.MONTHS = MONTHS; DV.MON3 = MON3; DV.DOW3 = DOW3; DV.DOWL = DOWL;
  DV.nice = function(d){ d = d instanceof Date ? d : fromYmd(d); return MON3[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(); };
  DV.fmt = function(n, dp){ return Number(n).toLocaleString('en-US', {minimumFractionDigits:dp || 0, maximumFractionDigits:dp || 0}); };
  DV.daysBetween = function(a, b){ return Math.round((b - a) / 86400000); };

  /* The page lives on 17 May 2023: occupied days to the 16th, a medical
     certificate due on the 15th, events on the 24th and 5 June. */
  var TODAY = DV.TODAY = new Date(2023, 4, 17);

  /* ================================================================
     DATA
     ================================================================ */
  var DRV = DV.DRV = {
    first:'William', last:'Falin', full:'William Roger Falin Jr.', nick:'JR.', id:'DRV-2214',
    addr:'2614 Floraland Drive Northwest, Roanoke, VA 24012', city:'Roanoke, VA',
    cell:'(540) 339-2171', sms:false, home:'(540) 362-0672', email:'falinwilliams@gmail.com',
    manager:'Lois Gisiner', ext:'1005', birth:'1960-06-14', eld:'Samsara', eldStatus:'Driving',
    hire:'2012-09-02', appDate:'2012-08-23', ranks:[['Occupancy', 2], ['Revenue', 4], ['Safety', 15]],
    flags:[['Tanker endorsement', false, ''], ['TWIC card', true, 'Exp 07/08/2025'], ['Passport', false, ''], ['Passenger rider', true, 'Drew Carrymore'], ['Pets', true, 'Dixie-Doodle']]
  };
  var TRAILERS = DV.TRAILERS = [
    {id:'V5345', st:'available', type:"53' dry van", loc:'1007 Cherokee Street Roanoke, VA 24012'},
    {id:'V5302', st:'available', type:"53' reefer", loc:'213 Emily Lane Winchester, VA 99999', svc:{due:'16 days', pm:'Overdue', warranty:'35 days', repairs:'Wheel seal'}},
    {id:'V5303', st:'assigned', by:'DATR 1927281', type:"48' flatbed", loc:'1007 Cherokee Street NE'},
    {id:'V5304', st:'available', type:"53' dry van", loc:'1776 Constitution Way Lynchburg, VA 24113'},
    {id:'V5305', st:'assigned', by:'MEKR 891273', type:"53' dry van", loc:'113 South Pole Parkway'},
    {id:'V5306', st:'assigned', by:'MEKR 891657', type:"53' reefer", loc:'98 Broad Street, Clarksburg'},
    {id:'V5307', st:'available', type:"53' dry van", loc:'1007 Cherokee Street Roanoke, VA 24012'}
  ];
  var TRUCKS = DV.TRUCKS = [
    {id:'DTL88', st:'available', make:'Kenworth', yr:2016, vin:'IXKW049X4GJ111374', loc:'Roanoke, VA'},
    {id:'DTL91', st:'available', make:'Peterbilt', yr:2019, vin:'1XPBD49X9KD654102', loc:'Lynchburg, VA'},
    {id:'DTL95', st:'assigned', by:'Hollis Park', make:'Freightliner', yr:2020, vin:'3AKJHHDR5LSLB4417', loc:'Bristol, TN'},
    {id:'CLE12', st:'assigned', by:'Coors Light Express', make:'Volvo', yr:2018, vin:'4V4NC9EH6JN901233', loc:'Golden, CO'},
    {id:'DTL102', st:'available', make:'Kenworth', yr:2021, vin:'1XKYD49X0MJ372845', loc:'Roanoke, VA'}
  ];
  DV.st = {status:'Active', trailer:null, truck:null, period:'y2023', info:{}};

  /* ================================================================
     SCREENS (main / onboarding settings / stage form / print)
     ================================================================ */
  var screens = {main:'dvMain', settings:'dvScrSettings', stage:'dvScrStage', print:'dvScrPrint'};
  var screenBack = null;
  DV.showScreen = function(name, head){
    Object.keys(screens).forEach(function(k){ Q('#' + screens[k]).hidden = k !== name; });
    Q('#dvHeadMain').hidden = name !== 'main';
    Q('#dvHeadScreen').hidden = name === 'main';
    if(name !== 'main' && head){
      Q('#dvScrTitle').textContent = head.title; Q('#dvScrSub').textContent = head.sub || '';
      var ch = Q('#dvScrChip'); ch.hidden = !head.chip; ch.textContent = head.chip || '';
      Q('#dvScrActions').innerHTML = head.actions || '';
      screenBack = head.back || function(){ DV.showScreen('main'); };
      icons();
    }
    Q('#dvScroll').scrollTop = 0;
  };
  on(Q('#dvScreenBack'), 'click', function(){ if(screenBack) screenBack(); });
  on(Q('#dvBackList'), 'click', function(){ toast('success', 'Drivers', 'Back to the driver list is not part of this prototype.'); });

  /* ================================================================
     HEADER + STATUS
     ================================================================ */
  var STATUS_DOT = {Active:'green', Inactive:'amber', Terminated:'red'};
  DV.renderHead = function(){
    Q('#dvName').textContent = DRV.first + ' ' + DRV.last;
    Q('#dvAvatar').textContent = window.dpInitials(DRV.first + ' ' + DRV.last);
    Q('#dvChipId').textContent = DRV.id;
    var yrs = Math.floor(DV.daysBetween(fromYmd(DRV.hire), TODAY) / 365.25);
    Q('#dvSub').innerHTML = esc(DRV.city) + ' &middot; Manager ' + esc(DRV.manager) + ' &middot; With us ' + yrs + ' years &middot; ' + esc(DRV.eldStatus) + ' on ' + esc(DRV.eld);
    Q('#dvStatusTxt').textContent = DV.st.status;
    Q('#dvStatusDot').className = 'sdot ' + STATUS_DOT[DV.st.status];
  };
  DV.setStatus = function(s, extra){
    DV.st.status = s;
    if(s === 'Terminated'){ DV.st.info.termDate = extra.date; DV.st.info.termReason = extra.reason; }
    else { DV.st.info.termDate = ''; DV.st.info.termReason = ''; }
    DV.renderHead();
    if(DV.renderAccount) DV.renderAccount();
    if(DV.renderInfo) DV.renderInfo();
    toast('success', 'Status updated', DRV.first + ' ' + DRV.last + ' is now ' + s.toLowerCase() + '.');
  };
  on(Q('#dvStatusBtn'), 'click', function(e){
    var cur = DV.st.status;
    window.dpMenu.open(e.currentTarget, [
      {heading:'Driver status'},
      {label:'Active' + (cur === 'Active' ? '  ✓' : ''), icon:'circle-check', onClick:function(){ if(cur !== 'Active') DV.setStatus('Active'); }},
      {label:'Inactive' + (cur === 'Inactive' ? '  ✓' : ''), icon:'circle-pause', onClick:function(){ if(cur !== 'Inactive') DV.setStatus('Inactive'); }},
      {sep:true},
      {label:'Terminated' + (cur === 'Terminated' ? '  ✓' : ''), icon:'circle-x', danger:true, onClick:function(){ if(cur !== 'Terminated') DV.openTerminate(); }}
    ], 'left');
  });
  DV.openTerminate = function(){
    Q('#trDate').value = ymd(TODAY); Q('#trReason').value = ''; DV.opts(Q('#trCode'), [['Resigned', 'Resigned'], ['Dismissed', 'Dismissed'], ['Retired', 'Retired'], ['Contract ended', 'Contract ended']], 'Resigned');
    window.dpDialog.open('dlgTerminate');
  };
  on(Q('#trSave'), 'click', function(){
    var d = Q('#trDate').value; if(!d){ window.dpValidate.showError(Q('#trDate'), 'Pick the last day.'); return; }
    var code = Q('#trCode').value, note = Q('#trReason').value.trim();
    window.dpDialog.close('dlgTerminate');
    DV.setStatus('Terminated', {date:d, reason:code + (note ? ' — ' + note : '')});
  });

  /* ================================================================
     TOOLTIP — any [data-tip] gets a bubble above it
     ================================================================ */
  var tipEl = document.createElement('div'); tipEl.className = 'dv-tip'; tipEl.hidden = true; document.body.appendChild(tipEl);
  var tipFor = null;
  function Z(){ return parseFloat(getComputedStyle(document.body).zoom) || 1; }
  function snap(v){ return Math.round(v / 1.25) * 1.25; }
  DV.snap = snap; DV.Z = Z;
  function showTip(a){
    tipFor = a; tipEl.textContent = a.getAttribute('data-tip'); tipEl.hidden = false;
    var z = Z(), r = a.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight, vw = window.innerWidth / z;
    var left = r.left / z + r.width / z / 2 - w / 2, top = r.top / z - h - 7.5;
    if(top < 8) top = r.bottom / z + 7.5;
    left = Math.max(8, Math.min(left, vw - w - 8));
    tipEl.style.left = snap(left) + 'px'; tipEl.style.top = snap(top) + 'px';
  }
  document.addEventListener('mouseover', function(e){ var a = e.target.closest && e.target.closest('[data-tip]'); if(a && a !== tipFor) showTip(a); else if(!a && tipFor){ tipFor = null; tipEl.hidden = true; } });
  document.addEventListener('scroll', function(){ if(tipFor){ tipFor = null; tipEl.hidden = true; } }, true);

  /* ================================================================
     HOVER CARD — rich popover for calendar days
     ================================================================ */
  var cardEl = document.createElement('div'); cardEl.className = 'dv-hcard'; cardEl.hidden = true; document.body.appendChild(cardEl);
  var cardFor = null, cardTimer = null;
  DV.hoverCard = function(anchor, html){
    clearTimeout(cardTimer); cardFor = anchor; cardEl.innerHTML = html; cardEl.hidden = false; icons();
    var z = Z(), r = anchor.getBoundingClientRect(), w = cardEl.offsetWidth, h = cardEl.offsetHeight, vw = window.innerWidth / z, vh = window.innerHeight / z;
    var left = r.right / z + 8; if(left + w > vw - 10) left = r.left / z - w - 8;
    var top = r.top / z - 10; if(top + h > vh - 10) top = vh - h - 10; if(top < 10) top = 10;
    left = Math.max(10, left);
    cardEl.style.left = snap(left) + 'px'; cardEl.style.top = snap(top) + 'px';
  };
  DV.hideCard = function(){ clearTimeout(cardTimer); cardTimer = setTimeout(function(){ cardEl.hidden = true; cardFor = null; }, 80); };
  on(cardEl, 'mouseenter', function(){ clearTimeout(cardTimer); });
  on(cardEl, 'mouseleave', DV.hideCard);
  document.addEventListener('scroll', function(e){ if(!cardEl.hidden && !cardEl.contains(e.target)){ cardEl.hidden = true; cardFor = null; } }, true);

  /* ================================================================
     UNIT PICKER — searchable list with status badges (trailers, trucks,
     document types, drivers). Same trigger as the enhanced select.
     ================================================================ */
  DV.picker = function(host, cfg){
    host.classList.add('dropdown', 'dv-pick');
    host.innerHTML = '<button type="button" class="dropdown-trigger"><span class="dropdown-value placeholder"></span><svg class="chevron" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 10l5 5 5-5z"/></svg></button>';
    var trig = host.firstChild, val = Q('.dropdown-value', host);
    var panel = document.createElement('div'); panel.className = 'fpanel dv-ppanel'; panel.hidden = true; document.body.appendChild(panel);
    var cur = cfg.value || null, list = cfg.options || [], q = '';
    function byId(id){ return list.filter(function(o){ return o.id === id; })[0]; }
    function paint(){ var o = byId(cur); val.textContent = o ? o.label : (cfg.placeholder || 'Select'); val.classList.toggle('placeholder', !o); }
    function rows(){
      var f = list.filter(function(o){ return !q || (o.label + ' ' + (o.sub || '')).toLowerCase().indexOf(q) > -1; });
      if(!f.length) return '<div class="fpanel-empty">No matches</div>';
      return f.map(function(o){
        return '<button type="button" class="fopt dv-opt' + (o.id === cur ? ' selected' : '') + '" data-id="' + esc(o.id) + '"' + (o.disabled ? ' disabled' : '') + '>' +
          (o.icon ? '<i data-lucide="' + o.icon + '"></i>' : '') +
          '<span class="fopt-text"><b>' + esc(o.label) + '</b>' + (o.sub ? ' <span class="fopt-meta">· ' + esc(o.sub) + '</span>' : '') + '</span>' +
          (o.badge ? badge(o.badge[0], o.badge[1]) : '') + '</button>';
      }).join('');
    }
    function draw(){
      var keep = Q('.dv-psearch input', panel), focus = keep && document.activeElement === keep;
      if(!Q('.dv-psearch', panel)){
        panel.innerHTML = (cfg.search === false ? '' : '<div class="dv-psearch"><i data-lucide="search"></i><input type="text" placeholder="' + esc(cfg.searchHint || 'Search') + '" autocomplete="off"></div>') + '<div class="dv-plist"></div>';
        var inp = Q('.dv-psearch input', panel);
        if(inp) on(inp, 'input', function(){ q = inp.value.trim().toLowerCase(); Q('.dv-plist', panel).innerHTML = rows(); icons(); });
      }
      Q('.dv-plist', panel).innerHTML = rows(); icons();
      if(focus) Q('.dv-psearch input', panel).focus();
    }
    function place(){
      var z = Z(), r = trig.getBoundingClientRect();
      panel.style.width = snap(r.width / z) + 'px';
      window.dpPlace(panel, trig, 'left');
    }
    function open(){ if(!panel.hidden) return close(); q = ''; panel.innerHTML = ''; draw(); panel.hidden = false; host.classList.add('open'); place(); var i = Q('.dv-psearch input', panel); if(i) i.focus(); }
    function close(){ panel.hidden = true; host.classList.remove('open'); }
    function pick(id){ cur = id; paint(); close(); trig.classList.remove('field-invalid'); if(cfg.onChange) cfg.onChange(id, byId(id)); }
    on(trig, 'click', open);
    on(panel, 'click', function(e){ var b = e.target.closest('.dv-opt'); if(b && !b.disabled) pick(b.getAttribute('data-id')); });
    document.addEventListener('mousedown', function(e){ if(!panel.hidden && !panel.contains(e.target) && !host.contains(e.target)) close(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && !panel.hidden){ e.stopPropagation(); close(); trig.focus(); } }, true);
    document.addEventListener('scroll', function(e){ if(!panel.hidden && !panel.contains(e.target)) close(); }, true);
    window.addEventListener('resize', close);
    paint();
    return {
      get:function(){ return cur; }, item:function(){ return byId(cur); },
      set:function(id){ cur = id; paint(); },
      setOptions:function(o){ list = o; if(!byId(cur)) cur = null; paint(); },
      invalid:function(){ trig.classList.add('field-invalid'); }, el:trig
    };
  };

  /* ================================================================
     TABS — render a panel the first time it is shown
     ================================================================ */
  DV.renderers = {};
  var rendered = {};
  DV.ensure = function(tab){
    if(rendered[tab]) return;
    rendered[tab] = true;
    if(DV.renderers[tab]) DV.renderers[tab]();
    icons();
  };
  document.addEventListener('tabchange', function(e){
    if(e.detail.group !== 'dv') return;
    DV.ensure(e.detail.tab);
    Q('#dvScroll').scrollTop = 0;
    if(window.dpEnhanceAll) window.dpEnhanceAll(Q('#dvMain'));
  });
  DV.go = function(tab){ window.dpSelectTab('dv', tab); };
})();
