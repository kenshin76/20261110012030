/* 탐지 운영 화면: 탐지 규칙 · 규칙 편집기 · 케이스 카드 · 모델 관리 · 백테스트 */
(function () {
  'use strict';
  const D = window.DATA, C = window.CORE, A = window.APP;
  const { esc, fmt, icon, $, $$ } = C;
  const catOf = r => D.CATS[r.cat] || { name: '신규', color: '#64748B' };
  const stCls = s => ({ '운영': 'st-ops', '검증': 'st-ver', '후보': 'st-cand', '중지': 'st-stop' }[s] || '');
  const stDot = s => `<span class="${stCls(s)}" style="font-weight:700;font-size:12.5px;white-space:nowrap"><span class="dot"></span> ${esc(s)}</span>`;
  const valTxt = (p, v) => `${v}${p.unit ? ' ' + p.unit : ''}`;
  const S0 = r => (C.S.newRules.find(x => x.id === r.id) || r);
  function hl(sql) {
    return esc(sql).replace(/(--[^\n]*)/g, '<span class="cm">$1</span>')
      .replace(/\b(SELECT|FROM|JOIN|WHERE|AND|OR|ON|AS|NOT|EXISTS|IN|BETWEEN|interval|now)\b/g, '<span class="kw">$1</span>')
      .replace(/\{\{([^}]+)\}\}/g, '<span class="pm">{{$1}}</span>').replace(/('[^'\n]*')/g, '<span class="str">$1</span>');
  }

  /* ================= 규칙 목록 ================= */
  const RF = { cat: '', stage: '', status: '' };
  A.reg('rules', () => {
    const rules = C.allRules();
    const counts = Object.keys(D.CATS).map(k => [k, rules.filter(r => r.cat === k).length]);
    const html = `<div class="g g4">
      <div class="card kpi dark"><small>${icon('rule')} 탐지 규칙</small><div class="v">${rules.length}<em>개</em></div><div class="d">1단계 ${rules.filter(r => r.stage === 1).length} · 2단계 ${rules.filter(r => r.stage === 2).length}${C.S.newRules.length ? ' · 신규 ' + C.S.newRules.length : ''}</div></div>
      <div class="card kpi"><small>운영 중</small><div class="v">${rules.filter(r => r.status === '운영').length}<em>개</em></div><div class="d">검증 ${rules.filter(r => r.status === '검증').length} · 후보 ${rules.filter(r => r.status === '후보').length} · 중지 ${rules.filter(r => r.status === '중지').length}</div></div>
      <div class="card kpi"><small>평균 정탐률 (판정 기준)</small><div class="v">${(rules.reduce((a, r) => a + r.prec, 0) / rules.length * 100).toFixed(1)}<em>%</em></div><div class="d">정탐률이 낮은 규칙은 기준값 검토 대상</div></div>
      <div class="card kpi"><small>이번 달 규칙 변경</small><div class="v">${Object.keys(C.S.ruleOverride).length + 3}<em>건</em></div><div class="d">모든 변경은 사전 계산·승인·이력 관리</div></div></div>
    <div class="card"><div class="hd"><div><h3>${icon('rule')} 규칙 목록</h3><p>탐지 조건과 기준값을 관리합니다. 변경안을 시험한 뒤 승인받아 운영에 반영하세요.</p></div>${A.can('draft') ? `<button class="btn go" id="newRule">${icon('plus')} 규칙 추가</button>` : ''}</div>
      <div class="rulecats" style="margin-bottom:12px"><button data-cat="" class="${RF.cat === '' ? 'on' : ''}">전체 <b>${rules.length}</b></button>${counts.map(([k, n]) => `<button data-cat="${k}" class="${RF.cat === k ? 'on' : ''}"><i class="dot" style="color:${D.CATS[k].color}"></i>${D.CATS[k].name} <b>${n}</b></button>`).join('')}</div>
      <div class="filters" style="margin-bottom:12px"><div class="seg">${[['', '전체 단계'], ['1', '1단계 (6월)'], ['2', '2단계 (10월)']].map(([v, l]) => `<button data-stage="${v}" class="${RF.stage === v ? 'on' : ''}">${l}</button>`).join('')}</div>
        <select id="rfSt" aria-label="상태"><option value="">상태 전체</option>${['운영', '검증', '후보', '중지'].map(s => `<option ${RF.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
      <div class="tw"><table class="tbl"><thead><tr><th>ID</th><th>규칙</th><th>범주 · 단계</th><th>수준</th><th>상태</th><th>기준값</th><th>12개월 탐지</th><th class="r">정탐률</th><th>버전</th></tr></thead><tbody>
      ${rules.filter(r => (!RF.cat || r.cat === RF.cat) && (!RF.stage || String(r.stage) === RF.stage) && (!RF.status || r.status === RF.status)).map(r => {
        const mv = C.monthly(r, r.params[0].v); const p = r.params[0];
        return `<tr class="click" data-r="${r.id}"><td class="mono nw t1">${r.id}</td><td style="min-width:200px"><span class="t1">${esc(r.name)}</span><small>${esc(r.desc)}</small></td><td class="nw"><span class="cat"><i style="background:${catOf(r).color}"></i>${esc(catOf(r).name)}</span><small>${r.stage ? r.stage + '단계' : '신규'}</small></td><td><span class="lv ${r.level}">${r.level}</span></td><td>${stDot(r.status)}</td><td class="nw">${esc(p.label)}<small class="num">${valTxt(p, p.v)}</small></td><td>${C.spark(mv, catOf(r).color)}<small class="num">${fmt(mv.reduce((a, b) => a + b, 0))}건</small></td><td class="r num nw">${(r.prec * 100).toFixed(0)}%</td><td class="nw mono">${esc(r.version)}<small>${r.updated}</small></td></tr>`;
      }).join('')}</tbody></table></div></div>`;
    return {
      title: '탐지 규칙', crumb: '탐지 운영', html, mount(el) {
        $$('[data-cat]', el).forEach(b => b.onclick = () => { RF.cat = b.dataset.cat; A.render(); });
        $$('[data-stage]', el).forEach(b => b.onclick = () => { RF.stage = b.dataset.stage; A.render(); });
        $('#rfSt', el).onchange = e => { RF.status = e.target.value; A.render(); };
        $$('[data-r]', el).forEach(t => t.onclick = () => location.hash = '#/rule/' + t.dataset.r);
        const nb = $('#newRule', el); if (nb) nb.onclick = () => newRuleModal();
      }
    };
  });

  function newRuleModal(from) {
    if (!A.can('draft')) return;
    const m = A.modal('규칙 추가', `<div class="fld"><label for="nrName">규칙 이름</label><input class="inp" id="nrName" value="${esc(from ? from.name : '')}" placeholder="예: 야간 연속 계량 후 주간 실적 집중"></div>
      <div class="g g2" style="gap:10px"><div class="fld"><label for="nrCat">범주</label><select class="inp" id="nrCat">${Object.entries(D.CATS).map(([k, v]) => `<option value="${k}" ${from && k === 'WT' ? 'selected' : ''}>${v.name}</option>`).join('')}</select></div><div class="fld"><label for="nrLv">수준</label><select class="inp" id="nrLv"><option>L3</option><option>L2</option></select></div></div>
      <div class="g g2" style="gap:10px"><div class="fld"><label for="nrPl">기준값 이름</label><input class="inp" id="nrPl" value="${from ? '집중 비율 하한' : '기준값'}"></div><div class="fld"><label for="nrPv">기준값</label><input class="inp num" id="nrPv" value="40" inputmode="decimal"></div></div>
      <div class="hint">${icon('spark')}<span>새 규칙은 <b>후보</b> 상태로 등록되고, 편집기에서 SQL 조건을 작성해 과거 기간으로 시험한 뒤 승인을 거쳐 운영에 반영합니다.</span></div>`, `<button class="btn" data-x>취소</button><button class="btn go" id="nrOk">후보로 등록</button>`);
    $('#nrOk', m).onclick = () => {
      if (!A.can('draft')) return;
      const name = $('#nrName', m).value.trim(); if (!name) { A.toast('규칙 이름을 입력해 주세요', 'x'); return; }
      const cat = $('#nrCat', m).value, n = C.S.newRules.length + 1, id = `U-${String(n).padStart(2, '0')}`;
      const pl = $('#nrPl', m).value.trim() || '기준값', raw = $('#nrPv', m).value.trim(), pv = Number(raw);
      if (!raw || !Number.isFinite(pv) || pv < 0 || pv > 1000000) { A.toast('기준값은 0 이상 1,000,000 이하인 숫자로 입력해 주세요', 'x'); return; }
      C.S.newRules.push({ id, name, desc: from ? from.hyp : '조합이 직접 추가한 규칙', cat, stage: 0, level: $('#nrLv', m).value, status: '후보', version: 'v0.1', params: [{ label: pl, v: pv, unit: '%', min: Math.max(0, pv / 4), max: Math.max(1, pv * 2), step: 0.01, sens: -1 }], base: from ? 4 : 3, prec: from ? from.bt.prec : 0.5, weight: 0.7,
        sql: `-- ${name}\nSELECT t.member_id, t.biz_date, t.metric AS actual_value\nFROM   mart.member_day_stat t\nWHERE  t.biz_date BETWEEN :from AND :to\n  AND  t.metric > {{${pl}}}`, basis: from ? '케이스 카드 ' + from.id : '조합 담당자 작성', updated: D.TODAY, owner: C.S.user.name });
      if (from) C.S.reviewed['card-' + from.id] = '규칙 등록';
      C.save(); C.audit('규칙 추가(후보)', id, name); A.closeModal(); A.toast(`${id} 「${name}」을 후보로 등록했습니다`); location.hash = '#/rule/' + id;
    };
  }

  /* ================= 규칙 편집기 ================= */
  A.reg('rule', ([id]) => {
    const r = C.rule(id) || C.rule('WT-04');
    const p = r.params[0];
    const dr = C.S.ruleDrafts[r.id] || { v: p.v, sql: r.sql, stage: 'edit' };
    const canEdit = A.can('draft'), canApprove = A.can('approve');
    const hist = (C.S.ruleOverride[r.id] && C.S.ruleOverride[r.id].history) || [];
    const orig = D.ruleById[r.id] || S0(r);
    const baseHist = [{ ver: r.stage ? 'v1.0' : 'v0.1', at: r.stage === 1 ? '2027-05-24' : r.stage ? '2027-10-01' : orig.updated, by: r.stage ? '구축 수행사' : orig.owner, note: r.stage ? '최초 등록 (규칙 명세 근거표 반영)' : '후보 등록', v: '' }];
    if (r.stage) baseHist.push({ ver: orig.version, at: orig.updated, by: orig.owner, note: r.stage === 1 ? '1단계 운영 판정 결과로 기준값 조정' : '2단계 시험 결과로 기준값 확정', v: '' });
    const steps = [['edit', '편집'], ['tested', '시험 실행'], ['requested', '승인 요청'], ['live', '운영 반영']];
    const si = steps.findIndex(s => s[0] === dr.stage);
    const html = `<div class="case-top"><div><a class="btn sm ghost" href="#/rules">${icon('left')} 규칙 목록</a><h2 style="margin-top:6px"><span class="mono" style="font-size:16px;color:var(--ink3)">${r.id}</span> ${esc(r.name)} <span class="lv ${r.level}">${r.level}</span></h2>
      <div class="meta"><span class="cat"><i style="background:${catOf(r).color}"></i>${esc(catOf(r).name)}</span><span>${r.stage ? r.stage + '단계' : '신규'}</span><span>${stDot(r.status)}</span><span>${esc(r.version)} · ${r.updated} · ${esc(r.owner)}</span></div></div>
      <div class="flow" aria-label="운영 반영 절차">${steps.map(([k, l], i) => `${i ? '<span class="ar">→</span>' : ''}<span class="${i < si ? 'done' : i === si ? 'on' : ''}">${l}</span>`).join('')}</div></div>
    ${canEdit ? '' : `<div class="hint">${icon('lock')}<span><b>${esc(C.S.user.role)}</b> 역할은 규칙을 조회만 할 수 있습니다. 초안 작성은 분석가, 운영 승인은 관리자가 담당합니다.</span></div>`}
    <div class="editor"><div style="display:flex;flex-direction:column;gap:16px;min-width:0">
      <div class="code"><div class="bar"><i></i><i></i><i></i><span style="margin-left:6px">${r.id}.sql · 조건 SQL 템플릿 (읽기 전용 권한으로 실행)</span></div>${canEdit ? `<textarea id="sqlEd" spellcheck="false" aria-label="조건 SQL">${esc(dr.sql)}</textarea>` : `<pre>${hl(r.sql)}</pre>`}</div>
      <div class="hint">${icon('sql')}<span><b>{{${esc(p.label)}}}</b> 자리에 오른쪽 기준값이 들어갑니다. 운영 규칙은 데이터 변경 문장(INSERT·UPDATE·DELETE 등)을 쓸 수 없고, 결과에는 규칙 ID·버전·기준값·실제값·원천 행이 자동으로 붙습니다.</span></div>
      <div class="card"><div class="hd"><h3>${icon('play')} 시험 실행 결과</h3><p id="testMeta">${dr.test ? dr.test.meta : '시험 실행 전'}</p></div><div id="testOut">${dr.test ? dr.test.html : '<p class="empty">기준값을 정하고 「시험 실행」을 누르면 과거 12개월 데이터로 탐지 결과를 미리 봅니다.</p>'}</div></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px;min-width:0">
      <div class="param"><div class="hd" style="margin-bottom:6px"><h3 style="font-size:14px">기준값</h3><span class="faint" style="font-size:12px">현재 운영값 ${valTxt(p, p.v)}</span></div>
        <label for="pv" style="font-size:12.5px;font-weight:700">${esc(p.label)}</label><div class="row"><input type="range" id="pv" min="${p.min}" max="${p.max}" step="${p.step}" value="${dr.v}" ${canEdit ? '' : 'disabled'}><span class="val" id="pvv">${valTxt(p, dr.v)}</span></div>
        <div class="delta" id="delta"></div></div>
      <div class="card"><div class="hd"><h3>변경 전후 탐지 건수 (사전 계산)</h3><div class="legend"><span><i style="background:#9FB1B8"></i>현재</span><span><i style="background:var(--teal)"></i>변경안</span></div></div><div id="preChart"></div><p class="faint" style="font-size:12px">2027-03 ~ 2028-02 · 운영 반영 전에 과거 기간으로 다시 계산한 값입니다.</p></div>
      ${canEdit || canApprove ? `<div class="card"><div style="display:flex;flex-direction:column;gap:8px">
        ${canEdit ? `<button class="btn" id="btnTest">${icon('play')} 시험 실행 (과거 12개월)</button>` : ''}
        ${canEdit ? `<button class="btn pri" id="btnReq" ${dr.stage === 'tested' ? '' : 'disabled'}>${icon('arrow')} 승인 요청</button>` : ''}
        ${canApprove ? `<button class="btn go" id="btnApprove" ${dr.stage === 'requested' ? '' : 'disabled'}>${icon('check')} 승인하고 운영 반영</button>` : ''}
        ${dr.stage === 'requested' && !canApprove ? `<div class="alert a">${icon('clock')}<span>관리자 승인을 기다리고 있습니다. 관리자가 변경안을 확인한 뒤 운영에 반영합니다.</span></div>` : ''}
        ${A.can('approve') && r.status !== '중지' ? `<button class="btn sm ghost" id="btnStop" style="color:var(--ink3)">운영 중지</button>` : ''}
        ${A.can('approve') && r.status === '중지' ? `<button class="btn sm" id="btnResume">운영 재개</button>` : ''}</div></div>` : ''}
      <div class="card"><div class="hd"><h3 style="font-size:14px">규칙 근거표</h3></div><table class="diff"><tbody>
        <tr><th>지침·매뉴얼</th><td>${esc(r.basis)}</td></tr><tr><th>데이터 필드</th><td class="mono">${esc((r.sql.match(/mart\.[a-z_]+/g) || ['mart.*']).filter((x, i, a) => a.indexOf(x) === i).join(', '))}</td></tr>
        <tr><th>기준값</th><td>${esc(p.label)} ${valTxt(p, p.v)}</td></tr><tr><th>예외</th><td>소명 확인 건(사유 코드 N01)은 같은 조건 재탐지 시 참고 표시</td></tr></tbody></table></div>
      <div class="card"><div class="hd"><h3 style="font-size:14px">변경 이력</h3></div><div class="vers">${hist.slice().reverse().map((h, i) => `<div class="ver ${i === 0 ? 'cur' : ''}"><b>${h.ver}</b><div><small>${h.at} · ${esc(h.by)}</small><span style="font-size:12.5px">${esc(h.note)}</span></div>${i === 0 && canApprove ? `<button class="btn sm" id="btnRollback">${icon('undo')} 되돌리기</button>` : '<span></span>'}</div>`).join('')}
        ${baseHist.slice().reverse().map((h, i) => `<div class="ver ${!hist.length && i === 0 ? 'cur' : ''}"><b>${h.ver}</b><div><small>${h.at} · ${esc(h.by)}</small><span style="font-size:12.5px">${esc(h.note)}</span></div><span></span></div>`).join('')}</div></div>
    </div></div>`;
    function mount(el) {
      const draft = () => (C.S.ruleDrafts[r.id] = C.S.ruleDrafts[r.id] || { v: p.v, sql: r.sql, stage: 'edit' });
      function upd() {
        const v = Number($('#pv', el).value);
        $('#pvv', el).textContent = valTxt(p, v);
        const a = C.monthly(r, p.v), b = C.monthly(r, v);
        const sa = a.reduce((x, y) => x + y, 0), sb = b.reduce((x, y) => x + y, 0);
        const pa = C.precisionAt(r, p.v), pb = C.precisionAt(r, v);
        const d = sb - sa;
        $('#delta', el).innerHTML = `<div><small>12개월 탐지</small><b class="num">${fmt(sa)} → ${fmt(sb)}</b></div><div><small>증감</small><b class="num ${d > 0 ? 'up' : d < 0 ? 'dn' : ''}">${d > 0 ? '+' : ''}${fmt(d)}건 (${sa ? (d / sa * 100).toFixed(0) : 0}%)</b></div><div><small>예상 정탐률</small><b class="num">${(pa * 100).toFixed(0)}% → ${(pb * 100).toFixed(0)}%</b></div><div><small>주당 검토 부담</small><b class="num">${(sb / 52).toFixed(1)}건</b></div>`;
        $('#preChart', el).innerHTML = C.bars([a, b], { labels: C.MONTHS.map(m => m.slice(-2)), colors: ['#9FB1B8', 'var(--teal)'], h: 170, title: '변경 전후 월별 탐지 건수' });
      }
      $('#pv', el).oninput = () => { const d = draft(); d.v = Number($('#pv', el).value); if (d.stage !== 'edit') { d.stage = 'edit'; d.test = null; C.save(); A.render(); return; } C.save(); upd(); };
      upd();
      const ed = $('#sqlEd', el);
      if (ed) ed.oninput = () => { const d = draft(); d.sql = ed.value; if (d.stage !== 'edit') { d.stage = 'edit'; d.test = null; $('#btnReq', el) && ($('#btnReq', el).disabled = true); } C.save(); };
      const bt = $('#btnTest', el);
      if (bt) bt.onclick = () => {
        const d = draft(); const sql = (ed ? ed.value : r.sql);
        if (/\b(insert|update|delete|drop|alter|truncate|create|grant)\b/i.test(sql)) { $('#testOut', el).innerHTML = `<div class="alert r">${icon('x')}<span>데이터를 바꾸는 문장은 규칙에 쓸 수 없습니다. SELECT 조건만 작성해 주세요.</span></div>`; return; }
        if (!/select/i.test(sql) || !sql.includes('{{' + p.label + '}}')) { $('#testOut', el).innerHTML = `<div class="alert r">${icon('x')}<span>SELECT 문과 기준값 자리 <b>{{${esc(p.label)}}}</b>가 있어야 합니다.</span></div>`; return; }
        bt.disabled = true; bt.innerHTML = `${icon('refresh')} 실행 중…`;
        if (ed) ed.readOnly = true;
        $('#pv', el).disabled = true;
        A.later(() => {
          const b = C.monthly(r, d.v), tot = b.reduce((x, y) => x + y, 0);
          const sample = D.CASES.filter(c => c.ruleId === r.id).concat(D.CASES).slice(0, 6);
          const rows = sample.map((c, i) => `<tr><td class="mono nw">${C.MONTHS[11 - i]}</td><td class="nw">${esc(D.memberById[c.memberId].short)}</td><td class="mono">${c.slips[0].no}</td><td class="mono">${c.slips[0].vehicle}</td><td>${esc(c.basis[1] ? c.basis[1][1] : '')}</td></tr>`).join('');
          d.test = { meta: `${C.now().slice(11)} 실행 · 4.8초 · 읽기 전용`, html: `<div class="alert t" style="margin-bottom:10px">${icon('check')}<span>체험용 조건 검사 통과 · 과거 12개월 <b>${fmt(tot)}건</b> 탐지 (기준값 ${valTxt(p, d.v)}). 결과에 규칙 ID·버전·기준값·실제값·원천 행이 붙었습니다.</span></div><div class="tw"><table class="tbl"><thead><tr><th>월</th><th>회원사</th><th>원천 전표</th><th>차량</th><th>실제값</th></tr></thead><tbody>${rows}</tbody></table></div>` };
          d.stage = 'tested'; C.save(); C.audit('규칙 시험 실행', r.id, valTxt(p, d.v)); A.render(); A.toast('시험 실행을 마쳤습니다');
        }, 900);
      };
      const rq = $('#btnReq', el);
      if (rq) rq.onclick = () => { if (!A.can('draft')) return; const d = draft(); if (d.stage !== 'tested' || !d.test) { A.toast('현재 변경안으로 시험을 먼저 실행해 주세요', 'x'); return; } d.stage = 'requested'; d.reqBy = C.S.user.name; C.save(); C.audit('규칙 변경 승인 요청', r.id, valTxt(p, d.v)); A.render(); A.toast('관리자에게 승인을 요청했습니다'); };
      const ap = $('#btnApprove', el);
      if (ap) ap.onclick = () => {
        if (!A.can('approve')) return; const d = draft(); if (d.stage !== 'requested' || !d.test) return;
        const o = C.S.ruleOverride[r.id] || { history: [] };
        const prevVer = r.version; const nv = 'v' + (parseFloat(prevVer.slice(1)) + 0.1).toFixed(1);
        o.history = (o.history || []).concat([{ ver: nv, at: C.now(), by: C.S.user.name + (d.reqBy && d.reqBy !== C.S.user.name ? ` (요청 ${d.reqBy})` : ''), note: `${p.label} ${valTxt(p, p.v)} → ${valTxt(p, d.v)}`, prev: { v: p.v, sql: r.sql, version: prevVer, status: r.status } }]);
        o.params = [Object.assign({}, p, { v: d.v })]; o.sql = d.sql; o.version = nv; o.status = '운영'; o.updated = D.TODAY; o.owner = C.S.user.name;
        C.S.ruleOverride[r.id] = o; d.stage = 'live'; C.save(); C.audit('규칙 운영 반영', r.id, `${prevVer}→${nv} · ${valTxt(p, d.v)}`);
        delete C.S.ruleDrafts[r.id]; C.save(); A.render(); A.toast(`${r.id} ${nv}을(를) 운영에 반영했습니다 · 오늘 밤 판정부터 적용`);
      };
      const rb = $('#btnRollback', el);
      if (rb) rb.onclick = () => {
        if (!A.can('approve')) return; const o = C.S.ruleOverride[r.id]; const last = o.history.pop();
        Object.assign(o, { params: [Object.assign({}, p, { v: last.prev.v })], sql: last.prev.sql, version: last.prev.version, status: last.prev.status });
        if (!o.history.length) delete C.S.ruleOverride[r.id];
        C.save(); C.audit('규칙 되돌리기', r.id, `${last.ver} → ${last.prev.version}`); A.render(); A.toast(`${last.prev.version}(으)로 되돌렸습니다`, 'undo');
      };
      const stp = $('#btnStop', el), rsm = $('#btnResume', el);
      const setSt = s => { if (!A.can('approve')) return; const o = C.S.ruleOverride[r.id] || { history: [] }; o.status = s; C.S.ruleOverride[r.id] = o; C.save(); C.audit('규칙 상태 변경', r.id, s); A.render(); A.toast(`${r.id} 상태: ${s}`); };
      if (stp) stp.onclick = () => setSt('중지');
      if (rsm) rsm.onclick = () => setSt('운영');
    }
    return { title: `규칙 ${r.id}`, crumb: '탐지 운영 · 탐지 규칙', html, mount };
  });

  /* ================= 케이스 카드 ================= */
  let CTAB = 'new';
  A.reg('cards', () => {
    const st = id => (C.S.reviewed['card-' + id] || '후보');
    const body = CTAB === 'new' ? `<div class="hint" style="margin-bottom:12px">${icon('spark')}<span>2022~2025년 데이터 마이닝으로 찾은 <b>47개 외 신규 케이스(L3) 제안 ${D.NEW_CASES.length}건</b>입니다. 채택 여부는 조합이 결정하고, 채택한 케이스는 규칙 편집기로 등록합니다.</span></div>
      <div class="ccards">${D.NEW_CASES.map(n => `<div class="cc"><div style="display:flex;justify-content:space-between;align-items:center"><span class="mono faint">${n.id}</span><span class="${stCls(st(n.id))}" style="font-size:12px;font-weight:800"><span class="dot"></span> ${st(n.id)}</span></div><h4>${esc(n.name)}</h4><p><b style="color:var(--ink2)">가설</b> ${esc(n.hyp)}</p><p><b style="color:var(--ink2)">데이터</b> <span class="mono">${esc(n.data)}</span></p>
        <div style="display:flex;gap:12px;font-size:12px;color:var(--ink3)"><span>백테스트 <b class="num" style="color:var(--ink)">${n.bt.cnt22_25}</b>건</span><span>공단 차감 적중 <b class="num" style="color:var(--ink)">${n.bt.hitAgency}</b></span><span>예상 정탐률 <b class="num" style="color:var(--ink)">${Math.round(n.bt.prec * 100)}%</b></span></div>
        <div class="ft"><span class="lv L3">L3</span>${A.can('draft') ? (st(n.id) === '후보' ? `<button class="btn sm" data-ver="${n.id}">검증 시작</button>` : '') + (st(n.id) !== '규칙 등록' ? `<button class="btn sm go" data-adopt="${n.id}">규칙으로 등록</button>` : '<span class="chip t">규칙 등록됨</span>') : ''}</div></div>`).join('')}</div>`
      : `<div class="ccards">${C.allRules().slice(0, 47).map(r => `<a class="cc" href="#/rule/${r.id}"><div style="display:flex;justify-content:space-between"><span class="mono faint">${r.id}</span>${stDot(r.status)}</div><h4>${esc(r.name)}</h4><p><b style="color:var(--ink2)">가설</b> ${esc(r.desc)}</p><p><b style="color:var(--ink2)">로직·기준값</b> ${esc(r.params[0].label)} ${valTxt(r.params[0], r.params[0].v)}</p><div class="ft"><span class="lv ${r.level}">${r.level}</span><span class="chip">정탐률 ${Math.round(r.prec * 100)}%</span><span class="chip">${r.stage}단계</span></div></a>`).join('')}</div>`;
    const html = `<div class="card"><div class="tabs"><button data-ct="new" class="${CTAB === 'new' ? 'on' : ''}">신규 케이스 제안 (L3) ${D.NEW_CASES.length}</button><button data-ct="ops" class="${CTAB === 'ops' ? 'on' : ''}">운영 규칙 카드 47</button></div>${body}</div>`;
    return {
      title: '케이스 카드', crumb: '탐지 운영', html, mount(el) {
        $$('[data-ct]', el).forEach(b => b.onclick = () => { CTAB = b.dataset.ct; A.render(); });
        $$('[data-ver]', el).forEach(b => b.onclick = () => { C.S.reviewed['card-' + b.dataset.ver] = '검증'; C.save(); C.audit('케이스 카드 검증 시작', b.dataset.ver); A.render(); A.toast('검증 단계로 옮겼습니다'); });
        $$('[data-adopt]', el).forEach(b => b.onclick = () => { const n = D.NEW_CASES.find(x => x.id === b.dataset.adopt); newRuleModal(n); });
      }
    };
  });

  /* ================= 모델 관리 ================= */
  A.reg('models', () => {
    const ms = D.MODELS.map(m => { const s = C.S.models[m.id] || {}; return Object.assign({}, m, { current: s.current || m.current, versions: (s.extra || []).concat(m.versions) }); });
    const html = `<div class="hint">${icon('model')}<span>재학습은 <b>버튼 또는 예약 작업</b>으로 실행합니다. 새 모델은 이전 버전과 같은 시험 데이터(연도 분할)로 비교한 뒤 <b>승인해야</b> 운영에 반영되고, 문제가 있으면 이전 버전으로 바로 되돌립니다. 판정 이력과 AI 검수 수정 결과가 다음 학습의 라벨이 됩니다.</span></div>
    ${ms.map(m => `<div class="card"><div class="hd"><div><h3>${icon('model')} ${esc(m.name)} <span class="chip">${esc(m.type)}</span></h3><p>운영 버전 <b>${esc(m.current)}</b> · 지표: ${m.metrics.map(esc).join(' / ')}</p></div><button class="btn go" data-train="${m.id}" ${A.can('retrain') ? '' : 'disabled'}>${icon('refresh')} 재학습 실행</button></div>
      <div class="g ${m.features ? 'g21' : ''}"><div class="vers">${m.versions.map(v => `<div class="ver ${v.v === m.current ? 'cur' : ''}"><b>${v.v}</b><div><small>${v.at} · ${esc(v.data)}</small><span style="font-size:12.5px"><span class="num">${m.metrics[0]} ${typeof v.m1 === 'number' && v.m1 < 1 ? (v.m1 * 100).toFixed(1) + '%' : v.m1}</span> · <span class="num">${m.metrics[1]} ${(v.m2 * 100).toFixed(1)}%</span> · ${esc(v.note)}</span></div>${v.v === m.current ? '<span class="chip t">운영</span>' : A.can('approve') ? `<button class="btn sm" data-use="${m.id}|${v.v}">${icon('undo')} 이 버전으로</button>` : '<span></span>'}</div>`).join('')}</div>
      ${m.features ? `<div><p style="font-size:12.5px;font-weight:700;color:var(--ink2);margin-bottom:8px">영향 특성 상위 5개 (예: 한결리사이클 2028-02)</p><div class="hbar">${m.features.map(([n, w]) => `<div class="row"><span>${esc(n)}</span><span class="tr"><i style="width:${w / 0.31 * 100}%"></i></span><b>${w.toFixed(2)}</b></div>`).join('')}</div><p class="faint" style="font-size:12px;margin-top:8px">담당자 화면에도 점수와 함께 이 5개를 근거로 표시합니다.</p></div>` : ''}</div></div>`).join('')}`;
    return {
      title: '모델 관리', crumb: '탐지 운영', html, mount(el) {
        $$('[data-use]', el).forEach(b => b.onclick = () => { if (!A.can('approve')) return; const [mid, v] = b.dataset.use.split('|'); C.S.models[mid] = Object.assign(C.S.models[mid] || {}, { current: v }); C.save(); C.audit('모델 버전 전환', mid, v); A.render(); A.toast(`${v}(으)로 전환했습니다`, 'undo'); });
        $$('[data-train]', el).forEach(b => b.onclick = () => train(ms.find(m => m.id === b.dataset.train)));
      }
    };
  });
  function train(m) {
    if (!A.can('retrain')) return;
    const stp = ['학습 데이터 추출 (판정 이력·검수 수정 포함)', '특성 생성', '모델 학습', '시험 데이터 평가 (연도 분할)', '이전 버전과 비교 보고서'];
    const md = A.modal(`${m.name} 재학습`, `<div class="fld"><label>학습 기간</label><select class="inp" id="trp"><option>2022-01 ~ 2028-02 (전체)</option><option>2025-01 ~ 2028-02 (최근 3년)</option></select></div><div class="run" id="trRun">${stp.map(s => `<div class="stp"><i></i>${s}</div>`).join('')}</div><div id="trRes" style="margin-top:12px"></div>`, `<button class="btn" data-x>닫기</button><button class="btn go" id="trGo">${icon('play')} 시작</button>`);
    $('#trGo', md).onclick = () => {
      $('#trGo', md).disabled = true; const items = $$('.stp', md); let i = 0;
      const tick = () => {
        items.forEach((x, k) => { x.className = 'stp' + (k < i ? ' done' : k === i ? ' on' : ''); });
        if (i < items.length) { i++; A.later(tick, 650, md); return; }
        const cur = m.versions.find(v => v.v === m.current) || m.versions[0];
        const nv = 'v' + (parseFloat(m.versions[0].v.slice(1)) + 0.1).toFixed(1);
        const n1 = cur.m1 < 1 ? Math.min(0.99, cur.m1 + 0.012) : cur.m1, n2 = m.id === 'plate' ? Math.max(0.01, cur.m2 - 0.004) : Math.min(0.99, cur.m2 + 0.02);
        const f = x => x < 1 ? (x * 100).toFixed(1) + '%' : x;
        $('#trRes', md).innerHTML = `<table class="diff"><thead><tr><th>지표</th><th>운영 ${cur.v}</th><th>새 ${nv}</th></tr></thead><tbody><tr><td>${m.metrics[0]}</td><td class="num">${f(cur.m1)}</td><td class="num"><ins>${f(n1)}</ins></td></tr><tr><td>${m.metrics[1]}</td><td class="num">${f(cur.m2)}</td><td class="num"><ins>${f(n2)}</ins></td></tr></tbody></table>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">${A.can('approve') ? `<button class="btn go" id="trOk">${icon('check')} 승인하고 교체</button>` : `<span class="chip a">관리자 승인 대기로 등록</span>`}</div>`;
        const v = { v: nv, at: D.TODAY, data: $('#trp', md).value, m1: n1, m2: n2, note: `${C.S.user.name} 재학습 체험`, state: '대기' };
        const s = C.S.models[m.id] = C.S.models[m.id] || {}; s.extra = [v].concat(s.extra || []); C.save(); C.audit('모델 재학습', m.id, nv);
        const ok = $('#trOk', md); if (ok) ok.onclick = () => { if (!A.can('approve')) return; s.current = nv; C.save(); C.audit('모델 교체 승인', m.id, nv); A.closeModal(); A.render(); A.toast(`${m.name} ${nv}을(를) 운영에 반영했습니다`); };
      };
      tick();
    };
  }

  /* ================= 백테스트 ================= */
  A.reg('backtest', () => {
    const B = D.BACKTEST; const tot = B.years.reduce((a, y) => a + y.total, 0), hit = B.years.reduce((a, y) => a + y.hit, 0);
    const html = `<section class="hero"><div class="hero-row"><div><h2>2022~2025 백테스트 · 필수 재현 사례 9건</h2><p>사례 발생 당시의 <b style="color:#fff">원천 값·변경 이력·기준정보를 복원</b>해 판정을 다시 실행하고, 복원할 수 없는 사례는 <b style="color:#fff">현재 보존본 기준 검증</b>으로 따로 표시합니다. 공단 최종 결과는 정답 대조에만 쓰고 탐지 입력에는 넣지 않습니다.</p></div>
      <div style="display:flex;gap:10px;align-items:center"><div class="done"><div><small style="color:#8FB5AE;font-size:12px;font-weight:700">필수 재현</small><div class="big">9 / 9</div></div><span class="ok">모두 탐지</span></div><button class="btn go" id="btRun">${icon('play')} 다시 실행</button></div></div></section>
    <div class="card"><div class="hd"><h3>${icon('flag')} 필수 재현 사례</h3><p>사례가 발생한 연도의 데이터로 탐지</p></div><div class="must" id="must">${B.must.map(([id, y, name, rule, at, kg]) => `<div><span class="ok"><svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg></span><small class="mono">${id} · ${y}</small><b>${esc(name)}</b><small>${esc(rule)} ${esc(C.rule(rule).name)} · ${at} 탐지 · ${fmt(kg)} kg</small><div style="margin-top:6px"><span class="chip ${B.restore[id] === '당시 복원' ? 't' : 'a'}">${B.restore[id]}</span></div></div>`).join('')}</div><p class="faint" style="font-size:12px;margin-top:10px">「현재 보존본」 사례는 변경 전 이력이 없어 지금 보존된 과거 자료로 검증했으며, 필요한 이력·원본의 보완 방법을 함께 기록합니다.</p></div>
    <div class="yr">${B.years.map(y => `<div class="card"><small class="faint" style="font-weight:800">${y.y}년</small><div class="num" style="font-size:26px;font-weight:700;color:var(--ink)">${(y.hit / y.total * 100).toFixed(1)}%</div><div class="prog"><i style="width:${y.hit / y.total * 100}%"></i></div><p class="faint" style="font-size:12px;margin-top:6px">공단 차감 ${y.total}건 중 ${y.hit}건 사전 탐지</p><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><span class="chip t">당시 복원 ${y.restored}</span><span class="chip a">현재 보존본 ${y.total - y.restored}</span><span class="chip b">독립 평가 ${(y.indep * 100).toFixed(0)}%</span></div></div>`).join('')}</div>
    <div class="hint">${icon('shield')}<span><b>정보 누출 방지</b> — 규칙 설계에 활용한 재현 사례 9건의 결과와, 설계·학습·기준값 조정에 쓰지 않은 <b>독립 평가 구간</b>의 결과를 따로 집계합니다.</span></div>
    <div class="g g2"><div class="card"><div class="hd"><h3>연도별 재현율</h3><p>전체 ${hit} / ${tot}건 · ${(hit / tot * 100).toFixed(1)}%</p></div>${C.line([{ v: B.years.map(y => +(y.hit / y.total * 100).toFixed(1)), c: 'var(--teal)', area: true }], { min: 70, max: 100, labels: B.years.map(y => String(y.y)), dots: true, fmt: v => v.toFixed(0) + '%' })}</div>
      <div class="card"><div class="hd"><h3>놓친 건의 원인</h3><p>보고서에 건별로 기록</p></div>${C.bars(D.CAUSES.map(k => B.years.map(y => y.miss[k]).reduce((a, b) => a + b, 0)), { labels: D.CAUSES, colors: ['var(--amber)'], h: 180 })}<p class="faint" style="font-size:12px">「데이터 미제공」은 과거 사진·세금계산서 미제공 연도, 「규칙 부재」는 케이스 카드 후보로 연결했습니다.</p></div></div>`;
    return {
      title: '백테스트', crumb: '탐지 운영', html, mount(el) {
        $('#btRun', el).onclick = () => {
          const ds = $$('#must > div', el); ds.forEach(d => d.classList.add('run'));
          A.toast('2022년 스냅샷부터 다시 판정합니다', 'play');
          ds.forEach((d, i) => A.later(() => { d.classList.remove('run'); if (i === ds.length - 1) { A.toast('백테스트 완료 · 필수 재현 9 / 9'); C.audit('백테스트 실행', '2022~2025', '9/9'); } }, 350 * (i + 1)));
        };
      }
    };
  });
})();
