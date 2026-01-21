/**
 * gorunning.kr 스크래퍼
 * 국내 마라톤 대회 정보 수집
 */

import { chromium, type Page } from 'playwright';
import { createLogger } from '../utils/logger';
import { parseDate } from '../utils/http';
import type {
  Scraper,
  ScraperResult,
  RawMarathonEvent,
  RegistrationStatus,
  KRRegion,
} from '../types';
import { KR_REGIONS } from '../types';

const logger = createLogger('gorunning');

interface GoRunningRaceRow {
  date: string;
  name: string;
  organizer: string;
  location: string;
  status: string;
  link: string;
}

export class GoRunningScraper implements Scraper {
  name = 'gorunning' as const;
  private baseUrl = 'https://gorunning.kr';

  async scrape(): Promise<ScraperResult> {
    const startTime = Date.now();
    logger.info('스크래핑 시작...');

    const browser = await chromium.launch({
      headless: true,
    });

    try {
      const page = await browser.newPage();

      // 페이지 로드
      logger.info(`${this.baseUrl}/races 접속 중...`);
      await page.goto(`${this.baseUrl}/races`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // 페이지가 완전히 로드될 때까지 대기
      await page.waitForTimeout(2000);

      // 데이터 추출
      const races = await this.extractRaces(page);
      logger.info(`${races.length}개 대회 발견`);

      // RawMarathonEvent로 변환
      const events: RawMarathonEvent[] = [];
      for (const race of races) {
        try {
          const event = this.transformToRaw(race);
          events.push(event);
        } catch (error) {
          logger.warn(`변환 실패: ${race.name}`, error);
        }
      }

      const duration = Date.now() - startTime;
      logger.info(`스크래핑 완료: ${events.length}개 이벤트 (${duration}ms)`);

      return {
        success: true,
        source: this.name,
        events,
        metadata: {
          scrapedAt: new Date().toISOString(),
          totalFound: races.length,
          processedCount: events.length,
          duration,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('스크래핑 실패', error);

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
    } finally {
      await browser.close();
    }
  }

  private async extractRaces(page: Page): Promise<GoRunningRaceRow[]> {
    // 테이블 또는 리스트에서 데이터 추출
    // 실제 gorunning.kr 페이지 구조에 맞게 조정 필요
    const races = await page.evaluate(() => {
      const results: GoRunningRaceRow[] = [];

      // 테이블 형식 시도
      const tableRows = document.querySelectorAll('table tbody tr');
      if (tableRows.length > 0) {
        tableRows.forEach((row) => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 4) {
            results.push({
              date: cells[0]?.textContent?.trim() || '',
              name: cells[1]?.textContent?.trim() || '',
              organizer: cells[2]?.textContent?.trim() || '',
              location: cells[3]?.textContent?.trim() || '',
              status: cells[4]?.textContent?.trim() || '',
              link: cells[1]?.querySelector('a')?.href || '',
            });
          }
        });
        return results;
      }

      // 카드/리스트 형식 시도
      const cards = document.querySelectorAll('[class*="race"], [class*="event"], [class*="card"]');
      cards.forEach((card) => {
        const name =
          card.querySelector('[class*="title"], h2, h3')?.textContent?.trim() || '';
        const date =
          card.querySelector('[class*="date"], time')?.textContent?.trim() || '';
        const location =
          card.querySelector('[class*="location"], [class*="place"]')?.textContent?.trim() ||
          '';
        const link = card.querySelector('a')?.href || '';

        if (name && date) {
          results.push({
            date,
            name,
            organizer: '',
            location,
            status: '',
            link,
          });
        }
      });

      return results;
    });

    // 이름이 있는 레이스만 필터링 (날짜는 없어도 이름에서 추출 가능)
    return races.filter((r: GoRunningRaceRow) => r.name);
  }

  private transformToRaw(raw: GoRunningRaceRow): RawMarathonEvent {
    return {
      source: this.name,
      sourceId: this.generateId(raw),
      name: raw.name,
      date: this.parseRaceDate(raw.date, raw.name),
      location: {
        country: 'KR',
        region: this.extractRegion(raw.location),
        detail: raw.location,
      },
      distances: this.extractDistances(raw.name),
      registrationUrl: raw.link || undefined,
      organizer: raw.organizer || undefined,
      registration: {
        status: this.parseStatus(raw.status),
      },
      tags: this.extractTags(raw.name),
      rawData: raw as unknown as Record<string, unknown>,
    };
  }

  private generateId(raw: GoRunningRaceRow): string {
    // 이름과 날짜로 고유 ID 생성
    const normalized = raw.name
      .replace(/[^a-zA-Z0-9가-힣]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
    const dateStr = raw.date.replace(/[^0-9]/g, '');
    return `${normalized}-${dateStr}`.slice(0, 100);
  }

  private parseRaceDate(dateStr: string, eventName?: string): string {
    // 날짜 문자열이 비어있거나 유효하지 않은 경우 이벤트 이름에서 날짜 추출 시도
    if (!dateStr || dateStr.trim() === '') {
      return this.extractDateFromName(eventName || '');
    }

    try {
      return parseDate(dateStr);
    } catch {
      // 기본값: 현재 연도 + 추출된 월/일
      const match = dateStr.match(/(\d{1,2})[./월](\d{1,2})/);
      if (match) {
        const year = new Date().getFullYear();
        const month = match[1].padStart(2, '0');
        const day = match[2].padStart(2, '0');
        return `${year}-${month}-${day}`;
      }

      // 이벤트 이름에서 날짜 추출 시도
      const nameDate = this.extractDateFromName(eventName || '');
      if (nameDate !== this.getDefaultDate()) {
        return nameDate;
      }

      logger.warn(`날짜 파싱 실패: "${dateStr}" (이벤트: ${eventName})`);
      return this.getDefaultDate();
    }
  }

  private extractDateFromName(name: string): string {
    const year = new Date().getFullYear();

    // 이름에서 날짜 패턴 추출: "1월31일", "01.31", "1/31" 등
    const koreanMatch = name.match(/(\d{1,2})월\s*(\d{1,2})일?/);
    if (koreanMatch) {
      return `${year}-${koreanMatch[1].padStart(2, '0')}-${koreanMatch[2].padStart(2, '0')}`;
    }

    const dotMatch = name.match(/(\d{1,2})[./](\d{1,2})/);
    if (dotMatch) {
      return `${year}-${dotMatch[1].padStart(2, '0')}-${dotMatch[2].padStart(2, '0')}`;
    }

    return this.getDefaultDate();
  }

  private getDefaultDate(): string {
    // 기본값: 현재 연도 말
    const year = new Date().getFullYear();
    return `${year}-12-31`;
  }

  private extractRegion(location: string): KRRegion | '기타' {
    for (const region of KR_REGIONS) {
      if (location.includes(region)) {
        return region;
      }
    }
    return '기타';
  }

  private extractDistances(name: string): string[] {
    const distances: string[] = [];
    const text = name.toLowerCase();

    // 풀코스/마라톤
    if (text.includes('풀') || text.includes('full') || text.includes('42')) {
      distances.push('풀');
    }
    // 하프
    if (text.includes('하프') || text.includes('half') || text.includes('21')) {
      distances.push('하프');
    }
    // 10km
    if (text.includes('10k') || text.includes('10km')) {
      distances.push('10km');
    }
    // 5km
    if (text.includes('5k') || text.includes('5km')) {
      distances.push('5km');
    }
    // 울트라
    if (text.includes('울트라') || text.includes('100k') || text.includes('50k')) {
      if (text.includes('100')) distances.push('100km');
      if (text.includes('50')) distances.push('50km');
    }

    // 기본값
    return distances.length > 0 ? distances : ['풀'];
  }

  private extractTags(name: string): string[] {
    const tags: string[] = [];
    const text = name.toLowerCase();

    if (text.includes('iaaf') || text.includes('공인')) tags.push('IAAF공인');
    if (text.includes('국제')) tags.push('국제대회');
    if (text.includes('울트라')) tags.push('울트라');
    if (text.includes('트레일')) tags.push('트레일런');
    if (text.includes('야간') || text.includes('나이트')) tags.push('야간대회');
    if (text.includes('비대면') || text.includes('버추얼')) tags.push('비대면');

    return tags;
  }

  private parseStatus(status: string): RegistrationStatus {
    if (!status) return 'unknown';

    if (status.includes('접수중') || status.includes('모집중')) return 'open';
    if (status.includes('마감') || status.includes('종료')) return 'closed';
    if (status.includes('예정') || status.includes('준비')) return 'upcoming';

    return 'unknown';
  }
}
