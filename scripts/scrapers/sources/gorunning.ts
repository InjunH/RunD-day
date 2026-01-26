/**
 * gorunning.kr 스크래퍼
 * 국내 마라톤 대회 정보 수집
 */

import { chromium, type Page } from 'playwright';
import { createLogger } from '../utils/logger';
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
  name: string;
  date: string; // 날짜 (섹션 헤더에서 추출)
  distance: string; // 종목 (풀, 하프, 10km 등)
  region: string; // 지역
  location: string; // 장소
  organizer: string; // 주최
  status: string; // 등록상태
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
    // gorunning.kr은 날짜별로 섹션을 나누어 대회를 표시
    // 각 섹션의 헤더에서 날짜를 추출하고, 그 아래 테이블에서 대회 정보 추출
    const races = await page.evaluate(() => {
      const results: Array<GoRunningRaceRow & { date: string }> = [];

      // 날짜 앵커 섹션 찾기: <div id="race-2026-03-08">
      const dateSections = document.querySelectorAll('[id^="race-"]');

      dateSections.forEach((section) => {
        // 섹션 헤더에서 날짜 텍스트 추출: "03월 08일 (일)"
        const dateSpan = section.querySelector('h3 span.bg-blue-100');
        const dateText = dateSpan?.textContent?.trim() || '';

        // 날짜 파싱: "03월 08일 (일)" → "2026-03-08"
        const dateMatch = dateText.match(/(\d{1,2})월\s*(\d{1,2})일/);
        if (!dateMatch) return; // 날짜를 찾지 못하면 스킵

        const month = dateMatch[1].padStart(2, '0');
        const day = dateMatch[2].padStart(2, '0');
        const year = new Date().getFullYear();
        const date = `${year}-${month}-${day}`;

        // 이 섹션 내의 모든 테이블 행 추출
        // 데스크톱 뷰 테이블 구조:
        // [0]: 순번, [1]: 대회명, [2]: 종목, [3]: 지역, [4]: 장소, [5]: 주최, [6]: 등록상태
        const tableRows = section.querySelectorAll('table tbody tr');
        tableRows.forEach((row) => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 6) {
            const name = cells[1]?.textContent?.trim() || '';
            if (name) {
              results.push({
                name,
                date, // ✅ 섹션 헤더에서 추출한 정확한 날짜
                distance: cells[2]?.textContent?.trim() || '',
                region: cells[3]?.textContent?.trim() || '',
                location: cells[4]?.textContent?.trim() || '',
                organizer: cells[5]?.textContent?.trim() || '',
                status: cells[6]?.textContent?.trim() || '',
                link: cells[1]?.querySelector('a')?.href || '',
              });
            }
          }
        });
      });

      return results;
    });

    // 이름이 있는 레이스만 필터링
    return races.filter((r) => r.name);
  }

  private transformToRaw(raw: GoRunningRaceRow): RawMarathonEvent {
    // 날짜는 이미 섹션 헤더에서 추출되어 raw.date에 저장됨
    return {
      source: this.name,
      sourceId: this.generateId(raw, raw.date),
      name: raw.name,
      date: raw.date,
      location: {
        country: 'KR',
        region: this.extractRegionFromRaw(raw),
        detail: raw.location || raw.region,
      },
      distances: this.extractDistancesFromRaw(raw),
      registrationUrl: raw.link || undefined,
      organizer: raw.organizer || undefined,
      registration: {
        status: this.parseStatus(raw.status),
      },
      tags: this.extractTags(raw.name),
      rawData: raw as unknown as Record<string, unknown>,
    };
  }

  private generateId(raw: GoRunningRaceRow, date: string): string {
    // 이름과 날짜로 고유 ID 생성
    const normalized = raw.name
      .replace(/[^a-zA-Z0-9가-힣]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
    const dateStr = date.replace(/[^0-9]/g, '');
    return `${normalized}-${dateStr}`.slice(0, 100);
  }

  private extractRegionFromRaw(raw: GoRunningRaceRow): KRRegion | '기타' {
    // 먼저 region 필드 확인
    if (raw.region) {
      for (const region of KR_REGIONS) {
        if (raw.region.includes(region)) {
          return region;
        }
      }
    }
    // fallback: location에서 추출
    return this.extractRegion(raw.location);
  }

  private extractDistancesFromRaw(raw: GoRunningRaceRow): string[] {
    const distances: string[] = [];

    // 먼저 distance 필드에서 추출 (종목 열)
    if (raw.distance) {
      const dist = raw.distance.toLowerCase();
      if (dist.includes('풀') || dist.includes('full') || dist.includes('42')) {
        distances.push('풀');
      }
      if (dist.includes('하프') || dist.includes('half') || dist.includes('21')) {
        distances.push('하프');
      }
      if (dist.includes('10k') || dist.includes('10km')) {
        distances.push('10km');
      }
      if (dist.includes('5k') || dist.includes('5km')) {
        distances.push('5km');
      }
    }

    // distance 필드에서 추출 못했으면 이름에서 추출
    if (distances.length === 0) {
      return this.extractDistances(raw.name);
    }

    return distances;
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
