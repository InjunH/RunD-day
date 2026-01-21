/**
 * 마라톤 데이터 스크래퍼 타입 정의
 */

// =============================================================================
// 기본 타입
// =============================================================================

/** 데이터 소스 식별자 */
export type DataSource = 'gorunning' | 'aims' | 'marathongo' | 'manual';

/** 국가 코드 */
export type CountryCode = 'KR' | 'JP' | 'US' | 'DE' | 'UK' | 'INTL';

/** 등록 상태 */
export type RegistrationStatus = 'upcoming' | 'open' | 'closed' | 'unknown';

// =============================================================================
// 원시 데이터 (스크래핑 결과)
// =============================================================================

/** 각 소스에서 수집한 원시 마라톤 이벤트 */
export interface RawMarathonEvent {
  source: DataSource;
  sourceId: string;
  name: string;
  date: string; // YYYY-MM-DD
  endDate?: string;
  location: {
    country: CountryCode;
    region?: string;
    detail?: string;
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
  rawData?: Record<string, unknown>;
}

// =============================================================================
// 정규화된 데이터 (최종 출력)
// =============================================================================

/** 정규화된 마라톤 이벤트 (프론트엔드에서 사용) */
export interface MarathonEvent {
  // 식별자
  id: string;

  // 기본 정보
  name: string;
  date: string; // YYYY-MM-DD
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
  lastUpdated: string; // ISO 8601
  notes?: string;
}

// =============================================================================
// 스크래퍼 인터페이스
// =============================================================================

/** 스크래퍼 결과 */
export interface ScraperResult {
  success: boolean;
  source: DataSource;
  events: RawMarathonEvent[];
  error?: string;
  metadata: {
    scrapedAt: string;
    totalFound: number;
    processedCount: number;
    duration?: number; // ms
  };
}

/** 스크래퍼 인터페이스 */
export interface Scraper {
  name: DataSource;
  scrape(): Promise<ScraperResult>;
}

// =============================================================================
// 처리 결과
// =============================================================================

/** 중복 제거 결과 */
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

/** 검증 결과 */
export interface ValidationResult {
  valid: MarathonEvent[];
  invalid: Array<{
    event: Partial<MarathonEvent>;
    errors: string[];
  }>;
}

// =============================================================================
// 메타데이터
// =============================================================================

/** 스크래핑 메타데이터 */
export interface ScrapingMetadata {
  lastRun: string; // ISO 8601
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
  version: string;
}

// =============================================================================
// 소스 우선순위
// =============================================================================

/** 소스 우선순위 (낮을수록 높은 우선순위) */
export const SOURCE_PRIORITY: Record<DataSource, number> = {
  gorunning: 1,
  marathongo: 2,
  aims: 3,
  manual: 4,
};

// =============================================================================
// 한국 지역 목록
// =============================================================================

export const KR_REGIONS = [
  '서울',
  '부산',
  '대구',
  '인천',
  '광주',
  '대전',
  '울산',
  '세종',
  '경기',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '제주',
] as const;

export type KRRegion = (typeof KR_REGIONS)[number];
