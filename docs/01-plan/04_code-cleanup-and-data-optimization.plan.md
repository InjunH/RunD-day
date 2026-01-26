---
template: plan
version: 1.0
description: PDCA Plan phase document - RunD-day 코드 정리 및 데이터 최적화
variables:
  - feature: code-cleanup-and-data-optimization
  - date: 2026-01-21
  - author: Claude (bkit PDCA)
---

# Code Cleanup and Data Optimization Planning Document

> **Summary**: Dead code 제거, MARATHON_DATA 100개로 업데이트, 임시 파일 정리
>
> **Author**: Claude (bkit PDCA)
> **Date**: 2026-01-21
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

RunD-day 프로젝트의 코드베이스를 정리하고 fallback 데이터 품질을 향상시켜 유지보수성과 사용자 경험을 개선합니다.

### 1.2 Background

**현재 상황**:
- `useMarathonsWithFallback` 함수가 어디서도 사용되지 않는 dead code로 존재
- MARATHON_DATA가 34개 구식 이벤트로 JSON(499개) 대비 품질이 현저히 낮음
- 임시 conversation 파일이 .gitignore 없이 버전 관리 대상에 포함

**해결 필요성**:
- Dead code는 코드베이스 복잡도를 증가시키고 유지보수 비용 발생
- 낮은 품질의 fallback 데이터는 JSON 로드 실패 시 사용자 경험 저하
- 임시 파일이 Git 히스토리에 축적되어 저장소 크기 증가

### 1.3 Related Documents

- Requirements: 프로젝트 전체 분석 결과 (2026-01-21)
- References:
  - [App.tsx](../../App.tsx) - Fallback 로직
  - [hooks/useMarathons.ts](../../hooks/useMarathons.ts) - Dead code 위치
  - [constants.ts](../../constants.ts) - 업데이트 대상 데이터

---

## 2. Scope

### 2.1 In Scope

- [x] `useMarathonsWithFallback` 함수 제거 (hooks/useMarathons.ts)
- [x] MARATHON_DATA를 34개 → 100개로 업데이트 (constants.ts)
- [x] conversation-*.txt 파일 삭제 및 .gitignore 패턴 추가
- [x] 코드 주석 개선 (constants.ts, App.tsx)
- [x] 빌드 및 런타임 검증

### 2.2 Out of Scope

- 자동화 스크립트 작성 (scripts/sync-fallback-data.ts) - 향후 작업
- CI/CD 워크플로우 추가 - 향후 작업
- Service Worker 캐싱 - 장기 로드맵
- CDN 마이그레이션 - 장기 로드맵

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | useMarathonsWithFallback 함수 완전 제거 | High | Pending |
| FR-02 | MARATHON_DATA를 100개 최신 이벤트로 업데이트 | High | Pending |
| FR-03 | conversation-*.txt 파일 삭제 및 .gitignore 추가 | Medium | Pending |
| FR-04 | 기존 기능 무결성 100% 유지 | High | Pending |
| FR-05 | 코드 주석 개선 및 문서화 | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 번들 크기 증가 < 10KB | Build 산출물 확인 |
| Quality | TypeScript 컴파일 오류 0건 | `npx tsc --noEmit` |
| Quality | 빌드 성공 | `npm run build` |
| Reliability | Fallback 데이터 100% 유효성 | 수동 테스트 (JSON 차단) |
| Maintainability | Dead code 0개 | `grep -r "useMarathonsWithFallback"` |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [x] useMarathonsWithFallback 함수 완전 제거 및 grep 결과 0건
- [x] MARATHON_DATA 100개 이벤트 포함 (인기 대회, 지역/월별 균등)
- [x] conversation 파일 삭제 및 .gitignore 업데이트
- [x] TypeScript 컴파일 성공
- [x] 빌드 성공
- [x] JSON 로드 성공 시 499개 표시 확인
- [x] JSON 로드 실패 시 100개 표시 확인
- [x] 필터/검색 기능 정상 동작 확인
- [x] Git 커밋 및 푸시 완료

### 4.2 Quality Criteria

- [x] 타입 체크 오류 0건
- [x] 빌드 오류 0건
- [x] Dead code 0개
- [x] 코드 주석 업데이트 완료
- [x] 백업 태그 생성 완료

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| useMarathonsWithFallback 제거 시 빌드 실패 | Medium | Low | 타입 체크 및 grep으로 사용처 사전 확인 |
| MARATHON_DATA 업데이트 시 런타임 오류 | High | Low | 데이터 형식 검증, 백업 보관 |
| JSON 로드 실패 시 빈 화면 표시 | High | Low | MARATHON_DATA 유지 필수, 수동 테스트 |
| Git 히스토리 손실 | Low | None | 백업 태그 생성 (backup-before-cleanup-20260121) |

---

## 6. Implementation Details

### 6.1 Phase 1: Dead Code 제거 (10분)

**파일**: `hooks/useMarathons.ts`

**작업**:
- 231-253줄 삭제 (JSDoc 주석 + useMarathonsWithFallback 함수)
- 제거 전 사용처 확인: `grep -r "useMarathonsWithFallback"` (0건 필수)

**검증**:
```bash
npx tsc --noEmit
npm run build
```

### 6.2 Phase 2: MARATHON_DATA 업데이트 (30분)

**파일**: `constants.ts`

**데이터 선정 기준**:
1. 날짜: 2026-01-22 이후 이벤트만
2. 우선순위: isPopular 이벤트 전체, 서울/경기 30개, 지방 40개, 해외 20개, 특수 10개
3. 분산: 지역별/월별 균등 배치, 다양한 거리 포함

**작업**:
- JSON에서 100개 이벤트 선별 및 복사
- constants.ts의 MARATHON_DATA 배열 교체
- JSDoc 주석 업데이트

**검증**:
```bash
npx tsc --noEmit
npm run build
npm run dev  # 수동 fallback 테스트
```

### 6.3 Phase 3: 파일 정리 (5분)

**작업**:
```bash
rm conversation-2026-01-21-115412.txt
echo "conversation-*.txt" >> .gitignore
git status  # conversation 파일 없음 확인
```

### 6.4 Phase 4: 검증 및 커밋 (15분)

**검증**:
1. 빌드: `npm run build`
2. 타입 체크: `npx tsc --noEmit`
3. 수동 테스트: JSON 차단 후 fallback 확인

**커밋**:
```bash
git add hooks/useMarathons.ts constants.ts .gitignore
git commit -m "refactor: Remove dead code and optimize fallback data"
git push origin refactor/cleanup-unused-code
```

---

## 7. Verification Plan

### 7.1 수동 테스트 시나리오

1. **정상 케이스**:
   - `npm run dev` 실행
   - 브라우저 접속: http://localhost:5173
   - 499개 이벤트 표시 확인

2. **Fallback 케이스**:
   - DevTools Network 탭에서 marathons.json 차단
   - 페이지 새로고침
   - 100개 이벤트 표시 확인
   - "정적 데이터 사용 중" 메시지 확인

3. **필터 기능**:
   - 월/지역/국가 필터 정상 동작 확인
   - 검색 기능 정상 동작 확인

### 7.2 자동 검증

```bash
# Dead code 확인
grep -r "useMarathonsWithFallback" . --include="*.tsx" --include="*.ts"
# 예상 결과: 0건

# 타입 체크
npx tsc --noEmit
# 예상 결과: 오류 없음

# 빌드
npm run build
# 예상 결과: 성공

# 번들 크기 확인
ls -lh dist/assets/*.js
# 예상: +8KB 이내
```

---

## 8. Next Steps

1. [x] Plan 문서 검토 및 승인
2. [ ] Feature 브랜치 생성 및 백업 태그
3. [ ] Phase 1-4 순차적 실행
4. [ ] 모든 검증 체크리스트 완료
5. [ ] PR 생성 및 코드 리뷰
6. [ ] 머지 후 프로덕션 배포

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-01-21 | Initial draft | Claude (bkit PDCA) |
