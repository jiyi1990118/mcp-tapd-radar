import { TapdConfig, TokenResponse } from '../types/tapd.js';
import { TapdError, TapdErrorCode } from '../utils/error.js';
import { logger } from '../utils/logger.js';

export class TapdAuthManager {
  private token: string | null = null;
  private expiresAt: number = 0;
  private config: TapdConfig;

  constructor(config: TapdConfig) {
    this.config = config;
  }

  isTokenExpired(): boolean {
    return !this.token || Date.now() >= this.expiresAt;
  }

  invalidateToken(): void {
    this.token = null;
    this.expiresAt = 0;
    logger.debug('Token invalidated, will refresh on next request');
  }

  async getToken(): Promise<string> {
    if (!this.isTokenExpired()) {
      return this.token!;
    }
    return this.refreshToken();
  }

  async refreshToken(): Promise<string> {
    const baseUrl = this.config.baseUrl || 'https://api.tapd.cn';
    const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

    try {
      logger.debug('Refreshing access token');
      const response = await fetch(`${baseUrl}/tokens/request_token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        throw new TapdError(TapdErrorCode.AUTH_FAILED, `Token request failed with status ${response.status}`);
      }

      const result = await response.json() as { status: number; data: TokenResponse; info: string };
      if (result.status !== 1) {
        throw new TapdError(TapdErrorCode.AUTH_FAILED, `Token request failed: ${result.info}`);
      }

      this.token = result.data.access_token;
      this.expiresAt = Date.now() + (result.data.expires_in * 1000) - 60000;
      logger.debug('Token refreshed successfully');
      return this.token!;
    } catch (error) {
      if (error instanceof TapdError) throw error;
      throw new TapdError(TapdErrorCode.NETWORK_ERROR, `Network error during authentication: ${(error as Error).message}`);
    }
  }
}
