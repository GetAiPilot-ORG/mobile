import { randomBytes } from 'crypto';

export type WebviewTool =
  | 'landing-builder'
  | 'bio-builder'
  | 'flow-builder'
  | 'workflow-builder';

export interface WebviewAuthCodePayload {
  userId: string;
  email: string;
  organizationId: string;
  tool: WebviewTool;
  templateId?: string;
}

interface PendingCode extends WebviewAuthCodePayload {
  expiresAt: number;
}

/**
 * Stores only opaque, short-lived authorization codes. The browser exchanges a
 * code once, so neither a mobile access token nor user data is placed in the
 * deep-link URL (which may be retained in browser history or request logs).
 *
 * This is deliberately kept behind a small service so production deployments
 * can replace it with Redis/shared storage when BFF instances are scaled out.
 */
export class WebviewAuthCodeService {
  private static readonly pendingCodes = new Map<string, PendingCode>();

  static create(payload: WebviewAuthCodePayload, ttlSeconds: number): string {
    this.removeExpired();

    const code = randomBytes(32).toString('base64url');
    this.pendingCodes.set(code, {
      ...payload,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    return code;
  }

  static consume(code: string): WebviewAuthCodePayload | null {
    this.removeExpired();

    const pending = this.pendingCodes.get(code);
    // Delete before returning to make retries and concurrent requests one-time.
    this.pendingCodes.delete(code);

    if (!pending || pending.expiresAt <= Date.now()) {
      return null;
    }

    const { expiresAt: _expiresAt, ...payload } = pending;
    return payload;
  }

  private static removeExpired() {
    const now = Date.now();
    for (const [code, pending] of this.pendingCodes) {
      if (pending.expiresAt <= now) {
        this.pendingCodes.delete(code);
      }
    }
  }
}
