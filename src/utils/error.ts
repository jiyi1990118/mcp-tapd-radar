export enum TapdErrorCode {
  AUTH_FAILED = 'AUTH_FAILED',
  INVALID_PARAMS = 'INVALID_PARAMS',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export class TapdError extends Error {
  code: TapdErrorCode;
  details?: unknown;

  constructor(code: TapdErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'TapdError';
    this.code = code;
    this.details = details;
  }
}

export const TAPD_PERMISSION_TIP = 'If you encounter permission errors, please go to https://open.tapd.cn/admin/4002/permission to configure the application permissions.';

export function classifyHttpError(status: number, info: string): TapdError {
  switch (status) {
    case 401:
      return new TapdError(TapdErrorCode.AUTH_FAILED, `Authentication failed: ${info}`);
    case 403:
      return new TapdError(TapdErrorCode.AUTH_FAILED, `Permission denied: ${info}. ${TAPD_PERMISSION_TIP}`);
    case 404:
      return new TapdError(TapdErrorCode.NOT_FOUND, `Resource not found: ${info}`);
    case 429:
      return new TapdError(TapdErrorCode.RATE_LIMIT, `Rate limited: ${info}`);
    default:
      if (status >= 500) {
        return new TapdError(TapdErrorCode.SERVER_ERROR, `Server error (${status}): ${info}`);
      }
      return new TapdError(TapdErrorCode.UNKNOWN, `HTTP ${status}: ${info}`);
  }
}
