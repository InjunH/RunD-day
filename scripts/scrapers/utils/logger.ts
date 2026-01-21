/**
 * 스크래퍼 로깅 유틸리티
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  source?: string;
  message: string;
  data?: unknown;
}

const LOG_COLORS = {
  debug: '\x1b[90m', // gray
  info: '\x1b[36m', // cyan
  warn: '\x1b[33m', // yellow
  error: '\x1b[31m', // red
  reset: '\x1b[0m',
};

const LOG_ICONS = {
  debug: '🔍',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
};

class Logger {
  private source?: string;
  private logs: LogEntry[] = [];

  constructor(source?: string) {
    this.source = source;
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    const entry: LogEntry = { timestamp, level, source: this.source, message, data };
    this.logs.push(entry);

    const color = LOG_COLORS[level];
    const icon = LOG_ICONS[level];
    const reset = LOG_COLORS.reset;
    const sourceTag = this.source ? `[${this.source}]` : '';

    const formattedTime = timestamp.split('T')[1].split('.')[0];
    const logMessage = `${color}${icon} ${formattedTime} ${sourceTag} ${message}${reset}`;

    if (level === 'error') {
      console.error(logMessage, data || '');
    } else if (level === 'warn') {
      console.warn(logMessage, data || '');
    } else {
      console.log(logMessage, data ? JSON.stringify(data, null, 2) : '');
    }
  }

  debug(message: string, data?: unknown): void {
    if (process.env.DEBUG) {
      this.log('debug', message, data);
    }
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, error?: unknown): void {
    const errorData =
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : error;
    this.log('error', message, errorData);
  }

  /** 특정 소스용 자식 로거 생성 */
  child(source: string): Logger {
    return new Logger(source);
  }

  /** 모든 로그 가져오기 */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /** 로그 초기화 */
  clear(): void {
    this.logs = [];
  }
}

/** 기본 로거 인스턴스 */
export const logger = new Logger();

/** 소스별 로거 생성 */
export function createLogger(source: string): Logger {
  return new Logger(source);
}

export { Logger };
export type { LogEntry, LogLevel };
