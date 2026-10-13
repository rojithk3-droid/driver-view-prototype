(function(){
  'use strict';
  var DV = window.DV, Q = DV.Q, QA = DV.QA, esc = DV.esc, on = DV.on, icons = DV.icons, toast = DV.toast, badge = DV.badge, DRV = DV.DRV, TODAY = DV.TODAY, pad = DV.pad, ymd = DV.ymd;

  /* ================================================================
     ONBOARDING — data
     ================================================================ */
  function sub(t, done, o){ o = o || {}; return {id:'s' + Math.random().toString(36).slice(2, 8), title:t, done:!!done, date:done ? '2012-08-28' : '', file:done && o.file ? o.file : '', on:done ? '2023-05-13' : '', by:done ? 'Christian Snead' : '', dateReq:o.dateReq !== false, fileReq:!!o.fileReq}; }
  var STAGES = DV.STAGES = [
    {id:'st1', title:'Application Submitted', dateReq:true, fileReq:true, subs:[sub('Application submitted', true, {file:'application.pdf', fileReq:true}), sub('Lease / own / purchase discussion', true), sub('EIN Federal ID (SS4) on file', false, {fileReq:true})]},
    {id:'st2', title:'Qualified By Insurance', dateReq:true, fileReq:true, subs:[sub('Qualified by insurance', true, {file:'insurance-ok.pdf', fileReq:true})]},
    {id:'st3', title:'Create Foley Profile', dateReq:true, fileReq:false, subs:[sub('Create Foley profile', true)]},
    {id:'st4', title:'Schedule Pre-Employment Drug Test', dateReq:true, fileReq:true, subs:[sub('Schedule pre-employment drug test', true, {file:'drug-test.pdf', fileReq:true})]},
    {id:'st5', title:'Review PSP / MVR / Clearinghouse', dateReq:true, fileReq:true, subs:[sub('PSP report reviewed', true, {fileReq:true}), sub('MVR reviewed', true, {fileReq:true}), sub('Clearinghouse query run', true)]},
    {id:'st6', title:'Verify Credentials: License / Social Security / Medical Certificate', dateReq:true, fileReq:true, subs:[sub('Driver’s license verified', true, {fileReq:true}), sub('Social security card verified', true), sub('Medical certificate (long & short form)', true, {fileReq:true})]},
    {id:'st7', title:'Driver File Requirements', dateReq:true, fileReq:false, subs:[sub('Driver file complete', true)]},
    {id:'st8', title:'DMV File Requirements', dateReq:true, fileReq:false, subs:[sub('DMV file complete', true)]},
    {id:'st9', title:'Insurance Requirements', dateReq:true, fileReq:true, subs:[sub('Insurance requirements met', true, {fileReq:true})]},
    {id:'st10', title:'Onboarding Documentation & Requirements', dateReq:true, fileReq:true, subs:[sub('Onboarding packet signed', true, {fileReq:true}), sub('Direct deposit form on file', false, {fileReq:true}), sub('Uniform & equipment issued', false)]},
    {id:'st11', title:'MANAGER APPROVAL (FINAL)', dateReq:false, fileReq:false, subs:[sub('Manager approval', false, {dateReq:false})]}
  ];
  var onb = {app:'2012-08-23', start:'2012-09-02', status:'Hired', notes:'', open:{st1:true, st10:true}};
  function stageState(s){ var d = s.subs.filter(function(x){ return x.done; }).length; return d === s.subs.length ? 'done' : d ? 'part' : 'todo'; }
  function currentIdx(){
    var last = -1; STAGES.forEach(function(s, i){ if(stageState(s) === 'done') last = i; });
    for(var i = last + 1; i < STAGES.length; i++) if(stageState(STAGES[i]) !== 'done') return i;
    return -1;
  }

  /* ================================================================
     ONBOARDING TAB
     ================================================================ */
  function pipeline(){
    var cur = currentIdx();
    return '<div class="dv-pipe" role="list">' + STAGES.map(function(s, i){
      var st = stageState(s), cls = st === 'done' ? 'done' : (i === cur ? 'cur' : st === 'part' ? 'part' : 'todo');
      var done = s.subs.filter(function(x){ return x.done; }).length;
      return '<button type="button" role="listitem" class="dv-pn ' + cls + '" data-go="' + s.id + '" data-tip="' + esc(s.title) + ' · ' + done + '/' + s.subs.length + '"><span class="dv-pn-d">' + (st === 'done' ? '<i data-lucide="check"></i>' : (i + 1)) + '</span><small>Stage ' + (i + 1) + '</small></button>';
    }).join('') + '</div>';
  }
  function stageRow(s, i){
    var st = stageState(s), done = s.subs.filter(function(x){ return x.done; }).length, open = !!onb.open[s.id], cur = currentIdx() === i;
    var head = '<button type="button" class="dv-sg-h" data-sg="' + s.id + '" aria-expanded="' + open + '"><span class="dv-sg-n ' + (st === 'done' ? 'done' : cur ? 'cur' : '') + '">' + (st === 'done' ? '<i data-lucide="check"></i>' : pad(i + 1)) + '</span><span class="dv-sg-t"><b>' + esc(s.title) + '</b><small>' + done + ' of ' + s.subs.length + ' complete' + (cur ? ' · in progress' : '') + '</small></span>' +
      '<span class="dv-sg-bar"><i style="width:' + (done / s.subs.length * 100) + '%"></i></span>' + (st === 'done' ? badge('success', 'Complete') : cur ? badge('info', 'Current') : st === 'part' ? badge('warning', 'Partial') : badge('', 'Pending')) + '<i data-lucide="chevron-down" class="dv-sg-c"></i></button>';
    var body = open ? '<div class="dv-sg-b"><table class="pay-table dense"><thead><tr><th style="width:62px">Done</th><th>Item</th><th style="width:170px">Date completed</th><th style="width:160px">Attachment</th><th>Completed</th><th class="r" style="width:70px">View</th></tr></thead><tbody>' + s.subs.map(function(x){
      return '<tr><td><label class="switch"><input type="checkbox" data-tg="' + s.id + ':' + x.id + '"' + (x.done ? ' checked' : '') + '><span></span></label></td><td><span class="cell-main">' + esc(x.title) + '</span>' + (x.fileReq || x.dateReq === false ? '<span class="cell-sub">' + (x.fileReq ? 'File required' : '') + (x.fileReq && x.dateReq === false ? ' · ' : '') + (x.dateReq === false ? 'No date needed' : '') + '</span>' : '') + '</td>' +
        '<td>' + (x.dateReq === false ? '<span class="muted">—</span>' : '<input type="date" class="text-input dv-sm" data-dt="' + s.id + ':' + x.id + '" value="' + esc(x.date) + '" aria-label="Date completed">') + '</td>' +
        '<td><button type="button" class="dv-up' + (x.file ? ' has' : '') + '" data-up="' + s.id + ':' + x.id + '"><i data-lucide="' + (x.file ? 'file-check-2' : 'image-up') + '"></i><span>' + (x.file ? esc(x.file) : 'Upload') + '</span></button></td>' +
        '<td>' + (x.done ? '<span class="cell-main" style="font-weight:400">' + DV.nice(x.on) + '</span><span class="cell-sub">' + esc(x.by) + '</span>' : '<span class="muted">—</span>') + '</td>' +
        '<td class="r"><button type="button" class="dv-icbtn" data-vw="' + s.id + ':' + x.id + '" aria-label="View file" data-tip="' + (x.file ? 'Open file' : 'No file yet') + '"' + (x.file ? '' : ' style="opacity:.35"') + '><i data-lucide="file-up"></i></button></td></tr>';
    }).join('') + '</tbody></table></div>' : '';
    return '<div class="dv-sg' + (open ? ' open' : '') + '" id="sg_' + s.id + '">' + head + body + '</div>';
  }
  function daysToOnboard(){ return Math.max(0, DV.daysBetween(DV.fromYmd(onb.app), DV.fromYmd(onb.start))); }
  function paintOnb(){
    var done = STAGES.filter(function(s){ return stageState(s) === 'done'; }).length, pct = Math.round(done / STAGES.length * 100);
    Q('#obPipe').innerHTML = pipeline(); Q('#obPct').textContent = pct + '% complete'; Q('#obCount').textContent = done + ' of ' + STAGES.length + ' stages';
    Q('#obMeter').style.width = pct + '%';
    Q('#obDays').value = daysToOnboard(); Q('#obStages').innerHTML = STAGES.map(stageRow).join('');
    icons();
  }
  DV.renderers.onboarding = function(){
    Q('#pOnboarding').innerHTML = '<div class="stack">' +
      '<div class="card"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">Onboarding record</h2>' + badge('success', 'Hired') + '</div><p class="card-desc">Where ' + esc(DRV.first) + ' is in the hiring pipeline.</p></div>' +
      '<div class="card-head-actions"><button type="button" class="btn-outline" data-size="sm" id="obSettings"><i data-lucide="settings-2"></i> Onboarding settings</button></div></div>' +
      '<div class="card-body"><div class="dv-ob-f"><div>' + DV.inp('obApp', 'Application date', true, 'date') + '</div><div>' + DV.inp('obStart', 'Start date', true, 'date') + '</div>' +
      '<div>' + DV.sel('obStatus', 'Status') + '</div><div>' + DV.inp('obDays', 'Days to onboard', false, 'text', '', ' disabled') + '</div>' +
      '<div class="dv-ob-notes"><label class="field-label" for="obNotes">Notes</label><textarea class="text-input dialog-textarea" id="obNotes" placeholder="Enter" style="min-height:92.5px"></textarea></div></div></div></div>' +
      '<div class="card"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">Pipeline</h2><span class="badge" id="obCount"></span></div><p class="card-desc"><b id="obPct" class="dv-b"></b> · click a stage to jump to it.</p></div></div>' +
      '<div class="card-body"><div class="dv-track"><i id="obMeter"></i></div><div id="obPipe"></div></div></div>' +
      '<div id="obStages" class="dv-sgs"></div></div>';
    DV.opts(Q('#obStatus'), [['Applicant', 'Applicant'], ['Hired', 'Hired'], ['Rejected', 'Rejected']], onb.status);
    Q('#obApp').value = onb.app; Q('#obStart').value = onb.start; Q('#obNotes').value = onb.notes;
    paintOnb();
    on(Q('#obApp'), 'change', function(e){ onb.app = e.target.value; Q('#obDays').value = daysToOnboard(); });
    on(Q('#obStart'), 'change', function(e){ onb.start = e.target.value; Q('#obDays').value = daysToOnboard(); });
    on(Q('#obStatus'), 'change', function(e){ onb.status = e.target.value; toast('success', 'Status saved', 'Onboarding status is ' + onb.status.toLowerCase() + '.'); });
    on(Q('#obNotes'), 'change', function(e){ onb.notes = e.target.value; });
    on(Q('#obSettings'), 'click', openSettings);
    on(Q('#obPipe'), 'click', function(e){ var b = e.target.closest('[data-go]'); if(!b) return; onb.open[b.getAttribute('data-go')] = true; paintOnb(); var t = Q('#sg_' + b.getAttribute('data-go')); if(t) t.scrollIntoView({block:'center', behavior:'smooth'}); });
    var host = Q('#obStages');
    on(host, 'click', function(e){
      var h = e.target.closest('[data-sg]'); if(h){ var id = h.getAttribute('data-sg'); onb.open[id] = !onb.open[id]; paintOnb(); return; }
      var u = e.target.closest('[data-up]'); if(u){ pickFile(u.getAttribute('data-up')); return; }
      var v = e.target.closest('[data-vw]'); if(v){ var p = v.getAttribute('data-vw').split(':'), x = find(p[0], p[1]); if(x.file) toast('success', 'Opening file', x.file); else toast('error', 'No file yet', 'Upload an attachment first.'); }
    });
    on(host, 'change', function(e){
      var t = e.target.closest('[data-tg]'); if(t){ var p = t.getAttribute('data-tg').split(':'), x = find(p[0], p[1]); x.done = t.checked; x.on = x.done ? ymd(TODAY) : ''; x.by = x.done ? 'Christian Snead' : ''; if(x.done && !x.date && x.dateReq !== false) x.date = ymd(TODAY); paintOnb(); var s = STAGES.filter(function(z){ return z.id === p[0]; })[0]; if(stageState(s) === 'done' && x.done) toast('success', 'Stage complete', s.title); return; }
      var d = e.target.closest('[data-dt]'); if(d){ var q = d.getAttribute('data-dt').split(':'); find(q[0], q[1]).date = d.value; }
    });
  };
  function find(sid, id){ return STAGES.filter(function(s){ return s.id === sid; })[0].subs.filter(function(x){ return x.id === id; })[0]; }
  function pickFile(key){
    var inp = Q('#obFile'); if(!inp){ inp = document.createElement('input'); inp.type = 'file'; inp.id = 'obFile'; inp.hidden = true; document.body.appendChild(inp); }
    inp.value = ''; inp.onchange = function(){ var f = inp.files[0]; if(!f) return; var p = key.split(':'), x = find(p[0], p[1]); x.file = f.name; paintOnb(); toast('success', 'Attached', f.name); };
    inp.click();
  }

  /* ================================================================
     ONBOARDING SETTINGS (screen) + ADD / EDIT STAGE (screen)
     ================================================================ */
  function openSettings(){
    DV.showScreen('settings', {title:'Onboarding settings', sub:'The stages every driver moves through, in order.', actions:'<button type="button" class="btn-primary" data-size="sm" id="osAdd"><i data-lucide="plus"></i> Add new stage</button>', back:function(){ DV.showScreen('main'); paintOnb(); }});
    paintSettings();
    on(Q('#osAdd'), 'click', function(){ openStage(null); });
  }
  function paintSettings(){
    Q('#dvScrSettings').innerHTML = '<div class="card"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">Stages</h2><span class="badge">' + STAGES.length + '</span></div><p class="card-desc">Use the arrows to reorder. Changes apply to every driver.</p></div></div><div class="card-body" style="padding:0"><div class="data-grid-scroll"><table class="pay-table dense"><thead><tr><th style="width:80px">Order</th><th>Title</th><th>Sub-stages</th><th>Needs</th><th class="r" style="width:150px">Actions</th></tr></thead><tbody>' +
      STAGES.map(function(s, i){
        return '<tr><td><span class="dv-day">' + (i + 1) + '</span></td><td><b class="dv-b">' + esc(s.title) + '</b></td><td>' + s.subs.length + '</td><td>' + (s.dateReq ? badge('', 'Date') + ' ' : '') + (s.fileReq ? badge('', 'File') : '') + '</td>' +
          '<td><div class="cell-actions"><button type="button" class="dv-icbtn" data-mv="' + s.id + ':-1" aria-label="Move up"' + (i === 0 ? ' disabled style="opacity:.3;pointer-events:none"' : '') + '><i data-lucide="arrow-up"></i></button><button type="button" class="dv-icbtn" data-mv="' + s.id + ':1" aria-label="Move down"' + (i === STAGES.length - 1 ? ' disabled style="opacity:.3;pointer-events:none"' : '') + '><i data-lucide="arrow-down"></i></button>' +
          '<button type="button" class="dv-icbtn" data-ed="' + s.id + '" aria-label="Edit" data-tip="Edit"><i data-lucide="pencil"></i></button><button type="button" class="dv-icbtn danger" data-rm="' + s.id + '" aria-label="Delete" data-tip="Delete"><i data-lucide="trash-2"></i></button></div></td></tr>';
      }).join('') + '</tbody></table></div></div></div>';
    icons();
    var host = Q('#dvScrSettings');
    host.onclick = function(e){
      var m = e.target.closest('[data-mv]'); if(m){ var p = m.getAttribute('data-mv').split(':'), i = STAGES.findIndex ? STAGES.findIndex(function(s){ return s.id === p[0]; }) : 0, j = i + +p[1]; var t = STAGES[i]; STAGES[i] = STAGES[j]; STAGES[j] = t; paintSettings(); return; }
      var ed = e.target.closest('[data-ed]'); if(ed){ openStage(STAGES.filter(function(s){ return s.id === ed.getAttribute('data-ed'); })[0]); return; }
      var rm = e.target.closest('[data-rm]'); if(rm){ var s = STAGES.filter(function(z){ return z.id === rm.getAttribute('data-rm'); })[0]; DV.confirm({title:'Delete “' + s.title + '”?', body:'It disappears from every driver’s onboarding, including completed work.', ok:'Delete stage', danger:true, onOk:function(){ STAGES.splice(STAGES.indexOf(s), 1); paintSettings(); toast('success', 'Stage deleted', s.title); }}); }
    };
  }
  var sf = {rec:null, subs:[]};
  function openStage(rec){
    sf.rec = rec; sf.subs = rec ? rec.subs.map(function(x){ return {title:x.title, dateReq:x.dateReq !== false, fileReq:!!x.fileReq, id:x.id}; }) : [];
    DV.showScreen('stage', {title:rec ? 'Edit stage' : 'Add new stage', sub:'Define the stage, then decide how it applies to drivers already hired.', chip:rec ? 'Stage ' + (STAGES.indexOf(rec) + 1) : '', back:function(){ openSettings(); }});
    var yn = [['Yes', 'Yes'], ['No', 'No']];
    Q('#dvScrStage').innerHTML = '<div class="dv-stage"><div class="stack">' +
      '<div class="card"><div class="card-head with-icon"><div class="card-head-text"><span class="icon-tile"><i data-lucide="layers"></i></span><div><h2 class="card-title">Stage information</h2><p class="card-desc">What the stage is called and what it asks for.</p></div></div></div><div class="card-body"><div class="field">' + DV.inp('sfTitle', 'Title', true, 'text', 'e.g. Road test') + '</div><div class="dialog-row" style="margin-bottom:0">' + DV.sel('sfDate', 'Date required') + DV.sel('sfFile', 'File attachment required') + '</div></div></div>' +
      '<div class="card"><div class="card-head with-icon"><div class="card-head-text"><span class="icon-tile"><i data-lucide="list-tree"></i></span><div><h2 class="card-title">Sub-stages</h2><p class="card-desc">Optional checklist items inside this stage.</p></div></div></div><div class="card-body"><div class="dv-fg c4 dv-add"><div class="full" style="grid-column:span 2">' + DV.inp('sfSub', 'Sub-stage title', false, 'text', 'e.g. Written test passed') + '</div>' + DV.sel('sfSDate', 'Date required') + '<div class="field" style="margin:0"><label class="field-label" for="sfSFile">File required</label><div class="dv-pickrow"><div style="flex:1 1 auto;min-width:0"><select class="select-input" id="sfSFile"></select></div><button type="button" class="dv-plus" id="sfSAdd" aria-label="Add sub-stage" data-tip="Add sub-stage"><i data-lucide="plus"></i></button></div></div></div><ul class="dv-lines" id="sfSubs"></ul></div></div>' +
      '</div><div class="stack"><div class="card"><div class="card-head with-icon"><div class="card-head-text"><span class="icon-tile"><i data-lucide="users-round"></i></span><div><h2 class="card-title">Apply to hired drivers</h2><p class="card-desc">A one-time operation. It cannot be undone.</p></div></div></div><div class="card-body">' +
      '<div class="alert" data-variant="warning" style="margin-bottom:16.25px"><span class="alert-icon"><i data-lucide="triangle-alert"></i></span><div class="alert-body"><h4 class="alert-title">This can change records that are already finished.</h4><button type="button" class="alert-more" data-alert-toggle="sfMore" aria-expanded="false" aria-controls="sfMore">More <i data-lucide="chevron-down"></i></button><p id="sfMore" hidden>Auto-complete this stage and its sub-stages for all currently hired drivers. If a date or file is requested they are left blank for drivers this applies to. Once run it cannot be undone. If you add a new sub-stage later you can run it again, but it only applies to the new sub-stage.</p></div></div>' +
      '<div class="field">' + DV.sel('sfApply', 'Apply to') + '</div><div class="field" id="sfUpdWrap">' + DV.sel('sfUpd', 'Update profiles') + '</div><div class="dv-impact" id="sfImpact"></div></div></div>' +
      '<div class="dv-stage-f"><button type="button" class="btn-outline" id="sfCancel">Cancel</button><button type="button" class="btn-primary" id="sfSubmit">' + (rec ? 'Save stage' : 'Submit') + '</button></div></div></div>';
    DV.opts(Q('#sfDate'), yn, rec && !rec.dateReq ? 'No' : 'Yes'); DV.opts(Q('#sfFile'), yn, rec && !rec.fileReq ? 'No' : 'Yes');
    DV.opts(Q('#sfSDate'), yn, 'Yes'); DV.opts(Q('#sfSFile'), yn, 'No');
    DV.opts(Q('#sfApply'), [['all', 'Apply to all profiles'], ['none', 'Do not apply to existing profiles']], rec ? 'none' : 'all');
    DV.opts(Q('#sfUpd'), [['skip', 'Do not mark complete for previously hired drivers'], ['mark', 'Mark complete for currently / previously hired drivers']], 'skip');
    Q('#sfTitle').value = rec ? rec.title : '';
    function impact(){
      var all = Q('#sfApply').value === 'all'; Q('#sfUpdWrap').hidden = !all;
      var mark = all && Q('#sfUpd').value === 'mark';
      Q('#sfImpact').innerHTML = '<i data-lucide="' + (mark ? 'circle-alert' : 'info') + '"></i><span>' + (!all ? 'Only <b>new hires</b> will see this stage.' : mark ? 'This will mark the stage <b>complete</b> on 14 hired profiles, including ' + esc(DRV.first) + '’s.' : 'The stage will appear as <b>pending</b> on 14 hired profiles.') + '</span>'; icons();
    }
    on(Q('#sfApply'), 'change', impact); on(Q('#sfUpd'), 'change', impact); impact();
    on(Q('.alert-more', Q('#dvScrStage')), 'click', function(){ var p = Q('#sfMore'); p.hidden = !p.hidden; this.setAttribute('aria-expanded', String(!p.hidden)); });
    function paintSubs(){
      Q('#sfSubs').innerHTML = sf.subs.map(function(x, i){ return '<li><span class="dv-ln-u">#' + (i + 1) + '</span><b style="font-weight:500;flex:1 1 auto">' + esc(x.title) + '</b>' + (x.dateReq ? badge('', 'Date') : '') + (x.fileReq ? badge('', 'File') : '') + '<button type="button" class="dv-icbtn danger" data-rs="' + i + '" aria-label="Remove"><i data-lucide="x"></i></button></li>'; }).join('') || '<li class="dv-ln-none">No sub-stages. The stage is completed as a single item.</li>'; icons();
    }
    paintSubs();
    on(Q('#sfSAdd'), 'click', function(){ var t = Q('#sfSub').value.trim(); if(!t){ window.dpValidate.showError(Q('#sfSub'), 'Name the sub-stage.'); return; } sf.subs.push({title:t, dateReq:Q('#sfSDate').value === 'Yes', fileReq:Q('#sfSFile').value === 'Yes', id:'s' + Math.random().toString(36).slice(2, 8)}); Q('#sfSub').value = ''; paintSubs(); });
    on(Q('#sfSubs'), 'click', function(e){ var b = e.target.closest('[data-rs]'); if(b){ sf.subs.splice(+b.getAttribute('data-rs'), 1); paintSubs(); } });
    on(Q('#sfCancel'), 'click', openSettings);
    on(Q('#sfSubmit'), 'click', function(){
      var t = Q('#sfTitle').value.trim(); if(!t){ window.dpValidate.showError(Q('#sfTitle'), 'A stage needs a title.'); Q('#sfTitle').focus(); return; }
      var mark = Q('#sfApply').value === 'all' && Q('#sfUpd').value === 'mark', subs = sf.subs.length ? sf.subs : [{title:t, dateReq:Q('#sfDate').value === 'Yes', fileReq:Q('#sfFile').value === 'Yes', id:'s' + Math.random().toString(36).slice(2, 8)}];
      var made = subs.map(function(x){ var old = rec && rec.subs.filter(function(o){ return o.id === x.id; })[0]; var s = old || sub(x.title, mark, {dateReq:x.dateReq, fileReq:x.fileReq}); s.title = x.title; s.dateReq = x.dateReq; s.fileReq = x.fileReq; if(!old && mark){ s.done = true; s.on = ymd(TODAY); s.by = 'Christian Snead'; s.date = ''; } return s; });
      if(rec){ rec.title = t; rec.dateReq = Q('#sfDate').value === 'Yes'; rec.fileReq = Q('#sfFile').value === 'Yes'; rec.subs = made; }
      else STAGES.push({id:'st' + Date.now(), title:t, dateReq:Q('#sfDate').value === 'Yes', fileReq:Q('#sfFile').value === 'Yes', subs:made});
      toast('success', rec ? 'Stage saved' : 'Stage added', t + (mark ? ' · marked complete for hired drivers' : ''));
      openSettings();
    });
  }
})();
