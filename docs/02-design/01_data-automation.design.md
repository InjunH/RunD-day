# 마라톤 데이터 자동화 Design Document

> **Summary**: 멀티 소스 마라톤 데이터 스크래핑 및 자동 업데이트 시스템 상세 설계
>
> **Project**: RunD-day
> **Version**: 0.0.0
> **Author**: InjunH + Claude
> **Date**: 2026-01-20
> **Status**: Draft
> **Planning Doc**: [01_data-automation.plan.md](../01-plan/01_data-automation.plan.md)

---

## 1. Overview

### 1.1 Design Goals

1. **확장성**: 새로운 데이터 소스를 쉽게 추가할 수 있는 구조
2. **안정성**: 특정 소스 실패 시에도 전체 시스템 동작
3. **데이터 품질**: 중복 제거, 정규화로 일관된 데이터 제공
4. **무비용 운영**: GitHub Actions + 정적 파일로 서버 비용 없음

### 1.2 Design Principles

- **Single Responsibility**: 각 스크래퍼는 하나의 소스만 담당
- **Open/Closed**: 새 소스 추가 시 기존 코드 수정 최소화
- **Fail-Safe**: 개별 실패가 전체 시스템에 영향 주지 않음

---

## 2. Architecture

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        GitHub Actions Workflow                          │
│                     (runs daily at 06:00 KST)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        Scraper Layer                              │  │
│  │                                                                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │  │
│  │  │  gorunning  │  │    AIMS     │  │ marathongo  │  ...future    │  │
│  │  │  Scraper    │  │   Parser    │  │  Scraper    │  scrapers     │  │
│  │  │             │  │  (ICS)      │  │             │               │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘               │  │
│  │         │                │                │                       │  │
│  │         └────────────────┼────────────────┘                       │  │
│  │                          ▼                                        │  │
│  │              ┌─────────────────────┐                              │  │
│  │              │  RawMarathonEvent[] │ ← 각 소스별 원시 데이터       │  │
│  │              └──────────┬──────────┘                              │  │
│  └─────────────────────────┼────────────────────────────────────────┘  │
│                            ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     Processing Layer                              │  │
│  │                                                                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │  │
│  │  │ Normalizer  │─▶│ Deduplicator│─▶│  Validator  │               │  │
│  │  │             │  │             │  │             │               │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │  │
│  │                                           │                       │  │
│  └───────────────────────────────────────────┼──────────────────────┘  │
│                                              ▼                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                       Output Layer                                │  │
│  │                                                                    │  │
│  │  ┌─────────────────────────────────────────────────────────┐     │  │
│  │  │  public/data/marathons.json                             │     │  │
│  │  │  public/data/marathons-kr.json (국내만)                  │     │  │
│  │  │  public/data/marathons-intl.json (해외만)               │     │  │
│  │  │  public/data/metadata.json (업데이트 정보)               │     │  │
│  │  └─────────────────────────────────────────────────────────┘     │  │
│  │                          │                                        │  │
│  └──────────────────────────┼───────────────────────────────────────┘  │
│                             │                                           │
│                    git add & commit & push                              │
└─────────────────────────────┼───────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                                 │
│                                                                          │
│   useEffect(() => {                                                      │
│     fetch('/data/marathons.json')                                        │
│       .then(res => res.json())                                           │
│       .then(data => setMarathons(data))                                  │
│   }, [])                                                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Directory Structure

```
RunD-day/
├── scripts/
│   └── scrapers/
│       ├── index.ts              # 메인 실행 파일
│       ├── types.ts              # 스크래퍼 타입 정의
│       ├── sources/
│       │   ├── gorunning.ts      # gorunning.kr 스크래퍼
│       │   ├── aims.ts           # AIMS ICS 파서
│       │   └── marathongo.ts     # marathongo.co.kr 스크래퍼
│       ├── processors/
│       │   ├── normalizer.ts     # 데이터 정규화
│       │   ├── deduplicator.ts   # 중복 제거
│       │   └── validator.ts      # 데이터 검증
│       └── utils/
│           ├── logger.ts         # 로깅 유틸리티
│           └── http.ts           # HTTP 요청 유틸리티
├── public/
│   └── data/
│       ├── marathons.json        # 전체 데이터
│       ├── marathons-kr.json     # 국내 데이터
│       ├── marathons-intl.json   # 해외 데이터
│       └── metadata.json         # 메타데이터
├── .github/
│   └── workflows/
│       └── scrape-marathons.yml  # GitHub Actions 워크플로우
└── types.ts                      # 프론트엔드 타입 (확장)
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| gorunning scraper | Playwright | 동적 페이지 스크래핑 |
| aims parser | node-fetch, ical.js | ICS 피드 파싱 |
| normalizer | - | 데이터 형식 통일 |
| deduplicator | - | 중복 이벤트 제거 |
| validator | zod | 스키마 검증 |

---

## 3. Data Model

### 3.1 Extended Type Definition

```typescript
// scripts/scrapers/types.ts

// 데이터 소스 식별자
export type DataSource =
  | 'gorunning'
  | 'aims'
  | 'marathongo'
  | 'manual';

// 국가 코드
export type CountryCode =
  | 'KR'    // 한국
  | 'JP'    // 일본
  | 'US'    // 미국
  | 'DE'    // 독일
  | 'UK'    // 영국
  | 'INTL'; // 기타 해외

// 등록 상태
export type RegistrationStatus =
  | 'upcoming'  // 등록 예정
  | 'open'      // 등록 중
  | 'closed'    // 마감
  | 'unknown';  // 알 수 없음

// 원시 스크래핑 데이터 (각 소스에서 수집한 형태)
export interface RawMarathonEvent {
  source: DataSource;
  sourceId: string;           // 소스 내 고유 ID
  name: string;
  date: string;               // YYYY-MM-DD
  endDate?: string;           // 다일 이벤트의 경우
  location: {
    country: CountryCode;
    region?: string;          // 지역 (서울, 부산 등)
    detail?: string;          // 상세 위치
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  distances: string[];
  registrationUrl?: string;
  organizer?: string;
  registration?: {
    status: RegistrationStatus;
    startDate?: string;
    endDate?: string;
  };
  price?: Array<{
    distance: string;
    amount: number;
    currency: string;
  }>;
  tags?: string[];
  rawData?: Record<string, unknown>;  // 디버깅용 원본 데이터
}

// 정규화된 최종 데이터 (프론트엔드에서 사용)
export interface MarathonEvent {
  // 식별자
  id: string;                 // 정규화된 고유 ID (source-sourceId)

  // 기본 정보
  name: string;
  date: string;               // YYYY-MM-DD
  endDate?: string;

  // 위치 정보
  country: CountryCode;
  region: string;
  locationDetail: string;

  // 대회 정보
  distances: string[];
  registrationUrl: string;
  organizer?: string;

  // 등록 정보
  registrationStatus: RegistrationStatus;
  registrationStart?: string;
  registrationEnd?: string;

  // 가격 정보
  price?: Array<{
    distance: string;
    amount: number;
    currency: string;
  }>;

  // 메타 정보
  tags: string[];
  source: DataSource;
  isPopular?: boolean;

  // 시스템 정보
  lastUpdated: string;        // ISO 8601
  notes?: string;
}

// 메타데이터
export interface ScrapingMetadata {
  lastRun: string;            // ISO 8601
  nextScheduledRun: string;
  sources: Array<{
    name: DataSource;
    status: 'success' | 'failed' | 'partial';
    itemCount: number;
    lastUpdated: string;
    error?: string;
  }>;
  totalEvents: number;
  krEvents: number;
  intlEvents: number;
}
```

### 3.2 Type Compatibility (기존 타입과 호환)

```typescript
// types.ts (프론트엔드) - 확장
// 기존 MarathonEvent 인터페이스에 새 필드 추가

export interface MarathonEvent {
  // 기존 필드 (하위 호환성 유지)
  id: string;
  name: string;
  date: string;
  region: string;
  locationDetail: string;
  distances: string[];
  registrationUrl: string;
  tags: string[];
  isPopular?: boolean;
  notes?: string;

  // 새 필드 (optional로 추가하여 하위 호환성 유지)
  country?: 'KR' | 'JP' | 'US' | 'DE' | 'UK' | 'INTL';
  endDate?: string;
  organizer?: string;
  registrationStatus?: 'upcoming' | 'open' | 'closed' | 'unknown';
  registrationStart?: string;
  registrationEnd?: string;
  price?: Array<{
    distance: string;
    amount: number;
    currency: string;
  }>;
  source?: 'gorunning' | 'aims' | 'marathongo' | 'manual';
  lastUpdated?: string;
}
```

---

## 4. Scraper Specifications

### 4.1 Interface Definition

```typescript
// scripts/scrapers/types.ts

export interface ScraperResult {
  success: boolean;
  source: DataSource;
  events: RawMarathonEvent[];
  error?: string;
  metadata: {
    scrapedAt: string;
    totalFound: number;
    processedCount: number;
  };
}

export interface Scraper {
  name: DataSource;
  scrape(): Promise<ScraperResult>;
}
```

### 4.2 gorunning.kr Scraper

**URL**: `https://gorunning.kr/races`

**스크래핑 전략**:
1. Playwright로 페이지 로드 (SSR/CSR 대응)
2. 테이블 데이터 파싱
3. 상세 페이지 방문하여 추가 정보 수집

**예상 데이터 구조**:
```typescript
// gorunning.kr 테이블 컬럼
{
  date: string;       // "2026.03.15"
  name: string;       // "서울마라톤"
  organizer: string;  // "동아일보"
  location: string;   // "서울 광화문"
  status: string;     // "접수중" | "접수예정" | "마감"
  link: string;       // 상세 페이지 URL
}
```

**구현**:
```typescript
// scripts/scrapers/sources/gorunning.ts
import { chromium } from 'playwright';
import type { Scraper, ScraperResult, RawMarathonEvent } from '../types';

export class GoRunningScraper implements Scraper {
  name = 'gorunning' as const;
  private baseUrl = 'https://gorunning.kr';

  async scrape(): Promise<ScraperResult> {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
      await page.goto(`${this.baseUrl}/races`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // 테이블 데이터 추출
      const events = await page.evaluate(() => {
        const rows = document.querySelectorAll('table tbody tr');
        return Array.from(rows).map(row => {
          const cells = row.querySelectorAll('td');
          return {
            date: cells[0]?.textContent?.trim(),
            name: cells[1]?.textContent?.trim(),
            organizer: cells[2]?.textContent?.trim(),
            location: cells[3]?.textContent?.trim(),
            status: cells[4]?.textContent?.trim(),
            link: cells[1]?.querySelector('a')?.href,
          };
        });
      });

      // RawMarathonEvent로 변환
      const marathonEvents: RawMarathonEvent[] = events
        .filter(e => e.date && e.name)
        .map(e => this.transformToRaw(e));

      return {
        success: true,
        source: this.name,
        events: marathonEvents,
        metadata: {
          scrapedAt: new Date().toISOString(),
          totalFound: events.length,
          processedCount: marathonEvents.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        source: this.name,
        events: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          scrapedAt: new Date().toISOString(),
          totalFound: 0,
          processedCount: 0,
        },
      };
    } finally {
      await browser.close();
    }
  }

  private transformToRaw(raw: any): RawMarathonEvent {
    return {
      source: this.name,
      sourceId: this.generateId(raw),
      name: raw.name,
      date: this.parseDate(raw.date),
      location: {
        country: 'KR',
        region: this.extractRegion(raw.location),
        detail: raw.location,
      },
      distances: [],  // 상세 페이지에서 추출 필요
      registrationUrl: raw.link,
      organizer: raw.organizer,
      registration: {
        status: this.parseStatus(raw.status),
      },
      rawData: raw,
    };
  }

  private generateId(raw: any): string {
    // 이름 + 날짜로 고유 ID 생성
    return `${raw.name}-${raw.date}`.replace(/[^a-zA-Z0-9가-힣]/g, '-');
  }

  private parseDate(dateStr: string): string {
    // "2026.03.15" → "2026-03-15"
    return dateStr.replace(/\./g, '-');
  }

  private extractRegion(location: string): string {
    const regions = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
                     '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
    return regions.find(r => location.includes(r)) || '기타';
  }

  private parseStatus(status: string): RegistrationStatus {
    if (status.includes('접수중')) return 'open';
    if (status.includes('마감')) return 'closed';
    if (status.includes('예정')) return 'upcoming';
    return 'unknown';
  }
}
```

### 4.3 AIMS ICS Parser

**URL**: `webcal://aims-worldrunning.org/events.ics`

**파싱 전략**:
1. ICS 파일 다운로드
2. ical.js로 파싱
3. 이벤트 데이터 추출

**구현**:
```typescript
// scripts/scrapers/sources/aims.ts
import ICAL from 'ical.js';
import type { Scraper, ScraperResult, RawMarathonEvent } from '../types';

export class AimsScraper implements Scraper {
  name = 'aims' as const;
  private icsUrl = 'https://aims-worldrunning.org/events.ics';

  async scrape(): Promise<ScraperResult> {
    try {
      const response = await fetch(this.icsUrl);
      const icsText = await response.text();

      const jcalData = ICAL.parse(icsText);
      const comp = new ICAL.Component(jcalData);
      const vevents = comp.getAllSubcomponents('vevent');

      const events: RawMarathonEvent[] = vevents.map(vevent => {
        const event = new ICAL.Event(vevent);
        return this.transformToRaw(event);
      });

      return {
        success: true,
        source: this.name,
        events,
        metadata: {
          scrapedAt: new Date().toISOString(),
          totalFound: vevents.length,
          processedCount: events.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        source: this.name,
        events: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          scrapedAt: new Date().toISOString(),
          totalFound: 0,
          processedCount: 0,
        },
      };
    }
  }

  private transformToRaw(event: ICAL.Event): RawMarathonEvent {
    const location = event.location || '';

    return {
      source: this.name,
      sourceId: event.uid,
      name: event.summary,
      date: event.startDate.toJSDate().toISOString().split('T')[0],
      endDate: event.endDate?.toJSDate().toISOString().split('T')[0],
      location: {
        country: this.detectCountry(location),
        detail: location,
      },
      distances: this.extractDistances(event.summary, event.description),
      registrationUrl: this.extractUrl(event.description),
      tags: ['AIMS', 'International'],
    };
  }

  private detectCountry(location: string): CountryCode {
    // 국가 감지 로직
    if (location.includes('Korea') || location.includes('Seoul')) return 'KR';
    if (location.includes('Japan') || location.includes('Tokyo')) return 'JP';
    if (location.includes('USA') || location.includes('Boston')) return 'US';
    // ... 더 많은 국가 매핑
    return 'INTL';
  }

  private extractDistances(summary: string, description: string): string[] {
    const distances: string[] = [];
    const text = `${summary} ${description}`;

    if (text.includes('Marathon') || text.includes('42')) distances.push('풀');
    if (text.includes('Half') || text.includes('21')) distances.push('하프');
    if (text.includes('10K') || text.includes('10km')) distances.push('10km');

    return distances.length > 0 ? distances : ['풀'];  // 기본값
  }

  private extractUrl(description: string): string {
    const urlMatch = description?.match(/https?:\/\/[^\s]+/);
    return urlMatch ? urlMatch[0] : '';
  }
}
```

---

## 5. Processing Layer

### 5.1 Normalizer

```typescript
// scripts/scrapers/processors/normalizer.ts
import type { RawMarathonEvent, MarathonEvent } from '../types';

export function normalize(events: RawMarathonEvent[]): MarathonEvent[] {
  return events.map(raw => ({
    // 식별자
    id: `${raw.source}-${raw.sourceId}`,

    // 기본 정보
    name: raw.name.trim(),
    date: raw.date,
    endDate: raw.endDate,

    // 위치 정보
    country: raw.location.country,
    region: raw.location.region || '기타',
    locationDetail: raw.location.detail || '',

    // 대회 정보
    distances: normalizeDistances(raw.distances),
    registrationUrl: raw.registrationUrl || '',
    organizer: raw.organizer,

    // 등록 정보
    registrationStatus: raw.registration?.status || 'unknown',
    registrationStart: raw.registration?.startDate,
    registrationEnd: raw.registration?.endDate,

    // 가격 정보
    price: raw.price,

    // 메타 정보
    tags: normalizeTags(raw.tags || [], raw.source),
    source: raw.source,
    isPopular: detectPopular(raw.name),

    // 시스템 정보
    lastUpdated: new Date().toISOString(),
  }));
}

function normalizeDistances(distances: string[]): string[] {
  const mapping: Record<string, string> = {
    '42.195km': '풀',
    '42km': '풀',
    'full': '풀',
    'marathon': '풀',
    '21.0975km': '하프',
    '21km': '하프',
    'half': '하프',
    // ... 더 많은 매핑
  };

  return distances.map(d => mapping[d.toLowerCase()] || d);
}

function normalizeTags(tags: string[], source: DataSource): string[] {
  const normalized = [...tags];

  // 소스 기반 태그 추가
  if (source === 'aims') {
    normalized.push('해외대회', 'AIMS공인');
  }

  return [...new Set(normalized)];  // 중복 제거
}

function detectPopular(name: string): boolean {
  const popularKeywords = ['서울마라톤', '동아마라톤', '중앙마라톤', 'JTBC', '대구국제'];
  return popularKeywords.some(k => name.includes(k));
}
```

### 5.2 Deduplicator (중복 방지 전략)

#### 5.2.1 중복 유형 정의

| 중복 유형 | 설명 | 예시 |
|----------|------|------|
| **동일 소스 내 중복** | 같은 스크래핑 세션에서 같은 데이터 | 페이지네이션 중복, 테이블 파싱 오류 |
| **소스 간 중복** | 다른 소스에서 같은 대회 수집 | gorunning + marathongo 에서 "서울마라톤" |
| **시간적 중복** | 이전 스크래핑 결과와 중복 | 어제 수집한 데이터와 동일 |

#### 5.2.2 중복 감지 전략

**1단계: 정확 매칭 (Exact Match)**
```
키 = normalize(이름) + 날짜 + 국가코드
예: "서울마라톤-2026-03-15-KR"
```

**2단계: 퍼지 매칭 (Fuzzy Match)**
```
유사도 > 85% 이면 동일 대회로 판단

비교 대상:
- 이름 유사도 (Levenshtein distance)
- 날짜 (±1일 허용)
- 위치 (같은 지역)
```

**3단계: 소스별 고유 ID 매핑**
```
각 소스의 고유 ID를 매핑 테이블로 관리
예: gorunning-12345 ↔ aims-abc123 ↔ marathongo-67890
```

#### 5.2.3 소스 우선순위

데이터 품질 기준으로 소스 우선순위 정의:

| 우선순위 | 소스 | 이유 |
|:--------:|------|------|
| 1 | `gorunning` | 국내 데이터 가장 상세, 등록 상태 정확 |
| 2 | `marathongo` | 가격 정보 포함 |
| 3 | `aims` | 해외 대회 전문, 기본 정보만 |
| 4 | `manual` | 수동 입력 데이터 |

#### 5.2.4 구현

```typescript
// scripts/scrapers/processors/deduplicator.ts
import type { MarathonEvent, DataSource } from '../types';

// 소스 우선순위 (낮을수록 높은 우선순위)
const SOURCE_PRIORITY: Record<DataSource, number> = {
  gorunning: 1,
  marathongo: 2,
  aims: 3,
  manual: 4,
};

export interface DeduplicationResult {
  events: MarathonEvent[];
  stats: {
    totalInput: number;
    duplicatesFound: number;
    merged: number;
    finalCount: number;
  };
  duplicateLog: Array<{
    kept: string;
    removed: string[];
    reason: string;
  }>;
}

export function deduplicate(events: MarathonEvent[]): DeduplicationResult {
  const seen = new Map<string, MarathonEvent>();
  const duplicateLog: DeduplicationResult['duplicateLog'] = [];
  let duplicatesFound = 0;
  let merged = 0;

  // 소스 우선순위로 정렬 (높은 우선순위 먼저 처리)
  const sortedEvents = [...events].sort(
    (a, b) => SOURCE_PRIORITY[a.source] - SOURCE_PRIORITY[b.source]
  );

  for (const event of sortedEvents) {
    // 1단계: 정확 매칭
    const exactKey = generateExactKey(event);

    if (seen.has(exactKey)) {
      const existing = seen.get(exactKey)!;
      duplicatesFound++;

      // 높은 우선순위 소스의 데이터 유지, 정보 병합
      const mergedEvent = mergeEvents(existing, event);
      seen.set(exactKey, mergedEvent);
      merged++;

      duplicateLog.push({
        kept: existing.id,
        removed: [event.id],
        reason: `정확 매칭: ${exactKey}`,
      });
      continue;
    }

    // 2단계: 퍼지 매칭
    const fuzzyMatch = findFuzzyMatch(event, Array.from(seen.values()));

    if (fuzzyMatch) {
      duplicatesFound++;

      const mergedEvent = mergeEvents(fuzzyMatch.existing, event);
      const existingKey = generateExactKey(fuzzyMatch.existing);
      seen.set(existingKey, mergedEvent);
      merged++;

      duplicateLog.push({
        kept: fuzzyMatch.existing.id,
        removed: [event.id],
        reason: `퍼지 매칭 (유사도: ${fuzzyMatch.similarity.toFixed(2)}%)`,
      });
      continue;
    }

    // 중복 아님 - 새 이벤트 추가
    seen.set(exactKey, event);
  }

  return {
    events: Array.from(seen.values()),
    stats: {
      totalInput: events.length,
      duplicatesFound,
      merged,
      finalCount: seen.size,
    },
    duplicateLog,
  };
}

function generateExactKey(event: MarathonEvent): string {
  // 이름 정규화
  const normalizedName = event.name
    .replace(/\s+/g, '')           // 공백 제거
    .replace(/제\d+회/g, '')       // "제N회" 제거
    .replace(/\d{4}/g, '')         // 연도 제거
    .replace(/[^\w가-힣]/g, '')    // 특수문자 제거
    .toLowerCase();

  return `${normalizedName}-${event.date}-${event.country}`;
}

function findFuzzyMatch(
  event: MarathonEvent,
  existing: MarathonEvent[]
): { existing: MarathonEvent; similarity: number } | null {
  const SIMILARITY_THRESHOLD = 85;

  for (const e of existing) {
    // 날짜가 ±1일 이내인지 확인
    if (!isDateClose(event.date, e.date, 1)) continue;

    // 같은 국가/지역인지 확인
    if (event.country !== e.country) continue;
    if (event.region && e.region && event.region !== e.region) continue;

    // 이름 유사도 계산
    const similarity = calculateSimilarity(event.name, e.name);

    if (similarity >= SIMILARITY_THRESHOLD) {
      return { existing: e, similarity };
    }
  }

  return null;
}

function isDateClose(date1: string, date2: string, daysDiff: number): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diff = Math.abs(d1.getTime() - d2.getTime());
  const dayMs = 24 * 60 * 60 * 1000;
  return diff <= daysDiff * dayMs;
}

function calculateSimilarity(str1: string, str2: string): number {
  // Levenshtein distance 기반 유사도 계산
  const s1 = str1.toLowerCase().replace(/\s+/g, '');
  const s2 = str2.toLowerCase().replace(/\s+/g, '');

  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 100;

  const distance = levenshteinDistance(s1, s2);
  return ((maxLen - distance) / maxLen) * 100;
}

function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

function mergeEvents(primary: MarathonEvent, secondary: MarathonEvent): MarathonEvent {
  // primary = 높은 우선순위 소스, secondary = 낮은 우선순위 소스
  return {
    ...primary,
    // secondary에서 누락된 정보 보완
    locationDetail: primary.locationDetail || secondary.locationDetail,
    organizer: primary.organizer || secondary.organizer,
    registrationUrl: primary.registrationUrl || secondary.registrationUrl,
    registrationStart: primary.registrationStart || secondary.registrationStart,
    registrationEnd: primary.registrationEnd || secondary.registrationEnd,
    // 배열 필드는 합집합
    distances: [...new Set([...primary.distances, ...secondary.distances])],
    tags: [...new Set([...primary.tags, ...secondary.tags])],
    // 가격 정보는 primary 우선, 없으면 secondary
    price: primary.price || secondary.price,
    // 메타데이터
    lastUpdated: new Date().toISOString(),
  };
}
```

#### 5.2.5 중복 처리 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│                    전체 스크래핑 데이터                          │
│         (gorunning: 100 + aims: 50 + marathongo: 80)            │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   1. 소스 우선순위 정렬                          │
│              gorunning → marathongo → aims                      │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   2. 정확 매칭 (Exact Match)                     │
│          키: normalize(이름) + 날짜 + 국가코드                   │
│          중복 발견 시: 정보 병합, 높은 우선순위 유지              │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   3. 퍼지 매칭 (Fuzzy Match)                     │
│          조건: 날짜 ±1일 + 같은 지역 + 이름 유사도 >85%          │
│          중복 발견 시: 정보 병합, 높은 우선순위 유지              │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   4. 결과 (중복 제거 완료)                       │
│              예: 230개 입력 → 180개 출력 (50개 중복)             │
│              + 중복 로그 생성 (디버깅용)                         │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.2.6 중복 로그 예시

```json
{
  "stats": {
    "totalInput": 230,
    "duplicatesFound": 50,
    "merged": 45,
    "finalCount": 180
  },
  "duplicateLog": [
    {
      "kept": "gorunning-seoul-marathon-2026",
      "removed": ["aims-seoul-marathon-2026", "marathongo-12345"],
      "reason": "정확 매칭: 서울마라톤-2026-03-15-KR"
    },
    {
      "kept": "gorunning-daegu-intl-2026",
      "removed": ["aims-daegu-marathon-2026"],
      "reason": "퍼지 매칭 (유사도: 91.5%)"
    }
  ]
}
```

### 5.3 Validator

```typescript
// scripts/scrapers/processors/validator.ts
import { z } from 'zod';
import type { MarathonEvent } from '../types';

const MarathonEventSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  country: z.enum(['KR', 'JP', 'US', 'DE', 'UK', 'INTL']),
  region: z.string(),
  locationDetail: z.string(),
  distances: z.array(z.string()).min(1),
  registrationUrl: z.string(),
  tags: z.array(z.string()),
  source: z.enum(['gorunning', 'aims', 'marathongo', 'manual']),
  lastUpdated: z.string(),
});

export function validate(events: MarathonEvent[]): {
  valid: MarathonEvent[];
  invalid: Array<{ event: MarathonEvent; errors: string[] }>;
} {
  const valid: MarathonEvent[] = [];
  const invalid: Array<{ event: MarathonEvent; errors: string[] }> = [];

  for (const event of events) {
    const result = MarathonEventSchema.safeParse(event);

    if (result.success) {
      valid.push(event);
    } else {
      invalid.push({
        event,
        errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      });
    }
  }

  return { valid, invalid };
}
```

---

## 6. GitHub Actions Workflow

### 6.1 Workflow Configuration

```yaml
# .github/workflows/scrape-marathons.yml
name: Scrape Marathon Data

on:
  schedule:
    # 매일 오전 6시 (KST) = UTC 21:00
    - cron: '0 21 * * *'
  workflow_dispatch:  # 수동 실행 허용

permissions:
  contents: write

jobs:
  scrape:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install chromium

      - name: Run scrapers
        run: npx tsx scripts/scrapers/index.ts
        env:
          NODE_ENV: production

      - name: Check for changes
        id: check_changes
        run: |
          if [[ -n $(git status public/data --porcelain) ]]; then
            echo "changes=true" >> $GITHUB_OUTPUT
          else
            echo "changes=false" >> $GITHUB_OUTPUT
          fi

      - name: Commit and push changes
        if: steps.check_changes.outputs.changes == 'true'
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add public/data/
          git commit -m "chore: Update marathon data [$(date +%Y-%m-%d)]"
          git push

      - name: Upload error logs
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: scraper-logs
          path: scripts/scrapers/logs/
```

---

## 7. Frontend Integration

### 7.1 Data Fetching Hook

```typescript
// src/hooks/useMarathons.ts
import { useState, useEffect } from 'react';
import type { MarathonEvent } from '../types';

interface UseMarathonsResult {
  marathons: MarathonEvent[];
  isLoading: boolean;
  error: Error | null;
  lastUpdated: string | null;
}

export function useMarathons(): UseMarathonsResult {
  const [marathons, setMarathons] = useState<MarathonEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);

        const [dataRes, metaRes] = await Promise.all([
          fetch('/data/marathons.json'),
          fetch('/data/metadata.json'),
        ]);

        if (!dataRes.ok) throw new Error('Failed to fetch marathon data');

        const data = await dataRes.json();
        setMarathons(data);

        if (metaRes.ok) {
          const meta = await metaRes.json();
          setLastUpdated(meta.lastRun);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        // 에러 시 하드코딩 데이터로 폴백
        const { MARATHON_DATA } = await import('../constants');
        setMarathons(MARATHON_DATA);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return { marathons, isLoading, error, lastUpdated };
}
```

### 7.2 App Integration

```typescript
// App.tsx 수정
import { useMarathons } from './hooks/useMarathons';

function App() {
  const { marathons, isLoading, error, lastUpdated } = useMarathons();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      {error && (
        <Banner type="warning">
          데이터 로딩 중 문제가 발생했습니다. 캐시된 데이터를 표시합니다.
        </Banner>
      )}
      {lastUpdated && (
        <Text size="sm" color="muted">
          마지막 업데이트: {new Date(lastUpdated).toLocaleDateString('ko-KR')}
        </Text>
      )}
      <MarathonList marathons={marathons} />
    </div>
  );
}
```

---

## 8. Error Handling

### 8.1 Error Strategy

| Error Type | Handling | User Impact |
|------------|----------|-------------|
| 단일 소스 실패 | 다른 소스 계속 진행 | 일부 데이터 누락 가능 |
| 모든 소스 실패 | 이전 데이터 유지 | 영향 없음 |
| 네트워크 오류 | 3회 재시도 | 지연 가능 |
| 파싱 오류 | 해당 이벤트 스킵 | 일부 이벤트 누락 |

### 8.2 Logging

```typescript
// scripts/scrapers/utils/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
  },
};
```

---

## 9. Test Plan

### 9.1 Test Scope

| Type | Target | Tool |
|------|--------|------|
| Unit Test | Normalizer, Deduplicator | Vitest |
| Integration Test | 각 Scraper | Vitest + MSW |
| E2E Test | 전체 파이프라인 | Manual/GitHub Actions |

### 9.2 Key Test Cases

- [ ] gorunning 스크래퍼가 테이블 데이터를 올바르게 파싱
- [ ] AIMS ICS 파일이 올바르게 파싱
- [ ] 중복 이벤트가 올바르게 병합
- [ ] 잘못된 데이터가 검증에서 필터링
- [ ] GitHub Actions 워크플로우 성공적 실행
- [ ] 프론트엔드 데이터 로딩 성공

---

## 10. Implementation Order

### Phase 1: 기반 구축
1. [ ] `scripts/scrapers/` 폴더 구조 생성
2. [ ] 타입 정의 (`types.ts`)
3. [ ] 유틸리티 함수 (`logger.ts`, `http.ts`)

### Phase 2: 스크래퍼 개발
1. [ ] gorunning.kr 스크래퍼 구현 및 테스트
2. [ ] AIMS ICS 파서 구현 및 테스트
3. [ ] Normalizer, Deduplicator, Validator 구현

### Phase 3: 자동화
1. [ ] GitHub Actions 워크플로우 작성
2. [ ] 테스트 실행 및 디버깅
3. [ ] 스케줄 활성화

### Phase 4: 프론트엔드 통합
1. [ ] `useMarathons` 훅 구현
2. [ ] App.tsx 수정
3. [ ] 기존 하드코딩 데이터 제거 (폴백용으로 유지)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-01-20 | Initial draft | InjunH + Claude |
