# RunD-day: gorunning.kr 날짜 파싱 버그 수정

**날짜**: 2026-01-21
**프로젝트**: RunD-day
**커밋**: bb18a49

## 문제
- gorunning.kr 스크래핑 시 날짜가 `2000-12-31`로 잘못 파싱됨
- `organizer` 필드에 거리 정보(`"6.32km"`)가 저장됨

## 원인
- 스크래퍼가 테이블 열 순서를 잘못 가정
- **실제 구조**: `[순번, 대회명, 종목, 지역, 장소, 주최, 등록상태]`
- **기존 가정**: `[날짜, 이름, 주최, 장소, 상태]`
- 테이블에 날짜 열이 없음

## 해결
1. `extractRaces()` 함수 열 인덱스 수정
2. `GoRunningRaceRow` 인터페이스 수정: `date` 제거, `distance`/`region` 추가
3. 대회명에서 날짜 추출 (`extractDateFromName()`)

## 결과
- `2000-12-31` 날짜: **0개** (수정 완료)
- `organizer` 필드: 정상화 (실제 주최자 정보 저장)
- gorunning 이벤트: 142개 정상 수집

## 한계
- 대회명에 날짜 없는 경우 `2026-12-31` 기본값 사용 (137개)
- 정확한 날짜를 위해서는 상세 페이지 크롤링 필요

## 관련 파일
- `scripts/scrapers/sources/gorunning.ts`
- `docs/01-plan/02_gorunning-date-parsing-fix.plan.md`
- `docs/03-issues/01_gorunning-date-parsing.issue.md`
