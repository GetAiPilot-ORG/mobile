import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import Fastify from 'fastify';
import { env } from './config/env.js';
// Trigger reload for SOCIAL_SERVICE_URL update
import { authRoutes } from './routes/auth.routes.js';
import { billingRoutes } from './routes/billing.routes.js';
import { crmRoutes } from './routes/crm.routes.js';
import { dashboardRoutes } from './routes/dashboard.routes.js';
import { inboxRoutes } from './routes/inbox.routes.js';
import { redirectRoutes } from './routes/redirect.routes.js';
import { socialRoutes } from './routes/social.routes.js';
import { telegramRoutes } from './routes/telegram.routes.js';
import { voiceRoutes } from './routes/voice.routes.js';
import { paymentRoutes } from './routes/payment.routes.js';
import { teamRoutes } from './routes/team.routes.js';
import { webviewRoutes } from './routes/webview.routes.js';
import { whatsappRoutes } from './routes/whatsapp.routes.js';
import { WebSocketService } from './services/websocket.service.js';
import { JWTPayload } from './types/index.js';

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

async function main() {
  // Supabase Project Ref Diagnostic
  const getProjectRef = (urlStr: string) => {
    try {
      return new URL(urlStr).hostname.split('.')[0];
    } catch {
      return 'unknown';
    }
  };

  const hubRef = getProjectRef(env.SUPABASE_URL);
  const crmRef = getProjectRef(env.CRM_SUPABASE_URL);

  console.log(`[SUPABASE]\nhub=${hubRef}\ncrm=${crmRef}`);

  if (hubRef === crmRef && hubRef !== 'unknown') {
    console.warn('⚠️ WARNING: Hub and CRM are configured with the SAME Supabase project reference!');
  }

  // CORS Configuration
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  // JWT Configuration
  await app.register(jwt, {
    secret: env.JWT_SECRET,
  });

  // WebSocket Plugin
  await app.register(websocket);

  // Health Check
  app.get('/health', async () => ({
    status: 'ok',
    service: 'GetAiPilot-BFF',
    timestamp: new Date().toISOString(),
  }));

  // WebSocket Realtime Gateway Route
  app.register(async function (fastify) {
    fastify.get('/mobile/v1/realtime', { websocket: true }, (socket: any, req) => {
      const ws = socket?.socket || socket;
      const token = (req.query as { token?: string }).token;
      if (!token) {
        ws.close(1008, 'Token required');
        return;
      }

      try {
        const decoded = fastify.jwt.verify<JWTPayload>(token);
        WebSocketService.registerConnection(decoded.organization_id, ws);
        ws.send(
          JSON.stringify({
            event: 'connected',
            organizationId: decoded.organization_id,
            timestamp: new Date().toISOString(),
          })
        );
      } catch {
        ws.close(1008, 'Invalid token');
      }
    });
  });

  // Register Mobile V1 API Routes
  await app.register(authRoutes, { prefix: '/mobile/v1/auth' });
  await app.register(dashboardRoutes, { prefix: '/mobile/v1' });
  await app.register(inboxRoutes, { prefix: '/mobile/v1' });
  await app.register(whatsappRoutes, { prefix: '/mobile/v1' });
  await app.register(crmRoutes, { prefix: '/mobile/v1' });
  await app.register(voiceRoutes, { prefix: '/mobile/v1' });
  await app.register(socialRoutes, { prefix: '/mobile/v1' });
  await app.register(telegramRoutes, { prefix: '/mobile/v1' });
  await app.register(billingRoutes, { prefix: '/mobile/v1' });
  await app.register(paymentRoutes, { prefix: '/mobile/v1' });
  await app.register(teamRoutes, { prefix: '/mobile/v1' });
  await app.register(webviewRoutes, { prefix: '/mobile/v1' });
  await app.register(redirectRoutes);

  // Error Handler
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    const statusCode = error.statusCode || 500;
    reply.status(statusCode).send({
      statusCode,
      error: error.name || 'InternalServerError',
      message: error.message || 'An unexpected error occurred',
    });
  });

  try {
    console.log('=== FASTIFY REGISTERED ROUTES ===');
    console.log(app.printRoutes());
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`🚀 GetAiPilot-BFF running on http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
