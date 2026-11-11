/* 재활용 실적 이상탐지·모니터링 [프로토타입] — 가상 데이터
   모든 회원사·사업장·차량·사업자번호·수치는 시연용으로 만든 가상 값입니다. */
(function () {
  'use strict';

  /* ---------- 결정적 난수 ---------- */
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const R = rng(20280314);
  const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
  const pick = arr => arr[Math.floor(R() * arr.length)];
  const pad = (n, w) => String(n).padStart(w, '0');

  const TODAY = '2028-03-14';
  const BIZ = '2028-03-13'; // 전일 데이터 기준일

  /* ---------- 권역 ---------- */
  const REGIONS = [
    { id: 'CAP', name: '수도권' }, { id: 'GW', name: '강원' }, { id: 'CC', name: '충청' },
    { id: 'HN', name: '호남' }, { id: 'YN', name: '영남' }
  ];

  /* ---------- 사업회원 (가상) ---------- */
  const MEMBER_SEED = [
    ['M01', '한결리사이클', 'CAP', '대형·중소형'], ['M02', '새솔자원', 'CAP', '대형·통신'], ['M03', '도담순환산업', 'CAP', '중소형'],
    ['M04', '미르에코텍', 'CAP', '대형·중소형'], ['M05', '청록자원', 'GW', '대형'], ['M06', '늘해랑순환', 'GW', '중소형·통신'],
    ['M07', '가온리소스', 'CC', '대형·중소형'], ['M08', '바른재생', 'CC', '대형'], ['M09', '다온환경', 'CC', '중소형'],
    ['M10', '해밀자원', 'CC', '대형·통신'], ['M11', '온새미순환', 'HN', '대형·중소형'], ['M12', '라온에코', 'HN', '중소형'],
    ['M13', '여울재생', 'HN', '대형'], ['M14', '누리업사이클', 'YN', '대형·중소형'], ['M15', '다솜리사이클', 'YN', '중소형·통신'],
    ['M16', '아라자원', 'YN', '대형'], ['M17', '소담재생', 'YN', '중소형'], ['M18', '마루순환기술', 'CAP', '통신·중소형']
  ];
  const SURN = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황'];
  const GIVEN = ['도윤', '서준', '하은', '지호', '민서', '예준', '수아', '시우', '지안', '현우', '은채', '준혁', '다인', '태윤', '소율', '건우'];
  const person = () => pick(SURN) + pick(GIVEN);
  const bizNo = () => `9${ri(10, 99)}-${ri(80, 99)}-${pad(ri(10000, 99999), 5)}`;

  // 화면용 상대 좌표(가상 지도, 0~100)
  const REGION_POS = { CAP: [30, 26], GW: [62, 20], CC: [38, 46], HN: [26, 74], YN: [70, 64] };
  const SITE_SUFFIX = ['제1공장', '제2공장', '물류센터', '해체장'];

  const MEMBERS = MEMBER_SEED.map(([id, name, region, scope], i) => {
    const nSite = i % 4 === 0 ? 2 : 1;
    const base = REGION_POS[region];
    const sites = [];
    for (let s = 0; s < nSite; s++) {
      sites.push({
        id: `${id}-S${s + 1}`, name: `${name} ${SITE_SUFFIX[s]}`,
        x: base[0] + ri(-9, 9), y: base[1] + ri(-8, 8),
        capacity: ri(40, 180), gates: ri(1, 3), permitTo: `2029-${pad(ri(1, 12), 2)}-${pad(ri(1, 28), 2)}`
      });
    }
    const risk = [82, 46, 37, 71, 28, 33, 64, 41, 22, 55, 58, 30, 26, 76, 44, 35, 19, 49][i];
    const quality = Math.max(52, Math.min(97, 100 - Math.round(risk * 0.55) + ri(-4, 4)));
    const monthly = [];
    const scale = ri(1600, 5200);
    for (let m = 0; m < 12; m++) {
      const season = 1 + 0.12 * Math.sin((m - 2) / 12 * Math.PI * 2);
      monthly.push(Math.round(scale * season * (0.9 + R() * 0.2)));
    }
    const riskTrend = [];
    let rv = Math.max(10, risk - ri(18, 30));
    for (let m = 0; m < 12; m++) { rv = Math.max(6, Math.min(96, rv + ri(-5, 8))); riskTrend.push(m === 11 ? risk : rv); }
    return {
      id, name: name + '(주)', short: name, region, scope, ceo: person(), bizNo: bizNo(), sites,
      contractFrom: `20${ri(19, 24)}-0${ri(1, 9)}-01`, risk, quality,
      grade: quality >= 85 ? 'A' : quality >= 75 ? 'B' : quality >= 65 ? 'C' : 'D',
      monthly, riskTrend,
      expDeduct: +(risk * 0.042 + R() * 0.4).toFixed(2), // 예상 차감률 %
      vehicles: ri(4, 14), partners: ri(18, 64)
    };
  });
  const memberById = Object.fromEntries(MEMBERS.map(m => [m.id, m]));

  /* ---------- 거래처(반입처·공급처·출고처) ---------- */
  const PARTNER_NAMES = ['동방가전유통', '하나전자서비스', '태평상사', '미래종합물류', '세움가전', '우리고물상회', '대성자원상사', '은하유통',
    '한마음수거', '대한리빙', '서해물산', '정우자원', '명성전자', '오성상회', '삼보가전', '푸른상사', '동진물류', '그린수거센터', '청솔상회', '신영자원',
    '금강유통', '한울가전', '백두물산', '정다운상회'];
  const PARTNERS = PARTNER_NAMES.map((n, i) => ({
    id: `P${pad(i + 1, 3)}`, name: n + (i % 3 === 0 ? '(주)' : ''), bizNo: bizNo(), ceo: person(),
    addr: `${pick(['경기 화성시', '경기 평택시', '충남 천안시', '충북 청주시', '전북 익산시', '경북 구미시', '경남 김해시', '강원 원주시'])} ${pick(['산단', '공단', '중앙', '동부', '서부'])}로 ${ri(10, 280)}`,
    type: pick(['반입처', '반입처', '공급처', '출고처']), status: '계속',
    suitableTo: `202${pick([8, 8, 9])}-${pad(ri(1, 12), 2)}-${pad(ri(1, 28), 2)}`
  }));
  PARTNERS[5].status = '폐업'; PARTNERS[5].closedAt = '2027-09-30';
  PARTNERS[13].status = '휴업';
  PARTNERS[2].suitableTo = '2028-04-02'; PARTNERS[9].suitableTo = '2028-04-09'; PARTNERS[17].suitableTo = '2028-03-29';
  // 연관 후보 시연용: 같은 대표자·주소
  PARTNERS[16].ceo = PARTNERS[6].ceo; PARTNERS[16].addr = PARTNERS[6].addr;
  PARTNERS[21].bizNo = PARTNERS[6].bizNo.slice(0, 7) + PARTNERS[21].bizNo.slice(7);

  /* ---------- 품목 사전 ---------- */
  const ITEMS = [
    { code: 'L-RF', name: '대형가전 · 냉장고', group: '대형', unitKg: 68, target: true },
    { code: 'L-WM', name: '대형가전 · 세탁기', group: '대형', unitKg: 52, target: true },
    { code: 'L-AC', name: '대형가전 · 에어컨', group: '대형', unitKg: 46, target: true },
    { code: 'L-TV', name: '대형가전 · TV(40인치 이상)', group: '대형', unitKg: 21, target: true },
    { code: 'S-MW', name: '중소형가전 · 전자레인지', group: '중소형', unitKg: 13, target: true },
    { code: 'S-PC', name: '중소형가전 · 컴퓨터', group: '중소형', unitKg: 9, target: true },
    { code: 'C-MP', name: '통신기기 · 휴대전화', group: '통신', unitKg: 0.18, target: true },
    { code: 'X-MT', name: '비대상 · 고철(가전 외)', group: '비대상', unitKg: null, target: false },
    { code: 'X-CB', name: '비대상 · 전선·케이블 단독', group: '비대상', unitKg: null, target: false }
  ];

  /* ---------- 차량 ---------- */
  const PLATE_HAN = ['바', '사', '아', '자'];
  const plate = () => `${ri(80, 99)}${pick(PLATE_HAN)} ${ri(1000, 9999)}`;
  const TRUCK_COLORS = ['#E8EDF2', '#2F6FB0', '#D9E3EA', '#3B8F6E', '#C9483B', '#F2C14E'];
  const VEHICLES = [];
  MEMBERS.forEach(m => {
    for (let v = 0; v < 3; v++) VEHICLES.push({ no: plate(), member: m.id, ton: pick([2.5, 5, 5, 8, 11]), tare: 0, color: pick(TRUCK_COLORS), permitted: R() > 0.08 });
  });
  VEHICLES.forEach(v => { v.tare = Math.round(v.ton * 760 + ri(-120, 120)); });

  /* ---------- 탐지 규칙 47개 ---------- */
  const CATS = {
    IN: { name: '입고 정합성', color: '#0EA5E9' }, OUT: { name: '출고 정합성', color: '#6366F1' },
    MB: { name: '물질수지·통계', color: '#A855F7' }, WT: { name: '계량 물리 타당성', color: '#14B8A6' },
    NW: { name: '회원사 간 네트워크', color: '#F97316' }, PH: { name: '사진', color: '#EC4899' }, DOC: { name: '문서', color: '#84CC16' }
  };
  // [id, 이름, 설명, 1단계?, 수준, 파라미터[label,v,unit,min,max,step,민감도], 월평균 탐지, 정탐률]
  const RULE_SEED = [
    ['IN-01', '관리표 입고–계량 중량 불일치', '관리표 입고 중량과 연결된 계량 순중량의 차이가 허용 오차를 넘음', 1, 'L2', ['허용 오차', 3, '%', 1, 10, 0.5, -1.1], 22, 0.58],
    ['IN-02', '비대상품 실적화', '품목 사전의 비대상 품목(고철·전선 단독 등)이 대상 품목 실적으로 입고됨', 1, 'L2', ['품목 대응 신뢰도 하한', 0.8, '', 0.5, 0.95, 0.05, 0.6], 6, 0.81],
    ['IN-03', '무허가 반입처 입고', '허가·신고가 확인되지 않은 반입처로부터의 입고', 1, 'L2', ['허가 확인 유예', 0, '일', 0, 30, 1, -0.4], 4, 0.77],
    ['OUT-01', '출고량 재고 가능량 초과', '기초 재고 + 반입 − 출고가 음수가 되는 출고', 1, 'L2', ['허용 오차', 2, '%', 0, 10, 0.5, -1.2], 5, 0.66],
    ['OUT-02', '허가 범위 밖 출고처', '출고처의 허가 품목·처리 방법이 출고 품목과 맞지 않음', 1, 'L2', ['허가 확인 유예', 0, '일', 0, 30, 1, -0.4], 3, 0.72],
    ['OUT-03', '출고 관리표–세금계산서 중량 불일치', '출고 관리표 중량과 연결된 세금계산서 중량의 차이', 1, 'L2', ['허용 오차', 3, '%', 1, 10, 0.5, -1.0], 9, 0.49],
    ['WT-01', '공차 미계량 확정', '2차(공차) 계량 없이 1차 계량만으로 확정된 전표', 1, 'L2', ['확정 후 경과', 0, '시간', 0, 48, 1, -0.2], 11, 0.74],
    ['WT-02', '확정 후 중량 수정', '확정된 계량 전표의 중량이 이후 수정됨', 1, 'L2', ['수정 폭 하한', 1, '%', 0, 10, 0.5, -0.9], 14, 0.61],
    ['WT-03', '체류 중 타 사업장 계량', '1·2차 계량 사이에 같은 차량이 다른 사업장에서 계량됨', 1, 'L2', ['체류 판단 최소', 10, '분', 0, 60, 5, -0.5], 5, 0.86],
    ['WT-04', '이동시간 부족', '같은 차량의 두 사업장 계량 간격이 도로 경로 시간보다 짧음', 1, 'L2', ['경로 시간 대비 비율', 0.7, '배', 0.3, 1, 0.05, 1.8], 12, 0.79],
    ['WT-05', '재계근', '같은 적재물로 보이는 계량(중량·차량·시각 패턴)이 반복됨', 1, 'L2', ['중량 차이 허용', 40, 'kg', 10, 150, 10, 1.0], 8, 0.7],
    ['WT-06', '1·2차 계량 간격 과소', '하역에 필요한 최소 시간보다 1·2차 계량 간격이 짧음', 1, 'L3', ['최소 간격', 12, '분', 3, 40, 1, 1.2], 10, 0.55],
    ['WT-07', '공차중량 등록값 이탈', '2차(공차) 중량이 차량 등록 공차중량과 크게 다름', 1, 'L3', ['허용 오차', 8, '%', 2, 20, 1, -1.1], 13, 0.47],
    ['WT-08', '최대적재량 초과', '순중량이 차량 최대적재량을 초과', 1, 'L3', ['초과 허용', 10, '%', 0, 30, 1, -0.8], 4, 0.63],
    ['WT-09', '계량대 운영시간 외 계량', '사업장 계량대 운영시간 밖의 계량', 1, 'L3', ['운영시간 여유', 30, '분', 0, 120, 10, -0.6], 7, 0.52],
    ['WT-10', '동일 계량대 동시각 중복 계량', '한 계량대에서 물리적으로 불가능한 짧은 간격의 서로 다른 차량 계량', 0, 'L3', ['최소 간격', 2, '분', 0, 10, 1, 0.9], 3, 0.8],
    ['WT-11', '계량값 끝자리 반복 패턴', '계량값 끝자리가 0·5에 비정상적으로 몰림', 0, 'L3', ['편중 유의수준', 0.01, '', 0.001, 0.05, 0.001, 0.5], 2, 0.5],
    ['WT-12', '수기 입력 계량 비율 이탈', '자동 계량이 아닌 수기 입력 비율이 동종 대비 높음', 0, 'L3', ['동종 대비 배수', 2, '배', 1.2, 5, 0.1, -1.0], 3, 0.57],
    ['WT-13', '차수 삭제 후 재생성', '계량 차수가 삭제된 뒤 다른 중량으로 다시 생성됨', 0, 'L2', ['재생성 간격', 24, '시간', 1, 72, 1, 0.4], 2, 0.83],
    ['WT-14', '동일 차량 일일 왕복 과다', '경로 시간 합으로 불가능한 일일 왕복 횟수', 0, 'L3', ['가능 횟수 대비', 1.2, '배', 1, 2, 0.05, -1.3], 4, 0.6],
    ['WT-15', '계량대 처리규모 초과', '사업장 일 처리규모를 넘는 반입 계량', 0, 'L3', ['처리규모 대비', 1.1, '배', 1, 2, 0.05, -1.4], 2, 0.62],
    ['NW-01', '회원사 간 이중 계상', '같은 차량·시각·중량의 반입이 두 회원사 실적에 모두 계상됨', 1, 'L2', ['시각 허용', 30, '분', 5, 120, 5, 0.7], 3, 0.92],
    ['NW-02', '감시 목록 거래', '감시 목록 반입처·차량·공급처와의 거래 (등록 전 5년 소급)', 1, 'L2', ['소급 기간', 5, '년', 1, 5, 1, 0.3], 6, 0.88],
    ['NW-03', '순환 거래', 'A→B→A로 같은 물량이 회원사·거래처를 돌아 다시 실적화', 0, 'L3', ['순환 탐지 기간', 30, '일', 7, 90, 1, 0.8], 2, 0.75],
    ['NW-04', '동일 차량 복수 회원사 동시 사용', '같은 차량이 같은 날 여러 회원사에서 계량', 0, 'L3', ['같은 날 회원사 수', 2, '곳', 2, 4, 1, -1.2], 4, 0.64],
    ['NW-05', '휴·폐업 사업자 거래', '국세청 상태조회 기준 휴·폐업 사업자와의 거래', 0, 'L2', ['상태 반영 유예', 0, '일', 0, 30, 1, -0.3], 3, 0.84],
    ['NW-06', '연관 거래처 집중', '같은 대표자·주소·사업자번호 앞자리의 거래처에 물량 집중', 0, 'L3', ['집중도 하한', 40, '%', 20, 80, 5, -0.9], 2, 0.58],
    ['NW-07', '공급처 적정성 만료 후 거래', '적정성 확인 기간이 지난 공급처와의 거래', 0, 'L2', ['만료 후 유예', 0, '일', 0, 30, 1, -0.3], 3, 0.9],
    ['NW-08', '신규 거래처 반입 급증', '거래 시작 90일 이내 거래처의 반입량 급증', 0, 'L3', ['증가 배수', 3, '배', 1.5, 6, 0.5, -1.0], 3, 0.48],
    ['NW-09', '허가 범위 밖 실적', '사업장 허가 품목·처리규모 밖의 실적', 0, 'L2', ['처리규모 여유', 5, '%', 0, 20, 1, -0.7], 2, 0.86],
    ['NW-10', '거래처 간 중량 패턴 동조', '서로 다른 거래처의 반입 중량 시계열이 비정상적으로 같음', 0, 'L3', ['상관계수 하한', 0.95, '', 0.8, 0.99, 0.01, 0.9], 1, 0.6],
    ['MB-01', '반입량 대비 소재 산출 비율 이탈', '반입 중량 대비 철·비철·플라스틱 산출 비율이 동종 분포 밖', 0, 'L3', ['분포 이탈(분위)', 95, '%', 80, 99, 1, 1.0], 4, 0.59],
    ['MB-02', '대당 중량 동종 분포 이탈', '품목별 대당 중량이 동종 회원사 분포·자기 추세 대비 이탈', 0, 'L3', ['분포 이탈(분위)', 95, '%', 80, 99, 1, 1.0], 6, 0.54],
    ['MB-03', '폐기물 비율 급변', '반입 대비 폐기물 처리 비율의 급변', 0, 'L3', ['전월 대비 변화', 30, '%', 10, 80, 5, -0.9], 3, 0.51],
    ['MB-04', '외부계량 비율 이탈', '자체 계량대가 아닌 외부 계량 비율이 동종 대비 높음', 0, 'L3', ['동종 대비 배수', 2, '배', 1.2, 5, 0.1, -1.0], 3, 0.56],
    ['MB-05', '수정률 급증', '관리표·계량 수정 건수 비율이 자기 추세 대비 급증', 0, 'L3', ['추세 대비 배수', 2.5, '배', 1.2, 5, 0.1, -1.0], 3, 0.53],
    ['MB-06', '월말 실적 집중', '월말 3영업일에 실적이 비정상적으로 집중', 0, 'L3', ['월말 비중 하한', 35, '%', 20, 60, 1, -1.1], 2, 0.5],
    ['PH-01', '번호판 불일치', '계량 사진에서 인식한 번호판과 입력 차량번호가 다름', 1, 'L2', ['인식 신뢰도 하한', 0.9, '', 0.6, 0.99, 0.01, -0.6], 9, 0.71],
    ['PH-02', '동일 사진 재사용', '다른 전표에 같은 사진(크기 변경·재압축 포함)이 쓰임', 1, 'L2', ['해시 거리 상한', 6, '', 0, 16, 1, 0.9], 5, 0.93],
    ['PH-03', '유사 사진 재사용', '다른 전표에 거의 같은 사진(연속 촬영 등)이 쓰임', 0, 'L3', ['유사도 하한', 0.92, '', 0.8, 0.99, 0.01, -1.4], 6, 0.62],
    ['PH-04', '촬영 시각–계량 시각 불일치', '사진의 촬영 시각과 계량 시각의 차이가 큼', 0, 'L2', ['허용 차이', 15, '분', 5, 120, 5, -0.8], 7, 0.66],
    ['PH-05', '1·2차 사진 차량 불일치', '1차와 2차 사진의 차량이 서로 다름', 0, 'L2', ['차량 유사도 하한', 0.7, '', 0.5, 0.95, 0.05, 0.7], 3, 0.69],
    ['PH-06', '계량 사진 누락', '필수 계량 사진이 없는 확정 전표', 0, 'L3', ['누락 허용', 0, '장', 0, 1, 1, -0.4], 8, 0.4],
    ['PH-07', '사진 메타정보 편집 흔적', '사진의 촬영 정보가 편집 도구로 바뀐 흔적', 0, 'L3', ['편집 신호 점수', 0.7, '', 0.5, 0.95, 0.05, 0.6], 2, 0.61],
    ['DOC-01', '계산서 발행일–거래일 괴리', '세금계산서 발행일과 관리표 거래일의 차이가 큼', 0, 'L3', ['허용 일수', 40, '일', 10, 90, 5, -0.8], 4, 0.45],
    ['DOC-02', '계산서 공급자 휴·폐업 상태', '발행 시점 공급자가 휴·폐업 상태', 0, 'L2', ['상태 반영 유예', 0, '일', 0, 30, 1, -0.3], 1, 0.88],
    ['DOC-03', '동일 계산서 복수 관리표 연결 초과', '한 세금계산서 중량보다 많은 관리표 중량이 연결됨', 0, 'L2', ['초과 허용', 2, '%', 0, 10, 0.5, -1.0], 2, 0.79]
  ];

  const SQL = {
    'WT-04': `-- 같은 차량이 두 사업장에서 계량된 간격이 도로 경로 시간보다 짧은 경우
SELECT b.slip_id, b.member_id, a.site_id AS from_site, b.site_id AS to_site,
       b.vehicle_no,
       EXTRACT(EPOCH FROM b.weighed_at - a.weighed_at) / 60 AS gap_min,
       r.drive_min
FROM   mart.weigh_slip a
JOIN   mart.weigh_slip b
       ON  b.vehicle_no = a.vehicle_no
       AND b.weighed_at > a.weighed_at
       AND b.site_id   <> a.site_id
JOIN   mart.route_time r
       ON  r.from_site = a.site_id AND r.to_site = b.site_id
WHERE  b.biz_date BETWEEN :from AND :to
  AND  EXTRACT(EPOCH FROM b.weighed_at - a.weighed_at) / 60
       < r.drive_min * {{경로 시간 대비 비율}}`,
    'WT-01': `-- 2차(공차) 계량 없이 확정된 전표
SELECT s.slip_id, s.member_id, s.vehicle_no, s.confirmed_at
FROM   mart.weigh_slip s
WHERE  s.biz_date BETWEEN :from AND :to
  AND  s.status = 'CONFIRMED'
  AND  NOT EXISTS (SELECT 1 FROM mart.weigh_round r
                   WHERE r.slip_id = s.slip_id AND r.round_no = 2)
  AND  s.confirmed_at < now() - interval '{{확정 후 경과}} hours'`,
    'NW-01': `-- 같은 차량·시각·중량이 두 회원사 실적에 모두 계상
SELECT a.slip_id AS slip_a, b.slip_id AS slip_b,
       a.member_id AS member_a, b.member_id AS member_b,
       a.vehicle_no, a.net_kg, b.net_kg
FROM   mart.weigh_slip a
JOIN   mart.weigh_slip b
       ON  b.vehicle_no = a.vehicle_no
       AND b.member_id <> a.member_id
       AND abs(EXTRACT(EPOCH FROM b.weighed_at - a.weighed_at)) / 60 <= {{시각 허용}}
       AND abs(b.net_kg - a.net_kg) <= a.net_kg * 0.02
WHERE  a.biz_date BETWEEN :from AND :to`,
    'PH-01': `-- 사진 번호판 인식 결과와 입력 차량번호 불일치
SELECT p.slip_id, p.round_no, s.vehicle_no AS input_no,
       p.plate_text AS read_no, p.plate_conf
FROM   mart.slip_photo p
JOIN   mart.weigh_slip s ON s.slip_id = p.slip_id
WHERE  s.biz_date BETWEEN :from AND :to
  AND  p.plate_conf >= {{인식 신뢰도 하한}}
  AND  norm_plate(p.plate_text) <> norm_plate(s.vehicle_no)`,
    'PH-02': `-- 다른 전표에 같은 사진(지각 해시 거리 이하)
SELECT p.slip_id, q.slip_id AS reused_from,
       hamming(p.phash, q.phash) AS dist
FROM   mart.slip_photo p
JOIN   mart.slip_photo q
       ON  q.slip_id <> p.slip_id
       AND q.phash_bucket = p.phash_bucket
WHERE  p.taken_date BETWEEN :from AND :to
  AND  hamming(p.phash, q.phash) <= {{해시 거리 상한}}`,
    'IN-02': `-- 비대상 품목이 대상 품목 실적으로 입고
SELECT l.manifest_id, l.line_no, l.item_code, m.mapped_code, m.confidence
FROM   mart.manifest_line l
JOIN   mart.item_mapping m ON m.source_item = l.item_name
JOIN   ref.item_dict d     ON d.code = m.mapped_code
WHERE  l.biz_date BETWEEN :from AND :to
  AND  d.is_target = false
  AND  l.item_code IN (SELECT code FROM ref.item_dict WHERE is_target)
  AND  m.confidence >= {{품목 대응 신뢰도 하한}}`
  };
  const TABLES = { IN: 'manifest_line', OUT: 'manifest_line', MB: 'member_month_stat', WT: 'weigh_slip', NW: 'trade_edge', PH: 'slip_photo', DOC: 'invoice_link' };
  function genericSql(id, name, cat, p) {
    return `-- ${name}
SELECT t.*, t.metric AS actual_value
FROM   mart.${TABLES[cat]} t
WHERE  t.biz_date BETWEEN :from AND :to
  AND  t.metric_code = '${id}'
  AND  t.metric ${p[6] >= 0 ? '<' : '>'} {{${p[0]}}}`;
  }

  const RULES = RULE_SEED.map(([id, name, desc, s1, level, p, base, prec], i) => {
    const cat = id.split('-')[0];
    return {
      id, name, desc, cat, stage: s1 ? 1 : 2, level, status: '운영', version: s1 ? 'v1.3' : 'v1.1',
      params: [{ label: p[0], v: p[1], unit: p[2], min: p[3], max: p[4], step: p[5], sens: p[6] }],
      base, prec, weight: level === 'L2' ? 0.9 : 0.7,
      sql: SQL[id] || genericSql(id, name, cat, p),
      basis: '업무처리지침 · 점검 매뉴얼 해당 조항(가상)', updated: s1 ? '2027-09-18' : '2027-10-22', owner: s1 ? '이서준' : '박하은'
    };
  });
  const ruleById = Object.fromEntries(RULES.map(r => [r.id, r]));
  ruleById['WT-07'].status = '검증'; ruleById['MB-06'].status = '중지'; ruleById['PH-06'].status = '검증';

  /* ---------- 도로 경로 시간 (사업장 쌍) ---------- */
  function driveMin(a, b) {
    const dx = a.x - b.x, dy = a.y - b.y;
    return Math.max(18, Math.round(Math.sqrt(dx * dx + dy * dy) * 4.1 + 12));
  }

  /* ---------- 사진 사양 ---------- */
  let photoSeq = 1;
  function photoSpec(o) {
    return Object.assign({ id: 'PH' + pad(photoSeq++, 6), seed: ri(1, 99999), plate: '', color: '#E8EDF2', load: 0.8, cam: 'CAM-1', time: '', dx: 0, night: false, cargo: pick(['rf', 'wm', 'mix']) }, o);
  }

  /* ---------- 탐지 건 (전일 데이터) ---------- */
  const ASSIGNEES = { CAP: '김도윤', GW: '최민서', CC: '정예준', HN: '오지안', YN: '한소율' };
  const CASES = [];
  let seq = 1;
  const t2 = (h, m) => `${pad(h, 2)}:${pad(m, 2)}`;

  function mkCase(ruleId, memberId, extra) {
    const r = ruleById[ruleId], m = memberById[memberId];
    const site = m.sites[0];
    const veh = VEHICLES.filter(v => v.member === memberId)[ri(0, 2)];
    const item = pick(ITEMS.slice(0, 6));
    const qty = ri(14, 60);
    const net = Math.round(qty * item.unitKg * (0.92 + R() * 0.12));
    const h = ri(8, 16), mi = ri(0, 59);
    const gross = veh.tare + net;
    const supplier = pick(PARTNERS.filter(p => p.type !== '출고처'));
    const c = {
      id: `D-2803-${pad(seq++, 4)}`, ruleId, memberId, siteId: site.id, region: m.region, biz: BIZ, detectedAt: `${TODAY} 06:4${ri(0, 1)}`,
      level: r.level, status: '신규', assignee: ASSIGNEES[m.region], due: '2028-03-21', risk: 0, weightKg: net,
      mf: { no: `MF-2803-${pad(ri(10000, 99999), 5)}`, line: ri(1, 6), type: '입고', item: item.name, itemCode: item.code, qty, kg: net, partner: supplier.name, partnerBiz: supplier.bizNo, date: BIZ, status: '확정' },
      slips: [
        { no: `WS-${pad(ri(100000, 999999), 6)}`, round: '1차', kind: '적재', at: `${BIZ} ${t2(h, mi)}`, kg: gross, gate: `계량대 ${pick(['A', 'B'])}`, site: site.name, vehicle: veh.no, input: '자동', photo: photoSpec({ plate: veh.no, color: veh.color, load: 0.85, time: `${BIZ} ${t2(h, mi)}:${pad(ri(0, 59), 2)}`, cam: 'CAM-1' }) },
        { no: '', round: '2차', kind: '공차', at: `${BIZ} ${t2(h, Math.min(59, mi) )}`, kg: veh.tare, gate: '계량대 A', site: site.name, vehicle: veh.no, input: '자동', photo: null }
      ],
      history: [],
      invoice: { no: `2028031${ri(1, 3)}-${pad(ri(10000000, 99999999), 8)}`, issue: '2028-03-13', supplier: supplier.name, supplierBiz: supplier.bizNo, item: item.name.split('· ')[1], kg: net, amount: Math.round(net * ri(180, 260) / 10) * 10 },
      basis: [], summary: '', similar: [], photos2: null, route: null
    };
    // 2차 계량 시각: 1차 + 25~70분
    const t1 = h * 60 + mi + ri(25, 70);
    c.slips[1].at = `${BIZ} ${t2(Math.floor(t1 / 60), t1 % 60)}`;
    c.slips[1].no = c.slips[0].no;
    c.slips[1].photo = photoSpec({ plate: veh.no, color: veh.color, load: 0, time: `${c.slips[1].at}:${pad(ri(0, 59), 2)}`, cam: 'CAM-1' });
    const risk = Math.round(Math.min(98, 35 + r.weight * 40 + m.risk * 0.22 + R() * 14));
    c.risk = risk;
    applyRule(c, r, m, veh, site);
    if (extra) Object.assign(c, extra);
    c.similar = [
      { id: `D-${pick(['2711', '2712', '2801', '2802'])}-${pad(ri(1, 900), 4)}`, date: `202${pick([7, 7, 8])}-${pad(ri(1, 12), 2)}-${pad(ri(1, 28), 2)}`, member: R() > 0.5 ? m.short : pick(MEMBERS).short, result: pick(['사전차감', '차감방지', '정상', '배분 조정']) },
      { id: `D-${pick(['2709', '2710', '2711'])}-${pad(ri(1, 900), 4)}`, date: `2027-${pad(ri(6, 12), 2)}-${pad(ri(1, 28), 2)}`, member: m.short, result: pick(['사전차감', '정상', '공단 협의 방지']) }
    ];
    CASES.push(c);
    return c;
  }

  function applyRule(c, r, m, veh, site) {
    const p = r.params[0];
    const s1 = c.slips[0], s2 = c.slips[1];
    switch (r.id) {
      case 'WT-04': {
        const other = pick(MEMBERS.filter(x => x.id !== m.id && x.region !== m.region));
        const os = other.sites[0];
        const dm = driveMin(site, os) + 20;
        const gap = Math.round(dm * (0.35 + R() * 0.25));
        const [hh, mm] = s1.at.slice(11).split(':').map(Number);
        const tPrev = hh * 60 + mm - gap;
        const prevAt = `${BIZ} ${t2(Math.floor(tPrev / 60), (tPrev % 60 + 60) % 60)}`;
        c.route = { from: os.name, fromMember: other.short, to: site.name, driveMin: dm, gapMin: gap, prevAt, prevSlip: `WS-${pad(ri(100000, 999999), 6)}` };
        c.basis = [['기준 경로 시간 (현장 보정 포함)', `${dm}분`], ['실제 계량 간격', `${gap}분`], ['기준값', `경로 시간 × ${p.v} = ${Math.round(dm * p.v)}분`], ['판정', `${gap}분 < ${Math.round(dm * p.v)}분`]];
        c.summary = `${veh.no} 차량이 ${other.short} 사업장에서 ${prevAt.slice(11)}에 계량된 뒤 ${gap}분 만에 ${m.short} 사업장에서 계량되었습니다. 두 사업장 간 도로 경로 시간은 ${dm}분입니다.`;
        break;
      }
      case 'WT-03': {
        const other = pick(MEMBERS.filter(x => x.id !== m.id));
        const [hh, mm] = s1.at.slice(11).split(':').map(Number);
        const mid = hh * 60 + mm + 14;
        c.route = { from: site.name, to: other.sites[0].name, fromMember: m.short, driveMin: driveMin(site, other.sites[0]), gapMin: 14, midAt: `${BIZ} ${t2(Math.floor(mid / 60), mid % 60)}`, stay: true, prevSlip: `WS-${pad(ri(100000, 999999), 6)}` };
        c.basis = [['1차 계량', s1.at.slice(11)], ['타 사업장 계량', `${c.route.midAt.slice(11)} · ${other.short}`], ['2차 계량', s2.at.slice(11)], ['판정', '1·2차 사이 다른 사업장 계량 1건']];
        c.summary = `1차 계량 후 2차 계량 전에 같은 차량이 ${other.short} 사업장에서 계량되었습니다. 하역 없이 다른 곳을 다녀왔을 가능성이 있습니다.`;
        break;
      }
      case 'WT-01':
        s2.kg = null; s2.at = '—'; s2.photo = null; s2.no = '';
        c.basis = [['1차 계량', `${s1.kg.toLocaleString()} kg`], ['2차(공차) 계량', '없음'], ['확정 방식', '등록 공차중량으로 순중량 계산'], ['판정', '공차 미계량 확정']];
        c.summary = '2차(공차) 계량 없이 차량 등록 공차중량으로 순중량을 계산해 확정했습니다. 실제 하역 여부를 확인할 근거가 없습니다.';
        break;
      case 'WT-02': {
        const before = c.mf.kg, after = Math.round(before * (1.07 + R() * 0.08));
        c.history = [
          { ver: 1, at: `${BIZ} ${s2.at.slice(11)}`, field: '순중량', before: '—', after: `${before.toLocaleString()} kg`, by: '계량 시스템(자동)', state: '확정' },
          { ver: 2, at: `${TODAY} 00:12`, field: '순중량', before: `${before.toLocaleString()} kg`, after: `${after.toLocaleString()} kg`, by: '사업장 관리자', state: '확정 후 수정' }
        ];
        c.mf.kg = after; c.weightKg = after;
        c.basis = [['확정 시 순중량', `${before.toLocaleString()} kg`], ['수정 후 순중량', `${after.toLocaleString()} kg`], ['수정 폭', `${((after / before - 1) * 100).toFixed(1)}%`], ['기준값', `${p.v}% 이상`]];
        c.summary = '확정된 계량 전표의 순중량이 자정 이후 사업장 관리자 계정으로 수정되었습니다. 원래 값은 스냅샷에 보관되어 있습니다.';
        break;
      }
      case 'IN-01': {
        const diff = +(4 + R() * 6).toFixed(1);
        c.mf.kg = Math.round(c.weightKg * (1 + diff / 100));
        c.basis = [['관리표 입고 중량', `${c.mf.kg.toLocaleString()} kg`], ['계량 순중량', `${c.weightKg.toLocaleString()} kg`], ['차이', `${diff}%`], ['기준값', `허용 오차 ${p.v}%`]];
        c.summary = `관리표 입고 중량이 계량 순중량보다 ${diff}% 많습니다.`;
        break;
      }
      case 'IN-02':
        c.mf.item = '대형가전 · 세탁기'; c.invoice.item = '고철(가전 외)';
        c.basis = [['관리표 품목', '대형가전 · 세탁기 (대상)'], ['세금계산서 품목', '고철(가전 외) → 비대상'], ['품목 대응 신뢰도', '0.91'], ['기준값', `${p.v} 이상`]];
        c.summary = '세금계산서에는 가전 외 고철로 거래되었으나 관리표에는 대상 품목(세탁기)으로 입고되었습니다.';
        break;
      case 'PH-01': {
        const read = plate();
        s1.photo.plate = read; s1.photo.readPlate = read; s1.photo.conf = +(0.93 + R() * 0.06).toFixed(2); if (R() < 0.4) { s1.photo.night = true; s2.photo.night = true; }
        c.basis = [['입력 차량번호', veh.no], ['사진 인식 번호', read], ['인식 신뢰도', String(s1.photo.conf)], ['기준값', `신뢰도 ${p.v} 이상에서 불일치`]];
        c.summary = `1차 계량 사진에서 읽은 번호판(${read})이 입력 차량번호(${veh.no})와 다릅니다.`;
        break;
      }
      case 'PH-02': case 'PH-03': {
        const other = pick(MEMBERS.filter(x => x.id !== m.id));
        const src = photoSpec(Object.assign({}, s1.photo, { id: undefined }));
        src.id = 'PH' + pad(photoSeq++, 6);
        if (r.id === 'PH-03') { src.dx = 7; src.seed = s1.photo.seed; }
        const srcAt = `2028-02-${pad(ri(10, 27), 2)} ${t2(ri(8, 16), ri(0, 59))}`;
        s1.photo.time = `${srcAt}:${pad(ri(0, 59), 2)}`; src.time = s1.photo.time;
        c.photos2 = { photo: src, slip: `WS-${pad(ri(100000, 999999), 6)}`, member: other.short, at: srcAt, dist: r.id === 'PH-02' ? 2 : 9, sim: r.id === 'PH-02' ? 0.99 : 0.95 };
        c.basis = r.id === 'PH-02'
          ? [['비교 전표', `${c.photos2.slip} (${other.short})`], ['지각 해시 거리', '2'], ['기준값', `거리 ${p.v} 이하`], ['사진 속 촬영 시각', srcAt]]
          : [['비교 전표', `${c.photos2.slip} (${other.short})`], ['이미지 유사도', '0.95'], ['기준값', `${p.v} 이상`], ['차이', '구도가 조금 다른 연속 촬영']];
        c.summary = `${other.short}의 ${srcAt.slice(0, 10)} 전표에 쓰인 사진과 ${r.id === 'PH-02' ? '같은' : '거의 같은'} 사진이 이번 전표의 1차 계량 사진으로 쓰였습니다.`;
        break;
      }
      case 'PH-04': {
        const off = ri(70, 260);
        c.basis = [['계량 시각', s1.at.slice(11)], ['사진 촬영 시각', `${off}분 차이`], ['기준값', `${p.v}분 이내`], ['판정', '촬영 시각 불일치']];
        const [hh, mm] = s1.at.slice(11).split(':').map(Number); const tt = hh * 60 + mm - off;
        s1.photo.time = `${BIZ} ${t2(Math.floor(tt / 60), (tt % 60 + 60) % 60)}:${pad(ri(0, 59), 2)}`;
        c.summary = `1차 계량 사진의 촬영 시각이 계량 시각보다 ${off}분 앞섭니다.`;
        break;
      }
      case 'NW-01': {
        const other = pick(MEMBERS.filter(x => x.id !== m.id));
        c.twin = { member: other.short, slip: `WS-${pad(ri(100000, 999999), 6)}`, at: s1.at, kg: c.weightKg + ri(-8, 8) };
        c.basis = [['상대 회원사', other.short], ['같은 차량', veh.no], ['시각 차이', `${ri(4, 22)}분`], ['중량 차이', `${Math.abs(c.twin.kg - c.weightKg)} kg`]];
        c.summary = `같은 차량·시각·중량의 반입이 ${m.short} 및 ${other.short}, 두 회원사의 실적에 모두 계상되었습니다.`;
        break;
      }
      case 'NW-02':
        c.mf.partner = PARTNERS[6].name; c.mf.partnerBiz = PARTNERS[6].bizNo;
        c.basis = [['감시 대상', `${PARTNERS[6].name} (반입처)`], ['등록일', '2028-02-27'], ['소급 범위', '2023-02 ~ 현재 · 전 회원사'], ['이 회원사 소급 거래', `${ri(3, 9)}건`]];
        c.summary = `감시 목록에 등록된 반입처 ${PARTNERS[6].name}와의 거래입니다. 등록 전 5년의 거래가 함께 소급 판정되었습니다.`;
        break;
      case 'WT-05':
        c.basis = [['같은 차량 반복 계량', '3회 / 2일'], ['순중량', `${c.weightKg} · ${c.weightKg + 12} · ${c.weightKg - 9} kg`], ['기준값', `중량 차이 ${p.v} kg 이내`], ['판정', '재계근 후보']];
        c.summary = '같은 차량이 이틀 동안 거의 같은 순중량으로 세 번 계량되었습니다. 같은 적재물을 반복 계량했을 가능성이 있습니다.';
        break;
      default: {
        const actual = typeof p.v === 'number' ? +(p.v * (p.sens >= 0 ? 0.6 : 1.6)).toFixed(p.step < 1 ? 2 : 0) : p.v;
        c.basis = [['규칙', r.name], ['실제값', `${actual}${p.unit}`], ['기준값', `${p.label} ${p.v}${p.unit}`], ['판정', '기준 이탈']];
        c.summary = r.desc + '.';
      }
    }
  }

  // 대표 케이스(위험 순 상단)
  const FEATURE = [
    ['WT-04', 'M01'], ['PH-02', 'M14'], ['NW-01', 'M04'], ['WT-01', 'M07'], ['PH-01', 'M01'], ['WT-02', 'M16'],
    ['NW-02', 'M10'], ['IN-02', 'M11'], ['WT-03', 'M14'], ['PH-03', 'M04'], ['WT-05', 'M07'], ['PH-04', 'M02'], ['PH-01', 'M07'], ['PH-01', 'M11'], ['PH-01', 'M03'], ['PH-02', 'M15']
  ];
  FEATURE.forEach(([r, mm], i) => { const c = mkCase(r, mm); c.risk = 97 - i * 2 - ri(0, 1); });
  const pool = RULES.filter(r => r.status !== '중지');
  for (let i = 0; i < 34; i++) {
    const cand = pool.filter(x => R() < x.base / 14 + 0.15); const r = cand.length ? pick(cand) : pick(pool);
    const mm = pick(MEMBERS.filter(x => R() < x.risk / 100 + 0.2)) || MEMBERS[0];
    const c = mkCase(r.id, mm.id);
    c.risk = Math.min(c.risk, 82);
  }
  CASES.sort((a, b) => b.risk - a.risk);
  // 일부는 이미 검토 중
  CASES.slice(3, 6).forEach(c => { c.status = '검토 중'; });

  /* ---------- 판정 결과 분류 · 사유 코드 ---------- */
  const RESULTS = ['정상', '차감방지', '사전차감', '배분 조정', '공단 협의 방지', '공단 최종 차감'];
  const REASONS = [
    ['A01', '계량 근거 부족'], ['A02', '이동 불가능 시각'], ['A03', '사진 증빙 부적정'], ['A04', '비대상 품목 실적화'],
    ['A05', '이중 계상'], ['A06', '감시 대상 거래'], ['A07', '허가 범위 위반'], ['N01', '정상 소명 확인'], ['N02', '데이터 입력 오류 정정']
  ];

  /* ---------- 지난 판정 이력 (성과 집계용) ---------- */
  const HISTORY = [];
  for (let i = 0; i < 220; i++) {
    const r = pick(RULES);
    const ok = R() < r.prec;
    HISTORY.push({ ruleId: r.id, month: pad(ri(1, 12), 2), member: pick(MEMBERS).id, result: ok ? pick(['차감방지', '사전차감', '배분 조정', '공단 협의 방지']) : '정상', kg: ri(300, 9000) });
  }

  /* ---------- 공단 최종 결과(가상) ---------- */
  const AGENCY = [];
  const CAUSES = ['데이터 미제공', '규칙 부재', '기준값', '판정 오류'];
  for (let i = 0; i < 26; i++) {
    const m = pick(MEMBERS);
    const hit = i % 5 !== 3 && i % 7 !== 6;
    const r = pick(RULES.filter(x => x.level === 'L2'));
    AGENCY.push({
      id: `K-27-${pad(i + 1, 3)}`, member: m.id, type: pick(['비대상품 실적화', '무허가 실적', '중량 과다 계상', '이중 계상', '공차 미계량', '허위 사진 증빙']),
      kg: ri(1200, 38000), month: `2027-${pad(ri(2, 11), 2)}`, detected: hit, rule: hit ? r.id : null,
      detectedAt: hit ? `2027-${pad(ri(1, 10), 2)}-${pad(ri(1, 28), 2)}` : null, cause: hit ? null : (i % 2 ? '' : pick(CAUSES))
    });
  }

  /* ---------- 백테스트 (가상) ---------- */
  const BACKTEST = {
    years: [
      { y: 2022, total: 31, hit: 26, restored: 19, indep: 0.81, miss: { '데이터 미제공': 3, '규칙 부재': 1, '기준값': 1, '판정 오류': 0 } },
      { y: 2023, total: 38, hit: 33, restored: 29, indep: 0.84, miss: { '데이터 미제공': 2, '규칙 부재': 2, '기준값': 1, '판정 오류': 0 } },
      { y: 2024, total: 35, hit: 31, restored: 30, indep: 0.86, miss: { '데이터 미제공': 1, '규칙 부재': 2, '기준값': 1, '판정 오류': 0 } },
      { y: 2025, total: 42, hit: 38, restored: 39, indep: 0.88, miss: { '데이터 미제공': 1, '규칙 부재': 1, '기준값': 2, '판정 오류': 0 } }
    ],
    must: [
      ['C1', 2022, '비대상품(고철) 실적화', 'IN-02', '2022-05', 18400],
      ['C2', 2022, '공차 미계량 확정 반복', 'WT-01', '2022-08', 6200],
      ['C3', 2023, '회원사 간 이중 계상', 'NW-01', '2023-04', 12900],
      ['C4', 2023, '이동시간 불가능 계량', 'WT-04', '2023-07', 4300],
      ['C5', 2023, '무허가 반입처 실적', 'IN-03', '2023-10', 22100],
      ['C6', 2024, '계량 사진 재사용', 'PH-02', '2024-03', 3800],
      ['C7', 2024, '감시 대상 거래처 거래', 'NW-02', '2024-06', 9700],
      ['C8', 2025, '확정 후 중량 수정', 'WT-02', '2025-02', 5600],
      ['C9', 2025, '허가 범위 밖 실적', 'NW-09', '2025-09', 15300]
    ],
    // 사례별 당시 상태 복원 여부 (원천 작성·수정 시각, 변경 전 값, 당시 기준정보 확인)
    restore: { C1: '현재 보존본', C2: '당시 복원', C3: '당시 복원', C4: '당시 복원', C5: '현재 보존본', C6: '당시 복원', C7: '당시 복원', C8: '당시 복원', C9: '당시 복원' }
  };

  /* ---------- 신규 케이스 카드 (L3 제안 15건) ---------- */
  const NEW_CASES = [
    ['N01', '야간 연속 계량 후 주간 실적 집중', '야간 계량이 몰린 다음 날 실적이 급증하는 회원사', 'weigh_slip · member_day', 5, 0.71],
    ['N02', '동일 차량 외형의 번호판 변경', '사진 속 차량 외형은 같은데 번호판만 바뀌는 패턴', 'slip_photo · 차량 특징값', 3, 0.67],
    ['N03', '거래처 휴·폐업 직전 대량 반입', '폐업 30일 전 반입량이 평소의 3배 이상', 'trade_edge · biz_status', 4, 0.78],
    ['N04', '계량 시각 정각·30분 편중', '계량 시각이 정각·30분에 몰리는 수기 입력 의심', 'weigh_slip', 6, 0.52],
    ['N05', '같은 계산서 번호 체계 반복', '공급자 다른 계산서의 번호 끝자리 규칙이 같음', 'invoice', 2, 0.6],
    ['N06', '공차중량 계절성 부재', '공차중량이 계절·연료와 무관하게 고정값', 'weigh_round', 5, 0.55],
    ['N07', '회원사 전환 직후 거래처 이동', '거래처가 다른 회원사로 옮긴 직후 양쪽 실적 동시 증가', 'trade_edge', 3, 0.74],
    ['N08', '품목 구성비 급변', '대형/중소형 구성비가 한 달 새 크게 바뀜', 'member_month_stat', 7, 0.5],
    ['N09', '최대적재량 근접 반복', '순중량이 매번 최대적재량의 98~100%', 'weigh_slip · vehicle', 4, 0.63],
    ['N10', '사진 해상도·기기 급변', '같은 계량대 사진의 기기 정보가 갑자기 바뀜', 'slip_photo 메타', 2, 0.58],
    ['N11', '관리표 정정 후 계산서 재발행', '관리표 정정과 같은 날 계산서 수정 발행', 'manifest · invoice', 3, 0.69],
    ['N12', '권역 밖 장거리 반입 증가', '평소 권역 밖 반입처 비중의 급증', 'trade_edge · route', 4, 0.62],
    ['N13', '월초 공차 미계량 집중', '월초 3일 공차 미계량 확정 비율 급증', 'weigh_round', 3, 0.66],
    ['N14', '같은 사업장 복수 회원 계량대 공유', '다른 회원사 전표에 같은 계량대 식별값', 'weigh_slip · gate', 2, 0.8],
    ['N15', '소량 분할 반입', '한 거래처 반입을 소량으로 쪼개 반복 계량', 'weigh_slip · trade_edge', 5, 0.57]
  ].map(([id, name, hyp, data, cnt, prec]) => ({ id, name, hyp, data, level: 'L3', status: '후보', bt: { cnt22_25: cnt * ri(6, 14), hitAgency: ri(0, 3), prec } }));

  /* ---------- 모델 ---------- */
  const MODELS = [
    { id: 'anom', name: '다변량 이상점수', type: '비지도 이상탐지', current: 'v1.2', versions: [
      { v: 'v1.2', at: '2027-12-06', data: '2022-01 ~ 2027-10', m1: 0.81, m2: 0.64, note: '판정 이력 반영 보정', state: '운영' },
      { v: 'v1.1', at: '2027-09-20', data: '2022-01 ~ 2027-07', m1: 0.77, m2: 0.59, note: '2단계 특성 추가', state: '보관' },
      { v: 'v1.0', at: '2027-05-24', data: '2022-01 ~ 2027-03', m1: 0.72, m2: 0.55, note: '최초', state: '보관' }],
      metrics: ['상위 100건 정탐률', '공단 차감 회원사 상위 20% 포함률'],
      features: [['대당 중량 동종 이탈', 0.31], ['외부계량 비율', 0.22], ['확정 후 수정률', 0.17], ['신규 거래처 비중', 0.12], ['월말 실적 비중', 0.08]] },
    { id: 'plate', name: '번호판 인식', type: '검출 + 문자 인식', current: 'v2.1', versions: [
      { v: 'v2.1', at: '2027-10-14', data: '계량 사진 41,200장 (약한 라벨 38,900 + 사람 확인 2,300)', m1: 0.962, m2: 0.031, note: '야간·역광 보강', state: '운영' },
      { v: 'v2.0', at: '2027-08-02', data: '계량 사진 28,400장', m1: 0.948, m2: 0.044, note: '귀 조합 사진 미세조정', state: '보관' },
      { v: 'v1.0', at: '2027-05-10', data: '공개 데이터 사전학습', m1: 0.884, m2: 0.07, note: '최초', state: '보관' }],
      metrics: ['정확도(표본 1,000장 · 문자열 완전 일치)', '판독 불가 비율'] },
    { id: 'photo', name: '사진 재사용 판별', type: '지각 해시 + 이미지 특징값', current: 'v1.1', versions: [
      { v: 'v1.1', at: '2027-09-30', data: '시험 묶음 3,000쌍', m1: 0.93, m2: 0.88, note: 'PoC 목표 합의 반영', state: '운영' },
      { v: 'v1.0', at: '2027-05-17', data: '시험 묶음 1,200쌍', m1: 0.9, m2: 0.81, note: '최초', state: '보관' }],
      metrics: ['후보 정밀도', '거의 같은 사진 재현율'] }
  ];

  /* ---------- 수집 파이프라인 · 수신 품질 ---------- */
  const PIPE = [
    ['수집', '통합 API 증분 수집', '02:00', '02:38'], ['품질 점검', '건수·누락·지연·스키마', '02:38', '02:44'], ['스냅샷', '수신 배치 B-2803140200 적재', '02:44', '03:02'],
    ['정제', '차량번호·사업자번호·품목·단위', '03:02', '03:21'], ['관계', '라인–계량 1:N · 라인–계산서 N:M', '03:21', '03:40'], ['사진 AI', '해시·특징값·번호판 인식 6,412장', '03:40', '05:02'],
    ['규칙 판정', `운영 규칙 ${RULES.filter(r => r.status === '운영').length}개`, '05:02', '06:03'], ['통계·모델', '동종 분포·이상점수', '06:03', '06:24'], ['위험 점수', '라인·거래처·차량·회원사', '06:24', '06:41']
  ];
  const FINISH14 = ['06:38', '06:44', '06:29', '06:51', '06:40', '06:35', '06:47', '06:33', '06:58', '06:42', '06:31', '06:46', '06:39', '06:41'];
  const SOURCES = [
    { id: 'mf', name: '관리표(입고·출고)', cnt: 18420, prev: 17880, miss: 0.2, delay: 0, schema: null },
    { id: 'ws', name: '계량 전표(전 차수)', cnt: 31260, prev: 30110, miss: 0.1, delay: 0, schema: '필드 추가: scale_mode (자동/수기 구분)' },
    { id: 'ph', name: '계량 사진', cnt: 6412, prev: 6305, miss: 1.8, delay: 0, schema: null },
    { id: 'mt', name: '매칭', cnt: 15120, prev: 14980, miss: 0.0, delay: 0, schema: null },
    { id: 'iv', name: '세금계산서', cnt: 4210, prev: 6120, miss: 0.4, delay: 47, schema: null },
    { id: 'rf', name: '기준정보', cnt: 312, prev: 298, miss: 0.0, delay: 0, schema: null }
  ];

  /* ---------- 감시 목록 ---------- */
  const WATCH = [
    { id: 'W-001', type: '반입처', value: PARTNERS[6].name, key: PARTNERS[6].bizNo, reason: '2027 공단 조사 허위 반입 확인', at: '2028-02-27', by: '김도윤', hits: 14, members: 4 },
    { id: 'W-002', type: '차량', value: VEHICLES[22].no, key: VEHICLES[22].no, reason: '번호판 교체 의심', at: '2028-01-15', by: '정예준', hits: 6, members: 2 },
    { id: 'W-003', type: '공급처', value: PARTNERS[5].name, key: PARTNERS[5].bizNo, reason: '폐업 후 계산서 발행', at: '2027-11-03', by: '오지안', hits: 3, members: 1 }
  ];

  /* ---------- 사용자 ---------- */
  const USERS = [
    { id: 'inspector', name: '김도윤', role: '점검 담당자', regions: ['CAP'], pw: 'demo2028', desc: '수도권 권역 · 검토 대기열·판정' },
    { id: 'admin', name: '이서준', role: '관리자', regions: ['CAP', 'GW', 'CC', 'HN', 'YN'], pw: 'demo2028', desc: '전체 권역 · 규칙 승인·기준정보·시스템' },
    { id: 'analyst', name: '박하은', role: '분석가', regions: ['CAP', 'GW', 'CC', 'HN', 'YN'], pw: 'demo2028', desc: '읽기 전용 분석 · 규칙 초안·모델 재학습 요청' }
  ];

  window.DATA = {
    TODAY, BIZ, REGIONS, MEMBERS, memberById, PARTNERS, ITEMS, VEHICLES, CATS, RULES, ruleById, CASES,
    RESULTS, REASONS, HISTORY, AGENCY, CAUSES, BACKTEST, NEW_CASES, MODELS, PIPE, FINISH14, SOURCES, WATCH, USERS, driveMin, ASSIGNEES
  };
})();
