/**
 * AIMS (Association of International Marathons) ICS 파서
 * 국제 마라톤 대회 정보 수집
 */

import { createLogger } from '../utils/logger';
import { fetchText } from '../utils/http';
import type {
  Scraper,
  ScraperResult,
  RawMarathonEvent,
  CountryCode,
} from '../types';

const logger = createLogger('aims');

// ICS 이벤트 파싱 결과
interface ICSEvent {
  uid: string;
  summary: string;
  description: string;
  location: string;
  dtstart: string;
  dtend?: string;
  url?: string;
}

export class AimsScraper implements Scraper {
  name = 'aims' as const;
  private icsUrl = 'https://aims-worldrunning.org/events.ics';

  async scrape(): Promise<ScraperResult> {
    const startTime = Date.now();
    logger.info('AIMS ICS 피드 수집 시작...');

    try {
      // ICS 파일 다운로드
      logger.info(`${this.icsUrl} 다운로드 중...`);
      const icsText = await fetchText(this.icsUrl);

      // ICS 파싱
      const icsEvents = this.parseICS(icsText);
      logger.info(`${icsEvents.length}개 ICS 이벤트 파싱`);

      // RawMarathonEvent로 변환
      const events: RawMarathonEvent[] = [];
      for (const icsEvent of icsEvents) {
        try {
          // 과거 이벤트 필터링 (현재 연도 이후만)
          const eventDate = new Date(this.parseICSDate(icsEvent.dtstart));
          const currentYear = new Date().getFullYear();
          if (eventDate.getFullYear() < currentYear) continue;

          const event = this.transformToRaw(icsEvent);
          events.push(event);
        } catch (error) {
          logger.warn(`변환 실패: ${icsEvent.summary}`, error);
        }
      }

      const duration = Date.now() - startTime;
      logger.info(`수집 완료: ${events.length}개 이벤트 (${duration}ms)`);

      return {
        success: true,
        source: this.name,
        events,
        metadata: {
          scrapedAt: new Date().toISOString(),
          totalFound: icsEvents.length,
          processedCount: events.length,
          duration,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('AIMS 수집 실패', error);

      return {
        success: false,
        source: this.name,
        events: [],
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          scrapedAt: new Date().toISOString(),
          totalFound: 0,
          processedCount: 0,
          duration,
        },
      };
    }
  }

  /**
   * ICS 파일 파싱 (간단한 파서)
   */
  private parseICS(icsText: string): ICSEvent[] {
    const events: ICSEvent[] = [];
    const lines = icsText.split(/\r?\n/);

    let currentEvent: Partial<ICSEvent> | null = null;
    let currentKey = '';
    let currentValue = '';

    for (const line of lines) {
      // 줄 계속 (공백으로 시작하는 줄)
      if (line.startsWith(' ') || line.startsWith('\t')) {
        currentValue += line.slice(1);
        continue;
      }

      // 이전 값 저장
      if (currentEvent && currentKey) {
        this.setEventProperty(currentEvent, currentKey, currentValue);
      }

      // 새 이벤트 시작
      if (line === 'BEGIN:VEVENT') {
        currentEvent = {};
        currentKey = '';
        currentValue = '';
        continue;
      }

      // 이벤트 종료
      if (line === 'END:VEVENT' && currentEvent) {
        if (currentEvent.uid && currentEvent.summary && currentEvent.dtstart) {
          events.push(currentEvent as ICSEvent);
        }
        currentEvent = null;
        currentKey = '';
        currentValue = '';
        continue;
      }

      // 속성 파싱
      if (currentEvent) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          currentKey = line.slice(0, colonIndex).split(';')[0]; // 파라미터 제거
          currentValue = line.slice(colonIndex + 1);
        }
      }
    }

    return events;
  }

  private setEventProperty(event: Partial<ICSEvent>, key: string, value: string): void {
    const decodedValue = this.decodeICSValue(value);

    switch (key.toUpperCase()) {
      case 'UID':
        event.uid = decodedValue;
        break;
      case 'SUMMARY':
        event.summary = decodedValue;
        break;
      case 'DESCRIPTION':
        event.description = decodedValue;
        break;
      case 'LOCATION':
        event.location = decodedValue;
        break;
      case 'DTSTART':
        event.dtstart = decodedValue;
        break;
      case 'DTEND':
        event.dtend = decodedValue;
        break;
      case 'URL':
        event.url = decodedValue;
        break;
    }
  }

  private decodeICSValue(value: string): string {
    return value
      .replace(/\\n/g, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');
  }

  private parseICSDate(dateStr: string): string {
    // ICS 날짜 형식: 20260315 또는 20260315T090000Z
    const match = dateStr.match(/(\d{4})(\d{2})(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    throw new Error(`Invalid ICS date: ${dateStr}`);
  }

  private transformToRaw(icsEvent: ICSEvent): RawMarathonEvent {
    const location = icsEvent.location || '';
    const country = this.detectCountry(location, icsEvent.summary);

    return {
      source: this.name,
      sourceId: icsEvent.uid,
      name: icsEvent.summary,
      date: this.parseICSDate(icsEvent.dtstart),
      endDate: icsEvent.dtend ? this.parseICSDate(icsEvent.dtend) : undefined,
      location: {
        country,
        detail: location,
      },
      distances: this.extractDistances(icsEvent.summary, icsEvent.description),
      registrationUrl: this.extractUrl(icsEvent.description, icsEvent.url),
      tags: ['AIMS', '국제대회'],
      rawData: icsEvent as unknown as Record<string, unknown>,
    };
  }

  private detectCountry(location: string, summary: string): CountryCode {
    const text = `${location} ${summary}`.toLowerCase();

    // 한국
    if (
      text.includes('korea') ||
      text.includes('seoul') ||
      text.includes('busan') ||
      text.includes('daegu')
    ) {
      return 'KR';
    }

    // 일본
    if (
      text.includes('japan') ||
      text.includes('tokyo') ||
      text.includes('osaka') ||
      text.includes('nagoya')
    ) {
      return 'JP';
    }

    // 미국
    if (
      text.includes('usa') ||
      text.includes('united states') ||
      text.includes('boston') ||
      text.includes('new york') ||
      text.includes('chicago')
    ) {
      return 'US';
    }

    // 독일
    if (text.includes('germany') || text.includes('berlin') || text.includes('munich')) {
      return 'DE';
    }

    // 영국
    if (
      text.includes('uk') ||
      text.includes('united kingdom') ||
      text.includes('london') ||
      text.includes('manchester')
    ) {
      return 'UK';
    }

    return 'INTL';
  }

  private extractDistances(summary: string, description: string): string[] {
    const distances: string[] = [];
    const text = `${summary} ${description || ''}`.toLowerCase();

    if (text.includes('marathon') || text.includes('42')) distances.push('풀');
    if (text.includes('half') || text.includes('21k')) distances.push('하프');
    if (text.includes('10k') || text.includes('10km')) distances.push('10km');
    if (text.includes('5k') || text.includes('5km')) distances.push('5km');
    if (text.includes('ultra') || text.includes('100k')) distances.push('100km');
    if (text.includes('50k')) distances.push('50km');

    // 기본값: 마라톤
    return distances.length > 0 ? distances : ['풀'];
  }

  private extractUrl(description: string, icsUrl?: string): string {
    if (icsUrl) return icsUrl;

    if (description) {
      const urlMatch = description.match(/https?:\/\/[^\s<>'"]+/);
      if (urlMatch) return urlMatch[0];
    }

    return '';
  }
}
