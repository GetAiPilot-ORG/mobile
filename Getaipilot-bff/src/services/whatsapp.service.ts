import { UserSessionContext, WhatsAppAdapter } from '../adapters/whatsapp.adapter.js';
import { PermissionService } from './permission.service.js';
import {
  CreateBroadcastPayload,
  JWTPayload,
  PaginatedBroadcastsResponse,
  PaginatedContactsResponse,
  WhatsAppAccount,
  WhatsAppBroadcast,
  WhatsAppConnection,
  WhatsAppContact,
  WhatsAppTemplate,
  WhatsAppUsage,
} from '../types/index.js';
import { WebSocketService } from './websocket.service.js';

export class WhatsAppService {
  /**
   * Helper to build UserSessionContext from JWTPayload
   */
  private static getContext(user: JWTPayload): UserSessionContext {
    return {
      sessionId: user.session_id,
      userId: user.user_id,
      role: user.role,
      organizationId: user.organization_id,
    };
  }

  /**
   * Helper to verify product entitlement and RBAC permissions separately
   */
  private static checkAccess(user: JWTPayload, requiredPerm: string): void {
    // 1. Product Entitlement Check
    const isEntitled = PermissionService.isProductEntitled(user.subscription_tier, 'whatsapp');
    if (!isEntitled) {
      console.warn('[WA TRACE]', {
        bffAuth: 'PASS',
        tenantResolved: Boolean(user.organization_id),
        permissionPassed: false,
        reason: 'PRODUCT_NOT_ENTITLED',
        upstreamCalled: false,
      });
      throw {
        statusCode: 403,
        code: 'PRODUCT_NOT_ENTITLED',
        message: 'Forbidden: WhatsApp product is not enabled or entitled for this workspace subscription.',
      };
    }

    // 2. Role-Based Access Control (RBAC) Check
    if (user.role === 'Owner' || user.role === 'Admin') {
      return;
    }
    if (user.permissions?.includes('*') || user.permissions?.includes(requiredPerm)) {
      return;
    }

    console.warn('[WA TRACE]', {
      bffAuth: 'PASS',
      tenantResolved: Boolean(user.organization_id),
      permissionPassed: false,
      reason: 'PERMISSION_DENIED',
      upstreamCalled: false,
    });

    throw {
      statusCode: 403,
      code: 'PERMISSION_DENIED',
      message: `Forbidden: Missing required permission '${requiredPerm}' for role '${user.role}'`,
    };
  }

  /**
   * 1. Get WhatsApp Connection Status
   */
  public static async getConnectionStatus(user: JWTPayload): Promise<WhatsAppConnection> {
    this.checkAccess(user, 'whatsapp.inbox');
    const orgId = user.organization_id;
    const context = this.getContext(user);
    console.log('[WA TRACE]', {
      bffAuth: 'PASS',
      tenantResolved: Boolean(orgId),
      permissionPassed: true,
      upstreamCalled: true,
    });
    return await WhatsAppAdapter.getConnectionStatus(orgId, context);
  }

  /**
   * 2. Get All WhatsApp Business Accounts (WABAs)
   */
  public static async getAccounts(user: JWTPayload): Promise<WhatsAppAccount[]> {
    this.checkAccess(user, 'whatsapp.inbox');
    const orgId = user.organization_id;
    const context = this.getContext(user);
    console.log('[WA TRACE]', {
      bffAuth: 'PASS',
      tenantResolved: Boolean(orgId),
      permissionPassed: true,
      upstreamCalled: true,
    });
    return await WhatsAppAdapter.getBusinessAccounts(orgId, context);
  }

  /**
   * 3. Get Paginated WhatsApp Contacts
   */
  public static async getContacts(
    user: JWTPayload,
    params?: { search?: string; tag?: string; page?: number; limit?: number }
  ): Promise<PaginatedContactsResponse> {
    this.checkAccess(user, 'whatsapp.contacts');
    const orgId = user.organization_id;
    const context = this.getContext(user);
    console.log('[WA TRACE]', {
      bffAuth: 'PASS',
      tenantResolved: Boolean(orgId),
      permissionPassed: true,
      upstreamCalled: true,
    });
    return await WhatsAppAdapter.getContacts(orgId, params, context);
  }

  /**
   * 4. Get Single WhatsApp Contact with CRM Association
   */
  public static async getContact(
    user: JWTPayload,
    contactId: string
  ): Promise<WhatsAppContact> {
    this.checkAccess(user, 'whatsapp.contacts');
    const orgId = user.organization_id;
    const context = this.getContext(user);
    console.log('[WA TRACE]', {
      bffAuth: 'PASS',
      tenantResolved: Boolean(orgId),
      permissionPassed: true,
      upstreamCalled: true,
    });
    const contact = await WhatsAppAdapter.getContact(orgId, contactId, context);

    if (!contact) {
      throw { statusCode: 404, message: 'WhatsApp contact not found' };
    }

    return contact;
  }

  /**
   * 5. Get WhatsApp Templates (Approved, Pending, etc.)
   */
  public static async getTemplates(
    user: JWTPayload,
    statusFilter?: string
  ): Promise<WhatsAppTemplate[]> {
    this.checkAccess(user, 'whatsapp.templates');
    const orgId = user.organization_id;
    const context = this.getContext(user);
    console.log('[WA TRACE]', {
      bffAuth: 'PASS',
      tenantResolved: Boolean(orgId),
      permissionPassed: true,
      upstreamCalled: true,
    });
    return await WhatsAppAdapter.getTemplates(orgId, statusFilter, context);
  }

  /**
   * 6. Get Broadcast Campaigns History & Stats
   */
  public static async getBroadcasts(
    user: JWTPayload,
    params?: { page?: number; limit?: number; status?: string }
  ): Promise<PaginatedBroadcastsResponse> {
    this.checkAccess(user, 'whatsapp.broadcast');
    const orgId = user.organization_id;
    const context = this.getContext(user);
    console.log('[WA TRACE]', {
      bffAuth: 'PASS',
      tenantResolved: Boolean(orgId),
      permissionPassed: true,
      upstreamCalled: true,
    });
    return await WhatsAppAdapter.getBroadcasts(orgId, params, context);
  }

  /**
   * 7. Get Single Broadcast Campaign Detail
   */
  public static async getBroadcast(
    user: JWTPayload,
    broadcastId: string
  ): Promise<WhatsAppBroadcast> {
    this.checkAccess(user, 'whatsapp.broadcast');
    const orgId = user.organization_id;
    const context = this.getContext(user);
    console.log('[WA TRACE]', {
      bffAuth: 'PASS',
      tenantResolved: Boolean(orgId),
      permissionPassed: true,
      upstreamCalled: true,
    });
    const broadcast = await WhatsAppAdapter.getBroadcast(orgId, broadcastId, context);

    if (!broadcast) {
      throw { statusCode: 404, message: 'Broadcast campaign not found' };
    }

    return broadcast;
  }

  /**
   * 8. Create a New Broadcast Campaign
   * Enforces:
   * - Template approval verification
   * - Authoritative wallet credit balance validation
   * - Idempotency replay check
   * - Realtime WebSocket notification
   */
  public static async createBroadcast(
    user: JWTPayload,
    payload: CreateBroadcastPayload,
    idempotencyKey?: string
  ): Promise<{ broadcast: WhatsAppBroadcast; is_replay?: boolean }> {
    this.checkAccess(user, 'whatsapp.broadcast.create');
    const orgId = user.organization_id;
    const context = this.getContext(user);

    if (!payload.name?.trim()) {
      throw { statusCode: 400, message: 'Broadcast campaign name is required' };
    }

    if (!payload.template_name?.trim()) {
      throw { statusCode: 400, message: 'Template name is required' };
    }

    // 1. Verify template is approved
    const templates = await WhatsAppAdapter.getTemplates(orgId, undefined, context);
    const selectedTemplate = templates.find(
      (t) => t.name.toLowerCase() === payload.template_name.toLowerCase()
    );

    if (selectedTemplate && selectedTemplate.status !== 'APPROVED') {
      throw {
        statusCode: 400,
        message: `Template '${payload.template_name}' cannot be broadcasted because its status is '${selectedTemplate.status}' (Must be APPROVED by Meta)`,
      };
    }

    // 2. Authoritative Credit Balance Check
    const credits = await WhatsAppAdapter.getCredits(orgId, context);
    const estimatedRecipients = 150; // default estimated batch size
    const estimatedCostPaise = estimatedRecipients * 80; // 80 paise / msg

    if (credits.balance_paise < estimatedCostPaise) {
      throw {
        statusCode: 402,
        message: `Insufficient wallet credits. Required: ₹${(estimatedCostPaise / 100).toFixed(2)}, Available: ₹${(credits.balance_paise / 100).toFixed(2)}. Please recharge your wallet.`,
      };
    }

    // 3. Dispatch to adapter with idempotency and session context
    const result = await WhatsAppAdapter.createBroadcast(orgId, payload, context, idempotencyKey);

    // 4. Emit Realtime WebSocket Event
    if (!result.is_replay) {
      WebSocketService.broadcastToOrg(orgId, 'whatsapp.broadcast.created', result.broadcast);
    }

    return result;
  }

  /**
   * 9. Get Authoritative Wallet Usage & Delivery Metrics
   */
  public static async getUsage(user: JWTPayload): Promise<WhatsAppUsage> {
    this.checkAccess(user, 'whatsapp.credits');
    const orgId = user.organization_id;
    const context = this.getContext(user);
    console.log('[WA TRACE]', {
      bffAuth: 'PASS',
      tenantResolved: Boolean(orgId),
      permissionPassed: true,
      upstreamCalled: true,
    });
    return await WhatsAppAdapter.getUsage(orgId, context);
  }
}
