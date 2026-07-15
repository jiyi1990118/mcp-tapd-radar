import path from 'node:path';
import { logger } from './logger.js';

export interface ImageDiskSettings {
  enabled: boolean;
  downloadDir: string;
  limit: number;
  concurrency: number;
}

export interface ImageDiskOverrides {
  enabled?: boolean;
  downloadDir?: string;
}

const DEFAULT_DOWNLOAD_DIR = './.tapd-images';
const DEFAULT_LIMIT = 50;
const DEFAULT_CONCURRENCY = 5;

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  return value === '1' || value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function resolveImageDiskSettings(overrides: ImageDiskOverrides = {}): ImageDiskSettings {
  const enabled = overrides.enabled !== undefined
    ? overrides.enabled
    : parseBoolean(process.env.TAPD_IMAGE_DOWNLOAD_ENABLED, true);

  const downloadDir = path.resolve(overrides.downloadDir || process.env.TAPD_IMAGE_DOWNLOAD_DIR || DEFAULT_DOWNLOAD_DIR);
  const limit = parsePositiveInt(process.env.TAPD_IMAGE_DOWNLOAD_LIMIT, DEFAULT_LIMIT);
  const concurrency = parsePositiveInt(process.env.TAPD_IMAGE_CONCURRENCY, DEFAULT_CONCURRENCY);

  logger.debug('Image disk settings resolved', { enabled, downloadDir, limit, concurrency });

  return { enabled, downloadDir, limit, concurrency };
}
