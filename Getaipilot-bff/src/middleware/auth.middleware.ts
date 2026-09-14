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
