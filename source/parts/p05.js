(function(){
  'use strict';
  var DV = window.DV, Q = DV.Q, QA = DV.QA, esc = DV.esc, on = DV.on, icons = DV.icons, toast = DV.toast, badge = DV.badge, $m = DV.$m, DRV = DV.DRV, TODAY = DV.TODAY, pad = DV.pad, fmt = DV.fmt, ymd = DV.ymd;

  /* ================================================================
     SHARED: states, overlays, confirm
     ================================================================ */
  DV.STATES = [['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['DC','District of Columbia'],['FL','Florida'],['GA','Georgia'],['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],['MO','Missouri'],['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming']];
  DV.stateName = function(ab){ var s = DV.STATES.filter(function(x){ return x[0] === ab; })[0]; return s ? s[1] : ab; };
  DV.stateAb = function(name){ var s = DV.STATES.filter(function(x){ return x[1] === name; })[0]; return s ? s[0] : name; };
  DV.overlay = function(id, kind, html){
    var o = document.getElementById(id); if(o) return o;
    o = document.createElement('div'); o.id = id; o.className = kind === 'sheet' ? 'sheet-overlay' : 'dialog-overlay'; o.hidden = true; o.innerHTML = html; document.body.appendChild(o); return o;
  };
  var confirmCb = null;
  DV.confirm = function(o){
    DV.overlay('dlgConfirm', 'dialog', '<div class="dialog-panel" role="alertdialog" aria-modal="true" aria-labelledby="cfTitle"><div class="dialog-head"><h2 class="dialog-title" id="cfTitle"></h2><p class="dialog-desc" id="cfBody"></p><button type="button" class="dialog-close" data-dialog-close aria-label="Close"><i data-lucide="x"></i></button></div><div class="dialog-foot"><div class="dialog-foot-actions"><button class="btn-outline" type="button" data-dialog-close>Cancel</button><button class="btn-primary" type="button" id="cfOk">Confirm</button></div></div></div>');
    Q('#cfTitle').textContent = o.title; Q('#cfBody').textContent = o.body; var ok = Q('#cfOk'); ok.textContent = o.ok || 'Confirm';
    ok.className = o.danger ? 'btn' : 'btn-primary'; if(o.danger) ok.setAttribute('data-variant', 'destructive'); else ok.removeAttribute('data-variant');
    confirmCb = o.onOk; window.dpDialog.open('dlgConfirm'); icons();
  };
  document.addEventListener('click', function(e){ if(e.target.closest('#cfOk')){ window.dpDialog.close('dlgConfirm'); var cb = confirmCb; confirmCb = null; if(cb) cb(); } });
  function me(){ return 'Christian Snead'; }
  function sel(id, label, req, extra){ return '<div class="field" style="margin:0"><label class="field-label" for="' + id + '">' + label + (req ? ' <span class="required">*</span>' : '') + '</label><select class="select-input" id="' + id + '"' + (extra || '') + '></select></div>'; }
  function inp(id, label, req, type, ph, extra){ return '<div class="field" style="margin:0"><label class="field-label" for="' + id + '">' + label + (req ? ' <span class="required">*</span>' : '') + '</label><input type="' + (type || 'text') + '" class="text-input" id="' + id + '"' + (ph ? ' placeholder="' + ph + '"' : '') + (extra || '') + '></div>'; }
  DV.sel = sel; DV.inp = inp;
  function stateOpts(){ return [['', 'Select state']].concat(DV.STATES.map(function(s){ return [s[1], s[1]]; })); }
  DV.stateOpts = stateOpts;

  /* ================================================================
     SAFETY & COMPLIANCE
     ================================================================ */
  var SAFE = DV.SAFE = {
    vio:[
      {id:'v1', no:'VIDA 12-98223', date:'2023-01-04', level:'Level 2', state:'Maryland', carrier:'Dawson Truck Lines, Inc', unit:'DTL88', disc:'Written (2nd)', load:'DTL-78912', oos:'Yes', code:'CFR 192.84', points:36, status:'Incomplete', title:'Brake system out of adjustment', notes:'Roadside inspection on I-95 NB.', lines:[{unit:'Truck', oos:'Yes', code:'CFR 192.84', desc:'Brake out of adjustment'}], flags:{hazmat:false, dataq:false, dot:false, towed:false, injury:false}},
      {id:'v2', no:'20230912VA', date:'2023-02-05', level:'Level 1', state:'Virginia', carrier:'Coors Light Express', unit:'CLE12', disc:'Termination (Final)', load:'CLE-145847', oos:'Yes', code:'CFR 184.77', points:12, status:'Complete', title:'Hours-of-service falsification', notes:'', lines:[{unit:'Driver', oos:'Yes', code:'CFR 184.77', desc:'Log falsified'}], flags:{hazmat:false, dataq:true, dot:false, towed:false, injury:false}}
    ],
    cit:[
      {id:'c1', no:'VIDA 12-98223', date:'2023-01-04', level:'Level 2', state:'Maryland', carrier:'Dawson Truck Lines, Inc', unit:'DTL88', disc:'Written (2nd)', load:'DTL-78912', oos:'Yes', code:'CFR 192.84', points:36, status:'Incomplete', title:'Speeding 11–14 over', notes:'', lines:[{unit:'Driver', oos:'No', code:'CFR 392.2', desc:'Speeding'}], flags:{hazmat:false, dataq:false, dot:false, towed:false, injury:false}}
    ],
    acc:[
      {id:'a1', no:'CHIP070723', date:'2023-05-05', type:'Accident', title:'Rear End Accident', load:'DTL-98787', state:'California', injury:'No', drug:'Yes', insured:'Yes', fault:'V2', damage:14500, notes:''}
    ],
    nvr:[]
  };
  var CODES = [['CFR 192.84', 'CFR 192.84 · Brake adjustment', 6], ['CFR 184.77', 'CFR 184.77 · Hours-of-service log', 12], ['CFR 392.2', 'CFR 392.2 · Local traffic laws', 3], ['CFR 395.8(e)', 'CFR 395.8(e) · False report', 10], ['CFR 393.47', 'CFR 393.47 · Brake components', 8], ['CFR 396.3(a)(1)', 'CFR 396.3(a)(1) · Vehicle maintenance', 4], ['CFR 392.16', 'CFR 392.16 · Seat belt', 5]];
  var viewSafe = {};

  function severityRail(r){ return r.status === 'Complete' ? 'ok' : 'open'; }
  function stat(label, value, tone, icon, sub){
    return '<div class="stat" data-tone="' + tone + '"><div class="stat-top"><span class="stat-label">' + label + '</span><span class="stat-icon"><i data-lucide="' + icon + '"></i></span></div><div class="stat-value">' + value + '</div><div class="stat-sub">' + sub + '</div></div>';
  }
  function vioTable(key){
    var list = SAFE[key];
    if(!list.length) return '<div class="empty-state"><div class="empty-icon"><i data-lucide="shield-check"></i></div><h3 class="empty-title">Clean record</h3><p>Nothing has been filed here.</p></div>';
    return '<div class="data-grid-scroll"><table class="pay-table dense"><thead><tr><th>Report</th><th>Inspection</th><th>Carrier &amp; unit</th><th>Violation</th><th>Action</th><th>OOS</th><th>Status</th><th></th></tr></thead><tbody>' + list.map(function(r){
      return '<tr class="dv-rail ' + severityRail(r) + '"><td><a href="#" class="dv-link" data-sv="' + key + ':' + r.id + ':view">' + esc(r.no) + '</a><span class="cell-sub">' + DV.nice(r.date) + '</span></td>' +
        '<td><span class="cell-main">' + esc(r.level) + '</span><span class="cell-sub">' + esc(r.state) + '</span></td>' +
        '<td><span class="cell-main">' + esc(r.carrier) + '</span><span class="cell-sub">' + esc(r.unit) + ' · ' + esc(r.load) + '</span></td>' +
        '<td><span class="cell-main">' + esc(r.code) + '</span><span class="cell-sub">' + r.points + ' points</span></td><td>' + esc(r.disc) + '</td>' +
        '<td>' + badge(r.oos === 'Yes' ? 'danger' : '', r.oos) + '</td><td>' + badge(r.status === 'Complete' ? 'success' : 'warning', r.status) + '</td>' +
        '<td><div class="cell-actions">' + rowActions(key, r.id) + '</div></td></tr>';
    }).join('') + '</tbody></table></div>';
  }
  function rowActions(key, id){
    return '<button type="button" class="dv-icbtn" data-sv="' + key + ':' + id + ':view" aria-label="View" data-tip="View"><i data-lucide="eye"></i></button>' +
      '<button type="button" class="dv-icbtn" data-sv="' + key + ':' + id + ':edit" aria-label="Edit" data-tip="Edit"><i data-lucide="pencil"></i></button>' +
      '<button type="button" class="dv-icbtn danger" data-sv="' + key + ':' + id + ':del" aria-label="Delete" data-tip="Delete"><i data-lucide="trash-2"></i></button>';
  }
  function accTable(){
    var list = SAFE.acc;
    if(!list.length) return '<div class="empty-state"><div class="empty-icon"><i data-lucide="car-front"></i></div><h3 class="empty-title">No incidents</h3><p>Accidents, incidents, claims and injuries appear here.</p></div>';
    return '<div class="data-grid-scroll"><table class="pay-table dense"><thead><tr><th>Report</th><th>Type</th><th>Title</th><th>Load &amp; state</th><th>Injury</th><th>Drug test</th><th>Insured</th><th>Fault</th><th class="r">Damage</th><th></th></tr></thead><tbody>' + list.map(function(r){
      return '<tr class="dv-rail open"><td><a href="#" class="dv-link" data-sv="acc:' + r.id + ':view">' + esc(r.no) + '</a><span class="cell-sub">' + DV.nice(r.date) + '</span></td><td>' + badge('info', r.type) + '</td><td>' + esc(r.title) + '</td>' +
        '<td><span class="cell-main">' + esc(r.load || '—') + '</span><span class="cell-sub">' + esc(r.state || '') + '</span></td><td>' + esc(r.injury) + '</td><td>' + esc(r.drug) + '</td><td>' + esc(r.insured) + '</td><td>' + esc(r.fault) + '</td><td class="r"><b class="dv-b">' + $m(r.damage) + '</b></td>' +
        '<td><div class="cell-actions">' + rowActions('acc', r.id) + '</div></td></tr>';
    }).join('') + '</tbody></table></div>';
  }
  function nvrTable(){
    var list = SAFE.nvr;
    if(!list.length) return '<div class="empty-state"><div class="empty-icon"><i data-lucide="file-text"></i></div><h3 class="empty-title">No reports yet</h3><p>Log coaching notes and other safety reports that are not violations.</p><button class="btn-primary" data-size="sm" type="button" data-add="nvr"><i data-lucide="plus"></i> New report</button></div>';
    return '<div class="data-grid-scroll"><table class="pay-table dense"><thead><tr><th>Title</th><th>Date</th><th>Notes</th><th></th></tr></thead><tbody>' + list.map(function(r){
      return '<tr class="dv-rail open"><td><b class="dv-b">' + esc(r.title) + '</b></td><td>' + DV.nice(r.date) + '</td><td>' + esc(r.notes) + '</td><td><div class="cell-actions"><button type="button" class="dv-icbtn danger" data-sv="nvr:' + r.id + ':del" aria-label="Delete" data-tip="Delete"><i data-lucide="trash-2"></i></button></div></td></tr>';
    }).join('') + '</tbody></table></div>';
  }
  function ledger(key, title, desc, count, add, body){
    return '<div class="card dv-ledger"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">' + title + '</h2><span class="badge">' + count + '</span></div><p class="card-desc">' + desc + '</p></div>' +
      '<div class="card-head-actions"><button type="button" class="btn-primary" data-size="sm" data-add="' + add + '"><i data-lucide="plus"></i> Add</button></div></div><div class="card-body" style="padding:0">' + body + '</div></div>';
  }
  function paintSafety(){
    var all = SAFE.vio.concat(SAFE.cit), open = all.filter(function(r){ return r.status !== 'Complete'; }).length, pts = all.reduce(function(a, r){ return a + (+r.points || 0); }, 0), oos = all.filter(function(r){ return r.oos === 'Yes'; }).length, dmg = SAFE.acc.reduce(function(a, r){ return a + (+r.damage || 0); }, 0);
    Q('#pSafety').innerHTML = '<div class="stats" style="margin-bottom:17.5px">' +
      stat('Open items', open, open ? 'amber' : 'green', 'circle-alert', open ? 'Need follow-up' : 'All resolved') +
      stat('CSA points', pts, pts > 40 ? 'red' : 'amber', 'gauge', 'Across ' + all.length + ' inspections') +
      stat('Out of service', oos, oos ? 'red' : 'green', 'octagon-x', 'Orders on record') +
      stat('Damage estimate', $m(dmg, 0), 'neutral', 'car-front', SAFE.acc.length + ' incident' + (SAFE.acc.length === 1 ? '' : 's')) + '</div>' +
      '<div class="stack">' +
      ledger('vio', 'Driver violations', 'Roadside inspections and their outcomes.', SAFE.vio.length, 'vio', vioTable('vio')) +
      ledger('cit', 'Citations, violations &amp; warnings', 'Tickets and warnings issued to the driver.', SAFE.cit.length, 'cit', vioTable('cit')) +
      ledger('acc', 'Accident, incident, claim &amp; injury', 'Anything that needed an insurance conversation.', SAFE.acc.length, 'acc', accTable()) +
      ledger('nvr', 'Non-violation reports', 'Coaching notes and safety observations.', SAFE.nvr.length, 'nvr', nvrTable()) + '</div>';
    icons();
  }
  DV.renderers.safety = function(){
    paintSafety();
    on(Q('#pSafety'), 'click', function(e){
      var a = e.target.closest('[data-add]'); if(a){ var k = a.getAttribute('data-add'); if(k === 'acc') openAcc(null); else if(k === 'nvr') openNvr(); else openVio(k, null); return; }
      var s = e.target.closest('[data-sv]'); if(!s){ return; } e.preventDefault();
      var p = s.getAttribute('data-sv').split(':'), key = p[0], id = p[1], act = p[2], rec = SAFE[key].filter(function(r){ return r.id === id; })[0];
      if(act === 'del') DV.confirm({title:'Delete this record?', body:'It will be removed from ' + DRV.first + '’s safety file. This cannot be undone.', ok:'Delete', danger:true, onOk:function(){ SAFE[key] = SAFE[key].filter(function(r){ return r.id !== id; }); paintSafety(); toast('success', 'Record deleted', rec.no || rec.title); }});
      else if(act === 'edit') key === 'acc' ? openAcc(rec) : openVio(key, rec);
      else openDetail(key, rec);
    });
  };

  /* ---- violation / citation drawer ---- */
  var vf = {key:'vio', rec:null, lines:[], pUnit:null};
  function buildVio(){
    DV.overlay('shVio', 'sheet', '<div class="sheet-panel" role="dialog" aria-modal="true" aria-labelledby="vfTitle" style="max-width:850px">' +
      '<div class="sheet-head"><div><h2 class="sheet-title" id="vfTitle"></h2><p class="sheet-desc" id="vfDesc"></p></div><button type="button" class="dialog-close" data-dialog-close aria-label="Close" style="position:static"><i data-lucide="x"></i></button></div>' +
      '<div class="sheet-body"><div class="dv-banner" id="vfUnit" hidden></div>' +
      '<section class="dv-fs"><h3><span>1</span> Report</h3><div class="dv-fg">' +
        '<div class="full">' + inp('vfTitleIn', 'Title', false, 'text', 'Short description of what was found') + '</div>' +
        inp('vfNo', 'Report number', true, 'text', 'e.g. VIDA 12-98223') + sel('vfLevel', 'Inspection level') + sel('vfState', 'State') +
        inp('vfDate', 'Inspection date', false, 'date') + inp('vfStart', 'Start time', false, 'datetime-local') + inp('vfEnd', 'End time', false, 'datetime-local') +
        '<div class="full dv-sws" id="vfFlags">' + [['hazmat', 'Hazmat inspection'], ['dataq', 'DataQ'], ['dot', 'DOT crash'], ['towed', 'Towed'], ['injury', 'Injury']].map(function(f){ return '<label class="dv-sw"><span>' + f[1] + '</span><span class="switch"><input type="checkbox" data-flag="' + f[0] + '"><span></span></span></label>'; }).join('') + '</div>' +
      '</div></section>' +
      '<section class="dv-fs"><h3><span>2</span> Unit &amp; load</h3><div class="dv-fg c4">' +
        sel('vfDriver', 'Driver', true) + sel('vfCarrier', 'Motor carrier') + sel('vfTruck', 'Unit 1 (truck)') + sel('vfTrailer', 'Unit 2 (trailer)') +
        sel('vfLoad', 'Load number') + inp('vfTimeW', 'Time weight', false, 'number', '0') + inp('vfSevW', 'Severity weight', false, 'number', '0') + inp('vfTotW', 'Total weight', false, 'number', '0') +
      '</div></section>' +
      '<section class="dv-fs"><h3><span>3</span> Violations</h3><div class="dv-fg c4 dv-add">' +
        sel('vfLUnit', 'Violation unit') + sel('vfLOos', 'Out of service') + sel('vfLCode', 'Violation code') + '<div class="field" style="margin:0"><label class="field-label" for="vfLDesc">Description</label><div class="dv-pickrow"><input type="text" class="text-input" id="vfLDesc" placeholder="What was cited"><button type="button" class="dv-plus" id="vfLAdd" aria-label="Add violation" data-tip="Add violation"><i data-lucide="plus"></i></button></div></div>' +
      '</div><ul class="dv-lines" id="vfLines"></ul></section>' +
      '<section class="dv-fs"><h3><span>4</span> Resolution</h3><div class="dv-fg c3">' +
        sel('vfDisc', 'Disciplinary action') + sel('vfStatus', 'Status') + inp('vfPoints', 'Points', false, 'number', '0') +
        '<div class="full"><label class="field-label">Attachment</label><div class="dropzone dv-dz" id="vfDz"><span class="dropzone-icon"><i data-lucide="upload"></i></span><span class="dropzone-title"><b>Click to upload</b> or drop a file</span><span class="dropzone-hint" id="vfDzHint">PDF or image, up to 10 MB</span></div><input type="file" id="vfFile" hidden></div>' +
        '<div class="full"><label class="field-label" for="vfNotes">Notes</label><textarea class="text-input dialog-textarea" id="vfNotes" placeholder="Anything the safety team should know"></textarea></div>' +
      '</div></section></div>' +
      '<div class="sheet-foot"><span class="grow muted" id="vfNote"></span><button class="btn-outline" type="button" data-dialog-close>Cancel</button><button class="btn-primary" type="button" id="vfSave">Add</button></div></div>');
    DV.opts(Q('#vfLevel'), [['', 'Select level'], ['Level 1', 'Level 1 — Full'], ['Level 2', 'Level 2 — Walk-around'], ['Level 3', 'Level 3 — Driver only'], ['Level 5', 'Level 5 — Vehicle only']], '');
    DV.opts(Q('#vfState'), stateOpts(), '');
    DV.opts(Q('#vfDriver'), [['Falin, Bill', 'Falin, Bill'], ['Queensberry, Micheal', 'Queensberry, Micheal'], ['Hollis, Park', 'Hollis, Park']], 'Falin, Bill');
    DV.opts(Q('#vfCarrier'), [['Dawson Truck Lines', 'Dawson Truck Lines'], ['Coors Light Express', 'Coors Light Express']], 'Dawson Truck Lines');
    DV.opts(Q('#vfTrailer'), [['', 'None']].concat(DV.TRAILERS.map(function(t){ return [t.id, t.id]; })), '');
    DV.opts(Q('#vfLoad'), [['', 'Select load number']].concat(DV.LOADS.filter(function(l){ return !l.off; }).map(function(l){ return [l.id, l.id]; })), '');
    DV.opts(Q('#vfLUnit'), [['Driver', 'Driver'], ['Truck', 'Truck'], ['Trailer', 'Trailer']], 'Driver');
    DV.opts(Q('#vfLOos'), [['No', 'No'], ['Yes', 'Yes']], 'No');
    DV.opts(Q('#vfLCode'), [['', 'Select violation code']].concat(CODES.map(function(c){ return [c[0], c[1]]; })), '');
    DV.opts(Q('#vfDisc'), [['None', 'None'], ['Verbal warning', 'Verbal warning'], ['Written (1st)', 'Written (1st)'], ['Written (2nd)', 'Written (2nd)'], ['Suspension', 'Suspension'], ['Termination (Final)', 'Termination (Final)']], 'None');
    DV.opts(Q('#vfStatus'), [['Incomplete', 'Incomplete'], ['Complete', 'Complete']], 'Incomplete');
    on(Q('#vfLUnit'), 'change', unitBanner);
    on(Q('#vfLAdd'), 'click', function(){
      var code = Q('#vfLCode').value; if(!code){ window.dpValidate.showError(Q('#vfLCode'), 'Pick a violation code.'); return; }
      vf.lines.push({unit:Q('#vfLUnit').value, oos:Q('#vfLOos').value, code:code, desc:Q('#vfLDesc').value.trim()}); Q('#vfLDesc').value = ''; DV.setSel(Q('#vfLCode'), ''); paintLines();
    });
    on(Q('#vfLines'), 'click', function(e){ var b = e.target.closest('[data-rm]'); if(!b) return; vf.lines.splice(+b.getAttribute('data-rm'), 1); paintLines(); });
    on(Q('#vfDz'), 'click', function(){ Q('#vfFile').click(); });
    on(Q('#vfFile'), 'change', function(e){ var f = e.target.files[0]; if(f) Q('#vfDzHint').textContent = f.name + ' · ' + Math.max(1, Math.round(f.size / 1024)) + ' KB'; });
    on(Q('#vfSave'), 'click', saveVio);
  }
  DV.setSel = function(s, v){ window.dpSetSelect(s, v); };
  function unitBanner(){
    var b = Q('#vfUnit'), u = Q('#vfLUnit').value, t = DV.TRUCKS.filter(function(x){ return DV.st.truck && x.id === DV.st.truck.id; })[0];
    if(u === 'Truck'){ b.hidden = false; b.innerHTML = t ? '<span><i data-lucide="truck"></i> Unit 1 (truck)</span><b>' + esc(t.make.toUpperCase()) + '</b><b>' + t.yr + '</b><b>' + esc(t.vin) + '</b>' : '<span><i data-lucide="truck"></i> Unit 1 (truck)</span><em>No truck is assigned to this driver yet.</em>'; }
    else if(u === 'Trailer'){ var tr = DV.TRAILERS.filter(function(x){ return DV.st.trailer && x.id === DV.st.trailer.id; })[0]; b.hidden = false; b.innerHTML = tr ? '<span><i data-lucide="container"></i> Unit 2 (trailer)</span><b>' + esc(tr.id) + '</b><b>' + esc(tr.type) + '</b>' : '<span><i data-lucide="container"></i> Unit 2 (trailer)</span><em>No trailer is attached to this driver yet.</em>'; }
    else b.hidden = true;
    var tk = Q('#vfTruck'); DV.opts(tk, [['', 'None']].concat(DV.TRUCKS.map(function(x){ return [x.id, x.id]; })), tk.value || (DV.st.truck ? DV.st.truck.id : ''));
    icons();
  }
  function paintLines(){
    Q('#vfLines').innerHTML = vf.lines.map(function(l, i){
      return '<li><span class="dv-ln-u">' + esc(l.unit) + '</span><b>' + esc(l.code) + '</b><span class="dv-ln-d">' + esc(l.desc || 'No description') + '</span>' + badge(l.oos === 'Yes' ? 'danger' : '', 'OOS ' + l.oos) + '<button type="button" class="dv-icbtn danger" data-rm="' + i + '" aria-label="Remove"><i data-lucide="x"></i></button></li>';
    }).join('') || '<li class="dv-ln-none">No violations added yet.</li>';
    var pts = vf.lines.reduce(function(a, l){ var c = CODES.filter(function(x){ return x[0] === l.code; })[0]; return a + (c ? c[2] : 0); }, 0);
    if(vf.lines.length && !Q('#vfPoints').getAttribute('data-touched')) Q('#vfPoints').value = pts;
    icons();
  }
  function openVio(key, rec){
    buildVio(); vf.key = key; vf.rec = rec; vf.lines = rec ? rec.lines.slice() : [];
    Q('#vfTitle').textContent = (rec ? 'Edit ' : 'Add ') + (key === 'vio' ? 'driver violation' : 'citation / warning');
    Q('#vfDesc').textContent = key === 'vio' ? 'Record the inspection, the unit involved and each violation found.' : 'Log a citation or warning and how it was handled.';
    Q('#vfSave').textContent = rec ? 'Save changes' : 'Add'; Q('#vfNote').textContent = 'Filed by ' + me();
    var r = rec || {};
    Q('#vfTitleIn').value = r.title || ''; Q('#vfNo').value = r.no || ''; DV.setSel(Q('#vfLevel'), r.level || ''); DV.setSel(Q('#vfState'), r.state || '');
    Q('#vfDate').value = r.date || ymd(TODAY); Q('#vfStart').value = (r.date || ymd(TODAY)) + 'T08:00'; Q('#vfEnd').value = (r.date || ymd(TODAY)) + 'T09:00';
    DV.setSel(Q('#vfDriver'), 'Falin, Bill'); DV.setSel(Q('#vfCarrier'), r.carrier && r.carrier.indexOf('Coors') === 0 ? 'Coors Light Express' : 'Dawson Truck Lines');
    DV.setSel(Q('#vfLoad'), r.load && DV.LOADS.some(function(l){ return l.id === r.load; }) ? r.load : '');
    DV.setSel(Q('#vfDisc'), r.disc || 'None'); DV.setSel(Q('#vfStatus'), r.status || 'Incomplete');
    Q('#vfPoints').value = r.points != null ? r.points : ''; Q('#vfPoints').removeAttribute('data-touched'); on(Q('#vfPoints'), 'input', function(){ this.setAttribute('data-touched', '1'); });
    Q('#vfNotes').value = r.notes || ''; Q('#vfTimeW').value = ''; Q('#vfSevW').value = ''; Q('#vfTotW').value = '';
    QA('#vfFlags input').forEach(function(c){ c.checked = !!(r.flags && r.flags[c.getAttribute('data-flag')]); });
    Q('#vfDzHint').textContent = 'PDF or image, up to 10 MB';
    DV.setSel(Q('#vfLUnit'), 'Driver'); unitBanner(); DV.setSel(Q('#vfTruck'), r.unit && DV.TRUCKS.some(function(t){ return t.id === r.unit; }) ? r.unit : (DV.st.truck ? DV.st.truck.id : ''));
    DV.setSel(Q('#vfTrailer'), DV.st.trailer ? DV.st.trailer.id : '');
    paintLines(); window.dpDialog.open('shVio');
  }
  function saveVio(){
    var no = Q('#vfNo').value.trim(); if(!no){ window.dpValidate.showError(Q('#vfNo'), 'Report number is required.'); Q('#vfNo').focus(); return; }
    var flags = {}; QA('#vfFlags input').forEach(function(c){ flags[c.getAttribute('data-flag')] = c.checked; });
    var first = vf.lines[0] || {};
    var rec = {id:vf.rec ? vf.rec.id : vf.key[0] + Date.now(), no:no, date:Q('#vfDate').value || ymd(TODAY), level:Q('#vfLevel').value || '—', state:Q('#vfState').value || '—', carrier:Q('#vfCarrier').value === 'Dawson Truck Lines' ? 'Dawson Truck Lines, Inc' : Q('#vfCarrier').value,
      unit:Q('#vfTruck').value || '—', disc:Q('#vfDisc').value, load:Q('#vfLoad').value || '—', oos:vf.lines.some(function(l){ return l.oos === 'Yes'; }) ? 'Yes' : 'No', code:first.code || '—', points:+Q('#vfPoints').value || 0, status:Q('#vfStatus').value,
      title:Q('#vfTitleIn').value.trim(), notes:Q('#vfNotes').value.trim(), lines:vf.lines.slice(), flags:flags};
    var arr = SAFE[vf.key]; if(vf.rec) arr[arr.indexOf(vf.rec)] = rec; else arr.unshift(rec);
    window.dpDialog.close('shVio'); paintSafety(); toast('success', vf.rec ? 'Record updated' : 'Record added', no);
  }

  /* ---- accident / incident / claim / injury dialog ---- */
  var af = {rec:null};
  function openAcc(rec){
    af.rec = rec;
    DV.overlay('dlgAcc', 'dialog', '<div class="dialog-panel dialog-wide" role="dialog" aria-modal="true" aria-labelledby="afTitle"><div class="dialog-head"><h2 class="dialog-title" id="afTitle"></h2><p class="dialog-desc">Capture what happened while it is fresh; insurance needs the same facts.</p><button type="button" class="dialog-close" data-dialog-close aria-label="Close"><i data-lucide="x"></i></button></div>' +
      '<div class="dialog-body"><div class="dialog-field">' + inp('afName', 'Title', true, 'text', 'What happened') + '</div>' +
      '<div class="dialog-row">' + inp('afDate', 'Date', false, 'date') + inp('afNo', 'Report number', false, 'text', 'Enter number') + '</div>' +
      '<div class="dialog-row">' + sel('afType', 'Type') + inp('afLoad', 'Load number', false, 'text', 'Enter number') + '</div>' +
      '<div class="dialog-row">' + sel('afState', 'State') + sel('afInjury', 'Injury') + '</div>' +
      '<div class="dialog-row">' + inp('afFault', 'Fault', false, 'text', 'e.g. V2') + sel('afDrug', 'Drug test required') + '</div>' +
      '<div class="dialog-row">' + sel('afIns', 'File on insurance') + '<div class="field" style="margin:0"><label class="field-label" for="afDmg">Damage estimate</label><div class="unit-input"><span style="border-left:none;border-right:1.25px solid var(--input-border)">$</span><input type="number" id="afDmg" placeholder="0.00"></div></div></div>' +
      '<div class="dialog-field"><label class="field-label" for="afNotes">Notes</label><textarea class="text-input dialog-textarea" id="afNotes" placeholder="Enter"></textarea></div>' +
      '<div class="dropzone dv-dz" id="afDz" style="padding:20px"><span class="dropzone-icon"><i data-lucide="paperclip"></i></span><span class="dropzone-title"><b>Drag and drop</b> a file here or click to browse</span><span class="dropzone-hint" id="afDzHint">Photos, police report, estimates</span></div><input type="file" id="afFile" hidden></div>' +
      '<div class="dialog-foot has-note"><span class="dialog-foot-note"><i data-lucide="user-round"></i> <span>Filed by ' + me() + '</span></span><div class="dialog-foot-actions"><button class="btn-outline" type="button" data-dialog-close>Cancel</button><button class="btn-primary" type="button" id="afSave">Add</button></div></div></div>');
    if(!Q('#afType').options.length){
      DV.opts(Q('#afType'), [['', 'Select type'], ['Accident', 'Accident'], ['Incident', 'Incident'], ['Claim', 'Claim'], ['Injury', 'Injury']], '');
      DV.opts(Q('#afState'), stateOpts(), ''); DV.opts(Q('#afInjury'), [['No', 'No'], ['Yes', 'Yes']], 'No'); DV.opts(Q('#afDrug'), [['No', 'No'], ['Yes', 'Yes']], 'No'); DV.opts(Q('#afIns'), [['No', 'No'], ['Yes', 'Yes']], 'No');
      on(Q('#afDz'), 'click', function(){ Q('#afFile').click(); });
      on(Q('#afFile'), 'change', function(e){ var f = e.target.files[0]; if(f) Q('#afDzHint').textContent = f.name; });
      on(Q('#afSave'), 'click', saveAcc);
    }
    var r = rec || {};
    Q('#afTitle').textContent = rec ? 'Edit ' + (r.type || 'accident').toLowerCase() : 'Add accident / incident / claim / injury'; Q('#afSave').textContent = rec ? 'Save changes' : 'Add';
    Q('#afName').value = r.title || ''; Q('#afDate').value = r.date || ymd(TODAY); Q('#afNo').value = r.no || ''; DV.setSel(Q('#afType'), r.type || ''); Q('#afLoad').value = r.load || '';
    DV.setSel(Q('#afState'), r.state || ''); DV.setSel(Q('#afInjury'), r.injury || 'No'); Q('#afFault').value = r.fault || ''; DV.setSel(Q('#afDrug'), r.drug || 'No'); DV.setSel(Q('#afIns'), r.insured || 'No');
    Q('#afDmg').value = r.damage != null ? r.damage : ''; Q('#afNotes').value = r.notes || '';
    window.dpDialog.open('dlgAcc');
  }
  function saveAcc(){
    var t = Q('#afName').value.trim(); if(!t){ window.dpValidate.showError(Q('#afName'), 'Give it a title.'); return; }
    var type = Q('#afType').value; if(!type){ window.dpValidate.showError(Q('#afType'), 'Pick a type.'); return; }
    var rec = {id:af.rec ? af.rec.id : 'a' + Date.now(), no:Q('#afNo').value.trim() || 'RPT' + String(Date.now()).slice(-6), date:Q('#afDate').value || ymd(TODAY), type:type, title:t, load:Q('#afLoad').value.trim(), state:Q('#afState').value, injury:Q('#afInjury').value, drug:Q('#afDrug').value, insured:Q('#afIns').value, fault:Q('#afFault').value.trim() || '—', damage:+Q('#afDmg').value || 0, notes:Q('#afNotes').value.trim()};
    if(af.rec) SAFE.acc[SAFE.acc.indexOf(af.rec)] = rec; else SAFE.acc.unshift(rec);
    window.dpDialog.close('dlgAcc'); paintSafety(); toast('success', af.rec ? 'Record updated' : type + ' logged', rec.no);
  }
  function openNvr(){
    DV.overlay('dlgNvr', 'dialog', '<div class="dialog-panel" role="dialog" aria-modal="true" aria-labelledby="nvTitle"><div class="dialog-head"><h2 class="dialog-title" id="nvTitle">New safety report</h2><p class="dialog-desc">Coaching notes and observations that are not violations.</p><button type="button" class="dialog-close" data-dialog-close aria-label="Close"><i data-lucide="x"></i></button></div><div class="dialog-body"><div class="dialog-field">' + inp('nvName', 'Title', true, 'text', 'e.g. Ride-along feedback') + '</div><div class="dialog-field">' + inp('nvDate', 'Date', false, 'date') + '</div><div class="dialog-field" style="margin-bottom:0"><label class="field-label" for="nvNotes">Notes</label><textarea class="text-input dialog-textarea" id="nvNotes"></textarea></div></div><div class="dialog-foot"><div class="dialog-foot-actions"><button class="btn-outline" type="button" data-dialog-close>Cancel</button><button class="btn-primary" type="button" id="nvSave">Add report</button></div></div></div>');
    Q('#nvName').value = ''; Q('#nvNotes').value = ''; Q('#nvDate').value = ymd(TODAY);
    if(!Q('#nvSave')._w){ Q('#nvSave')._w = 1; on(Q('#nvSave'), 'click', function(){ var t = Q('#nvName').value.trim(); if(!t){ window.dpValidate.showError(Q('#nvName'), 'Give it a title.'); return; } SAFE.nvr.unshift({id:'n' + Date.now(), title:t, date:Q('#nvDate').value, notes:Q('#nvNotes').value.trim()}); window.dpDialog.close('dlgNvr'); paintSafety(); toast('success', 'Report added', t); }); }
    window.dpDialog.open('dlgNvr');
  }
  function openDetail(key, r){
    var rows = key === 'acc' ? [['Report number', r.no], ['Date', DV.nice(r.date)], ['Type', r.type], ['Title', r.title], ['Load', r.load || '—'], ['State', r.state || '—'], ['Injury', r.injury], ['Drug test required', r.drug], ['File on insurance', r.insured], ['Fault', r.fault], ['Damage estimate', $m(r.damage)]] :
      [['Report number', r.no], ['Date', DV.nice(r.date)], ['Inspection level', r.level], ['State', r.state], ['Carrier', r.carrier], ['Unit', r.unit], ['Load', r.load], ['Out of service', r.oos], ['Violation code', r.code], ['Points', r.points], ['Disciplinary action', r.disc], ['Status', r.status]];
    DV.overlay('shDetail', 'sheet', '<div class="sheet-panel" role="dialog" aria-modal="true" aria-labelledby="sdTitle" style="max-width:550px"><div class="sheet-head"><div><h2 class="sheet-title" id="sdTitle"></h2><p class="sheet-desc" id="sdDesc"></p></div><button type="button" class="dialog-close" data-dialog-close aria-label="Close" style="position:static"><i data-lucide="x"></i></button></div><div class="sheet-body" id="sdBody"></div><div class="sheet-foot"><button class="btn-outline" type="button" data-dialog-close>Close</button><button class="btn-primary" type="button" id="sdEdit"><i data-lucide="pencil"></i> Edit</button></div></div>');
    Q('#sdTitle').textContent = r.no; Q('#sdDesc').textContent = key === 'acc' ? r.type + ' · ' + DV.nice(r.date) : (key === 'vio' ? 'Driver violation' : 'Citation / warning') + ' · ' + DV.nice(r.date);
    var extra = '';
    if(r.lines && r.lines.length) extra += '<p class="sec-label" style="margin-top:20px">Violations</p><ul class="dv-lines">' + r.lines.map(function(l){ return '<li><span class="dv-ln-u">' + esc(l.unit) + '</span><b>' + esc(l.code) + '</b><span class="dv-ln-d">' + esc(l.desc || '—') + '</span>' + badge(l.oos === 'Yes' ? 'danger' : '', 'OOS ' + l.oos) + '</li>'; }).join('') + '</ul>';
    if(r.notes) extra += '<p class="sec-label" style="margin-top:20px">Notes</p><p class="dv-note">' + esc(r.notes) + '</p>';
    Q('#sdBody').innerHTML = '<ul class="kv">' + rows.map(function(x){ return '<li><span class="k">' + x[0] + '</span><span class="v">' + esc(x[1]) + '</span></li>'; }).join('') + '</ul>' + extra;
    Q('#sdEdit').onclick = function(){ window.dpDialog.close('shDetail'); key === 'acc' ? openAcc(r) : openVio(key, r); };
    window.dpDialog.open('shDetail');
  }

  /* ================================================================
     DOCUMENTS
     ================================================================ */
  var DOCTYPES = ['Signed Bill of Lading', 'Driver’s license', 'Medical certificate', 'MVR report', 'W-9', 'Drug test result', 'Insurance card', 'Profile image'];
  var DOCS = DV.DOCS = [
    {id:'d1', name:'Profile Image', type:'Profile image', by:'Christian Snead', date:'2023-04-24', status:'Approved', req:'Christian Snead', appr:'', access:'All users', file:'profile.jpg'}
  ];
  var dq = {q:'', st:'All'};
  var DSTAT = {Approved:['success', 'green'], Requested:['warning', 'amber'], 'Pending approval':['info', 'blue']};
  function paintDocs(){
    var q = dq.q.toLowerCase();
    var rows = DOCS.filter(function(d){ return (dq.st === 'All' || d.status === dq.st) && (!q || (d.name + ' ' + d.by + ' ' + d.type).toLowerCase().indexOf(q) > -1); });
    Q('#dcCount').textContent = rows.length;
    Q('#dcBody').innerHTML = rows.map(function(d){
      var pend = d.status === 'Requested', appr = d.status === 'Pending approval';
      return '<tr><td><span class="dv-doc"><span class="dv-doc-ic"><i data-lucide="' + (d.status === 'Requested' ? 'file-clock' : 'file-text') + '"></i></span><span><b>' + esc(d.name) + '</b><small>' + esc(d.type) + '</small></span></span></td>' +
        '<td><span class="dv-who"><span class="av" data-size="sm" data-c="2">' + window.dpInitials(d.by) + '</span>' + esc(d.by) + '</span></td><td>' + DV.nice(d.date) + '</td>' +
        '<td><span class="dv-st"><span class="sdot ' + DSTAT[d.status][1] + '"></span>' + d.status + '</span></td><td>' + esc(d.req) + '</td><td>' + (d.appr ? esc(d.appr) : '<span class="muted">—</span>') + '</td><td>' + badge('', d.access) + '</td>' +
        '<td><div class="cell-actions">' + (appr ? '<button type="button" class="btn-outline" data-size="sm" data-dc="' + d.id + ':approve"><i data-lucide="check"></i> Approve</button>' : '') +
        '<button type="button" class="dv-icbtn" data-dc="' + d.id + ':view" aria-label="View" data-tip="View"' + (pend ? ' disabled style="opacity:.4;pointer-events:none"' : '') + '><i data-lucide="eye"></i></button>' +
        '<button type="button" class="dv-icbtn" data-dc="' + d.id + ':up" aria-label="Upload" data-tip="' + (pend ? 'Upload on their behalf' : 'Replace file') + '"><i data-lucide="upload"></i></button>' +
        '<button type="button" class="dv-icbtn danger" data-dc="' + d.id + ':del" aria-label="Delete" data-tip="Delete"><i data-lucide="trash-2"></i></button></div></td></tr>';
    }).join('') || '<tr><td colspan="8"><div class="dv-none" style="text-align:center">No documents match.</div></td></tr>';
    icons();
  }
  DV.renderers.documents = function(){
    Q('#pDocuments').innerHTML = '<div class="card"><div class="card-head"><div class="card-head-text"><div class="card-title-row"><h2 class="card-title">Documents</h2><span class="badge" id="dcCount">0</span></div><p class="card-desc">Everything on file for ' + esc(DRV.first) + ', and what is still outstanding.</p></div>' +
      '<div class="card-head-actions"><div class="dv-search" style="width:225px"><i data-lucide="search"></i><input type="text" class="text-input" id="dcQ" placeholder="Search documents" aria-label="Search documents"></div><select class="select-input" id="dcSt" aria-label="Status" style="min-width:135px"></select>' +
      '<button type="button" class="btn-outline" data-size="sm" id="dcNew"><i data-lucide="file-plus-2"></i> New document</button><button type="button" class="btn-primary" data-size="sm" id="dcReq"><i data-lucide="send"></i> Request document</button></div></div>' +
      '<div class="card-body" style="padding:0"><div class="data-grid-scroll"><table class="pay-table dense"><thead><tr><th>Name</th><th>Created by</th><th>Date</th><th>Status</th><th>Requested by</th><th>Approved by</th><th>Access</th><th></th></tr></thead><tbody id="dcBody"></tbody></table></div></div></div>';
    DV.opts(Q('#dcSt'), [['All', 'All statuses'], ['Approved', 'Approved'], ['Requested', 'Requested'], ['Pending approval', 'Pending approval']], 'All');
    paintDocs();
    on(Q('#dcQ'), 'input', function(e){ dq.q = e.target.value.trim(); paintDocs(); });
    on(Q('#dcSt'), 'change', function(e){ dq.st = e.target.value; paintDocs(); });
    on(Q('#dcNew'), 'click', openNewDoc); on(Q('#dcReq'), 'click', openReq);
    on(Q('#dcBody'), 'click', function(e){
      var b = e.target.closest('[data-dc]'); if(!b) return;
      var p = b.getAttribute('data-dc').split(':'), d = DOCS.filter(function(x){ return x.id === p[0]; })[0];
      if(p[1] === 'del') DV.confirm({title:'Delete “' + d.name + '”?', body:'The file and its request history will be removed.', ok:'Delete', danger:true, onOk:function(){ DOCS.splice(DOCS.indexOf(d), 1); paintDocs(); toast('success', 'Document deleted', d.name); }});
      else if(p[1] === 'view') previewDoc(d);
      else if(p[1] === 'up') uploadDoc(d);
      else if(p[1] === 'approve'){ d.status = 'Approved'; d.appr = me(); paintDocs(); toast('success', 'Approved', d.name + ' is now on file.'); }
    });
  };
  function previewDoc(d){
    DV.overlay('dlgPrev', 'dialog', '<div class="dialog-panel dialog-wide" role="dialog" aria-modal="true" aria-labelledby="pvTitle"><div class="dialog-head"><h2 class="dialog-title" id="pvTitle"></h2><p class="dialog-desc" id="pvDesc"></p><button type="button" class="dialog-close" data-dialog-close aria-label="Close"><i data-lucide="x"></i></button></div><div class="dialog-body" id="pvBody"></div><div class="dialog-foot"><div class="dialog-foot-actions"><button class="btn-outline" type="button" data-dialog-close>Close</button><button class="btn-primary" type="button" id="pvDl"><i data-lucide="download"></i> Download</button></div></div></div>');
    Q('#pvTitle').textContent = d.name; Q('#pvDesc').textContent = d.type + ' · added ' + DV.nice(d.date);
    Q('#pvBody').innerHTML = '<div class="dv-prev"><div class="dv-prev-pg"><i data-lucide="file-text"></i><b>' + esc(d.file || d.name) + '</b><span>Preview is not available in this prototype</span></div><ul class="kv"><li><span class="k">Created by</span><span class="v">' + esc(d.by) + '</span></li><li><span class="k">Status</span><span class="v">' + d.status + '</span></li><li><span class="k">Access</span><span class="v">' + esc(d.access) + '</span></li><li><span class="k">Requested by</span><span class="v">' + esc(d.req) + '</span></li></ul></div>';
    Q('#pvDl').onclick = function(){ toast('success', 'Download started', d.file || d.name); };
    window.dpDialog.open('dlgPrev'); icons();
  }
  function uploadDoc(d){
    DV.overlay('dlgUp', 'dialog', '<div class="dialog-panel" role="dialog" aria-modal="true" aria-labelledby="upTitle"><div class="dialog-head"><h2 class="dialog-title" id="upTitle"></h2><p class="dialog-desc" id="upDesc"></p><button type="button" class="dialog-close" data-dialog-close aria-label="Close"><i data-lucide="x"></i></button></div><div class="dialog-body"><div class="dropzone" id="upDz"><span class="dropzone-icon"><i data-lucide="upload"></i></span><span class="dropzone-title"><b>Click to upload</b> or drop a file</span><span class="dropzone-hint" id="upHint">PDF or image, up to 10 MB</span></div><input type="file" id="upFile" hidden></div><div class="dialog-foot"><div class="dialog-foot-actions"><button class="btn-outline" type="button" data-dialog-close>Cancel</button><button class="btn-primary" type="button" id="upSave">Upload</button></div></div></div>');
    Q('#upTitle').textContent = d.status === 'Requested' ? 'Upload “' + d.name + '”' : 'Replace “' + d.name + '”'; Q('#upDesc').textContent = d.status === 'Requested' ? 'Upload it on ' + DRV.first + '’s behalf to close the request.' : 'The previous file is kept in history.'; Q('#upHint').textContent = 'PDF or image, up to 10 MB';
    Q('#upDz').onclick = function(){ Q('#upFile').click(); }; Q('#upFile').onchange = function(e){ var f = e.target.files[0]; if(f){ Q('#upHint').textContent = f.name; Q('#upFile')._n = f.name; } };
    Q('#upSave').onclick = function(){ d.file = Q('#upFile')._n || d.name.toLowerCase().replace(/\W+/g, '-') + '.pdf'; d.status = d.needAppr ? 'Pending approval' : 'Approved'; if(d.status === 'Approved') d.appr = me(); d.date = ymd(TODAY); window.dpDialog.close('dlgUp'); paintDocs(); toast('success', 'Uploaded', d.name + ' is ' + d.status.toLowerCase() + '.'); };
    window.dpDialog.open('dlgUp'); icons();
  }
  function openNewDoc(){
    DV.overlay('dlgNewDoc', 'dialog', '<div class="dialog-panel" role="dialog" aria-modal="true" aria-labelledby="ndTitle"><div class="dialog-head"><h2 class="dialog-title" id="ndTitle">New document</h2><p class="dialog-desc">Add a file to ' + esc(DRV.first) + '’s record.</p><button type="button" class="dialog-close" data-dialog-close aria-label="Close"><i data-lucide="x"></i></button></div><div class="dialog-body"><div class="dialog-field">' + inp('ndName', 'Name', true, 'text', 'e.g. 2023 medical card') + '</div><div class="dialog-row">' + sel('ndType', 'Type') + sel('ndAccess', 'Who can see it') + '</div><div class="dropzone" id="ndDz"><span class="dropzone-icon"><i data-lucide="upload"></i></span><span class="dropzone-title"><b>Click to upload</b> or drop a file</span><span class="dropzone-hint" id="ndHint">PDF or image, up to 10 MB</span></div><input type="file" id="ndFile" hidden></div><div class="dialog-foot has-note"><span class="dialog-foot-note"><i data-lucide="user-round"></i> <span>Created by ' + me() + '</span></span><div class="dialog-foot-actions"><button class="btn-outline" type="button" data-dialog-close>Cancel</button><button class="btn-primary" type="button" id="ndSave">Add document</button></div></div></div>');
    DV.opts(Q('#ndType'), DOCTYPES.map(function(t){ return [t, t]; }), DOCTYPES[0]); DV.opts(Q('#ndAccess'), ['All users', 'Dispatch only', 'Safety only', 'Driver + managers'].map(function(t){ return [t, t]; }), 'All users');
    Q('#ndName').value = ''; Q('#ndHint').textContent = 'PDF or image, up to 10 MB'; Q('#ndFile')._n = '';
    if(!Q('#ndSave')._w){ Q('#ndSave')._w = 1;
      on(Q('#ndDz'), 'click', function(){ Q('#ndFile').click(); }); on(Q('#ndFile'), 'change', function(e){ var f = e.target.files[0]; if(f){ Q('#ndHint').textContent = f.name; Q('#ndFile')._n = f.name; if(!Q('#ndName').value) Q('#ndName').value = f.name.replace(/\.[^.]+$/, ''); } });
      on(Q('#ndSave'), 'click', function(){ var n = Q('#ndName').value.trim(); if(!n){ window.dpValidate.showError(Q('#ndName'), 'Name the document.'); return; } DOCS.unshift({id:'d' + Date.now(), name:n, type:Q('#ndType').value, by:me(), date:ymd(TODAY), status:'Approved', req:me(), appr:'', access:Q('#ndAccess').value, file:Q('#ndFile')._n || n + '.pdf'}); window.dpDialog.close('dlgNewDoc'); paintDocs(); toast('success', 'Document added', n); }); }
    window.dpDialog.open('dlgNewDoc');
  }
  var pType, rq = {remind:'24', custom:'', repeat:false};
  function openReq(){
    DV.overlay('dlgReq', 'dialog', '<div class="dialog-panel dialog-wide" role="dialog" aria-modal="true" aria-labelledby="rqTitle"><div class="dialog-head"><h2 class="dialog-title" id="rqTitle">Request a document</h2><p class="dialog-desc">We will message the driver and keep nudging until it arrives.</p><button type="button" class="dialog-close" data-dialog-close aria-label="Close"><i data-lucide="x"></i></button></div><div class="dialog-body">' +
      '<div class="dialog-row">' + sel('rqDriver', 'Driver') + '<div class="field" style="margin:0"><label class="field-label">Document type <span class="required">*</span></label><div class="dv-pickrow"><div id="rqType"></div><button type="button" class="dv-plus" id="rqPlus" aria-label="Add a document type" data-tip="Add a type"><i data-lucide="plus"></i></button></div></div></div>' +
      '<div class="dialog-field"><label class="field-label" for="rqNotes">Request notes</label><textarea class="text-input dialog-textarea" id="rqNotes" placeholder="Anything the driver should know" style="min-height:75px"></textarea></div>' +
      '<div class="dv-rq-g"><div><label class="field-label">Request via</label><div class="dv-checks"><label class="dv-check"><input type="checkbox" class="row-checkbox" id="rqEmail" checked><span>Email</span></label><label class="dv-check"><input type="checkbox" class="row-checkbox" id="rqSms"><span>SMS</span></label></div>' +
      '<label class="field-label" style="margin-top:15px">Approval</label><label class="dv-check"><input type="checkbox" class="row-checkbox" id="rqAppr"><span>Requires approval for acceptance</span></label></div>' +
      '<div><label class="field-label">Reminder</label><div class="radio-row" id="rqRem"><button type="button" class="radio-pill" data-r="4"><i data-lucide="alarm-clock"></i> 4 hours</button><button type="button" class="radio-pill active" data-r="24"><i data-lucide="alarm-clock"></i> 24 hours</button><button type="button" class="radio-pill" data-r="c"><i data-lucide="timer"></i> Custom</button></div>' +
      '<div id="rqCustomWrap" hidden style="margin-top:10px"><div class="unit-input"><input type="number" id="rqCustom" min="1" placeholder="48"><span>hours</span></div></div>' +
      '<div class="switch-row" style="margin-top:8px;padding:0"><span class="switch-row-text"><span class="switch-row-title">Repeat reminders</span><span class="switch-row-desc">Keep nudging until it is uploaded</span></span><label class="switch"><input type="checkbox" id="rqRep"><span></span></label></div></div></div></div>' +
      '<div class="dialog-foot has-note"><span class="dialog-foot-note"><i data-lucide="user-round"></i> <span>Created by ' + me() + ' · ' + DV.nice(TODAY) + '</span></span><div class="dialog-foot-actions"><button class="btn-outline" type="button" data-dialog-close>Cancel</button><button class="btn-primary" type="button" id="rqSend"><i data-lucide="send"></i> Send request</button></div></div></div>');
    if(!pType){
      DV.opts(Q('#rqDriver'), [['William Falin', 'William Falin'], ['Micheal Queensberry', 'Micheal Queensberry'], ['Park Hollis', 'Park Hollis']], 'William Falin');
      pType = DV.picker(Q('#rqType'), {options:DOCTYPES.map(function(t){ return {id:t, label:t, icon:'file-text'}; }), placeholder:'Select a document type', searchHint:'Search types'});
      on(Q('#rqRem'), 'click', function(e){ var b = e.target.closest('[data-r]'); if(!b) return; rq.remind = b.getAttribute('data-r'); QA('#rqRem .radio-pill').forEach(function(x){ x.classList.toggle('active', x === b); }); Q('#rqCustomWrap').hidden = rq.remind !== 'c'; });
      on(Q('#rqPlus'), 'click', function(){
        DV.overlay('dlgType', 'dialog', '<div class="dialog-panel" role="dialog" aria-modal="true" aria-labelledby="dtTitle"><div class="dialog-head"><h2 class="dialog-title" id="dtTitle">Add document type</h2><p class="dialog-desc">It becomes available for every request.</p><button type="button" class="dialog-close" data-dialog-close aria-label="Close"><i data-lucide="x"></i></button></div><div class="dialog-body">' + '<div class="dialog-field" style="margin-bottom:0">' + inp('dtName', 'Type name', true, 'text', 'e.g. Hazmat endorsement') + '</div></div><div class="dialog-foot"><div class="dialog-foot-actions"><button class="btn-outline" type="button" data-dialog-close>Cancel</button><button class="btn-primary" type="button" id="dtSave">Add type</button></div></div></div>');
        Q('#dtName').value = ''; Q('#dtSave').onclick = function(){ var n = Q('#dtName').value.trim(); if(!n){ window.dpValidate.showError(Q('#dtName'), 'Name the type.'); return; } if(DOCTYPES.indexOf(n) < 0) DOCTYPES.push(n); pType.setOptions(DOCTYPES.map(function(t){ return {id:t, label:t, icon:'file-text'}; })); pType.set(n); window.dpDialog.close('dlgType'); };
        window.dpDialog.open('dlgType');
      });
      on(Q('#rqSend'), 'click', function(){
        var t = pType.get(); if(!t){ pType.invalid(); toast('error', 'Pick a document type', 'Choose what you are asking for.'); return; }
        if(!Q('#rqEmail').checked && !Q('#rqSms').checked){ toast('error', 'Choose a channel', 'Send by email, SMS or both.'); return; }
        if(rq.remind === 'c' && !(+Q('#rqCustom').value > 0)){ window.dpValidate.showError(Q('#rqCustom'), 'Enter hours.'); return; }
        var via = [Q('#rqEmail').checked ? 'email' : '', Q('#rqSms').checked ? 'SMS' : ''].filter(Boolean).join(' + ');
        DOCS.unshift({id:'d' + Date.now(), name:t, type:t, by:me(), date:ymd(TODAY), status:'Requested', req:me(), appr:'', access:'Driver + managers', file:'', needAppr:Q('#rqAppr').checked});
        window.dpDialog.close('dlgReq'); paintDocs(); toast('success', 'Request sent', t + ' requested by ' + via + '.');
      });
    }
    pType.set(null); Q('#rqNotes').value = ''; Q('#rqEmail').checked = true; Q('#rqSms').checked = false; Q('#rqAppr').checked = false; Q('#rqRep').checked = false;
    window.dpDialog.open('dlgReq'); icons();
  }
})();
