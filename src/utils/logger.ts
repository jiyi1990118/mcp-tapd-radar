type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function getLevel(): LogLevel {
  const env = process.env.LOG_LEVEL?.toLowerCase();
  if (env && env in LOG_LEVELS) return env as LogLevel;
  return 'info';
}

function format(level: LogLevel, message: string, data?: unknown): string {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase()}] ${message}`;
  if (data !== undefined) {
    return `${base} ${typeof data === 'string' ? data : JSON.stringify(data)}`;
  }
  return base;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[getLevel()];
}

export const logger = {
  debug(message: string, data?: unknown) {
    if (shouldLog('debug')) console.error(format('debug', message, data));
  },
  info(message: string, data?: unknown) {
    if (shouldLog('info')) console.error(format('info', message, data));
  },
  warn(message: string, data?: unknown) {
    if (shouldLog('warn')) console.error(format('warn', message, data));
  },
  error(message: string, data?: unknown) {
    if (shouldLog('error')) console.error(format('error', message, data));
  },
};
