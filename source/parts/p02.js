(function(){
  'use strict';
  var DV = window.DV, Q = DV.Q, QA = DV.QA, esc = DV.esc, on = DV.on, ico = DV.ico, icons = DV.icons, toast = DV.toast, badge = DV.badge, $m = DV.$m, DRV = DV.DRV, TODAY = DV.TODAY, mdy = DV.mdy, ymd = DV.ymd, fmt = DV.fmt;

  /* ================================================================
     DATA
     ================================================================ */
  var PERIODS = [['y2023', 'Jan 1 – Dec 31, 2023', 1], ['y2022', 'Jan 1 – Dec 31, 2022', 0.94], ['q', 'Last 90 days', 0.27], ['mtd', 'This month', 0.09]];
  var HOS = [
    {k:'break', label:'Until break', t:'08:00', mins:480, lim:480, tip:'Driving time before the 30-minute break is required.'},
    {k:'drive', label:'Drive', t:'02:30', mins:150, lim:660, tip:'Drive time left in this shift (11-hour limit).'},
    {k:'shift', label:'Shift', t:'02:30', mins:150, lim:840, tip:'Time left in the 14-hour on-duty window.'},
    {k:'cycle', label:'Cycle', t:'38:15', mins:2295, lim:4200, tip:'Hours left in the 70-hour / 8-day cycle.'}
  ];
  DV.HOS = HOS;
  var OCC = [['Occupied', 72, '#10B981'], ['Maintenance', 4, '#2E7DF7'], ['Unauthorized', 6, '#B91C1C'], ['Hours of service', 10, '#93C5FD'], ['No dispatch', 8, '#9CA3AF']];
  DV.OCC_COLORS = {occupied:'#10B981', maintenance:'#2E7DF7', unauthorized:'#B91C1C', hos:'#93C5FD', timeoff:'#EF4444'};
  var GOALS = [
    {k:'Revenue', icon:'dollar-sign', target:27857, actual:20369.48, fmt:function(v){ return $m(v); }, better:'high'},
    {k:'Mileage', icon:'gauge', target:9500, actual:7529, fmt:function(v){ return fmt(v) + ' mi'; }, better:'high'},
    {k:'Cent per mile', icon:'circle-dollar-sign', target:2.5, actual:2.71, fmt:function(v){ return '$' + v.toFixed(2); }, better:'high'},
    {k:'Occupancy', icon:'percent', target:72, actual:50, fmt:function(v){ return v + '%'; }, better:'high'}
  ];
  var STATS = [
    ['This month', 20, 555, 2150, 2705, 1000, 4010, 5410, 2.00], ['Last month', 15, 1600, 8670, 10270, 5675, 20000, 25675, 2.50],
    ['This year', 19, 13875, 59000, 72875, 23005, 130032.5, 153037.5, 2.10], ['Last year', 20, 28860, 114400, 143260, 43300, 322013, 365313, 2.55]
  ];

  function period(){ return PERIODS.filter(function(p){ return p[0] === DV.st.period; })[0]; }
  function metrics(){
    var f = period()[2];
    return {occ:Math.round(72 - (1 - f) * 8), loads:Math.round(756 * f), mpg:(7.16 + (1 - f) * 0.2).toFixed(2), disc:76.15 * f, ppg:4.56 + (f < 1 ? 0.05 : 0), miles:Math.round(698412 * f),
      cpm:(2.49 + (1 - f) * 0.1).toFixed(2), revenue:Math.round(1739052 * f), earnings:348882.09 * f};
  }

  /* ================================================================
     BUILDING BLOCKS
     ================================================================ */
  function ring(frac, color, text){
    var r = 36.25, c = 2 * Math.PI * r, d = Math.max(0, Math.min(1, frac)) * c;
    return '<svg class="dv-ring" viewBox="0 0 87.5 87.5" aria-hidden="true"><circle cx="43.75" cy="43.75" r="' + r + '" fill="none" stroke="var(--border-soft)" stroke-width="7.5"/>' +
      '<circle cx="43.75" cy="43.75" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="7.5" stroke-linecap="round" stroke-dasharray="' + d.toFixed(1) + ' ' + (c - d).toFixed(1) + '" transform="rotate(-90 43.75 43.75)"/></svg><b>' + text + '</b>';
  }
  DV.ring = ring;
  function donut(parts, centerBig, centerSmall){
    var r = 42.5, c = 2 * Math.PI * r, off = 0, s = '';
    parts.forEach(function(p){
      var len = p[1] / 100 * c;
      s += '<circle cx="62.5" cy="62.5" r="' + r + '" fill="none" stroke="' + p[2] + '" stroke-width="15" stroke-dasharray="' + Math.max(0, len - 1.5).toFixed(1) + ' ' + (c - len + 1.5).toFixed(1) + '" stroke-dashoffset="' + (-off).toFixed(1) + '" transform="rotate(-90 62.5 62.5)"/>';
      off += len;
    });
    return '<div class="dv-donut"><svg viewBox="0 0 125 125" aria-hidden="true"><circle cx="62.5" cy="62.5" r="' + r + '" fill="none" stroke="var(--border-soft)" stroke-width="15"/>' + s + '</svg><div class="dv-donut-c"><b>' + centerBig + '</b><span>' + centerSmall + '</span></div></div>';
  }
  DV.donut = donut;
  function copyBtn(v){ return '<button type="button" class="dv-icbtn" data-copy="' + esc(v) + '" aria-label="Copy" data-tip="Copy"><i data-lucide="copy"></i></button>'; }
  function trailerOf(){ return DV.st.trailer && DV.TRAILERS.filter(function(t){ return t.id === DV.st.trailer.id; })[0]; }
  function truckOf(){ return DV.st.truck && DV.TRUCKS.filter(function(t){ return t.id === DV.st.truck.id; })[0]; }

  /* ================================================================
     CARDS
     ================================================================ */
  function identityCard(){
    var info = DV.st.info;
    var rk = DRV.ranks.map(function(r){
      var pos = Math.round((50 - r[1]) / 49 * 100);
      return '<div class="dv-rank"><b>#' + r[1] + '</b><span>' + r[0] + '</span><i class="dv-rk-track"><i style="left:' + pos + '%"></i></i><em>' + r[1] + ' of 50</em></div>';
    }).join('');
    function row(icon, label, val, extra, copy){
      return '<li><span class="dv-ct-ic"><i data-lucide="' + icon + '"></i></span><span class="dv-ct-t"><small>' + label + '</small><b>' + val + '</b></span>' + (extra || '') + (copy ? copyBtn(copy) : '') + '</li>';
    }
    return '<div class="card dv-ident">' +
      '<div class="dv-ident-top"><div class="dv-photo">' + window.dpInitials(DRV.first + ' ' + DRV.last) + '<span class="dv-photo-dot ' + (DV.st.status === 'Active' ? 'green' : DV.st.status === 'Inactive' ? 'amber' : 'red') + '"></span></div>' +
      '<div class="dv-ident-name"><h2>' + esc(DRV.full) + '</h2><p>Goes by “' + esc(DRV.nick) + '” · ' + badge(DV.st.status === 'Active' ? 'success' : DV.st.status === 'Inactive' ? 'warning' : 'danger', DV.st.status) + '</p></div></div>' +
      '<ul class="dv-contact">' +
      row('smartphone', 'Cell', esc(info.cell || DRV.cell), '<span class="badge" data-variant="' + (DRV.sms ? 'success' : 'danger') + '">SMS ' + (DRV.sms ? 'on' : 'off') + '</span>', info.cell || DRV.cell) +
      row('phone', 'Home', esc(info.home || DRV.home), '', info.home || DRV.home) +
      row('mail', 'Email', esc(info.email || DRV.email), '', info.email || DRV.email) +
      row('map-pin', 'Address', esc(info.addr || DRV.addr), '', info.addr || DRV.addr) +
      '</ul>' +
      '<div class="dv-ranks">' + rk + '</div></div>';
  }

  function slotHtml(kind){
    var isTruck = kind === 'truck', u = isTruck ? truckOf() : trailerOf(), cur = isTruck ? DV.st.truck : DV.st.trailer;
    var label = isTruck ? 'Truck' : 'Trailer', icon = isTruck ? 'truck' : 'container';
    if(!u){
      return '<button type="button" class="dv-slot empty" data-act="assign-' + kind + '"><span class="dv-slot-ic"><i data-lucide="' + icon + '"></i></span>' +
        '<span class="dv-slot-t"><small>' + label + '</small><b>No ' + kind + ' assigned</b><span>' + (isTruck ? 'Pair a power unit so loads can be booked.' : 'Attach a trailer to this truck.') + '</span></span>' +
        '<span class="dv-slot-cta">Assign ' + kind + ' <i data-lucide="plus"></i></span></button>';
    }
    var sub = isTruck ? u.make + ' ' + u.yr + ' · ' + u.loc : u.type + ' · ' + u.loc;
    var warn = !isTruck && u.svc ? '<span class="dv-slot-warn">' + badge('warning', 'Service due') + '</span>' : '';
    return '<div class="dv-slot filled"><span class="dv-slot-ic"><i data-lucide="' + icon + '"></i></span>' +
      '<span class="dv-slot-t"><small>' + label + ' · since ' + DV.nice(cur.since) + '</small><b>' + esc(u.id) + '</b><span title="' + esc(sub) + '">' + esc(sub) + '</span></span>' + warn +
      '<button type="button" class="dv-icbtn" data-act="swap-' + kind + '" aria-label="Change ' + kind + '" data-tip="Change ' + kind + '"><i data-lucide="pencil"></i></button></div>';
  }
  function equipCard(){
    var both = DV.st.truck && DV.st.trailer;
    return '<div class="card"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">Equipment</h2></div><p class="card-desc">What this driver is hooked to today.</p></div></div>' +
      '<div class="card-body dv-slots">' + slotHtml('truck') + '<div class="dv-hitch' + (both ? ' on' : '') + '"><i></i></div>' + slotHtml('trailer') + '</div></div>';
  }
  function hosCard(){
    var rings = HOS.map(function(h){
      var f = h.mins / h.lim, col = f >= 0.4 ? '#10B981' : f >= 0.15 ? '#F59E0B' : '#EF4444';
      return '<div class="dv-hos" data-tip="' + esc(h.tip) + '"><div class="dv-ringbox">' + ring(f, col, h.t) + '</div><span>' + h.label + '</span></div>';
    }).join('');
    return '<div class="card"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">Hours of service</h2>' + badge('success', DRV.eldStatus) + '</div><p class="card-desc">Live from ' + esc(DRV.eld) + ' · time remaining.</p></div></div>' +
      '<div class="card-body"><div class="dv-hos-grid">' + rings + '</div></div>' +
      '<div class="card-foot"><span class="card-foot-note"><i data-lucide="clock"></i> Available tomorrow <b class="dv-b">45:15</b></span><div class="card-foot-actions"><button type="button" class="btn-outline" data-size="sm" data-act="recap"><i data-lucide="table-2"></i> 70-hour recap</button></div></div></div>';
  }
  function detailsCard(){
    var born = DV.fromYmd(DRV.birth), next = new Date(TODAY.getFullYear(), born.getMonth(), born.getDate()); if(next < TODAY) next.setFullYear(next.getFullYear() + 1);
    var dTo = DV.daysBetween(TODAY, next), age = next.getFullYear() - born.getFullYear();
    var yrs = Math.floor(DV.daysBetween(DV.fromYmd(DRV.hire), TODAY) / 365.25);
    var flags = DRV.flags.map(function(f){
      return '<span class="dv-flag ' + (f[1] ? 'yes' : 'no') + '"' + (f[2] ? ' data-tip="' + esc(f[2]) + '"' : '') + '><i data-lucide="' + (f[1] ? 'check' : 'minus') + '"></i>' + esc(f[0]) + '</span>';
    }).join('');
    return '<div class="card"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">People &amp; credentials</h2></div><p class="card-desc">Who they report to and what they hold.</p></div></div>' +
      '<div class="card-body"><ul class="kv dv-kv">' +
      '<li><span class="k">Manager</span><span class="v dv-mgr"><span class="av" data-size="sm" data-c="3">LG</span>' + esc(DRV.manager) + ' <em>ext. ' + DRV.ext + '</em></span></li>' +
      '<li><span class="k">Birthday</span><span class="v">' + mdy(born) + ' <em>turns ' + age + ' in ' + dTo + ' days</em></span></li>' +
      '<li><span class="k">Work anniversary</span><span class="v">' + mdy(DV.fromYmd(DRV.hire)) + ' <em>' + yrs + ' years</em></span></li>' +
      '<li><span class="k">ELD provider</span><span class="v">' + esc(DRV.eld) + '</span></li></ul>' +
      '<div class="dv-flags">' + flags + '</div></div></div>';
  }
  function locationCard(){
    return '<div class="card dv-loc"><div class="dv-map" aria-hidden="true">' +
      '<svg viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice"><rect width="300" height="150" fill="var(--page-bg)"/>' +
      '<path d="M-10 108 C 60 92 110 118 170 84 S 260 60 320 70" stroke="var(--border)" stroke-width="9" fill="none"/>' +
      '<path d="M-10 108 C 60 92 110 118 170 84 S 260 60 320 70" stroke="var(--surface)" stroke-width="5" fill="none" stroke-dasharray="9 7"/>' +
      '<path d="M120 -10 L 150 70 L 130 160" stroke="var(--border)" stroke-width="7" fill="none"/>' +
      '<path d="M205 -10 C 200 40 230 80 250 160" stroke="var(--border-soft)" stroke-width="12" fill="none"/>' +
      '<path d="M-10 30 L 320 22" stroke="var(--border-soft)" stroke-width="6" fill="none"/>' +
      '<g transform="translate(150 70)"><circle r="18" fill="var(--blue)" opacity=".14"/><circle r="9" fill="var(--blue)"/><circle r="3.6" fill="#fff"/></g></svg>' +
      '<span class="dv-map-shield">540</span></div>' +
      '<div class="card-body dv-loc-b"><div><small>Last location</small><h3>' + esc(DRV.city) + '</h3><p>Reported 4 min ago · ' + esc(DRV.eldStatus) + ' · I-581 N</p></div>' +
      '<button type="button" class="btn-outline" data-size="sm" data-act="locate"><i data-lucide="locate-fixed"></i> Track</button></div></div>';
  }
  function upcomingCard(){
    var list = (DV.upcoming ? DV.upcoming(4) : []);
    var rows = list.map(function(e){
      var d = DV.fromYmd(e.date), diff = DV.daysBetween(TODAY, d);
      var chip = diff < 0 ? badge('danger', Math.abs(diff) + (Math.abs(diff) === 1 ? ' day' : ' days') + ' overdue') : diff === 0 ? badge('info', 'Today') : badge('', 'in ' + diff + ' days');
      return '<li><span class="dv-date"><b>' + d.getDate() + '</b><small>' + DV.MON3[d.getMonth()] + '</small></span><span class="dv-up-t"><b>' + esc(e.title) + '</b><small>' + esc(DV.catName(e.cat)) + (e.time ? ' · ' + e.time : '') + '</small></span>' + chip + '</li>';
    }).join('');
    return '<div class="card"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">Coming up</h2></div><p class="card-desc">Expirations, appointments and events.</p></div>' +
      '<div class="card-head-actions"><button type="button" class="btn-outline" data-size="sm" data-act="to-events">Calendar</button></div></div>' +
      '<div class="card-body" style="padding-top:5px;padding-bottom:5px"><ul class="dv-upl">' + (rows || '<li class="dv-none">Nothing scheduled.</li>') + '</ul></div></div>';
  }
  function kpiCard(){
    var m = metrics(), p = period();
    var hero = [['Total revenue', $m(m.revenue, 0), 'trending-up', 'blue'], ['Driver earnings', $m(m.earnings), 'wallet', 'green'], ['Total miles', fmt(m.miles), 'route', 'neutral']].map(function(h){
      return '<div class="dv-hero ' + h[3] + '"><span class="dv-hero-ic"><i data-lucide="' + h[2] + '"></i></span><small>' + h[0] + '</small><b>' + h[1] + '</b></div>';
    }).join('');
    var small = [['Occupancy', m.occ + '%'], ['Loads', fmt(m.loads)], ['Miles per gallon', m.mpg], ['Avg fuel discount', $m(m.disc)], ['Avg fuel cost / gal', '$' + m.ppg.toFixed(2)], ['Total CPM', '$' + m.cpm]].map(function(s){
      return '<div class="dv-mini"><small>' + s[0] + '</small><b>' + s[1] + '</b></div>';
    }).join('');
    return '<div class="card"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">Performance</h2></div><p class="card-desc" id="accPeriodDesc">' + p[1] + '</p></div>' +
      '<div class="card-head-actions"><select class="select-input" id="accPeriod" aria-label="Period"></select></div></div>' +
      '<div class="card-body"><div class="dv-heros">' + hero + '</div><div class="dv-minis">' + small + '</div></div></div>';
  }
  function occCard(){
    var f = period()[2], shift = Math.round((1 - f) * 6);
    var parts = OCC.map(function(o, i){ return [o[0], i === 0 ? o[1] - shift : i === 4 ? o[1] + shift : o[1], o[2]]; });
    var m = metrics();
    var rows = parts.map(function(p){
      return '<li><span class="dv-occ-dot" style="background:' + p[2] + '"></span><span class="dv-occ-n">' + p[0] + '</span><span class="dv-occ-bar"><i style="width:' + p[1] + '%;background:' + p[2] + '"></i></span><b>' + p[1] + '%</b></li>';
    }).join('');
    return '<div class="card"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">Occupancy</h2></div><p class="card-desc">Where the driver’s days went · ' + period()[1] + '</p></div>' +
      '<div class="card-head-actions"><button type="button" class="btn-outline" data-size="sm" data-act="to-occ"><i data-lucide="calendar-range"></i> Open calendar</button></div></div>' +
      '<div class="card-body dv-occ">' + donut(parts, m.occ + '%', 'occupied') + '<ul class="dv-occ-l">' + rows + '</ul></div></div>';
  }
  function goalsCard(){
    var rows = GOALS.map(function(g){
      var max = Math.max(g.target, g.actual) * 1.08, aw = g.actual / max * 100, tw = g.target / max * 100;
      var diff = g.actual - g.target, good = diff >= 0;
      var dtxt = (good ? '+' : '−') + (g.k === 'Cent per mile' ? '$' + Math.abs(diff).toFixed(2) : g.k === 'Occupancy' ? Math.abs(diff) + ' pts' : g.k === 'Revenue' ? $m(Math.abs(diff)) : fmt(Math.abs(diff)));
      return '<li><div class="dv-goal-h"><span><i data-lucide="' + g.icon + '"></i>' + g.k + '</span><span class="dv-goal-n"><b>' + g.fmt(g.actual) + '</b> of ' + g.fmt(g.target) + '</span>' + badge(good ? 'success' : 'danger', dtxt) + '</div>' +
        '<div class="dv-bullet"><i class="a ' + (good ? 'good' : 'bad') + '" style="width:' + aw.toFixed(1) + '%"></i><i class="t" style="left:' + tw.toFixed(1) + '%"></i></div></li>';
    }).join('');
    return '<div class="card"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">Goals</h2></div><p class="card-desc">This month against target. The tick is the goal.</p></div></div><div class="card-body"><ul class="dv-goals">' + rows + '</ul></div></div>';
  }
  function statsCard(){
    var body = STATS.map(function(r){
      return '<tr><td><span class="cell-main">' + r[0] + '</span></td><td class="r">' + r[1] + '%</td><td class="r">' + fmt(r[2]) + '</td><td class="r">' + fmt(r[3]) + '</td><td class="r">' + fmt(r[4]) + '</td><td class="r">' + $m(r[5]) + '</td><td class="r">' + $m(r[6]) + '</td><td class="r"><b class="dv-b">' + $m(r[7]) + '</b></td><td class="r">$' + r[8].toFixed(2) + '/mi</td></tr>';
    }).join('');
    return '<div class="card"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">Statistics</h2></div><p class="card-desc">Mileage and revenue by period.</p></div></div>' +
      '<div class="card-body" style="padding:0"><div class="data-grid-scroll"><table class="pay-table dense"><thead><tr><th>Period</th><th class="r">DH %</th><th class="r">DH miles</th><th class="r">Loaded miles</th><th class="r">Total miles</th><th class="r">Fuel surcharge</th><th class="r">Linehaul</th><th class="r">Total gross</th><th class="r">CPM</th></tr></thead><tbody>' + body + '</tbody></table></div></div></div>';
  }

  DV.renderAccount = function(){
    var host = Q('#pAccount');
    host.innerHTML = '<div class="dv-acc"><div class="dv-row3"><div class="dv-col">' + identityCard() + locationCard() + '</div><div class="dv-col">' + equipCard() + detailsCard() + '</div><div class="dv-col">' + hosCard() + upcomingCard() + '</div></div>' +
      kpiCard() + '<div class="grid-2">' + occCard() + goalsCard() + '</div>' + statsCard() + '</div>';
    var sel = Q('#accPeriod'); DV.opts(sel, PERIODS.map(function(p){ return [p[0], p[1]]; }), DV.st.period);
    on(sel, 'change', function(){ DV.st.period = sel.value; DV.renderAccount(); });
    icons();
  };
  DV.renderers.account = function(){};

  /* ================================================================
     CLICKS on the Account tab
     ================================================================ */
  on(Q('#pAccount'), 'click', function(e){
    var cp = e.target.closest('[data-copy]');
    if(cp){ try{ navigator.clipboard.writeText(cp.getAttribute('data-copy')); }catch(x){} toast('success', 'Copied', cp.getAttribute('data-copy')); return; }
    var a = e.target.closest('[data-act]'); if(!a) return;
    var act = a.getAttribute('data-act');
    if(act === 'assign-trailer') openAttach();
    else if(act === 'swap-trailer') openSwap();
    else if(act === 'assign-truck') openTruck(false);
    else if(act === 'swap-truck') openTruck(true);
    else if(act === 'recap') openRecap();
    else if(act === 'locate') toast('success', 'Tracking', 'Live tracking opens in the map module.');
    else if(act === 'to-events') DV.go('events');
    else if(act === 'to-occ') DV.go('occupancy');
  });

  /* ================================================================
     TRAILER / TRUCK DIALOGS
     ================================================================ */
  function trailerOptions(exclude){
    return DV.TRAILERS.filter(function(t){ return t.id !== exclude; }).map(function(t){
      return {id:t.id, label:t.id, sub:t.loc, icon:'container', disabled:t.st === 'assigned',
        badge:t.st === 'assigned' ? ['warning', 'On ' + t.by] : t.svc ? ['warning', 'Service due'] : ['success', 'Available']};
    });
  }
  function truckOptions(exclude){
    return DV.TRUCKS.filter(function(t){ return t.id !== exclude; }).map(function(t){
      return {id:t.id, label:t.id, sub:t.make + ' ' + t.yr + ' · ' + t.loc, icon:'truck', disabled:t.st === 'assigned', badge:t.st === 'assigned' ? ['warning', 'On ' + t.by] : ['success', 'Available']};
    });
  }
  var pAttach, pSwap, pTruck, addKind = 'trailer', addTarget = null, pendingAssign = null;
  function me(){ return 'Christian Snead'; }

  /* attach a trailer */
  function openAttach(){
    if(!pAttach){ pAttach = DV.picker(Q('#atTrailer'), {options:trailerOptions(), placeholder:'Select a trailer', searchHint:'Search trailers'}); }
    pAttach.setOptions(trailerOptions()); pAttach.set(null);
    Q('#atDate').value = ymd(TODAY); Q('#atNote').textContent = 'Created by ' + me();
    window.dpDialog.open('dlgAttach');
  }
  on(Q('#atPlus'), 'click', function(){ openAddUnit('trailer', pAttach); });
  on(Q('#atSave'), 'click', function(){
    var id = pAttach.get(); if(!id){ pAttach.invalid(); toast('error', 'Pick a trailer', 'Choose the trailer to attach.'); return; }
    window.dpDialog.close('dlgAttach');
    commitTrailer(id, Q('#atDate').value, null);
  });

  /* swap */
  function openSwap(){
    var cur = trailerOf();
    if(!pSwap){ pSwap = DV.picker(Q('#swNew'), {options:[], placeholder:'Select the new trailer', searchHint:'Search trailers'}); }
    pSwap.setOptions(trailerOptions(cur.id)); pSwap.set(null);
    Q('#swCur').innerHTML = '<span class="dv-slot-ic"><i data-lucide="container"></i></span><span class="dv-slot-t"><small>Current trailer</small><b>' + esc(cur.id) + '</b><span>' + esc(cur.type + ' · ' + cur.loc) + '</span></span>';
    DV.opts(Q('#swDrop'), [['Roanoke yard — 1007 Cherokee St NE', 'Roanoke yard — 1007 Cherokee St NE'], ['Lynchburg terminal — 1776 Constitution Way', 'Lynchburg terminal — 1776 Constitution Way'], ['Customer lot (live drop)', 'Customer lot (live drop)'], ['Shop — Valley Truck Repair', 'Shop — Valley Truck Repair']], 'Roanoke yard — 1007 Cherokee St NE');
    Q('#swCustomIn').hidden = true; Q('#swCustomIn').value = ''; Q('#swDropField').hidden = false; Q('#swCustom').textContent = 'Custom';
    Q('#swDate').value = ymd(TODAY);
    window.dpDialog.open('dlgSwap'); icons();
  }
  on(Q('#swCustom'), 'click', function(){
    var custom = Q('#swCustomIn').hidden;
    Q('#swCustomIn').hidden = !custom; Q('#swDropField').hidden = custom; Q('#swCustom').textContent = custom ? 'Pick from list' : 'Custom';
    if(custom) Q('#swCustomIn').focus();
  });
  on(Q('#swPlus'), 'click', function(){ openAddUnit('trailer', pSwap); });
  on(Q('#swSave'), 'click', function(){
    var id = pSwap.get(); if(!id){ pSwap.invalid(); toast('error', 'Pick a trailer', 'Choose the trailer to switch to.'); return; }
    var drop = Q('#swCustomIn').hidden ? Q('#swDrop').value : Q('#swCustomIn').value.trim();
    if(!drop){ window.dpValidate.showError(Q('#swCustomIn'), 'Type the drop location.'); return; }
    window.dpDialog.close('dlgSwap');
    commitTrailer(id, Q('#swDate').value, drop);
  });

  function commitTrailer(id, date, drop){
    var t = DV.TRAILERS.filter(function(x){ return x.id === id; })[0];
    if(t.svc){ pendingAssign = {id:id, date:date, drop:drop}; showWarn(t); return; }
    finishTrailer(id, date, drop);
  }
  function finishTrailer(id, date, drop){
    var prev = DV.st.trailer;
    if(prev){ var pt = DV.TRAILERS.filter(function(x){ return x.id === prev.id; })[0]; if(pt) pt.st = 'available'; }
    DV.TRAILERS.filter(function(x){ return x.id === id; })[0].st = 'assigned'; DV.TRAILERS.filter(function(x){ return x.id === id; })[0].by = 'William Falin';
    DV.st.trailer = {id:id, since:date || ymd(TODAY)};
    DV.renderAccount();
    toast('success', prev ? 'Trailer switched' : 'Trailer attached', prev ? prev.id + ' dropped' + (drop ? ' at ' + drop : '') + '; ' + id + ' assigned.' : id + ' is now hooked to ' + DRV.first + '.');
  }
  function showWarn(t){
    Q('#wnTitle').textContent = 'Trailer ' + t.id;
    Q('#wnRows').innerHTML = [['Services & repairs due', t.svc.due, ''], ['PM service due', t.svc.pm, t.svc.pm === 'Overdue' ? 'bad' : ''], ['Warranty expiration', t.svc.warranty, ''], ['Open repairs', t.svc.repairs, '']].map(function(r){
      return '<li><span class="k">' + r[0] + '</span><span class="v ' + r[2] + '">' + esc(r[1]) + '</span></li>';
    }).join('');
    window.dpDialog.open('dlgWarn');
  }
  on(Q('#wnOk'), 'click', function(){ window.dpDialog.close('dlgWarn'); if(pendingAssign){ finishTrailer(pendingAssign.id, pendingAssign.date, pendingAssign.drop); pendingAssign = null; } });
  on(Q('#wnBack'), 'click', function(){ window.dpDialog.close('dlgWarn'); pendingAssign = null; });

  /* truck */
  function openTruck(change){
    var cur = truckOf();
    if(!pTruck){ pTruck = DV.picker(Q('#tkTruck'), {options:[], placeholder:'Select a truck', searchHint:'Search trucks'}); }
    pTruck.setOptions(truckOptions(cur && cur.id)); pTruck.set(null);
    Q('#tkTitle').textContent = change ? 'Change truck' : 'Assign truck';
    Q('#tkDesc').textContent = change ? 'Move ' + DRV.first + ' to a different power unit.' : 'Pair ' + DRV.first + ' with a power unit.';
    Q('#tkCur').hidden = !change; if(change) Q('#tkCur').innerHTML = '<span class="dv-slot-ic"><i data-lucide="truck"></i></span><span class="dv-slot-t"><small>Current truck</small><b>' + esc(cur.id) + '</b><span>' + esc(cur.make + ' ' + cur.yr) + '</span></span>';
    Q('#tkDate').value = ymd(TODAY); Q('#tkNote').textContent = 'Created by ' + me();
    window.dpDialog.open('dlgTruck'); icons();
  }
  on(Q('#tkPlus'), 'click', function(){ openAddUnit('truck', pTruck); });
  on(Q('#tkSave'), 'click', function(){
    var id = pTruck.get(); if(!id){ pTruck.invalid(); toast('error', 'Pick a truck', 'Choose the truck to assign.'); return; }
    var prev = DV.st.truck; if(prev){ var pt = DV.TRUCKS.filter(function(x){ return x.id === prev.id; })[0]; if(pt) pt.st = 'available'; }
    var t = DV.TRUCKS.filter(function(x){ return x.id === id; })[0]; t.st = 'assigned'; t.by = 'William Falin';
    DV.st.truck = {id:id, since:Q('#tkDate').value || ymd(TODAY)};
    window.dpDialog.close('dlgTruck'); DV.renderAccount();
    toast('success', prev ? 'Truck changed' : 'Truck assigned', id + ' is now assigned to ' + DRV.first + '.');
  });

  /* add a unit on the fly (the "+" beside the pickers) */
  function openAddUnit(kind, target){
    addKind = kind; addTarget = target;
    Q('#auTitle').textContent = kind === 'trailer' ? 'Add trailer' : 'Add truck';
    Q('#auDesc').textContent = 'It will be available straight away and selected for you.';
    Q('#auId').value = ''; Q('#auType').value = kind === 'trailer' ? "53' dry van" : 'Kenworth'; Q('#auLoc').value = 'Roanoke, VA';
    Q('#auTypeLbl').textContent = kind === 'trailer' ? 'Trailer type' : 'Make';
    window.dpDialog.open('dlgAddUnit');
  }
  on(Q('#auSave'), 'click', function(){
    var id = Q('#auId').value.trim().toUpperCase();
    if(!id){ window.dpValidate.showError(Q('#auId'), 'Enter a unit number.'); return; }
    var list = addKind === 'trailer' ? DV.TRAILERS : DV.TRUCKS;
    if(list.some(function(t){ return t.id === id; })){ window.dpValidate.showError(Q('#auId'), id + ' already exists.'); return; }
    var u = addKind === 'trailer' ? {id:id, st:'available', type:Q('#auType').value, loc:Q('#auLoc').value} : {id:id, st:'available', make:Q('#auType').value, yr:2022, vin:'—', loc:Q('#auLoc').value};
    list.push(u); window.dpDialog.close('dlgAddUnit');
    if(addTarget){ addTarget.setOptions(addKind === 'trailer' ? trailerOptions(DV.st.trailer && addTarget === pSwap ? DV.st.trailer.id : null) : truckOptions(DV.st.truck && DV.st.truck.id)); addTarget.set(id); }
    toast('success', (addKind === 'trailer' ? 'Trailer' : 'Truck') + ' added', id + ' is ready to assign.');
  });

  /* ================================================================
     HOS RECAP
     ================================================================ */
  function openRecap(){
    var worked = [11, 8, 9, 10, 7, 9, 10], start = 70, rows = '';
    for(var i = 0; i < 7; i++){
      var d = new Date(TODAY); d.setDate(d.getDate() - (7 - i));
      rows += '<tr><td><span class="cell-main">' + mdy(d) + '</span></td><td><span class="dv-day">' + (i + 1) + '</span></td><td class="r"><span class="dv-pill-n">—</span></td><td class="r">' + start + '</td>' +
        '<td><span class="dv-wbar"><i style="width:' + (worked[i] / 14 * 100).toFixed(0) + '%"></i></span></td><td class="r"><b class="dv-b">' + worked[i] + ' h</b></td></tr>';
      start -= worked[i];
    }
    rows += '<tr class="dv-today"><td><span class="cell-main">' + mdy(TODAY) + '</span> ' + badge('info', 'Today') + '</td><td><span class="dv-day">8</span></td><td class="r"><span class="dv-pill-n">—</span></td><td class="r">' + start + '</td><td colspan="2" class="r"><span class="muted">In progress</span></td></tr>';
    var t1 = new Date(TODAY); t1.setDate(t1.getDate() + 1);
    rows += '<tr><td><span class="cell-main">Tomorrow</span> <span class="muted">' + mdy(t1) + '</span></td><td><span class="dv-day">9</span></td><td class="r"><span class="dv-recap">+11</span></td><td class="r">' + (start + 11) + '</td><td><span class="dv-wbar plan"><i style="width:' + (8.5 / 14 * 100).toFixed(0) + '%"></i></span></td><td class="r"><span class="muted">8.5 h planned</span></td></tr>';
    rows += '<tr><td><span class="cell-main">Tomorrow midnight</span></td><td><span class="dv-day">10</span></td><td class="r"><span class="dv-recap">+8</span></td><td class="r">' + (start + 19 - 8.5) + '</td><td><span class="dv-wbar plan"><i style="width:' + (10 / 14 * 100).toFixed(0) + '%"></i></span></td><td class="r"><span class="muted">10 h planned</span></td></tr>';
    Q('#rcBody').innerHTML = '<div class="data-grid-scroll"><table class="pay-table dense dv-recap-t"><thead><tr><th>Date</th><th>Day</th><th class="r"><span class="th-in" data-tip="Hours added back to your clock at midnight — what you worked on this day last week.">Recapped <i data-lucide="info"></i></span></th><th class="r">Hours at shift start</th><th colspan="2"><span class="th-in" data-tip="Hours worked are on-duty and driving hours combined.">Hours worked <i data-lucide="info"></i></span></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    window.dpDialog.open('dlgRecap'); icons();
  }
})();
