# 화장품 트래커 자동 갱신 실행 지침

대상: CBturbomax/K-Beauty-Tracker main, GitHub Pages /docs.
이 작업은 알림이 아니라 실제 데이터 수정·빌드·배포 작업이다. 사용자가 반복 배포를 승인했다. 기존 UI/색상/기본 선택은 STYLE.md를 따른다. 매 실행 최신 main을 가져오고 다른 변경을 덮어쓰지 않는다. 연결된 InvestingWiki·GitHub·Gmail 도구를 사용한다. 임시 원문이나 인증정보를 저장소에 올리지 않는다.

## 1. 수출입
- 상세 API 지연이나 TRASS 정회원 제한을 데이터 미발표로 해석하지 않는다. 삼성증권 정동희 「화장품 수출 데이터북」 공개 원문과 교보증권 권우정 공개 채널 https://telegram.me/s/kyobofnbcosmetic 을 대체 출처로 확인한다. 로그인·유료 제한은 우회하지 않는다.
- 사용자는 별도 월간 요약표·발표 카드를 원하지 않는다. 기존 권역별 수출부터 이어지는 차트·표·CSV의 시계열에 새 월을 연결하는 것이 업데이트다. 별도 요약 패널을 만들거나 복구하지 않는다.
- 공개 검색으로 원문이 안 나오면 연결된 Gmail에서 정동희, Cosmetics Trade Databook, 화장품 수출 데이터북을 검색하고 수신 PDF 첨부를 read_attachment로 확인한다. 2026-10-01 삼성 9월 전체월 PDF는 이 경로로 확보했다. 메일을 보내지 않으며 개인 주소·메시지ID·첨부 다운로드 URL·보고서 전문은 저장소에 넣지 않는다.
- 공식 통계를 먼저 확인하고, 지연/접근 제한이면 정동희 수출 데이터북 등 공개 외부 원문을 찾는다. 기간·HS·권역 구성·단위를 기존 시계열과 검증한 뒤 해당 시계열에 반영한다. 유럽 5개국을 유럽 전체로 대체하지 않는다. 원자료 출처와 잠정치 여부를 보존한다.
- 전체 국가 확보 여부와 각 권역/품목 시계열 확보 여부를 구분한다. 검증된 권역 합계를 직접 확보하면 국가별 원장이 없어도 해당 권역 시계열을 갱신할 수 있다. 미확보 값을 0이나 추정값으로 넣지 않는다. 1~10일/1~20일/일평균을 월 전체 수치로 넣지 않는다.
- InvestingWiki trade_stats(hs='3304',months=3,breakdown='country')로 최신 발표월/수정치를 탐색한다. 상위 20국만 제공하는 응답을 전체 국가로 오인하지 않는다.
- data/trade.json의 meta.months(YYYYMM), 국가별 exp/imp/cat 및 national.cat 배열은 천 USD 단위다. API USD 값은 1000으로 나눈다. 기존 월과 겹치는 월을 대조한다.
- 새 월이 나오면 원본 전체 국가 데이터를 확보한다. API가 상위20만 반환하면 countries_available의 공식 국가코드를 사용해 누락 국가를 보완하거나 원자료의 전체 국가 다운로드를 사용한다. 국가별 숫자를 임의 배분하지 않는다. 알려진 누락 국가는 null로 보존하고 미확보를 0으로 처리하지 않는다.
- 카테고리: 기초=3304991000, 색조=330410+330420+3304992000, 기타=3304 전체-기초-색조. 국가별 skin도 기초 코드로 조회한다. 국가는 기존 code와 매칭, 새 국가는 region/g2 매핑을 검토해 추가한다.
- 새 월은 시계열별 완결성/합계/단위를 검증해 확보된 권역·전국·품목을 공개한다. 전체 국가 미확보로 검증된 권역 갱신까지 막지 않는다. 미확보 계열은 null로 보존하고 update-status에 partial과 누락 범위를 명시한다. 전월 수정치도 검토한다. 새 발표 없으면 no_change.

- 직접 집계는 national.exp, regional.exp, grouped.exp의 공통 월 정렬 배열에 저장한다. data/trade-samsung-202609.json은 2024-10~2026-09 삼성 보고서의 검증된 숫자와 정밀도·주의사항이며, scripts/import-samsung-monthly.py는 그 특정 보고서의 재현용이다. 새 보고서를 덮어쓰기 입력하지 않는다. 공식 전체 국가 원장이 나오면 과거 수정치와 정의를 대조해 갱신한다.
- 출처 변경 구간을 잇는 권역 YoY를 계산하지 않는다. 2024-10부터 삼성 권역: 중화권=CN/HK/TW, 아시아=삼성 Asia−중화권(중동 제외), 아프리카=아프리카·기타. 이전 자체 분류와 동일하다고 간주하지 않는다. 반올림 오차를 맞추려고 국가에 잔차를 배분하지 않는다. 국가·수입 순위는 실제 완결 분기로 표시한다.

## 2. ODM
- kr_financials(company='코스맥스,한국콜마,코스메카코리아',mode='quarterly',periods=4,basis='OFS'). 연결(CFS)로 대체하지 않는다.
- data/financials.json q와 companies의 매출액/영업이익 배열에 분기별 병합. 원÷100000000=억원. 실제 보고기간을 검증하고 누적치/연간을 단독 분기로 넣지 않는다. 결산기간 경고는 원공시를 읽어 해결한다.
- 정정 공시도 기존 분기와 대조. 새 분기 미발표는 no_change. 확인 불가값을 추정하지 않는다. provenance에 원자료·기준·확인일 추가.

## 3. 컨콜
- data/calls.json companies 전체 대상. 미국/미국상장11사 ticker를 earnings_calls에 콤마로 묶어 조회. 마지막 성공 시각보다 14일 이전부터 조회해 전사 지연/수정본도 잡는다. 최초 실행은 30일. missing 상태의 기존 콜도 재확인한다. Document/Proxy filing은 콜에서 제외. Earnings Call, Conference, Investor Day 등 실제 경영진 발언 포함.
- 유럽5사(L'Oréal/LVMH/Beiersdorf/Puig/Douglas)는 공식 IR 및 합법적으로 공개된 전사본을 별도 검색. 연결서비스 미수록을 신규없음으로 간주하지 않는다. 차단/유료 자료를 우회하지 않는다. 확보 발췌만 있으면 excerpt로 명시.
- callId 또는 회사+행사+날짜로 중복 방지. 콜 전문을 임시 디렉터리에 페이지 누락 없이 확보. 내용 hash가 같으면 재집계 불필요.
- K뷰티뿐 아니라 한국 브랜드·화장품 시장·생산·조달·면세·경쟁·관련 질문을 포함. 일반 매장출점/회원 수/환율 제외. 모든 후보 구간을 맥락 검토해 call-relevance-review.json에 include/reason/lineSha256 추가. scripts/count-call-mentions.py의 후보 규칙 사용. 새 구간 검토 누락은 중단.
- 포함 구간은 call-evidence-copy.json에 정확한 짧은 영어 발췌 en, 전체 발췌 한글번역 ko, 앞뒤 의미를 담은 한국어 context 요약을 작성. 요약을 직접인용으로 표시하지 않는다. 출처당 영어 직접인용 총25단어 이내. 출처 URL/화자/타임스탬프 또는 행번호를 남긴다. 숫자=실제 표현 반복 횟수, 모든 횟수는 화면 근거에 연결.
- scripts/count-call-mentions.py <임시원문폴더> --incremental: metadata.json의 eligible/europe에는 이번에 확보한 문서만 넣는다. 기존 frequency 문서를 보존하며 id로 병합. 원문없는 missing이 기존 complete/excerpt를 덮어쓰지 않게 한다.
- scripts/build-call-evidence.py <임시원문폴더> --incremental: 새·변경 원문만 읽고 기존 원문 hash가 동일한 근거는 보존한다. 검증된 0회 문서도 frequency에는 기록하되 evidence에는 넣지 않는다. review/copy도 구간 id로 병합하고 수정본에서 사라진 구간은 정리한다.
- frequency.updated/range는 실제 데이터 기준으로 갱신. counts와 evidence 합계 일치 검증. UI는 분기를 자동 확장한다.

## 4. 실행 상태와 배포
- data/update-status.json에 각 영역 checkedAt(ISO timezone), status(no_change/updated/partial/error), latest, message를 기록. 검사 실패를 성공으로 표기하지 않는다. checkedAt=조회 완료 시각이며 데이터 발표일과 다르다. 한 영역 실패해도 다른 영역의 검증된 변경을 진행한다.
- python scripts/validate-update.py && npm ci && npm run build. data 변경과 docs 빌드 결과 및 상태 파일을 함께 커밋. 비밀·전문·node_modules 제외.
- GitHub create_tree(base_tree_sha=최신main tree), create_commit(parent=최신main), update_ref(force=false)로 배포 가능. 푸시 직전 main 변경시 최신본에 재적용한다. Pages Actions 성공 확인 뒤에만 배포 완료 보고.
- 매 실행 실제 검사 상태를 사이트에 남긴다. stale 36시간 경고는 프런트에서 자동 표시된다. 원문 수집/검증/배포 실패시 이 채팅에 원인과 실패 영역을 보고한다. 변경이 있으면 추가 월/콜/분기 및 사이트 링크를 짧게 알리고, 변경없으면 간단히 기록한다.
