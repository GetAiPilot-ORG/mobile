import { randomUUID } from 'crypto';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { HubAdapter } from '../adapters/hub.adapter.js';
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
    };

    const accessToken = fastify.jwt.sign(tokenPayload, { expiresIn: '7d' });
    const refreshToken = fastify.jwt.sign(
      { user_id: authUser.id, email: authUser.email || email, session_id: sessionId },
      { expiresIn: '30d' }
    );

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
      const decoded = fastify.jwt.verify<{ user_id: string; email?: string; session_id?: string }>(refreshToken);
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

  // POST /mobile/v1/auth/logout
  fastify.post('/logout', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload | undefined;
    if (user) {
      UpstreamSessionService.clearSession(user.session_id, user.user_id);
    }
    return reply.send({ success: true, message: 'Session terminated successfully' });
  });
}
