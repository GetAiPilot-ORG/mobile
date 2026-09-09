import { FastifyReply, FastifyRequest } from 'fastify';
import { PermissionService } from '../services/permission.service.js';
import { JWTPayload } from '../types/index.js';

export async function authenticateToken(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const token = request.user as JWTPayload & { type?: string };
    if (token.type === 'webview_session') {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'A builder session cannot be used as a mobile API access token',
      });
    }
  } catch (err) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid or expired access token',
    });
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
