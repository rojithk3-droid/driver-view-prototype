(function(){
  'use strict';
  var DV = window.DV, Q = DV.Q, QA = DV.QA, esc = DV.esc, on = DV.on, icons = DV.icons, toast = DV.toast, badge = DV.badge, $m = DV.$m, DRV = DV.DRV, TODAY = DV.TODAY, pad = DV.pad, fmt = DV.fmt;

  /* ================================================================
     OCCUPANCY CALENDAR
     ================================================================ */
  var TYPES = [
    {k:'occupied', n:'Occupied', c:'#10B981'}, {k:'maintenance', n:'Maintenance', c:'#2E7DF7'}, {k:'unauthorized', n:'Unauthorized', c:'#B91C1C'},
    {k:'hos', n:'Hours-of-service', c:'#93C5FD'}, {k:'timeoff', n:'Time off', c:'#EF4444'}
  ];
  var TYPE = {}; TYPES.forEach(function(t){ TYPE[t.k] = t; });
  var HOLIDAYS = {'1-1':'New Year’s Day', '2-14':'Valentine’s Day', '5-29':'Memorial Day', '6-19':'Juneteenth', '7-4':'Independence Day', '9-4':'Labor Day', '10-9':'Columbus Day', '11-11':'Veterans Day', '11-23':'Thanksgiving', '12-25':'Christmas Day'};
  var CITIES = ['Roanoke, VA', 'Harrisburg, PA', 'Bristol, VA', 'Bethlehem, PA', 'Salem, VA', 'Harrisonburg, VA', 'Lynchburg, VA', 'Charlotte, NC', 'Columbus, OH', 'Knoxville, TN', 'Richmond, VA', 'Baltimore, MD', 'Raleigh, NC', 'Parkersburg, WV'];
  var view = {y:2023, m:4, mode:'month', focus:null, week:new Date(2023, 4, 15), holidays:false};
  var cache = {};

  function dayInfo(y, m, d){
    var dt = new Date(y, m, d);
    if(dt >= TODAY) return null;
    var key = y + '-' + m + '-' + d; if(cache[key] !== undefined) return cache[key];
    var dow = dt.getDay(), r = DV.seed(DV.hash(key)), info;
    if(y === 2023 && m === 4){
      var tm = {6:1, 7:1, 13:1, 14:1};
      info = tm[d] ? {type:'timeoff'} : {type:'occupied'};
    } else if(dow === 0 || dow === 6) info = r < 0.6 ? {type:'timeoff'} : {type:'occupied'};
    else info = r < 0.8 ? {type:'occupied'} : r < 0.87 ? {type:'maintenance'} : r < 0.92 ? {type:'hos'} : r < 0.96 ? {type:'unauthorized'} : {type:'timeoff'};
    if(info.type === 'occupied') info.loads = makeLoads(y, m, d, key);
    cache[key] = info; return info;
  }
  function makeLoads(y, m, d, key){
    if(y === 2023 && m === 4 && d === 1){
      return [{id:'DTL-39325', from:'Roanoke, VA', to:'Bethlehem, PA', dh:80, ld:580, rev:1590, line:1465, fsc:110, acc:15, oth:0},
              {id:'DTL-45872', from:'Harrisburg, PA', to:'Salem, VA', dh:40, ld:490, rev:1600, line:1500, fsc:80, acc:20, oth:0},
              {id:'DTL-58794', from:'Bristol, VA', to:'Harrisonburg, VA', dh:60, ld:340, rev:1320, line:1230, fsc:75, acc:15, oth:0}];
    }
    var n = 1 + Math.floor(DV.seed(DV.hash(key + 'n')) * 1.6), out = [];
    for(var i = 0; i < n; i++){
      var s = DV.seed(DV.hash(key + i));
      var a = CITIES[Math.floor(s * CITIES.length)], b = CITIES[Math.floor(DV.seed(DV.hash(key + i + 'b')) * CITIES.length)]; if(a === b) b = CITIES[(CITIES.indexOf(a) + 3) % CITIES.length];
      var ld = 110 + Math.round(DV.seed(DV.hash(key + i + 'l')) * 280), dh = 15 + Math.round(DV.seed(DV.hash(key + i + 'd')) * 55), rev = Math.round((ld + dh) * (1.9 + DV.seed(DV.hash(key + i + 'r')) * 0.8) / 5) * 5;
      var no = 30000 + Math.floor(DV.seed(DV.hash(key + i + 'id')) * 29999), fsc = Math.round(rev * 0.07), acc = Math.round(rev * 0.006);
      out.push({id:'DTL-' + no, from:a, to:b, dh:dh, ld:ld, rev:rev, line:rev - fsc - acc, fsc:fsc, acc:acc, oth:0});
    }
    return out;
  }
  function monthStats(y, m){
    var last = new Date(y, m + 1, 0).getDate(), c = {occupied:0, maintenance:0, unauthorized:0, hos:0, timeoff:0}, days = 0, S = {rev:0, line:0, fsc:0, acc:0, oth:0, dh:0, ld:0, loads:0};
    for(var d = 1; d <= last; d++){
      var i = dayInfo(y, m, d); if(!i) continue; days++; c[i.type]++;
      (i.loads || []).forEach(function(l){ S.rev += l.rev; S.line += l.line; S.fsc += l.fsc; S.acc += l.acc; S.dh += l.dh; S.ld += l.ld; S.loads++; });
    }
    return {counts:c, days:days, S:S};
  }
  function loadRow(l){
    var tot = l.dh + l.ld, cpm = tot ? l.rev / tot : 0;
    return '<li><div class="dv-hc-l"><a href="#" class="dv-link" data-lv="' + esc(l.id) + '">' + esc(l.id) + '</a><span>' + esc(l.from) + ' <i data-lucide="arrow-right"></i> ' + esc(l.to) + '</span></div>' +
      '<div class="dv-hc-n"><span><small>Miles</small><b>' + l.dh + ' DH · ' + l.ld + ' LD</b></span><span><small>Revenue</small><b>' + $m(l.rev) + '</b></span><span><small>CPM</small><b>$' + cpm.toFixed(2) + '</b></span></div></li>';
  }
  function dayCard(y, m, d, info){
    var dt = new Date(y, m, d), t = TYPE[info.type];
    var head = '<div class="dv-hc-h"><span class="dv-hc-d"><b>' + d + '</b><small>' + DV.MON3[m] + '</small></span><div><h4>' + DV.DOWL[dt.getDay()] + ', ' + DV.MONTHS[m] + ' ' + d + '</h4><p><i style="background:' + t.c + '"></i>' + t.n + '</p></div></div>';
    if(!info.loads) return head + '<div class="dv-hc-empty">' + (info.type === 'timeoff' ? 'Scheduled time off. No loads dispatched.' : 'No loads dispatched on this day.') + '</div>';
    var mi = 0, rev = 0; info.loads.forEach(function(l){ mi += l.dh + l.ld; rev += l.rev; });
    return head + '<ul class="dv-hc-list">' + info.loads.map(loadRow).join('') + '</ul>' +
      '<div class="dv-hc-f"><span><small>Total mileage</small><b>' + fmt(mi) + '</b></span><span><small>Total revenue</small><b>' + $m(rev) + '</b></span><span><small>Total CPM</small><b>$' + (rev / mi).toFixed(2) + '</b></span></div>';
  }

  function tile(y, m, d, outside){
    var info = dayInfo(y, m, d), dt = new Date(y, m, d), isToday = +dt === +TODAY, dim = view.focus && info && info.type !== view.focus, hol = HOLIDAYS[(m + 1) + '-' + d];
    var cls = 'dv-day-t' + (outside ? ' out' : '') + (info ? ' has t-' + info.type : '') + (isToday ? ' today' : '') + (dim ? ' dim' : '') + (info && info.loads ? ' loaded' : '');
    var st = info ? ' style="--c:' + TYPE[info.type].c + '"' : '';
    var lab = info ? '<span class="dv-day-l">' + TYPE[info.type].n + '</span>' + (info.loads ? '<span class="dv-day-dots">' + info.loads.map(function(){ return '<i></i>'; }).join('') + '</span>' : '') : '';
    return '<div class="' + cls + '"' + st + ' data-y="' + y + '" data-m="' + m + '" data-d="' + d + '" tabindex="' + (info ? 0 : -1) + '"><span class="dv-day-n">' + d + '</span>' +
      (view.holidays && hol ? '<span class="dv-day-h" data-tip="' + esc(hol) + '"><i data-lucide="flag"></i></span>' : '') + (isToday ? '<span class="dv-day-today">Today</span>' : '') + lab + '</div>';
  }
  function monthGrid(){
    var y = view.y, m = view.m, first = new Date(y, m, 1), lead = first.getDay(), last = new Date(y, m + 1, 0).getDate(), prevLast = new Date(y, m, 0).getDate();
    var cells = '';
    for(var i = 0; i < lead; i++) cells += '<div class="dv-day-t out blank"></div>';
    for(var d = 1; d <= last; d++) cells += tile(y, m, d, false);
    var rest = (7 - (lead + last) % 7) % 7; for(var j = 0; j < rest; j++) cells += '<div class="dv-day-t out blank"></div>';
    return '<div class="dv-cal-dow">' + DV.DOW3.map(function(x){ return '<span>' + x + '</span>'; }).join('') + '</div><div class="dv-cal-grid">' + cells + '</div>';
  }
  function weekGrid(){
    var s = new Date(view.week); s.setDate(s.getDate() - s.getDay()); var cols = '';
    for(var i = 0; i < 7; i++){
      var d = new Date(s); d.setDate(s.getDate() + i);
      var info = dayInfo(d.getFullYear(), d.getMonth(), d.getDate()), t = info && TYPE[info.type];
      cols += '<div class="dv-wk-col' + (+d === +TODAY ? ' today' : '') + '"><div class="dv-wk-h"><small>' + DV.DOW3[i] + '</small><b>' + d.getDate() + '</b></div>' +
        (info ? '<span class="dv-wk-t" style="--c:' + t.c + '">' + t.n + '</span>' + (info.loads ? info.loads.map(function(l){ return '<a href="#" class="dv-wk-load" data-lv="' + esc(l.id) + '"><b>' + esc(l.id) + '</b><span>' + esc(l.from.split(',')[0]) + ' → ' + esc(l.to.split(',')[0]) + '</span><em>' + $m(l.rev, 0) + '</em></a>'; }).join('') : '') : '<span class="dv-wk-none">No data yet</span>') + '</div>';
    }
    return '<div class="dv-wk">' + cols + '</div>';
  }
  function perfRow(id, label, value, subs, open){
    return '<div class="dv-pf' + (open ? ' open' : '') + '" data-pf="' + id + '"><button type="button" class="dv-pf-h"' + (subs ? '' : ' disabled') + '><span class="dv-pf-ic">' + (subs ? '<i data-lucide="plus"></i>' : '<i data-lucide="minus" style="opacity:.0"></i>') + '</span><span class="dv-pf-k">' + label + '</span><b>' + value + '</b></button>' +
      (subs ? '<ul class="dv-pf-s">' + subs.map(function(s){ return '<li><span>' + s[0] + '</span><b>' + s[1] + '</b></li>'; }).join('') + '</ul>' : '') + '</div>';
  }
  function summary(){
    var st = monthStats(view.y, view.m), S = st.S, d = st.days || 1, mi = S.dh + S.ld;
    if(!st.days) return '<div class="dv-none">No activity recorded for this month yet.</div>';
    var open = {};
    QA('.dv-pf.open', Q('#pOccupancy')).forEach(function(e){ open[e.getAttribute('data-pf')] = 1; });
    return perfRow('rev', 'Total monthly revenue', $m(S.rev), [['Linehaul', $m(S.line)], ['Fuel surcharge', $m(S.fsc)], ['Accessorials', $m(S.acc)], ['Other', $m(S.oth)]], open.rev) +
      perfRow('mi', 'Total monthly miles', fmt(mi), [['Empty (deadhead)', fmt(S.dh)], ['Loaded', fmt(S.ld)]], open.mi) +
      perfRow('apd', 'Average revenue per day', $m(S.rev / d), null) +
      perfRow('mpd', 'Average miles per day', (mi / d).toFixed(2), [['Loaded per day', (S.ld / d).toFixed(2)], ['Deadhead per day', (S.dh / d).toFixed(2)]], open.mpd) +
      perfRow('cpm', 'Cent per mile', '$' + (mi ? S.rev / mi : 0).toFixed(2), [['Loaded CPM', '$' + (S.ld ? S.line / S.ld : 0).toFixed(2)], ['Total CPM', '$' + (mi ? S.rev / mi : 0).toFixed(2)]], open.cpm) +
      '<div class="dv-pf-t"><div><span>Monthly revenue target</span><b>' + Math.min(100, S.rev / 30000 * 100).toFixed(2) + '%</b></div><div class="dv-meter"><i style="width:' + Math.min(100, S.rev / 30000 * 100) + '%"></i></div>' +
      '<div style="margin-top:12.5px"><span>Monthly occupancy target · 72.00%</span><b>' + (st.counts.occupied / d * 100).toFixed(2) + '%</b></div><div class="dv-meter"><i class="' + (st.counts.occupied / d >= 0.72 ? 'ok' : 'low') + '" style="width:' + Math.min(100, st.counts.occupied / d * 100) + '%"></i><u style="left:72%"></u></div></div>';
  }
  function keyList(){
    var st = monthStats(view.y, view.m), d = st.days || 1;
    return TYPES.map(function(t){
      var p = st.days ? st.counts[t.k] / d * 100 : 0;
      return '<button type="button" class="dv-key' + (view.focus === t.k ? ' on' : '') + '" data-key="' + t.k + '"><i style="background:' + t.c + '"></i><span>' + t.n + '</span><em>' + st.counts[t.k] + (st.counts[t.k] === 1 ? ' day' : ' days') + '</em><b>' + p.toFixed(2) + '%</b></button>';
    }).join('');
  }
  function title(){
    if(view.mode === 'month') return DV.MONTHS[view.m] + ' ' + view.y;
    var s = new Date(view.week); s.setDate(s.getDate() - s.getDay()); var e = new Date(s); e.setDate(s.getDate() + 6);
    return DV.MON3[s.getMonth()] + ' ' + s.getDate() + ' – ' + (s.getMonth() !== e.getMonth() ? DV.MON3[e.getMonth()] + ' ' : '') + e.getDate() + ', ' + e.getFullYear();
  }
  function paint(){
    Q('#ocTitle').textContent = title();
    Q('#ocBody').innerHTML = view.mode === 'month' ? monthGrid() : weekGrid();
    Q('#ocKey').innerHTML = keyList();
    Q('#ocSum').innerHTML = summary();
    Q('#ocSumDesc').textContent = view.mode === 'month' ? DV.MONTHS[view.m] + ' ' + view.y : 'Month of ' + DV.MONTHS[view.week.getMonth()];
    icons();
  }
  DV.renderers.occupancy = function(){
    Q('#pOccupancy').innerHTML = '<div class="dv-oc">' +
      '<aside class="dv-oc-side">' +
        '<div class="card"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">View</h2></div><p class="card-desc">Driver ' + esc(DRV.last) + ', ' + esc(DRV.first) + '</p></div></div>' +
        '<div class="card-body"><div class="field"><label class="field-label">Timeframe</label><div class="segmented" id="ocMode" style="width:100%"><button type="button" class="active" data-m="month" style="flex:1">Month</button><button type="button" data-m="week" style="flex:1">Week</button></div></div>' +
        '<div class="switch-row" style="margin-top:-2.5px"><span class="switch-row-text"><span class="switch-row-title">Show holidays</span><span class="switch-row-desc">Flags federal holidays on the grid</span></span><label class="switch"><input type="checkbox" id="ocHol"><span></span></label></div></div></div>' +
        '<div class="card"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">Occupancy key</h2></div><p class="card-desc">Click a type to spotlight it.</p></div></div><div class="card-body" style="padding-top:8.75px;padding-bottom:8.75px" id="ocKey"></div></div>' +
        '<div class="card"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">Performance summary</h2></div><p class="card-desc" id="ocSumDesc"></p></div></div><div class="card-body" id="ocSum"></div></div>' +
      '</aside>' +
      '<div class="card dv-oc-main"><div class="card-head"><div class="card-head-text"><div class="dv-cal-nav"><button type="button" class="dv-back" id="ocPrev" aria-label="Previous"><i data-lucide="chevron-left"></i></button><h2 class="card-title" id="ocTitle"></h2><button type="button" class="dv-back" id="ocNext" aria-label="Next"><i data-lucide="chevron-right"></i></button></div></div>' +
      '<div class="card-head-actions"><button type="button" class="btn-outline" data-size="sm" id="ocToday">Today</button></div></div>' +
      '<div class="card-body" id="ocBody"></div></div></div>';
    paint();
    on(Q('#ocMode'), 'click', function(e){ var b = e.target.closest('button[data-m]'); if(!b) return; view.mode = b.getAttribute('data-m'); QA('#ocMode button').forEach(function(x){ x.classList.toggle('active', x === b); }); if(view.mode === 'week'){ view.week = new Date(view.y, view.m, view.m === 4 && view.y === 2023 ? 15 : 1); } paint(); });
    on(Q('#ocHol'), 'change', function(e){ view.holidays = e.target.checked; paint(); });
    function step(n){
      if(view.mode === 'month'){ view.m += n; if(view.m < 0){ view.m = 11; view.y--; } if(view.m > 11){ view.m = 0; view.y++; } }
      else { view.week = new Date(view.week.getFullYear(), view.week.getMonth(), view.week.getDate() + 7 * n); view.y = view.week.getFullYear(); view.m = view.week.getMonth(); }
      paint();
    }
    on(Q('#ocPrev'), 'click', function(){ step(-1); }); on(Q('#ocNext'), 'click', function(){ step(1); });
    on(Q('#ocToday'), 'click', function(){ view.y = 2023; view.m = 4; view.week = new Date(TODAY); paint(); });
    on(Q('#ocKey'), 'click', function(e){ var b = e.target.closest('[data-key]'); if(!b) return; view.focus = view.focus === b.getAttribute('data-key') ? null : b.getAttribute('data-key'); paint(); });
    on(Q('#ocSum'), 'click', function(e){ var h = e.target.closest('.dv-pf-h'); if(!h || h.disabled) return; var p = h.parentNode; p.classList.toggle('open'); var ic = h.querySelector('.dv-pf-ic'); ic.innerHTML = '<i data-lucide="' + (p.classList.contains('open') ? 'minus' : 'plus') + '"></i>'; icons(); });
    var body = Q('#ocBody');
    function overDay(e){
      var t = e.target.closest('.dv-day-t.has'); if(!t) return;
      var y = +t.getAttribute('data-y'), m = +t.getAttribute('data-m'), d = +t.getAttribute('data-d');
      DV.hoverCard(t, dayCard(y, m, d, dayInfo(y, m, d)));
    }
    on(body, 'mouseover', overDay); on(body, 'focusin', overDay);
    on(body, 'mouseout', function(e){ if(e.target.closest('.dv-day-t.has')) DV.hideCard(); });
    on(body, 'click', function(e){ var t = e.target.closest('.dv-day-t.has'); if(t && !e.target.closest('[data-lv]')) overDay(e); });
  };
  /* open the finalised load view from any load link */
  document.addEventListener('click', function(e){
    var a = e.target.closest('[data-lv]'); if(!a) return;
    e.preventDefault(); DV.hideCard(); window.dpOpenLoadView(a.getAttribute('data-lv'));
  });

  /* ================================================================
     LOADS
     ================================================================ */
  var LOADS = DV.LOADS = [
    {id:'DTL-39264', truck:'DTL88', trailer:'V5304', disp:'Lois Gisiner', oc:'Lynchburg, VA', oa:'2800 Carroll Ave', dc:'Halethorpe, MD', da:'4734 Trident Court', st:'Delivered', last:'Halethorpe, MD', rate:1100, date:'2023-05-16'},
    {id:'DTL-39260', truck:'DTL88', trailer:'V5304', disp:'Lois Gisiner', oc:'Roanoke, VA', oa:'1715 Granby Street NE', dc:'Roanoke, VA', da:'2922 Nichols Ave NE', st:'Delivered', last:'Roanoke, VA', rate:600, date:'2023-05-15'},
    {id:'Time Off', truck:'DTL88', trailer:'', disp:'Lois Gisiner', oc:'', oa:'', dc:'Halethorpe, MD', da:'4734 Trident Court', st:'Complete', last:'Halethorpe, MD', rate:0, date:'2023-05-13', off:true},
    {id:'DTL-39246', truck:'DTL88', trailer:'V5307', disp:'Lois Gisiner', oc:'Henderson, KY', oa:'2315 Adams Lane', dc:'Independence, VA', da:'One Michelin Way', st:'Delivered', last:'Independence, VA', rate:1500, date:'2023-05-11'},
    {id:'DTL-39238', truck:'DTL88', trailer:'V5307', disp:'Lois Gisiner', oc:'Abingdon, VA', oa:'26331 Hillman Highway', dc:'Paducah, KY', da:'5550 Commerce Dr', st:'Delivered', last:'Paducah, KY', rate:850, date:'2023-05-10'},
    {id:'DTL-39255', truck:'DTL88', trailer:'V5302', disp:'Joy Bailey', oc:'Groveport, OH', oa:'3219 Rohr Rd', dc:'Kingsport, TN', da:'2117 Berry Street', st:'Delivered', last:'Kingsport, TN', rate:1000, date:'2023-05-09'},
    {id:'DTL-39211', truck:'DTL88', trailer:'V5302', disp:'Joy Bailey', oc:'Roanoke, VA', oa:'235 Shenandoah Ave NW', dc:'Parkersburg, WV', da:'1600 13th Street', st:'Delivered', last:'Parkersburg, WV', rate:825, date:'2023-05-08'},
    {id:'Time Off', truck:'DTL88', trailer:'', disp:'Lois Gisiner', oc:'', oa:'', dc:'', da:'', st:'Complete', last:'Roanoke, VA', rate:0, date:'2023-05-07', off:true}
  ];
  var lq = {q:'', st:'All', sort:'date', dir:-1};
  function loadsRows(){
    var q = lq.q.toLowerCase();
    var rows = LOADS.filter(function(l){ return (lq.st === 'All' || l.st === lq.st || (lq.st === 'Time off' && l.off)) && (!q || [l.id, l.truck, l.trailer, l.disp, l.oc, l.dc, l.oa, l.da, l.st, l.last].join(' ').toLowerCase().indexOf(q) > -1); });
    rows.sort(function(a, b){ var x = a[lq.sort], y = b[lq.sort]; return (x < y ? -1 : x > y ? 1 : 0) * lq.dir; });
    return rows;
  }
  function paintLoads(){
    var rows = loadsRows(), tot = rows.reduce(function(a, l){ return a + l.rate; }, 0), real = rows.filter(function(l){ return !l.off; }).length;
    var tb = Q('#ldBody'); tb.innerHTML = rows.map(function(l){
      var route = l.off ? '<span class="dv-off"><i data-lucide="palmtree"></i> Time off</span>' : '<span class="dv-route"><b>' + esc(l.oc) + '</b><i data-lucide="arrow-right"></i><b>' + esc(l.dc) + '</b></span><span class="cell-sub">' + esc(l.oa) + ' → ' + esc(l.da) + '</span>';
      return '<tr><td>' + (l.off ? '<span class="cell-main muted">' + esc(l.id) + '</span>' : '<a href="#" class="dv-link" data-lv="' + esc(l.id) + '">' + esc(l.id) + '</a>') + '<span class="cell-sub">' + DV.nice(l.date) + '</span></td>' +
        '<td>' + route + '</td><td><span class="dv-unit"><i data-lucide="truck"></i>' + esc(l.truck) + '</span>' + (l.trailer ? '<span class="dv-unit"><i data-lucide="container"></i>' + esc(l.trailer) + '</span>' : '') + '</td>' +
        '<td><span class="dv-who"><span class="av" data-size="sm" data-c="' + (l.disp.charAt(0) === 'L' ? 3 : 5) + '">' + window.dpInitials(l.disp) + '</span>' + esc(l.disp) + '</span></td>' +
        '<td>' + (l.st === 'Delivered' ? badge('success', 'Delivered') : badge('', l.st)) + '</td><td><span class="cell-main" style="font-weight:400"><i data-lucide="map-pin" class="dv-mp"></i>' + esc(l.last) + '</span></td>' +
        '<td class="r"><b class="dv-b">' + $m(l.rate) + '</b></td></tr>';
    }).join('') || '<tr><td colspan="7"><div class="dv-none" style="text-align:center">No loads match.</div></td></tr>';
    Q('#ldCount').textContent = rows.length;
    Q('#ldSum').innerHTML = '<b>' + real + '</b> loads · <b>' + $m(tot) + '</b> gross' + (real ? ' · <b>' + $m(tot / real) + '</b> average' : '');
    QA('#pLoads th.sortable').forEach(function(th){ var k = th.getAttribute('data-k'); th.querySelector('.sort-ind').textContent = lq.sort === k ? (lq.dir > 0 ? '↑' : '↓') : ''; });
    icons();
  }
  DV.renderers.loads = function(){
    Q('#pLoads').innerHTML = '<div class="card"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">Loads</h2><span class="badge" id="ldCount">0</span></div><p class="card-desc" id="ldSum"></p></div>' +
      '<div class="card-head-actions"><div class="dv-search"><i data-lucide="search"></i><input type="text" class="text-input" id="ldQ" placeholder="Search load, city, dispatcher" aria-label="Search loads"></div></div></div>' +
      '<div class="dv-chips" id="ldChips"><button type="button" class="active" data-s="All">All</button><button type="button" data-s="Delivered">Delivered</button><button type="button" data-s="Complete">Complete</button><button type="button" data-s="Time off">Time off</button></div>' +
      '<div class="card-body" style="padding:0"><div class="data-grid-scroll"><table class="pay-table dense"><thead><tr>' +
      '<th class="sortable" data-k="id"><span class="th-in">Load <span class="sort-ind"></span></span></th><th>Route</th><th>Equipment</th><th class="sortable" data-k="disp"><span class="th-in">Dispatcher <span class="sort-ind"></span></span></th><th class="sortable" data-k="st"><span class="th-in">Status <span class="sort-ind"></span></span></th><th>Last location</th><th class="r sortable" data-k="rate"><span class="th-in">Rate <span class="sort-ind"></span></span></th></tr></thead><tbody id="ldBody"></tbody></table></div></div></div>';
    paintLoads();
    on(Q('#ldQ'), 'input', function(e){ lq.q = e.target.value.trim(); paintLoads(); });
    on(Q('#ldChips'), 'click', function(e){ var b = e.target.closest('button[data-s]'); if(!b) return; lq.st = b.getAttribute('data-s'); QA('#ldChips button').forEach(function(x){ x.classList.toggle('active', x === b); }); paintLoads(); });
    QA('#pLoads th.sortable').forEach(function(th){ on(th, 'click', function(){ var k = th.getAttribute('data-k'); if(lq.sort === k) lq.dir *= -1; else { lq.sort = k; lq.dir = 1; } paintLoads(); }); });
    icons();
  };
})();
