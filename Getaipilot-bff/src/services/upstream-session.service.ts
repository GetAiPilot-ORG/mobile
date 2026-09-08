import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

export interface UpstreamSessionData {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in seconds
  updatedAt: number;
}

export class UpstreamSessionService {
  private static publicClient: SupabaseClient = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // In-memory server-side session registry
  private static sessionsBySessionId = new Map<string, UpstreamSessionData>();
  private static sessionsByUserId = new Map<string, string>(); // userId -> sessionId

  // Single-flight refresh mutex to prevent concurrent refresh races
  private static activeRefreshes = new Map<string, Promise<string | null>>();

  /**
   * Persists an upstream Supabase session associated with a BFF session ID
   */
  public static saveSession(
    sessionId: string,
    userId: string,
    session: {
      access_token: string;
      refresh_token: string;
      expires_at?: number;
      expires_in?: number;
    }
  ): void {
    const expiresAt =
      session.expires_at ||
      Math.floor(Date.now() / 1000) + (session.expires_in || 3600);

    const sessionData: UpstreamSessionData = {
      userId,
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt,
      updatedAt: Date.now(),
    };

    this.sessionsBySessionId.set(sessionId, sessionData);
    this.sessionsByUserId.set(userId, sessionId);
  }

  /**
   * Retrieves active session by session ID or user ID
   */
  public static getSession(
    sessionId?: string,
    userId?: string
  ): UpstreamSessionData | null {
    if (sessionId && this.sessionsBySessionId.has(sessionId)) {
      return this.sessionsBySessionId.get(sessionId)!;
    }

    if (userId && this.sessionsByUserId.has(userId)) {
      const mappedSessionId = this.sessionsByUserId.get(userId)!;
      return this.sessionsBySessionId.get(mappedSessionId) || null;
    }

    return null;
  }

  /**
   * Retrieves a valid, unexpired Supabase user access token.
   * If token is near expiration (< 60s remaining), automatically refreshes it.
   */
  public static async getSupabaseAccessToken(
    sessionId?: string,
    userId?: string
  ): Promise<string | null> {
    const session = this.getSession(sessionId, userId);
    if (!session) {
      return null;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const timeRemaining = session.expiresAt - nowSeconds;

    // If more than 60 seconds remaining, token is valid
    if (timeRemaining > 60) {
      return session.accessToken;
    }

    // Token is near expiry or expired -> refresh single-flight
    const targetSessionId = sessionId || (userId ? this.sessionsByUserId.get(userId) : undefined);
    if (!targetSessionId) {
      return session.accessToken;
    }

    return await this.refreshSupabaseSession(targetSessionId, userId);
  }

  /**
   * Refreshes the upstream Supabase session using the stored refresh token.
   * Protected with single-flight mutex to avoid multiple simultaneous refresh requests.
   */
  public static async refreshSupabaseSession(
    sessionId?: string,
    userId?: string
  ): Promise<string | null> {
    const session = this.getSession(sessionId, userId);
    if (!session || !session.refreshToken) {
      return null;
    }

    const mutexKey = sessionId || session.userId;

    // If a refresh is already in flight for this session, reuse it
    if (this.activeRefreshes.has(mutexKey)) {
      return await this.activeRefreshes.get(mutexKey)!;
    }

    const refreshPromise = (async () => {
      try {
        const { data, error } = await this.publicClient.auth.refreshSession({
          refresh_token: session.refreshToken,
        });

        if (error || !data.session?.access_token) {
          console.warn(`[UpstreamSessionService] Upstream refresh failed for user ${session.userId}:`, error?.message);
          return null;
        }

        const newSession = data.session;
        const newExpiresAt =
          newSession.expires_at ||
          Math.floor(Date.now() / 1000) + (newSession.expires_in || 3600);

        session.accessToken = newSession.access_token;
        if (newSession.refresh_token) {
          session.refreshToken = newSession.refresh_token;
        }
        session.expiresAt = newExpiresAt;
        session.updatedAt = Date.now();

        if (sessionId) {
          this.sessionsBySessionId.set(sessionId, session);
        }
        this.sessionsByUserId.set(session.userId, sessionId || session.userId);

        return session.accessToken;
      } catch (err: any) {
        console.error(`[UpstreamSessionService] Unexpected exception during token refresh:`, err.message);
        return null;
      } finally {
        this.activeRefreshes.delete(mutexKey);
      }
    })();

    this.activeRefreshes.set(mutexKey, refreshPromise);
    return await refreshPromise;
  }

  /**
   * Clears the upstream session on user logout
   */
  public static clearSession(sessionId?: string, userId?: string): void {
    if (sessionId) {
      const session = this.sessionsBySessionId.get(sessionId);
      if (session) {
        this.sessionsByUserId.delete(session.userId);
      }
      this.sessionsBySessionId.delete(sessionId);
    }

    if (userId) {
      const mappedSessionId = this.sessionsByUserId.get(userId);
      if (mappedSessionId) {
        this.sessionsBySessionId.delete(mappedSessionId);
      }
      this.sessionsByUserId.delete(userId);
    }
  }
}
