/**
 * 데이터 검증 프로세서
 * MarathonEvent 스키마 검증
 */

import { createLogger } from '../utils/logger';
import type { MarathonEvent, ValidationResult } from '../types';

const logger = createLogger('validator');

// 검증 규칙
interface ValidationRule {
  field: keyof MarathonEvent;
  check: (value: unknown, event: MarathonEvent) => boolean;
  message: string;
}

const VALIDATION_RULES: ValidationRule[] = [
  {
    field: 'id',
    check: (v) => typeof v === 'string' && v.length > 0,
    message: 'id는 비어있지 않은 문자열이어야 합니다',
  },
  {
    field: 'name',
    check: (v) => typeof v === 'string' && v.length > 0,
    message: 'name은 비어있지 않은 문자열이어야 합니다',
  },
  {
    field: 'date',
    check: (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v),
    message: 'date는 YYYY-MM-DD 형식이어야 합니다',
  },
  {
    field: 'country',
    check: (v) => ['KR', 'JP', 'US', 'DE', 'UK', 'INTL'].includes(v as string),
    message: 'country는 유효한 국가 코드여야 합니다',
  },
  {
    field: 'region',
    check: (v) => typeof v === 'string',
    message: 'region은 문자열이어야 합니다',
  },
  {
    field: 'distances',
    check: (v) => Array.isArray(v) && v.length > 0,
    message: 'distances는 비어있지 않은 배열이어야 합니다',
  },
  {
    field: 'tags',
    check: (v) => Array.isArray(v),
    message: 'tags는 배열이어야 합니다',
  },
  {
    field: 'source',
    check: (v) => ['gorunning', 'aims', 'marathongo', 'manual'].includes(v as string),
    message: 'source는 유효한 소스 식별자여야 합니다',
  },
  {
    field: 'lastUpdated',
    check: (v) => typeof v === 'string' && !isNaN(Date.parse(v as string)),
    message: 'lastUpdated는 유효한 ISO 날짜 문자열이어야 합니다',
  },
];

// 날짜 검증 (미래 날짜만 허용)
function isValidFutureDate(dateStr: string): boolean {
  const eventDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 오늘 이후의 날짜만 유효
  return eventDate >= today;
}

// 합리적인 날짜 범위 검증 (최대 2년 이후까지)
function isReasonableDate(dateStr: string): boolean {
  const eventDate = new Date(dateStr);
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 2);

  return eventDate <= maxDate;
}

/**
 * 이벤트 배열 검증
 */
export function validate(events: MarathonEvent[]): ValidationResult {
  logger.info(`${events.length}개 이벤트 검증 시작`);

  const valid: MarathonEvent[] = [];
  const invalid: ValidationResult['invalid'] = [];

  for (const event of events) {
    const errors = validateEvent(event);

    if (errors.length === 0) {
      valid.push(event);
    } else {
      invalid.push({ event, errors });
      logger.warn(`검증 실패: ${event.name || 'unknown'}`, errors);
    }
  }

  logger.info(`검증 완료: ${valid.length} 유효, ${invalid.length} 무효`);

  return { valid, invalid };
}

/**
 * 단일 이벤트 검증
 */
function validateEvent(event: MarathonEvent): string[] {
  const errors: string[] = [];

  // 기본 규칙 검증
  for (const rule of VALIDATION_RULES) {
    const value = event[rule.field];
    if (!rule.check(value, event)) {
      errors.push(`${rule.field}: ${rule.message}`);
    }
  }

  // 날짜 관련 추가 검증
  if (event.date && /^\d{4}-\d{2}-\d{2}$/.test(event.date)) {
    // 과거 날짜 경고 (에러는 아님)
    if (!isValidFutureDate(event.date)) {
      logger.debug(`과거 날짜 이벤트: ${event.name} (${event.date})`);
      // 과거 이벤트도 일단 유효로 처리 (히스토리 목적)
    }

    // 너무 먼 미래 날짜 검증
    if (!isReasonableDate(event.date)) {
      errors.push(`date: 날짜가 2년 이후입니다 (${event.date})`);
    }
  }

  // URL 형식 검증 (있는 경우)
  if (event.registrationUrl && event.registrationUrl.length > 0) {
    try {
      new URL(event.registrationUrl);
    } catch {
      // URL이 유효하지 않으면 경고만 (에러 아님)
      logger.debug(`유효하지 않은 URL: ${event.registrationUrl}`);
    }
  }

  return errors;
}

/**
 * 빠른 필수 필드 검증 (스크래핑 직후)
 */
export function quickValidate(event: Partial<MarathonEvent>): boolean {
  return !!(event.name && event.date && event.source);
}
