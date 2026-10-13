(function(){
  'use strict';
  var DV = window.DV, Q = DV.Q, QA = DV.QA, esc = DV.esc, on = DV.on, icons = DV.icons, toast = DV.toast, badge = DV.badge, $m = DV.$m, DRV = DV.DRV, TODAY = DV.TODAY, pad = DV.pad, fmt = DV.fmt, ymd = DV.ymd;

  /* ================================================================
     LEAVE
     ================================================================ */
  var LV = {
    types:[{k:'Vacation', allow:10, used:3, c:'#2E7DF7'}, {k:'Sick', allow:6, used:1, c:'#10B981'}, {k:'Personal', allow:3, used:2, c:'#7C3AED'}, {k:'Bereavement', allow:3, used:0, c:'#475569'}, {k:'Jury duty', allow:5, used:0, c:'#D97706'}],
    recs:[{id:'l1', from:'2023-05-13', to:'2023-05-14', type:'Personal', paid:'Unpaid', dur:'Full day', days:2, status:'Approved', note:'Family weekend'}, {id:'l2', from:'2023-05-06', to:'2023-05-07', type:'Personal', paid:'Unpaid', dur:'Full day', days:2, status:'Approved', note:''}],
    next:[], sub:'leaves', m:4, y:2023, pick:{from:'', to:''}
  };
  var HOLIDAYS = [['New Year’s Day', '2023-01-02'], ['Martin Luther King Jr. Day', '2023-01-16'], ['Presidents’ Day', '2023-02-20'], ['Memorial Day', '2023-05-29'], ['Juneteenth', '2023-06-19'], ['Independence Day', '2023-07-04'], ['Labor Day', '2023-09-04'], ['Thanksgiving', '2023-11-23'], ['Christmas Day', '2023-12-25']];
  var HOME = [{from:'2023-05-26', to:'2023-05-29', note:'Memorial Day weekend', status:'Approved'}, {from:'2023-03-10', to:'2023-03-13', note:'Anniversary trip', status:'Completed'}];

  function leaveDays(from, to, dur, hrs){
    if(!from || !to) return 0; var n = DV.daysBetween(DV.fromYmd(from), DV.fromYmd(to)) + 1; if(n < 1) return 0;
    if(dur === 'Half day (AM)' || dur === 'Half day (PM)') return 0.5 * n; if(dur === 'Hours') return Math.round((hrs || 4) / 8 * 100) / 100 * n; return n;
  }
  function rangeText(a, b){ var x = DV.fromYmd(a), y = DV.fromYmd(b); return a === b ? DV.nice(x) : DV.MON3[x.getMonth()] + ' ' + x.getDate() + (x.getMonth() !== y.getMonth() ? ' ' + DV.MON3[y.getMonth()] : '') + ' – ' + y.getDate() + ', ' + y.getFullYear(); }
  function balance(t){ var used = t.used + LV.next.filter(function(r){ return r.type === t.k && r.status !== 'Cancelled'; }).reduce(function(a, r){ return a + r.days; }, 0); return {used:used, avail:t.allow - used}; }
  function subnav(){
    var items = [['leaves', 'Leaves', 'clock-9'], ['holidays', 'Holidays', 'building-2'], ['home', 'Home time', 'house'], ['history', 'Time off', 'timer'], ['allow', 'Allowance', 'sliders-horizontal']];
    return '<div class="dv-subnav" id="lvNav">' + items.map(function(i){ return '<button type="button" class="' + (LV.sub === i[0] ? 'active' : '') + '" data-s="' + i[0] + '"><i data-lucide="' + i[2] + '"></i> ' + i[1] + '</button>'; }).join('') + '</div>';
  }
  function strip(){
    var y = LV.y, m = LV.m, last = new Date(y, m + 1, 0).getDate(), cells = '', f = LV.pick.from, t = LV.pick.to || LV.pick.from;
    var booked = {}; LV.next.concat(LV.recs).forEach(function(r){ if(r.status === 'Cancelled') return; for(var d = DV.fromYmd(r.from); d <= DV.fromYmd(r.to); d.setDate(d.getDate() + 1)) booked[ymd(d)] = r.type; });
    for(var d = 1; d <= last; d++){
      var dt = new Date(y, m, d), k = ymd(dt), dow = dt.getDay(), inR = f && k >= f && k <= (t || f), past = dt < TODAY;
      cells += '<button type="button" class="dv-sd' + (dow === 0 || dow === 6 ? ' we' : '') + (inR ? ' in' : '') + (k === f ? ' start' : '') + (k === t ? ' end' : '') + (booked[k] ? ' bk' : '') + (+dt === +TODAY ? ' today' : '') + '" data-d="' + k + '"' + (past ? ' disabled' : '') + (booked[k] ? ' data-tip="' + booked[k] + ' leave"' : '') + '><small>' + DV.DOW3[dow] + '</small><b>' + pad(d) + '</b></button>';
    }
    return '<div class="card" style="margin-top:17.5px"><div class="card-head"><div class="card-head-text"><div class="dv-cal-nav"><button type="button" class="dv-back" id="lvPrev" aria-label="Previous month"><i data-lucide="chevron-left"></i></button><h2 class="card-title">' + DV.MONTHS[m] + ' ' + y + '</h2><button type="button" class="dv-back" id="lvNext" aria-label="Next month"><i data-lucide="chevron-right"></i></button></div></div><div class="card-head-actions"><span class="muted dv-hint">Click a start day, then an end day to fill the form.</span></div></div><div class="card-body"><div class="dv-strip" id="lvStrip" style="--n:' + last + '">' + cells + '</div></div></div>';
  }
  function nextList(){
    var list = LV.next.filter(function(r){ return r.status !== 'Cancelled'; });
    if(!list.length) return '<div class="empty-state" style="padding-top:30px;padding-bottom:30px"><div class="empty-icon"><i data-lucide="palmtree"></i></div><h3 class="empty-title">No leave booked</h3><p>Upcoming leave appears here once it is booked.</p></div>';
    return '<ul class="dv-nl">' + list.map(function(r){
      var t = LV.types.filter(function(x){ return x.k === r.type; })[0];
      return '<li><span class="dv-nl-i" style="--c:' + t.c + '"><i data-lucide="palmtree"></i></span><span class="dv-nl-t"><b>' + rangeText(r.from, r.to) + '</b><small>' + r.type + ' · ' + r.paid + ' · ' + r.days + (r.days === 1 ? ' day' : ' days') + (r.note ? ' · ' + esc(r.note) : '') + '</small></span>' + badge('warning', r.status) + '<button type="button" class="dv-icbtn danger" data-cn="' + r.id + '" aria-label="Cancel leave" data-tip="Cancel"><i data-lucide="x"></i></button></li>';
    }).join('') + '</ul>';
  }
  function balCard(){
    return '<div class="card"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">Balance</h2></div><p class="card-desc">Days for the year, after anything booked.</p></div></div><div class="card-body" style="padding-top:8.75px"><ul class="dv-bal">' + LV.types.map(function(t){
      var b = balance(t), pct = Math.min(100, b.used / t.allow * 100);
      return '<li><div class="dv-bal-h"><i style="background:' + t.c + '"></i><b>' + t.k + '</b><span><b class="dv-b">' + b.avail + '</b> of ' + t.allow + ' left</span></div><div class="dv-meter"><i style="width:' + pct + '%;background:' + t.c + '"></i></div></li>';
    }).join('') + '</ul></div></div>';
  }
  function bookCard(){
    return '<div class="card"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">Book time off</h2></div><p class="card-desc">Goes to ' + esc(DRV.manager) + ' for approval.</p></div></div><div class="card-body">' +
      '<div class="field">' + DV.sel('lvType', 'Leave type', true) + '</div><div class="dialog-row" style="margin-bottom:16.25px">' + DV.sel('lvPaid', 'Paid type', true) + DV.sel('lvDur', 'Duration') + '</div>' +
      '<div class="dialog-row" style="margin-bottom:16.25px">' + DV.inp('lvFrom', 'From date', true, 'date') + DV.inp('lvTo', 'To date', true, 'date') + '</div>' +
      '<div class="field" id="lvHrsWrap" hidden><label class="field-label" for="lvHrs">Hours per day</label><div class="unit-input"><input type="number" id="lvHrs" min="1" max="8" value="4"><span>hours</span></div></div>' +
      '<div class="field"><label class="field-label" for="lvComment">Comment</label><textarea class="text-input dialog-textarea" id="lvComment" placeholder="Enter comment"></textarea></div>' +
      '<div class="dv-lv-sum" id="lvSum"></div></div><div class="card-foot"><div class="card-foot-actions" style="margin-left:auto"><button type="button" class="btn-primary" id="lvBook"><i data-lucide="send"></i> Book time off</button></div></div></div>';
  }
  function paintLeave(){
    var host = Q('#lvBody'), s = LV.sub;
    if(s === 'leaves'){
      host.innerHTML = '<div class="dv-lv"><div class="stack">' + bookCard() + '</div><div class="card"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">My next leaves</h2></div><p class="card-desc">Pending and approved.</p></div></div><div class="card-body" id="lvNext">' + nextList() + '</div></div><div id="lvBal">' + balCard() + '</div></div>' + strip();
      DV.opts(Q('#lvType'), [['', 'Select leave type']].concat(LV.types.map(function(t){ return [t.k, t.k]; })), '');
      DV.opts(Q('#lvPaid'), [['', 'Select'], ['Paid', 'Paid'], ['Unpaid', 'Unpaid']], '');
      DV.opts(Q('#lvDur'), ['Full day', 'Half day (AM)', 'Half day (PM)', 'Hours'].map(function(x){ return [x, x]; }), 'Full day');
      Q('#lvFrom').value = LV.pick.from; Q('#lvTo').value = LV.pick.to || LV.pick.from; sum();
      on(Q('#lvType'), 'change', sum); on(Q('#lvDur'), 'change', function(){ Q('#lvHrsWrap').hidden = Q('#lvDur').value !== 'Hours'; sum(); });
      on(Q('#lvFrom'), 'change', function(e){ LV.pick.from = e.target.value; if(!LV.pick.to || LV.pick.to < LV.pick.from) LV.pick.to = LV.pick.from; Q('#lvTo').value = LV.pick.to; paintStrip(); sum(); });
      on(Q('#lvTo'), 'change', function(e){ LV.pick.to = e.target.value; paintStrip(); sum(); }); on(Q('#lvHrs'), 'input', sum);
      on(Q('#lvBook'), 'click', book);
      on(Q('#lvNext'), 'click', function(e){ var b = e.target.closest('[data-cn]'); if(!b) return; var r = LV.next.filter(function(x){ return x.id === b.getAttribute('data-cn'); })[0]; DV.confirm({title:'Cancel this leave?', body:rangeText(r.from, r.to) + ' · ' + r.type + '. The days return to the balance.', ok:'Cancel leave', danger:true, onOk:function(){ r.status = 'Cancelled'; syncEvents(); paintLeave(); toast('success', 'Leave cancelled', rangeText(r.from, r.to)); }}); });
      wireStrip();
    } else if(s === 'holidays'){
      host.innerHTML = '<div class="card"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">Company holidays</h2><span class="badge">' + HOLIDAYS.length + '</span></div><p class="card-desc">Paid days the office is closed.</p></div></div><div class="card-body" style="padding:0"><div class="data-grid-scroll"><table class="pay-table dense"><thead><tr><th>Holiday</th><th>Date</th><th>Day</th><th>Pay</th><th>Status</th></tr></thead><tbody>' + HOLIDAYS.map(function(h){ var d = DV.fromYmd(h[1]), past = d < TODAY; return '<tr><td><span class="dv-hol"><span class="dv-date" style="width:35px;height:40px"><b style="font-size:var(--fs-sm)">' + d.getDate() + '</b><small>' + DV.MON3[d.getMonth()] + '</small></span><b class="dv-b">' + esc(h[0]) + '</b></span></td><td>' + DV.nice(d) + '</td><td>' + DV.DOWL[d.getDay()] + '</td><td>' + badge('success', 'Paid') + '</td><td>' + (past ? '<span class="muted">Passed</span>' : badge('info', 'in ' + DV.daysBetween(TODAY, d) + ' days')) + '</td></tr>'; }).join('') + '</tbody></table></div></div></div>';
    } else if(s === 'home'){
      host.innerHTML = '<div class="card"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">Home time</h2><span class="badge">' + HOME.length + '</span></div><p class="card-desc">Planned trips home between dispatches.</p></div><div class="card-head-actions"><button type="button" class="btn-primary" data-size="sm" id="htAdd"><i data-lucide="plus"></i> Request home time</button></div></div><div class="card-body" style="padding:0"><div class="data-grid-scroll"><table class="pay-table dense"><thead><tr><th>Dates</th><th>Days</th><th>Note</th><th>Status</th></tr></thead><tbody>' + HOME.map(function(h){ return '<tr><td><b class="dv-b">' + rangeText(h.from, h.to) + '</b></td><td>' + (DV.daysBetween(DV.fromYmd(h.from), DV.fromYmd(h.to)) + 1) + '</td><td>' + esc(h.note) + '</td><td>' + badge(h.status === 'Approved' ? 'success' : '', h.status) + '</td></tr>'; }).join('') + '</tbody></table></div></div></div>';
      on(Q('#htAdd'), 'click', homeDlg);
    } else if(s === 'history'){
      var all = LV.recs.concat(LV.next.filter(function(r){ return r.status !== 'Cancelled'; }));
      host.innerHTML = '<div class="card"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">Time off taken</h2><span class="badge">' + all.length + '</span></div><p class="card-desc">Every leave on file this year.</p></div></div><div class="card-body" style="padding:0"><div class="data-grid-scroll"><table class="pay-table dense"><thead><tr><th>Dates</th><th>Type</th><th>Pay</th><th class="r">Days</th><th>Status</th></tr></thead><tbody>' + all.sort(function(a, b){ return b.from.localeCompare(a.from); }).map(function(r){ return '<tr><td><b class="dv-b">' + rangeText(r.from, r.to) + '</b><span class="cell-sub">' + esc(r.note || '') + '</span></td><td>' + r.type + '</td><td>' + r.paid + '</td><td class="r">' + r.days + '</td><td>' + badge(r.status === 'Approved' ? 'success' : 'warning', r.status) + '</td></tr>'; }).join('') + '</tbody></table></div></div></div>';
    } else {
      host.innerHTML = '<div class="card"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">Allowance</h2></div><p class="card-desc">Set by HR for ' + esc(DRV.first) + '’s role. Balance, used and available update as leave is booked.</p></div></div><div class="card-body" style="padding:0"><div class="data-grid-scroll"><table class="pay-table dense"><thead><tr><th>Leave type</th><th class="r">Allowance</th><th class="r">Used</th><th class="r">Available</th><th style="width:30%">Usage</th></tr></thead><tbody>' + LV.types.map(function(t){ var b = balance(t); return '<tr><td><span class="dv-hol"><i class="dv-dot" style="background:' + t.c + '"></i><b class="dv-b">' + t.k + '</b></span></td><td class="r">' + t.allow + ' days</td><td class="r">' + b.used + '</td><td class="r"><b class="dv-b">' + b.avail + '</b></td><td><div class="dv-meter" style="margin:0"><i style="width:' + Math.min(100, b.used / t.allow * 100) + '%;background:' + t.c + '"></i></div></td></tr>'; }).join('') + '</tbody></table></div></div></div>';
    }
    icons();
  }
  function sum(){
    var el = Q('#lvSum'); if(!el) return; var f = Q('#lvFrom').value, t = Q('#lvTo').value, dur = Q('#lvDur').value, d = leaveDays(f, t, dur, +Q('#lvHrs').value), type = Q('#lvType').value, tp = LV.types.filter(function(x){ return x.k === type; })[0];
    if(!d){ el.innerHTML = '<i data-lucide="calendar-range"></i><span>Pick the dates to see the days and your balance.</span>'; el.className = 'dv-lv-sum'; icons(); return; }
    var after = tp ? balance(tp).avail - d : null, bad = tp && after < 0 && Q('#lvPaid').value === 'Paid';
    el.className = 'dv-lv-sum' + (bad ? ' bad' : '');
    el.innerHTML = '<i data-lucide="' + (bad ? 'triangle-alert' : 'calendar-check') + '"></i><span><b>' + d + (d === 1 ? ' day' : ' days') + '</b> · ' + rangeText(f, t) + (tp ? ' · ' + (bad ? 'only ' + balance(tp).avail + ' ' + type.toLowerCase() + ' days left — book as unpaid' : after + ' ' + type.toLowerCase() + ' days left after') : '') + '</span>'; icons();
  }
  function book(){
    var type = Q('#lvType').value, paid = Q('#lvPaid').value, f = Q('#lvFrom').value, t = Q('#lvTo').value, dur = Q('#lvDur').value;
    var bad = false; if(!type){ window.dpValidate.showError(Q('#lvType'), 'Choose a leave type.'); bad = true; } if(!paid){ window.dpValidate.showError(Q('#lvPaid'), 'Choose paid or unpaid.'); bad = true; }
    if(!f){ window.dpValidate.showError(Q('#lvFrom'), 'Pick a start date.'); bad = true; } if(!t || (f && t < f)){ window.dpValidate.showError(Q('#lvTo'), 'End date must be on or after the start.'); bad = true; }
    if(bad) return;
    var d = leaveDays(f, t, dur, +Q('#lvHrs').value), tp = LV.types.filter(function(x){ return x.k === type; })[0];
    if(paid === 'Paid' && balance(tp).avail - d < 0){ toast('error', 'Not enough ' + type.toLowerCase() + ' days', 'Only ' + balance(tp).avail + ' left. Book it as unpaid or shorten the leave.'); return; }
    LV.next.unshift({id:'n' + Date.now(), from:f, to:t, type:type, paid:paid, dur:dur, days:d, status:'Pending', note:Q('#lvComment').value.trim()});
    LV.pick = {from:'', to:''}; syncEvents(); paintLeave(); toast('success', 'Time off requested', rangeText(f, t) + ' · ' + d + (d === 1 ? ' day' : ' days') + ' · sent to ' + DRV.manager);
  }
  function syncEvents(){
    for(var i = DV.EVENTS.length - 1; i >= 0; i--) if(DV.EVENTS[i].fromLeave) DV.EVENTS.splice(i, 1);
    LV.next.forEach(function(r){ if(r.status === 'Cancelled') return; for(var d = DV.fromYmd(r.from); d <= DV.fromYmd(r.to); d.setDate(d.getDate() + 1)) DV.EVENTS.push({id:'lv' + r.id + ymd(d), title:r.type + ' leave', date:ymd(d), cat:'leave', sys:true, fromLeave:1, notes:r.type + ' · ' + r.paid + ' · ' + r.status}); });
    if(DV.refreshEvents) DV.refreshEvents();
  }
  function paintStrip(){
    var old = Q('#lvStrip'); if(!old) return; var tmp = document.createElement('div'); tmp.innerHTML = strip(); old.parentNode.replaceChild(Q('#lvStrip', tmp), old); wireStrip(); icons();
  }
  function wireStrip(){
    on(Q('#lvStrip'), 'click', function(e){
      var b = e.target.closest('[data-d]'); if(!b || b.disabled) return; var k = b.getAttribute('data-d'), p = LV.pick;
      if(!p.from || (p.from && p.to && p.to !== p.from) || k < p.from){ p.from = k; p.to = k; } else { p.to = k; }
      Q('#lvFrom').value = p.from; Q('#lvTo').value = p.to; paintStrip(); sum();
    });
    var step = function(n){ LV.m += n; if(LV.m < 0){ LV.m = 11; LV.y--; } if(LV.m > 11){ LV.m = 0; LV.y++; } var c = Q('#lvStrip').closest('.card'); var tmp = document.createElement('div'); tmp.innerHTML = strip(); c.parentNode.replaceChild(tmp.firstChild, c); wireStrip(); icons(); };
    on(Q('#lvPrev'), 'click', function(){ step(-1); }); on(Q('#lvNext'), 'click', function(){ step(1); });
  }
  function homeDlg(){
    DV.overlay('dlgHome', 'dialog', '<div class="dialog-panel" role="dialog" aria-modal="true" aria-labelledby="htTitle"><div class="dialog-head"><h2 class="dialog-title" id="htTitle">Request home time</h2><p class="dialog-desc">Dispatch plans loads around it.</p><button type="button" class="dialog-close" data-dialog-close aria-label="Close"><i data-lucide="x"></i></button></div><div class="dialog-body"><div class="dialog-row">' + DV.inp('htFrom', 'Leaving', true, 'date') + DV.inp('htTo', 'Back on', true, 'date') + '</div><div class="dialog-field" style="margin-bottom:0">' + DV.inp('htNote', 'Note', false, 'text', 'Where and why') + '</div></div><div class="dialog-foot"><div class="dialog-foot-actions"><button class="btn-outline" type="button" data-dialog-close>Cancel</button><button class="btn-primary" type="button" id="htSave">Request</button></div></div></div>');
    Q('#htFrom').value = ''; Q('#htTo').value = ''; Q('#htNote').value = '';
    Q('#htSave').onclick = function(){ var f = Q('#htFrom').value, t = Q('#htTo').value; if(!f){ window.dpValidate.showError(Q('#htFrom'), 'Pick a date.'); return; } if(!t || t < f){ window.dpValidate.showError(Q('#htTo'), 'Back-on must be after leaving.'); return; } HOME.unshift({from:f, to:t, note:Q('#htNote').value.trim() || 'Home time', status:'Pending'}); window.dpDialog.close('dlgHome'); paintLeave(); toast('success', 'Home time requested', rangeText(f, t)); };
    window.dpDialog.open('dlgHome');
  }
  DV.renderers.leave = function(){
    Q('#pLeave').innerHTML = subnav() + '<div id="lvBody" style="margin-top:17.5px"></div>';
    on(Q('#lvNav'), 'click', function(e){ var b = e.target.closest('button[data-s]'); if(!b) return; LV.sub = b.getAttribute('data-s'); QA('#lvNav button').forEach(function(x){ x.classList.toggle('active', x === b); }); paintLeave(); });
    paintLeave();
  };

  /* ================================================================
     DRIVER INFO
     ================================================================ */
  function g(k){ var i = DV.st.info; return i[k] != null && i[k] !== '' ? i[k] : DRV[k]; }
  function expiry(s){
    if(!s) return '<span class="muted">—</span>'; var d = DV.fromYmd(s), n = DV.daysBetween(TODAY, d), v = n < 0 ? 'danger' : n < 90 ? 'warning' : 'success';
    return '<span class="dv-exp">' + DV.nice(d).replace(/^(\w+)/, '$1') + ' ' + badge(v, n < 0 ? 'expired' : n < 400 ? n + ' days' : (n / 365).toFixed(1) + ' yrs') + '</span>';
  }
  function row(k, v){ return '<li><span class="k">' + k + '</span><span class="v">' + (v == null || v === '' ? '<span class="muted">—</span>' : v) + '</span></li>'; }
  function yn(b){ return b ? badge('success', 'Yes') : badge('', 'No'); }
  var showSsn = false;
  function infoCard(icon, title, desc, rows, cls){
    return '<div class="card dv-ic ' + (cls || '') + '"><div class="card-head with-icon"><div class="card-head-text"><span class="icon-tile"><i data-lucide="' + icon + '"></i></span><div><h2 class="card-title">' + title + '</h2><p class="card-desc">' + desc + '</p></div></div></div><div class="card-body" style="padding-top:5px;padding-bottom:8.75px"><ul class="kv dv-kv">' + rows + '</ul></div></div>';
  }
  DV.renderInfo = function(){
    var host = Q('#pInfo'); if(!host || !host.getAttribute('data-r')) return;
    var st = DV.st, hire = DV.fromYmd(DRV.hire), onb = DV.daysBetween(hire, TODAY), yrs = 31;
    host.innerHTML = '<div class="dv-info">' +
      infoCard('user-round', 'Driver information', 'Personal and employment record.', row('Full name', esc(DRV.full)) + row('Handle / nickname', esc(g('nick'))) + row('Address', esc(g('addr'))) + row('Cell phone', esc(g('cell'))) + row('Home phone', esc(g('home'))) + row('Email', esc(g('email'))) +
        row('Social security', '<span class="dv-ssn">' + (showSsn ? '541-77-2845' : 'xxx-xx-2845') + '</span> <button type="button" class="dv-icbtn" id="ssnEye" aria-label="' + (showSsn ? 'Hide' : 'Show') + ' number" data-tip="' + (showSsn ? 'Hide' : 'Show') + '"><i data-lucide="' + (showSsn ? 'eye-off' : 'eye') + '"></i></button>') +
        row('Birth date', DV.nice(DRV.birth)) + row('Hire source', 'Facebook') + row('Hire date', DV.nice(DRV.hire)) + row('Termination date', st.info.termDate ? DV.nice(st.info.termDate) : '') + row('Termination reason', esc(st.info.termReason || '')) + row('Days since delivery', '2') +
        row('Time onboard', fmt(onb) + ' days') + row('Years of experience', yrs + ' years') + row('Work anniversary', DV.nice(new Date(2023, 8, 2))), 'wide') +
      infoCard('building-2', 'Company contacts', 'Who looks after this driver.', row('Terminal', 'DATR Roanoke, VA') + row('Team', 'Panthers') + row('Dispatcher', 'Chris Taylor') + row('Load planner', esc(DRV.manager)) + row('Recruiter', 'Michelle Logginworth') + row('Onboarder', 'Clyde Messiers') + row('Billing', 'Joy Bailey') + row('Safety', 'Joe Pesce')) +
      infoCard('users-round', 'Passenger authorization', 'Who may ride along.', row('Passenger onboard', yn(true)) + row('Authorization on file', yn(true)) + row('Authorization expires', expiry('2023-12-31')) + row('Passenger', 'Drew Carrymore') + row('Phone', '(540) 777-1234') + row('Relationship', 'Fiancé') + row('Allergies', 'Peanut butter') + row('Gender', 'Male')) +
      infoCard('badge-check', 'Credentials & certifications', 'Licences, endorsements and what they are good until.', row('License class', 'A') + row('License number', 'T631782') + row('License state', 'Virginia') + row('License expires', expiry('2026-05-08')) + row('Endorsements', yn(true) + ' <span class="muted">T doubles/triples · X hazmat/tanker</span>') +
        row('TWIC certified', yn(true)) + row('TWIC expires', expiry('2025-07-08')) + row('TSA certified', yn(true)) + row('TSA expires', expiry('2025-08-08')) + row('Hazmat certified', yn(true)) + row('Hazmat expires', expiry('2026-05-08')) + row('Passport', '') + row('Tanker endorsement', '') +
        row('EOBR provider', esc(DRV.eld)) + row('EOBR ID', 'WRFalin') + row('Fuel card', 'Comdata · ••••4987') + row('Drug & alcohol due', '') + row('Next review', expiry('2024-05-20')) + row('Last MVR', DV.nice('2023-04-01')), 'wide') +
      infoCard('shapes', 'Other', 'Everything else on file.', row('Allergies', 'None') + row('Pets', yn(true)) + row('Pet name', 'Dixie-Doodle') + row('Pet type', 'Dog') + row('Smoker', yn(true)) + row('1099 contractor', yn(false)) + row('Gender', 'Male')) +
      infoCard('heart-pulse', 'Insurance & medical', 'Coverage and fitness for duty.', row('Policy type', 'Workers comp.') + row('Provider', 'Anthem') + row('Policy number', 'WC90182038-26') + row('Policy expires', expiry('2026-05-02')) + row('Medical certificate updated', yn(true)) + row('Medical certificate expires', expiry('2024-06-14')) + row('Restrictions', yn(true)) + row('Condition', 'Corrective lenses')) + '</div>';
    var cards = QA('.dv-ic', host), wrap = Q('.dv-info', host); wrap.innerHTML = '';
    [[0, 4], [3], [1, 2, 5]].forEach(function(ix){ var c = document.createElement('div'); c.className = 'dv-col'; ix.forEach(function(i){ c.appendChild(cards[i]); }); wrap.appendChild(c); });
    icons();
  };
  DV.renderers.info = function(){ Q('#pInfo').setAttribute('data-r', '1'); DV.renderInfo(); on(Q('#pInfo'), 'click', function(e){ if(e.target.closest('#ssnEye')){ showSsn = !showSsn; DV.renderInfo(); } }); };

  /* ================================================================
     EDIT ACCOUNT (sheet)
     ================================================================ */
  on(Q('#dvEditBtn'), 'click', function(){
    DV.overlay('shEdit', 'sheet', '<div class="sheet-panel" role="dialog" aria-modal="true" aria-labelledby="edTitle" style="max-width:600px"><div class="sheet-head"><div><h2 class="sheet-title" id="edTitle">Edit account</h2><p class="sheet-desc">Contact details shown on the Account and Driver info tabs.</p></div><button type="button" class="dialog-close" data-dialog-close aria-label="Close" style="position:static"><i data-lucide="x"></i></button></div><div class="sheet-body">' +
      '<div class="dialog-row">' + DV.inp('edNick', 'Handle / nickname', false, 'text') + DV.sel('edMgr', 'Manager') + '</div><div class="dialog-field">' + DV.inp('edAddr', 'Address', true, 'text') + '</div><div class="dialog-row">' + DV.inp('edCell', 'Cell phone', true, 'tel') + DV.inp('edHome', 'Home phone', false, 'tel') + '</div>' +
      '<div class="dialog-field">' + DV.inp('edEmail', 'Email', true, 'email') + '</div><div class="switch-row"><span class="switch-row-text"><span class="switch-row-title">SMS notifications</span><span class="switch-row-desc">Text dispatch updates to the cell phone</span></span><label class="switch"><input type="checkbox" id="edSms"><span></span></label></div></div>' +
      '<div class="sheet-foot"><button class="btn-outline" type="button" data-dialog-close>Cancel</button><button class="btn-primary" type="button" id="edSave">Save changes</button></div></div>');
    DV.opts(Q('#edMgr'), ['Lois Gisiner', 'Chris Taylor', 'Joy Bailey'].map(function(x){ return [x, x]; }), DRV.manager);
    Q('#edNick').value = g('nick'); Q('#edAddr').value = g('addr'); Q('#edCell').value = g('cell'); Q('#edHome').value = g('home'); Q('#edEmail').value = g('email'); Q('#edSms').checked = DRV.sms;
    if(!Q('#edSave')._w){ Q('#edSave')._w = 1; on(Q('#edSave'), 'click', function(){
      var bad = false; [['#edAddr', 'Address is required.'], ['#edCell', 'Cell phone is required.'], ['#edEmail', 'Email is required.']].forEach(function(p){ if(!Q(p[0]).value.trim()){ window.dpValidate.showError(Q(p[0]), p[1]); bad = true; } });
      if(!/^\S+@\S+\.\S+$/.test(Q('#edEmail').value.trim())){ window.dpValidate.showError(Q('#edEmail'), 'Enter a valid email.'); bad = true; } if(bad) return;
      DV.st.info.nick = Q('#edNick').value.trim(); DV.st.info.addr = Q('#edAddr').value.trim(); DV.st.info.cell = Q('#edCell').value.trim(); DV.st.info.home = Q('#edHome').value.trim(); DV.st.info.email = Q('#edEmail').value.trim();
      DRV.sms = Q('#edSms').checked; DRV.manager = Q('#edMgr').value; window.dpDialog.close('shEdit'); DV.renderHead(); DV.renderAccount(); DV.renderInfo(); toast('success', 'Account updated', 'Contact details saved.');
    }); }
    window.dpDialog.open('shEdit');
  });
  on(Q('#dvMsgBtn'), 'click', function(){ toast('success', 'ProChat', 'Opening a conversation with ' + DRV.first + '.'); });
})();
