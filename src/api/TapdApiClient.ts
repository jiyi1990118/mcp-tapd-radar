import { TapdAuthManager } from '../auth/TapdAuthManager.js';
import { TapdApiResponse, TapdConfig } from '../types/tapd.js';
import { TapdError, TapdErrorCode, classifyHttpError, TAPD_PERMISSION_TIP } from '../utils/error.js';
import { logger } from '../utils/logger.js';

export class TapdApiClient {
  private authManager: TapdAuthManager;
  private baseUrl: string;
  private maxRetries: number = 3;

  constructor(config: TapdConfig) {
    this.authManager = new TapdAuthManager(config);
    this.baseUrl = config.baseUrl || 'https://api.tapd.cn';
  }

  setMaxRetries(retries: number): void {
    this.maxRetries = retries;
  }

  async request<T>(
    method: string,
    endpoint: string,
    params?: Record<string, string>,
    body?: URLSearchParams | Record<string, unknown>,
    retryCount: number = 0,
  ): Promise<T> {
    const token = await this.authManager.getToken();
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== '') {
          url.searchParams.append(key, value);
        }
      }
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
    };

    let fetchBody: string | undefined;

    if (body) {
      if (body instanceof URLSearchParams) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        fetchBody = body.toString();
      } else {
        headers['Content-Type'] = 'application/json';
        fetchBody = JSON.stringify(body);
      }
    }

    logger.debug(`${method} ${endpoint}`, { params, body: fetchBody });

    try {
      const response = await fetch(url.toString(), {
        method,
        headers,
        body: fetchBody,
      });

      if (!response.ok) {
        if ((response.status === 401 || response.status === 403) && retryCount < 1) {
          logger.debug('Auth failed, invalidating token and retrying');
          this.authManager.invalidateToken();
          return this.request<T>(method, endpoint, params, body, retryCount + 1);
        }

        const errorInfo = await response.text().catch(() => 'Unknown error');
        throw classifyHttpError(response.status, errorInfo);
      }

      const result = await response.json() as TapdApiResponse<T>;

      if (result.status !== 1) {
        const msg = result.info || '';
        const permissionKeywords = ['permission', '权限', 'no access', 'forbidden', 'unauthorized'];
        const isPermissionError = permissionKeywords.some(kw => msg.toLowerCase().includes(kw));
        const suffix = isPermissionError ? ` ${TAPD_PERMISSION_TIP}` : '';
        throw new TapdError(TapdErrorCode.UNKNOWN, `API error: ${msg}${suffix}`);
      }

      return result.data;
    } catch (error) {
      if (error instanceof TapdError) throw error;

      if (retryCount < this.maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
        logger.debug(`Network error, retrying in ${delay}ms (attempt ${retryCount + 1}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.request<T>(method, endpoint, params, body, retryCount + 1);
      }

      throw new TapdError(TapdErrorCode.NETWORK_ERROR, `Request failed: ${(error as Error).message}`);
    }
  }

  get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', endpoint, params);
  }

  post<T>(endpoint: string, body?: Record<string, unknown>): Promise<T> {
    return this.request<T>('POST', endpoint, undefined, body);
  }

  put<T>(endpoint: string, body?: Record<string, unknown>): Promise<T> {
    return this.request<T>('PUT', endpoint, undefined, body);
  }

  delete<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>('DELETE', endpoint, params);
  }
}
