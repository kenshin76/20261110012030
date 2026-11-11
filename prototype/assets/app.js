/* 앱 틀 · 라우터 · 로그인(2단계 인증) · 모달 · 토스트 */
(function () {
  'use strict';
  const D = window.DATA, C = window.CORE;
  const { esc, icon, $, $$ } = C;
  const SCREENS = {};
  const PERM = {
    judge: ['점검 담당자', '관리자'], approve: ['관리자'], draft: ['분석가', '관리자'], retrain: ['분석가', '관리자'],
    system: ['관리자'], ref: ['관리자'], watch: ['점검 담당자', '관리자'], agency: ['점검 담당자', '관리자'], rawPhoto: ['관리자', '점검 담당자'], sql: ['분석가', '관리자']
  };
  const can = k => !!(C.S.user && PERM[k] && PERM[k].includes(C.S.user.role));
  const canJudge = c => can('judge') && !!c && (C.S.user.role === '관리자' || C.S.user.regions.includes(c.region));
  let generation = 0;
  const jobs = new Map();
  function cancelJobs(host) {
    jobs.forEach((job, id) => { if (!host || job.host === host) { clearTimeout(id); clearInterval(id); jobs.delete(id); } });
  }
  // A callback belongs to the screen, modal and account that started it.
  function schedule(fn, ms, host, repeat) {
    host = host || $('#content');
    const gen = generation, uid = C.S.user && C.S.user.id;
    const tick = () => {
      if (gen !== generation || uid !== (C.S.user && C.S.user.id) || (host && !host.isConnected)) { clearTimeout(id); clearInterval(id); jobs.delete(id); return; }
      if (!repeat) jobs.delete(id);
      fn();
    };
    const id = repeat ? setInterval(tick, ms) : setTimeout(tick, ms);
    jobs.set(id, { host }); return id;
  }
  const later = (fn, ms, host) => schedule(fn, ms, host, false);
  const repeat = (fn, ms, host) => schedule(fn, ms, host, true);

  const NAV = [
    ['점검 업무', [['today', '오늘의 점검', 'home'], ['queue', '검토 대기열', 'queue'], ['agency', '공단 결과 대조', 'agency'], ['watch', '감시 목록', 'watch'], ['photo', '사진 AI 검수', 'photo']]],
    ['탐지 운영', [['rules', '탐지 규칙', 'rule'], ['cards', '케이스 카드', 'spark'], ['models', '모델 관리', 'model'], ['backtest', '백테스트', 'back']]],
    ['현황 · 분석', [['dash', '실적 품질 대시보드', 'dash'], ['member', '사업회원 상세', 'member'], ['sql', '셀프 분석', 'sql'], ['reports', '보고서', 'report']]],
    ['데이터 · 관리', [['pipeline', '데이터 연동', 'pipe'], ['ref', '기준정보', 'ref'], ['system', '시스템 관리', 'gear']]]
  ];

  function myCases() {
    const u = C.S.user;
    return D.CASES.filter(c => C.caseStatus(c) !== '판정 완료' && (!u || u.role !== '점검 담당자' || u.regions.includes(c.region)));
  }

  /* ---------- 토스트 · 모달 ---------- */
  function toast(msg, ic = 'check') {
    const el = document.createElement('div'); el.className = 'toast'; el.innerHTML = icon(ic) + `<span>${esc(msg)}</span>`;
    $('#toasts').appendChild(el); setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 2800); setTimeout(() => el.remove(), 3200);
  }
  function modal(title, body, foot, o = {}) {
    closeModal();
    const trigger = document.activeElement;
    const m = document.createElement('div'); m.className = 'modal'; m.id = 'modal';
    m.innerHTML = `<div class="dlg ${o.wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="dh"><h3>${esc(title)}</h3><button class="btn ghost sm" data-x aria-label="닫기">${icon('x')}</button></div><div class="db">${body}</div>${foot ? `<div class="df">${foot}</div>` : ''}</div>`;
    document.body.appendChild(m);
    m._trigger = trigger;
    document.body.classList.add('modal-open');
    m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-x]')) closeModal(); });
    const f = m.querySelector('input,select,textarea,button.go,button.pri,button'); if (f) later(() => f.focus(), 30, m);
    return m;
  }
  function closeModal() { const m = $('#modal'); if (m) { cancelJobs(m); m.remove(); if (m._trigger && m._trigger.isConnected) m._trigger.focus(); } document.body.classList.remove('modal-open'); }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
    const m = $('#modal');
    if (m && e.key === 'Tab') {
      const items = $$('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]', m).filter(x => x.getClientRects().length);
      const first = items[0], last = items[items.length - 1];
      if (items.length && e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (items.length && !e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- 로그인 ---------- */
  function loginView(step) {

    const art = `<section class="lg-art">
      <div class="brand"><span class="logo"><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3M18 3v4h-4M6 21v-4h4"/></svg></span><b>RE:CHECK</b><small>WORKSPACE</small></div>
      <div class="lg-hero"><span class="eyebrow">RECYCLING INTELLIGENCE</span><h1>실적의 근거를 살피고,<br><em>더 정확한 판단으로.</em></h1>
      <p>관리표와 계량 전표, 사진을 연결해 확인하세요.<br>오늘 살펴볼 실적부터 최종 판정까지 한곳에서 이어집니다.</p></div>
      <div class="lg-caption">재활용 실적 점검을 위한 통합 업무 공간<span>사진은 서비스 분위기를 위한 생성 이미지입니다.</span></div></section>`;
    let form;
    if (step === 'otp') {
      const p = C.S.otpPending;
      form = `<div class="lg-card"><div class="lg-top"><a class="btn sm auth-home" href="../index.html" title="제안서 메인 화면으로 이동">${icon('left')} 메인으로</a></div><div class="steps"><span class="on"></span><span class="on"></span></div><h2>2단계 인증</h2><p class="sub">${esc(p.name)}님, OTP 앱에 표시된 6자리 인증번호를 입력하세요.</p>
        <form id="otpForm"><div class="otp">${[0, 1, 2, 3, 4, 5].map(i => `<input class="inp" inputmode="numeric" maxlength="1" aria-label="인증번호 ${i + 1}번째" data-i="${i}">`).join('')}</div>
        <div class="notice" style="margin-top:12px">${icon('shield')} 체험용 인증번호 <b class="num" style="color:var(--ink);font-size:15px;letter-spacing:.1em">${p.code}</b> — 실제 서비스는 OTP 앱(TOTP)으로 발급합니다.</div>
        <button class="btn go full" style="margin-top:14px">인증하고 시작</button><button type="button" class="btn ghost full" id="back" style="margin-top:6px">${icon('left')} 다른 계정으로</button></form></div>`;
    } else {
      form = `<div class="lg-card"><div class="lg-top"><a class="btn sm auth-home" href="../index.html" title="제안서 메인 화면으로 이동">${icon('left')} 메인으로</a></div><div class="steps"><span class="on"></span><span></span></div><h2>로그인</h2><p class="sub">업무 계정으로 로그인해 오늘의 점검을 시작하세요.</p>
        <form id="loginForm"><div class="fld"><label for="lid">아이디</label><input class="inp" id="lid" autocomplete="username" placeholder="아이디"></div>
        <div class="fld"><label for="lpw">비밀번호</label><input class="inp" id="lpw" type="password" autocomplete="current-password" placeholder="비밀번호"></div>
        <p id="lerr" class="faint" style="font-size:12.5px;min-height:18px"></p><button class="btn pri full">다음 · 2단계 인증</button></form>
        <div class="acct"><small class="faint" style="font-weight:700">체험 계정 · 선택하면 입력됩니다</small>${D.USERS.map(u => `<button type="button" data-u="${u.id}"><span class="av">${esc(u.name[0])}</span><span><b>${esc(u.role)} · ${esc(u.name)}</b><small>${esc(u.desc)}<br><span class="mono">${esc(u.id)} · ${esc(u.pw)}</span></small></span>${icon("arrow")}</button>`).join('')}</div>
        <p class="notice">가상 자료를 사용하는 체험 환경입니다. 작업 내역은 현재 브라우저에 저장됩니다. 실제 개인정보를 입력하지 마세요.</p><button type="button" class="btn full sm" id="loginReset" style="margin-top:12px">${icon("refresh")} 체험 데이터 초기화</button></div>`;
    }
    return `<div class="login">${art}<section class="lg-form">${form}</section></div>`;
  }
  function mountLogin() {
    const reset = $('#loginReset');
    if (reset) reset.onclick = () => {
      const m = modal('체험 데이터 초기화', '<p>저장된 판정·규칙·모델 변경과 처리 이력을 처음 상태로 되돌립니다.</p>', '<button class="btn" data-x>취소</button><button class="btn pri" id="resetConfirm">초기화</button>');
      $('#resetConfirm', m).onclick = () => { C.reset(); render(); toast('체험 데이터를 초기화했습니다', 'refresh'); };
    };
    const lf = $('#loginForm');
    if (lf) {
      $$('[data-u]').forEach(b => b.onclick = () => { const u = D.USERS.find(x => x.id === b.dataset.u); $('#lid').value = u.id; $('#lpw').value = u.pw; $('#lpw').focus(); });
      lf.onsubmit = e => {
        e.preventDefault();
        const u = D.USERS.find(x => x.id === $('#lid').value.trim() && x.pw === $('#lpw').value);
        if (!u) { $('#lerr').textContent = '아이디 또는 비밀번호가 맞지 않습니다. 아래 체험 계정을 눌러 보세요.'; $('#lerr').style.color = 'var(--red)'; return; }
        C.S.otpPending = { id: u.id, name: u.name, code: String(100000 + Math.floor(Math.random() * 900000)), expires: Date.now() + 5 * 60 * 1000 }; C.save(); render();
      };
    }
    const of = $('#otpForm');
    if (of) {
      const ins = $$('.otp input'); ins[0].focus();
      ins.forEach((inp, i) => {
        inp.addEventListener('input', () => { inp.value = inp.value.replace(/\D/g, ''); if (inp.value && ins[i + 1]) ins[i + 1].focus(); });
        inp.addEventListener('keydown', e => { if (e.key === 'Backspace' && !inp.value && ins[i - 1]) ins[i - 1].focus(); });
        inp.addEventListener('paste', e => { const t = (e.clipboardData.getData('text') || '').replace(/\D/g, ''); if (t.length === 6) { e.preventDefault(); ins.forEach((x, k) => x.value = t[k]); } });
      });
      $('#back').onclick = () => { C.S.otpPending = null; C.save(); render(); };
      of.onsubmit = e => {
        e.preventDefault();
        const code = ins.map(x => x.value).join('');
        if (!C.S.otpPending || !C.S.otpPending.expires || Date.now() > C.S.otpPending.expires) { C.S.otpPending = null; C.save(); render(); toast('인증 시간이 만료되었습니다. 다시 로그인해 주세요', 'clock'); return; }
        if (code !== C.S.otpPending.code) { toast('인증번호가 맞지 않습니다', 'x'); ins.forEach(x => x.value = ''); ins[0].focus(); return; }
        const u = D.USERS.find(x => x.id === C.S.otpPending.id);
        C.S.user = { id: u.id, name: u.name, role: u.role, regions: u.regions.slice() }; C.S.otpPending = null; C.save();
        C.audit('로그인', u.id, '2단계 인증 완료');
        location.hash = '#/today'; render();
      };
    }
  }

  /* ---------- 셸 ---------- */
  function shell(route, inner, title, crumb) {
    const u = C.S.user;
    const cnt = myCases().length;
    const runs = route.split('/')[0];
    const nav = NAV.map(([h, items]) => `<h6>${h}</h6>` + items.map(([id, label, ic]) => {
      const badge = id === 'queue' ? `<span class="cnt">${cnt}</span>` : id === 'photo' ? `<span class="cnt g">${D.CASES.filter(c => c.ruleId.startsWith('PH')).length}</span>` : '';
      const on = runs === id || (runs === 'case' && id === 'queue') || (runs === 'rule' && id === 'rules');
      return `<a href="#/${id}" class="${on ? 'on' : ''}">${icon(ic)}<span>${label}</span>${badge}</a>`;
    }).join('')).join('');
    const day = 13, total = 63;
    return `<div class="shell" id="shell"><aside class="side" aria-label="주 메뉴">
      <div class="brand"><span class="logo"><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3M18 3v4h-4M6 21v-4h4"/></svg></span><b>RE:CHECK</b><small>WORKSPACE</small></div>
      <div class="season"><small>2028 점검 시즌 · 2월 ~ 4월</small><b>D+${day} · 2027년 실적 점검 중</b><div class="bar"><i style="width:${Math.round(day / total * 100)}%"></i></div></div>
      <nav class="nav">${nav}</nav>
      <div class="side-foot"><a class="side-home" href="../index.html">${icon('left')} 제안서 메인으로</a>가상 조합 · 가상 데이터로 만든 시연용 화면입니다.<br>기준일 ${D.TODAY} (전일 데이터 ${D.BIZ})</div></aside>
      <div class="main"><header class="top"><button class="btn ghost sm menu" id="menuBtn" aria-label="메뉴 열기">${icon('menu')}</button>
        <div class="grow"><div class="crumb">${esc(crumb || '')}</div><h1>${esc(title)}</h1></div>
        <span class="proto-tag">[프로토타입] 가상 데이터</span>
        <a class="live" href="#/pipeline" title="전일 데이터 판정 상태"><i></i><span>전일 판정 06:41 완료</span></a>
        <div class="who"><span class="av">${esc(u.name[0])}</span><span class="meta2"><b>${esc(u.name)}</b> <small>${esc(u.role)}</small></span><button class="btn ghost sm" id="logout" title="로그아웃" aria-label="로그아웃">${icon('logout')}</button></div>
      </header><main class="content" id="content">${inner}</main></div></div>`;
  }

  /* ---------- 체험 도구 ---------- */
  function demoTool() {
    const el = $('#demo'); if (!el) return;
    if (!C.S.user) { el.innerHTML = ''; return; }
    el.innerHTML = `<button id="demoBtn">${icon('spark')} 체험 도구</button>`;
    $('#demoBtn').onclick = () => {
      const open = el.querySelector('.pan');
      if (open) { open.remove(); return; }
      const pan = document.createElement('div'); pan.className = 'pan';
      pan.innerHTML = `<b style="color:var(--ink)">역할 바꿔 보기</b>${D.USERS.map(u => `<button class="btn sm" data-sw="${u.id}" style="justify-content:flex-start">${esc(u.role)} · ${esc(u.name)}</button>`).join('')}
        <hr style="border:0;border-top:1px solid var(--line);width:100%"><button class="btn sm" id="rst">${icon('refresh')} 체험 데이터 초기화</button><small class="faint">판정·규칙 변경·감시 목록·감사 로그가 처음 상태로 돌아갑니다.</small>`;
      el.appendChild(pan);
      $$('[data-sw]', pan).forEach(b => b.onclick = () => { const u = D.USERS.find(x => x.id === b.dataset.sw); C.S.user = { id: u.id, name: u.name, role: u.role, regions: u.regions.slice() }; C.save(); C.audit('역할 전환(체험)', u.id); pan.remove(); render(); toast(`${u.role} ${u.name} 계정으로 전환했습니다`); });
      $('#rst', pan).onclick = () => { C.reset(); pan.remove(); location.hash = '#/login'; render(); toast('체험 데이터를 초기화했습니다', 'refresh'); };
    };
  }

  /* ---------- 라우터 ---------- */
  function render() {
    generation++; cancelJobs(); closeModal();
    const app = $('#app');
    const h = (location.hash || '#/today').slice(2);
    if (!C.S.user) {
      app.innerHTML = loginView(C.S.otpPending ? 'otp' : 'id'); mountLogin(); demoTool(); document.title = 'RE:CHECK [프로토타입] · 로그인'; return;
    }
    const [name, ...rest] = h.split('/');
    const sc = SCREENS[name] || SCREENS.today;
    let args;
    try { args = rest.map(decodeURIComponent); } catch { args = []; }
    const out = sc(args);
    app.innerHTML = shell(h, out.html, out.title, out.crumb);
    document.title = `${out.title} · RE:CHECK [프로토타입]`;
    $('#logout').onclick = () => { C.audit('로그아웃', C.S.user.id); C.S.user = null; C.save(); location.hash = '#/login'; render(); };
    $('#menuBtn').onclick = () => $('#shell').classList.toggle('open');
    $('#shell').addEventListener('click', e => { if (e.target.id === 'shell') $('#shell').classList.remove('open'); });
    $$('.side .nav a').forEach(a => a.addEventListener('click', () => $('#shell').classList.remove('open')));
    if (out.mount) out.mount($('#content'));
    demoTool();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', render);

  window.APP = {
    reg(name, fn) { SCREENS[name] = fn; }, render, toast, modal, closeModal, can, canJudge, myCases, later, repeat,
    start() { C.load(); if (!C.S.audit.length) C.audit('체험 시작', '시스템', '초기 데이터 적재'); render(); }
  };
})();
