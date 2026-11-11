/* 공통 유틸 · 저장소 · 차트 · 계량 사진형 샘플 */
(function () {
  'use strict';
  const D = window.DATA;

  /* ---------- 유틸 ---------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => (n == null || n === '' ? '—' : Number(n).toLocaleString('ko-KR'));
  const pct = (n, d = 1) => (n * 100).toFixed(d) + '%';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const now = () => { const d = new Date(); return `${D.TODAY} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const riskClass = r => (r >= 80 ? 'hi' : r >= 60 ? 'md' : 'lo');
  const riskLabel = r => (r >= 80 ? '높음' : r >= 60 ? '주의' : '관찰');

  /* ---------- 아이콘 ---------- */
  const P = {
    home: 'M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z',
    queue: 'M4 6h16M4 12h16M4 18h10',
    case: 'M5 4h10l4 4v12H5zM15 4v4h4M8 12h8M8 16h6',
    agency: 'M4 20h16M6 20V10M10 20V10M14 20V10M18 20V10M3 10l9-6 9 6',
    rule: 'M7 8l-4 4 4 4M17 8l4 4-4 4M14 4l-4 16',
    watch: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z',
    photo: 'M4 7h3l2-3h6l2 3h3v12H4zM12 10a3.5 3.5 0 100 7 3.5 3.5 0 000-7z',
    dash: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    member: 'M4 21V8l8-5 8 5v13M9 21v-6h6v6',
    back: 'M3 3v18h18M7 14l4-4 3 3 6-6',
    spark: 'M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z',
    model: 'M12 2l9 5v10l-9 5-9-5V7zM12 12l9-5M12 12v10M12 12L3 7',
    pipe: 'M4 6h6v4H4zM14 14h6v4h-6zM10 8h4v8',
    sql: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
    report: 'M6 3h9l4 4v14H6zM9 13h6M9 17h6M9 9h2',
    ref: 'M4 5h16v14H4zM4 10h16M10 10v9',
    gear: 'M12 9a3 3 0 100 6 3 3 0 000-6zM19 12l2-1-1-3-2 .5-1.5-1.5.5-2-3-1-1 2h-2l-1-2-3 1 .5 2L6 7.5 4 7 3 10l2 1v2l-2 1 1 3 2-.5L7.5 18 7 20l3 1 1-2h2l1 2 3-1-.5-2 1.5-1.5 2 .5 1-3-2-1z',
    search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5',
    bell: 'M6 16V11a6 6 0 1112 0v5l2 2H4zM10 20a2 2 0 004 0',
    check: 'M5 12l5 5L20 7', x: 'M6 6l12 12M18 6L6 18', arrow: 'M5 12h14M13 6l6 6-6 6', left: 'M19 12H5M11 6l-6 6 6 6',
    play: 'M7 5l12 7-12 7z', undo: 'M9 14L4 9l5-5M4 9h11a5 5 0 010 10h-3', lock: 'M6 11h12v10H6zM8 11V8a4 4 0 018 0v3',
    shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', plus: 'M12 5v14M5 12h14', dl: 'M12 4v11M7 10l5 5 5-5M5 20h14',
    eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 10a2 2 0 100 4 2 2 0 000-4z', route: 'M6 19a2 2 0 100-4 2 2 0 000 4zM18 9a2 2 0 100-4 2 2 0 000 4zM6 15V9a4 4 0 014-4h4M18 9v6a4 4 0 01-4 4h-4',
    flag: 'M5 21V4h11l-2 4 2 4H5', clock: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2', refresh: 'M20 11a8 8 0 10-2.3 6.3M20 4v7h-7',
    menu: 'M4 6h16M4 12h16M4 18h16', logout: 'M15 4h4v16h-4M10 16l-4-4 4-4M6 12h10'
  };
  const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n] || P.case}"/></svg>`;

  /* ---------- 저장소 ---------- */
  const KEY = 'recheck-proto-v1';
  let S = null;
  function fresh() {
    return {
      user: null, otpPending: null,
      decisions: {},          // caseId -> {result, kg, reason, note, at, by, history:[]}
      caseStatus: {},         // caseId -> status
      caseAssignee: {},
      ruleOverride: {},       // ruleId -> {params:[...], status, version, history:[]}
      ruleDrafts: {},
      newRules: [],
      watch: JSON.parse(JSON.stringify(D.WATCH)),
      models: {},             // modelId -> {current, extraVersions:[]}
      agencyCause: {},
      plateFix: {},           // photo review
      reviewed: {},
      audit: [],
      reportReq: [],
      notices: [],
      recollect: {},
      refValues: {}, alerts: {}, photoRuns: {}
    };
  }
  function load() {
    try { const s = localStorage.getItem(KEY); S = s ? Object.assign(fresh(), JSON.parse(s)) : fresh(); }
    catch (e) { S = fresh(); }
    return S;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 저장 불가 환경 */ } }
  function reset() { S = fresh(); try { localStorage.removeItem(KEY); } catch (e) { } save(); }

  /* ---------- 감사 로그 (해시 연결) ---------- */
  function hash(str) { // FNV-1a 32bit 2회 → 16진 16자리 (시연용)
    let h1 = 0x811c9dc5, h2 = 0x01000193 ^ 0x5bd1e995;
    for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 ^= c; h1 = Math.imul(h1, 16777619); h2 ^= c; h2 = Math.imul(h2, 2246822519); }
    return ((h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0'));
  }
  function audit(action, target, detail) {
    const prev = S.audit.length ? S.audit[S.audit.length - 1].h : '0000000000000000';
    const rec = { at: now(), user: S.user ? S.user.name : '시스템', role: S.user ? S.user.role : '', action, target, detail: detail || '', prev };
    rec.h = hash(prev + rec.at + rec.user + action + target + rec.detail);
    S.audit.push(rec); save();
  }
  function verifyAudit(list) {
    let prev = '0000000000000000';
    for (let i = 0; i < list.length; i++) {
      const r = list[i];
      if (r.prev !== prev || hash(prev + r.at + r.user + r.action + r.target + r.detail) !== r.h) return i;
      prev = r.h;
    }
    return -1;
  }

  /* ---------- 규칙 (원본 + 변경) ---------- */
  function rule(id) {
    const base = D.ruleById[id] || S.newRules.find(r => r.id === id);
    if (!base) return null;
    const o = S.ruleOverride[id];
    return o ? Object.assign({}, base, o, { params: o.params || base.params }) : base;
  }
  function allRules() { return D.RULES.map(r => rule(r.id)).concat(S.newRules.map(r => rule(r.id))); }
  // 기준값 변화에 따른 월별 탐지 건수 (사전 계산 시연)
  const MONTHS = ['2027-03', '2027-04', '2027-05', '2027-06', '2027-07', '2027-08', '2027-09', '2027-10', '2027-11', '2027-12', '2028-01', '2028-02'];
  function monthly(r, v) {
    const p = (D.ruleById[r.id] || S.newRules.find(x => x.id === r.id) || r).params[0];
    const span = (p.max - p.min) || 1;
    const delta = (v - p.v) / span; // -1..1
    const f = Math.exp(p.sens * delta * 2.2);
    const out = [];
    for (let i = 0; i < 12; i++) {
      const season = 1 + 0.25 * Math.sin((i + 1) / 12 * Math.PI * 2) + (i >= 11 ? 0.2 : 0);
      const n = r.base * season * f * (0.85 + ((i * 37 + r.id.length * 13) % 30) / 100);
      out.push(Math.max(0, Math.round(n)));
    }
    return out;
  }
  function precisionAt(r, v) {
    const p = (D.ruleById[r.id] || S.newRules.find(x => x.id === r.id) || r).params[0]; const span = (p.max - p.min) || 1; const delta = (v - p.v) / span;
    return clamp(r.prec - p.sens * delta * 0.35, 0.15, 0.98);
  }

  /* ---------- 케이스 상태 ---------- */
  function caseStatus(c) { return S.caseStatus[c.id] || c.status; }
  function caseAssignee(c) { return S.caseAssignee[c.id] || c.assignee; }

  /* ---------- 차트 (SVG) ---------- */
  function bars(vals, o = {}) {
    const w = o.w || 520, h = o.h || 180, pad = 26;
    const series = Array.isArray(vals[0]) ? vals : [vals];
    const n = series[0].length;
    const max = o.max || Math.max(1, ...series.flat()) * 1.15;
    const bw = (w - pad * 2) / n;
    const colors = o.colors || ['var(--teal)', 'var(--amber)'];
    let g = '';
    for (let k = 0; k <= 3; k++) { const y = h - pad - (h - pad * 2) * k / 3; g += `<line x1="${pad}" x2="${w - 6}" y1="${y}" y2="${y}" class="gl"/><text x="${pad - 6}" y="${y + 3}" class="ax" text-anchor="end">${Math.round(max * k / 3)}</text>`; }
    series.forEach((s, si) => {
      const sw = (bw * 0.64) / series.length;
      s.forEach((v, i) => {
        const bh = (h - pad * 2) * v / max;
        const x = pad + i * bw + bw * 0.18 + si * sw;
        g += `<rect x="${x.toFixed(1)}" y="${(h - pad - bh).toFixed(1)}" width="${sw.toFixed(1)}" height="${bh.toFixed(1)}" rx="3" fill="${colors[si]}" class="bar"><title>${o.labels ? o.labels[i] + ' · ' : ''}${fmt(v)}</title></rect>`;
      });
    });
    if (o.labels) o.labels.forEach((l, i) => { if (n <= 12 || i % 2 === 0) g += `<text x="${pad + i * bw + bw / 2}" y="${h - 8}" class="ax" text-anchor="middle">${esc(l)}</text>`; });
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(o.title || '막대 차트')}">${g}</svg>`;
  }
  function line(series, o = {}) {
    const w = o.w || 520, h = o.h || 180, pad = 28;
    const all = series.flatMap(s => s.v);
    const max = o.max != null ? o.max : Math.max(...all) * 1.1, min = o.min != null ? o.min : Math.min(0, ...all);
    const n = series[0].v.length;
    const X = i => pad + (w - pad - 10) * i / (n - 1), Y = v => h - pad - (h - pad * 2) * (v - min) / ((max - min) || 1);
    let g = '';
    for (let k = 0; k <= 3; k++) { const v = min + (max - min) * k / 3; g += `<line x1="${pad}" x2="${w - 6}" y1="${Y(v)}" y2="${Y(v)}" class="gl"/><text x="${pad - 6}" y="${Y(v) + 3}" class="ax" text-anchor="end">${o.fmt ? o.fmt(v) : Math.round(v)}</text>`; }
    if (o.hline != null) g += `<line x1="${pad}" x2="${w - 6}" y1="${Y(o.hline)}" y2="${Y(o.hline)}" class="hl"/><text x="${w - 8}" y="${Y(o.hline) - 5}" class="ax hlt" text-anchor="end">${esc(o.hlabel || '')}</text>`;
    series.forEach(s => {
      const d = s.v.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join('');
      if (s.area) g += `<path d="${d}L${X(n - 1)} ${h - pad}L${X(0)} ${h - pad}Z" fill="${s.c}" opacity=".12"/>`;
      g += `<path d="${d}" fill="none" stroke="${s.c}" stroke-width="${s.dash ? 2 : 2.6}" ${s.dash ? 'stroke-dasharray="5 5"' : ''} stroke-linejoin="round" stroke-linecap="round" class="ln"/>`;
      s.v.forEach((v, i) => { if (!s.dash && (i === n - 1 || o.dots)) g += `<circle cx="${X(i)}" cy="${Y(v)}" r="3.6" fill="#fff" stroke="${s.c}" stroke-width="2.4"><title>${o.labels ? o.labels[i] + ' · ' : ''}${o.fmt ? o.fmt(v) : v}</title></circle>`; });
    });
    if (o.labels) o.labels.forEach((l, i) => { if (i % (o.every || 1) === 0 || i === n - 1) g += `<text x="${X(i)}" y="${h - 8}" class="ax" text-anchor="${i === n - 1 ? 'end' : i === 0 ? 'start' : 'middle'}">${esc(l)}</text>`; });
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(o.title || '선 차트')}">${g}</svg>`;
  }
  function donut(parts, o = {}) {
    const r = 46, c = 2 * Math.PI * r; let off = 0; const tot = parts.reduce((a, p) => a + p.v, 0) || 1;
    let g = `<circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--line)" stroke-width="16"/>`;
    parts.forEach(p => { const len = c * p.v / tot; g += `<circle cx="60" cy="60" r="${r}" fill="none" stroke="${p.c}" stroke-width="16" stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-off}" transform="rotate(-90 60 60)"><title>${esc(p.l)} ${fmt(p.v)}</title></circle>`; off += len; });
    g += `<text x="60" y="58" text-anchor="middle" class="dn1">${esc(o.center || fmt(tot))}</text><text x="60" y="76" text-anchor="middle" class="dn2">${esc(o.sub || '')}</text>`;
    return `<svg class="donut" viewBox="0 0 120 120" role="img" aria-label="${esc(o.title || '구성')}">${g}</svg>`;
  }
  function spark(v, c = 'var(--teal)') {
    const w = 96, h = 28, max = Math.max(...v), min = Math.min(...v);
    const d = v.map((x, i) => `${i ? 'L' : 'M'}${(w * i / (v.length - 1)).toFixed(1)} ${(h - 3 - (h - 6) * (x - min) / ((max - min) || 1)).toFixed(1)}`).join('');
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${d}" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/></svg>`;
  }
  function gauge(v) {
    const a = Math.PI * (1 - v / 100), x = 60 + 46 * Math.cos(a), y = 62 - 46 * Math.sin(a);
    return `<svg class="gauge" viewBox="0 0 120 70" aria-hidden="true"><path d="M14 62a46 46 0 0192 0" fill="none" stroke="var(--line)" stroke-width="10" stroke-linecap="round"/><path d="M14 62A46 46 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}" fill="none" stroke="url(#gg)" stroke-width="10" stroke-linecap="round"/><defs><linearGradient id="gg"><stop offset="0" stop-color="#10B981"/><stop offset=".55" stop-color="#F59E0B"/><stop offset="1" stop-color="#EF4444"/></linearGradient></defs></svg>`;
  }

  /* ---------- 계량 사진 (사진형 생성 샘플) ---------- */
  const PHOTO_SET = {
    white: { plate: [45.9, 71.8, 8.2, 6.2], face: [57.4, 34.0, 6.8, 10.0] },
    blue: { plate: [43.68, 67.77, 9.90, 6.15] },
    green: { plate: [45.31, 70.12, 9.44, 6.74] },
    yellow: { plate: [47.20, 69.73, 7.49, 5.86] },
    night: { plate: [46.22, 68.95, 8.79, 7.23] }
  };
  function photo(spec, o = {}) {
    if (!spec) return `<div class="ph-empty">${icon('photo')}<span>사진 없음</span></div>`;
    const type = o.privacy ? 'white' : spec.night ? 'night' : ({'#2F6FB0':'blue','#3B8F6E':'green','#F2C14E':'yellow'}[spec.color] || 'white');
    const loaded = o.privacy || Number(spec.load) > 0;
    const meta = PHOTO_SET[type], plate = meta.plate;
    const plateText = String(spec.plate || '').replace(/\s/g, '');
    const parts = plateText.match(/^(\d{2,3}[가-힣])(\d{4})$/);
    const plateHtml = parts ? `<span>${esc(parts[1])}</span><span>${esc(parts[2])}</span>` : `<span>${esc(plateText)}</span>`;
    const src = `assets/images/vehicles/truck-${type}-${loaded ? 'loaded' : 'empty'}.jpg`;
    const face = meta.face;
    const mask = face && o.blur !== false ? `<span class="capture-mask" style="left:${face[0]}%;top:${face[1]}%;width:${face[2]}%;height:${face[3]}%" aria-label="얼굴 가림"></span>` : '';
    const detection = o.detected ? `<span class="capture-detection"><span>${esc(spec.readPlate || spec.plate)} · ${esc(spec.conf || '')}</span></span>` : '';
    return `<div class="capture" role="img" aria-label="사진형 생성 계량 샘플 · ${esc(spec.plate)} · ${loaded ? '적재' : '공차'} · ${type === 'night' ? '야간' : '주간'}">
      <div class="capture-scene ${spec.dx ? 'capture-shift' : ''}" style="--px:${plate[0]}%;--py:${plate[1]}%;--pw:${plate[2]}%;--ph:${plate[3]}%">
        <img class="capture-photo" src="${src}" alt="" loading="lazy" decoding="async">
        <span class="capture-plate" aria-hidden="true">${plateHtml}</span>${mask}${detection}
      </div>
      <div class="capture-meta"><span>${esc(spec.cam || 'CAM-1')}</span><span>${esc(spec.time || '')}</span></div>
      <small class="capture-label">생성 이미지 · 가상 번호판</small>
    </div>`;
  }

  /* ---------- 내보내기 ---------- */
  function downloadCSV(name, rows) {
    const csv = '﻿' + rows.map(r => r.map(v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  window.CORE = { esc, fmt, pct, $, $$, clamp, now, riskClass, riskLabel, icon, load, save, reset, get S() { return S; }, audit, verifyAudit, hash, rule, allRules, monthly, precisionAt, MONTHS, caseStatus, caseAssignee, bars, line, donut, spark, gauge, photo, downloadCSV };
})();
