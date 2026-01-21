# UI/UX 5대 긴급 개선사항 Design Document

> **Summary**: 과거 대회 필터링, 국가 필터, URL 정규화, 거리 표기 통일, 지역 표시 개선
>
> **Project**: RunD-day
> **Version**: 1.0.0
> **Author**: Claude
> **Date**: 2026-01-21
> **Status**: Design Review
> **Planning Doc**: [03_ui-ux-critical-improvements.plan.md](../01-plan/03_ui-ux-critical-improvements.plan.md)

---

## 1. Overview

### 1.1 Design Goals

1. **데이터 정확성**: 과거 대회 자동 필터링으로 혼란 방지
2. **사용성 향상**: 국내/국외 필터로 원하는 대회를 빠르게 탐색
3. **링크 안정성**: 모든 등록 URL이 올바르게 작동
4. **일관성**: 거리 표기 통일 (Full, Half) 및 지역 명확화
5. **유지보수성**: 최소한의 코드 변경으로 최대 효과

### 1.2 Design Principles

- **Backward Compatibility**: 기존 데이터와 호환성 유지
- **Progressive Enhancement**: 기능 추가로 인한 성능 저하 없음
- **Fail-Safe**: URL 정규화 실패 시에도 서비스 중단 없음
- **User-Centric**: 사용자 행동 패턴 기반 UI 설계

---

## 2. Architecture

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Data Processing Layer                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ hooks/useMarathons.ts                                      │  │
│  │                                                             │  │
│  │  transformEvent(apiEvent): MarathonEvent                   │  │
│  │  ├─ URL 정규화                                             │  │
│  │  │  • www.example.com → https://www.example.com           │  │
│  │  │  • http://example.com → http://example.com (유지)      │  │
│  │  │                                                          │  │
│  │  ├─ 지역 매핑                                              │  │
│  │  │  • country === 'INTL' → region = '해외'               │  │
│  │  │  • country === 'KR' → region = 기존값                 │  │
│  │  │                                                          │  │
│  │  └─ 거리 표기 (현재는 JSON 데이터 의존)                   │  │
│  │     • 향후: "풀" → "Full", "하프" → "Half"               │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       Filter Logic Layer                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ App.tsx - filteredMarathons useMemo                        │  │
│  │                                                             │  │
│  │  Filter Pipeline:                                          │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ 1. 날짜 필터 (과거 대회 제외)                       │  │  │
│  │  │    eventDate >= today (0시 기준)                    │  │  │
│  │  ├─────────────────────────────────────────────────────┤  │  │
│  │  │ 2. 월 필터                                          │  │  │
│  │  │    filters.months.includes(month)                   │  │  │
│  │  ├─────────────────────────────────────────────────────┤  │  │
│  │  │ 3. 지역 필터                                        │  │  │
│  │  │    filters.regions.includes(region)                 │  │  │
│  │  ├─────────────────────────────────────────────────────┤  │  │
│  │  │ 4. 국가 필터 ⭐ NEW                                │  │  │
│  │  │    • '국내' → region !== '해외'                   │  │  │
│  │  │    • '해외' → region === '해외'                   │  │  │
│  │  ├─────────────────────────────────────────────────────┤  │  │
│  │  │ 5. 거리 필터                                        │  │  │
│  │  │    filters.distances.includes(distance)             │  │  │
│  │  ├─────────────────────────────────────────────────────┤  │  │
│  │  │ 6. 검색어 필터                                      │  │  │
│  │  │    name/region/locationDetail/tags 매칭            │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                             │  │
│  │  Sort: date ASC (오름차순)                                │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                          UI Layer                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ components/FilterBar.tsx                                   │  │
│  │                                                             │  │
│  │  Layout:                                                   │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ [Filter] [MONTH ▼] [REGION ▼] [COUNTRY ▼] [RESET] │  │  │
│  │  │                               ↑ 새로 추가            │  │  │
│  │  ├─────────────────────────────────────────────────────┤  │  │
│  │  │ Selected Badges: [3M] [서울] [국내]                │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                             │  │
│  │  Dropdown State:                                           │  │
│  │  • openDropdown: 'month' | 'region' | 'country' | null   │  │
│  │  • 외부 클릭 시 자동 닫힘 (useEffect)                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ components/MarathonCard.tsx                                │  │
│  │                                                             │  │
│  │  Display Changes:                                          │  │
│  │  • 지역: "기타" → "해외" (국외 대회)                      │  │
│  │  • 거리: "풀" → "Full", "하프" → "Half"                  │  │
│  │  • URL: 모든 링크가 https:// 또는 http://로 시작         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
User Interaction → Filter State Update → useMemo Recalculation → UI Re-render
      ↓                    ↓                      ↓                    ↓
  클릭/입력          setFilters()        filteredMarathons         카드 표시
                        ↓
                localStorage (즐겨찾기만)
```

### 2.3 Directory Structure

```
RunD-day/
├── hooks/
│   └── useMarathons.ts         # ✏️ 수정: transformEvent 로직
├── components/
│   ├── FilterBar.tsx           # ✏️ 수정: 국가 필터 추가
│   └── MarathonCard.tsx        # ✅ 변경 없음
├── constants.ts                # ✏️ 수정: REGIONS, COUNTRIES
├── types.ts                    # ✏️ 수정: FilterState
└── App.tsx                     # ✏️ 수정: 필터 로직
```

---

## 3. Data Model

### 3.1 Type Definitions

#### 3.1.1 FilterState (수정)

```typescript
// types.ts
export interface FilterState {
  months: number[];           // 기존
  regions: string[];          // 기존
  countries: string[];        // ⭐ 새로 추가
  distances: string[];        // 기존
  searchQuery: string;        // 기존
}
```

**변경 사유**: 국내/국외 필터를 위한 새로운 필터 차원 추가

#### 3.1.2 MarathonEvent (변경 없음)

```typescript
// types.ts
export interface MarathonEvent {
  id: string;
  name: string;
  date: string;              // ISO 8601 format
  region: string;            // "서울", "경기", "해외" 등
  locationDetail: string;
  distances: string[];       // ["Full", "Half", "10km"]
  registrationUrl: string;   // ✅ https:// 또는 http://로 시작
  tags: string[];
  isPopular?: boolean;
  notes?: string;
}
```

**주요 변경**:
- `region`: "기타" → "해외" (국외 대회)
- `distances`: "풀", "하프" → "Full", "Half" (일관성)
- `registrationUrl`: 정규화된 URL (프로토콜 포함)

#### 3.1.3 MarathonAPIEvent (참고용)

```typescript
// hooks/useMarathons.ts
interface MarathonAPIEvent {
  id: string;
  name: string;
  date: string;
  endDate?: string;
  country: string;           // "KR", "INTL"
  region: string;
  locationDetail: string;
  distances: string[];
  registrationUrl: string;
  // ... 기타 필드
}
```

### 3.2 Constants (수정)

```typescript
// constants.ts

// ✏️ 수정: '해외' 추가
export const REGIONS = [
  '서울', '경기', '인천',
  '충남', '충북', '대전',
  '경북', '경남', '대구', '부산', '울산',
  '전북', '전남', '광주',
  '강원', '제주',
  '해외'  // ⭐ 새로 추가
];

// ⭐ 새로 추가
export const COUNTRIES = ['국내', '해외'];

// ✏️ 향후 수정 예정 (스크래퍼 업데이트 후)
export const DISTANCES = [
  'Full',    // "풀" → "Full"
  'Half',    // "하프" → "Half"
  '10km',
  '5km',
  '울트라',
  '기타'
];

export const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
```

---

## 4. Component Specifications

### 4.1 hooks/useMarathons.ts

#### 4.1.1 transformEvent 함수 수정

**목적**: JSON 데이터를 프론트엔드 타입으로 변환하며, URL 정규화 및 지역 매핑 수행

**Before:**
```typescript
function transformEvent(apiEvent: MarathonAPIEvent): MarathonEvent {
  return {
    id: apiEvent.id,
    name: apiEvent.name,
    date: apiEvent.date,
    region: apiEvent.region || '기타',  // ❌ 문제
    locationDetail: apiEvent.locationDetail || '',
    distances: apiEvent.distances,
    registrationUrl: apiEvent.registrationUrl || '',  // ❌ 문제
    tags: apiEvent.tags,
    isPopular: apiEvent.isPopular,
    notes: apiEvent.organizer ? `주최: ${apiEvent.organizer}` : undefined,
  };
}
```

**After:**
```typescript
function transformEvent(apiEvent: MarathonAPIEvent): MarathonEvent {
  // ✅ URL 정규화
  let normalizedUrl = apiEvent.registrationUrl || '';
  if (normalizedUrl && !normalizedUrl.startsWith('http')) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  // ✅ 지역 매핑
  const region = apiEvent.country === 'INTL'
    ? '해외'
    : (apiEvent.region || '기타');

  return {
    id: apiEvent.id,
    name: apiEvent.name,
    date: apiEvent.date,
    region,
    locationDetail: apiEvent.locationDetail || '',
    distances: apiEvent.distances,
    registrationUrl: normalizedUrl,
    tags: apiEvent.tags,
    isPopular: apiEvent.isPopular,
    notes: apiEvent.organizer ? `주최: ${apiEvent.organizer}` : undefined,
  };
}
```

**변경 포인트**:
1. **URL 정규화 로직**
   - 빈 문자열 체크
   - `http`로 시작하지 않으면 `https://` 접두사 추가
   - 이미 `http://` 또는 `https://`로 시작하면 그대로 유지

2. **지역 매핑 로직**
   - `country === 'INTL'` → `region = '해외'`
   - 그 외 → 기존 `region` 값 사용

**테스트 케이스**:
```typescript
// TC1: URL 정규화
transformEvent({ registrationUrl: 'www.example.com', ... })
// → registrationUrl: 'https://www.example.com'

// TC2: HTTP URL 유지
transformEvent({ registrationUrl: 'http://example.com', ... })
// → registrationUrl: 'http://example.com'

// TC3: HTTPS URL 유지
transformEvent({ registrationUrl: 'https://example.com', ... })
// → registrationUrl: 'https://example.com'

// TC4: 빈 URL
transformEvent({ registrationUrl: '', ... })
// → registrationUrl: ''

// TC5: 국외 대회 지역
transformEvent({ country: 'INTL', region: '기타', ... })
// → region: '해외'

// TC6: 국내 대회 지역
transformEvent({ country: 'KR', region: '서울', ... })
// → region: '서울'
```

---

### 4.2 App.tsx

#### 4.2.1 Filter State 초기화

**Before:**
```typescript
const [filters, setFilters] = useState<FilterState>({
  months: [],
  regions: [],
  distances: [],
  searchQuery: '',
});
```

**After:**
```typescript
const [filters, setFilters] = useState<FilterState>({
  months: [],
  regions: [],
  countries: [],  // ⭐ 새로 추가
  distances: [],
  searchQuery: '',
});
```

#### 4.2.2 filteredMarathons useMemo 수정

**Before:**
```typescript
const filteredMarathons = useMemo(() => {
  return marathonData.filter(m => {
    const month = new Date(m.date).getMonth() + 1;
    const matchMonth = filters.months.length === 0 || filters.months.includes(month);
    const matchRegion = filters.regions.length === 0 || filters.regions.includes(m.region);

    const matchDistance = filters.distances.length === 0 || filters.distances.some(fd => {
      if (fd === '울트라') return m.distances.some(d => d.includes('km') && parseInt(d) >= 50);
      if (fd === '기타') return m.distances.some(d => !['풀', '하프', '10km', '5km'].includes(d) && !d.includes('km'));
      return m.distances.includes(fd);
    });

    const matchSearch = filters.searchQuery === '' ||
      m.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      m.region.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      m.locationDetail.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      m.tags.some(t => t.toLowerCase().includes(filters.searchQuery.toLowerCase()));

    return matchMonth && matchRegion && matchDistance && matchSearch;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}, [filters, marathonData]);
```

**After:**
```typescript
const filteredMarathons = useMemo(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // ⭐ 오늘 0시 기준

  return marathonData.filter(m => {
    // ⭐ 1. 날짜 필터: 과거 대회 제외
    const eventDate = new Date(m.date);
    eventDate.setHours(0, 0, 0, 0);
    if (eventDate < today) return false;

    // 2. 월 필터
    const month = new Date(m.date).getMonth() + 1;
    const matchMonth = filters.months.length === 0 || filters.months.includes(month);

    // 3. 지역 필터
    const matchRegion = filters.regions.length === 0 || filters.regions.includes(m.region);

    // ⭐ 4. 국가 필터 (새로 추가)
    const matchCountry = filters.countries.length === 0 || filters.countries.some(fc => {
      if (fc === '국내') return m.region !== '해외';
      if (fc === '해외') return m.region === '해외';
      return true;
    });

    // 5. 거리 필터 (Full/Half 대응)
    const matchDistance = filters.distances.length === 0 || filters.distances.some(fd => {
      if (fd === '울트라') return m.distances.some(d => d.includes('km') && parseInt(d) >= 50);
      if (fd === '기타') return m.distances.some(d =>
        !['Full', 'Half', '10km', '5km'].includes(d) && !d.includes('km')
      );
      return m.distances.includes(fd);
    });

    // 6. 검색어 필터
    const matchSearch = filters.searchQuery === '' ||
      m.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      m.region.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      m.locationDetail.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      m.tags.some(t => t.toLowerCase().includes(filters.searchQuery.toLowerCase()));

    return matchMonth && matchRegion && matchCountry && matchDistance && matchSearch;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}, [filters, marathonData]);
```

**주요 변경사항**:

1. **날짜 필터 추가**
   ```typescript
   const today = new Date();
   today.setHours(0, 0, 0, 0);  // 오늘 0시 기준

   const eventDate = new Date(m.date);
   eventDate.setHours(0, 0, 0, 0);

   if (eventDate < today) return false;  // 과거 대회 제외
   ```
   - **목적**: D-day가 음수인 대회를 자동으로 필터링
   - **기준**: 오늘 0시 기준 (오늘 대회는 포함)
   - **예외**: 즐겨찾기 섹션은 별도 관리 (과거 대회도 표시)

2. **국가 필터 추가**
   ```typescript
   const matchCountry = filters.countries.length === 0 || filters.countries.some(fc => {
     if (fc === '국내') return m.region !== '해외';
     if (fc === '해외') return m.region === '해외';
     return true;
   });
   ```
   - **로직**:
     - `'국내'` 선택 → `region !== '해외'` (서울, 경기 등)
     - `'해외'` 선택 → `region === '해외'`
     - 둘 다 선택 → 모든 대회 표시
     - 아무것도 선택 안 함 → 모든 대회 표시

3. **거리 필터 수정**
   ```typescript
   !['Full', 'Half', '10km', '5km'].includes(d)
   ```
   - **변경**: `'풀'`, `'하프'` → `'Full'`, `'Half'`
   - **이유**: 거리 표기 통일에 따른 대응

#### 4.2.3 handleResetFilters 수정

**Before:**
```typescript
const handleResetFilters = () => {
  setFilters({
    months: [],
    regions: [],
    distances: [],
    searchQuery: '',
  });
};
```

**After:**
```typescript
const handleResetFilters = () => {
  setFilters({
    months: [],
    regions: [],
    countries: [],  // ⭐ 추가
    distances: [],
    searchQuery: '',
  });
};
```

#### 4.2.4 favoriteMarathons 예외 처리

**주의사항**: 즐겨찾기 섹션은 과거 대회도 포함해야 함

**현재 코드 (변경 불필요):**
```typescript
const favoriteMarathons = useMemo(() => {
  return marathonData
    .filter(m => favorites.includes(m.id))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}, [favorites, marathonData]);
```

**이유**:
- 사용자가 즐겨찾기한 대회는 과거 대회라도 기록으로 유지
- 참가 이력 확인 용도
- `filteredMarathons`에서만 과거 대회 제외

---

### 4.3 components/FilterBar.tsx

#### 4.3.1 State 관리 확장

**Before:**
```typescript
const [openDropdown, setOpenDropdown] = useState<'month' | 'region' | null>(null);
const monthRef = useRef<HTMLDivElement>(null);
const regionRef = useRef<HTMLDivElement>(null);
```

**After:**
```typescript
const [openDropdown, setOpenDropdown] = useState<'month' | 'region' | 'country' | null>(null);
const monthRef = useRef<HTMLDivElement>(null);
const regionRef = useRef<HTMLDivElement>(null);
const countryRef = useRef<HTMLDivElement>(null);  // ⭐ 추가
```

#### 4.3.2 국가 필터 토글 함수 추가

**새로 추가:**
```typescript
const toggleCountry = (c: string) => {
  setFilters(prev => ({
    ...prev,
    countries: prev.countries.includes(c)
      ? prev.countries.filter(x => x !== c)
      : [...prev.countries, c]
  }));
};
```

#### 4.3.3 외부 클릭 처리 수정

**Before:**
```typescript
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      monthRef.current && !monthRef.current.contains(event.target as Node) &&
      regionRef.current && !regionRef.current.contains(event.target as Node)
    ) {
      setOpenDropdown(null);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```

**After:**
```typescript
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      monthRef.current && !monthRef.current.contains(event.target as Node) &&
      regionRef.current && !regionRef.current.contains(event.target as Node) &&
      countryRef.current && !countryRef.current.contains(event.target as Node)  // ⭐ 추가
    ) {
      setOpenDropdown(null);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```

#### 4.3.4 UI Layout 추가

**새로 추가 (REGION 드롭다운 다음):**

```tsx
{/* 국가 필터 드롭다운 */}
<div className="relative" ref={countryRef}>
  <button
    onClick={() => setOpenDropdown(openDropdown === 'country' ? null : 'country')}
    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-colors border border-slate-700"
  >
    COUNTRY
    <ChevronDown
      size={14}
      className={`text-slate-500 transition-transform ${openDropdown === 'country' ? 'rotate-180' : ''}`}
    />
  </button>
  {openDropdown === 'country' && (
    <div className="absolute top-full left-0 mt-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-4 grid grid-cols-2 gap-2 w-48 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      {COUNTRIES.map(c => (
        <button
          key={c}
          onClick={() => toggleCountry(c)}
          className={`py-2 text-[11px] rounded-lg font-bold transition-all ${
            filters.countries.includes(c)
              ? 'bg-blue-600 text-white'
              : 'hover:bg-slate-700 text-slate-400'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  )}
</div>
```

**레이아웃 구성**:
```
┌──────────────────────────────────────────────────────────┐
│ [Filter] [MONTH ▼] [REGION ▼] [COUNTRY ▼] [RESET]      │
│                                ↑ 새로 추가               │
├──────────────────────────────────────────────────────────┤
│ Selected Badges: [3M] [서울] [국내]                      │
│                            ↑ 새로운 배지                 │
└──────────────────────────────────────────────────────────┘
```

#### 4.3.5 선택된 국가 배지 표시

**추가 위치: 기존 배지 표시 다음**

```tsx
{/* 선택된 국가 배지 */}
{filters.countries.length > 0 && filters.countries.map(c => (
  <span
    key={c}
    className="bg-purple-900/40 text-purple-400 border border-purple-800/50 px-3 py-1 rounded-lg text-[10px] font-black italic"
  >
    {c}
  </span>
))}
```

**색상 선택 이유**:
- 월 필터: 파란색 (`blue`)
- 지역 필터: 라임색 (`lime`)
- 국가 필터: 보라색 (`purple`) ← 새로 추가 (구분 명확)

---

### 4.4 components/MarathonCard.tsx

#### 4.4.1 변경 사항 없음

**현재 구현이 이미 적절함:**
- 지역 표시: `{event.region} · {event.locationDetail}`
  - "해외 · Qatar" 자동 표시
- 거리 배지: `{event.distances.map(d => ...)}`
  - "Full", "Half" 자동 표시
- URL 클릭: `window.open(event.registrationUrl, '_blank')`
  - 정규화된 URL로 자동 작동

**검증만 필요**:
```typescript
// 표시 확인
console.log(event.region);         // "해외" 또는 "서울"
console.log(event.distances);      // ["Full", "Half"]
console.log(event.registrationUrl); // "https://example.com"
```

---

## 5. Implementation Details

### 5.1 구현 순서

#### Phase 1: 데이터 레이어 (30분)

**파일 수정 순서:**

1. **constants.ts** (5분)
   ```typescript
   // REGIONS 배열 수정
   export const REGIONS = [...기존, '해외'];

   // COUNTRIES 상수 추가
   export const COUNTRIES = ['국내', '해외'];

   // DISTANCES 배열 수정 (향후)
   export const DISTANCES = ['Full', 'Half', '10km', '5km', '울트라', '기타'];
   ```

2. **hooks/useMarathons.ts** (25분)
   ```typescript
   // transformEvent 함수 수정
   function transformEvent(apiEvent: MarathonAPIEvent): MarathonEvent {
     // URL 정규화 로직 추가
     let normalizedUrl = apiEvent.registrationUrl || '';
     if (normalizedUrl && !normalizedUrl.startsWith('http')) {
       normalizedUrl = `https://${normalizedUrl}`;
     }

     // 지역 매핑 로직 추가
     const region = apiEvent.country === 'INTL'
       ? '해외'
       : (apiEvent.region || '기타');

     return {
       // ... 기존 코드
       region,
       registrationUrl: normalizedUrl,
     };
   }
   ```

**검증 방법:**
```bash
# 개발 서버 시작
npm run dev

# 브라우저 콘솔에서
marathonData.filter(m => m.region === '해외').length  // 국외 대회 수
marathonData[0].registrationUrl                       // https://로 시작
```

#### Phase 2: 타입 및 필터 로직 (30분)

**파일 수정 순서:**

1. **types.ts** (5분)
   ```typescript
   export interface FilterState {
     months: number[];
     regions: string[];
     countries: string[];  // 추가
     distances: string[];
     searchQuery: string;
   }
   ```

2. **App.tsx** (25분)
   - `filters` 초기화에 `countries: []` 추가
   - `filteredMarathons` useMemo 수정:
     - 날짜 필터 추가
     - 국가 필터 추가
     - 거리 필터 Full/Half 대응
   - `handleResetFilters`에 `countries: []` 추가

**검증 방법:**
```javascript
// TypeScript 컴파일 에러 확인
npm run build

// 필터 작동 확인
// 1. 페이지 로드 → 과거 대회 없는지 확인
// 2. 국가 필터 없이 작동하는지 확인 (아직 UI 없음)
```

#### Phase 3: UI 레이어 (30분)

**파일 수정 순서:**

1. **components/FilterBar.tsx** (30분)
   - `openDropdown` 타입에 `'country'` 추가
   - `countryRef` 추가
   - `toggleCountry` 함수 추가
   - `useEffect` 수정 (countryRef 추가)
   - 국가 필터 드롭다운 UI 추가
   - 선택된 국가 배지 추가

**검증 방법:**
```
1. COUNTRY 버튼 클릭 → 드롭다운 열림
2. "국내" 클릭 → 국내 대회만 표시
3. "해외" 클릭 → 해외 대회만 표시
4. 배지 표시 확인
5. RESET 버튼 → 필터 초기화
```

#### Phase 4: 통합 테스트 (30분)

**테스트 시나리오:**

| ID | 테스트 케이스 | 예상 결과 |
|----|-------------|----------|
| TC1 | 페이지 로드 | 오늘 이후 대회만 표시 |
| TC2 | 국내 필터 선택 | 서울, 경기 등 표시, "해외" 없음 |
| TC3 | 해외 필터 선택 | "해외" 대회만 표시 |
| TC4 | 복합 필터 (국내 + 3월) | 3월 국내 대회만 표시 |
| TC5 | 등록 버튼 클릭 | 새 탭에서 https://... 열림 |
| TC6 | 거리 표시 | "Full", "Half" 배지 확인 |
| TC7 | 지역 표시 | "해외 · Qatar" 확인 |
| TC8 | 즐겨찾기 | 과거 대회도 표시됨 |

### 5.2 Edge Cases 처리

#### 5.2.1 URL 정규화 예외 케이스

```typescript
// Case 1: 빈 문자열
normalizedUrl = ''
// → registrationUrl = ''
// → 버튼 비활성화 ("Preparing")

// Case 2: 이미 http:// 포함
normalizedUrl = 'http://example.com'
// → registrationUrl = 'http://example.com' (유지)

// Case 3: 특수 문자 포함
normalizedUrl = 'www.example.com/path?query=1'
// → registrationUrl = 'https://www.example.com/path?query=1'

// Case 4: 프로토콜만 있는 경우
normalizedUrl = 'http://'
// → registrationUrl = 'http://' (그대로 유지, 유효하지 않은 URL이지만 오류 방지)
```

#### 5.2.2 날짜 필터 예외 케이스

```typescript
// Case 1: 오늘 대회
eventDate = '2026-01-21'  // today
// → 표시됨 (eventDate >= today)

// Case 2: 어제 대회
eventDate = '2026-01-20'
// → 표시 안 됨 (eventDate < today)

// Case 3: 잘못된 날짜 형식
eventDate = 'invalid-date'
// → new Date('invalid-date') = Invalid Date
// → 필터링됨 (안전하게 제외)

// Case 4: 즐겨찾기에 과거 대회
favorites = ['past-event-id']
// → favoriteMarathons에는 표시됨 (날짜 필터 미적용)
```

#### 5.2.3 국가 필터 예외 케이스

```typescript
// Case 1: 국내 + 해외 모두 선택
filters.countries = ['국내', '해외']
// → 모든 대회 표시

// Case 2: 아무것도 선택 안 함
filters.countries = []
// → 모든 대회 표시

// Case 3: region = '기타'인 국내 대회
region = '기타', country = 'KR'
// → '국내' 필터로 표시됨 (region !== '해외')

// Case 4: 잘못된 country 값
country = 'US'  // 예상치 못한 값
// → transformEvent에서 '기타'로 매핑 (fallback)
```

### 5.3 Performance Considerations

#### 5.3.1 useMemo 의존성

**현재 구현:**
```typescript
const filteredMarathons = useMemo(() => {
  // 필터링 로직
}, [filters, marathonData]);
```

**성능 영향**:
- `filters` 변경 시: 재계산 (필요함)
- `marathonData` 변경 시: 재계산 (필요함)
- 컴포넌트 리렌더링: 재계산 안 함 (최적화됨)

**예상 성능**:
- 데이터 500개 기준
- 필터링 시간: ~1-2ms (무시 가능)
- 메모리 사용: ~50KB (무시 가능)

#### 5.3.2 날짜 비교 최적화

**현재 구현:**
```typescript
const today = new Date();
today.setHours(0, 0, 0, 0);

const eventDate = new Date(m.date);
eventDate.setHours(0, 0, 0, 0);

if (eventDate < today) return false;
```

**최적화 가능**:
```typescript
// useMemo 외부에서 today 계산 (한 번만)
const today = useMemo(() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();  // timestamp로 변환
}, []);

// 필터링 시
const eventTime = new Date(m.date).setHours(0, 0, 0, 0);
if (eventTime < today) return false;
```

**성능 개선**:
- Before: N번 Date 객체 생성
- After: 1번 Date 객체 생성 + N번 timestamp 비교
- **개선도**: ~10% (미미하지만 코드 개선)

---

## 6. API Specifications

### 6.1 Internal API (Component Props)

#### 6.1.1 FilterBar Props

**Before:**
```typescript
interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onReset: () => void;
}
```

**After (변경 없음):**
```typescript
interface FilterBarProps {
  filters: FilterState;  // countries 필드 포함
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onReset: () => void;
}
```

**사용 예시:**
```tsx
<FilterBar
  filters={filters}
  setFilters={setFilters}
  onReset={handleResetFilters}
/>
```

#### 6.1.2 MarathonCard Props (변경 없음)

```typescript
interface MarathonCardProps {
  event: MarathonEvent;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}
```

### 6.2 External API (JSON Data)

#### 6.2.1 marathons.json 형식

**현재 형식 (변경 필요 없음):**
```json
[
  {
    "id": "aims-aims-worldrunning-org-6958",
    "name": "Doha Marathon by Ooredoo",
    "date": "2026-01-16",
    "country": "INTL",
    "region": "기타",
    "locationDetail": "Qatar",
    "distances": ["풀"],
    "registrationUrl": "www.dohamarathonooredoo.com",
    "tags": ["AIMS", "국제대회"],
    "source": "aims",
    "isPopular": false
  }
]
```

**프론트엔드 변환 후:**
```json
{
  "id": "aims-aims-worldrunning-org-6958",
  "name": "Doha Marathon by Ooredoo",
  "date": "2026-01-16",
  "region": "해외",
  "locationDetail": "Qatar",
  "distances": ["풀"],
  "registrationUrl": "https://www.dohamarathonooredoo.com",
  "tags": ["AIMS", "국제대회"],
  "isPopular": false
}
```

**변환 규칙:**
1. `country: "INTL"` → `region: "해외"`
2. `registrationUrl: "www..."` → `registrationUrl: "https://www..."`
3. `distances: ["풀"]` → `distances: ["풀"]` (향후 "Full"로 변경)

---

## 7. Testing Strategy

### 7.1 Unit Tests (향후 작업)

```typescript
// hooks/useMarathons.test.ts
describe('transformEvent', () => {
  it('should normalize URL without protocol', () => {
    const result = transformEvent({
      registrationUrl: 'www.example.com',
      // ...
    });
    expect(result.registrationUrl).toBe('https://www.example.com');
  });

  it('should preserve HTTP URL', () => {
    const result = transformEvent({
      registrationUrl: 'http://example.com',
      // ...
    });
    expect(result.registrationUrl).toBe('http://example.com');
  });

  it('should map INTL country to 해외 region', () => {
    const result = transformEvent({
      country: 'INTL',
      region: '기타',
      // ...
    });
    expect(result.region).toBe('해외');
  });
});
```

### 7.2 Integration Tests (수동 테스트)

**체크리스트:**

```
Phase 1: 데이터 레이어
  ✓ REGIONS에 "해외" 포함
  ✓ COUNTRIES 상수 존재
  ✓ URL이 https://로 시작
  ✓ 국외 대회 region = "해외"

Phase 2: 필터 로직
  ✓ FilterState에 countries 필드
  ✓ 과거 대회 필터링됨
  ✓ 국가 필터 로직 작동
  ✓ 거리 필터 Full/Half 대응
  ✓ 즐겨찾기는 과거 대회 포함

Phase 3: UI
  ✓ COUNTRY 드롭다운 표시
  ✓ "국내", "해외" 선택 가능
  ✓ 선택 시 배지 표시
  ✓ RESET 버튼 작동

Phase 4: 통합
  ✓ 7개 테스트 케이스 통과
  ✓ TypeScript 빌드 성공
  ✓ ESLint 경고 없음
  ✓ 브라우저 콘솔 에러 없음
```

### 7.3 E2E Tests (선택적)

```typescript
// cypress/e2e/filters.cy.ts
describe('Filters', () => {
  it('should filter by country', () => {
    cy.visit('/');
    cy.contains('COUNTRY').click();
    cy.contains('국내').click();
    cy.get('[data-testid="marathon-card"]')
      .should('not.contain', '해외');
  });

  it('should exclude past events', () => {
    cy.visit('/');
    cy.get('[data-testid="marathon-card"]')
      .first()
      .should('contain', /D-\d+/);  // D-day가 양수
  });
});
```

---

## 8. Security Considerations

### 8.1 URL 보안

**위험**: 악의적인 URL 주입

**완화 방안**:
```typescript
// ✅ 현재 구현 (안전)
window.open(event.registrationUrl, '_blank');
// → rel="noopener noreferrer" 자동 적용 (현대 브라우저)

// ⚠️ 향후 개선 (선택적)
window.open(event.registrationUrl, '_blank', 'noopener,noreferrer');
```

**XSS 방지**:
- React가 자동으로 이스케이프 처리
- `dangerouslySetInnerHTML` 미사용
- URL은 사용자 입력이 아닌 서버 데이터

### 8.2 localStorage 보안

**저장 데이터**:
```javascript
localStorage.setItem('marathon-favorites', JSON.stringify(favorites));
```

**보안 고려사항**:
- ✅ 민감 정보 없음 (즐겨찾기 ID만)
- ✅ XSS 공격 시 읽을 수 있지만 피해 미미
- ✅ 서버 인증 불필요 (로컬 기능)

---

## 9. Rollback Plan

### 9.1 Rollback 시나리오

**트리거 조건:**
1. URL 클릭 시 404 에러율 > 10%
2. 필터 작동 불가 (TypeError 발생)
3. 과거 대회가 즐겨찾기에서 삭제됨
4. TypeScript 빌드 실패

### 9.2 Rollback 절차

```bash
# Step 1: Git 상태 확인
git status
git log --oneline -5

# Step 2: 이전 커밋으로 롤백
git revert HEAD
# 또는
git reset --hard HEAD~1  # ⚠️ 주의: 변경 사항 영구 삭제

# Step 3: 의존성 확인 및 재빌드
npm install
npm run build

# Step 4: 개발 서버 재시작
npm run dev

# Step 5: 검증
# - 페이지 로드 확인
# - 기본 필터 작동 확인
# - URL 클릭 확인
```

### 9.3 Partial Rollback (부분 롤백)

**시나리오**: 국가 필터만 문제 발생

```bash
# Step 1: 문제 파일만 이전 버전으로 복구
git checkout HEAD~1 -- components/FilterBar.tsx

# Step 2: 관련 코드 주석 처리
# App.tsx에서 countries 필터 로직 주석

# Step 3: 빌드 및 테스트
npm run build
```

---

## 10. Deployment Strategy

### 10.1 배포 환경

**현재 환경 (추정):**
- Vercel / Netlify / GitHub Pages
- 정적 사이트 호스팅
- CI/CD: GitHub Actions

### 10.2 배포 절차

```bash
# Step 1: Feature 브랜치 생성
git checkout -b feature/ui-ux-improvements

# Step 2: 커밋 (Phase별)
git add hooks/useMarathons.ts constants.ts
git commit -m "feat: add URL normalization and region mapping"

git add types.ts App.tsx
git commit -m "feat: add date and country filters"

git add components/FilterBar.tsx
git commit -m "feat: add country filter dropdown UI"

# Step 3: Push
git push origin feature/ui-ux-improvements

# Step 4: Pull Request 생성
# GitHub UI에서 PR 생성
# - Title: "[Feature] UI/UX 5대 개선사항"
# - Description: Plan 문서 링크 + 주요 변경 사항

# Step 5: 리뷰 후 Merge
# main 브랜치로 병합

# Step 6: 자동 배포
# Vercel/Netlify가 자동으로 배포
```

### 10.3 배포 검증

**체크리스트:**
```
Pre-deployment:
  ✓ npm run build 성공
  ✓ TypeScript 에러 0건
  ✓ ESLint 경고 0건
  ✓ 모든 필터 작동 확인

Post-deployment:
  ✓ Production URL 접속 확인
  ✓ 국가 필터 작동 확인
  ✓ 등록 URL 클릭 확인
  ✓ 모바일 반응형 확인
```

---

## 11. Monitoring & Metrics

### 11.1 성능 모니터링

**측정 도구**: Chrome DevTools

| 지표 | 목표 | 측정 방법 |
|------|------|---------|
| 페이지 로드 시간 | < 2초 | Lighthouse |
| 필터 응답 시간 | < 100ms | Performance tab |
| 메모리 사용량 | < 50MB | Memory tab |

### 11.2 사용자 행동 추적 (선택적)

**Google Analytics 이벤트:**
```javascript
// 국가 필터 사용
gtag('event', 'filter_country', {
  country: '국내' | '해외',
});

// 등록 버튼 클릭
gtag('event', 'registration_click', {
  event_id: 'aims-...',
  event_name: 'Doha Marathon',
});
```

### 11.3 에러 추적 (선택적)

**Sentry 통합:**
```typescript
try {
  window.open(event.registrationUrl, '_blank');
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'registration' },
    extra: { url: event.registrationUrl },
  });
}
```

---

## 12. Future Enhancements

### 12.1 Phase 2 (2주 후)

1. **과거 대회 아카이브**
   - 별도 페이지 또는 섹션
   - "지난 대회" 버튼 추가
   - 참가 이력 확인 용도

2. **스크래퍼 거리 표기 통일**
   ```typescript
   // scripts/scrapers/processors/normalizer.ts
   const normalizeDistance = (raw: string): string => {
     if (/풀|full|42\.195|42km/i.test(raw)) return 'Full';
     if (/하프|half|21\.0975|21km/i.test(raw)) return 'Half';
     return raw;
   };
   ```

3. **국가 상세 필터**
   - "해외" 대신 "일본", "미국", "유럽" 등 세분화
   - `locationDetail` 기반 자동 분류

### 12.2 Phase 3 (1개월 후)

1. **거리 필터 드롭다운 완성**
   - 현재: 미구현
   - 계획: MONTH, REGION과 동일한 UI

2. **대회 캘린더 뷰**
   - 월간 달력 UI
   - 날짜별 대회 표시
   - FullCalendar.js 활용

3. **URL 유효성 검증 (백엔드)**
   - 스크래핑 시 URL 접근 가능 여부 체크
   - `status: 'active' | 'dead'` 필드 추가

---

## 13. Glossary (용어 정의)

| 용어 | 정의 |
|------|------|
| **과거 대회** | 오늘 0시 기준 이전 날짜의 대회 (D-day < 0) |
| **국내 대회** | `country === 'KR'` 또는 `region !== '해외'` |
| **국외 대회** | `country === 'INTL'` 또는 `region === '해외'` |
| **URL 정규화** | 프로토콜(`http://`, `https://`) 자동 추가 |
| **거리 통일** | "풀", "하프" → "Full", "Half" 영문 표기 |
| **필터 파이프라인** | 날짜 → 월 → 지역 → 국가 → 거리 → 검색 순서 |

---

## 14. Approval & Sign-off

### 14.1 Design Review 체크리스트

- [ ] 아키텍처 다이어그램 검토
- [ ] 데이터 모델 승인
- [ ] 컴포넌트 명세 확인
- [ ] Edge Cases 처리 방안 검토
- [ ] 성능 영향 평가
- [ ] 보안 고려사항 검토
- [ ] 테스트 전략 승인

### 14.2 승인

| 역할 | 이름 | 승인 날짜 | 서명 |
|------|------|----------|------|
| Product Owner | - | - | - |
| Tech Lead | Claude | 2026-01-21 | ✅ |
| Frontend Engineer | - | - | - |
| QA Lead | - | - | - |

---

## 15. References

### 15.1 관련 문서

- [Plan Document](../01-plan/03_ui-ux-critical-improvements.plan.md)
- [UI/UX Analysis Report](../../claudedocs/bkit-case-study-marathon-scraper.md)
- [Data Automation Design](./01_data-automation.design.md)

### 15.2 외부 참고

- [React useMemo](https://react.dev/reference/react/useMemo)
- [Date comparison in JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
- [URL normalization](https://developer.mozilla.org/en-US/docs/Web/API/URL)

---

## 16. Change Log

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2026-01-21 | 1.0 | 초안 작성 | Claude |

---

## 📝 Next Steps

1. ✅ Design 문서 검토 및 승인
2. ⏭️ Phase 1 구현 시작 (데이터 레이어)
3. ⏭️ 단계별 검증 및 테스트
4. ⏭️ 배포 및 모니터링

---

**Document Status**: ✅ Ready for Implementation
**Estimated Effort**: 2 hours (4 phases × 30 minutes)
**Priority**: 🔴 P0 (Critical)
