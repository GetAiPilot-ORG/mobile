// import { randomUUID } from 'crypto';
// import { FastifyInstance } from 'fastify';
// import { z } from 'zod';
// import { DeviceLoginInput, HubAdapter } from '../adapters/hub.adapter.js';
// import { authenticateToken } from '../middleware/auth.middleware.js';
// import { PermissionService } from '../services/permission.service.js';
// import { TenantService } from '../services/tenant.service.js';
// import { UpstreamSessionService } from '../services/upstream-session.service.js';
// import { JWTPayload, UserRole } from '../types/index.js';

// export async function authRoutes(fastify: FastifyInstance) {
//   // POST /mobile/v1/auth/login - Production Hub Identity Authentication
//   fastify.post('/login', async (request, reply) => {
//     const loginSchema = z.object({
//       email: z.string().email(),
//       password: z.string().min(1),
//       device: z.object({
//         installationId: z.string().min(8).max(160),
//         platform: z.enum(['ios', 'android', 'web']),
//         deviceName: z.string().min(1).max(160),
//         deviceType: z.enum(['phone', 'tablet', 'desktop', 'tv', 'unknown']).optional(),
//         osVersion: z.string().max(80).optional(),
//         appVersion: z.string().max(80).optional(),
//       }).optional(),
//     });

//     const parseResult = loginSchema.safeParse(request.body);
//     if (!parseResult.success) {
//       return reply.status(400).send({
//         statusCode: 400,
//         error: 'BadRequest',
//         message: 'Valid email and password are required',
//       });
//     }

//     const { email, password } = parseResult.data;

//     let authUser: any;
//     let authSession: any = null;
//     try {
//       const authResult = await HubAdapter.authenticateUser(email, password);
//       authUser = authResult?.user;
//       authSession = authResult?.session;
//     } catch (e: any) {
//       return reply.status(401).send({
//         statusCode: 401,
//         error: 'Unauthorized',
//         message: e?.message || 'Invalid email or password',
//       });
//     }

//     if (!authUser?.id) {
//       return reply.status(401).send({
//         statusCode: 401,
//         error: 'Unauthorized',
//         message: 'Authentication failed: User identity not found',
//       });
//     }

//     // Generate unique BFF session ID
//     const sessionId = `sess_${randomUUID()}`;

//     // Securely preserve upstream Supabase session server-side
//     if (authSession?.access_token && authSession?.refresh_token) {
//       UpstreamSessionService.saveSession(sessionId, authUser.id, authSession);
//     }

//     // Resolve profile and subscription details from Hub PostgreSQL
//     const profile = await HubAdapter.getUserProfile(authUser.id, email);
//     const role: UserRole = profile.role;
//     const permissions = PermissionService.getPermissionsForRole(role, profile.subscriptionTier);
//     const tenantMapping = await TenantService.resolveTenantMapping(
//       authUser.id,
//       profile.organizationId,
//       profile.telegramUserId
//     );

//     // Sign Mobile JWT with session_id reference
//     const tokenPayload: JWTPayload = {
//       user_id: authUser.id,
//       email: authUser.email || email,
//       organization_id: tenantMapping.hub_org_id,
//       role,
//       permissions,
//       subscription_tier: profile.subscriptionTier,
//       session_id: sessionId,
//       device_session: Boolean(parseResult.data.device),
//     };

//     const accessToken = fastify.jwt.sign(tokenPayload, { expiresIn: '7d' });
//     const refreshToken = fastify.jwt.sign(
//       {
//         user_id: authUser.id,
//         email: authUser.email || email,
//         session_id: sessionId,
//         device_session: Boolean(parseResult.data.device),
//       },
//       { expiresIn: '30d' }
//     );

//     if (parseResult.data.device) {
//       try {
//         await HubAdapter.registerDeviceSession(
//           authUser.id,
//           sessionId,
//           parseResult.data.device as DeviceLoginInput
//         );
//       } catch (error: any) {
//         request.log.error(error, 'Unable to record device login');
//         return reply.status(500).send({
//           statusCode: 500,
//           error: 'DeviceSessionTrackingFailed',
//           message: 'Could not record this device login. Please try again.',
//         });
//       }
//     }

//     return reply.send({
//       accessToken,
//       refreshToken,
//       user: {
//         id: authUser.id,
//         email: authUser.email || email,
//         name: profile.fullName,
//         role,
//         isAdmin: profile.isAdmin,
//         organizationId: tenantMapping.hub_org_id,
//         subscriptionTier: profile.subscriptionTier,
//         permissions,
//       },
//       tenantMapping,
//     });
//   });

//   // POST /mobile/v1/auth/refresh - Silent Token Refresh Exchange
//   fastify.post('/refresh', async (request, reply) => {
//     const refreshSchema = z.object({
//       refreshToken: z.string().min(1),
//     });

//     const parseResult = refreshSchema.safeParse(request.body);
//     if (!parseResult.success) {
//       return reply.status(400).send({
//         statusCode: 400,
//         error: 'BadRequest',
//         message: 'refreshToken is required',
//       });
//     }

//     const { refreshToken } = parseResult.data;

//     try {
//       const decoded = fastify.jwt.verify<{
//         user_id: string;
//         email?: string;
//         session_id?: string;
//         device_session?: boolean;
//       }>(refreshToken);
//       if (decoded.device_session) {
//         const isActive = await HubAdapter.isDeviceSessionActive(decoded.user_id, decoded.session_id);
//         if (!isActive) {
//           return reply.status(401).send({
//             statusCode: 401,
//             error: 'SessionRevoked',
//             message: 'This device has been signed out. Please sign in again.',
//           });
//         }
//       }
//       const profile = await HubAdapter.getUserProfile(decoded.user_id, decoded.email);
//       const role: UserRole = profile.role;
//       const permissions = PermissionService.getPermissionsForRole(role, profile.subscriptionTier);
//       const tenantMapping = await TenantService.resolveTenantMapping(
//         decoded.user_id,
//         profile.organizationId,
//         profile.telegramUserId
//       );

//       const sessionId = decoded.session_id || `sess_${randomUUID()}`;

//       const tokenPayload: JWTPayload = {
//         user_id: decoded.user_id,
//         email: profile.email,
//         organization_id: tenantMapping.hub_org_id,
//         role,
//         permissions,
//         subscription_tier: profile.subscriptionTier,
//         session_id: sessionId,
//         device_session: Boolean(decoded.device_session),
//       };

//       const accessToken = fastify.jwt.sign(tokenPayload, { expiresIn: '7d' });
//       return reply.send({
//         accessToken,
//         user: {
//           id: decoded.user_id,
//           email: profile.email,
//           name: profile.fullName,
//           role,
//           organizationId: tenantMapping.hub_org_id,
//           permissions,
//         },
//         tenantMapping,
//       });
//     } catch {
//       return reply.status(401).send({
//         statusCode: 401,
//         error: 'Unauthorized',
//         message: 'Invalid or expired refresh token',
//       });
//     }
//   });

//   // GET /mobile/v1/auth/me - Profile and Organization Context Validation
//   fastify.get('/me', { preHandler: [authenticateToken] }, async (request, reply) => {
//     const user = request.user as JWTPayload;
//     const profile = await HubAdapter.getUserProfile(user.user_id, user.email);
//     const tenantMapping = await TenantService.resolveTenantMapping(
//       user.user_id,
//       user.organization_id,
//       profile.telegramUserId
//     );

//     return reply.send({
//       id: user.user_id,
//       email: user.email,
//       name: profile.fullName,
//       role: user.role,
//       isAdmin: profile.isAdmin,
//       organizationId: user.organization_id,
//       subscriptionTier: profile.subscriptionTier,
//       permissions: user.permissions,
//       tenantMapping,
//     });
//   });

//   // POST /mobile/v1/auth/sso-url - Generate authentic SSO URL for Web App
//   fastify.post('/sso-url', { preHandler: [authenticateToken] }, async (request, reply) => {
//     const user = request.user as JWTPayload;
//     const body = (request.body || {}) as { redirectPath?: string; webAppUrl?: string };
//     const redirectPath = body.redirectPath && body.redirectPath.startsWith('/') ? body.redirectPath : '/free-tools/dashboard';
//     const rawWebAppUrl = (body.webAppUrl || 'https://getaipilot.in').replace(/\/+$/, '');

//     // 1. Check if we have an active upstream Supabase session
//     const upstreamSession = UpstreamSessionService.getSession(user.session_id, user.user_id);
//     if (upstreamSession?.accessToken && upstreamSession?.refreshToken) {
//       const ssoUrl = `${rawWebAppUrl}/auth/callback?next=${encodeURIComponent(
//         redirectPath
//       )}#access_token=${encodeURIComponent(
//         upstreamSession.accessToken
//       )}&refresh_token=${encodeURIComponent(
//         upstreamSession.refreshToken
//       )}&token_type=bearer`;

//       return reply.send({
//         success: true,
//         ssoUrl,
//       });
//     }

//     // 2. Generate magiclink token_hash via Supabase Admin
//     try {
//       const { data, error } = await HubAdapter.generateMagicLink(user.email);
//       if (data?.properties?.hashed_token) {
//         const ssoUrl = `${rawWebAppUrl}/auth/callback?next=${encodeURIComponent(
//           redirectPath
//         )}&token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=email`;

//         return reply.send({
//           success: true,
//           ssoUrl,
//         });
//       }
//     } catch (e: any) {
//       request.log.warn(e, '[SSO_URL_GENERATE_ERROR]');
//     }

//     // 3. Fallback to direct web URL
//     return reply.send({
//       success: true,
//       ssoUrl: `${rawWebAppUrl}${redirectPath}`,
//     });
//   });

//   // POST /mobile/v1/auth/logout
//   fastify.post('/logout', { preHandler: [authenticateToken] }, async (request, reply) => {
//     const user = request.user as JWTPayload | undefined;
//     if (user) {
//       try {
//         await HubAdapter.signOutDeviceSession(user.user_id, user.session_id);
//       } finally {
//         UpstreamSessionService.clearSession(user.session_id, user.user_id);
//       }
//     }
//     return reply.send({ success: true, message: 'Session terminated successfully' });
//   });
// }



import { randomUUID } from 'crypto';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { DeviceLoginInput, HubAdapter } from '../adapters/hub.adapter.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { PermissionService } from '../services/permission.service.js';
import { TenantService } from '../services/tenant.service.js';
import { UpstreamSessionService } from '../services/upstream-session.service.js';
import { JWTPayload, UserRole } from '../types/index.js';

export async function authRoutes(fastify: FastifyInstance) {
  // POST /mobile/v1/auth/login - Production Hub Identity Authentication
  fastify.post('/login', async (request, reply) => {
    const loginSchema = z.object({
      email: z.string().email(),
      password: z.string().min(1),
      device: z.object({
        installationId: z.string().min(8).max(160),
        platform: z.enum(['ios', 'android', 'web']),
        deviceName: z.string().min(1).max(160),
        deviceType: z.enum(['phone', 'tablet', 'desktop', 'tv', 'unknown']).optional(),
        osVersion: z.string().max(80).optional(),
        appVersion: z.string().max(80).optional(),
      }).optional(),
    });

    const parseResult = loginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'BadRequest',
        message: 'Valid email and password are required',
      });
    }

    const { email, password } = parseResult.data;

    let authUser: any;
    let authSession: any = null;
    try {
      const authResult = await HubAdapter.authenticateUser(email, password);
      authUser = authResult?.user;
      authSession = authResult?.session;
    } catch (e: any) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: e?.message || 'Invalid email or password',
      });
    }

    if (!authUser?.id) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Authentication failed: User identity not found',
      });
    }

    // Generate unique BFF session ID
    const sessionId = `sess_${randomUUID()}`;

    // Securely preserve upstream Supabase session server-side
    if (authSession?.access_token && authSession?.refresh_token) {
      UpstreamSessionService.saveSession(sessionId, authUser.id, authSession);
    }

    // Resolve profile and subscription details from Hub PostgreSQL
    const profile = await HubAdapter.getUserProfile(authUser.id, email);
    const role: UserRole = profile.role;
    const permissions = PermissionService.getPermissionsForRole(role, profile.subscriptionTier);
    const tenantMapping = await TenantService.resolveTenantMapping(
      authUser.id,
      profile.organizationId,
      profile.telegramUserId
    );

    // Sign Mobile JWT with session_id reference
    const tokenPayload: JWTPayload = {
      user_id: authUser.id,
      email: authUser.email || email,
      organization_id: tenantMapping.hub_org_id,
      role,
      permissions,
      subscription_tier: profile.subscriptionTier,
      session_id: sessionId,
      device_session: Boolean(parseResult.data.device),
    };

    const accessToken = fastify.jwt.sign(tokenPayload, { expiresIn: '7d' });
    const refreshToken = fastify.jwt.sign(
      {
        user_id: authUser.id,
        email: authUser.email || email,
        session_id: sessionId,
        device_session: Boolean(parseResult.data.device),
      },
      { expiresIn: '30d' }
    );

    if (parseResult.data.device) {
      try {
        await HubAdapter.registerDeviceSession(
          authUser.id,
          sessionId,
          parseResult.data.device as DeviceLoginInput
        );
      } catch (error: any) {
        request.log.error(error, 'Unable to record device login');
        return reply.status(500).send({
          statusCode: 500,
          error: 'DeviceSessionTrackingFailed',
          message: 'Could not record this device login. Please try again.',
        });
      }
    }

    return reply.send({
      accessToken,
      refreshToken,
      user: {
        id: authUser.id,
        email: authUser.email || email,
        name: profile.fullName,
        role,
        isAdmin: profile.isAdmin,
        organizationId: tenantMapping.hub_org_id,
        subscriptionTier: profile.subscriptionTier,
        permissions,
      },
      tenantMapping,
    });
  });

  // POST /mobile/v1/auth/refresh - Silent Token Refresh Exchange
  fastify.post('/refresh', async (request, reply) => {
    const refreshSchema = z.object({
      refreshToken: z.string().min(1),
    });

    const parseResult = refreshSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'BadRequest',
        message: 'refreshToken is required',
      });
    }

    const { refreshToken } = parseResult.data;

    try {
      const decoded = fastify.jwt.verify<{
        user_id: string;
        email?: string;
        session_id?: string;
        device_session?: boolean;
      }>(refreshToken);
      if (decoded.device_session) {
        const isActive = await HubAdapter.isDeviceSessionActive(decoded.user_id, decoded.session_id);
        if (!isActive) {
          return reply.status(401).send({
            statusCode: 401,
            error: 'SessionRevoked',
            message: 'This device has been signed out. Please sign in again.',
          });
        }
      }
      const profile = await HubAdapter.getUserProfile(decoded.user_id, decoded.email);
      const role: UserRole = profile.role;
      const permissions = PermissionService.getPermissionsForRole(role, profile.subscriptionTier);
      const tenantMapping = await TenantService.resolveTenantMapping(
        decoded.user_id,
        profile.organizationId,
        profile.telegramUserId
      );

      const sessionId = decoded.session_id || `sess_${randomUUID()}`;

      const tokenPayload: JWTPayload = {
        user_id: decoded.user_id,
        email: profile.email,
        organization_id: tenantMapping.hub_org_id,
        role,
        permissions,
        subscription_tier: profile.subscriptionTier,
        session_id: sessionId,
        device_session: Boolean(decoded.device_session),
      };

      const accessToken = fastify.jwt.sign(tokenPayload, { expiresIn: '7d' });
      return reply.send({
        accessToken,
        user: {
          id: decoded.user_id,
          email: profile.email,
          name: profile.fullName,
          role,
          organizationId: tenantMapping.hub_org_id,
          permissions,
        },
        tenantMapping,
      });
    } catch {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token',
      });
    }
  });

  // GET /mobile/v1/auth/me - Profile and Organization Context Validation
  fastify.get('/me', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const profile = await HubAdapter.getUserProfile(user.user_id, user.email);
    const tenantMapping = await TenantService.resolveTenantMapping(
      user.user_id,
      user.organization_id,
      profile.telegramUserId
    );

    return reply.send({
      id: user.user_id,
      email: user.email,
      name: profile.fullName,
      role: user.role,
      isAdmin: profile.isAdmin,
      organizationId: user.organization_id,
      subscriptionTier: profile.subscriptionTier,
      permissions: user.permissions,
      tenantMapping,
    });
  });

  // GET /mobile/v1/auth/device-sessions
  // The BFF owns this endpoint because auth.sessions and service-role access
  // must never be exposed to the Expo client.
  fastify.get('/device-sessions', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const devices = await HubAdapter.getActiveDeviceSessions(user.user_id, user.session_id);
    return reply.send({ activeDeviceCount: devices.length, devices });
  });

  // POST /mobile/v1/auth/device-sessions/heartbeat
  // Records an active app presence heartbeat for the current device session.
  fastify.post('/device-sessions/heartbeat', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const body = (request.body as any) || {};
    const sessionId = body.sessionId || user.session_id;

    if (!sessionId) {
      return reply.send({ success: true, touched: false });
    }

    try {
      const touched = await HubAdapter.touchDeviceSession(user.user_id, sessionId);
      return reply.send({ success: true, touched });
    } catch (err: any) {
      request.log.warn({ err: err.message }, '[HEARTBEAT] Error touching device session');
      return reply.send({ success: true, touched: false, warning: err.message });
    }
  });

  // GET /mobile/v1/auth/device-sessions/heartbeat
  fastify.get('/device-sessions/heartbeat', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    if (!user.session_id) {
      return reply.send({ success: true, touched: false });
    }

    try {
      const touched = await HubAdapter.touchDeviceSession(user.user_id, user.session_id);
      return reply.send({ success: true, touched });
    } catch (err: any) {
      request.log.warn({ err: err.message }, '[HEARTBEAT] Error touching device session');
      return reply.send({ success: true, touched: false, warning: err.message });
    }
  });

  // DELETE /mobile/v1/auth/device-sessions/:sessionId
  // A user can only sign out another session that belongs to their own account.
  fastify.delete('/device-sessions/:sessionId', { preHandler: [authenticateToken] }, async (request, reply) => {
    const params = z.object({ sessionId: z.string().min(1).max(100) }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ statusCode: 400, error: 'BadRequest', message: 'Invalid session ID' });
    }

    const user = request.user as JWTPayload;
    if (params.data.sessionId === user.session_id) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'CurrentDevice',
        message: 'Use the normal sign out action for this device.',
      });
    }

    const signedOut = await HubAdapter.signOutDeviceSession(user.user_id, params.data.sessionId);
    if (!signedOut) {
      return reply.status(404).send({ statusCode: 404, error: 'NotFound', message: 'Active device session not found' });
    }

    UpstreamSessionService.clearSession(params.data.sessionId);
    return reply.send({ success: true });
  });

  // POST /mobile/v1/auth/logout
  fastify.post('/logout', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload | undefined;
    if (user) {
      try {
        await HubAdapter.signOutDeviceSession(user.user_id, user.session_id);
      } finally {
        UpstreamSessionService.clearSession(user.session_id, user.user_id);
      }
    }
    return reply.send({ success: true, message: 'Session terminated successfully' });
  });
}
