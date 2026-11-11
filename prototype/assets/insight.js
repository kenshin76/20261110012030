/* 현황·분석·관리 화면: 대시보드 · 사업회원 상세 · 셀프 분석 · 보고서 · 데이터 연동 · 기준정보 · 시스템 관리 */
(function () {
  'use strict';
  const D = window.DATA, C = window.CORE, A = window.APP;
  const { esc, fmt, icon, $, $$ } = C;
  const mem = id => D.memberById[id];
  const MLAB = C.MONTHS.map(m => m.slice(2).replace('-', '.'));
  const gradeChip = g => `<span class="chip ${g === 'A' ? 't' : g === 'B' ? 'b' : g === 'C' ? 'a' : 'r'}">${g}등급</span>`;

  /* ================= 실적 품질 대시보드 ================= */
  let DTAB = 'quality';
  A.reg('dash', () => {
    const total = D.MEMBERS.reduce((a, m) => a + m.monthly.reduce((x, y) => x + y, 0), 0);
    const rules = C.allRules();
    const det12 = C.MONTHS.map((_, i) => rules.reduce((a, r) => a + C.monthly(r, r.params[0].v)[i], 0));
    const dedA = C.MONTHS.map((_, i) => +(0.9 + 0.35 * Math.sin(i / 2) + i * 0.04).toFixed(2));
    const dedB = dedA.map((v, i) => +(v * 0.86 + 0.05 * (i % 3)).toFixed(2));
    const regions = D.REGIONS.map(r => { const ms = D.MEMBERS.filter(m => m.region === r.id); return { n: r.name, t: Math.round(ms.reduce((a, m) => a + m.monthly.reduce((x, y) => x + y, 0), 0) / 1000), d: ms.reduce((a, m) => a + m.risk, 0) }; });
    const res = D.RESULTS.map((k, i) => ({ l: k, v: D.HISTORY.filter(h => h.result === k).reduce((a, h) => a + h.kg, 0), c: ['#94A3B8', '#0FB39A', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444'][i] })).filter(x => x.v);
    const tp = D.HISTORY.filter(h => h.result !== '정상').length, fp = D.HISTORY.length - tp;
    const miss = D.AGENCY.filter(a => !a.detected).length;
    let body;
    if (DTAB === 'quality') {
      body = `<div class="g g4">
        <div class="card kpi dark"><small>최근 12개월 재활용 실적</small><div class="v">${fmt(Math.round(total / 1000))}<em>천 톤</em></div><div class="d">사업회원 ${D.MEMBERS.length}곳 · 권역 5</div></div>
        <div class="card kpi"><small>12개월 규칙 적중</small><div class="v">${fmt(det12.reduce((a, b) => a + b, 0))}<em>건</em></div><div class="d">운영 규칙 ${rules.filter(r => r.status === '운영').length}개 · 중복 제거 탐지 대상 ${fmt(Math.round(det12.reduce((a, b) => a + b, 0) * 0.71))}건</div>${C.spark(det12)}</div>
        <div class="card kpi"><small>예상 차감률 (실적 기준)</small><div class="v">${dedA[11]}<em>%</em></div><div class="d">반입량 기준 ${dedB[11]}%</div>${C.spark(dedA, 'var(--amber)')}</div>
        <div class="card kpi"><small>판정 기반 정탐률</small><div class="v">${(tp / D.HISTORY.length * 100).toFixed(1)}<em>%</em></div><div class="d">판정 ${D.HISTORY.length}건 · 오탐 ${fp}건</div></div></div>
      <div class="g g21"><div class="card"><div class="hd"><h3>월별 예상 차감률</h3><div class="legend"><span><i style="background:var(--red)"></i>실적 기준</span><span><i style="background:var(--blue)"></i>반입량 기준</span></div></div>${C.line([{ v: dedA, c: 'var(--red)', area: true }, { v: dedB, c: 'var(--blue)' }], { labels: MLAB, every: 2, min: 0, fmt: v => v.toFixed(1) + '%', dots: true })}</div>
        <div class="card"><div class="hd"><h3>결과 구분별 중량</h3><p>판정 이력 기준</p></div><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">${C.donut(res, { center: fmt(Math.round(res.reduce((a, x) => a + x.v, 0) / 1000)), sub: '톤' })}<div class="legend" style="flex-direction:column;gap:5px">${res.map(x => `<span><i style="background:${x.c}"></i>${x.l} <b class="num">${fmt(Math.round(x.v / 1000))}톤</b></span>`).join('')}</div></div></div></div>
      <div class="g g2"><div class="card"><div class="hd"><h3>권역별 실적</h3><p>천 톤</p></div>${C.bars(regions.map(r => r.t), { labels: regions.map(r => r.n), h: 190, colors: ['var(--teal)'] })}</div>
        <div class="card"><div class="hd"><h3>규칙 범주별 월 탐지</h3></div>${C.bars(C.MONTHS.map((_, i) => rules.filter(r => ['WT', 'NW'].includes(r.cat)).reduce((a, r) => a + C.monthly(r, r.params[0].v)[i], 0)), { labels: MLAB, h: 190, colors: ['var(--violet)'] })}<p class="faint" style="font-size:12px">계량 물리 타당성 + 회원사 간 네트워크 규칙</p></div></div>
      <div class="card"><div class="hd"><h3>회원사 위험 순위</h3><p>위험 점수·품질 지수·예상 차감률</p></div><div class="tw"><table class="tbl"><thead><tr><th>회원사</th><th>권역</th><th class="r">위험 점수</th><th>12개월 추이</th><th>품질 지수</th><th class="r">예상 차감률</th><th class="r">실적(톤)</th></tr></thead><tbody>
        ${D.MEMBERS.slice().sort((a, b) => b.risk - a.risk).map(m => `<tr class="click" data-m="${m.id}"><td class="t1 nw">${esc(m.short)}</td><td>${esc(D.REGIONS.find(r => r.id === m.region).name)}</td><td class="r"><span class="rk ${C.riskClass(m.risk)}">${m.risk}</span></td><td>${C.spark(m.riskTrend, m.risk >= 70 ? 'var(--red)' : 'var(--teal)')}</td><td class="nw">${gradeChip(m.grade)} <span class="num">${m.quality}</span></td><td class="r num">${m.expDeduct}%</td><td class="r num">${fmt(Math.round(m.monthly.reduce((a, b) => a + b, 0)))}</td></tr>`).join('')}</tbody></table></div></div>`;
    } else {
      const ruleRows = C.allRules().slice(0, 47).map(r => { const n = D.HISTORY.filter(h => h.ruleId === r.id); const t = n.filter(h => h.result !== '정상').length; return { r, n: n.length, t, f: n.length - t }; }).filter(x => x.n).sort((a, b) => b.n - a.n).slice(0, 12);
      body = `<div class="g g12"><div class="card"><div class="hd"><h3>탐지 → 검토 → 판정 → 공단 결과</h3><p>2027 점검 연도</p></div><div class="funnel">
        ${[['탐지', 1284, '#0B3B40', 100], ['검토 완료', 1206, '#0E5B5C', 92], ['차감 관련 판정', 842, '#0A8F7B', 78], ['공단 협의·차감 반영', 214, '#0FB39A', 58], ['공단 최종 차감 중 사전 탐지', D.AGENCY.filter(a => a.detected).length, '#7BC93A', 40]].map(([l, v, c, w]) => `<div style="background:${c};width:${w}%"><span>${l}</span><b>${fmt(v)}</b></div>`).join('')}</div>
        <div class="evid" style="grid-template-columns:repeat(3,minmax(0,1fr));margin-top:14px"><div><small>정탐률</small><b class="num">${(tp / D.HISTORY.length * 100).toFixed(1)}%</b></div><div><small>오탐률</small><b class="num">${(fp / D.HISTORY.length * 100).toFixed(1)}%</b></div><div class="k"><small>놓침률 (공단)</small><b class="num">${(miss / D.AGENCY.length * 100).toFixed(1)}%</b></div></div></div>
        <div class="card"><div class="hd"><h3>규칙별 판정 성과</h3><p>판정 건수 상위 12개</p></div><div class="tw"><table class="tbl"><thead><tr><th>규칙</th><th class="r">판정</th><th class="r">정탐</th><th class="r">오탐</th><th>정탐률</th></tr></thead><tbody>${ruleRows.map(x => `<tr class="click" data-rr="${x.r.id}"><td class="nw"><span class="mono t1">${x.r.id}</span><small>${esc(x.r.name)}</small></td><td class="r num">${x.n}</td><td class="r num">${x.t}</td><td class="r num">${x.f}</td><td style="min-width:140px"><div class="prog"><i style="width:${x.t / x.n * 100}%"></i></div><small class="num">${(x.t / x.n * 100).toFixed(0)}%</small></td></tr>`).join('')}</tbody></table></div></div></div>
      <div class="card"><div class="hd"><h3>회원사 품질 지수 · 등급 월별 추이</h3><p>상위 위험 5개 회원사</p></div>${C.line(D.MEMBERS.slice().sort((a, b) => b.risk - a.risk).slice(0, 5).map((m, i) => ({ v: m.riskTrend.map(r => 100 - Math.round(r * 0.55)), c: ['#EF4444', '#F59E0B', '#8B5CF6', '#3B82F6', '#0FB39A'][i] })), { labels: MLAB, every: 2, min: 40, max: 100, h: 200 })}
        <div class="legend">${D.MEMBERS.slice().sort((a, b) => b.risk - a.risk).slice(0, 5).map((m, i) => `<span><i style="background:${['#EF4444', '#F59E0B', '#8B5CF6', '#3B82F6', '#0FB39A'][i]}"></i>${esc(m.short)}</span>`).join('')}</div></div>`;
    }
    const html = `<div class="card" style="padding:6px 18px 0"><div class="tabs" style="margin:0;border:0"><button data-dt="quality" class="${DTAB === 'quality' ? 'on' : ''}">실적 품질 종합 현황</button><button data-dt="perf" class="${DTAB === 'perf' ? 'on' : ''}">탐지 성과 · 품질 지수</button></div></div>${body}`;
    return { title: '실적 품질 대시보드', crumb: '현황 · 분석', html, mount(el) { $$('[data-dt]', el).forEach(b => b.onclick = () => { DTAB = b.dataset.dt; A.render(); }); $$('[data-m]', el).forEach(t => t.onclick = () => location.hash = '#/member/' + t.dataset.m); $$('[data-rr]', el).forEach(t => t.onclick = () => location.hash = '#/rule/' + t.dataset.rr); } };
  });

  /* ================= 사업회원 상세 ================= */
  A.reg('member', ([id]) => {
    const m = mem(id) || D.MEMBERS.slice().sort((a, b) => b.risk - a.risk)[0];
    const cases = D.CASES.filter(c => c.memberId === m.id);
    const hist = D.HISTORY.filter(h => h.member === m.id).slice(0, 8);
    const agency = D.AGENCY.filter(a => a.member === m.id);
    const veh = D.VEHICLES.filter(v => v.member === m.id);
    const partners = D.PARTNERS.slice((m.id.charCodeAt(2) * 3) % 12, (m.id.charCodeAt(2) * 3) % 12 + 6).map((p, i) => ({ p, s: [31, 22, 17, 12, 10, 8][i] }));
    const quality = m.riskTrend.map(r => 100 - Math.round(r * 0.55));
    const map = `<svg viewBox="0 0 100 100" aria-label="사업장 위치(가상 좌표)"><path d="M28 6 C40 2 58 4 66 10 C74 16 80 30 78 44 C84 56 86 70 78 82 C70 92 54 96 42 92 C30 90 18 84 16 72 C12 60 20 50 18 40 C16 28 18 12 28 6Z" fill="#fff" stroke="#BFD9D3" stroke-width=".8"/>
      ${D.MEMBERS.flatMap(x => x.sites.map(s => ({ x, s }))).map(({ x, s }) => `<circle cx="${s.x}" cy="${s.y}" r="${x.id === m.id ? 3.2 : 1.6}" fill="${x.id === m.id ? '#EF4444' : '#0FB39A'}" opacity="${x.id === m.id ? 1 : .55}"><title>${esc(s.name)}</title></circle>`).join('')}
      ${m.sites.map(s => `<text x="${s.x + 4}" y="${s.y + 1.5}" font-size="4" font-weight="700" fill="#0E1C21">${esc(s.name.replace(m.short + ' ', ''))}</text>`).join('')}</svg>`;
    const html = `<div class="case-top"><div><div class="filters"><select id="mSel" class="inp" style="width:auto" aria-label="사업회원 선택">${D.MEMBERS.map(x => `<option value="${x.id}" ${x.id === m.id ? 'selected' : ''}>${esc(x.short)} (${D.REGIONS.find(r => r.id === x.region).name})</option>`).join('')}</select></div>
      <h2 style="margin-top:10px">${esc(m.name)} ${gradeChip(m.grade)}</h2><div class="meta"><span>대표 <b>${esc(m.ceo)}</b></span><span class="mono">${m.bizNo}</span><span>${esc(D.REGIONS.find(r => r.id === m.region).name)}</span><span>허가 품목 ${esc(m.scope)}</span><span>계약 ${m.contractFrom} ~</span></div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn" href="#/reports/member/${m.id}">${icon('report')} 공단 협의 자료</a><a class="btn" href="#/queue" id="mq">${icon('queue')} 이 회원사 대기열</a></div></div>
    <div class="g g4"><div class="card kpi dark"><small>위험 점수</small><div class="v">${m.risk}</div><div class="d">12개월 ${m.riskTrend[0]} → ${m.risk}</div></div>
      <div class="card kpi"><small>품질 지수</small><div class="v">${m.quality}</div><div class="d">${m.grade}등급 · 동종 평균 78</div></div>
      <div class="card kpi"><small>예상 차감률</small><div class="v">${m.expDeduct}<em>%</em></div><div class="d">반입량 기준 ${(m.expDeduct * 0.88).toFixed(2)}%</div></div>
      <div class="card kpi"><small>탐지 · 차감 이력</small><div class="v">${cases.length + hist.length}<em>건</em></div><div class="d">공단 차감 ${agency.length}건 · 행정처분 ${m.risk > 70 ? 1 : 0}건</div></div></div>
    <div class="g g21"><div class="card"><div class="hd"><h3>월별 실적</h3><p>톤 · 2027-03 ~ 2028-02</p></div>${C.bars(m.monthly.map(v => Math.round(v)), { labels: MLAB, h: 190, colors: ['var(--teal)'] })}</div>
      <div class="card"><div class="hd"><h3>사업장</h3><p>가상 좌표</p></div><div class="mini-map">${map}</div>${m.sites.map(s => `<div style="font-size:12.5px;margin-top:8px"><b>${esc(s.name)}</b><br><span class="faint">처리규모 ${s.capacity}톤/일 · 계량대 ${s.gates} · 허가 ~${s.permitTo}</span></div>`).join('')}</div></div>
    <div class="g g2"><div class="card"><div class="hd"><h3>위험 점수 · 품질 지수 추이</h3><div class="legend"><span><i style="background:var(--red)"></i>위험</span><span><i style="background:var(--teal)"></i>품질</span></div></div>${C.line([{ v: m.riskTrend, c: 'var(--red)' }, { v: quality, c: 'var(--teal)' }], { labels: MLAB, every: 2, min: 0, max: 100, dots: true })}</div>
      <div class="card"><div class="hd"><h3>거래처 구성</h3><p>반입 중량 비중</p></div><div class="hbar">${partners.map(({ p, s }) => `<div class="row"><span>${esc(p.name)}</span><span class="tr"><i style="width:${s / 31 * 100}%;${p.status !== '계속' ? 'background:var(--red)' : ''}"></i></span><b>${s}%</b></div>`).join('')}</div>
        <p style="font-size:12.5px;font-weight:700;margin:14px 0 6px">차량 ${veh.length}대</p><div style="display:flex;gap:6px;flex-wrap:wrap">${veh.map(v => `<span class="plate">${esc(v.no)}</span>`).join('')}</div></div></div>
    <div class="card"><div class="hd"><h3>탐지 · 판정 이력</h3></div><div class="tw"><table class="tbl"><thead><tr><th>구분</th><th>규칙</th><th>시기</th><th>결과</th><th class="r">중량</th></tr></thead><tbody>
      ${cases.map(c => `<tr class="click" data-c="${c.id}"><td><span class="chip a">전일 탐지</span></td><td class="nw"><span class="mono">${c.ruleId}</span> ${esc(C.rule(c.ruleId).name)}</td><td>${c.biz}</td><td>${esc(C.S.decisions[c.id] ? C.S.decisions[c.id].result : C.caseStatus(c))}</td><td class="r num">${fmt(c.weightKg)} kg</td></tr>`).join('')}
      ${hist.map(h => `<tr><td><span class="chip">판정</span></td><td class="nw"><span class="mono">${h.ruleId}</span> ${esc(C.rule(h.ruleId).name)}</td><td>2027-${h.month}</td><td>${esc(h.result)}</td><td class="r num">${fmt(h.kg)} kg</td></tr>`).join('')}
      ${agency.map(a => `<tr><td><span class="chip r">공단 차감</span></td><td>${esc(a.type)}</td><td>${a.month}</td><td>${a.detected ? '사전 탐지' : '놓침'}</td><td class="r num">${fmt(a.kg)} kg</td></tr>`).join('')}</tbody></table></div></div>`;
    return { title: '사업회원 상세', crumb: '현황 · 분석', html, mount(el) { $('#mq', el).onclick = e => { e.preventDefault(); A.queueMember(m.id); location.hash = '#/queue'; }; $('#mSel', el).onchange = e => location.hash = '#/member/' + e.target.value; $$('[data-c]', el).forEach(t => t.onclick = () => location.hash = '#/case/' + t.dataset.c); } };
  });

  /* ================= 셀프 분석 ================= */
  const SAMPLES = [
    ['회원사별 전일 탐지 건수', `SELECT m.member_name, count(*) AS detections, sum(d.net_kg) AS kg\nFROM   v_detection d\nJOIN   v_member m USING (member_id)\nWHERE  d.biz_date = DATE '${D.BIZ}'\nGROUP  BY m.member_name\nORDER  BY detections DESC;`],
    ['규칙별 정탐률 (판정 기준)', `SELECT rule_id, count(*) AS judged,\n       avg(CASE WHEN result <> '정상' THEN 1 ELSE 0 END) AS precision\nFROM   v_decision\nGROUP  BY rule_id\nORDER  BY judged DESC;`],
    ['가설 검증: 월말 실적 비중', `SELECT member_name, round(100.0 * sum(CASE WHEN is_month_end_3d THEN kg END) / sum(kg), 1) AS month_end_pct\nFROM   v_member_day\nWHERE  biz_date >= DATE '2027-03-01'\nGROUP  BY member_name\nORDER  BY month_end_pct DESC;`]
  ];
  A.reg('sql', () => {
    const html = `<div class="g g12"><div class="card"><div class="hd"><h3>${icon('dash')} 피벗 분석</h3></div><p class="muted" style="font-size:12.5px;margin-bottom:10px">담당자가 필터·피벗으로 직접 집계합니다.</p>
      <div class="fld"><label for="pvR">행</label><select class="inp" id="pvR"><option value="member">회원사</option><option value="region">권역</option><option value="cat">규칙 범주</option></select></div>
      <div class="fld"><label for="pvV">값</label><select class="inp" id="pvV"><option value="n">탐지 건수</option><option value="kg">탐지 중량(kg)</option><option value="risk">평균 위험 점수</option></select></div>
      <div id="pvOut"></div></div>
      <div class="card"><div class="hd"><div><h3>${icon('sql')} 읽기 전용 SQL</h3><p>분석가용 · 개인정보 컬럼은 가명 뷰(v_*)로만 제공 · 실행 기록은 감사 로그에 남습니다</p></div><span class="chip d">${icon('lock')} READ ONLY</span></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">${SAMPLES.map((s, i) => `<button class="btn sm" data-s="${i}">${esc(s[0])}</button>`).join('')}</div>
      <div class="code"><div class="bar"><i></i><i></i><i></i><span style="margin-left:6px">query.sql</span></div><textarea id="sq" spellcheck="false" aria-label="SQL">${esc(SAMPLES[0][1])}</textarea></div>
      <div style="display:flex;gap:8px;margin:10px 0"><button class="btn go" id="sqRun">${icon('play')} 실행</button><button class="btn" id="sqCsv">${icon('dl')} 결과 내려받기</button><span class="faint" id="sqMeta" style="font-size:12.5px;align-self:center"></span></div><div id="sqOut" class="res"></div>
      <div class="hint" style="margin-top:12px">${icon('sql')}<span>체험에서는 준비된 가상 결과를 조회합니다. 운영 환경의 읽기 전용 SQL·노트북 연결은 관리자에게 요청하세요.</span></div></div></div>`;
    let last = [];
    function run(q, el) {
      if (!A.can('sql')) { $('#sqOut', el).innerHTML = '<p class="empty">SQL 실행은 분석가와 관리자만 사용할 수 있습니다.</p>'; return; }
      last = [];
      if (!q.trim() || !/^\s*select\b/i.test(q) || /\b(insert|update|delete|drop|alter|truncate|create|grant)\b/i.test(q)) { $('#sqOut', el).innerHTML = `<div class="alert r">${icon('x')}<span>읽기 전용 환경입니다. 데이터를 바꾸는 문장은 실행할 수 없습니다.</span></div>`; return; }
      let head, rows;
      if (/precision/i.test(q)) { head = ['rule_id', 'judged', 'precision']; rows = C.allRules().slice(0, 47).map(r => { const n = D.HISTORY.filter(h => h.ruleId === r.id); return [r.id, n.length, n.length ? (n.filter(h => h.result !== '정상').length / n.length).toFixed(3) : '—']; }).filter(r => r[1]).sort((a, b) => b[1] - a[1]); }
      else if (/month_end/i.test(q)) { head = ['member_name', 'month_end_pct']; rows = D.MEMBERS.map(m => [m.short, (18 + (m.risk * 0.27) % 19).toFixed(1)]).sort((a, b) => b[1] - a[1]); }
      else { head = ['member_name', 'detections', 'kg']; rows = D.MEMBERS.map(m => { const cs = D.CASES.filter(c => c.memberId === m.id); return [m.short, cs.length, cs.reduce((a, c) => a + c.weightKg, 0)]; }).filter(r => r[1]).sort((a, b) => b[1] - a[1]); }
      last = [head].concat(rows);
      $('#sqOut', el).innerHTML = `<div class="tw"><table class="tbl"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(v => `<td class="${typeof v === 'number' ? 'r num' : ''}">${typeof v === 'number' ? fmt(v) : esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      $('#sqMeta', el).textContent = `${rows.length}행 · 0.${Math.floor(Math.random() * 8) + 1}초`;
      C.audit('셀프 분석 SQL 실행', 'read-only', `${rows.length}행`);
    }
    function pivot(el) {
      const r = $('#pvR', el).value, v = $('#pvV', el).value;
      const key = c => r === 'member' ? mem(c.memberId).short : r === 'region' ? D.REGIONS.find(x => x.id === c.region).name : (D.CATS[c.ruleId.split('-')[0]] || {}).name;
      const g = {}; D.CASES.forEach(c => { const k = key(c); g[k] = g[k] || []; g[k].push(c); });
      const rows = Object.entries(g).map(([k, cs]) => [k, v === 'n' ? cs.length : v === 'kg' ? cs.reduce((a, c) => a + c.weightKg, 0) : Math.round(cs.reduce((a, c) => a + c.risk, 0) / cs.length)]).sort((a, b) => b[1] - a[1]);
      const max = Math.max(...rows.map(x => x[1]));
      $('#pvOut', el).innerHTML = `<div class="hbar" style="margin-top:6px">${rows.map(([k, n]) => `<div class="row"><span>${esc(k)}</span><span class="tr"><i style="width:${n / max * 100}%"></i></span><b>${fmt(n)}</b></div>`).join('')}</div>`;
    }
    return {
      title: '셀프 분석', crumb: '현황 · 분석', html, mount(el) {
        $$('[data-s]', el).forEach(b => b.onclick = () => { $('#sq', el).value = SAMPLES[b.dataset.s][1]; run($('#sq', el).value, el); });
        $('#sqRun', el).onclick = () => run($('#sq', el).value, el);
        $('#sqCsv', el).onclick = () => { if (!A.can('sql')) return; if (!last.length) run($('#sq', el).value, el); if (!last.length) return; C.downloadCSV('query_result.csv', last); C.audit('분석 결과 내려받기', 'query_result.csv', `${last.length - 1}행`); };
        $('#pvR', el).onchange = () => pivot(el); $('#pvV', el).onchange = () => pivot(el); pivot(el); run($('#sq', el).value, el);
      }
    };
  });

  /* ================= 보고서 ================= */
  A.reg('reports', ([type, id]) => {
    type = type || 'case';
    const LIMIT = 5000;
    const tpls = [['case', '케이스 결과서', '탐지 근거·전표 대조·판정 결과'], ['member', '공단 협의 자료', '회원사별 탐지·판정·예상 차감'], ['annual', '연간 성과 통계', '탐지→판정→공단 결과·규칙별 성과']];
    const c = D.CASES.find(x => x.id === id) || D.CASES[0];
    const m = mem(id) || mem(c.memberId);
    const wm = `${C.S.user.name} · ${D.TODAY} · 대외 반출 금지`;
    let paper, rowsN, csv;
    if (type === 'case') {
      const d = C.S.decisions[c.id];
      paper = `<h2>케이스 결과서</h2><p class="faint" style="text-align:center;font-size:12px">${c.id} · ${D.TODAY}</p><table><tr><th>회원사</th><td>${esc(mem(c.memberId).name)}</td></tr><tr><th>규칙</th><td>${esc(c.ruleId)} ${esc(C.rule(c.ruleId).name)} (${esc(C.rule(c.ruleId).version)})</td></tr><tr><th>탐지 근거</th><td>${c.basis.map(b => esc(b[0] + ': ' + b[1])).join('<br>')}</td></tr><tr><th>원천</th><td>${c.mf.no} · ${c.slips[0].no} · ${c.invoice.no}</td></tr><tr><th>판정</th><td>${d ? `${esc(d.result)} · ${fmt(d.kg)} kg · ${esc(d.reason)} · ${esc(d.by)} ${d.at}` : '미판정'}</td></tr><tr><th>검토 의견</th><td>${d ? esc(d.note || '—') : '—'}</td></tr></table>`;
      rowsN = 1; csv = [['탐지ID', '회원사', '규칙', '판정', '중량'], [c.id, mem(c.memberId).name, c.ruleId, d ? d.result : '미판정', d ? d.kg : c.weightKg]];
    } else if (type === 'member') {
      const cs = D.CASES.filter(x => x.memberId === m.id);
      paper = `<h2>공단 협의 자료</h2><p class="faint" style="text-align:center;font-size:12px">${esc(m.name)} · 2027 실적 연도</p><table><tr><th>예상 차감률</th><td>실적 기준 ${m.expDeduct}% · 반입량 기준 ${(m.expDeduct * 0.88).toFixed(2)}%</td></tr><tr><th>품질 지수</th><td>${m.quality} (${m.grade}등급)</td></tr><tr><th>탐지 건</th><td>${cs.map(x => `${x.id} ${esc(C.rule(x.ruleId).name)} · ${fmt(x.weightKg)} kg`).join('<br>') || '—'}</td></tr><tr><th>조합 사전 조치</th><td>차감방지·사전차감 판정 내역과 소명 확인 결과를 첨부합니다.</td></tr></table>`;
      rowsN = cs.length; csv = [['탐지ID', '규칙', '중량']].concat(cs.map(x => [x.id, x.ruleId, x.weightKg]));
    } else {
      paper = `<h2>연간 성과 통계</h2><p class="faint" style="text-align:center;font-size:12px">2027 점검 연도 · 전 회원사</p><table><tr><th>탐지</th><td>1,284건</td></tr><tr><th>차감 관련 판정</th><td>842건</td></tr><tr><th>공단 최종 차감 사전 탐지</th><td>${D.AGENCY.filter(a => a.detected).length} / ${D.AGENCY.length}건</td></tr><tr><th>규칙별 성과</th><td>규칙 47개 · 상세 통계 시트(전 회원사·월·규칙 12,480행)</td></tr></table>`;
      rowsN = 12480; csv = [['회원사', '월', '규칙', '탐지', '정탐']].concat(Array.from({length: rowsN}, (_, i) => [D.MEMBERS[i % D.MEMBERS.length].name, C.MONTHS[Math.floor(i / D.MEMBERS.length) % 12], C.allRules()[Math.floor(i / 216) % 47].id, 3, 2]));
    }
    const req = C.S.reportReq.find(r => r.type === type && r.userId === C.S.user.id && r.state !== '사용 완료');
    const big = rowsN > LIMIT;
    const html = `<section class="workspace-note"><div><span class="eyebrow">REVIEW & REPORT</span><h3>점검의 근거를 한 장의 기록으로</h3><p>판정 결과를 확인하고 필요한 서식을 내려받으세요.</p></div><img src="assets/images/material-inspection.jpg" alt="자원 검수 작업대를 표현한 생성 이미지"></section><div class="g g12"><div class="card"><div class="hd"><h3>${icon('report')} 보고서 서식</h3></div><div class="list">${tpls.map(([k, n, s]) => `<div style="cursor:pointer" data-t="${k}"><span class="av" style="border-radius:10px;${k === type ? 'background:var(--side);color:var(--lime)' : ''}">${icon('report')}</span><div class="grow"><div class="t1">${n}</div><small>${s}</small></div>${k === type ? '<span class="chip t">선택</span>' : ''}</div>`).join('')}</div>
      ${type === 'case' ? `<div class="fld" style="margin-top:12px"><label for="rc">탐지 건</label><select class="inp" id="rc">${D.CASES.map(x => `<option ${x.id === c.id ? 'selected' : ''}>${x.id}</option>`).join('')}</select></div>` : type === 'member' ? `<div class="fld" style="margin-top:12px"><label for="rm">사업회원</label><select class="inp" id="rm">${D.MEMBERS.map(x => `<option value="${x.id}" ${x.id === m.id ? 'selected' : ''}>${esc(x.short)}</option>`).join('')}</select></div>` : ''}
      <div class="hint" style="margin-top:12px">${icon('shield')}<span>내려받은 파일에는 사용자·일시 워터마크가 들어갑니다. <b>${fmt(LIMIT)}행</b>을 넘는 대량 내려받기는 관리자 승인 후 가능합니다.</span></div>
      ${C.S.reportReq.length ? `<p style="font-size:12.5px;font-weight:700;margin-top:12px">대량 내려받기 요청</p><div class="list">${C.S.reportReq.map((r, i) => `<div><div class="grow"><div class="t1">${esc(r.name)}</div><small>${esc(r.by)} · ${r.at}</small></div><span class="chip ${r.state === '승인' ? 't' : 'a'}">${r.state}</span>${r.state === '승인 대기' && A.can('approve') ? `<button class="btn sm go" data-ap="${i}">승인</button>` : ''}</div>`).join('')}</div>` : ''}</div>
      <div class="card"><div class="hd"><h3>미리보기</h3><div style="display:flex;gap:8px;flex-wrap:wrap"><span class="chip">${fmt(rowsN)}행</span><button class="btn" id="rCsv">${icon('dl')} 엑셀(CSV)</button><button class="btn" id="rPdf">${icon('report')} PDF로 인쇄</button></div></div>
        <div class="paper"><div class="wm">${esc(wm)}</div>${paper}<p class="faint" style="font-size:11px;margin-top:14px;text-align:right">[프로토타입] 가상 데이터 · 출력 ${esc(wm)}</p></div></div></div>`;
    return {
      title: '보고서', crumb: '현황 · 분석', html, mount(el) {
        $$('[data-t]', el).forEach(b => b.onclick = () => location.hash = '#/reports/' + b.dataset.t);
        const rc = $('#rc', el); if (rc) rc.onchange = () => location.hash = '#/reports/case/' + rc.value;
        const rm = $('#rm', el); if (rm) rm.onchange = () => location.hash = '#/reports/member/' + rm.value;
        $$('[data-ap]', el).forEach(b => b.onclick = () => { if (!A.can('approve')) return; const r = C.S.reportReq[b.dataset.ap]; if (!r || r.state !== '승인 대기') return; r.state = '승인'; C.save(); C.audit('대량 내려받기 승인', r.name); A.render(); A.toast('대량 내려받기를 승인했습니다'); });
        $('#rCsv', el).onclick = () => {
          if (big && !(req && req.state === '승인')) {
            if (req) { A.toast('관리자 승인을 기다리고 있습니다', 'clock'); return; }
            C.S.reportReq.push({ type, userId: C.S.user.id, name: tpls.find(t => t[0] === type)[1] + ` (${fmt(rowsN)}행)`, by: C.S.user.name, at: C.now(), state: '승인 대기' }); C.save(); C.audit('대량 내려받기 승인 요청', type, `${rowsN}행`); A.render(); A.toast(`${fmt(LIMIT)}행 초과 · 관리자 승인을 요청했습니다`, 'shield'); return;
          }
          C.downloadCSV(`${type}_report.csv`, [[`워터마크: ${wm}`]].concat(csv)); C.audit('보고서 내려받기', type, `${rowsN}행`);
          if (req) { req.state = '사용 완료'; C.save(); }
          A.toast('워터마크를 넣어 내려받았습니다', 'dl');
        };
        $('#rPdf', el).onclick = () => { C.audit('보고서 인쇄', type); window.print(); };
      }
    };
  });

  /* ================= 데이터 연동 ================= */
  A.reg('pipeline', () => {
    const fin = D.FINISH14.map(t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; });
    const dur = D.PIPE.map(p => { const a = p[2].split(':').map(Number), b = p[3].split(':').map(Number); return (b[0] * 60 + b[1]) - (a[0] * 60 + a[1]); });
    const qual = D.MEMBERS.map(m => ({ m, miss: +((m.risk * 0.037) % 2.4).toFixed(1), mod: +((m.risk * 0.11) % 9 + 1).toFixed(1), delay: m.risk > 75 ? 1 : 0 })).sort((a, b) => b.mod - a.mod).slice(0, 8);
    const html = `<section class="workspace-note"><div><span class="eyebrow">DATA OPERATIONS</span><h3>매일의 점검을 뒷받침하는 데이터</h3><p>수집 상태와 처리 결과, 과거 데이터의 연결 현황을 확인하세요.</p></div><img src="assets/images/material-inspection.jpg" alt="재활용 자원의 계량·검사를 표현한 생성 이미지"></section><div class="g g21"><div class="card"><div class="hd"><div><h3>${icon('pipe')} 오늘 새벽 일일 작업</h3><p>배치 B-2803140200 · 시작 02:00 · 완료 06:41 · 목표 07:00</p></div><span class="chip t">${icon('check')} 정상 완료</span></div>
      <div class="tw"><table class="tbl"><thead><tr><th>단계</th><th>내용</th><th>시각</th><th style="width:40%">소요</th></tr></thead><tbody>${D.PIPE.map((p, i) => `<tr><td class="t1 nw">${esc(p[0])}</td><td>${esc(p[1])}</td><td class="num nw">${p[2]}–${p[3]}</td><td><div class="prog"><i style="width:${dur[i] / 82 * 100}%"></i></div><small class="num">${dur[i]}분</small></td></tr>`).join('')}</tbody></table></div></div>
      <div class="card"><div class="hd"><h3>최근 14일 완료 시각</h3></div>${C.line([{ v: fin, c: 'var(--teal)', area: true }], { min: 360, max: 430, hline: 420, hlabel: '07:00', labels: D.FINISH14.map((_, i) => String(i + 1).padStart(2, '0')), every: 3, fmt: v => `${Math.floor(v / 60)}:${String(Math.round(v % 60)).padStart(2, '0')}`, h: 200 })}
        <div class="hint">${icon('bell')}<span>단계별 시간 예산을 넘으면 담당자와 수행사에 알림을 보내고, 07시 전에 완료되지 않으면 대기열에 「판정 지연」을 표시합니다.</span></div></div></div>
    <div class="card"><div class="hd"><div><h3>${icon('shield')} 수신 품질 점검</h3><p>건수·누락·지연·스키마 변경을 매일 점검합니다</p></div></div><div class="tw"><table class="tbl"><thead><tr><th>원천</th><th class="r">수신 건수</th><th class="r">전일 대비</th><th class="r">누락률</th><th>지연</th><th>스키마</th></tr></thead><tbody>
      ${D.SOURCES.map(s => { const ch = (s.cnt / s.prev - 1) * 100; return `<tr><td class="t1">${esc(s.name)}</td><td class="r num">${fmt(s.cnt)}</td><td class="r num ${Math.abs(ch) > 20 ? 'st-ver' : ''}">${ch > 0 ? '+' : ''}${ch.toFixed(1)}%</td><td class="r num">${s.miss}%</td><td>${s.delay ? `<span class="chip a">${s.delay}분 지연</span>` : '<span class="chip t">정상</span>'}</td><td>${s.schema ? `<span class="chip r">변경 감지</span><small>${esc(s.schema)}</small>` : '<span class="faint">변경 없음</span>'}</td></tr>`; }).join('')}</tbody></table></div></div>
    <div class="g g2"><div class="card"><div class="hd"><div><h3>${icon('refresh')} 회원사 즉시 재수집 · 재판정</h3><p>점검 시즌(2~4월) 회원사 단위로 바로 다시 받습니다</p></div></div>
      <div class="filters"><select class="inp" id="rcM" style="flex:1">${D.MEMBERS.map(m => `<option value="${m.id}">${esc(m.short)}</option>`).join('')}</select><button class="btn go" id="rcGo">${icon('refresh')} 재수집 → 1년치 재판정</button></div><div id="rcOut" style="margin-top:12px"></div></div>
      <div class="card"><div class="hd"><h3>스냅샷 (수신 배치)</h3><p>판정 당시 데이터를 그대로 재현</p></div><div class="list">${['B-2803140200', 'B-2803130200', 'B-2803120200', 'B-2803110200', 'B-2803100200'].map((b, i) => `<div><span class="mono t1" style="font-size:12.5px">${b}</span><div class="grow"><small>${b.slice(2, 4) === '28' ? '2028' : ''}-03-${b.slice(6, 8)} 02:00 수신 · ${fmt(75000 - i * 1200)}행</small></div>${i === 0 ? '<span class="chip t">최신</span>' : `<span class="chip">판정 ${fmt(46 - i * 3)}건 연결</span>`}</div>`).join('')}</div><p class="faint" style="font-size:12px;margin-top:6px">확정 후 바뀐 값은 원래 값과 변경 값을 함께 보관합니다.</p></div></div>
    <div class="card"><div class="hd"><div><h3>${icon('back')} 이관 · 적재 연속성</h3><p>과거 이관부터 운영 개시까지 기간별 제공·적재 현황</p></div></div><div class="tw"><table class="tbl"><thead><tr><th>구간</th><th>원천</th><th class="r">적재 행</th><th>변경 이력</th><th>대조</th></tr></thead><tbody>
      ${[['2021~2025 (과거 이관)', '통합 API 제공분 + 조합 제공 파일', 38420000, '일부 연도 없음', '건수·중량 대조 일치'], ['2026-01 ~ 2027-05 (운영 개시 전)', '통합 API 조회 + 파일 보완', 9180000, '있음', '초기 적재·증분 겹침 표본 확인'], ['2027-06 ~ (운영)', '일 1회 증분 수집', 7310000, '있음', '매일 수신 품질 점검']].map(r => `<tr><td class="t1 nw">${r[0]}</td><td>${r[1]}</td><td class="r num">${fmt(r[2])}</td><td>${r[3] === '있음' ? '<span class="chip t">있음</span>' : '<span class="chip a">' + r[3] + '</span>'}</td><td>${r[4]}</td></tr>`).join('')}</tbody></table></div><p class="faint" style="font-size:12px;margin-top:6px">증분 수집 경계 시각: 2027-05-31 23:59:59 · 미반영·중복 반영 0건 확인</p></div>
    <div class="card"><div class="hd"><h3>회원사별 데이터 품질 지표</h3><p>수정률 높은 순</p></div><div class="tw"><table class="tbl"><thead><tr><th>회원사</th><th class="r">누락률</th><th class="r">수정률</th><th>지연</th><th>품질 지수</th></tr></thead><tbody>${qual.map(q => `<tr><td class="t1">${esc(q.m.short)}</td><td class="r num">${q.miss}%</td><td class="r num">${q.mod}%</td><td>${q.delay ? '<span class="chip a">반복 지연</span>' : '<span class="faint">—</span>'}</td><td>${gradeChip(q.m.grade)} <span class="num">${q.m.quality}</span></td></tr>`).join('')}</tbody></table></div></div>`;
    return {
      title: '데이터 연동', crumb: '데이터 · 관리', html, mount(el) {
        $('#rcGo', el).onclick = () => {
          const m = mem($('#rcM', el).value); const out = $('#rcOut', el); const b = $('#rcGo', el); b.disabled = true;
          const st = ['통합 API 회원사 단위 재수집', '스냅샷 적재', '정제·관계 재구성', '1년치 규칙 재판정', '위험 점수 갱신'];
          out.innerHTML = `<div class="run">${st.map(s => `<div class="stp"><i></i>${s}</div>`).join('')}</div>`;
          const items = $$('.stp', out); let i = 0;
          const tick = () => { items.forEach((x, k) => x.className = 'stp' + (k < i ? ' done' : k === i ? ' on' : '')); if (i < items.length) { i++; A.later(tick, 500); return; }
            const sec = 300 + (m.risk * 7) % 200; out.insertAdjacentHTML('beforeend', `<div class="alert t" style="margin-top:10px">${icon('check')}<span><b>${esc(m.short)}</b> 재판정 완료 · <b class="num">${Math.floor(sec / 60)}분 ${sec % 60}초</b> (목표 10분 이내) · 변경분 ${fmt(120 + m.risk * 3)}행 · 신규 탐지 ${m.risk > 60 ? 2 : 0}건</span></div>`);
            C.audit('회원사 즉시 재수집', m.id, `${sec}초`); b.disabled = false; };
          tick();
        };
      }
    };
  });

  /* ================= 기준정보 ================= */
  let RTAB = 'member';
  A.reg('ref', () => {
    const tabs = [['member', '사업회원 · 사업장'], ['partner', '거래처 마스터'], ['suit', '공급처 적정성'], ['item', '품목 · 분류 사전'], ['vehicle', '허가차량'], ['agencyv', '공단 기준값']];
    const exp = p => { const d = (new Date(p.suitableTo) - new Date(D.TODAY)) / 864e5; return d; };
    let body;
    if (RTAB === 'member') body = `<table class="tbl"><thead><tr><th>사업회원</th><th>사업자번호</th><th>사업장</th><th>좌표(가상)</th><th class="r">처리규모</th><th>계량대</th><th>허가 만료</th></tr></thead><tbody>${D.MEMBERS.flatMap(m => m.sites.map((s, i) => `<tr><td class="t1">${i ? '' : esc(m.name)}</td><td class="mono">${i ? '' : m.bizNo}</td><td>${esc(s.name)}</td><td class="num">${s.x}, ${s.y}</td><td class="r num">${s.capacity}톤/일</td><td>${s.gates}</td><td>${s.permitTo}</td></tr>`)).join('')}</tbody></table>`;
    else if (RTAB === 'partner') body = `<table class="tbl"><thead><tr><th>거래처 (사업자번호 단위)</th><th>대표자</th><th>주소</th><th>유형</th><th>국세청 상태</th></tr></thead><tbody>${D.PARTNERS.map(p => `<tr><td class="t1">${esc(p.name)}<small class="mono">${p.bizNo}</small></td><td>${esc(p.ceo)}</td><td>${esc(p.addr)}</td><td>${esc(p.type)}</td><td>${p.status === '계속' ? '<span class="chip t">계속</span>' : `<span class="chip r">${p.status}</span>${p.closedAt ? `<small>${p.closedAt}</small>` : ''}`}</td></tr>`).join('')}</tbody></table><p class="faint" style="font-size:12px;padding:8px 12px">국세청 사업자 상태조회 · 매일 05:30 갱신 (1회 100건 일괄)</p>`;
    else if (RTAB === 'suit') body = `<table class="tbl"><thead><tr><th>공급처</th><th>적정성 확인 만료</th><th>남은 일수</th><th>알림</th></tr></thead><tbody>${D.PARTNERS.slice().sort((a, b) => a.suitableTo.localeCompare(b.suitableTo)).map(p => { const d = Math.round(exp(p)); return `<tr><td class="t1">${esc(p.name)}</td><td>${p.suitableTo}</td><td class="num ${d <= 30 ? 'st-ver' : ''}">${d < 0 ? '만료' : 'D-' + d}</td><td>${d <= 30 && d >= 0 ? '<span class="chip a">만료 30일 전 알림 발송</span>' : d < 0 ? '<span class="chip r">거래 시 NW-07 탐지</span>' : '<span class="faint">—</span>'}</td></tr>`; }).join('')}</tbody></table>`;
    else if (RTAB === 'item') body = `<table class="tbl"><thead><tr><th>코드</th><th>품목</th><th>분류</th><th class="r">표준 대당 중량</th><th>대상 여부</th></tr></thead><tbody>${D.ITEMS.map(i => `<tr><td class="mono">${i.code}</td><td class="t1">${esc(i.name)}</td><td>${i.group}</td><td class="r num">${i.unitKg == null ? '—' : i.unitKg + ' kg'}</td><td>${i.target ? '<span class="chip t">대상</span>' : '<span class="chip r">비대상</span>'}</td></tr>`).join('')}</tbody></table>`;
    else if (RTAB === 'vehicle') body = `<table class="tbl"><thead><tr><th>차량번호</th><th>사업회원</th><th class="r">최대적재량</th><th class="r">등록 공차중량</th><th>허가</th></tr></thead><tbody>${D.VEHICLES.slice(0, 30).map(v => `<tr><td><span class="plate">${esc(v.no)}</span></td><td>${esc(mem(v.member).short)}</td><td class="r num">${v.ton}톤</td><td class="r num">${fmt(v.tare)} kg</td><td>${v.permitted ? '<span class="chip t">허가</span>' : '<span class="chip r">미등록</span>'}</td></tr>`).join('')}</tbody></table>`;
    else body = `<table class="tbl"><thead><tr><th>기준값</th><th>값</th><th>적용 시작일</th><th>근거</th><th></th></tr></thead><tbody>${[['대형가전 표준 대당 중량(냉장고)', '68 kg', '2027-01-01'], ['중량 허용 오차', '3 %', '2027-01-01'], ['재활용 의무율 산정 기준', '공단 고시(가상)', '2028-01-01'], ['차감 산정 기준 중량 단위', '1 kg', '2027-01-01']].map(([k, v, f], i) => { const saved = C.S.refValues[i]; return `<tr><td class="t1">${k}</td><td class="num">${esc(saved ? saved.value : v)}</td><td>${esc(saved ? saved.from : f)}</td><td>공단 기준(가상)</td><td>${A.can('ref') ? `<button class="btn sm" data-edit="${i}">변경</button>` : ''}</td></tr>`; }).join('')}</tbody></table><p class="faint" style="font-size:12px;padding:8px 12px">기준값은 적용 시작일과 함께 이력으로 관리해 과거 판정에는 당시 기준을 적용합니다.</p>`;
    const html = `<div class="card"><div class="tabs">${tabs.map(([k, l]) => `<button data-rt="${k}" class="${RTAB === k ? 'on' : ''}">${l}</button>`).join('')}</div><div class="tw">${body}</div></div>`;
    return { title: '기준정보', crumb: '데이터 · 관리', html, mount(el) {
      $$('[data-rt]', el).forEach(b => b.onclick = () => { RTAB = b.dataset.rt; A.render(); });
      $$('[data-edit]', el).forEach(b => b.onclick = () => {
        if (!A.can('ref')) return;
        const id = b.dataset.edit, row = b.closest('tr'), old = C.S.refValues[id];
        const md = A.modal('기준값 변경', `<div class="fld"><label for="refValue">새 값</label><input class="inp" id="refValue" value="${esc(old ? old.value : row.cells[1].textContent)}"></div><div class="fld"><label for="refFrom">적용 시작일</label><input class="inp" id="refFrom" type="date" value="${esc(old ? old.from : D.TODAY)}"></div><div class="hint">${icon('clock')}<span>체험에서는 기준값과 변경 이력을 저장합니다. 과거 판정 재계산은 수행하지 않습니다.</span></div>`, '<button class="btn" data-x>취소</button><button class="btn go" id="refOk">저장</button>');
        $('#refOk', md).onclick = () => {
          if (!A.can('ref')) return;
          const value = $('#refValue', md).value.trim(), from = $('#refFrom', md).value;
          if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(from)) { A.toast('기준값과 적용 시작일을 입력해 주세요', 'x'); return; }
          C.S.refValues[id] = {value, from, history: (old ? old.history || [] : []).concat([{value: row.cells[1].textContent, from: row.cells[2].textContent}])};
          C.save(); C.audit('공단 기준값 변경', row.cells[0].textContent, `${value} · ${from}부터`); A.render(); A.toast('기준값과 적용 시작일을 저장했습니다');
        };
      });
    } };
  });

  /* ================= 시스템 관리 ================= */
  let STAB = 'audit';
  A.reg('system', () => {
    const tabs = [['audit', '감사 로그'], ['users', '사용자 · 권한'], ['alerts', '알림 규칙'], ['retain', '보존 · 파기']];
    let body;
    if (STAB === 'audit') {
      const L = C.S.audit.slice().reverse();
      body = `<div class="hd"><p>조회·판정·내려받기·설정 변경 기록 · 각 기록은 앞 기록의 해시와 연결되어 위변조 여부를 검증할 수 있습니다 · 1년 이상 보관</p><div style="display:flex;gap:8px"><button class="btn go sm" id="vfy">${icon('shield')} 무결성 검증</button><button class="btn sm" id="tamper" ${A.can('system') ? '' : 'disabled'} title="시연용: 기록 하나를 몰래 바꿔 봅니다">변조 시연</button></div></div><div id="vres"></div>
        <div class="tw"><table class="tbl"><thead><tr><th>시각</th><th>사용자</th><th>작업</th><th>대상</th><th>내용</th><th>해시</th></tr></thead><tbody>${L.map(r => `<tr><td class="nw num">${r.at.slice(5)}</td><td class="nw">${esc(r.user)}<small>${esc(r.role)}</small></td><td class="t1 nw">${esc(r.action)}</td><td class="mono">${esc(r.target)}</td><td>${esc(r.detail)}</td><td class="mono faint">${r.h.slice(0, 10)}…</td></tr>`).join('')}</tbody></table></div>`;
    } else if (STAB === 'users') {
      const menus = ['검토·판정', '규칙 초안', '규칙 승인·운영 반영', '모델 재학습', '셀프 분석 SQL', '원본 사진 열람', '대량 내려받기 승인', '기준정보·시스템'];
      const mx = { '점검 담당자': [1, 0, 0, 0, 0, 1, 0, 0], '분석가': [0, 1, 0, 1, 1, 0, 0, 0], '관리자': [1, 1, 1, 1, 1, 1, 1, 1] };
      body = `<div class="tw"><table class="tbl"><thead><tr><th>사용자</th><th>역할</th><th>담당 권역</th><th>2단계 인증</th></tr></thead><tbody>${D.USERS.map(u => `<tr><td class="t1">${esc(u.name)}<small class="mono">${u.id}</small></td><td>${esc(u.role)}</td><td>${u.regions.map(r => `<span class="chip">${D.REGIONS.find(x => x.id === r).name}</span>`).join(' ')}</td><td><span class="chip t">${icon('shield')} OTP</span></td></tr>`).join('')}</tbody></table></div>
        <div class="tw" style="margin-top:14px"><table class="tbl"><thead><tr><th>권한</th>${Object.keys(mx).map(k => `<th>${k}</th>`).join('')}</tr></thead><tbody>${menus.map((n, i) => `<tr><td class="t1">${n}</td>${Object.values(mx).map(v => `<td>${v[i] ? '<span class="chip t">' + icon('check') + '</span>' : '<span class="faint">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <p class="faint" style="font-size:12px;margin-top:8px">담당자는 담당 권역의 건을 수정하고 전체 권역은 조회합니다. 이 체험의 권한 제어는 브라우저 안에서 동작하며, 운영 서비스에는 서버 검증이 필요합니다.</p>`;
    } else if (STAB === 'alerts') {
      body = `<div class="list">${[['L2 위험 높음 탐지 (80점 이상)', '담당자 · 메일', true], ['판정 기한 1일 전', '담당자 · 메일', true], ['07시 판정 미완료', '관리자 · 메일 / 수행사 기술 당번(평일 06:30~09:00) · 전화·메신저', true], ['수신 지연·스키마 변경', '관리자 · 메일', true], ['공급처 적정성 만료 30일 전', '회원사 담당 · 메일', true], ['대량 내려받기 승인 요청', '관리자 · 메일', true], ['감시 목록 소급 탐지', '해당 권역 담당자 · 메일', false]].map(([n, w, initial], i) => { const on = Object.hasOwn(C.S.alerts, i) ? C.S.alerts[i] : initial; return `<div><div class="grow"><div class="t1">${n}</div><small>${w}</small></div><label class="chip ${on ? 't' : ''}" style="cursor:pointer"><input type="checkbox" ${on ? 'checked' : ''} data-al="${i}" style="accent-color:var(--teal)"> 사용</label></div>`; }).join('')}</div><p class="faint" style="font-size:12px;margin-top:8px">메일은 조합 메일 서버(SMTP)로 발송하고, 문자는 선택 사항입니다.</p>`;
    } else {
      body = `<div class="tw"><table class="tbl"><thead><tr><th>대상</th><th>보존 기간</th><th>처리</th><th>최근 파기 기록</th></tr></thead><tbody>
        <tr><td class="t1">증빙·판정 근거 (전표·사진·판정)</td><td>5년 이상</td><td>보존</td><td class="faint">—</td></tr>
        <tr><td class="t1">사진 원본 속 개인정보 (얼굴)</td><td>판정 확정 후 5년</td><td>예약 작업 파기</td><td>2028-03-01 02:30 · 1,204장 · 시스템 (확인 이서준)</td></tr>
        <tr><td class="t1">운전자 연락처 등 개인정보</td><td>목적 달성 후 즉시</td><td>파기·기록</td><td>2028-02-01 02:30 · 87건</td></tr>
        <tr><td class="t1">감사 로그</td><td>1년 이상 (변경 잠금 저장)</td><td>보존</td><td class="faint">—</td></tr></tbody></table></div><p class="faint" style="font-size:12px;margin-top:8px">파기 대상·일시·처리자를 기록으로 남깁니다.</p>`;
    }
    const html = `<div class="card"><div class="tabs">${tabs.map(([k, l]) => `<button data-st="${k}" class="${STAB === k ? 'on' : ''}">${l}</button>`).join('')}</div>${A.can('system') || STAB === 'audit' ? body : `<div class="hint">${icon('lock')}<span>관리자만 볼 수 있습니다.</span></div>`}</div>`;
    return { title: '시스템 관리', crumb: '데이터 · 관리', html, mount(el) {
      $$('[data-st]', el).forEach(b => b.onclick = () => { STAB = b.dataset.st; A.render(); });
      const v = $('#vfy', el);
      if (v) v.onclick = () => { const bad = C.verifyAudit(C.S.audit); $('#vres', el).innerHTML = bad < 0 ? `<div class="alert t" style="margin-bottom:10px">${icon('check')}<span>기록 ${C.S.audit.length}건의 해시 연결이 모두 일치합니다. 현재 기록의 해시 연결에서 변경이 발견되지 않았습니다.</span></div>` : `<div class="alert r" style="margin-bottom:10px">${icon('flag')}<span>${bad + 1}번째 기록(${esc(C.S.audit[bad].action)})부터 해시가 맞지 않습니다. 해당 기록이나 앞뒤 연결을 확인해 주세요.</span></div>`; };
      const t = $('#tamper', el);
      if (t) t.onclick = () => { if (!A.can('system')) return; if (C.S.audit.length < 2) return; const k = Math.max(0, C.S.audit.length - 2); C.S.audit[k].detail += ' (몰래 수정)'; C.save(); A.toast('시연: 기록 하나를 바꿨습니다. 무결성 검증을 눌러 보세요', 'flag'); };
      $$('[data-al]', el).forEach(x => x.onchange = () => { if (!A.can('system')) return; C.S.alerts[x.dataset.al] = x.checked; C.save(); x.closest('label').classList.toggle('t', x.checked); C.audit('알림 규칙 변경', '알림 ' + x.dataset.al, x.checked ? '사용' : '중지'); A.toast('알림 규칙을 저장했습니다'); });
    } };
  });
})();
