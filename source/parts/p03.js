(function(){
  'use strict';
  var DV = window.DV, Q = DV.Q, QA = DV.QA, esc = DV.esc, on = DV.on, icons = DV.icons, toast = DV.toast, badge = DV.badge, DRV = DV.DRV, TODAY = DV.TODAY, pad = DV.pad, ymd = DV.ymd;

  /* ================================================================
     EVENTS — shared store (also feeds "Coming up" on the Account tab)
     ================================================================ */
  var CATS = DV.CATS = [
    {k:'bday', n:'Birthdays & anniversary', c:'#DB2777', icon:'cake'}, {k:'exp', n:'Expirations', c:'#E7000B', icon:'file-warning'},
    {k:'mtruck', n:'Maintenance — trucks', c:'#2E7DF7', icon:'wrench'}, {k:'mtrailer', n:'Maintenance — trailers', c:'#0891B2', icon:'container'},
    {k:'personal', n:'Personal events', c:'#7C3AED', icon:'user-round'}, {k:'leave', n:'My leaves', c:'#10B981', icon:'palmtree'},
    {k:'viol', n:'My violations', c:'#D97706', icon:'shield-alert'}, {k:'ticket', n:'Maintenance tickets', c:'#475569', icon:'ticket'}
  ];
  var CAT = {}; CATS.forEach(function(c){ CAT[c.k] = c; });
  DV.catName = function(k){ return CAT[k] ? CAT[k].n : k; };
  var EVENTS = DV.EVENTS = [
    {id:'e1', title:'Medical certificate expires', date:'2023-05-15', cat:'exp', sys:true, notes:'Renew the DOT medical card before dispatching.'},
    {id:'e2', title:'Medical certificate', date:'2023-05-24', time:'5:00pm', cat:'exp', sys:true, notes:'Appointment to renew the card.'},
    {id:'e3', title:'Doctors appointment', date:'2023-06-05', time:'5:00pm', cat:'personal', type:'Doctor appointment', addr:'Carilion Clinic, Roanoke, VA', repeat:'none', notes:''},
    {id:'e4', title:'bill falin', date:'2023-05-16', time:'', cat:'personal', type:'Seminars', addr:'1007 Cherokee Street NE', repeat:'none', notes:'take meds'},
    {id:'e5', title:'Birthday — turns 63', date:'2023-06-14', cat:'bday', sys:true, notes:''},
    {id:'e6', title:'PM service · DTL88', date:'2023-05-09', cat:'mtruck', sys:true, notes:'Oil, filters and a brake check.'},
    {id:'e7', title:'Wheel seal · V5302', date:'2023-05-22', cat:'mtrailer', sys:true, notes:'Open repair flagged on the trailer.'},
    {id:'e8', title:'Time off', date:'2023-05-06', cat:'leave', sys:true}, {id:'e9', title:'Time off', date:'2023-05-07', cat:'leave', sys:true},
    {id:'e10', title:'Time off', date:'2023-05-13', cat:'leave', sys:true}, {id:'e11', title:'Time off', date:'2023-05-14', cat:'leave', sys:true},
    {id:'e12', title:'Accident CHIP070723', date:'2023-05-05', cat:'viol', sys:true, notes:'Rear-end accident, California.'},
    {id:'e13', title:'Ticket T-2291 · brake light', date:'2023-05-11', cat:'ticket', sys:true, notes:'Closed by the shop.'},
    {id:'e14', title:'Work anniversary — 11 years', date:'2023-09-02', cat:'bday', sys:true},
    {id:'e15', title:'Passenger authorization expires', date:'2023-12-31', cat:'exp', sys:true}
  ];
  function dateOf(s){ return DV.fromYmd(s); }
  function occurs(e, d){
    var s = dateOf(e.date); if(d < s) return false;
    var r = e.repeat || 'none'; if(r === 'none') return +d === +s;
    if(r === 'daily') return true;
    if(r === 'weekly') return d.getDay() === s.getDay();
    if(r === 'monthly') return d.getDate() === s.getDate();
    if(r === 'yearly') return d.getDate() === s.getDate() && d.getMonth() === s.getMonth();
    return false;
  }
  function eventsOn(d, hidden){
    return EVENTS.filter(function(e){ return !hidden[e.cat] && occurs(e, d); }).sort(function(a, b){ return (a.time || '').localeCompare(b.time || ''); });
  }
  DV.upcoming = function(n){
    var lo = new Date(TODAY), hi = new Date(TODAY); lo.setDate(lo.getDate() - 7); hi.setDate(hi.getDate() + 60);
    return EVENTS.filter(function(e){ var d = dateOf(e.date); return d >= lo && d <= hi && e.cat !== 'leave' && e.cat !== 'viol' && e.cat !== 'ticket' && e.cat !== 'mtruck'; })
      .sort(function(a, b){ return a.date.localeCompare(b.date); }).slice(0, n || 4);
  };

  /* ================================================================
     EVENTS TAB
     ================================================================ */
  var ev = {mode:'month', y:2023, m:4, day:new Date(TODAY), hidden:{}, filter:'all', range:'upcoming'};
  var TYPES = ['Seminars', 'Training', 'Doctor appointment', 'Meeting', 'Road test', 'Personal'];
  function chip(e, d){
    var c = CAT[e.cat];
    return '<button type="button" class="dv-evc" style="--c:' + c.c + '" data-ev="' + e.id + '" title="' + esc(e.title) + '"><i data-lucide="' + c.icon + '"></i><span>' + esc(e.title) + '</span>' + (e.time ? '<em>' + e.time + '</em>' : '') + '</button>';
  }
  function monthView(){
    var y = ev.y, m = ev.m, first = new Date(y, m, 1), lead = first.getDay(), last = new Date(y, m + 1, 0).getDate(), cells = '';
    for(var i = 0; i < lead; i++) cells += '<div class="dv-ec blank"></div>';
    for(var d = 1; d <= last; d++){
      var dt = new Date(y, m, d), list = eventsOn(dt, ev.hidden), show = list.slice(0, 2), more = list.length - show.length;
      cells += '<div class="dv-ec' + (+dt === +TODAY ? ' today' : '') + '"><div class="dv-ec-h"><span>' + pad(d) + '</span><button type="button" class="dv-ec-add" data-add="' + ymd(dt) + '" aria-label="Add event on ' + DV.MON3[m] + ' ' + d + '" data-tip="Add event"><i data-lucide="plus"></i></button></div>' +
        show.map(function(e){ return chip(e, dt); }).join('') + (more > 0 ? '<button type="button" class="dv-ec-more" data-day="' + ymd(dt) + '">+' + more + ' more</button>' : '') + '</div>';
    }
    var rest = (7 - (lead + last) % 7) % 7; for(var j = 0; j < rest; j++) cells += '<div class="dv-ec blank"></div>';
    return '<div class="dv-cal-dow">' + DV.DOW3.map(function(x){ return '<span>' + x + '</span>'; }).join('') + '</div><div class="dv-ec-grid">' + cells + '</div>';
  }
  function weekView(){
    var s = new Date(ev.day), cols = ''; s.setDate(s.getDate() - s.getDay());
    for(var i = 0; i < 7; i++){
      var d = new Date(s); d.setDate(s.getDate() + i);
      cols += '<div class="dv-wk-col' + (+d === +TODAY ? ' today' : '') + '"><div class="dv-wk-h"><small>' + DV.DOW3[i] + '</small><b>' + d.getDate() + '</b></div>' + eventsOn(d, ev.hidden).map(function(e){ return chip(e, d); }).join('') +
        '<button type="button" class="dv-ec-more" data-add="' + ymd(d) + '"><i data-lucide="plus"></i> Add</button></div>';
    }
    return '<div class="dv-wk">' + cols + '</div>';
  }
  function dayView(){
    var list = eventsOn(ev.day, ev.hidden);
    return '<div class="dv-dayv"><div class="dv-dayv-h"><b>' + DV.DOWL[ev.day.getDay()] + '</b><span>' + DV.MONTHS[ev.day.getMonth()] + ' ' + ev.day.getDate() + ', ' + ev.day.getFullYear() + '</span><button type="button" class="btn-outline" data-size="sm" data-add="' + ymd(ev.day) + '"><i data-lucide="plus"></i> Add event</button></div>' +
      (list.length ? list.map(function(e){ var c = CAT[e.cat]; return '<button type="button" class="dv-evrow" style="--c:' + c.c + '" data-ev="' + e.id + '"><span class="dv-evrow-t">' + (e.time || 'All day') + '</span><span class="dv-evrow-b"><b>' + esc(e.title) + '</b><small>' + esc(c.n) + (e.addr ? ' · ' + esc(e.addr) : '') + '</small></span><i data-lucide="chevron-right"></i></button>'; }).join('') : '<div class="empty-state" style="padding-top:25px"><div class="empty-icon"><i data-lucide="calendar-x-2"></i></div><h3 class="empty-title">A clear day</h3><p>Nothing is scheduled.</p></div>') + '</div>';
  }
  function title(){
    if(ev.mode === 'month') return DV.MONTHS[ev.m] + ' ' + ev.y;
    if(ev.mode === 'day') return DV.MON3[ev.day.getMonth()] + ' ' + ev.day.getDate() + ', ' + ev.day.getFullYear();
    var s = new Date(ev.day); s.setDate(s.getDate() - s.getDay()); var e = new Date(s); e.setDate(s.getDate() + 6);
    return DV.MON3[s.getMonth()] + ' ' + s.getDate() + ' – ' + (s.getMonth() !== e.getMonth() ? DV.MON3[e.getMonth()] + ' ' : '') + e.getDate() + ', ' + e.getFullYear();
  }
  function listRange(){
    var lo = new Date(TODAY), hi = new Date(TODAY);
    if(ev.range === 'upcoming'){ hi.setDate(hi.getDate() + 45); }
    else if(ev.range === 'week'){ lo.setDate(lo.getDate() - lo.getDay()); hi = new Date(lo); hi.setDate(lo.getDate() + 6); }
    else if(ev.range === 'prev'){ lo.setDate(lo.getDate() - lo.getDay() - 7); hi = new Date(lo); hi.setDate(lo.getDate() + 6); }
    else if(ev.range === 'next'){ lo.setDate(lo.getDate() - lo.getDay() + 7); hi = new Date(lo); hi.setDate(lo.getDate() + 6); }
    var out = [];
    for(var d = new Date(lo); d <= hi; d.setDate(d.getDate() + 1)){ var cp = new Date(d); eventsOn(cp, ev.hidden).forEach(function(e){ out.push({e:e, d:cp}); }); }
    return out;
  }
  function ord(n){ var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  function paintList(){
    var items = listRange(), by = {};
    items.forEach(function(x){ (by[ymd(x.d)] = by[ymd(x.d)] || []).push(x); });
    Q('#evList').innerHTML = Object.keys(by).map(function(k){
      var d = dateOf(k);
      return '<div class="dv-agd"><h4>' + DV.DOWL[d.getDay()] + ', ' + DV.MONTHS[d.getMonth()] + ' ' + ord(d.getDate()) + '</h4>' + by[k].map(function(x){ var c = CAT[x.e.cat]; return '<button type="button" class="dv-evrow" style="--c:' + c.c + '" data-ev="' + x.e.id + '"><span class="dv-evrow-ic"><i data-lucide="' + c.icon + '"></i></span><span class="dv-evrow-b"><b>' + esc(x.e.title) + '</b></span><span class="dv-evrow-t">' + (x.e.time || '') + '</span></button>'; }).join('') + '</div>';
    }).join('') || '<div class="empty-state" style="padding:30px 10px"><div class="empty-icon"><i data-lucide="calendar-x-2"></i></div><h3 class="empty-title">Nothing here</h3><p>No events in this range.</p></div>';
  }
  function paintEv(){
    Q('#evTitle').textContent = title();
    Q('#evBody').innerHTML = ev.mode === 'month' ? monthView() : ev.mode === 'week' ? weekView() : dayView();
    paintList(); icons();
  }
  DV.refreshEvents = function(){ if(Q('#evBody')) paintEv(); if(DV.renderAccount) DV.renderAccount(); };
  function findEv(id){ return EVENTS.filter(function(e){ return e.id === id; })[0]; }
  DV.renderers.events = function(){
    Q('#pEvents').innerHTML = '<div class="dv-ev">' +
      '<aside class="card dv-ev-f"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">Filters</h2></div><p class="card-desc">Show or hide what you care about.</p></div></div><div class="card-body">' +
      '<div class="field"><label class="field-label" for="evFilter">Calendar event</label><select class="select-input" id="evFilter"></select></div>' +
      '<div id="evCats">' + CATS.map(function(c){ return '<label class="dv-cat"><span class="dv-cat-ic" style="--c:' + c.c + '"><i data-lucide="' + c.icon + '"></i></span><span>' + c.n + '</span><span class="switch"><input type="checkbox" data-cat="' + c.k + '" checked><span></span></span></label>'; }).join('') + '</div></div></aside>' +
      '<div class="card"><div class="card-head"><div class="card-head-text"><div class="dv-cal-nav"><button type="button" class="dv-back" id="evPrev" aria-label="Previous"><i data-lucide="chevron-left"></i></button><h2 class="card-title" id="evTitle"></h2><button type="button" class="dv-back" id="evNext" aria-label="Next"><i data-lucide="chevron-right"></i></button></div></div>' +
      '<div class="card-head-actions"><button type="button" class="btn-outline" data-size="sm" id="evToday">Today</button><div class="segmented" id="evMode"><button type="button" class="active" data-m="month">Month</button><button type="button" data-m="week">Week</button><button type="button" data-m="day">Day</button></div></div></div><div class="card-body" id="evBody"></div></div>' +
      '<aside class="card dv-ev-l"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">Event list</h2></div></div><div class="card-head-actions"><select class="select-input" id="evRange" aria-label="Range"></select></div></div><div class="card-body" id="evList" style="padding-top:8.75px"></div></aside></div>';
    DV.opts(Q('#evFilter'), [['all', 'All events']].concat(CATS.map(function(c){ return [c.k, c.n]; })), 'all');
    DV.opts(Q('#evRange'), [['upcoming', 'Upcoming'], ['week', 'This week'], ['prev', 'Previous week'], ['next', 'Next week']], 'upcoming');
    paintEv();
    on(Q('#evFilter'), 'change', function(e){
      var v = e.target.value; ev.filter = v; ev.hidden = {}; CATS.forEach(function(c){ ev.hidden[c.k] = v !== 'all' && c.k !== v; });
      QA('#evCats input').forEach(function(i){ i.checked = !ev.hidden[i.getAttribute('data-cat')]; }); paintEv();
    });
    on(Q('#evCats'), 'change', function(e){ var i = e.target.closest('input[data-cat]'); if(!i) return; ev.hidden[i.getAttribute('data-cat')] = !i.checked; paintEv(); });
    on(Q('#evRange'), 'change', function(e){ ev.range = e.target.value; paintList(); icons(); });
    on(Q('#evMode'), 'click', function(e){ var b = e.target.closest('button[data-m]'); if(!b) return; ev.mode = b.getAttribute('data-m'); QA('#evMode button').forEach(function(x){ x.classList.toggle('active', x === b); }); if(ev.mode !== 'month') ev.day = new Date(ev.y, ev.m, ev.m === 4 && ev.y === 2023 ? TODAY.getDate() : 1); paintEv(); });
    function step(n){
      if(ev.mode === 'month'){ ev.m += n; if(ev.m < 0){ ev.m = 11; ev.y--; } if(ev.m > 11){ ev.m = 0; ev.y++; } }
      else { ev.day = new Date(ev.day.getFullYear(), ev.day.getMonth(), ev.day.getDate() + (ev.mode === 'week' ? 7 : 1) * n); ev.y = ev.day.getFullYear(); ev.m = ev.day.getMonth(); }
      paintEv();
    }
    on(Q('#evPrev'), 'click', function(){ step(-1); }); on(Q('#evNext'), 'click', function(){ step(1); });
    on(Q('#evToday'), 'click', function(){ ev.y = 2023; ev.m = 4; ev.day = new Date(TODAY); paintEv(); });
    on(Q('#pEvents'), 'click', function(e){
      var a = e.target.closest('[data-add]'); if(a){ openEvent(null, a.getAttribute('data-add')); return; }
      var d = e.target.closest('[data-day]'); if(d){ ev.mode = 'day'; ev.day = dateOf(d.getAttribute('data-day')); QA('#evMode button').forEach(function(x){ x.classList.toggle('active', x.getAttribute('data-m') === 'day'); }); paintEv(); return; }
      var c = e.target.closest('[data-ev]'); if(c) openEvent(findEv(c.getAttribute('data-ev')));
    });
  };

  /* ---- add / edit / view ---- */
  var cur = null;
  function build(){
    DV.overlay('dlgEvent', 'dialog', '<div class="dialog-panel dialog-wide" role="dialog" aria-modal="true" aria-labelledby="evdTitle"><div class="dialog-head"><h2 class="dialog-title" id="evdTitle"></h2><p class="dialog-desc" id="evdDesc"></p><button type="button" class="dialog-close" data-dialog-close aria-label="Close"><i data-lucide="x"></i></button></div>' +
      '<div class="dialog-body" id="evdBody"><div class="dialog-field">' + DV.inp('evdName', 'Title', true, 'text', 'What is happening') + '</div><div class="dialog-field">' + DV.inp('evdAddr', 'Address', false, 'text', 'Where') + '</div>' +
      '<div class="dialog-row">' + DV.sel('evdType', 'Event type') + DV.sel('evdRep', 'Repeats') + '</div>' +
      '<div class="dialog-row">' + DV.inp('evdStart', 'Start', true, 'datetime-local') + DV.inp('evdEnd', 'End', true, 'datetime-local') + '</div>' +
      '<div class="dialog-field" style="margin-bottom:0"><label class="field-label" for="evdNotes">Notes</label><textarea class="text-input dialog-textarea" id="evdNotes" placeholder="Enter"></textarea></div></div>' +
      '<div class="dialog-foot has-note"><button class="btn-outline" type="button" id="evdDel" style="color:var(--red)"><i data-lucide="trash-2"></i> Delete</button><div class="dialog-foot-actions"><button class="btn-outline" type="button" data-dialog-close>Cancel</button><button class="btn-primary" type="button" id="evdSave">Add</button></div></div></div>');
    if(!Q('#evdType').options.length){
      DV.opts(Q('#evdType'), TYPES.map(function(t){ return [t, t]; }), 'Seminars');
      DV.opts(Q('#evdRep'), [['none', 'Does not repeat'], ['daily', 'Every day'], ['weekly', 'Every week'], ['monthly', 'Every month'], ['yearly', 'Every year']], 'none');
      on(Q('#evdSave'), 'click', saveEvent);
      on(Q('#evdDel'), 'click', function(){ var e = cur; DV.confirm({title:'Delete this event?', body:'“' + e.title + '” will be removed from the calendar.', ok:'Delete', danger:true, onOk:function(){ window.dpDialog.close('dlgEvent'); EVENTS.splice(EVENTS.indexOf(e), 1); if(Q('#evBody')) paintEv(); if(DV.renderAccount) DV.renderAccount(); toast('success', 'Event deleted', e.title); }}); });
    }
  }
  function openEvent(e, date){
    build(); cur = e;
    var sys = e && e.sys, ro = !!sys;
    Q('#evdTitle').textContent = !e ? 'Add event' : sys ? e.title : 'Edit event';
    Q('#evdDesc').textContent = !e ? 'It shows up on the calendar and in the event list.' : sys ? CAT[e.cat].n + ' · ' + DV.nice(e.date) + ' · created by the system' : 'Change the details, then update.';
    Q('#evdName').value = e ? e.title : ''; Q('#evdAddr').value = e ? (e.addr || '') : '';
    DV.setSel(Q('#evdType'), e && e.type ? e.type : 'Seminars'); DV.setSel(Q('#evdRep'), e && e.repeat ? e.repeat : 'none');
    var d = e ? e.date : date; Q('#evdStart').value = d + 'T' + (e && e.time ? to24(e.time) : '09:00'); Q('#evdEnd').value = d + 'T' + (e && e.time ? to24(e.time, 1) : '10:00');
    Q('#evdNotes').value = e ? (e.notes || '') : '';
    QA('#evdBody input, #evdBody textarea').forEach(function(x){ x.disabled = ro; }); QA('#evdBody select').forEach(function(s){ s.disabled = ro; if(s._dropdownSync) s._dropdownSync(); });
    Q('#evdSave').hidden = ro; Q('#evdSave').textContent = e ? 'Update' : 'Add'; Q('#evdDel').hidden = !e;
    window.dpDialog.open('dlgEvent'); icons();
  }
  function to24(t, plus){
    var m = /(\d+):(\d+)\s*(am|pm)/i.exec(t); if(!m) return '09:00'; var h = +m[1] % 12 + (/pm/i.test(m[3]) ? 12 : 0); h += plus || 0; return pad(h % 24) + ':' + m[2];
  }
  function to12(v){ var p = v.split('T')[1]; if(!p) return ''; var h = +p.split(':')[0], mi = p.split(':')[1]; if(h === 9 && mi === '00') { } return ((h % 12) || 12) + ':' + mi + (h < 12 ? 'am' : 'pm'); }
  function saveEvent(){
    var t = Q('#evdName').value.trim(); if(!t){ window.dpValidate.showError(Q('#evdName'), 'Give the event a title.'); return; }
    var s = Q('#evdStart').value, en = Q('#evdEnd').value; if(!s){ window.dpValidate.showError(Q('#evdStart'), 'Pick a start.'); return; }
    if(!en || en < s){ window.dpValidate.showError(Q('#evdEnd'), 'End must be after the start.'); return; }
    var rec = {id:cur ? cur.id : 'e' + Date.now(), title:t, date:s.split('T')[0], time:to12(s), cat:'personal', type:Q('#evdType').value, addr:Q('#evdAddr').value.trim(), repeat:Q('#evdRep').value, notes:Q('#evdNotes').value.trim()};
    if(cur) EVENTS[EVENTS.indexOf(cur)] = rec; else EVENTS.push(rec);
    window.dpDialog.close('dlgEvent'); if(Q('#evBody')) paintEv(); if(DV.renderAccount) DV.renderAccount(); toast('success', cur ? 'Event updated' : 'Event added', t + ' · ' + DV.nice(rec.date));
  }
})();
