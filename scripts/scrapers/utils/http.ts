/**
 * HTTP 요청 유틸리티
 */

import { createLogger } from './logger';

const logger = createLogger('http');

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

const DEFAULT_OPTIONS: FetchOptions = {
  timeout: 30000, // 30초
  retries: 3,
  retryDelay: 1000, // 1초
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  },
};

/**
 * 타임아웃이 있는 fetch
 */
async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeout = DEFAULT_OPTIONS.timeout, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 재시도가 있는 fetch
 */
export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    retries = DEFAULT_OPTIONS.retries,
    retryDelay = DEFAULT_OPTIONS.retryDelay,
    ...fetchOptions
  } = { ...DEFAULT_OPTIONS, ...options };

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= retries!; attempt++) {
    try {
      logger.debug(`Fetching ${url} (attempt ${attempt}/${retries})`);
      const response = await fetchWithTimeout(url, fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(`Attempt ${attempt} failed: ${lastError.message}`);

      if (attempt < retries!) {
        logger.info(`Retrying in ${retryDelay}ms...`);
        await sleep(retryDelay!);
      }
    }
  }

  throw lastError || new Error(`Failed to fetch ${url} after ${retries} attempts`);
}

/**
 * JSON 데이터 fetch
 */
export async function fetchJson<T>(url: string, options?: FetchOptions): Promise<T> {
  const response = await fetchWithRetry(url, {
    ...options,
    headers: {
      ...DEFAULT_OPTIONS.headers,
      Accept: 'application/json',
      ...options?.headers,
    },
  });

  return response.json();
}

/**
 * 텍스트 데이터 fetch
 */
export async function fetchText(url: string, options?: FetchOptions): Promise<string> {
  const response = await fetchWithRetry(url, options);
  return response.text();
}

/**
 * 지연 함수
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 날짜 파싱 유틸리티
 */
export function parseDate(dateStr: string): string {
  // 다양한 형식 지원
  // "2026.03.15" -> "2026-03-15"
  // "2026/03/15" -> "2026-03-15"
  // "March 15, 2026" -> "2026-03-15"
  // "1월31일" -> "2026-01-31" (현재 연도)
  // "01/31" -> "2026-01-31" (현재 연도)

  const currentYear = new Date().getFullYear();

  // 점/슬래시 형식 (년도 포함)
  const dotMatch = dateStr.match(/(\d{4})[./](\d{1,2})[./](\d{1,2})/);
  if (dotMatch) {
    const [, year, month, day] = dotMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // ISO 형식
  const isoMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return isoMatch[0];
  }

  // 한국어 날짜 형식: "1월31일", "1월 31일", "01월31일"
  const koreanMatch = dateStr.match(/(\d{1,2})월\s*(\d{1,2})일?/);
  if (koreanMatch) {
    const [, month, day] = koreanMatch;
    return `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // 년도 포함 한국어: "2026년 1월 31일"
  const koreanFullMatch = dateStr.match(/(\d{4})년?\s*(\d{1,2})월\s*(\d{1,2})일?/);
  if (koreanFullMatch) {
    const [, year, month, day] = koreanFullMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // 슬래시 형식 (년도 없음): "01/31", "1/31"
  const shortSlashMatch = dateStr.match(/^(\d{1,2})[./](\d{1,2})$/);
  if (shortSlashMatch) {
    const [, month, day] = shortSlashMatch;
    return `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Date 객체로 파싱 시도
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  throw new Error(`Unable to parse date: ${dateStr}`);
}

/**
 * URL 유효성 검사
 */
export function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}
