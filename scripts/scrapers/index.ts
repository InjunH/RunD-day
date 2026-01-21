/**
 * 마라톤 데이터 스크래퍼 메인 실행 파일
 *
 * 사용법:
 *   npx tsx scripts/scrapers/index.ts
 *
 * 환경변수:
 *   DEBUG=true - 디버그 로그 활성화
 */

import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from './utils/logger';
import { GoRunningScraper } from './sources/gorunning';
import { AimsScraper } from './sources/aims';
import { normalize } from './processors/normalizer';
import { deduplicate } from './processors/deduplicator';
import { validate } from './processors/validator';
import type { Scraper, MarathonEvent, ScrapingMetadata, ScraperResult } from './types';

const logger = createLogger('main');

// 출력 디렉토리
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'data');

// 스크래퍼 목록
const SCRAPERS: Scraper[] = [
  new GoRunningScraper(),
  new AimsScraper(),
];

/**
 * 메인 실행 함수
 */
async function main(): Promise<void> {
  const startTime = Date.now();
  logger.info('='.repeat(60));
  logger.info('마라톤 데이터 스크래핑 시작');
  logger.info('='.repeat(60));

  // 출력 디렉토리 생성
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    logger.info(`출력 디렉토리 생성: ${OUTPUT_DIR}`);
  }

  // 1. 모든 스크래퍼 실행
  logger.info('\n[1/4] 데이터 수집');
  const results = await runScrapers();

  // 2. 데이터 정규화
  logger.info('\n[2/4] 데이터 정규화');
  const allRawEvents = results.flatMap((r) => r.events);
  const normalizedEvents = normalize(allRawEvents);

  // 3. 중복 제거
  logger.info('\n[3/4] 중복 제거');
  const { events: dedupedEvents, stats: dedupStats } = deduplicate(normalizedEvents);

  // 4. 검증
  logger.info('\n[4/4] 데이터 검증');
  const { valid: validEvents, invalid: invalidEvents } = validate(dedupedEvents);

  // 결과 저장
  logger.info('\n파일 저장 중...');
  await saveResults(validEvents, results);

  // 완료 로그
  const duration = Date.now() - startTime;
  logger.info('\n' + '='.repeat(60));
  logger.info('스크래핑 완료');
  logger.info('='.repeat(60));
  logger.info(`총 소요 시간: ${(duration / 1000).toFixed(2)}초`);
  logger.info(`수집된 이벤트: ${allRawEvents.length}`);
  logger.info(`정규화 후: ${normalizedEvents.length}`);
  logger.info(`중복 제거 후: ${dedupedEvents.length} (${dedupStats.duplicatesFound}개 중복)`);
  logger.info(`최종 유효 이벤트: ${validEvents.length}`);
  if (invalidEvents.length > 0) {
    logger.warn(`무효 이벤트: ${invalidEvents.length}`);
  }
}

/**
 * 모든 스크래퍼 실행
 */
async function runScrapers(): Promise<ScraperResult[]> {
  const results: ScraperResult[] = [];

  for (const scraper of SCRAPERS) {
    logger.info(`\n[${scraper.name}] 스크래핑 시작...`);

    try {
      const result = await scraper.scrape();
      results.push(result);

      if (result.success) {
        logger.info(
          `[${scraper.name}] 성공: ${result.events.length}개 이벤트 (${result.metadata.duration}ms)`
        );
      } else {
        logger.error(`[${scraper.name}] 실패: ${result.error}`);
      }
    } catch (error) {
      logger.error(`[${scraper.name}] 예외 발생`, error);
      results.push({
        success: false,
        source: scraper.name,
        events: [],
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          scrapedAt: new Date().toISOString(),
          totalFound: 0,
          processedCount: 0,
        },
      });
    }
  }

  return results;
}

/**
 * 결과 파일 저장
 */
async function saveResults(
  events: MarathonEvent[],
  scraperResults: ScraperResult[]
): Promise<void> {
  // 날짜순 정렬
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // 국내/해외 분리
  const krEvents = sortedEvents.filter((e) => e.country === 'KR');
  const intlEvents = sortedEvents.filter((e) => e.country !== 'KR');

  // 메타데이터 생성
  const metadata: ScrapingMetadata = {
    lastRun: new Date().toISOString(),
    nextScheduledRun: getNextScheduledRun(),
    sources: scraperResults.map((r) => ({
      name: r.source,
      status: r.success ? 'success' : 'failed',
      itemCount: r.events.length,
      lastUpdated: r.metadata.scrapedAt,
      error: r.error,
    })),
    totalEvents: sortedEvents.length,
    krEvents: krEvents.length,
    intlEvents: intlEvents.length,
    version: '1.0.0',
  };

  // 파일 저장
  const files = [
    { name: 'marathons.json', data: sortedEvents },
    { name: 'marathons-kr.json', data: krEvents },
    { name: 'marathons-intl.json', data: intlEvents },
    { name: 'metadata.json', data: metadata },
  ];

  for (const file of files) {
    const filePath = path.join(OUTPUT_DIR, file.name);
    fs.writeFileSync(filePath, JSON.stringify(file.data, null, 2), 'utf-8');
    logger.info(`저장됨: ${file.name} (${Array.isArray(file.data) ? file.data.length + '개' : 'metadata'})`);
  }
}

/**
 * 다음 예정 실행 시간 계산 (매일 오전 6시 KST)
 */
function getNextScheduledRun(): string {
  const now = new Date();
  const next = new Date(now);

  // KST 오전 6시 = UTC 21시 (전날)
  next.setUTCHours(21, 0, 0, 0);

  // 이미 지났으면 다음 날
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next.toISOString();
}

// 실행
main().catch((error) => {
  logger.error('치명적 오류', error);
  process.exit(1);
});
