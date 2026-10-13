(function(){
  'use strict';
  var DV = window.DV, Q = DV.Q, QA = DV.QA, esc = DV.esc, on = DV.on, icons = DV.icons, toast = DV.toast, badge = DV.badge, $m = DV.$m, DRV = DV.DRV, TODAY = DV.TODAY, pad = DV.pad, fmt = DV.fmt, ymd = DV.ymd;

  /* ================================================================
     MAP DRAWING — real USA map, per-state fill / label / tooltip
     ================================================================ */
  var NAME = {};
  DV.drawMap = function(el, o){
    var M = window.US_MAP, s = '<svg viewBox="' + M.viewBox + '" role="img" aria-label="Map of the United States" preserveAspectRatio="xMidYMid meet">';
    M.locations.forEach(function(l){
      var ab = l.id.toUpperCase(), f = o.fill(ab); NAME[ab] = l.name;
      s += '<path d="' + l.path + '" data-s="' + ab + '" class="dv-st' + (f.cls ? ' ' + f.cls : '') + '" style="fill:' + f.color + '" data-tip="' + esc(o.tip ? o.tip(ab) : l.name) + '"></path>';
    });
    s += '<g class="dv-labels" pointer-events="none"></g></svg>';
    el.innerHTML = s;
    var g = Q('.dv-labels', el), out = '';
    QA('path.dv-st', el).forEach(function(p){
      var ab = p.getAttribute('data-s'), b = p.getBBox(), cx = b.x + b.width / 2, cy = b.y + b.height / 2, f = o.fill(ab);
      if(ab === 'FL') cx += 14; if(ab === 'LA') cx -= 8; if(ab === 'MI') cx += 10; if(ab === 'CA') cx -= 6;
      var col = f.light ? '#fff' : 'var(--text-heading)', sub = o.label ? o.label(ab) : '';
      if(b.width > 34 && b.height > 22){
        out += '<text x="' + cx + '" y="' + (cy + (sub && b.width > 60 && b.height > 36 ? -1 : 4)) + '" text-anchor="middle" font-size="13" font-weight="700" fill="' + col + '">' + ab + '</text>';
        if(sub && b.width > 60 && b.height > 36) out += '<text x="' + cx + '" y="' + (cy + 13) + '" text-anchor="middle" font-size="10.5" font-weight="500" fill="' + col + '" opacity=".9">' + esc(sub) + '</text>';
      }
    });
    g.innerHTML = out;
    el._dvClick = o.onClick;
    if(o.onClick && !el._dvBound){ el._dvBound = 1; on(el, 'click', function(e){ var p = e.target.closest('path.dv-st'); if(p && el._dvClick) el._dvClick(p.getAttribute('data-s')); }); }
  };

  /* ================================================================
     STATE MAP — where the driver may run
     ================================================================ */
  var REGIONS = [
    ['Southwest', ['AZ', 'NM', 'OK', 'TX']], ['West', ['CA', 'CO', 'ID', 'MT', 'NV', 'OR', 'UT', 'WA', 'WY', 'AK', 'HI']],
    ['Midwest', ['IL', 'IN', 'IA', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'SD', 'WI']], ['Southeast', ['AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA', 'WV']],
    ['Northeast', ['CT', 'DE', 'DC', 'ME', 'MD', 'MA', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT']]
  ];
  var SM = {st:{}, brush:1, open:{Southwest:true, West:true}, saved:null};
  ['AZ', 'NM', 'OK', 'TX', 'CA', 'CO', 'ID', 'MT', 'NV', 'OR', 'UT', 'WA', 'KS', 'MO', 'AR', 'LA'].forEach(function(a){ SM.st[a] = 1; });
  ['WY', 'IL', 'IN'].forEach(function(a){ SM.st[a] = -1; });
  SM.saved = JSON.stringify(SM.st);
  function smFill(ab){ var v = SM.st[ab]; return v === 1 ? {color:'var(--blue)', light:true, cls:'on'} : v === -1 ? {color:'#EF4444', light:true, cls:'no'} : {color:'var(--border)', light:false, cls:''}; }
  function counts(){ var a = 0, r = 0; Object.keys(SM.st).forEach(function(k){ if(SM.st[k] === 1) a++; else if(SM.st[k] === -1) r++; }); return {a:a, r:r, n:51 - a - r}; }
  function regionState(list){
    var a = list.filter(function(x){ return SM.st[x] === 1; }).length, r = list.filter(function(x){ return SM.st[x] === -1; }).length;
    return a === list.length ? 'all' : a || r ? 'some' : 'none';
  }
  function paintSM(){
    DV.drawMap(Q('#smMap'), {fill:smFill, tip:function(ab){ var v = SM.st[ab]; return NAME[ab] + ' · ' + (v === 1 ? 'Allowed' : v === -1 ? 'Restricted' : 'Not set'); }, onClick:function(ab){ SM.st[ab] = SM.brush === 0 ? 0 : (SM.st[ab] === SM.brush ? 0 : SM.brush); if(SM.brush === 0) delete SM.st[ab]; paintSM(); }});
    var c = counts();
    Q('#smSum').innerHTML = '<span><i style="background:var(--blue)"></i><b>' + c.a + '</b> allowed</span><span><i style="background:#EF4444"></i><b>' + c.r + '</b> restricted</span><span><i style="background:var(--border)"></i><b>' + c.n + '</b> not set</span>';
    Q('#smRegions').innerHTML = REGIONS.map(function(r){
      var st = regionState(r[1]), open = !!SM.open[r[0]], n = r[1].filter(function(x){ return SM.st[x] === 1; }).length;
      return '<div class="dv-rg' + (open ? ' open' : '') + '"><div class="dv-rg-h"><button type="button" class="dv-rg-cb ' + st + '" data-rc="' + r[0] + '" aria-label="Toggle ' + r[0] + '" role="checkbox" aria-checked="' + (st === 'all' ? 'true' : st === 'some' ? 'mixed' : 'false') + '"><i data-lucide="' + (st === 'all' ? 'check' : st === 'some' ? 'minus' : 'check') + '"></i></button><button type="button" class="dv-rg-t" data-ro="' + r[0] + '"><b>' + r[0] + '</b><small>' + n + ' of ' + r[1].length + ' allowed</small><i data-lucide="chevron-down"></i></button></div>' +
        (open ? '<ul class="dv-rg-l">' + r[1].slice().sort(function(a, b){ return DV.stateName(a).localeCompare(DV.stateName(b)); }).map(function(ab){ var v = SM.st[ab]; return '<li><button type="button" class="dv-sr ' + (v === 1 ? 'on' : v === -1 ? 'no' : '') + '" data-sr="' + ab + '"><span class="dv-sr-b"><i data-lucide="' + (v === -1 ? 'x' : 'check') + '"></i></span><span>' + esc(DV.stateName(ab)) + '</span><em>' + ab + '</em></button></li>'; }).join('') + '</ul>' : '') + '</div>';
    }).join('');
    icons();
    var dirty = JSON.stringify(SM.st) !== SM.saved; Q('#smSave').disabled = !dirty; Q('#smReset').disabled = !dirty;
  }
  DV.renderers.statemap = function(){
    Q('#pStatemap').innerHTML = '<div class="dv-sm-l"><div class="card"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">Operating states</h2></div><p class="card-desc">Pick a brush, then paint the map. Dispatch only offers loads inside allowed states.</p></div>' +
      '<div class="card-head-actions"><div class="segmented" id="smBrush"><button type="button" class="active" data-b="1"><i data-lucide="check"></i> Allow</button><button type="button" data-b="-1"><i data-lucide="ban"></i> Restrict</button><button type="button" data-b="0"><i data-lucide="eraser"></i> Clear</button></div></div></div>' +
      '<div class="card-body"><div class="dv-mapbox" id="smMap"></div><div class="dv-legend" id="smSum"></div></div>' +
      '<div class="card-foot"><span class="card-foot-note"><i data-lucide="info"></i> Click a state, or use the region list.</span><div class="card-foot-actions"><button type="button" class="btn-outline" data-size="sm" id="smReset">Reset</button><button type="button" class="btn-primary" data-size="sm" id="smSave">Save changes</button></div></div></div>' +
      '<aside class="card"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">Regions</h2></div><p class="card-desc">Toggle a whole region, or open it for single states.</p></div></div><div class="card-body" style="padding:8.75px 12.5px" id="smRegions"></div></aside></div>';
    paintSM();
    on(Q('#smBrush'), 'click', function(e){ var b = e.target.closest('button[data-b]'); if(!b) return; SM.brush = +b.getAttribute('data-b'); QA('#smBrush button').forEach(function(x){ x.classList.toggle('active', x === b); }); });
    on(Q('#smRegions'), 'click', function(e){
      var rc = e.target.closest('[data-rc]'); if(rc){ var r = REGIONS.filter(function(x){ return x[0] === rc.getAttribute('data-rc'); })[0], all = regionState(r[1]) === 'all'; r[1].forEach(function(ab){ if(all) delete SM.st[ab]; else SM.st[ab] = 1; }); paintSM(); return; }
      var ro = e.target.closest('[data-ro]'); if(ro){ SM.open[ro.getAttribute('data-ro')] = !SM.open[ro.getAttribute('data-ro')]; paintSM(); return; }
      var sr = e.target.closest('[data-sr]'); if(sr){ var ab = sr.getAttribute('data-sr'), v = SM.st[ab]; if(v === 1) SM.st[ab] = -1; else if(v === -1) delete SM.st[ab]; else SM.st[ab] = 1; paintSM(); }
    });
    on(Q('#smSave'), 'click', function(){ SM.saved = JSON.stringify(SM.st); var c = counts(); paintSM(); toast('success', 'Operating states saved', c.a + ' allowed, ' + c.r + ' restricted.'); });
    on(Q('#smReset'), 'click', function(){ SM.st = JSON.parse(SM.saved); paintSM(); });
  };

  /* ================================================================
     MILEAGE & RATES
     ================================================================ */
  var METRICS = [
    {k:'dh', n:'Deadhead mileage by state', u:'mi', lo:800, hi:48000, avg:false}, {k:'ld', n:'Loaded mileage by state', u:'mi', lo:4000, hi:180000, avg:false},
    {k:'fuel', n:'Fuel cost', u:'$', lo:3000, hi:120000, avg:false}, {k:'ppg', n:'Fuel cost per gallon', u:'$2', lo:3.8, hi:5.4, avg:true},
    {k:'toll', n:'Toll cost', u:'$', lo:0, hi:9000, avg:false, zero:0.35}, {k:'icpm', n:'Inbound CPM', u:'$2', lo:1.9, hi:3.6, avg:true},
    {k:'ocpm', n:'Outbound CPM', u:'$2', lo:1.9, hi:3.6, avg:true}, {k:'igr', n:'Inbound gross revenue', u:'$', lo:5000, hi:300000, avg:false}, {k:'ogr', n:'Outbound gross revenue', u:'$', lo:5000, hi:300000, avg:false}
  ];
  var MET = {}; METRICS.forEach(function(m){ MET[m.k] = m; });
  var ML = {view:'map', metric:'igr', show:'total', complete:true, from:'2023-01-01', to:'2023-05-16', cols:['igr'], print:[]};
  function mval(k, ab){
    var m = MET[k], f = ML.complete ? 1 : 0.35 + DV.hash(ML.from + ML.to) % 60 / 100;
    var r = DV.seed(DV.hash(k + ab)); if(m.zero && r < m.zero) return 0;
    var v = m.lo + (m.hi - m.lo) * Math.pow(DV.seed(DV.hash(ab + k + 'x')), 1.6);
    return m.avg ? v : Math.round(v * f);
  }
  function mfmt(k, v){ var u = MET[k].u; return u === '$' ? $m(v, 0) : u === '$2' ? '$' + v.toFixed(2) : fmt(v) + ' mi'; }
  function mshort(k, v){ var u = MET[k].u; if(u === '$2') return '$' + v.toFixed(2); var s = v >= 1000 ? (v / 1000).toFixed(v >= 100000 ? 0 : 1) + 'k' : String(v); return u === '$' ? '$' + s : s; }
  function stateRows(k){
    var rows = DV.STATES.map(function(s){ return {ab:s[0], name:s[1], v:mval(k, s[0])}; }), sorted = rows.slice().sort(function(a, b){ return b.v - a.v; }), total = rows.reduce(function(a, r){ return a + r.v; }, 0);
    sorted.forEach(function(r, i){ r.rank = i + 1; r.pct = total ? r.v / total * 100 : 0; });
    rows.total = total; rows.max = sorted[0].v; return rows;
  }
  var SCALE = ['#DBEAFE', '#93C5FD', '#3B82F6', '#1D4ED8', '#1E3A8A'];
  function bucket(r, rows){ return Math.min(4, Math.floor((rows.length - r.rank) / rows.length * 5)); }
  function drawChoro(el, k, small){
    var rows = stateRows(k), by = {}; rows.forEach(function(r){ by[r.ab] = r; });
    DV.drawMap(el, {fill:function(ab){ var r = by[ab]; if(!r) return {color:'var(--border)'}; var b = bucket(r, rows); return {color:SCALE[b], light:b >= 2}; },
      tip:function(ab){ var r = by[ab]; return r ? r.name + ' · ' + mfmt(k, r.v) + ' · rank ' + r.rank + ' · ' + r.pct.toFixed(1) + '%' : ab; },
      label:small ? null : function(ab){ var r = by[ab]; return r ? (ML.show === 'rank' ? '#' + r.rank : ML.show === 'pct' ? r.pct.toFixed(1) + '%' : mshort(k, r.v)) : ''; }});
  }
  function paramsCard(){
    return '<aside class="card dv-params"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">Search parameters</h2></div><p class="card-desc">What the map shows.</p></div></div><div class="card-body">' +
      '<label class="dv-check" style="margin-bottom:12.5px"><input type="checkbox" class="row-checkbox" id="mlComplete"' + (ML.complete ? ' checked' : '') + '><span>Complete history</span></label>' +
      '<div class="dialog-row" style="margin-bottom:16.25px">' + DV.inp('mlFrom', 'Period start', false, 'date') + DV.inp('mlTo', 'Period end', false, 'date') + '</div>' +
      '<div class="field"><label class="field-label">Show</label><div class="segmented" id="mlShow" style="width:100%"><button type="button" class="active" data-s="total" style="flex:1">Total</button><button type="button" data-s="pct" style="flex:1">Percentage</button><button type="button" data-s="rank" style="flex:1">Rank</button></div></div>' +
      '<div class="field" style="margin-bottom:0"><label class="field-label">Measure</label><div class="dv-meas" id="mlMeasure" role="radiogroup">' + METRICS.map(function(m){ return '<button type="button" class="dv-ms' + (ML.metric === m.k ? ' on' : '') + '" role="radio" aria-checked="' + (ML.metric === m.k) + '" data-m="' + m.k + '"><span class="dv-ms-r"></span><span>' + m.n + '</span></button>'; }).join('') + '</div></div></div>' +
      '<div class="card-foot"><div class="card-foot-actions" style="margin-left:auto"><button type="button" class="btn-outline" data-size="sm" id="mlPrint"><i data-lucide="printer"></i> Print details</button><button type="button" class="btn-primary" data-size="sm" id="mlDetails"><i data-lucide="table-2"></i> View details</button></div></div></aside>';
  }
  function paintML(){
    var k = ML.metric, host = Q('#mlMain');
    if(ML.view === 'map'){
      host.innerHTML = '<div class="dv-ml"><div class="card"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">' + MET[k].n + '</h2></div><p class="card-desc" id="mlDesc"></p></div><div class="card-head-actions"><div class="dv-ramp"><span>Low</span>' + SCALE.map(function(c){ return '<i style="background:' + c + '"></i>'; }).join('') + '<span>High</span></div></div></div><div class="card-body"><div class="dv-mapbox tall" id="mlMap"></div></div></div>' + paramsCard() + '</div>';
      drawChoro(Q('#mlMap'), k, false);
      var rows = stateRows(k); Q('#mlDesc').textContent = (ML.complete ? 'Complete history' : DV.nice(ML.from) + ' – ' + DV.nice(ML.to)) + ' · ' + (MET[k].avg ? 'average ' + mfmt(k, rows.total / 51) : 'total ' + mfmt(k, rows.total));
      Q('#mlFrom').value = ML.from; Q('#mlTo').value = ML.to; Q('#mlFrom').disabled = Q('#mlTo').disabled = ML.complete;
      QA('#mlShow button').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-s') === ML.show); });
      on(Q('#mlComplete'), 'change', function(e){ ML.complete = e.target.checked; paintML(); });
      on(Q('#mlFrom'), 'change', function(e){ ML.from = e.target.value; paintML(); }); on(Q('#mlTo'), 'change', function(e){ ML.to = e.target.value; paintML(); });
      on(Q('#mlShow'), 'click', function(e){ var b = e.target.closest('button[data-s]'); if(!b) return; ML.show = b.getAttribute('data-s'); paintML(); });
      on(Q('#mlMeasure'), 'click', function(e){ var b = e.target.closest('[data-m]'); if(!b) return; ML.metric = b.getAttribute('data-m'); ML.cols = [ML.metric]; paintML(); });
      on(Q('#mlPrint'), 'click', function(){ openPrint([ML.metric]); }); on(Q('#mlDetails'), 'click', function(){ ML.view = 'table'; paintML(); });
    } else {
      var cols = ML.cols.length ? ML.cols : [ML.metric], base = stateRows(cols[0]);
      host.innerHTML = '<div class="dv-ml dv-ml-t"><div class="card"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">' + MET[k].n + '</h2></div><p class="card-desc">Darker is higher.</p></div></div><div class="card-body"><div class="dv-mapbox" id="mlMap"></div></div></div>' +
        '<div class="card"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">State details</h2><span class="badge">51</span></div><p class="card-desc">Ranked by ' + MET[cols[0]].n.toLowerCase() + '.</p></div>' +
        '<div class="card-head-actions"><button type="button" class="btn-outline" data-size="sm" id="mlCols"><i data-lucide="columns-3"></i> Measures <span class="badge">' + cols.length + '</span></button><button type="button" class="btn-outline" data-size="sm" id="mlBack"><i data-lucide="map"></i> Map</button><button type="button" class="btn-primary" data-size="sm" id="mlPrint2"><i data-lucide="printer"></i> Print</button></div></div>' +
        '<div class="card-body" style="padding:0"><div class="data-grid-scroll dv-tscroll">' + detailTable(cols, base) + '</div></div></div></div>';
      drawChoro(Q('#mlMap'), k, true);
      on(Q('#mlBack'), 'click', function(){ ML.view = 'map'; paintML(); });
      on(Q('#mlPrint2'), 'click', function(){ openPrint(cols); });
      on(Q('#mlCols'), 'click', function(e){ openCols(e.currentTarget); });
    }
    icons();
  }
  function detailTable(cols, base){
    var data = {}; cols.forEach(function(c){ data[c] = stateRows(c); });
    var head = '<tr><th>State</th><th class="r">Rank</th>' + cols.map(function(c){ return '<th class="r">' + MET[c].n + '</th>'; }).join('') + '<th class="r">Share</th></tr>';
    var body = base.slice().sort(function(a, b){ return a.rank - b.rank; }).map(function(r){
      return '<tr><td><span class="cell-main">' + esc(r.name) + '</span></td><td class="r"><span class="dv-day">' + r.rank + '</span></td>' + cols.map(function(c){ var x = data[c].filter(function(q){ return q.ab === r.ab; })[0]; return '<td class="r">' + mfmt(c, x.v) + '</td>'; }).join('') + '<td class="r"><span class="dv-share"><i style="width:' + Math.min(100, r.pct * 5) + '%"></i></span>' + r.pct.toFixed(1) + '%</td></tr>';
    }).join('');
    var tot = '<tr class="dv-total"><td colspan="2"><b class="dv-b">Total</b></td>' + cols.map(function(c){ return '<td class="r"><b class="dv-b">' + (MET[c].avg ? 'avg ' : '') + mfmt(c, MET[c].avg ? data[c].total / 51 : data[c].total) + '</b></td>'; }).join('') + '<td class="r"><b class="dv-b">100%</b></td></tr>';
    return '<table class="pay-table dense"><thead>' + head + '</thead><tbody>' + body + tot + '</tbody></table>';
  }
  /* measures popover (multi-select) */
  function openCols(anchor){
    var el = Q('#mlPop'); if(el) el.remove();
    var pick = ML.cols.slice();
    el = document.createElement('div'); el.id = 'mlPop'; el.className = 'menu dv-pop';
    el.innerHTML = '<div class="dv-pop-h"><b>Select measures</b><small>Choose one or more columns</small></div><div class="dv-pop-l">' + METRICS.map(function(m){ return '<label class="dv-check"><input type="checkbox" class="row-checkbox" value="' + m.k + '"' + (pick.indexOf(m.k) > -1 ? ' checked' : '') + '><span>' + m.n + '</span></label>'; }).join('') + '</div><div class="dv-pop-f"><button type="button" class="btn-outline" data-size="sm" data-x>Cancel</button><button type="button" class="btn-primary" data-size="sm" data-ok>Filter selected</button></div>';
    document.body.appendChild(el); window.dpPlace(el, anchor, 'right');
    function close(){ el.remove(); document.removeEventListener('mousedown', away, true); }
    function away(e){ if(!el.contains(e.target) && !anchor.contains(e.target)) close(); }
    document.addEventListener('mousedown', away, true);
    on(Q('[data-x]', el), 'click', close);
    on(Q('[data-ok]', el), 'click', function(){ var v = QA('input:checked', el).map(function(i){ return i.value; }); if(!v.length){ toast('error', 'Pick a measure', 'Select at least one column.'); return; } ML.cols = v; ML.metric = v[0]; close(); openPrint(v); });
  }
  function openPrint(cols){
    ML.print = cols.slice();
    var base = stateRows(cols[0]);
    DV.showScreen('print', {title:'Mileage & rates', sub:'Print preview · ' + esc(DRV.first) + ' ' + esc(DRV.last), chip:cols.length + (cols.length === 1 ? ' measure' : ' measures'), actions:'<button type="button" class="btn-primary" data-size="sm" id="prGo"><i data-lucide="printer"></i> Print</button>', back:function(){ DV.showScreen('main'); }});
    Q('#dvScrPrint').innerHTML = '<div class="card dv-printcard"><div class="dv-pr-h"><div><small>Filters</small><b>' + cols.map(function(c){ return MET[c].n; }).join(', ') + '</b></div><div><small>Period</small><b>' + (ML.complete ? 'Complete history' : DV.nice(ML.from) + ' – ' + DV.nice(ML.to)) + '</b></div><div><small>Driver</small><b>' + esc(DRV.first + ' ' + DRV.last) + '</b></div></div><div class="card-body" style="padding:0"><div class="data-grid-scroll">' + detailTable(cols, base) + '</div></div></div>';
    on(Q('#prGo'), 'click', function(){ toast('success', 'Sending to the printer', 'Use your browser’s print dialog.'); setTimeout(function(){ window.print(); }, 250); });
    icons();
  }
  DV.renderers.mileage = function(){
    Q('#pMileage').innerHTML = '<div id="mlMain"></div>'; paintML();
  };
})();
