import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { JWTPayload } from '../types/index.js';

export async function webviewRoutes(fastify: FastifyInstance) {
  // POST /mobile/v1/webview/session-token
  fastify.post('/webview/session-token', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const tokenSchema = z.object({
      targetTool: z.enum(['landing-builder', 'bio-builder', 'flow-builder', 'workflow-builder']),
    });

    const body = tokenSchema.parse(request.body);

    // Generate single-use temporary token with 5-minute expiration
    const singleUseToken = fastify.jwt.sign(
      {
        user_id: user.user_id,
        organization_id: user.organization_id,
        tool: body.targetTool,
        type: 'webview_single_use',
      },
      { expiresIn: '5m' }
    );

    const baseUrl = 'https://getaipilot.in';
    const targetUrl = `${baseUrl}/tools/${body.targetTool}?session_token=${singleUseToken}`;

    return reply.send({
      targetUrl,
      token: singleUseToken,
      expiresInSeconds: 300,
    });
  });
}
