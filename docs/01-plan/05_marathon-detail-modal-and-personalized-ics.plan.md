# Plan: 마라톤 상세 모달 및 개인화된 ICS 생성

## 📋 Document Information

- **Feature Name**: Marathon Detail Modal & Personalized ICS Export
- **Document Type**: Plan (PDCA - Plan Phase)
- **Created**: 2026-01-21
- **Status**: Planning
- **Priority**: 🟡 MEDIUM (사용자 편의성 향상)

---

## 1. Executive Summary

RunD-day 사용자가 마라톤 대회의 **상세 정보를 손쉽게 확인**하고, **즐겨찾기한 대회만을 캘린더에 추가**할 수 있도록 개선합니다.
현재 MarathonCard는 기본 정보만 표시하며, ICS 파일은 전체 대회를 포함하고 있어 개인화가 불가능합니다.

**핵심 가치**: 정보 접근성 향상 + 개인화된 일정 관리 지원

---

## 2. Problem Statement (문제 정의)

### 2.1 현재 상황

| 항목 | 현재 상태 | 문제점 |
|------|----------|--------|
| 상세 정보 표시 | 카드에 기본 정보만 표시 | 주최자, 등록기간, 가격 등 확인 불가 |
| 대회 이미지 | 없음 | 시각적 매력도 부족 |
| ICS 생성 | 전체 대회 포함 정적 파일 | 개인화 불가, 불필요한 알림 발생 |
| 등록 페이지 연결 | 외부 링크만 제공 | 사이트 내 정보 확인 후 이동 불가 |

### 2.2 사용자 시나리오별 문제

**시나리오 1: 대회 상세 정보 확인**
- ❌ 현재: 카드 클릭 → 즉시 외부 등록 페이지로 이동
- 😟 문제: 주최자, 가격, 등록 기간 등을 확인할 수 없음
- ✅ 기대: 카드 클릭 → 모달에서 상세 정보 확인 → 필요 시 등록 페이지 이동

**시나리오 2: 즐겨찾기 대회만 캘린더 동기화**
- ❌ 현재: `/public/2026_마라톤_일정.ics` (34개 전체 대회)
- 😟 문제: 관심 없는 대회까지 알림 받음, 캘린더 혼잡
- ✅ 기대: 즐겨찾기 5개만 선택 → 개인화된 ICS 다운로드

**시나리오 3: 대회 이미지로 빠른 식별**
- ❌ 현재: 텍스트 기반 카드만 존재
- 😟 문제: 대회의 시각적 특징 파악 불가 (벚꽃, 바다, 산 등)
- ✅ 기대: 대회 대표 이미지로 분위기 파악

---

## 3. Objectives (목표)

### 3.1 비즈니스 목표

1. **정보 투명성**: 사용자가 등록 전 모든 정보를 사이트 내에서 확인
2. **개인화 강화**: 각 사용자의 관심 대회만 캘린더에 추가
3. **사용자 만족도**: 불필요한 알림 감소 및 편의성 향상
4. **체류 시간 증가**: 외부 이동 전 모달에서 정보 탐색

### 3.2 기술 목표

1. **모달 컴포넌트**: 재사용 가능한 상세 모달 구현
2. **동적 ICS 생성**: 사용자 선택 기반 실시간 ICS 파일 생성
3. **이미지 관리**: 마라톤 대표 이미지 표시 시스템 구축
4. **접근성**: 모달 키보드 네비게이션 및 ARIA 속성 지원

### 3.3 성공 지표 (KPI)

| 지표 | 현재 | 목표 | 측정 방법 |
|------|------|------|---------|
| 상세 정보 접근성 | 불가능 | 100% | 모달 오픈율 추적 |
| ICS 개인화 | 0% (전체 포함) | 100% (선택 가능) | 생성된 ICS 파일 분석 |
| 등록 전환율 | 측정 불가 | +20% | 모달→등록 이동 추적 |
| 사용자 알림 만족도 | - | 4.5/5.0 | 설문 조사 |

---

## 4. Scope (범위)

### 4.1 In-Scope (포함 사항)

#### Feature 1: 마라톤 상세 모달

**4.1.1 UI 컴포넌트**
- [ ] `components/MarathonDetailModal.tsx` 생성
  - 모달 오버레이 및 컨테이너
  - 닫기 버튼 (X, ESC 키, 배경 클릭)
  - 스크롤 가능한 본문 영역

**4.1.2 표시 정보**
- [ ] **기본 정보**
  - 대회명, D-Day, 날짜 (요일 포함)
  - 지역, 상세 위치
  - 거리 옵션 (Full, Half, 10km 등)

- [ ] **상세 정보** (JSON 데이터에서 추가 필요)
  - 주최자 (organizer)
  - 등록 기간 (registrationStart ~ registrationEnd)
  - 등록 상태 (registrationStatus): "접수중", "마감 D-20" 등
  - 참가비 (price: {currency, amount, description})

- [ ] **시각 요소**
  - 대회 대표 이미지 (imageUrl)
  - HOT RACE 배지 (isPopular)
  - 태그 (#벚꽃시즌, #바다뷰 등)

**4.1.3 액션 버튼**
- [ ] "등록 페이지로 이동" 버튼
- [ ] "즐겨찾기 추가/제거" 토글
- [ ] "내 캘린더에 추가" 버튼 (단일 이벤트 ICS 생성)

**4.1.4 접근성**
- [ ] 모달 오픈 시 포커스 트랩
- [ ] ESC 키로 닫기
- [ ] ARIA 속성 (role="dialog", aria-labelledby, aria-describedby)

#### Feature 2: 개인화된 ICS 생성

**4.2.1 ICS 생성 로직**
- [ ] `utils/icsGenerator.ts` 생성
  - `generateICS(events: MarathonEvent[]): string` 함수
  - VCALENDAR 포맷 생성
  - VALARM (7일 전, 1일 전 알림) 포함

**4.2.2 다운로드 기능**
- [ ] `CalendarButton.tsx` 개선
  - 기존: 정적 파일 다운로드
  - 신규: "전체 대회" / "즐겨찾기만" 선택 옵션
  - Blob 생성 및 다운로드 트리거

**4.2.3 파일명 자동 생성**
- [ ] 전체: `2026_마라톤_일정_전체.ics`
- [ ] 개인화: `2026_마라톤_일정_나만의_({count}개).ics`

#### Feature 3: 마라톤 이미지 관리

**4.3.1 이미지 소스 전략**
- [ ] **Phase 1 (MVP)**: Fallback 이미지 사용
  - 지역별 기본 이미지 (서울, 부산, 제주 등)
  - `/public/images/marathon-fallback.jpg`

- [ ] **Phase 2 (향후)**: 스크래퍼에 이미지 크롤링 추가
  - gorunning.kr 대회 상세 페이지에서 추출
  - `imageUrl` 필드를 JSON에 추가

**4.3.2 이미지 최적화**
- [ ] WebP 포맷 변환 (Vite 빌드 시)
- [ ] Lazy loading 적용
- [ ] 이미지 로드 실패 시 fallback 처리

### 4.2 Out-of-Scope (제외 사항)

- ❌ 실시간 등록 가능 여부 API 연동 (외부 사이트 파싱 필요)
- ❌ 대회 후기 및 평점 시스템 (별도 기능)
- ❌ 소셜 공유 기능 (향후 추가 가능)
- ❌ 대회 코스 지도 표시 (Google Maps API 연동 필요)

---

## 5. Requirements (요구사항)

### 5.1 Functional Requirements (기능 요구사항)

#### FR-1: 모달 표시
- **FR-1.1**: MarathonCard 클릭 시 상세 모달 오픈
- **FR-1.2**: 모달 배경 클릭 또는 ESC 키로 닫기
- **FR-1.3**: 모달 내 스크롤 지원 (본문이 긴 경우)
- **FR-1.4**: 등록 버튼 클릭 시 외부 URL 새 탭 열기

#### FR-2: 상세 정보 표시
- **FR-2.1**: 기본 정보 (이름, 날짜, 지역, 거리) 표시
- **FR-2.2**: 확장 정보 (주최자, 등록기간, 가격) 표시
- **FR-2.3**: 대회 이미지 표시 (없으면 fallback)
- **FR-2.4**: 태그 및 인기 대회 배지 표시

#### FR-3: ICS 생성
- **FR-3.1**: "전체 대회" ICS 다운로드 지원
- **FR-3.2**: "즐겨찾기만" ICS 다운로드 지원
- **FR-3.3**: ICS 파일에 7일 전, 1일 전 알림 포함
- **FR-3.4**: 파일명에 대회 수 표시

#### FR-4: 단일 이벤트 추가
- **FR-4.1**: 모달 내 "내 캘린더에 추가" 버튼
- **FR-4.2**: 해당 대회만 포함된 ICS 생성 및 다운로드
- **FR-4.3**: 파일명: `{대회명}_{날짜}.ics`

### 5.2 Non-Functional Requirements (비기능 요구사항)

#### NFR-1: 성능
- **NFR-1.1**: 모달 오픈 애니메이션 < 300ms
- **NFR-1.2**: ICS 생성 시간 < 100ms (100개 이벤트 기준)
- **NFR-1.3**: 이미지 로딩 < 2초 (Lazy loading 적용)

#### NFR-2: 접근성
- **NFR-2.1**: WCAG 2.1 AA 준수
- **NFR-2.2**: 키보드 네비게이션 지원
- **NFR-2.3**: 스크린 리더 호환

#### NFR-3: 호환성
- **NFR-3.1**: ICS 파일 Apple Calendar 호환
- **NFR-3.2**: ICS 파일 Google Calendar 호환
- **NFR-3.3**: ICS 파일 Outlook 호환

#### NFR-4: 유지보수성
- **NFR-4.4**: 모달 컴포넌트 재사용 가능
- **NFR-4.5**: ICS 생성 로직 테스트 가능
- **NFR-4.6**: 이미지 URL 변경 시 코드 수정 불필요

---

## 6. Technical Approach (기술 접근)

### 6.1 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      App.tsx                             │
│  ┌────────────────────────────────────────────────────┐ │
│  │  State Management                                   │ │
│  │  - selectedEvent: MarathonEvent | null             │ │
│  │  - isModalOpen: boolean                            │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│              MarathonCard.tsx                            │
│  onClick={() => {                                        │
│    setSelectedEvent(event)                              │
│    setIsModalOpen(true)                                 │
│  }}                                                      │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│          MarathonDetailModal.tsx                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Props: event, isOpen, onClose                     │ │
│  │                                                     │ │
│  │  Components:                                        │ │
│  │  - Modal Overlay (backdrop)                        │ │
│  │  - Modal Container (content)                       │ │
│  │  - Image Section (hero image)                      │ │
│  │  - Info Section (detailed info)                    │ │
│  │  - Action Buttons (register, favorite, add)       │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│            CalendarButton.tsx                            │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Dropdown Menu:                                     │ │
│  │  - 📥 전체 대회 다운로드                           │ │
│  │  - ⭐ 즐겨찾기만 다운로드                          │ │
│  │                                                     │ │
│  │  onClick → generateICS(events) → download          │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│           utils/icsGenerator.ts                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  generateICS(events: MarathonEvent[]): string      │ │
│  │  {                                                  │ │
│  │    return `BEGIN:VCALENDAR                         │ │
│  │            VERSION:2.0                             │ │
│  │            PRODID:-//RunD-day//KO                  │ │
│  │            ${events.map(createVEvent).join('')}    │ │
│  │            END:VCALENDAR`                           │ │
│  │  }                                                  │ │
│  │                                                     │ │
│  │  downloadICS(content: string, filename: string)    │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Data Flow

```
User Click Card
      ↓
App State Update (selectedEvent, isModalOpen)
      ↓
MarathonDetailModal Renders
      ↓
Fetch Image (if imageUrl exists)
      ↓
Display Info + Actions
      ↓
User Actions:
  - "등록하기" → window.open(registrationUrl)
  - "즐겨찾기" → toggleFavorite(event.id)
  - "캘린더 추가" → generateICS([event]) → download
```

### 6.3 Component Hierarchy

```
App.tsx
├── FilterBar.tsx
├── MarathonCard.tsx (multiple)
│   └── onClick → setSelectedEvent
├── MarathonDetailModal.tsx ⭐ NEW
│   ├── Modal Overlay
│   ├── Close Button
│   ├── Image Header
│   ├── Event Info Section
│   │   ├── Basic Info (name, date, location)
│   │   ├── Extended Info (organizer, price, period)
│   │   └── Tags & Badges
│   └── Action Bar
│       ├── Register Button
│       ├── Favorite Toggle
│       └── Add to Calendar Button
└── CalendarButton.tsx (floating)
    └── Dropdown Menu ⭐ ENHANCED
        ├── "전체 대회 다운로드"
        └── "즐겨찾기만 다운로드"
```

### 6.4 Technology Stack

| 기능 | 기술 | 이유 |
|------|------|------|
| 모달 UI | React Portals + Tailwind | 접근성 및 일관된 스타일 |
| 애니메이션 | Tailwind animate-in | 간단한 fade/slide 효과 |
| ICS 생성 | Native JS (template string) | 외부 라이브러리 불필요 |
| 이미지 Lazy Loading | React Suspense (optional) | 성능 최적화 |
| 다운로드 | Blob + createObjectURL | 표준 브라우저 API |

---

## 7. Implementation Plan (구현 계획)

### 7.1 Phase 1: 상세 모달 구현 (1-2일)

**Day 1: 기본 모달 구조**
- [ ] `MarathonDetailModal.tsx` 생성
- [ ] 모달 오픈/닫기 로직 구현
- [ ] App.tsx에 상태 관리 추가
- [ ] MarathonCard 클릭 이벤트 연결

**Day 2: 상세 정보 표시**
- [ ] 기본 정보 레이아웃
- [ ] 확장 정보 표시 (JSON 구조 확인 필요)
- [ ] Fallback 이미지 추가
- [ ] 반응형 디자인 적용

### 7.2 Phase 2: ICS 생성 로직 (1일)

**Day 3: ICS 유틸리티**
- [ ] `utils/icsGenerator.ts` 생성
- [ ] `generateICS()` 함수 구현
- [ ] `createVEvent()` 헬퍼 함수
- [ ] `downloadICS()` 다운로드 로직
- [ ] 단위 테스트 작성

### 7.3 Phase 3: CalendarButton 개선 (0.5일)

**Day 4: 다운로드 옵션**
- [ ] 드롭다운 메뉴 UI 추가
- [ ] "전체 대회" 옵션 연결
- [ ] "즐겨찾기만" 옵션 연결
- [ ] 파일명 자동 생성 로직

### 7.4 Phase 4: 이미지 시스템 (0.5일)

**Day 4 (continued): 이미지 관리**
- [ ] Fallback 이미지 생성 (`/public/images/`)
- [ ] 이미지 로딩 에러 핸들링
- [ ] Lazy loading 적용
- [ ] types.ts에 `imageUrl?: string` 추가

### 7.5 Phase 5: 접근성 및 테스트 (1일)

**Day 5: 품질 보증**
- [ ] 키보드 네비게이션 테스트
- [ ] ARIA 속성 추가
- [ ] 스크린 리더 테스트
- [ ] 크로스 브라우저 테스트
- [ ] ICS 파일 캘린더 앱 테스트 (Apple, Google, Outlook)

---

## 8. Dependencies (의존성)

### 8.1 Data Schema 변경 필요

현재 `MarathonEvent` 타입에 다음 필드 추가 필요:

```typescript
export interface MarathonEvent {
  // 기존 필드...

  // 추가 필드 (스크래퍼에서 수집)
  organizer?: string;              // 주최자
  registrationStart?: string;      // 등록 시작일 (ISO 8601)
  registrationEnd?: string;        // 등록 마감일
  registrationStatus?: string;     // "접수중", "마감 D-20" 등
  price?: {
    currency: string;              // "KRW", "USD"
    amount: number;                // 40000
    description?: string;          // "얼리버드 할인"
  };
  imageUrl?: string;               // 대회 대표 이미지 URL
}
```

### 8.2 스크래퍼 업데이트 (선택적)

- `scripts/scrapers/sources/gorunning.ts`
  - 상세 페이지 크롤링 추가
  - `organizer`, `registrationStart/End`, `price` 파싱
  - 대회 이미지 URL 추출 (optional)

### 8.3 JSON 데이터 마이그레이션

- 기존 `marathons.json` 파일에 위 필드 추가
- 데이터 없는 경우 `undefined` 또는 기본값 처리

---

## 9. Risks & Mitigation (리스크 및 대응)

### 9.1 리스크 목록

| 리스크 | 확률 | 영향도 | 대응 전략 |
|--------|------|--------|----------|
| ICS 파일 캘린더 호환성 문제 | 🟡 Medium | 🔴 High | RFC 5545 표준 엄격 준수, 다중 캘린더 앱 테스트 |
| 이미지 로딩 속도 저하 | 🟡 Medium | 🟡 Medium | Lazy loading, WebP 포맷, CDN 사용 고려 |
| 스크래퍼에 상세 정보 없음 | 🟢 Low | 🟡 Medium | Fallback UI 제공, Phase 1은 기본 정보만 표시 |
| 모달 접근성 미흡 | 🟢 Low | 🟡 Medium | WCAG 가이드라인 준수, 자동화 테스트 도구 사용 |
| 대용량 ICS 파일 생성 | 🟢 Low | 🟢 Low | 최대 100개 제한, 브라우저 Blob 제한 확인 |

### 9.2 대응 계획

**R-1: ICS 호환성 문제**
- **예방**: icalendar 표준 RFC 5545 문서 참고
- **탐지**: Apple Calendar, Google Calendar, Outlook 실제 테스트
- **복구**: 호환성 이슈 발견 시 포맷 수정 및 재배포

**R-2: 이미지 성능**
- **예방**: Lazy loading, WebP 변환, 이미지 압축
- **탐지**: Lighthouse 성능 점수 측정
- **복구**: 이미지 크기 최적화, CDN 도입 검토

---

## 10. Success Criteria (성공 기준)

### 10.1 기능 완성도

- [ ] 모든 마라톤 카드에서 모달 오픈 가능
- [ ] 모달 내 모든 정보 정확히 표시
- [ ] ESC / 배경 클릭으로 모달 닫기 동작
- [ ] "전체 대회" ICS 다운로드 성공
- [ ] "즐겨찾기만" ICS 다운로드 성공
- [ ] 다운로드된 ICS 파일이 캘린더 앱에서 정상 import

### 10.2 품질 기준

- [ ] TypeScript 타입 에러 0개
- [ ] ESLint 경고 0개
- [ ] Lighthouse 접근성 점수 ≥ 90
- [ ] 모달 오픈 애니메이션 < 300ms
- [ ] ICS 생성 시간 < 100ms

### 10.3 사용자 경험

- [ ] 모달 디자인이 기존 UI와 일관성 유지
- [ ] 모바일에서 모달 스크롤 원활
- [ ] 이미지 없는 대회도 깔끔하게 표시
- [ ] ICS 파일명이 직관적이고 명확함

---

## 11. Next Steps (다음 단계)

### 11.1 Design Phase로 이동

```bash
/pdca-design marathon-detail-modal-and-personalized-ics
```

또는 자연어로 요청:
```
"마라톤 상세 모달 기능 설계해줘"
```

### 11.2 준비 사항

**Design 단계 전 확인:**
1. [ ] JSON 데이터 구조 확인 (`public/data/marathons.json`)
2. [ ] 스크래퍼가 수집하는 필드 파악
3. [ ] 기존 모달 디자인 참고 사례 조사 (gorunning.kr)
4. [ ] ICS 파일 포맷 RFC 5545 문서 읽기

**Design 문서에서 다룰 내용:**
- 모달 UI/UX 상세 설계
- ICS 생성 알고리즘
- 컴포넌트 Props 인터페이스
- 상태 관리 전략
- 에러 핸들링 시나리오

---

## 12. References (참고 자료)

### 12.1 External Resources

- [RFC 5545 - iCalendar Format](https://datatracker.ietf.org/doc/html/rfc5545)
- [WCAG 2.1 Modal Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [React Portals Documentation](https://react.dev/reference/react-dom/createPortal)

### 12.2 Internal Documents

- [UI/UX Critical Improvements Plan](./03_ui-ux-critical-improvements.plan.md)
- [MarathonCard Component](../../components/MarathonCard.tsx)
- [MarathonEvent Type Definition](../../types.ts)

### 12.3 Design Inspiration

- gorunning.kr 대회 상세 페이지 (사용자 제공 스크린샷)
- Apple Calendar 이벤트 상세 모달
- Airbnb 숙소 상세 모달 (이미지 + 정보 레이아웃)

---

## 13. Approval (승인)

- **Planner**: Claude AI (2026-01-21)
- **Reviewer**: _Pending_
- **Approver**: _Pending_

**Status**: ⏳ Awaiting Review

---

**📝 Document Version**: 1.0.0
**Last Updated**: 2026-01-21
**Next Review**: Design Phase 완료 후
