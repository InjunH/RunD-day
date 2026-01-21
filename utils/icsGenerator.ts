/**
 * ICS (iCalendar) 파일 생성 유틸리티
 * RFC 5545 표준 준수
 */

import type { MarathonEvent } from '../types';

interface ICSGenerationOptions {
  includeAlarms?: boolean;    // 기본: true
  alarmOffsets?: number[];    // 기본: [-7, -1] (일 단위)
  timezone?: string;          // 기본: "Asia/Seoul"
}

/**
 * 마라톤 이벤트 배열을 RFC 5545 표준 ICS 파일로 변환
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
  const vevents = events
    .map((event) => createVEvent(event, { includeAlarms, alarmOffsets }))
    .join('\r\n');

  // 5. Footer
  const footer = 'END:VCALENDAR';

  // 6. 결합
  return [header, vevents, footer].join('\r\n');
}

/**
 * 단일 MarathonEvent를 VEVENT 블록으로 변환
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
    options.alarmOffsets.forEach((offset) => {
      vevent.push(...createVAlarm(offset));
    });
  }

  vevent.push('END:VEVENT');

  return vevent.join('\r\n');
}

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
  if (tags.includes('바다뷰') || tags.includes('해변코스') || tags.includes('오션뷰')) return '🌊';
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
  const description =
    offsetDays === -7
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

/**
 * ICS 콘텐츠를 파일로 다운로드
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

/**
 * 파일명 자동 생성
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
