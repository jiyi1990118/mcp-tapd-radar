import { describe, it, expect } from 'vitest';
import { TapdError, TapdErrorCode, classifyHttpError } from '../src/utils/error.js';

describe('TapdError', () => {
  it('creates error with code and message', () => {
    const error = new TapdError(TapdErrorCode.NOT_FOUND, 'Resource not found');
    expect(error.code).toBe(TapdErrorCode.NOT_FOUND);
    expect(error.message).toBe('Resource not found');
    expect(error.name).toBe('TapdError');
  });

  it('creates error with details', () => {
    const error = new TapdError(TapdErrorCode.AUTH_FAILED, 'Auth failed', { status: 401 });
    expect(error.details).toEqual({ status: 401 });
  });
});

describe('classifyHttpError', () => {
  it('classifies 401 as AUTH_FAILED', () => {
    const error = classifyHttpError(401, 'Unauthorized');
    expect(error.code).toBe(TapdErrorCode.AUTH_FAILED);
  });

  it('classifies 403 as AUTH_FAILED', () => {
    const error = classifyHttpError(403, 'Forbidden');
    expect(error.code).toBe(TapdErrorCode.AUTH_FAILED);
  });

  it('classifies 404 as NOT_FOUND', () => {
    const error = classifyHttpError(404, 'Not found');
    expect(error.code).toBe(TapdErrorCode.NOT_FOUND);
  });

  it('classifies 429 as RATE_LIMIT', () => {
    const error = classifyHttpError(429, 'Too many requests');
    expect(error.code).toBe(TapdErrorCode.RATE_LIMIT);
  });

  it('classifies 500 as SERVER_ERROR', () => {
    const error = classifyHttpError(500, 'Internal error');
    expect(error.code).toBe(TapdErrorCode.SERVER_ERROR);
  });

  it('classifies 502 as SERVER_ERROR', () => {
    const error = classifyHttpError(502, 'Bad gateway');
    expect(error.code).toBe(TapdErrorCode.SERVER_ERROR);
  });

  it('classifies unknown status as UNKNOWN', () => {
    const error = classifyHttpError(418, 'Teapot');
    expect(error.code).toBe(TapdErrorCode.UNKNOWN);
  });
});
