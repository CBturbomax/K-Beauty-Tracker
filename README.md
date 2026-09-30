# 화장품 산업 트래커

https://cbturbomax.github.io/K-Beauty-Tracker/

한국 화장품 HS3304 수출입, 지역 비중, 한국 상장법인 ODM 별도 손익, 글로벌 기업 컨콜의 한국 화장품 관련 언급과 원문 근거, 기존 Amazon Tracker를 제공한다.

## 자동 갱신

채팅 예약 작업은 사용자의 GitHub 내부 실행 요청에 따라 비활성화했다. GitHub Actions 기반 수집·배포로 전환할 예정이며, 현재 GitHub 실행환경용 데이터 서비스 인증이 연결되지 않아 자동 갱신은 아직 동작하지 않는다. 연결된 ChatGPT 앱 권한은 GitHub 러너에 자동 이전되지 않는다. maintenance/DAILY_UPDATE.md는 수집·검증 기준이며 스케줄러 자체가 아니다.

사이트 상단에서 각 영역의 마지막 조회 시각·최신 데이터 기간·확인 실패를 확인할 수 있다. 36시간 이상 확인이 없으면 지연 상태를 표시한다. 업데이트 빈도는 매일이며 원자료 발표와 동시에 즉시 갱신되는 실시간 서비스는 아니다. 수출입은 새 월별 자료, ODM은 별도 분기 보고서, 컨콜은 확보된 신규 전사본 및 공개 발췌를 반영한다. 자료 미발표와 수집 실패는 구분한다.

## 개발 및 배포

Node.js 22 이상. npm ci, python scripts/validate-update.py, npm run build. GitHub Pages는 main의 docs를 배포한다. 소스와 빌드 결과를 함께 커밋하고 배포 성공을 확인한다. 기본 스타일과 선택값은 STYLE.md에 있다.

## 데이터

- data/trade.json: 천 USD, 국가별 HS3304 수출입/기초 수출·전국 카테고리.
- data/financials.json: 억원, 한국 상장법인 OFS만. 연결 실적과 해외 자회사 제외.
- data/call-frequency.json: 확보 문서별 관련 표현의 실제 횟수. 자료 미확보와 언급 0회 구분.
- data/call-evidence.json: 모든 집계 횟수와 연결된 위치·출처·짧은 영어 발췌·한글 번역·맥락 요약.
- data/call-relevance-review.json: 구간별 화장품 관련성 검토 및 원문 해시.
- data/update-status.json: 실제 수집 확인 상태. 실패시 기존 검증값을 유지.

신규 원문은 저장소 밖에 두고 scripts/count-call-mentions.py와 build-call-evidence.py의 --incremental 옵션으로 기존 문서를 보존하며 병합한다. 검토되지 않은 새 구간은 집계를 중단한다. 전문·비밀키는 커밋하지 않는다.

Amazon 탭은 기존 https://cbturbomax.github.io/Amazon-Tracker/ 의 배포본을 연결하며 그 사이트의 수집 상태를 따른다.
