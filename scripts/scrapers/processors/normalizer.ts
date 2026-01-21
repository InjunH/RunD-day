/**
 * 데이터 정규화 프로세서
 * RawMarathonEvent → MarathonEvent 변환
 */

import { createLogger } from '../utils/logger';
import type { RawMarathonEvent, MarathonEvent, DataSource } from '../types';

const logger = createLogger('normalizer');

// 거리 정규화 매핑
const DISTANCE_MAP: Record<string, string> = {
  // 풀코스
  '42.195km': '풀',
  '42.195': '풀',
  '42km': '풀',
  '42k': '풀',
  full: '풀',
  marathon: '풀',
  // 하프
  '21.0975km': '하프',
  '21.0975': '하프',
  '21km': '하프',
  '21k': '하프',
  half: '하프',
  'half marathon': '하프',
  // 10km
  '10km': '10km',
  '10k': '10km',
  // 5km
  '5km': '5km',
  '5k': '5km',
  // 기타
  '3km': '3km',
  '3k': '3km',
};

// 인기 대회 키워드
const POPULAR_KEYWORDS = [
  '서울마라톤',
  '동아마라톤',
  '중앙마라톤',
  'JTBC',
  '대구국제',
  '경주마라톤',
  '춘천마라톤',
  'Boston',
  'New York',
  'Berlin',
  'London',
  'Tokyo',
  'Chicago',
];

/**
 * RawMarathonEvent 배열을 MarathonEvent 배열로 정규화
 */
export function normalize(events: RawMarathonEvent[]): MarathonEvent[] {
  logger.info(`${events.length}개 이벤트 정규화 시작`);

  const normalized: MarathonEvent[] = [];

  for (const raw of events) {
    try {
      const event = normalizeEvent(raw);
      normalized.push(event);
    } catch (error) {
      logger.warn(`정규화 실패: ${raw.name}`, error);
    }
  }

  logger.info(`정규화 완료: ${normalized.length}/${events.length}`);
  return normalized;
}

/**
 * 단일 이벤트 정규화
 */
function normalizeEvent(raw: RawMarathonEvent): MarathonEvent {
  return {
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
  };
}

/**
 * 거리 배열 정규화
 */
function normalizeDistances(distances: string[]): string[] {
  const normalized = new Set<string>();

  for (const distance of distances) {
    const lower = distance.toLowerCase().trim();
    const mapped = DISTANCE_MAP[lower] || distance;
    normalized.add(mapped);
  }

  // 정렬: 긴 거리순
  const order = ['100km', '50km', '풀', '하프', '10km', '5km', '3km'];
  return Array.from(normalized).sort((a, b) => {
    const aIdx = order.indexOf(a);
    const bIdx = order.indexOf(b);
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
}

/**
 * 태그 정규화
 */
function normalizeTags(tags: string[], source: DataSource): string[] {
  const normalized = new Set(tags);

  // 소스 기반 태그 추가
  if (source === 'aims') {
    normalized.add('해외대회');
    normalized.add('AIMS공인');
  }

  return Array.from(normalized);
}

/**
 * 인기 대회 감지
 */
function detectPopular(name: string): boolean {
  const lower = name.toLowerCase();
  return POPULAR_KEYWORDS.some((keyword) => lower.includes(keyword.toLowerCase()));
}
