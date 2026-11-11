/* 점검 업무 화면: 오늘의 점검 · 검토 대기열 · 케이스 상세 · 공단 결과 대조 · 감시 목록 · 사진 AI */
(function () {
  'use strict';
  const D = window.DATA, C = window.CORE, A = window.APP;
  const { esc, fmt, icon, $, $$, riskClass, riskLabel } = C;
  const mem = id => D.memberById[id];
  const catChip = id => { const k = id.split('-')[0]; const c = D.CATS[k] || { name: '신규', color: '#64748B' }; return `<span class="cat"><i style="background:${c.color}"></i>${esc(c.name)}</span>`; };
  const statusChip = s => `<span class="chip ${s === '판정 완료' ? 't' : s === '검토 중' ? 'b' : 'a'}">${esc(s)}</span>`;
  const rk = r => `<span class="rk ${riskClass(r)}" title="위험 ${riskLabel(r)}">${r}</span>`;

  /* ================= 오늘의 점검 ================= */
  A.reg('today', () => {
    const u = C.S.user;
    const mine = A.myCases();
    const all = D.CASES;
    const hi = all.filter(c => c.risk >= 80).length;
    const kg = all.reduce((a, c) => a + c.weightKg, 0);
    const byCat = Object.keys(D.CATS).map(k => ({ k, n: all.filter(c => c.ruleId.startsWith(k + '-')).length })).sort((a, b) => b.n - a.n);
    const maxCat = Math.max(...byCat.map(x => x.n));
    const fin = D.FINISH14.map(t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; });
    const doneN = Object.keys(C.S.decisions).length;
    const expiring = D.PARTNERS.filter(p => p.suitableTo >= D.TODAY && p.suitableTo <= '2028-04-13');
    const delayed = D.SOURCES.filter(s => s.delay > 0), schema = D.SOURCES.filter(s => s.schema);
    const html = `
    <section class="hero work-hero"><div class="hero-row"><div><h2>좋은 아침입니다, ${esc(u.name)}님</h2><p>${D.BIZ}(월) 데이터의 수집·판정이 목표 시각 전에 끝났습니다. ${u.role === '점검 담당자' ? '담당 권역(' + u.regions.map(r => D.REGIONS.find(x => x.id === r).name).join('·') + ')의 탐지 결과를 위험 순으로 확인하세요.' : '전체 권역의 탐지 결과를 확인할 수 있습니다.'}</p></div>
      <div class="done"><div><small style="color:#8FB5AE;font-size:12px;font-weight:700">전일 판정 완료</small><div class="big">06:41</div></div><span class="ok">목표 07:00 · 19분 여유</span></div></div>
      <div class="pipe">${D.PIPE.map((p, i) => `<div class="st ok" style="--k:${i}"><span class="ck"><svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg></span><b>${esc(p[0])}</b><small>${p[2]}–${p[3]}</small><i></i></div>`).join('')}</div></section>
    <div class="g g4">
      <div class="card kpi dark"><small>${icon('flag')} 신규 탐지 (전일 데이터)</small><div class="v">${all.length}<em>건</em></div><div class="d">위험 높음 <b style="color:#FCA5A5">${hi}건</b> · L2 ${all.filter(c => c.level === 'L2').length}건</div></div>
      <div class="card kpi"><small>${icon('queue')} 내 검토 대기</small><div class="v">${mine.length}<em>건</em></div><div class="d">${u.role === '점검 담당자' ? '담당 권역 기준' : '전체 권역 기준'} · 기한 ${D.CASES[0].due}</div>${C.spark([9, 14, 11, 17, 13, 15, mine.length], 'var(--teal)')}</div>
      <div class="card kpi"><small>${icon('dash')} 탐지 대상 중량 (중복 제거)</small><div class="v">${fmt(Math.round(kg / 1000))}<em>톤</em></div><div class="d">예상 차감 영향 <b class="up">+${(kg / 1000 * 0.38).toFixed(1)}톤</b></div>${C.spark([22, 18, 25, 21, 30, 27, Math.round(kg / 1000)], 'var(--amber)')}</div>
      <div class="card kpi"><small>${icon('check')} 이번 시즌 판정</small><div class="v">${312 + doneN}<em>건</em></div><div class="d">정탐률 <b class="dn">68.4%</b> · 오탐 피드백 ${41}건 반영</div>${C.spark([40, 55, 61, 63, 66, 67, 68], 'var(--teal)')}</div>
    </div>
    <div class="g g21">
      <div class="card"><div class="hd"><h3>${icon('queue')} 위험 순 검토 대기 (상위 6건)</h3><a class="btn sm" href="#/queue">대기열 전체 ${icon('arrow')}</a></div>
        <div class="list">${mine.slice(0, 6).map(c => `<div class="click" style="cursor:pointer" data-go="${c.id}">${rk(c.risk)}<div class="grow"><div class="t1">${esc(C.rule(c.ruleId).name)} · ${esc(mem(c.memberId).short)}</div><small>${esc(c.summary)}</small></div><span class="lv ${c.level}">${c.level}</span>${statusChip(C.caseStatus(c))}</div>`).join('') || '<p class="empty">대기 중인 건이 없습니다</p>'}</div></div>
      <div class="card"><div class="hd"><h3>${icon('bell')} 확인할 알림</h3></div><div style="display:flex;flex-direction:column;gap:8px">
        ${delayed.map(s => `<a class="alert a" href="#/pipeline">${icon('clock')}<span><b>${esc(s.name)}</b> 수신이 ${s.delay}분 지연되었습니다. 전일 대비 건수 ${Math.round((s.cnt / s.prev - 1) * 100)}% — 늦게 도착한 자료는 오늘 밤 판정에 반영됩니다.</span></a>`).join('')}
        ${schema.map(s => `<a class="alert r" href="#/pipeline">${icon('flag')}<span><b>스키마 변경 감지</b> · ${esc(s.name)} — ${esc(s.schema)}</span></a>`).join('')}
        <a class="alert a" href="#/ref">${icon('clock')}<span>공급처 적정성 만료 30일 이내 <b>${expiring.length}곳</b> — 알림 대상과 만료일을 확인하세요.</span></a>
        <a class="alert t" href="#/watch">${icon('watch')}<span>감시 목록 <b>${esc(C.S.watch[0].value)}</b> 소급 판정 결과 ${C.S.watch[0].hits}건 (${C.S.watch[0].members}개 회원사)</span></a>
      </div></div>
    </div>
    <div class="g g2">
      <div class="card"><div class="hd"><h3>규칙 범주별 탐지</h3><p>전일 데이터 · ${all.length}건</p></div><div class="hbar">${byCat.map(x => `<div class="row"><span>${catChip(x.k + '-')}</span><span class="tr"><i style="width:${x.n / maxCat * 100}%;background:${D.CATS[x.k].color}"></i></span><b>${x.n}</b></div>`).join('')}</div></div>
      <div class="card"><div class="hd"><h3>최근 14일 판정 완료 시각</h3><p>모든 날 07:00 전 완료</p></div>
        ${C.line([{ v: fin, c: 'var(--teal)', area: true }], { min: 360, max: 430, hline: 420, hlabel: '목표 07:00', labels: ['03-01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14'], every: 3, fmt: v => `${Math.floor(v / 60)}:${String(Math.round(v % 60)).padStart(2, '0')}`, dots: true })}</div>
    </div>`;
    return { title: '오늘의 점검', crumb: `${D.TODAY} (화) · 점검 업무`, html, mount(el) { $$('[data-go]', el).forEach(r => r.onclick = () => location.hash = '#/case/' + r.dataset.go); } };
  });

  /* ================= 검토 대기열 ================= */
  const QF = { scope: 'mine', region: '', member: '', cat: '', level: '', status: 'open', q: '' };
  A.queueMember = id => Object.assign(QF, { scope: 'all', region: '', member: id, cat: '', level: '', status: 'open', q: '' });
  A.reg('queue', () => {
    const u = C.S.user;
    if (u.role !== '점검 담당자' && QF.scope === 'mine') QF.scope = 'all';
    const html = `
    <div class="card"><div class="hd"><div><h3>${icon('queue')} 위험 순 검토 대기열</h3><p>탐지 근거와 위험 점수(규칙 가중치·수준·회원사 위험도 반영) 순으로 정렬됩니다. 같은 사유의 건은 선택해 한 번에 판정할 수 있습니다.</p></div>
      <div class="seg" role="group" aria-label="조회 범위"><button data-scope="mine" class="${QF.scope === 'mine' ? 'on' : ''}">내 담당 권역</button><button data-scope="all" class="${QF.scope === 'all' ? 'on' : ''}">전체 조회</button></div></div>
      <div class="filters">
        <select id="fRegion" aria-label="권역"><option value="">권역 전체</option>${D.REGIONS.map(r => `<option value="${r.id}" ${QF.region === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}</select>
        <select id="fMember" aria-label="회원사"><option value="">회원사 전체</option>${D.MEMBERS.map(m => `<option value="${m.id}" ${QF.member === m.id ? 'selected' : ''}>${esc(m.short)}</option>`).join('')}</select>
        <select id="fCat" aria-label="규칙 범주"><option value="">규칙 범주 전체</option>${Object.entries(D.CATS).map(([k, v]) => `<option value="${k}" ${QF.cat === k ? 'selected' : ''}>${v.name}</option>`).join('')}</select>
        <select id="fLevel" aria-label="수준"><option value="">수준 전체</option><option ${QF.level === 'L2' ? 'selected' : ''}>L2</option><option ${QF.level === 'L3' ? 'selected' : ''}>L3</option></select>
        <select id="fStatus" aria-label="상태"><option value="open" ${QF.status === 'open' ? 'selected' : ''}>미판정</option><option value="done" ${QF.status === 'done' ? 'selected' : ''}>판정 완료</option><option value="" ${QF.status === '' ? 'selected' : ''}>상태 전체</option></select>
        <select aria-label="기간" disabled><option>기간: ${D.BIZ} (전일)</option></select>
        <input id="fQ" placeholder="탐지 ID·차량번호·규칙 검색" value="${esc(QF.q)}" style="flex:1;min-width:180px">
      </div></div>
    <div id="bulk"></div>
    <div class="tw"><table class="tbl" id="qtbl"><thead><tr><th style="width:34px"><input type="checkbox" id="chkAll" aria-label="모두 선택"></th><th>위험</th><th>탐지 · 규칙</th><th>회원사 · 사업장</th><th>요약</th><th class="r">중량</th><th>상태</th><th>담당 · 기한</th></tr></thead><tbody></tbody></table></div>
    <p class="faint" id="qcount" style="font-size:12.5px"></p>`;
    function rows() {
      return D.CASES.filter(c => {
        const st = C.caseStatus(c);
        if (QF.scope === 'mine' && !u.regions.includes(c.region)) return false;
        if (QF.region && c.region !== QF.region) return false;
        if (QF.member && c.memberId !== QF.member) return false;
        if (QF.cat && !c.ruleId.startsWith(QF.cat + '-')) return false;
        if (QF.level && c.level !== QF.level) return false;
        if (QF.status === 'open' && st === '판정 완료') return false;
        if (QF.status === 'done' && st !== '판정 완료') return false;
        if (QF.q) { const q = QF.q.toLowerCase(); const hay = (c.id + c.ruleId + C.rule(c.ruleId).name + c.slips[0].vehicle + mem(c.memberId).name).toLowerCase(); if (!hay.includes(q)) return false; }
        return true;
      });
    }
    function mount(el) {
      const tb = $('#qtbl tbody', el);
      const sel = new Set();
      function draw() {
        const list = rows();
        const visible = new Set(list.map(c => c.id));
        [...sel].forEach(id => { if (!visible.has(id)) sel.delete(id); });
        const editable = list.filter(A.canJudge);
        $('#chkAll', el).checked = editable.length > 0 && editable.every(c => sel.has(c.id));
        $('#chkAll', el).indeterminate = sel.size > 0 && !$('#chkAll', el).checked;
        tb.innerHTML = list.map(c => {
          const m = mem(c.memberId), st = C.caseStatus(c), d = C.S.decisions[c.id];
          return `<tr class="click ${sel.has(c.id) ? 'sel' : ''}" data-id="${c.id}"><td><input type="checkbox" data-chk="${c.id}" ${A.canJudge(c) ? '' : 'disabled'} ${sel.has(c.id) ? 'checked' : ''} aria-label="${c.id} 선택"></td><td>${rk(c.risk)}</td>
          <td class="nw"><span class="t1 mono">${c.id}</span> <span class="lv ${c.level}">${c.level}</span><small>${esc(c.ruleId)} ${esc(C.rule(c.ruleId).name)}</small></td>
          <td class="nw"><span class="t1">${esc(m.short)}</span><small>${esc(D.REGIONS.find(r => r.id === c.region).name)} · ${esc(m.sites[0].name.replace(m.short + ' ', ''))}</small></td>
          <td style="min-width:240px;max-width:380px"><span style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(c.summary)}</span></td>
          <td class="r num nw">${fmt(c.weightKg)} kg</td><td>${statusChip(st)}${d ? `<small>${esc(d.result)}</small>` : ''}</td><td class="nw">${esc(C.caseAssignee(c))}<small>${c.due}</small></td></tr>`;
        }).join('') || `<tr><td colspan="8"><p class="empty">조건에 맞는 건이 없습니다</p></td></tr>`;
        $('#qcount', el).textContent = `${list.length}건 · 위험 점수 높은 순`;
        bulk();
      }
      function bulk() {
        const b = $('#bulk', el);
        if (!sel.size) { b.innerHTML = ''; return; }
        b.innerHTML = `<div class="bulk"><span>선택 <b>${sel.size}</b>건</span><button class="btn sm go" id="bJudge" ${A.can('judge') ? '' : 'disabled'}>${icon('check')} 같은 사유로 일괄 판정</button><button class="btn sm" id="bAssign" ${A.can('judge') ? '' : 'disabled'}>담당자 변경</button><button class="btn sm ghost" id="bClear" style="color:#D7F3EC">선택 해제</button></div>`;
        $('#bClear').onclick = () => { sel.clear(); draw(); };
        $('#bAssign').onclick = () => {
          const m = A.modal('담당자 변경', `<div class="fld"><label>새 담당자</label><select class="inp" id="asg">${Object.values(D.ASSIGNEES).map(n => `<option>${n}</option>`).join('')}</select></div>`, `<button class="btn" data-x>취소</button><button class="btn go" id="asgOk">변경</button>`);
          $('#asgOk', m).onclick = () => { const v = $('#asg', m).value; if (![...sel].every(id => A.canJudge(D.CASES.find(c => c.id === id)))) return; sel.forEach(id => C.S.caseAssignee[id] = v); C.save(); C.audit('담당자 변경', [...sel].join(','), v); A.closeModal(); A.toast(`${sel.size}건의 담당자를 ${v}(으)로 바꿨습니다`); sel.clear(); draw(); };
        };
        $('#bJudge').onclick = () => {
          const m = A.modal(`일괄 판정 · ${sel.size}건`, judgeForm(null), `<button class="btn" data-x>취소</button><button class="btn go" id="bjOk">${sel.size}건 판정 저장</button>`);
          bindJudge(m);
          $('#bjOk', m).onclick = () => {
            if (![...sel].every(id => A.canJudge(D.CASES.find(c => c.id === id)))) return; const f = readJudge(m, null, true); if (!f) return;
            sel.forEach(id => { const c = D.CASES.find(x => x.id === id); saveDecision(c, Object.assign({}, f, { kg: f.result === '정상' ? 0 : c.weightKg })); });
            A.closeModal(); A.toast(`${sel.size}건을 「${f.result}」(으)로 판정했습니다`); sel.clear(); draw();
          };
        };
      }
      tb.addEventListener('click', e => {
        const chk = e.target.closest('[data-chk]');
        if (chk) { e.stopPropagation(); chk.checked ? sel.add(chk.dataset.chk) : sel.delete(chk.dataset.chk); chk.closest('tr').classList.toggle('sel', chk.checked); bulk(); return; }
        const tr = e.target.closest('tr[data-id]'); if (tr) location.hash = '#/case/' + tr.dataset.id;
      });
      $('#chkAll', el).onchange = e => { rows().filter(A.canJudge).forEach(c => e.target.checked ? sel.add(c.id) : sel.delete(c.id)); draw(); };
      $$('[data-scope]', el).forEach(b => b.onclick = () => { QF.scope = b.dataset.scope; $$('[data-scope]', el).forEach(x => x.classList.toggle('on', x === b)); draw(); });
      [['#fRegion', 'region'], ['#fMember', 'member'], ['#fCat', 'cat'], ['#fLevel', 'level'], ['#fStatus', 'status']].forEach(([s, k]) => $(s, el).onchange = e => { QF[k] = e.target.value; draw(); });
      $('#fQ', el).oninput = e => { QF.q = e.target.value; draw(); };
      draw();
    }
    return { title: '검토 대기열', crumb: '점검 업무', html, mount };
  });

  /* ---------- 판정 폼 ---------- */
  function judgeForm(c, d) {
    d = d || {};
    return `<div class="fld"><label>판정 결과</label><div class="rbtns" id="rres">${D.RESULTS.map(r => `<button type="button" class="${r === '정상' ? 'ok' : ''} ${d.result === r ? 'on' : ''}" data-r="${r}">${r}</button>`).join('')}</div></div>
      <div class="g g2" style="gap:10px"><div class="fld"><label for="jkg">대상 중량 (kg)</label><input class="inp num" id="jkg" inputmode="numeric" value="${d.kg != null ? d.kg : c ? c.weightKg : ''}" ${c ? '' : 'disabled placeholder="건별 탐지 중량 적용"'}></div>
      <div class="fld"><label for="jrs">사유 코드</label><select class="inp" id="jrs">${D.REASONS.map(([k, v]) => `<option value="${k}" ${d.reason === k ? 'selected' : ''}>${k} ${v}</option>`).join('')}</select></div></div>
      <div class="fld"><label for="jnote">검토 의견</label><textarea class="inp" id="jnote" rows="3" placeholder="확인한 근거와 소명 내용을 적어 주세요">${esc(d.note || '')}</textarea></div>
      <div class="fld"><label for="jfile">첨부 (소명 자료 등)</label><input class="inp" id="jfile" type="file"><small class="faint">시연에서는 파일 이름만 기록합니다.</small></div>`;
  }
  function bindJudge(el) {
    $$('#rres button', el).forEach(b => b.onclick = () => {
      $$('#rres button', el).forEach(x => x.classList.toggle('on', x === b));
      if (b.dataset.r === '정상') { const rs = $('#jrs', el); rs.value = 'N01'; }
    });
  }
  function readJudge(el, c, bulk = false) {
    const on = $('#rres button.on', el);
    if (!on) { A.toast('판정 결과를 선택해 주세요', 'x'); return null; }
    const raw = $('#jkg', el).value.trim();
    const kg = on.dataset.r === '정상' ? 0 : bulk ? null : Number(raw);
    if (!bulk && on.dataset.r !== '정상' && (!raw || !Number.isFinite(kg) || kg <= 0 || (c && kg > c.weightKg))) { A.toast('중량은 0보다 크고 해당 건의 탐지 중량 이하인 숫자로 입력해 주세요', 'x'); return null; }
    const reason = $('#jrs', el).value;
    if ((on.dataset.r === '정상') !== reason.startsWith('N')) { A.toast('판정 결과에 맞는 사유 코드를 선택해 주세요', 'x'); return null; }
    const f = $('#jfile', el);
    return { result: on.dataset.r, kg, reason: $('#jrs', el).value, note: $('#jnote', el).value.trim(), file: f && f.files[0] ? f.files[0].name : '' };
  }
  function saveDecision(c, f) {
    if (!A.canJudge(c)) { A.toast('담당 권역의 건만 판정할 수 있습니다', 'lock'); return; }
    const prev = C.S.decisions[c.id];
    const rec = Object.assign({}, f, { at: C.now(), by: C.S.user.name, ruleVer: C.rule(c.ruleId).version, snapshot: 'B-2803140200' });
    rec.history = prev ? (prev.history || []).concat([{ result: prev.result, at: prev.at, by: prev.by }]) : [];
    C.S.decisions[c.id] = rec; C.S.caseStatus[c.id] = '판정 완료'; C.save();
    C.audit(prev ? '판정 수정' : '판정', c.id, `${f.result} · ${f.reason}${f.kg != null ? ' · ' + f.kg + 'kg' : ''}`);
  }

  /* ================= 케이스 상세 ================= */
  A.reg('case', ([id]) => {
    const c = D.CASES.find(x => x.id === id) || D.CASES[0];
    const r = C.rule(c.ruleId), m = mem(c.memberId);
    const d = C.S.decisions[c.id];
    if (C.caseStatus(c) === '신규' && A.canJudge(c)) { C.S.caseStatus[c.id] = '검토 중'; C.save(); C.audit('케이스 열람', c.id, '검토 시작'); }
    const st = C.caseStatus(c);
    const s1 = c.slips[0], s2 = c.slips[1];
    const badW = ['IN-01', 'WT-02', 'OUT-03'].includes(c.ruleId);
    const badV = c.ruleId === 'PH-01';
    const keyIdx = c.basis.length - 1;
    const evid = `<div class="evid">${c.basis.map(([k, v], i) => `<div class="${i === keyIdx || (i === 1 && c.ruleId !== 'NW-02') ? 'k' : ''}"><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div>`;
    let route = '';
    if (c.route && !c.route.stay) {
      const need = c.route.driveMin, gap = c.route.gapMin, max = need * 1.15;
      route = `<div class="routev"><div class="hd" style="margin:0 0 4px"><h3 style="font-size:14px">${icon('route')} 이동 가능성 검토</h3><span class="chip r">불가능한 이동</span></div>
        <div class="track"><div class="rail"></div><div class="need" style="width:${need / max * 100}%"></div><div class="act" style="width:${gap / max * 100}%"></div>
        <span class="pin" style="left:0;transform:none">${esc(c.route.fromMember)} 계량 ${c.route.prevAt.slice(11)}</span><span class="pin e" style="left:${gap / max * 100}%;top:40px;color:#C02626">${esc(m.short)} 계량 · ${gap}분 후</span><span class="pin e" style="left:${need / max * 100}%">도로 경로 ${need}분</span></div>
        <div class="legend"><span><i style="background:linear-gradient(90deg,#EF4444,#F97316)"></i>실제 계량 간격</span><span><i style="background:#D7E9E5;border:1px solid #B9DCD5"></i>기준 경로 시간 (화물차 옵션 · 조회 2027-03-02 · 현장 보정 포함)</span><span>이전 전표 <span class="mono">${c.route.prevSlip}</span></span></div></div>`;
    } else if (c.route && c.route.stay) {
      route = `<div class="routev"><div class="hd" style="margin:0 0 6px"><h3 style="font-size:14px">${icon('route')} 체류 중 동선</h3><span class="chip r">체류 중 타 사업장 계량</span></div>
        <ol class="timeline"><li><b>${s1.at.slice(11)}</b> ${esc(m.short)} 1차 계량 (적재)</li><li><b style="color:#C02626">${c.route.midAt.slice(11)}</b> ${esc(c.route.to)} 계량 <span class="mono">${c.route.prevSlip}</span></li><li><b>${s2.at.slice(11)}</b> ${esc(m.short)} 2차 계량 (공차)</li></ol></div>`;
    }
    let pair = '';
    if (c.photos2) {
      pair = `<div class="card flat" style="padding:14px"><div class="hd" style="margin-bottom:10px"><h3 style="font-size:14px">${icon('photo')} 사진 재사용 비교</h3><span class="chip r">${c.ruleId === 'PH-02' ? '같은 사진' : '유사 사진'}</span></div>
      <div class="pair"><div class="phw">${C.photo(s1.photo, { k: 'a' })}<span class="tag">이번 전표 ${s1.no} · ${esc(m.short)}</span></div>
      <div class="mid"><b class="num">${c.photos2.sim.toFixed(2)}</b><small>유사도</small><small>해시 거리 ${c.photos2.dist}</small></div>
      <div class="phw">${C.photo(c.photos2.photo, { k: 'b' })}<span class="tag">${c.photos2.slip} · ${esc(c.photos2.member)} · ${c.photos2.at.slice(0, 10)}</span></div></div></div>`;
    }
    const mfBad = badW || c.ruleId === 'IN-02';
    const slipHist = c.history.length ? `<table class="diff" style="margin-top:6px"><thead><tr><th>차수 이력</th><th>시각</th><th>변경</th><th>처리자</th></tr></thead><tbody>${c.history.map(h => `<tr class="${h.ver > 1 ? 'chg' : ''}"><td>v${h.ver} ${esc(h.state)}</td><td class="nw">${h.at.slice(5)}</td><td>${h.ver > 1 ? `<del>${esc(h.before)}</del> → <ins>${esc(h.after)}</ins>` : esc(h.after)}</td><td>${esc(h.by)}</td></tr>`).join('')}</tbody></table>` : `<p class="faint" style="font-size:12px;padding:0 12px 10px">차수 변경 이력 없음</p>`;
    const compare = `<div class="card"><div class="hd"><h3>${icon('case')} 전표 한 화면 대조</h3><span class="snap">${icon('clock')} <select class="inp" id="snapSel" style="padding:4px 8px;font-size:12px;width:auto"><option>판정 당시 스냅샷 · B-2803140200</option><option>현재 값</option></select></span></div>
      <div class="cmp">
        <div class="slip"><div class="sh"><span>관리표 라인 · ${c.mf.type}</span><span class="mono">${c.mf.no} · L${c.mf.line}</span></div><dl>
          <dt>거래일</dt><dd>${c.mf.date}</dd><dt>품목</dt><dd class="${c.ruleId === 'IN-02' ? 'bad' : ''}">${esc(c.mf.item)}</dd><dt>수량</dt><dd>${c.mf.qty}대</dd>
          <dt>중량</dt><dd class="num ${mfBad && c.ruleId !== 'IN-02' ? 'bad' : ''}">${fmt(c.mf.kg)} kg</dd><dt>반입처</dt><dd class="${c.ruleId === 'NW-02' ? 'bad' : ''}">${esc(c.mf.partner)}<br><span class="mono faint">${c.mf.partnerBiz}</span></dd><dt>상태</dt><dd>${c.mf.status}</dd></dl></div>
        <div class="slip"><div class="sh"><span>계량 전표 · 1·2차</span><span class="mono">${s1.no}</span></div><dl>
          <dt>차량</dt><dd class="${badV ? 'bad' : ''}"><span class="plate ${badV ? 'bad' : ''}">${esc(s1.vehicle)}</span></dd>
          <dt>1차 (적재)</dt><dd class="num">${s1.at.slice(11)} · ${fmt(s1.kg)} kg</dd>
          <dt>2차 (공차)</dt><dd class="num ${c.ruleId === 'WT-01' ? 'bad' : ''}">${s2.kg == null ? '계량 없음 → 등록 공차중량 적용' : `${s2.at.slice(11)} · ${fmt(s2.kg)} kg`}</dd>
          <dt>순중량</dt><dd id="snapshotKg" class="num ${badW ? 'bad' : ''}">${fmt(c.weightKg)} kg</dd><dt>계량대</dt><dd>${esc(s1.site)} · ${esc(s1.gate)} (${s1.input})</dd></dl>${slipHist}</div>
        <div class="slip"><div class="sh"><span>계량 사진 · 1차 / 2차</span><span class="faint">${A.can('rawPhoto') ? '얼굴 가림 적용' : '얼굴 가림'}</span></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:8px">
          <div class="phw">${C.photo(s1.photo, { k: 'c1', detected: badV })}<span class="tag">1차 ${s1.photo && s1.photo.readPlate ? '· 인식 ' + esc(s1.photo.readPlate) : ''}</span></div>
          <div class="phw">${C.photo(s2.photo, { k: 'c2' })}<span class="tag">2차</span></div></div></div>
        <div class="slip"><div class="sh"><span>세금계산서</span><span class="mono">${c.invoice.no}</span></div><dl>
          <dt>발행일</dt><dd class="${c.ruleId === 'DOC-01' ? 'bad' : ''}">${c.invoice.issue}</dd><dt>공급자</dt><dd>${esc(c.invoice.supplier)}<br><span class="mono faint">${c.invoice.supplierBiz}</span></dd>
          <dt>품목</dt><dd class="${c.ruleId === 'IN-02' ? 'bad' : ''}">${esc(c.invoice.item)}</dd><dt>중량</dt><dd class="num">${fmt(c.invoice.kg)} kg</dd><dt>공급가액</dt><dd class="num">${fmt(c.invoice.amount)} 원</dd><dt>연결</dt><dd>관리표 라인 ${c.mf.line}번 (N:M 연결 1건)</dd></dl></div>
      </div></div>`;
    const twin = c.twin ? `<div class="alert r">${icon('flag')}<span>같은 반입이 <b>${esc(c.twin.member)}</b> 전표 <span class="mono">${c.twin.slip}</span> (${c.twin.at.slice(11)} · ${fmt(c.twin.kg)} kg)에도 계상되었습니다.</span></div>` : '';
    const judge = `<div class="judge"><div class="card"><div class="hd"><h3>${icon('check')} 판정</h3>${statusChip(st)}</div>
      ${A.canJudge(c) ? judgeForm(c, d) + `<div style="display:flex;gap:8px"><button class="btn go" id="jSave" style="flex:1">${d ? '판정 수정' : '판정 저장'}</button><a class="btn" href="#/reports/case/${c.id}" title="케이스 결과서">${icon('report')}</a></div>`
        : `<div class="hint">${icon('lock')}<span><b>조회 전용</b> · 이 건의 판정 권한이 없습니다.${d ? `<br>판정: <b>${esc(d.result)}</b> · ${esc(d.by)} · ${d.at}` : ''}</span></div>`}
      </div>
      <div class="card"><div class="hd"><h3 style="font-size:14px">탐지 근거</h3></div><div class="slip" style="border:0"><dl style="padding:0;grid-template-columns:84px 1fr">
        <dt>규칙</dt><dd>${esc(r.id)} ${esc(r.name)}</dd><dt>버전</dt><dd>${esc(r.version)} · ${r.status}</dd><dt>기준값</dt><dd>${esc(r.params[0].label)} ${r.params[0].v}${esc(r.params[0].unit)}</dd><dt>근거</dt><dd>${esc(r.basis)}</dd><dt>원천</dt><dd><a href="#/case/${c.id}" class="mono">${c.mf.no}</a> · <a href="#/case/${c.id}" class="mono">${s1.no}</a></dd></dl></div>
        <a class="btn sm" href="#/rule/${r.id}" style="margin-top:6px">${icon('rule')} 규칙 보기</a></div>
      <div class="card"><div class="hd"><h3 style="font-size:14px">유사 과거 사례</h3></div><div class="list">${c.similar.map(s => `<div><span class="mono" style="font-size:12px">${s.id}</span><div class="grow"><small>${s.date} · ${esc(s.member)}</small></div><span class="chip ${s.result === '정상' ? '' : 'a'}">${esc(s.result)}</span></div>`).join('')}</div></div>
      <div class="card"><div class="hd"><h3 style="font-size:14px">처리 이력</h3></div><ol class="timeline">
        <li><b>${c.detectedAt.slice(11)}</b> 일일 판정에서 탐지 (스냅샷 B-2803140200)</li><li><b>${esc(C.caseAssignee(c))}</b> 담당 배정 · 기한 ${c.due}</li>
        ${st !== '신규' ? `<li><b>검토 시작</b> ${esc(C.S.user.name)}</li>` : ''}${d ? (d.history || []).map(h => `<li>이전 판정 ${esc(h.result)} · ${esc(h.by)}</li>`).join('') + `<li><b>판정 ${esc(d.result)}</b> · ${esc(d.by)} · ${d.at.slice(11)}${d.file ? ' · 첨부 ' + esc(d.file) : ''}</li>` : ''}</ol></div></div>`;
    const html = `<div class="case-top"><div><a class="btn sm ghost" href="#/queue">${icon('left')} 대기열</a><h2 style="margin-top:6px">${esc(r.name)} <span class="lv ${c.level}">${c.level}</span></h2>
      <div class="meta"><span class="mono">${c.id}</span><span>${catChip(r.id)}</span><span><b>${esc(m.name)}</b> · ${esc(c.slips[0].site)}</span><span>데이터 ${c.biz}</span><span>탐지 ${c.detectedAt}</span></div></div>
      <div style="display:flex;align-items:center;gap:12px"><div style="text-align:right"><small class="faint" style="font-weight:700;font-size:12px">위험 점수</small><div class="num" style="font-size:34px;font-weight:700;color:${c.risk >= 80 ? '#C02626' : '#B45309'};line-height:1">${c.risk}</div></div>${C.gauge(c.risk)}</div></div>
      <div class="g g21"><div style="display:flex;flex-direction:column;gap:16px;min-width:0"><div class="card"><div class="hd"><h3>${icon('flag')} 탐지 사유</h3><span class="chip d">${esc(r.id)} ${esc(r.version)}</span></div><p class="summary">${esc(c.summary)}</p><div style="margin-top:12px">${evid}</div>${twin ? '<div style="margin-top:10px">' + twin + '</div>' : ''}${route ? '<div style="margin-top:12px">' + route + '</div>' : ''}</div>${pair}${compare}</div>${judge}</div>`;
    return {
      title: `탐지 ${c.id}`, crumb: '점검 업무 · 검토 대기열', html, mount(el) {
        $('#snapSel', el).onchange = e => {
          const latest = c.history[c.history.length - 1];
          $('#snapshotKg', el).textContent = e.target.selectedIndex && latest ? latest.after : `${fmt(c.weightKg)} kg`;
          A.toast(e.target.selectedIndex ? (latest ? '현재 보관값을 표시합니다' : '판정 이후 변경된 값이 없습니다') : '판정 당시 스냅샷을 표시합니다', 'clock');
        };
        if (!A.canJudge(c)) return;
        bindJudge(el);
        $('#jSave', el).onclick = () => { const f = readJudge(el, c); if (!f) return; saveDecision(c, f); A.toast(`${c.id} 판정을 저장했습니다 · ${f.result}`); const next = A.myCases()[0]; location.hash = next ? '#/case/' + next.id : '#/queue'; };
      }
    };
  });

  /* ================= 공단 결과 대조 ================= */
  A.reg('agency', () => {
    const list = D.AGENCY;
    const hit = list.filter(a => a.detected).length, miss = list.length - hit;
    const kgHit = list.filter(a => a.detected).reduce((s, a) => s + a.kg, 0), kgAll = list.reduce((s, a) => s + a.kg, 0);
    const causes = D.CAUSES.map(k => ({ l: k, v: list.filter(a => !a.detected && (C.S.agencyCause[a.id] || a.cause) === k).length }));
    const colors = ['#F59E0B', '#8B5CF6', '#0EA5E9', '#EF4444'];
    const html = `<div class="g g4">
      <div class="card kpi dark"><small>2027년 공단 최종 차감</small><div class="v">${list.length}<em>건</em></div><div class="d">${fmt(Math.round(kgAll / 1000))}톤 · 조사확인서 등록 완료</div></div>
      <div class="card kpi"><small>사전 탐지</small><div class="v">${hit}<em>건</em></div><div class="d">재현율 <b class="dn">${(hit / list.length * 100).toFixed(1)}%</b> · 중량 기준 ${(kgHit / kgAll * 100).toFixed(1)}%</div></div>
      <div class="card kpi"><small>놓친 건</small><div class="v">${miss}<em>건</em></div><div class="d">원인 기록 ${list.filter(a => !a.detected && (C.S.agencyCause[a.id] || a.cause)).length} / ${miss}</div></div>
      <div class="card kpi"><small>평균 선행 탐지</small><div class="v">5.2<em>개월</em></div><div class="d">공단 조사 시점보다 먼저 찾은 기간</div></div></div>
    <div class="g g21"><div class="card"><div class="hd"><div><h3>${icon('agency')} 공단 차감 건별 사전 탐지 여부</h3><p>조사확인서·최종 결과를 등록하면 차감 건마다 시스템이 먼저 탐지했는지 자동으로 대조합니다.</p></div><button class="btn go sm" id="upAg" ${A.can('agency') ? '' : 'disabled'}>${icon('plus')} 등록 절차 보기</button></div>
      <div class="tw"><table class="tbl"><thead><tr><th>조사 ID</th><th>회원사</th><th>차감 유형</th><th class="r">차감 중량</th><th>사전 탐지</th><th>놓침 원인</th></tr></thead><tbody>${list.map(a => `<tr><td class="mono nw">${a.id}<small>${a.month}</small></td><td class="nw">${esc(mem(a.member).short)}</td><td>${esc(a.type)}</td><td class="r num nw">${fmt(a.kg)} kg</td>
        <td class="nw">${a.detected ? `<span class="chip t">${icon('check')} ${a.detectedAt}</span><small>${esc(a.rule)} ${esc(C.rule(a.rule).name)}</small>` : '<span class="chip r">놓침</span>'}</td>
        <td>${a.detected ? '<span class="faint">—</span>' : `<select class="inp" data-cause="${a.id}" style="padding:5px 8px;font-size:12.5px" ${A.can('agency') ? '' : 'disabled'}><option value="">원인 선택</option>${D.CAUSES.map(k => `<option ${((C.S.agencyCause[a.id] || a.cause) === k) ? 'selected' : ''}>${k}</option>`).join('')}</select>`}</td></tr>`).join('')}</tbody></table></div></div>
      <div style="display:flex;flex-direction:column;gap:16px"><div class="card"><div class="hd"><h3>놓친 건의 원인</h3></div><div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">${C.donut(causes.map((x, i) => ({ l: x.l, v: x.v, c: colors[i] })), { center: String(miss), sub: '놓친 건' })}<div class="legend" style="flex-direction:column;gap:6px">${causes.map((x, i) => `<span><i style="background:${colors[i]}"></i>${x.l} <b>${x.v}</b></span>`).join('')}</div></div></div>
      <div class="card"><div class="hd"><h3>다음 규칙으로 잇기</h3></div><p class="muted" style="font-size:13px">놓침 원인을 기록한 뒤, 「규칙 부재」는 케이스 카드에서, 「기준값」은 규칙 편집기에서 검토하세요.</p><div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><a class="btn sm" href="#/cards">${icon('spark')} 케이스 카드</a><a class="btn sm" href="#/rules">${icon('rule')} 규칙 기준값 검토</a></div></div></div></div>`;
    return {
      title: '공단 결과 대조', crumb: '점검 업무', html, mount(el) {
        $$('[data-cause]', el).forEach(s => s.onchange = () => { C.S.agencyCause[s.dataset.cause] = s.value; C.save(); C.audit('놓침 원인 기록', s.dataset.cause, s.value); A.toast('놓침 원인을 기록했습니다'); A.render(); });
        $('#upAg', el).onclick = () => {
          if (!A.can('agency')) return; const m = A.modal('공단 조사 결과 등록', `<div class="fld"><label>체험용 조사 결과</label><p>가상 조사 결과 26건으로 등록·대조 절차를 확인합니다. 실제 엑셀 업로드는 연결하지 않았습니다.</p></div><div class="hint">${icon('check')}<span>운영 시에는 필수 열·회원사 코드·중량 단위를 검증하고, 오류가 있으면 반영 전에 행 번호와 사유를 안내합니다.</span></div>`, `<button class="btn" data-x>취소</button><button class="btn go" id="agOk">샘플로 절차 확인</button>`);
          $('#agOk', m).onclick = () => { A.closeModal(); A.toast('시연: 26건 검사 통과 · 사전 탐지 여부를 다시 대조했습니다'); C.audit('공단 결과 등록', '2027', '26건'); };
        };
      }
    };
  });

  /* ================= 감시 목록 ================= */
  A.reg('watch', () => {
    const list = C.S.watch;
    const html = `<div class="g g12"><div class="card"><div class="hd"><h3>${icon('plus')} 감시 대상 등록</h3></div>
      <p class="muted" style="font-size:13px;margin-bottom:12px">등록하는 즉시 <b>등록 전 5년</b>의 <b>전 회원사</b> 거래를 소급 판정하고, 같은 사업자번호·대표자·주소, 비슷한 상호를 연관 후보로 보여 줍니다.</p>
      <form id="wf"><div class="fld"><label for="wt">유형</label><select class="inp" id="wt"><option>반입처</option><option>공급처</option><option>차량</option><option>사업회원</option></select></div>
      <div class="fld"><label for="wv">대상</label><select class="inp" id="wv"></select></div>
      <div class="fld"><label for="wr">등록 사유</label><input class="inp" id="wr" placeholder="예: 공단 조사에서 허위 반입 확인" required></div>
      <button class="btn go full" ${A.can('watch') ? '' : 'disabled'}>${icon('watch')} 등록하고 5년 소급 판정</button></form></div>
      <div class="card"><div class="hd"><h3>${icon('watch')} 감시 목록</h3><p>${list.length}건</p></div><div class="tw"><table class="tbl"><thead><tr><th>유형</th><th>대상</th><th>사유</th><th>등록</th><th class="r">소급 탐지</th><th></th></tr></thead><tbody>
      ${list.slice().reverse().map(w => `<tr><td><span class="chip">${esc(w.type)}</span></td><td class="t1">${esc(w.value)}<small class="mono">${esc(w.key)}</small></td><td>${esc(w.reason)}</td><td class="nw">${w.at}<small>${esc(w.by)}</small></td><td class="r nw"><b class="num">${w.hits}</b>건<small>${w.members}개 회원사</small></td><td><button class="btn sm" data-rel="${w.id}">연관 후보</button></td></tr>`).join('')}</tbody></table></div></div></div>`;
    function opts(type) {
      if (type === '차량') return D.VEHICLES.slice(0, 30).map(v => [v.no, v.no]);
      if (type === '사업회원') return D.MEMBERS.map(m => [m.name, m.bizNo]);
      return D.PARTNERS.filter(p => type === '반입처' ? p.type !== '출고처' : true).map(p => [p.name, p.bizNo]);
    }
    function related(w) {
      const p = D.PARTNERS.find(x => x.bizNo === w.key || x.name === w.value);
      if (!p) return [];
      return D.PARTNERS.filter(x => x !== p && (x.ceo === p.ceo || x.addr === p.addr || x.bizNo.slice(0, 6) === p.bizNo.slice(0, 6) || x.name.slice(0, 2) === p.name.slice(0, 2)))
        .map(x => ({ x, why: [x.ceo === p.ceo && '같은 대표자', x.addr === p.addr && '같은 주소', x.bizNo.slice(0, 6) === p.bizNo.slice(0, 6) && '사업자번호 앞자리', x.name.slice(0, 2) === p.name.slice(0, 2) && '비슷한 상호'].filter(Boolean) }));
    }
    function showRel(w) {
      const rel = related(w);
      A.modal(`연관 후보 · ${w.value}`, rel.length ? `<div class="tw"><table class="tbl"><thead><tr><th>거래처</th><th>대표자 · 주소</th><th>근거</th><th></th></tr></thead><tbody>${rel.map(({ x, why }) => `<tr><td class="t1">${esc(x.name)}<small class="mono">${x.bizNo}</small></td><td>${esc(x.ceo)}<small>${esc(x.addr)}</small></td><td>${why.map(y => `<span class="chip a">${y}</span>`).join(' ')}</td><td><button class="btn sm" data-addrel="${x.id}">감시 등록</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">연관 후보가 없습니다</p>', '<button class="btn" data-x>닫기</button>', { wide: true });
      $$('[data-addrel]').forEach(b => b.onclick = () => { const x = D.PARTNERS.find(p => p.id === b.dataset.addrel); A.closeModal(); register('반입처', x.name, x.bizNo, `연관 후보: ${w.value}`); });
    }
    function register(type, value, key, reason) {
      if (!A.can('watch')) { A.toast('감시 대상 등록 권한이 없습니다', 'lock'); return; }
      if (!reason.trim()) { A.toast('등록 사유를 입력해 주세요', 'x'); return; }
      if (C.S.watch.some(w => w.type === type && w.key === key)) { A.toast('이미 등록된 감시 대상입니다', 'x'); return; }
      const h = parseInt(C.hash(value).slice(0, 6), 16);
      const hits = 2 + h % 17, members = 1 + h % 4, scanned = 1284220 + h % 90000;
      const m = A.modal('소급 판정 진행', `<p class="muted" style="font-size:13px">${esc(type)} <b>${esc(value)}</b> · 2023-03-14 ~ ${D.BIZ} · 전 회원사 ${D.MEMBERS.length}곳</p>
        <div class="prog" style="margin:14px 0 6px"><i id="wp" style="width:0"></i></div><p class="faint num" id="wpt" style="font-size:12.5px">0 / ${fmt(scanned)}건 검사</p><div id="wres"></div>`, '<button class="btn" data-x>닫기</button>');
      let k = 0; const tm = A.repeat(() => {
        k = Math.min(100, k + 9 + Math.random() * 12); const el = $('#wp', m); if (!el) { clearInterval(tm); return; }
        el.style.width = k + '%'; $('#wpt', m).textContent = `${fmt(Math.round(scanned * k / 100))} / ${fmt(scanned)}건 검사`;
        if (k >= 100) {
          clearInterval(tm);
          const w = { id: 'W-' + String(C.S.watch.length + 1).padStart(3, '0'), type, value, key, reason, at: D.TODAY, by: C.S.user.name, hits, members };
          C.S.watch.push(w); C.save(); C.audit('감시 목록 등록', value, `${type} · 소급 ${hits}건`);
          const yrs = [2023, 2024, 2025, 2026, 2027, 2028];
          $('#wres', m).innerHTML = `<div class="alert t" style="margin-top:8px">${icon('check')}<span>소급 판정 완료 — <b>${hits}건</b> 탐지 (${members}개 회원사). 소급 탐지 결과를 감시 목록에 저장했습니다. 운영 대기열에 자동 추가하는 기능은 이 체험에 연결하지 않았습니다.</span></div>
            ${C.bars(yrs.map((y, i) => Math.max(0, Math.round(hits * [0.08, 0.14, 0.2, 0.22, 0.26, 0.1][i]))), { labels: yrs.map(String), h: 140, title: '연도별 소급 탐지' })}`;
          A.toast(`감시 목록에 등록했습니다 · 소급 ${hits}건`);
          m.addEventListener('click', e => { if (e.target.closest('[data-x]') || e.target === m) A.render(); });
          m.addEventListener('keydown', e => { if (e.key === 'Escape') A.render(); });
        }
      }, 160, m);
    }
    return {
      title: '감시 목록', crumb: '점검 업무', html, mount(el) {
        const fill = () => { $('#wv', el).innerHTML = opts($('#wt', el).value).map(([n, k]) => `<option value="${esc(k)}" data-n="${esc(n)}">${esc(n)}</option>`).join(''); };
        $('#wt', el).onchange = fill; fill();
        $('#wf', el).onsubmit = e => { e.preventDefault(); const o = $('#wv', el).selectedOptions[0]; register($('#wt', el).value, o.dataset.n, o.value, $('#wr', el).value.trim()); };
        $$('[data-rel]', el).forEach(b => b.onclick = () => showRel(C.S.watch.find(w => w.id === b.dataset.rel)));
      }
    };
  });

  /* ================= 사진 AI 검수 ================= */
  let PTAB = 'plate';
  A.reg('photo', () => {
    const plates = D.CASES.filter(c => c.ruleId === 'PH-01');
    const reuse = D.CASES.filter(c => c.photos2);
    // 판독 보류 대기열 (가상)
    const pend = D.CASES.filter(c => !c.ruleId.startsWith('PH')).slice(0, 6).map((c, i) => ({ id: 'AIQ-' + (1201 + i), c, conf: [0.62, 0.71, 0.55, 0.78, 0.66, 0.81][i], read: c.slips[0].vehicle.replace(/\d$/, '?'), why: ['역광', '야간', '번호판 가림', '각도', '흙먼지', '해상도'][i] }));
    const tabs = [['plate', `번호판 불일치 ${plates.length}`], ['reuse', `사진 재사용 ${reuse.length}`], ['queue', `AI 검수 대기열 ${pend.filter(p => !C.S.plateFix[p.id]).length}`], ['face', '얼굴 가림 · 원본 열람']];
    let body = '';
    if (PTAB === 'plate') {
      body = `<div class="hint" style="margin-bottom:12px">${icon('photo')}<span>계량 1·2차 사진에서 번호판을 찾아 읽고, 입력된 차량번호와 다르면 탐지합니다. 인식 신뢰도가 낮은 사진은 탐지하지 않고 <b>AI 검수 대기열</b>로 보냅니다. 모델 버전·평가 지표는 모델 관리에서 확인할 수 있습니다.</span></div>
      <div class="thumbs">${plates.map(c => `<a class="thumb" href="#/case/${c.id}"><div class="phw">${C.photo(c.slips[0].photo, { k: 't' + c.id, detected: true })}</div><div class="tb"><b>${esc(mem(c.memberId).short)}</b> · ${c.slips[0].at.slice(11)}<div style="display:flex;gap:6px;align-items:center;margin-top:4px;flex-wrap:wrap"><small class="faint">입력</small><span class="plate">${esc(c.slips[0].vehicle)}</span><small class="faint">인식</small><span class="plate bad">${esc(c.slips[0].photo.readPlate)}</span></div></div></a>`).join('')}</div>`;
    } else if (PTAB === 'reuse') {
      body = `<div class="hint" style="margin-bottom:12px">${icon('spark')}<span>모든 사진의 <b>지각 해시</b>(크기 변경·재압축에도 유사성이 유지되는 특징값)와 <b>이미지 특징값</b>을 만들어, 다른 전표·다른 회원사에 쓰인 같은 사진과 유사 사진을 찾습니다. 사진 속 촬영 시각과 계량 시각도 함께 비교합니다.</span></div>
      <div style="display:flex;flex-direction:column;gap:14px">${reuse.map(c => `<div class="card flat"><div class="hd"><h3 style="font-size:14px">${esc(mem(c.memberId).short)} ↔ ${esc(c.photos2.member)}</h3><div style="display:flex;gap:6px"><span class="chip ${c.ruleId === 'PH-02' ? 'r' : 'a'}">${c.ruleId === 'PH-02' ? '같은 사진' : '유사 사진'}</span><a class="btn sm" href="#/case/${c.id}">케이스 ${icon('arrow')}</a></div></div>
        <div class="pair"><div class="phw">${C.photo(c.slips[0].photo, { k: 'ra' + c.id })}<span class="tag">이번 전표 · 계량 ${c.slips[0].at.slice(5)}</span></div><div class="mid"><b class="num">${c.photos2.sim.toFixed(2)}</b><small>유사도</small></div><div class="phw">${C.photo(c.photos2.photo, { k: 'rb' + c.id })}<span class="tag">${c.photos2.slip} · ${c.photos2.at.slice(5)}</span></div></div></div>`).join('')}</div>`;
    } else if (PTAB === 'queue') {
      body = `<div class="hint" style="margin-bottom:12px">${icon('check')}<span>판독 보류 사진을 사람이 확인해 바로잡습니다. 수정 결과와 이력은 <b>재학습 검토 자료</b>로 저장됩니다. 재처리는 샘플 인식 결과를 저장하며, 담당자가 확인한 뒤 최종 확정합니다.</span></div>
      <div class="tw"><table class="tbl"><thead><tr><th>대기 ID</th><th>사진</th><th>인식 결과</th><th>입력 차량번호</th><th>보류 사유</th><th>수정</th></tr></thead><tbody>${pend.map(p => { const fx = C.S.plateFix[p.id], run = C.S.photoRuns[p.id]; return `<tr><td class="mono nw">${p.id}<small>${p.c.slips[0].no}</small></td><td style="width:170px"><div class="phw">${C.photo(Object.assign({}, p.c.slips[0].photo, { night: p.why === '야간' }), { k: 'q' + p.id })}</div></td>
        <td class="nw"><span class="plate">${esc(run ? run.read : p.read)}</span><small>신뢰도 ${run ? run.conf.toFixed(2) : p.conf}</small>${run ? `<small>샘플 재처리 · ${esc(run.at.slice(11))}</small>` : ''}</td><td><span class="plate">${esc(p.c.slips[0].vehicle)}</span></td><td><span class="chip a">${p.why}</span></td>
        <td class="nw">${fx ? `<span class="chip t">${icon('check')} ${esc(fx.v)}</span><small>${esc(fx.by)} · 재학습 검토 자료</small>` : `<div style="display:flex;gap:6px"><input class="inp" style="width:120px;padding:6px 8px" data-fixv="${p.id}" value="${esc(run ? run.read : p.c.slips[0].vehicle)}" aria-label="확정 번호" ${A.can('rawPhoto') ? '' : 'disabled'}><button class="btn sm go" data-fix="${p.id}" ${A.can('rawPhoto') ? '' : 'disabled'}>확정</button><button class="btn sm" data-rerun="${p.id}" title="재처리" ${A.can('rawPhoto') ? '' : 'disabled'}>${icon('refresh')}</button></div>`}</td></tr>`; }).join('')}</tbody></table></div>`;
    } else {
      const c = D.CASES[0];
      body = `<div class="g g2"><div class="card flat"><div class="hd"><h3 style="font-size:14px">담당자 화면 표시 (얼굴 가림)</h3><span class="chip t">기본</span></div><div class="phw" id="faceBox">${C.photo(c.slips[0].photo, { privacy: true, k: 'f1' })}</div></div>
        <div class="card flat"><div class="hd"><h3 style="font-size:14px">원본 열람 절차</h3></div><p class="muted" style="font-size:13px">원본 사진은 암호화해 보관하고, 화면에는 얼굴을 자동으로 가린 사본을 보여 줍니다. 원본이 필요하면 <b>열람 사유</b>를 남기고 30초 동안만 표시하며, 열람 기록은 <b>감사 로그</b>에 남습니다.</p>
        <div class="fld" style="margin-top:12px"><label for="rawWhy">열람 사유</label><select class="inp" id="rawWhy"><option>차량 동일성 확인 (공단 협의 자료)</option><option>운전자 소명 확인</option><option>번호판 판독 불가 재확인</option></select></div>
        <button class="btn pri" id="rawBtn" ${A.can('rawPhoto') ? '' : 'disabled'}>${icon('eye')} 원본 30초 열람</button><p class="faint" style="font-size:12px;margin-top:8px">사진은 생성 이미지이며 번호판·인식값은 체험용 가상 값입니다. 운영 시 원본은 조합 환경에서 처리하고 열람 사유를 기록합니다.</p></div></div>`;
    }
    const html = `<div class="card" style="padding-bottom:6px"><div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" data-pt="${k}" class="${PTAB === k ? 'on' : ''}">${l}</button>`).join('')}</div>${body}</div>`;
    return {
      title: '사진 AI 검수', crumb: '점검 업무', html, mount(el) {
        $$('[data-pt]', el).forEach(b => b.onclick = () => { PTAB = b.dataset.pt; A.render(); });
        $$('[data-fix]', el).forEach(b => b.onclick = () => { if (!A.can('rawPhoto')) { A.toast('검수 권한이 없습니다', 'lock'); return; } const id = b.dataset.fix; const v = $(`[data-fixv="${id}"]`, el).value.trim(); if (!/^\d{2,3}[가-힣]\d{4}$/.test(v.replace(/\s/g, ''))) { A.toast('차량번호 형식을 확인해 주세요. 예: 12가3456', 'x'); return; } C.S.plateFix[id] = { v, by: C.S.user.name, at: C.now() }; C.save(); C.audit('AI 결과 수정', id, v); A.toast('인식 결과를 수정했습니다 · 검수 이력 저장'); A.render(); });
        $$('[data-rerun]', el).forEach(b => b.onclick = () => {
          if (!A.can('rawPhoto') || b.disabled) return;
          const item = pend.find(p => p.id === b.dataset.rerun);
          if (!item) return;
          const row = b.closest('tr'); $$('button,input', row).forEach(x => x.disabled = true);
          b.textContent = '처리 중';
          A.later(() => {
            C.S.photoRuns[item.id] = { read: item.c.slips[0].vehicle, conf: Math.min(.95, item.conf + .1), at: C.now(), by: C.S.user.name };
            C.save(); C.audit('사진 재처리 체험', item.id, '샘플 인식 결과 저장 · 담당자 최종 확인 필요');
            A.render(); A.toast('샘플 재처리 결과를 저장했습니다. 번호판을 확인한 뒤 확정해 주세요');
          }, 700);
        });
        const rb = $('#rawBtn', el);
        if (rb) rb.onclick = () => {
          if (!A.can('rawPhoto')) return;
          const c = D.CASES[0]; const box = $('#faceBox', el);
          box.innerHTML = C.photo(c.slips[0].photo, { privacy: true, k: 'f2', blur: false }) + '<span class="tag" style="background:#C02626">원본 열람 중 · 30초</span>';
          C.audit('원본 사진 열람', c.slips[0].photo.id, $('#rawWhy', el).value); A.toast('원본 열람을 감사 로그에 기록했습니다', 'shield');
          rb.disabled = true; A.later(() => { if (document.body.contains(box)) { box.innerHTML = C.photo(c.slips[0].photo, { privacy: true, k: 'f3' }); rb.disabled = false; } }, 30000);
        };
      }
    };
  });
})();
