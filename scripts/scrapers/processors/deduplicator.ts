/**
 * 중복 제거 프로세서
 * 여러 소스에서 수집된 동일 대회 데이터를 병합
 */

import { createLogger } from '../utils/logger';
import type { MarathonEvent, DeduplicationResult } from '../types';
import { SOURCE_PRIORITY } from '../types';

const logger = createLogger('deduplicator');

// 유사도 임계값 (%)
const SIMILARITY_THRESHOLD = 85;

/**
 * 중복 제거 및 병합
 */
export function deduplicate(events: MarathonEvent[]): DeduplicationResult {
  logger.info(`${events.length}개 이벤트 중복 제거 시작`);

  const seen = new Map<string, MarathonEvent>();
  const duplicateLog: DeduplicationResult['duplicateLog'] = [];
  let duplicatesFound = 0;
  let merged = 0;

  // 소스 우선순위로 정렬 (높은 우선순위 먼저)
  const sortedEvents = [...events].sort(
    (a, b) => SOURCE_PRIORITY[a.source] - SOURCE_PRIORITY[b.source]
  );

  for (const event of sortedEvents) {
    // 1단계: 정확 매칭
    const exactKey = generateExactKey(event);

    if (seen.has(exactKey)) {
      const existing = seen.get(exactKey)!;
      duplicatesFound++;

      // 높은 우선순위 소스 데이터 유지, 정보 병합
      const mergedEvent = mergeEvents(existing, event);
      seen.set(exactKey, mergedEvent);
      merged++;

      duplicateLog.push({
        kept: existing.id,
        removed: [event.id],
        reason: `정확 매칭: ${exactKey}`,
      });

      logger.debug(`정확 매칭 중복: ${event.name} -> ${existing.name}`);
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
        reason: `퍼지 매칭 (유사도: ${fuzzyMatch.similarity.toFixed(1)}%)`,
      });

      logger.debug(
        `퍼지 매칭 중복: ${event.name} -> ${fuzzyMatch.existing.name} (${fuzzyMatch.similarity.toFixed(1)}%)`
      );
      continue;
    }

    // 중복 아님 - 새 이벤트 추가
    seen.set(exactKey, event);
  }

  const result: DeduplicationResult = {
    events: Array.from(seen.values()),
    stats: {
      totalInput: events.length,
      duplicatesFound,
      merged,
      finalCount: seen.size,
    },
    duplicateLog,
  };

  logger.info(
    `중복 제거 완료: ${events.length} -> ${result.stats.finalCount} (${duplicatesFound}개 중복)`
  );

  return result;
}

/**
 * 정확 매칭용 키 생성
 */
function generateExactKey(event: MarathonEvent): string {
  // 이름 정규화
  const normalizedName = event.name
    .replace(/\s+/g, '') // 공백 제거
    .replace(/제\d+회/g, '') // "제N회" 제거
    .replace(/\d{4}년?/g, '') // 연도 제거
    .replace(/[^\w가-힣]/g, '') // 특수문자 제거
    .toLowerCase();

  return `${normalizedName}-${event.date}-${event.country}`;
}

/**
 * 퍼지 매칭 검색
 */
function findFuzzyMatch(
  event: MarathonEvent,
  existing: MarathonEvent[]
): { existing: MarathonEvent; similarity: number } | null {
  for (const e of existing) {
    // 날짜가 ±1일 이내인지 확인
    if (!isDateClose(event.date, e.date, 1)) continue;

    // 같은 국가인지 확인
    if (event.country !== e.country) continue;

    // 같은 지역인지 확인 (지역 정보가 있는 경우)
    if (event.region && e.region && event.region !== e.region && event.region !== '기타') {
      continue;
    }

    // 이름 유사도 계산
    const similarity = calculateSimilarity(event.name, e.name);

    if (similarity >= SIMILARITY_THRESHOLD) {
      return { existing: e, similarity };
    }
  }

  return null;
}

/**
 * 날짜 근접성 확인
 */
function isDateClose(date1: string, date2: string, daysDiff: number): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diff = Math.abs(d1.getTime() - d2.getTime());
  const dayMs = 24 * 60 * 60 * 1000;
  return diff <= daysDiff * dayMs;
}

/**
 * 문자열 유사도 계산 (Levenshtein distance 기반)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/\s+/g, '');
  const s2 = str2.toLowerCase().replace(/\s+/g, '');

  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 100;

  const distance = levenshteinDistance(s1, s2);
  return ((maxLen - distance) / maxLen) * 100;
}

/**
 * Levenshtein 거리 계산
 */
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;

  // 최적화: 빈 문자열 처리
  if (m === 0) return n;
  if (n === 0) return m;

  // 1차원 배열로 메모리 최적화
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;

    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        curr[j] = prev[j - 1];
      } else {
        curr[j] = 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
      }
    }

    [prev, curr] = [curr, prev];
  }

  return prev[n];
}

/**
 * 이벤트 병합 (높은 우선순위 소스 기준)
 */
function mergeEvents(primary: MarathonEvent, secondary: MarathonEvent): MarathonEvent {
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
    // 가격 정보는 primary 우선
    price: primary.price || secondary.price,
    // 메타데이터 업데이트
    lastUpdated: new Date().toISOString(),
  };
}
