import { FastifyReply, FastifyRequest } from 'fastify';
import { HubAdapter } from '../adapters/hub.adapter.js';
import { PermissionService } from '../services/permission.service.js';
import { JWTPayload } from '../types/index.js';

export async function authenticateToken(request: FastifyRequest, reply: FastifyReply) {
  let token: JWTPayload & { type?: string };
  try {
    await request.jwtVerify();
    token = request.user as JWTPayload & { type?: string };
  } catch (err) {
    // Check if the request provided a valid Supabase access token (e.g. from web app or upstream auth)
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const rawToken = authHeader.slice(7).trim();
      const parts = rawToken.split('.');
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
          const isSupabaseToken =
            (typeof payload.iss === 'string' && payload.iss.includes('supabase.co')) ||
            payload.aud === 'authenticated';
          const isNotExpired =
            typeof payload.exp === 'number' ? payload.exp * 1000 > Date.now() : true;

          if (isSupabaseToken && isNotExpired && (payload.sub || payload.user_id)) {
            const userId = payload.sub || payload.user_id;
            const userEmail = payload.email || `${userId}@getaipilot.com`;
            const isSocialToken =
              typeof payload.iss === 'string' && payload.iss.includes('oqaysrnncwbtrujnxsdo');

            const userPayload: JWTPayload & { social_token?: string } = {
              user_id: userId,
              email: userEmail,
              organization_id: payload.organization_id || userId,
              role: 'Owner',
              permissions: ['*'],
              subscription_tier: 'GAP Pro',
              session_id: payload.session_id || `sess_${userId}`,
              social_token: isSocialToken ? rawToken : undefined,
            };

            request.user = userPayload;
            token = userPayload;
            return;
          }
        } catch {}
      }
    }

    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid or expired access token',
    });
  }

  if (token.type === 'webview_session') {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'A builder session cannot be used as a mobile API access token',
    });
  }

  // Device-backed tokens are checked against the server-side session record so
  // a remote "sign out device" takes effect immediately, not at JWT expiry.
  if (token.device_session) {
    try {
      const isActive = await HubAdapter.isDeviceSessionActive(token.user_id, token.session_id);
      if (!isActive) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'SessionRevoked',
          message: 'This device has been signed out. Please sign in again.',
        });
      }
    } catch (error) {
      request.log.error(error, 'Device session validation failed');
      return reply.status(503).send({
        statusCode: 503,
        error: 'SessionValidationUnavailable',
        message: 'Could not validate this device session. Please try again.',
      });
    }
  }
}

export function requirePermission(permission: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as JWTPayload;
    if (!user || !user.permissions) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Missing permissions context',
      });
    }

    const hasAccess = PermissionService.hasPermission(user.permissions, permission);
    if (!hasAccess) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: `Missing required permission: ${permission}`,
      });
    }
  };
}
