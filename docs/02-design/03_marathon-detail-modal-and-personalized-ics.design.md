# 마라톤 상세 모달 및 개인화된 ICS 생성 Design Document

> **Summary**: 상세 정보 모달 UI + 즐겨찾기 기반 ICS 생성 시스템
>
> **Project**: RunD-day
> **Version**: 1.0.0
> **Author**: Claude
> **Date**: 2026-01-21
> **Status**: Design Review
> **Planning Doc**: [05_marathon-detail-modal-and-personalized-ics.plan.md](../01-plan/05_marathon-detail-modal-and-personalized-ics.plan.md)

---

## 1. Overview

### 1.1 Design Goals

1. **정보 접근성**: 카드 클릭으로 모든 대회 정보를 즉시 확인
2. **개인화**: 사용자가 선택한 대회만 캘린더에 추가
3. **시각적 매력**: 대회 이미지로 브랜드 인지도 향상
4. **사용 편의성**: 3-click 이내 등록 페이지 도달
5. **표준 준수**: RFC 5545 iCalendar 표준 완벽 구현

### 1.2 Design Principles

- **Modal-First**: 외부 이동 전 충분한 정보 제공
- **Progressive Disclosure**: 기본 정보 → 상세 정보 단계적 노출
- **Graceful Degradation**: 이미지/상세 정보 없어도 정상 작동
- **Keyboard Accessible**: 마우스 없이도 완전한 조작 가능
- **Performance**: 모달 오픈 < 300ms, ICS 생성 < 100ms

---

## 2. Architecture

### 2.1 System Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        App Layer                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  App.tsx                                                  │  │
│  │                                                            │  │
│  │  State:                                                   │  │
│  │  • selectedEvent: MarathonEvent | null                   │  │
│  │  • isModalOpen: boolean                                  │  │
│  │  • favorites: string[]                                   │  │
│  │                                                            │  │
│  │  Event Handlers:                                          │  │
│  │  • handleCardClick(event) → open modal                   │  │
│  │  • handleModalClose() → close modal                      │  │
│  │  • handleAddToCalendar(event) → download single ICS     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                     Component Layer                             │
│                                                                  │
│  ┌────────────────────┐     ┌──────────────────────────────┐  │
│  │ MarathonCard.tsx   │     │ MarathonDetailModal.tsx      │  │
│  │                    │     │                              │  │
│  │ Props:             │     │ Props:                       │  │
│  │ • event            │────▶│ • event (required)           │  │
│  │ • isFavorite       │     │ • isOpen (required)          │  │
│  │ • onToggleFavorite │     │ • onClose (required)         │  │
│  │ • onClick ⭐ NEW   │     │ • onToggleFavorite           │  │
│  │                    │     │ • onAddToCalendar            │  │
│  │ onClick →          │     │                              │  │
│  │   open modal       │     │ Structure:                   │  │
│  └────────────────────┘     │ ├─ Overlay (backdrop)        │  │
│                              │ ├─ Container (animated)     │  │
│                              │ ├─ Close Button            │  │
│                              │ ├─ Image Section          │  │
│                              │ ├─ Info Section           │  │
│                              │ └─ Action Bar             │  │
│                              └──────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ CalendarButton.tsx (Enhanced)                          │    │
│  │                                                         │    │
│  │ NEW Features:                                          │    │
│  │ • Dropdown Menu                                        │    │
│  │   ├─ 📥 전체 대회 다운로드 (501개)                    │    │
│  │   └─ ⭐ 즐겨찾기만 다운로드 (N개)                     │    │
│  │                                                         │    │
│  │ onClick → generateICS() → downloadICS()                │    │
│  └────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                       Utility Layer                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ utils/icsGenerator.ts                                     │  │
│  │                                                            │  │
│  │ Functions:                                                │  │
│  │ • generateICS(events: MarathonEvent[]): string           │  │
│  │   ├─ Validate input                                      │  │
│  │   ├─ Generate VCALENDAR header                           │  │
│  │   ├─ Map events → VEVENT                                 │  │
│  │   ├─ Add VALARM (7d, 1d)                                 │  │
│  │   └─ Return ICS string                                   │  │
│  │                                                            │  │
│  │ • createVEvent(event: MarathonEvent): string             │  │
│  │   ├─ Generate UID (UUID v4)                              │  │
│  │   ├─ Format dates (YYYYMMDD)                             │  │
│  │   ├─ Sanitize text (line breaks)                         │  │
│  │   └─ Return VEVENT block                                 │  │
│  │                                                            │  │
│  │ • downloadICS(content: string, filename: string): void   │  │
│  │   ├─ Create Blob (text/calendar)                         │  │
│  │   ├─ Create URL                                          │  │
│  │   ├─ Trigger download                                    │  │
│  │   └─ Revoke URL                                          │  │
│  │                                                            │  │
│  │ • generateFilename(type: 'all' | 'favorites', count):   │  │
│  │     string                                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

#### 2.2.1 Modal Open Flow

```
User clicks MarathonCard
        ↓
App.handleCardClick(event)
        ↓
setSelectedEvent(event)
setIsModalOpen(true)
        ↓
MarathonDetailModal renders
        ↓
useEffect: Focus trap activated
        ↓
Fetch image (if imageUrl exists)
        ↓
Display content with animation
```

#### 2.2.2 ICS Download Flow

```
User clicks "즐겨찾기만 다운로드"
        ↓
handleDownloadFavorites()
        ↓
Filter: marathonData.filter(m => favorites.includes(m.id))
        ↓
generateICS(favoriteEvents)
        ↓
┌─────────────────────────────────┐
│ ICS Generation Pipeline:        │
│ 1. Validate events (non-empty)  │
│ 2. Create VCALENDAR header      │
│ 3. Map each event:               │
│    └─ createVEvent(event)       │
│       ├─ Generate UID            │
│       ├─ Format date (DTSTART)  │
│       ├─ Create SUMMARY          │
│       ├─ Add LOCATION            │
│       ├─ Add DESCRIPTION         │
│       ├─ Add VALARM (7d, 1d)    │
│       └─ Return VEVENT string   │
│ 4. Concatenate all VEVENTs      │
│ 5. Return complete ICS string   │
└─────────────────────────────────┘
        ↓
downloadICS(icsContent, filename)
        ↓
Create Blob → Create URL → Trigger <a> download → Revoke URL
```

#### 2.2.3 Keyboard Navigation Flow

```
User opens modal (Enter on card)
        ↓
Focus moves to first interactive element (Close button)
        ↓
Tab → Next button
Shift+Tab → Previous button
ESC → Close modal
        ↓
Focus returns to triggering card
```

### 2.3 Directory Structure

```
RunD-day/
├── components/
│   ├── MarathonCard.tsx          # ✏️ 수정: onClick 핸들러 추가
│   ├── MarathonDetailModal.tsx   # ⭐ 신규: 상세 모달
│   └── CalendarButton.tsx        # ✏️ 수정: 드롭다운 메뉴
├── utils/
│   └── icsGenerator.ts           # ⭐ 신규: ICS 생성 로직
├── public/
│   └── images/
│       ├── marathon-fallback.jpg # ⭐ 신규: 기본 이미지
│       └── regions/              # ⭐ 신규: 지역별 이미지 (optional)
├── types.ts                      # ✏️ 수정: MarathonEvent 확장
└── App.tsx                       # ✏️ 수정: 모달 상태 관리
```

---

## 3. Data Model

### 3.1 Type Definitions

#### 3.1.1 MarathonEvent (확장)

```typescript
// types.ts

export interface MarathonEvent {
  // ===== 기존 필드 =====
  id: string;
  name: string;
  date: string;                    // ISO 8601 (YYYY-MM-DD)
  region: string;
  locationDetail: string;
  distances: string[];
  registrationUrl: string;
  tags: string[];
  isPopular?: boolean;
  notes?: string;

  // ===== 추가 필드 (Phase 1 - Optional) =====
  organizer?: string;              // 주최자 (예: "(사)한국산악마라톤연맹")
  registrationStart?: string;      // 등록 시작일 (ISO 8601)
  registrationEnd?: string;        // 등록 마감일
  registrationStatus?: string;     // "접수중", "마감 D-20", "마감", "등록전"

  price?: {                        // 참가비
    currency: string;              // "KRW", "USD"
    amount: number;                // 40000
    description?: string;          // "얼리버드 할인"
  };

  imageUrl?: string;               // 대회 대표 이미지 URL

  // ===== Phase 2 추가 예정 (선택적) =====
  // courseMap?: string;           // 코스 맵 이미지 URL
  // elevation?: number;           // 고도 (미터)
  // capacity?: number;            // 정원
  // registeredCount?: number;     // 현재 등록 인원
}
```

#### 3.1.2 Modal State

```typescript
// App.tsx 내부 상태

interface ModalState {
  isOpen: boolean;
  selectedEvent: MarathonEvent | null;
}

// 초기값
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedEvent, setSelectedEvent] = useState<MarathonEvent | null>(null);
```

#### 3.1.3 ICS Generation Types

```typescript
// utils/icsGenerator.ts

interface ICSGenerationOptions {
  includeAlarms?: boolean;          // 기본: true
  alarmOffsets?: number[];          // 기본: [-7, -1] (일 단위)
  timezone?: string;                // 기본: "Asia/Seoul"
}

interface VEventData {
  uid: string;
  dtstart: string;                  // YYYYMMDD
  dtend: string;                    // YYYYMMDD
  summary: string;                  // 이벤트 제목
  location: string;                 // 위치
  description: string;              // 설명
  status: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED';
}
```

### 3.2 Data Schema Migration

#### 3.2.1 JSON 구조 (현재)

```json
// public/data/marathons.json (기존)
[
  {
    "id": "762",
    "name": "제2회 한강 서울 하프 마라톤",
    "date": "2026-01-25",
    "country": "KR",
    "region": "서울",
    "locationDetail": "상암 월드컵공원 평화광장",
    "distances": ["하프", "10km", "5km"],
    "registrationUrl": "https://gorunning.kr/races/762/",
    "tags": ["인기대회", "한강", "등록중"],
    "source": "gorunning",
    "isPopular": true,
    "lastUpdated": "2026-01-21T10:00:00.000Z"
  }
]
```

#### 3.2.2 JSON 구조 (확장 - Phase 1)

```json
// public/data/marathons.json (확장)
[
  {
    "id": "762",
    "name": "제2회 한강 서울 하프 마라톤",
    "date": "2026-01-25",
    "country": "KR",
    "region": "서울",
    "locationDetail": "상암 월드컵공원 평화광장",
    "distances": ["하프", "10km", "5km"],
    "registrationUrl": "https://gorunning.kr/races/762/",
    "tags": ["인기대회", "한강", "등록중"],
    "source": "gorunning",
    "isPopular": true,
    "lastUpdated": "2026-01-21T10:00:00.000Z",

    // ⭐ 추가 필드
    "organizer": "사단법인 국민성공시대",
    "registrationStart": "2025-11-01",
    "registrationEnd": "2026-02-10",
    "registrationStatus": "접수중",
    "price": {
      "currency": "KRW",
      "amount": 40000,
      "description": "얼리버드 마감 (정상가 45,000원)"
    },
    "imageUrl": "/images/marathons/hangang-seoul-half.jpg"
  }
]
```

#### 3.2.3 Fallback 전략

```typescript
// hooks/useMarathons.ts - transformEvent 수정

function transformEvent(apiEvent: MarathonAPIEvent): MarathonEvent {
  return {
    // 기존 필드...

    // 새 필드 (optional, undefined 허용)
    organizer: apiEvent.organizer,
    registrationStart: apiEvent.registrationStart,
    registrationEnd: apiEvent.registrationEnd,
    registrationStatus: apiEvent.registrationStatus,
    price: apiEvent.price,
    imageUrl: apiEvent.imageUrl,
  };
}
```

---

## 4. Component Design

### 4.1 MarathonDetailModal

#### 4.1.1 Props Interface

```typescript
// components/MarathonDetailModal.tsx

interface MarathonDetailModalProps {
  event: MarathonEvent;                     // 표시할 이벤트 (required)
  isOpen: boolean;                          // 모달 오픈 상태 (required)
  onClose: () => void;                      // 닫기 핸들러 (required)
  isFavorite: boolean;                      // 즐겨찾기 상태
  onToggleFavorite: (id: string) => void;  // 즐겨찾기 토글
  onAddToCalendar: (event: MarathonEvent) => void; // 캘린더 추가
}
```

#### 4.1.2 Component Structure

```tsx
const MarathonDetailModal: React.FC<MarathonDetailModalProps> = ({
  event,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
  onAddToCalendar,
}) => {
  if (!isOpen) return null;

  return (
    // Portal을 사용하여 body에 직접 렌더링
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>

        {/* 1. Close Button */}
        <button onClick={onClose} className="close-button">
          <X size={24} />
        </button>

        {/* 2. Image Section */}
        <div className="image-section">
          {event.imageUrl ? (
            <img src={event.imageUrl} alt={event.name} loading="lazy" />
          ) : (
            <div className="fallback-image">
              <MapPin size={48} />
              <span>{event.region}</span>
            </div>
          )}
        </div>

        {/* 3. Info Section */}
        <div className="info-section">
          {/* 3.1 Basic Info */}
          <div className="basic-info">
            <h2>{event.name}</h2>
            <div className="d-day">D-{calculateDDay(event.date)}</div>
            <div className="meta">
              <Calendar /> {event.date} (요일)
              <MapPin /> {event.region} · {event.locationDetail}
              <Trophy /> {event.distances.join(', ')}
            </div>
          </div>

          {/* 3.2 Extended Info (if available) */}
          {hasExtendedInfo(event) && (
            <div className="extended-info">
              {event.organizer && (
                <div className="info-row">
                  <Users size={16} />
                  <span>주최: {event.organizer}</span>
                </div>
              )}
              {event.registrationStatus && (
                <div className="info-row">
                  <AlertCircle size={16} />
                  <span className="status">{event.registrationStatus}</span>
                </div>
              )}
              {event.price && (
                <div className="info-row">
                  <DollarSign size={16} />
                  <span>{event.price.amount.toLocaleString()}원</span>
                  {event.price.description && (
                    <span className="price-note">({event.price.description})</span>
                  )}
                </div>
              )}
              {event.registrationEnd && (
                <div className="info-row">
                  <Clock size={16} />
                  <span>접수 마감: {event.registrationEnd}</span>
                </div>
              )}
            </div>
          )}

          {/* 3.3 Tags */}
          <div className="tags">
            {event.tags.map(tag => (
              <span key={tag} className="tag">#{tag}</span>
            ))}
          </div>
        </div>

        {/* 4. Action Bar */}
        <div className="action-bar">
          <button
            onClick={() => onToggleFavorite(event.id)}
            className={`favorite-button ${isFavorite ? 'active' : ''}`}
          >
            <Heart fill={isFavorite ? 'currentColor' : 'none'} />
            {isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
          </button>

          <button
            onClick={() => onAddToCalendar(event)}
            className="calendar-button"
          >
            <Calendar />
            내 캘린더에 추가
          </button>

          <button
            onClick={() => window.open(event.registrationUrl, '_blank')}
            disabled={!event.registrationUrl}
            className="register-button"
          >
            <ExternalLink />
            등록 페이지로 이동
          </button>
        </div>
      </div>
    </div>
  );
};
```

#### 4.1.3 Accessibility Features

```typescript
// Focus Trap Implementation
useEffect(() => {
  if (!isOpen) return;

  const modalElement = document.querySelector('.modal-container');
  const focusableElements = modalElement?.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements?.[0] as HTMLElement;
  const lastFocusable = focusableElements?.[focusableElements.length - 1] as HTMLElement;

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  };

  document.addEventListener('keydown', handleTabKey);
  firstFocusable?.focus();

  return () => document.removeEventListener('keydown', handleTabKey);
}, [isOpen]);

// ESC Key Handler
useEffect(() => {
  if (!isOpen) return;

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, [isOpen, onClose]);

// Body Scroll Lock
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }

  return () => {
    document.body.style.overflow = '';
  };
}, [isOpen]);
```

### 4.2 CalendarButton (Enhanced)

#### 4.2.1 Component Structure

```tsx
// components/CalendarButton.tsx (수정)

const CalendarButton: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { events } = useMarathons();
  const favorites = JSON.parse(localStorage.getItem('marathon-favorites') || '[]');

  const favoriteEvents = events.filter(e => favorites.includes(e.id));

  const handleDownloadAll = () => {
    const icsContent = generateICS(events);
    const filename = generateFilename('all', events.length);
    downloadICS(icsContent, filename);
    setIsDropdownOpen(false);
  };

  const handleDownloadFavorites = () => {
    if (favoriteEvents.length === 0) {
      alert('즐겨찾기한 대회가 없습니다.');
      return;
    }
    const icsContent = generateICS(favoriteEvents);
    const filename = generateFilename('favorites', favoriteEvents.length);
    downloadICS(icsContent, filename);
    setIsDropdownOpen(false);
  };

  return (
    <div className="calendar-button-container">
      <button onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
        <Calendar />
        캘린더 다운로드
      </button>

      {isDropdownOpen && (
        <div className="dropdown-menu">
          <button onClick={handleDownloadAll}>
            <Download />
            <div>
              <strong>전체 대회 다운로드</strong>
              <span>{events.length}개</span>
            </div>
          </button>

          <button
            onClick={handleDownloadFavorites}
            disabled={favoriteEvents.length === 0}
          >
            <Heart fill="currentColor" />
            <div>
              <strong>즐겨찾기만 다운로드</strong>
              <span>{favoriteEvents.length}개</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
```

---

## 5. ICS Generation Algorithm

### 5.1 Core Functions

#### 5.1.1 generateICS()

```typescript
// utils/icsGenerator.ts

/**
 * 마라톤 이벤트 배열을 RFC 5545 표준 ICS 파일로 변환
 *
 * @param events - MarathonEvent 배열
 * @param options - 생성 옵션
 * @returns ICS 형식 문자열
 */
export function generateICS(
  events: MarathonEvent[],
  options: ICSGenerationOptions = {}
): string {
  // 1. Validation
  if (!events || events.length === 0) {
    throw new Error('이벤트가 없습니다.');
  }

  // 2. Options 기본값
  const {
    includeAlarms = true,
    alarmOffsets = [-7, -1],  // 7일 전, 1일 전
    timezone = 'Asia/Seoul',
  } = options;

  // 3. Header 생성
  const header = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RunD-day Marathon Calendar//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:2026 마라톤 일정',
    `X-WR-TIMEZONE:${timezone}`,
  ].join('\r\n');

  // 4. Events 변환
  const vevents = events.map(event =>
    createVEvent(event, { includeAlarms, alarmOffsets })
  ).join('\r\n');

  // 5. Footer
  const footer = 'END:VCALENDAR';

  // 6. 결합
  return [header, vevents, footer].join('\r\n');
}
```

#### 5.1.2 createVEvent()

```typescript
/**
 * 단일 MarathonEvent를 VEVENT 블록으로 변환
 *
 * @param event - 마라톤 이벤트
 * @param options - VALARM 옵션
 * @returns VEVENT 블록 문자열
 */
function createVEvent(
  event: MarathonEvent,
  options: { includeAlarms: boolean; alarmOffsets: number[] }
): string {
  // 1. UID 생성 (UUID v4)
  const uid = generateUUID();

  // 2. 날짜 포맷팅 (YYYYMMDD)
  const dtstart = formatDateForICS(event.date);
  const dtend = formatDateForICS(addDays(event.date, 1)); // 종료일 = 시작일 + 1

  // 3. SUMMARY (제목)
  const emoji = getEventEmoji(event.tags);
  const summary = `${emoji} ${event.name}`;

  // 4. LOCATION
  const location = `${event.region} ${event.locationDetail}`.trim();

  // 5. DESCRIPTION
  const description = createDescription(event);

  // 6. STATUS
  const status = 'CONFIRMED';

  // 7. VEVENT 조립
  const vevent = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART;VALUE=DATE:${dtstart}`,
    `DTEND;VALUE=DATE:${dtend}`,
    `SUMMARY:${sanitizeText(summary)}`,
    `LOCATION:${sanitizeText(location)}`,
    `DESCRIPTION:${sanitizeText(description)}`,
    `STATUS:${status}`,
  ];

  // 8. VALARM 추가
  if (options.includeAlarms) {
    options.alarmOffsets.forEach(offset => {
      vevent.push(...createVAlarm(offset));
    });
  }

  vevent.push('END:VEVENT');

  return vevent.join('\r\n');
}
```

#### 5.1.3 Helper Functions

```typescript
/**
 * UUID v4 생성
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 날짜를 ICS 포맷으로 변환 (YYYYMMDD)
 */
function formatDateForICS(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * 날짜에 일수 추가
 */
function addDays(dateString: string, days: number): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * 태그 기반 이모지 선택
 */
function getEventEmoji(tags: string[]): string {
  if (tags.includes('벚꽃시즌') || tags.includes('꽃길')) return '🌸';
  if (tags.includes('바다뷰') || tags.includes('해변코스')) return '🌊';
  if (tags.includes('트레일') || tags.includes('산악')) return '🏔️';
  if (tags.includes('야간걷기') || tags.includes('나이트워크')) return '🌙';
  if (tags.includes('새벽대회')) return '🌅';
  if (tags.includes('기부런') || tags.includes('착한마라톤')) return '💝';
  return '🏃';
}

/**
 * DESCRIPTION 필드 생성
 */
function createDescription(event: MarathonEvent): string {
  const lines: string[] = [];

  // 거리
  lines.push(`종목: ${event.distances.join(', ')}`);

  // 주최자
  if (event.organizer) {
    lines.push(`주최: ${event.organizer}`);
  }

  // 가격
  if (event.price) {
    lines.push(`참가비: ${event.price.amount.toLocaleString()}원`);
    if (event.price.description) {
      lines.push(`(${event.price.description})`);
    }
  }

  // 등록 상태
  if (event.registrationStatus) {
    lines.push(`등록 상태: ${event.registrationStatus}`);
  }

  // 인기 대회 표시
  if (event.isPopular) {
    lines.push('⭐ 인기대회');
  }

  // 등록 URL
  if (event.registrationUrl) {
    lines.push('');
    lines.push(`등록: ${event.registrationUrl}`);
  }

  // 알림 안내
  lines.push('');
  lines.push('🔔 접수 시작 10분 전 알림 설정 권장!');

  return lines.join('\\n');
}

/**
 * 텍스트 sanitize (ICS 표준 준수)
 */
function sanitizeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')    // Backslash escape
    .replace(/;/g, '\\;')      // Semicolon escape
    .replace(/,/g, '\\,')      // Comma escape
    .replace(/\n/g, '\\n')     // Newline to literal \n
    .replace(/\r/g, '');       // Remove carriage return
}

/**
 * VALARM 블록 생성
 */
function createVAlarm(offsetDays: number): string[] {
  const triggerValue = `P${Math.abs(offsetDays)}D`; // P7D = 7일
  const description = offsetDays === -7
    ? '마라톤 대회 7일 전! 접수 확인하세요'
    : '마라톤 대회 내일! 준비물 체크하세요';

  return [
    'BEGIN:VALARM',
    `TRIGGER:-${triggerValue}`,
    'ACTION:DISPLAY',
    `DESCRIPTION:${description}`,
    'END:VALARM',
  ];
}
```

#### 5.1.4 downloadICS()

```typescript
/**
 * ICS 콘텐츠를 파일로 다운로드
 *
 * @param content - ICS 파일 내용
 * @param filename - 저장할 파일명
 */
export function downloadICS(content: string, filename: string): void {
  // 1. Blob 생성
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });

  // 2. URL 생성
  const url = URL.createObjectURL(blob);

  // 3. 숨겨진 <a> 태그 생성 및 클릭
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // 4. 정리
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

#### 5.1.5 generateFilename()

```typescript
/**
 * 파일명 자동 생성
 *
 * @param type - 'all' | 'favorites' | 'single'
 * @param count - 이벤트 개수
 * @param eventName - 단일 이벤트명 (type='single'일 때)
 * @returns 파일명 (예: "2026_마라톤_일정_나만의_(5개).ics")
 */
export function generateFilename(
  type: 'all' | 'favorites' | 'single',
  count: number,
  eventName?: string
): string {
  const year = new Date().getFullYear();

  if (type === 'single' && eventName) {
    const safeName = eventName.replace(/[^가-힣a-zA-Z0-9]/g, '_');
    return `${year}_${safeName}.ics`;
  }

  if (type === 'favorites') {
    return `${year}_마라톤_일정_나만의_(${count}개).ics`;
  }

  return `${year}_마라톤_일정_전체.ics`;
}
```

### 5.2 RFC 5545 준수 사항

| 항목 | 요구사항 | 구현 |
|------|----------|------|
| Line Ending | CRLF (`\r\n`) | ✅ 모든 줄바꿈에 `\r\n` 사용 |
| Character Encoding | UTF-8 | ✅ Blob type에 명시 |
| Text Escaping | `\`, `;`, `,`, `\n` escape | ✅ sanitizeText() 함수 |
| Date Format | YYYYMMDD | ✅ formatDateForICS() 함수 |
| UID Uniqueness | 각 이벤트마다 고유 | ✅ UUID v4 생성 |
| VALARM Syntax | BEGIN/END 블록 | ✅ createVAlarm() 함수 |
| Required Fields | DTSTART, DTEND, UID | ✅ 모든 필드 포함 |

---

## 6. State Management

### 6.1 App.tsx State

```typescript
// App.tsx

const App: React.FC = () => {
  // 기존 상태...
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('marathon-favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // ⭐ 신규 상태: 모달 제어
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<MarathonEvent | null>(null);

  // 모달 오픈 핸들러
  const handleCardClick = (event: MarathonEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  // 모달 닫기 핸들러
  const handleModalClose = () => {
    setIsModalOpen(false);
    // 애니메이션 후 selectedEvent 초기화
    setTimeout(() => setSelectedEvent(null), 300);
  };

  // 단일 이벤트 캘린더 추가
  const handleAddToCalendar = (event: MarathonEvent) => {
    const icsContent = generateICS([event]);
    const filename = generateFilename('single', 1, event.name);
    downloadICS(icsContent, filename);
  };

  return (
    <>
      {/* 기존 컴포넌트... */}
      <MarathonCard
        event={event}
        isFavorite={favorites.includes(event.id)}
        onToggleFavorite={toggleFavorite}
        onClick={handleCardClick}  {/* ⭐ 신규 */}
      />

      {/* ⭐ 모달 */}
      {selectedEvent && (
        <MarathonDetailModal
          event={selectedEvent}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          isFavorite={favorites.includes(selectedEvent.id)}
          onToggleFavorite={toggleFavorite}
          onAddToCalendar={handleAddToCalendar}
        />
      )}
    </>
  );
};
```

### 6.2 State Lifecycle

```
Initial State:
  isModalOpen: false
  selectedEvent: null

User clicks card:
  ↓
handleCardClick(event)
  setSelectedEvent(event)
  setIsModalOpen(true)
  ↓
Modal renders with animation
  useEffect → focus trap
  useEffect → scroll lock
  useEffect → ESC listener
  ↓
User closes modal (X / ESC / backdrop):
  ↓
handleModalClose()
  setIsModalOpen(false)
  setTimeout → setSelectedEvent(null) after 300ms
  ↓
Modal unmounts with exit animation
```

---

## 7. UI/UX Specifications

### 7.1 Modal Design

#### 7.1.1 Layout

```
┌────────────────────────────────────────┐
│ [X]                                    │ ← Close Button (absolute)
│                                        │
│  ┌──────────────────────────────────┐ │
│  │                                  │ │
│  │     대회 이미지 (16:9 비율)     │ │ ← Image Section
│  │     또는 Fallback (지역 아이콘) │ │
│  │                                  │ │
│  └──────────────────────────────────┘ │
│                                        │
│  제2회 한강 서울 하프 마라톤           │ ← Title
│  D-32                                  │ ← D-Day Badge
│  ─────────────────────────────────    │
│  📅 2026/02/22 (일) 09:30             │
│  📍 서울 · 잠실 올림픽공원            │
│  🏆 Full, Half, 10km                  │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 📋 대회 정보                     │ │
│  │                                  │ │
│  │ 👥 주최: (사)한국산악마라톤연맹 │ │
│  │ ⚠️  등록 상태: 마감 D-20        │ │
│  │ 💵 참가비: 40,000원              │ │
│  │    (얼리버드 마감)               │ │
│  │ ⏰ 접수 마감: 2026-02-10         │ │
│  └──────────────────────────────────┘ │
│                                        │
│  #인기대회 #한강 #등록중              │ ← Tags
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ [❤️ 즐겨찾기] [📅 캘린더 추가]  │ │ ← Action Bar
│  │             [등록하기 →]         │ │
│  └──────────────────────────────────┘ │
└────────────────────────────────────────┘
```

#### 7.1.2 Responsive Breakpoints

```css
/* Mobile (< 640px) */
.modal-container {
  width: 95vw;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
}

/* Tablet (640px ~ 1024px) */
@media (min-width: 640px) {
  .modal-container {
    width: 80vw;
    max-width: 600px;
  }
}

/* Desktop (> 1024px) */
@media (min-width: 1024px) {
  .modal-container {
    width: 700px;
    max-height: 85vh;
  }
}
```

#### 7.1.3 Animations

```css
/* Modal Overlay Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Modal Container Slide Up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-overlay {
  animation: fadeIn 200ms ease-out;
}

.modal-container {
  animation: slideUp 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

### 7.2 Image Fallback Design

```tsx
// Fallback 이미지 (imageUrl이 없을 때)
<div className="fallback-image">
  <div className="region-icon">
    {getRegionIcon(event.region)}
  </div>
  <div className="region-name">{event.region}</div>
  <div className="pattern-overlay" />
</div>

// 지역별 아이콘 매핑
function getRegionIcon(region: string) {
  const icons = {
    '서울': <Building2 />,
    '부산': <Waves />,
    '제주': <Mountain />,
    '강원': <Mountain />,
    '해외': <Globe />,
    // ...
  };
  return icons[region] || <MapPin />;
}
```

### 7.3 CalendarButton Dropdown

```
┌────────────────────────────┐
│ 🗓️  캘린더 다운로드        │ ← Button
└────────────────────────────┘
              ↓ (click)
┌────────────────────────────┐
│ 📥 전체 대회 다운로드      │
│    501개                   │
├────────────────────────────┤
│ ⭐ 즐겨찾기만 다운로드     │
│    5개                     │
└────────────────────────────┘
```

---

## 8. Error Handling

### 8.1 Error Scenarios

| 시나리오 | 원인 | 대응 전략 |
|----------|------|----------|
| 이미지 로딩 실패 | 404, CORS, 네트워크 | Fallback 이미지 표시 |
| ICS 생성 실패 | 빈 배열, 잘못된 데이터 | 에러 메시지 + 복구 가능 시 재시도 |
| 다운로드 실패 | 브라우저 권한, Blob 실패 | Alert 메시지 + 재다운로드 버튼 |
| 즐겨찾기 0개 다운로드 | 사용자가 즐겨찾기 안 함 | 비활성화 버튼 + Tooltip 안내 |

### 8.2 Implementation

```typescript
// 이미지 로딩 에러 핸들러
<img
  src={event.imageUrl}
  alt={event.name}
  onError={(e) => {
    e.currentTarget.style.display = 'none';
    setImageLoadFailed(true);
  }}
/>

// ICS 생성 에러 핸들러
try {
  const icsContent = generateICS(events);
  downloadICS(icsContent, filename);
} catch (error) {
  console.error('ICS 생성 실패:', error);
  alert('캘린더 파일 생성에 실패했습니다. 다시 시도해주세요.');
}

// 즐겨찾기 0개 방지
const handleDownloadFavorites = () => {
  if (favoriteEvents.length === 0) {
    alert('즐겨찾기한 대회가 없습니다.\n먼저 관심 있는 대회를 즐겨찾기에 추가해주세요!');
    return;
  }
  // 다운로드 로직...
};
```

---

## 9. Implementation Details

### 9.1 File Changes Summary

| 파일 | 변경 유형 | 주요 변경 사항 |
|------|----------|----------------|
| `types.ts` | 수정 | MarathonEvent 인터페이스 확장 (organizer, price 등) |
| `components/MarathonCard.tsx` | 수정 | onClick prop 추가 |
| `components/MarathonDetailModal.tsx` | 신규 | 모달 컴포넌트 전체 구현 |
| `components/CalendarButton.tsx` | 수정 | 드롭다운 메뉴 추가 |
| `utils/icsGenerator.ts` | 신규 | ICS 생성 로직 전체 구현 |
| `App.tsx` | 수정 | 모달 상태 관리 및 핸들러 추가 |
| `public/images/marathon-fallback.jpg` | 신규 | 기본 이미지 파일 |

### 9.2 Implementation Order

```
Phase 1: 기본 모달 (Day 1-2)
  ├─ types.ts 확장
  ├─ MarathonDetailModal.tsx 생성 (기본 구조)
  ├─ App.tsx 상태 관리
  ├─ MarathonCard onClick 연결
  └─ 기본 정보 표시

Phase 2: ICS 생성 (Day 3)
  ├─ utils/icsGenerator.ts 생성
  ├─ generateICS(), createVEvent()
  ├─ downloadICS()
  └─ 단위 테스트

Phase 3: CalendarButton 개선 (Day 4)
  ├─ 드롭다운 UI
  ├─ 전체/즐겨찾기 로직
  └─ CalendarButton에 연결

Phase 4: 이미지 & 접근성 (Day 4-5)
  ├─ Fallback 이미지
  ├─ Focus trap
  ├─ ESC/Tab 키보드 핸들링
  └─ ARIA 속성

Phase 5: 품질 보증 (Day 5)
  ├─ 크로스 브라우저 테스트
  ├─ ICS 파일 캘린더 앱 테스트
  ├─ 성능 측정 (Lighthouse)
  └─ 접근성 검증 (axe DevTools)
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

```typescript
// utils/icsGenerator.test.ts

describe('ICS Generator', () => {
  test('generateICS: 유효한 이벤트 배열로 ICS 생성', () => {
    const events = [mockMarathonEvent];
    const ics = generateICS(events);

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain(mockMarathonEvent.name);
  });

  test('createVEvent: VALARM 2개 포함', () => {
    const vevent = createVEvent(mockMarathonEvent, {
      includeAlarms: true,
      alarmOffsets: [-7, -1],
    });

    const alarmCount = (vevent.match(/BEGIN:VALARM/g) || []).length;
    expect(alarmCount).toBe(2);
  });

  test('sanitizeText: 특수문자 escape', () => {
    const text = 'Test; text, with\\nspecial chars';
    const sanitized = sanitizeText(text);

    expect(sanitized).toBe('Test\\; text\\, with\\\\nspecial chars');
  });
});
```

### 10.2 Integration Tests

```typescript
// Modal 오픈/닫기 테스트
test('MarathonCard 클릭 시 모달 오픈', () => {
  render(<App />);
  const card = screen.getByText('제2회 한강 서울 하프 마라톤');

  fireEvent.click(card);

  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

test('ESC 키로 모달 닫기', () => {
  render(<App />);
  const card = screen.getByText('제2회 한강 서울 하프 마라톤');

  fireEvent.click(card);
  fireEvent.keyDown(document, { key: 'Escape' });

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
```

### 10.3 E2E Tests (Manual)

| 테스트 케이스 | 절차 | 기대 결과 |
|--------------|------|----------|
| ICS 다운로드 (전체) | CalendarButton → "전체 대회" 클릭 | 501개 이벤트 ICS 다운로드 |
| ICS 다운로드 (즐겨찾기) | 5개 즐겨찾기 → "즐겨찾기만" 클릭 | 5개 이벤트 ICS 다운로드 |
| Apple Calendar Import | ICS 파일을 Apple Calendar에 import | 모든 이벤트 정상 표시 |
| Google Calendar Import | ICS 파일을 Google Calendar에 import | 모든 이벤트 정상 표시 |
| 모달 키보드 네비게이션 | Tab으로 버튼 이동 | Focus trap 정상 작동 |
| 이미지 없는 대회 | imageUrl 없는 이벤트 클릭 | Fallback 이미지 표시 |

---

## 11. Performance Considerations

### 11.1 Optimization Targets

| 항목 | 목표 | 측정 방법 |
|------|------|----------|
| 모달 오픈 시간 | < 300ms | Performance API |
| ICS 생성 시간 (100개) | < 100ms | console.time() |
| 이미지 로딩 | < 2초 | Network tab |
| 번들 크기 증가 | < 10KB | Vite build 분석 |

### 11.2 Implementation

```typescript
// 이미지 Lazy Loading
<img
  src={event.imageUrl}
  alt={event.name}
  loading="lazy"  // ← 브라우저 native lazy loading
/>

// ICS 생성 성능 측정
function generateICS(events: MarathonEvent[]): string {
  performance.mark('ics-generation-start');

  // ... 생성 로직 ...

  performance.mark('ics-generation-end');
  performance.measure(
    'ICS Generation',
    'ics-generation-start',
    'ics-generation-end'
  );

  return icsContent;
}

// 모달 애니메이션 최적화 (GPU 가속)
.modal-container {
  transform: translateY(0);  /* GPU 가속 */
  will-change: transform, opacity;
}
```

---

## 12. Accessibility Compliance

### 12.1 WCAG 2.1 AA 준수

| 기준 | 요구사항 | 구현 |
|------|----------|------|
| 1.4.3 Contrast | 명암비 4.5:1 이상 | ✅ 모든 텍스트 검증 |
| 2.1.1 Keyboard | 키보드만으로 조작 가능 | ✅ Tab, ESC, Enter 지원 |
| 2.4.3 Focus Order | 논리적 포커스 순서 | ✅ Focus trap 구현 |
| 3.2.1 On Focus | 포커스 시 예상치 못한 변경 없음 | ✅ 명시적 사용자 액션만 |
| 4.1.2 Name, Role, Value | ARIA 속성 적절히 사용 | ✅ role, aria-* 추가 |

### 12.2 ARIA Implementation

```tsx
<div
  className="modal-overlay"
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <div className="modal-container">
    <h2 id="modal-title">{event.name}</h2>
    <div id="modal-description">
      {event.date} · {event.region}
    </div>

    <button
      onClick={onClose}
      aria-label="모달 닫기"
    >
      <X />
    </button>

    <button
      onClick={() => onToggleFavorite(event.id)}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
    >
      <Heart />
    </button>
  </div>
</div>
```

---

## 13. Security Considerations

### 13.1 Potential Risks

| 리스크 | 설명 | 대응 |
|--------|------|------|
| XSS via event data | 악의적 이벤트명/설명 | sanitizeText() 처리 |
| URL Injection | 잘못된 registrationUrl | URL 검증 |
| Blob Memory Leak | URL.createObjectURL 정리 안 함 | URL.revokeObjectURL() 호출 |

### 13.2 Implementation

```typescript
// URL 검증
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// 등록 페이지 이동 시 검증
const handleRegister = () => {
  if (!event.registrationUrl || !isValidUrl(event.registrationUrl)) {
    alert('유효하지 않은 등록 URL입니다.');
    return;
  }
  window.open(event.registrationUrl, '_blank', 'noopener,noreferrer');
};
```

---

## 14. Future Enhancements

### 14.1 Phase 2 기능

- [ ] 스크래퍼에 이미지 크롤링 추가
- [ ] 실시간 등록 가능 여부 API
- [ ] 대회 코스 지도 표시 (Google Maps)
- [ ] 소셜 공유 기능 (카카오톡, 페이스북)
- [ ] 대회 후기 및 평점 시스템
- [ ] 날씨 정보 통합 (OpenWeather API)

### 14.2 Phase 3 고도화

- [ ] PWA Push Notification (접수 오픈 알림)
- [ ] 다국어 지원 (English, 日本語)
- [ ] AI 기반 대회 추천
- [ ] 러닝 크루 매칭 기능

---

## 15. Approval & Sign-off

- **Designer**: Claude AI (2026-01-21)
- **Reviewer**: _Pending_
- **Approver**: _Pending_

**Status**: ⏳ Awaiting Implementation

---

**📝 Document Version**: 1.0.0
**Last Updated**: 2026-01-21
**Next Phase**: Implementation (Do Phase)
