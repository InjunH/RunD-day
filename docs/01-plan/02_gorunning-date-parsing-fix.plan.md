# gorunning.kr 날짜 파싱 버그 수정 Plan

> **Summary**: gorunning.kr 스크래퍼의 테이블 열 매핑 오류로 인한 날짜 파싱 실패 수정
>
> **Project**: RunD-day
> **Version**: 0.0.1
> **Author**: InjunH + Claude
> **Date**: 2026-01-21
> **Status**: Draft
> **Type**: Bug Fix

---

## 1. Overview

### 1.1 Problem Statement

gorunning.kr에서 수집된 마라톤 이벤트의 날짜가 `2000-12-31`로 잘못 파싱되는 버그 발생.

### 1.2 Root Cause Analysis

| 분석 항목 | 결과 |
|-----------|------|
| **발견 방법** | marathons-kr.json 데이터 검증 |
| **영향 범위** | gorunning 소스 142개 이벤트 중 다수 |
| **원인** | 테이블 열 구조 가정 오류 |

### 1.3 Actual vs Expected Table Structure

**실제 gorunning.kr 테이블 구조**:

| Index | Header | Sample Value |
|-------|--------|--------------|
| 0 | (순번) | `"1"` |
| 1 | 대회명 | `"2026 전마협 제주 4Full 마라톤"` |
| 2 | 종목 | `"풀"` |
| 3 | 지역 | `"제주"` |
| 4 | 장소 | `"제주종합경기장"` |
| 5 | 주최 | `"전국마라톤협회"` |
| 6 | 등록상태 | `"등록마감"` |

**스크래퍼가 가정한 구조**:

| Index | Expected | Actual |
|-------|----------|--------|
| 0 | 날짜 | 순번 ❌ |
| 1 | 이름 | 대회명 ✓ |
| 2 | 주최 | 종목 ❌ |
| 3 | 장소 | 지역 ❌ |
| 4 | 상태 | 장소 ❌ |

**핵심 발견**: **테이블에 날짜 열이 존재하지 않음!**

### 1.4 Related Documents

- [Issue Report](../03-issues/01_gorunning-date-parsing.issue.md)
- [Data Automation Plan](./01_data-automation.plan.md)

---

## 2. Scope

### 2.1 In Scope

- [x] gorunning.kr 실제 DOM 구조 분석
- [ ] `extractRaces()` 함수 열 매핑 수정
- [ ] 날짜 추출 전략 개선 (대회명에서 추출)
- [ ] 상세 페이지에서 날짜 정보 수집 (선택적)
- [ ] 스크래퍼 재실행 및 검증

### 2.2 Out of Scope

- 다른 스크래퍼(AIMS, marathongo) 수정
- 프론트엔드 변경
- 새로운 데이터 소스 추가

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 테이블 열 매핑을 실제 구조에 맞게 수정 | High | Pending |
| FR-02 | 날짜가 없는 경우 대회명에서 추출 | High | Pending |
| FR-03 | organizer 필드에 올바른 값 저장 | Medium | Pending |
| FR-04 | 유효하지 않은 날짜(2000-12-31) 0개 달성 | High | Pending |

### 3.2 Technical Requirements

| ID | Requirement | Details |
|----|-------------|---------|
| TR-01 | 열 인덱스 재매핑 | 0→순번, 1→name, 2→distances, 3→region, 4→location, 5→organizer, 6→status |
| TR-02 | 날짜 추출 로직 | 대회명 또는 상세 페이지에서 추출 |
| TR-03 | Fallback 전략 | 날짜 추출 실패 시 현재 연도 말 대신 적절한 기본값 |

---

## 4. Solution Design

### 4.1 Approach Options

| Option | Description | Pros | Cons | Selected |
|--------|-------------|------|------|:--------:|
| A | 열 매핑만 수정 | 빠름, 간단 | 날짜 정보 없음 | ☐ |
| B | 대회명에서 날짜 추출 강화 | 중간 복잡도 | 일부 누락 가능 | ☑ |
| C | 상세 페이지 크롤링 | 정확한 날짜 | 느림, 복잡 | ☐ |

> **선택**: Option B - 대회명에서 날짜 추출 + 열 매핑 수정

### 4.2 Implementation Plan

```typescript
// 수정된 열 매핑
{
  index: cells[0]?.textContent?.trim() || '',      // 순번 (무시)
  name: cells[1]?.textContent?.trim() || '',       // 대회명
  distance: cells[2]?.textContent?.trim() || '',   // 종목 (풀, 하프 등)
  region: cells[3]?.textContent?.trim() || '',     // 지역
  location: cells[4]?.textContent?.trim() || '',   // 장소
  organizer: cells[5]?.textContent?.trim() || '',  // 주최
  status: cells[6]?.textContent?.trim() || '',     // 등록상태
  link: cells[1]?.querySelector('a')?.href || '',  // 상세 링크
}
```

### 4.3 Date Extraction Strategy

1. 대회명에서 날짜 패턴 추출: `"1월31일"`, `"01.31"`, `"2026.01.31"`
2. 상세 페이지 링크에서 날짜 정보 추출 (URL 파라미터)
3. 실패 시 연도만 추출하여 `{year}-01-01` 형태로 저장

---

## 5. Success Criteria

### 5.1 Definition of Done

- [ ] 열 매핑이 실제 gorunning.kr 구조와 일치
- [ ] `2000-12-31` 날짜를 가진 이벤트 0개
- [ ] `organizer` 필드에 실제 주최자 정보 저장
- [ ] 기존 정상 데이터 손상 없음

### 5.2 Validation Method

```bash
# 잘못된 날짜 카운트 확인
cat public/data/marathons-kr.json | jq '[.[] | select(.date == "2000-12-31")] | length'
# Expected: 0

# organizer 필드에 거리 정보가 있는지 확인
cat public/data/marathons-kr.json | jq '[.[] | select(.organizer | test("km$"))] | length'
# Expected: 0
```

---

## 6. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| gorunning.kr 구조 재변경 | High | Low | 정기적 모니터링, 에러 알림 |
| 날짜 추출 정규식 누락 | Medium | Medium | 다양한 패턴 테스트 |
| 상세 페이지 접근 차단 | Medium | Low | 메인 페이지 정보만 사용 |

---

## 7. Implementation Phases

### Phase 1: 열 매핑 수정 (30분)
- [ ] `extractRaces()` 함수 열 인덱스 수정
- [ ] 불필요한 `date` 열 제거

### Phase 2: 날짜 추출 강화 (1시간)
- [ ] `extractDateFromName()` 패턴 확장
- [ ] 상세 링크에서 날짜 추출 시도

### Phase 3: 검증 (30분)
- [ ] 스크래퍼 재실행
- [ ] 결과 데이터 검증
- [ ] 이슈 리포트 업데이트

---

## 8. Next Steps

1. [x] Plan 문서 작성 완료
2. [ ] Design 문서 작성 (`/pdca-design gorunning-date-parsing-fix`)
3. [ ] 구현 및 테스트
4. [ ] Check phase: 결과 검증

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-01-21 | Initial draft | InjunH + Claude |
