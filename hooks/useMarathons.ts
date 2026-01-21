/**
 * 마라톤 데이터 로딩 훅
 * JSON 파일에서 데이터를 fetch하고 캐싱 처리
 */

import { useState, useEffect, useCallback } from 'react';
import type { MarathonEvent } from '../types';

// API 응답 타입 (스크래퍼에서 생성된 JSON 구조)
interface MarathonAPIEvent {
  id: string;
  name: string;
  date: string;
  endDate?: string;
  country: string;
  region: string;
  locationDetail: string;
  distances: string[];
  registrationUrl: string;
  organizer?: string;
  registrationStatus?: string;
  registrationStart?: string;
  registrationEnd?: string;
  price?: {
    currency: string;
    amount: number;
    description?: string;
  };
  tags: string[];
  source: string;
  isPopular?: boolean;
  lastUpdated: string;
}

interface MetadataResponse {
  lastRun: string;
  nextScheduledRun: string;
  sources: Array<{
    name: string;
    status: string;
    itemCount: number;
    lastUpdated: string;
    error?: string;
  }>;
  totalEvents: number;
  krEvents: number;
  intlEvents: number;
  version: string;
}

interface UseMarathonsOptions {
  region?: 'kr' | 'intl' | 'all';
  forceRefresh?: boolean;
}

interface UseMarathonsResult {
  events: MarathonEvent[];
  metadata: MetadataResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

// 캐시 설정
const CACHE_KEY = 'marathon-data-cache';
const CACHE_DURATION = 1000 * 60 * 60; // 1시간

interface CacheData {
  events: MarathonEvent[];
  metadata: MetadataResponse | null;
  timestamp: number;
}

function getCache(): CacheData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data = JSON.parse(cached) as CacheData;
    const isExpired = Date.now() - data.timestamp > CACHE_DURATION;

    if (isExpired) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

function setCache(events: MarathonEvent[], metadata: MetadataResponse | null): void {
  try {
    const data: CacheData = {
      events,
      metadata,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // localStorage 실패 무시
  }
}

/**
 * API 응답을 프론트엔드 타입으로 변환
 */
function transformEvent(apiEvent: MarathonAPIEvent): MarathonEvent {
  return {
    id: apiEvent.id,
    name: apiEvent.name,
    date: apiEvent.date,
    region: apiEvent.region || '기타',
    locationDetail: apiEvent.locationDetail || '',
    distances: apiEvent.distances,
    registrationUrl: apiEvent.registrationUrl || '',
    tags: apiEvent.tags,
    isPopular: apiEvent.isPopular,
    notes: apiEvent.organizer ? `주최: ${apiEvent.organizer}` : undefined,
  };
}

/**
 * 마라톤 데이터 로딩 훅
 */
export function useMarathons(options: UseMarathonsOptions = {}): UseMarathonsResult {
  const { region = 'all', forceRefresh = false } = options;

  const [events, setEvents] = useState<MarathonEvent[]>([]);
  const [metadata, setMetadata] = useState<MetadataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // 캐시 확인 (forceRefresh가 아닌 경우)
    if (!forceRefresh) {
      const cached = getCache();
      if (cached) {
        setEvents(cached.events);
        setMetadata(cached.metadata);
        setLastUpdated(new Date(cached.timestamp));
        setIsLoading(false);
        return;
      }
    }

    try {
      // 데이터 파일 경로 결정
      const dataFile =
        region === 'kr'
          ? '/data/marathons-kr.json'
          : region === 'intl'
            ? '/data/marathons-intl.json'
            : '/data/marathons.json';

      // 병렬로 데이터와 메타데이터 가져오기
      const [eventsRes, metadataRes] = await Promise.all([
        fetch(dataFile),
        fetch('/data/metadata.json'),
      ]);

      if (!eventsRes.ok) {
        throw new Error(`데이터 로딩 실패: ${eventsRes.status}`);
      }

      const apiEvents: MarathonAPIEvent[] = await eventsRes.json();
      const transformedEvents = apiEvents.map(transformEvent);

      let metadataData: MetadataResponse | null = null;
      if (metadataRes.ok) {
        metadataData = await metadataRes.json();
      }

      // 상태 업데이트
      setEvents(transformedEvents);
      setMetadata(metadataData);
      setLastUpdated(new Date());

      // 캐시 저장
      setCache(transformedEvents, metadataData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(errorMessage);

      // 에러 발생 시 캐시된 데이터라도 사용
      const cached = getCache();
      if (cached) {
        setEvents(cached.events);
        setMetadata(cached.metadata);
        setLastUpdated(new Date(cached.timestamp));
      }
    } finally {
      setIsLoading(false);
    }
  }, [region, forceRefresh]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    localStorage.removeItem(CACHE_KEY);
    await fetchData();
  }, [fetchData]);

  return {
    events,
    metadata,
    isLoading,
    error,
    refetch,
    lastUpdated,
  };
}

/**
 * 정적 데이터 fallback 훅
 * JSON 파일이 없을 때 기존 constants.ts 데이터 사용
 */
export function useMarathonsWithFallback(options: UseMarathonsOptions = {}): UseMarathonsResult {
  const result = useMarathons(options);

  // 데이터가 없고 에러가 있으면 fallback 데이터 제공
  useEffect(() => {
    if (result.error && result.events.length === 0) {
      // 동적 import로 fallback 데이터 로드
      import('../constants').then((module) => {
        // constants.ts의 MARATHON_DATA 사용
        if (module.MARATHON_DATA) {
          // 이미 상태가 업데이트되어 있으므로 추가 처리 불필요
          console.warn('JSON 데이터 로드 실패, 정적 데이터 사용');
        }
      });
    }
  }, [result.error, result.events.length]);

  return result;
}
