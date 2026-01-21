# gorunning.kr 날짜 파싱 이슈 리포트

## 1. 개요

| 항목 | 내용 |
|------|------|
| **발견일** | 2026-01-21 |
| **심각도** | Medium |
| **상태** | Open |
| **영향 범위** | gorunning.kr 스크래퍼 (142개 이벤트 중 일부) |
| **관련 파일** | `scripts/scrapers/sources/gorunning.ts` |

## 2. 문제 설명

### 2.1. 현상

gorunning.kr에서 수집된 일부 마라톤 이벤트의 날짜가 `2000-12-31`로 잘못 파싱됨.

**예시 (marathons-kr.json)**:
```json
{
  "id": "gorunning-2026-전마협-제주-4full-마라톤-1",
  "name": "2026 전마협 제주 4Full 마라톤",
  "date": "2000-12-31",  // 잘못된 날짜
  ...
}
```

### 2.2. 영향받는 데이터

- 2026 전마협 제주 4Full 마라톤
- 2026 똥바람 알통구보대회
- 2026 전마협 제주 10km 마라톤
- 제2회 한강 서울 하프 마라톤
- 기타 다수

## 3. 원인 분석

### 3.1. 추정 원인

1. **DOM 구조 불일치**: gorunning.kr의 실제 테이블/카드 구조가 스크래퍼의 예상 구조와 다름
2. **날짜 셀 위치**: 테이블에서 날짜가 예상 위치(첫 번째 열)가 아닌 다른 위치에 있을 수 있음
3. **빈 문자열 반환**: `cells[0]?.textContent?.trim()`이 빈 문자열을 반환

### 3.2. 현재 스크래핑 로직

```typescript
// scripts/scrapers/sources/gorunning.ts:111-127
const tableRows = document.querySelectorAll('table tbody tr');
if (tableRows.length > 0) {
  tableRows.forEach((row) => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 4) {
      results.push({
        date: cells[0]?.textContent?.trim() || '',     // 첫 번째 열 = 날짜 (가정)
        name: cells[1]?.textContent?.trim() || '',     // 두 번째 열 = 이름
        organizer: cells[2]?.textContent?.trim() || '', // 세 번째 열 = 주최
        location: cells[3]?.textContent?.trim() || '', // 네 번째 열 = 장소
        ...
      });
    }
  });
}
```

### 3.3. 날짜 파싱 흐름

```
빈 문자열 ""
  → parseDate() 호출
  → 모든 패턴 매칭 실패
  → new Date("") 실행
  → Invalid Date 반환
  → 결과: "2000-12-31" (JavaScript Date 기본값 문제)
```

## 4. 추가 발견 사항

### 4.1. organizer 필드 오류

`organizer` 필드에 거리 정보가 잘못 저장됨:

```json
{
  "name": "2026 똥바람 알통구보대회",
  "organizer": "6.32km",  // 잘못된 값 (실제로는 주최자 정보여야 함)
  ...
}
```

이는 테이블 열 순서가 예상과 다르다는 것을 의미함.

## 5. 해결 방안

### 5.1. 단기 해결책

1. gorunning.kr 페이지의 실제 DOM 구조 분석
2. 개발자 도구로 테이블/카드 구조 확인
3. 셀렉터 및 열 인덱스 수정

### 5.2. 장기 해결책

1. **구조 자동 감지**: 열 헤더를 읽어 동적으로 열 매핑
2. **다중 패턴 지원**: 여러 페이지 레이아웃 대응
3. **검증 강화**: 파싱 결과 검증 후 경고 로깅

### 5.3. 구현 예시

```typescript
// 개선된 추출 로직 (예시)
private async extractRaces(page: Page): Promise<GoRunningRaceRow[]> {
  // 1. 실제 DOM 구조 확인 후 적절한 셀렉터 사용
  const races = await page.evaluate(() => {
    const results: GoRunningRaceRow[] = [];

    // 실제 gorunning.kr 구조에 맞게 수정 필요
    const rows = document.querySelectorAll('.race-list-item'); // 예시

    rows.forEach((row) => {
      const date = row.querySelector('.race-date')?.textContent?.trim();
      const name = row.querySelector('.race-title')?.textContent?.trim();
      // ...
    });

    return results;
  });

  return races;
}
```

## 6. 테스트 계획

1. gorunning.kr 페이지 구조 스크린샷 캡처
2. 올바른 셀렉터로 수정
3. 스크래퍼 재실행 후 날짜 검증
4. 유효하지 않은 날짜(2000-12-31) 카운트 확인

## 7. 참고 사항

- 현재 시스템은 동작하며, AIMS 데이터(371개)는 정상 파싱됨
- 프론트엔드는 정적 데이터 fallback이 있어 서비스 영향 없음
- GitHub Actions 워크플로우는 정상 작동

---

**작성자**: Claude
**최종 수정**: 2026-01-21
