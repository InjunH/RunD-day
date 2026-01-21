# 마라톤 데이터 자동화 Planning Document

> **Summary**: 하드코딩된 마라톤 데이터를 여러 소스에서 자동으로 수집하여 매일 업데이트
>
> **Project**: RunD-day
> **Version**: 0.0.0
> **Author**: InjunH + Claude
> **Date**: 2026-01-20
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

현재 하드코딩된 34개 마라톤 데이터를 국내/해외 여러 소스에서 자동으로 수집하여 매일 업데이트하는 시스템 구축

### 1.2 Background

- 현재 `constants.ts`에 34개 마라톤 이벤트가 하드코딩되어 있음
- 새로운 대회 추가 시 수동으로 코드 수정 필요
- 대회 정보 변경 시 실시간 반영 불가
- 데이터 정확성과 최신성 유지에 한계

### 1.3 Related Documents

- [gorunning.kr](https://gorunning.kr) - 국내 마라톤 정보 포털
- [AIMS Calendar](https://aims-worldrunning.org/calendar.html) - 국제 마라톤 캘린더
- [marathongo.co.kr](https://marathongo.co.kr) - 국내 마라톤 일정

---

## 2. Scope

### 2.1 In Scope

- [x] 데이터 소스 조사 및 선정
- [ ] 웹 스크래핑 스크립트 개발 (Node.js/Python)
- [ ] GitHub Actions 자동화 파이프라인 구축
- [ ] JSON 데이터 스키마 정의
- [ ] 프론트엔드 fetch 로직 구현
- [ ] 데이터 중복 제거 및 정규화 로직

### 2.2 Out of Scope

- 실시간 스크래핑 (서버 비용 문제)
- 사용자 인증 시스템
- 대회 등록/결제 기능
- 백엔드 서버 구축 (정적 JSON 파일로 대체)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 국내 마라톤 데이터 자동 수집 (gorunning.kr) | High | Pending |
| FR-02 | 해외 마라톤 데이터 수집 (AIMS ICS) | Medium | Pending |
| FR-03 | 매일 1회 자동 업데이트 (GitHub Actions) | High | Pending |
| FR-04 | 데이터 중복 제거 및 정규화 | High | Pending |
| FR-05 | JSON 파일로 데이터 저장 | High | Pending |
| FR-06 | 프론트엔드에서 JSON fetch | High | Pending |
| FR-07 | 데이터 변경 이력 관리 (Git) | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 데이터 로딩 < 500ms | Lighthouse |
| Reliability | 스크래핑 성공률 > 95% | GitHub Actions 로그 |
| Maintainability | 새 소스 추가 < 2시간 | 개발 시간 측정 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 3개 이상 데이터 소스에서 자동 수집
- [ ] GitHub Actions 일일 자동 실행
- [ ] 프론트엔드에서 JSON 데이터 정상 로딩
- [ ] 기존 UI/UX 유지
- [ ] 에러 발생 시 알림 (GitHub Actions)

### 4.2 Quality Criteria

- [ ] 데이터 무결성 검증 통과
- [ ] TypeScript 타입 안정성 유지
- [ ] 빌드 성공

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 웹사이트 구조 변경으로 스크래핑 실패 | High | Medium | 다중 소스 확보, 에러 알림 설정 |
| 스크래핑 차단 (IP 밴, robots.txt) | High | Low | 적절한 딜레이, User-Agent 설정 |
| 데이터 형식 불일치 | Medium | Medium | 정규화 레이어 구축 |
| CORS 이슈 | Medium | Low | GitHub Pages/CDN 활용 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure, static files | Static sites, portfolios | ☑ |
| **Dynamic** | Feature-based modules, services layer | Web apps with backend | ☐ |
| **Enterprise** | Strict layer separation, DI, microservices | High-traffic systems | ☐ |

> **선택 이유**: 백엔드 없이 GitHub Actions + 정적 JSON 파일로 구현 가능

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| 스크래핑 언어 | Node.js / Python | **Node.js** | 프로젝트 일관성 (TypeScript) |
| 스크래핑 도구 | Puppeteer / Playwright / Cheerio | **Playwright** | SSR 지원, 안정성 |
| 데이터 저장 | JSON / SQLite / API | **JSON** | 심플, 무료 호스팅 |
| 자동화 | GitHub Actions / Cron | **GitHub Actions** | 무료, Git 통합 |
| 데이터 호스팅 | GitHub Pages / CDN | **GitHub raw** | 별도 설정 불필요 |

### 6.3 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Actions (Daily Cron)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ gorunning.kr│  │ AIMS ICS    │  │marathongo.kr│  ...        │
│  │  Scraper    │  │  Parser     │  │  Scraper    │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          ▼                                      │
│                 ┌─────────────────┐                             │
│                 │   Normalizer    │ ← 데이터 정규화/중복제거    │
│                 └────────┬────────┘                             │
│                          ▼                                      │
│                 ┌─────────────────┐                             │
│                 │  marathons.json │ ← public/data/              │
│                 └────────┬────────┘                             │
│                          │                                      │
│                    git commit & push                            │
└──────────────────────────┼──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      RunD-day Frontend                           │
│                                                                  │
│    fetch('/data/marathons.json') → State → UI Render            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [ ] `CLAUDE.md` has coding conventions section
- [ ] `docs/01-plan/conventions.md` exists
- [x] ESLint configuration (`.eslintrc.*`) - 미확인
- [ ] Prettier configuration (`.prettierrc`) - 미확인
- [x] TypeScript configuration (`tsconfig.json`)

### 7.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Data Schema** | 없음 | MarathonEvent 타입 확장 | High |
| **Scraper 구조** | 없음 | scripts/scrapers/ 폴더 구조 | High |
| **에러 핸들링** | 없음 | 스크래퍼 에러 처리 패턴 | Medium |
| **로깅** | 없음 | 스크래핑 로그 형식 | Low |

### 7.3 Data Schema (확장)

```typescript
interface MarathonEvent {
  // 기존 필드
  id: string;
  name: string;
  date: string;
  region: string;
  locationDetail: string;
  distances: string[];
  registrationUrl: string;
  tags: string[];

  // 추가 필드
  source: 'gorunning' | 'aims' | 'marathongo' | 'manual';
  organizer?: string;        // 주최
  registrationStatus?: 'open' | 'closed' | 'upcoming';
  registrationStart?: string;
  registrationEnd?: string;
  price?: {
    distance: string;
    amount: number;
  }[];
  country: 'KR' | 'US' | 'JP' | 'EU' | string;
  lastUpdated: string;       // ISO 8601
}
```

---

## 8. Implementation Phases

### Phase 1: 기반 구축 (1-2일)
- [ ] 데이터 스키마 확정 (`types.ts` 확장)
- [ ] 스크래퍼 폴더 구조 생성
- [ ] 테스트용 JSON 파일 생성

### Phase 2: 스크래퍼 개발 (3-4일)
- [ ] gorunning.kr 스크래퍼 구현
- [ ] AIMS ICS 파서 구현
- [ ] 데이터 정규화 로직 구현

### Phase 3: 자동화 구축 (1-2일)
- [ ] GitHub Actions 워크플로우 작성
- [ ] 에러 알림 설정
- [ ] 테스트 실행

### Phase 4: 프론트엔드 통합 (1일)
- [ ] JSON fetch 로직 구현
- [ ] 로딩/에러 상태 처리
- [ ] 기존 하드코딩 데이터 제거

---

## 9. Next Steps

1. [ ] 팀 리뷰 및 승인
2. [ ] Design 문서 작성 (`01_data-automation.design.md`)
3. [ ] Phase 1 구현 시작

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-01-20 | Initial draft | InjunH + Claude |
