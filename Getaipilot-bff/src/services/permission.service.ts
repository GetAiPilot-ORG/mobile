import { UserRole } from '../types/index.js';

export class PermissionService {
  private static readonly ROLE_PERMISSIONS: Record<UserRole, string[]> = {
    Owner: ['*'],
    Admin: [
      'crm.read',
      'crm.write',
      'crm.delete',
      'whatsapp.inbox',
      'whatsapp.contacts',
      'whatsapp.templates',
      'whatsapp.broadcast',
      'whatsapp.broadcast.create',
      'whatsapp.credits',
      'whatsapp.settings',
      'voice.read',
      'voice.manage',
      'voice.outbound',
      'social.read',
      'social.post',
      'social.inbox',
      'telegram.read',
      'telegram.manage',
      'billing.view',
      'billing.manage',
      'tools.use',
      'tools.manage',
    ],
    Manager: [
      'crm.read',
      'crm.write',
      'whatsapp.inbox',
      'whatsapp.contacts',
      'whatsapp.templates',
      'whatsapp.broadcast',
      'whatsapp.broadcast.create',
      'whatsapp.credits',
      'voice.read',
      'voice.outbound',
      'social.read',
      'social.post',
      'social.inbox',
      'telegram.read',
      'tools.use',
    ],
    Agent: [
      'crm.read',
      'crm.write_assigned',
      'whatsapp.inbox',
      'whatsapp.contacts',
      'whatsapp.templates',
      'whatsapp.broadcast',
      'whatsapp.credits',
      'voice.read',
      'social.inbox',
      'tools.use',
    ],
  };

  /**
   * Computes granular permissions for a given role and optional plan tier
   */
  public static getPermissionsForRole(role: UserRole, subscriptionTier?: string): string[] {
    const basePermissions = this.ROLE_PERMISSIONS[role] || this.ROLE_PERMISSIONS.Agent;
    
    // If Owner or Admin, they retain full elevated privileges
    if (role === 'Owner' || role === 'Admin') {
      return basePermissions;
    }

    // Dynamic entitlement additions based on active plan
    const perms = new Set(basePermissions);
    if (subscriptionTier && subscriptionTier.toLowerCase().includes('enterprise')) {
      perms.add('whatsapp.broadcast.create');
      perms.add('voice.outbound');
      perms.add('social.post');
    }

    return Array.from(perms);
  }

  /**
   * Verifies if a user has a specific permission
   */
  public static hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    if (!userPermissions || !Array.isArray(userPermissions)) {
      return false;
    }
    if (userPermissions.includes('*')) {
      return true;
    }
    return userPermissions.includes(requiredPermission);
  }

  /**
   * Checks if an organization is entitled to a specific product based on subscription tier
   */
  public static isProductEntitled(subscriptionTier?: string, product: 'whatsapp' | 'crm' | 'voice' | 'social' | 'telegram' = 'whatsapp'): boolean {
    if (!subscriptionTier) {
      return true; // Default workspace product availability
    }

    const tier = subscriptionTier.toLowerCase();

    // Universal / Bundle subscriptions grant access to all products
    if (
      tier.includes('all_in_one') ||
      tier.includes('all-in-one') ||
      tier.includes('bundle') ||
      tier.includes('gap') ||
      tier.includes('max') ||
      tier.includes('pro') ||
      tier.includes('growth') ||
      tier.includes('enterprise') ||
      tier.includes('core') ||
      tier.includes('starter') ||
      tier.includes('free_trial') ||
      tier.includes('free tier') ||
      tier === 'active'
    ) {
      return true;
    }

    // Product-specific plan matching
    if (product === 'whatsapp') {
      return tier.includes('whatsapp') || tier.startsWith('wa_');
    }
    if (product === 'crm') {
      return tier.includes('crm');
    }
    if (product === 'voice') {
      return tier.includes('voice') || tier.includes('calling');
    }
    if (product === 'social') {
      return tier.includes('social');
    }
    if (product === 'telegram') {
      return tier.includes('telegram') || tier.startsWith('tg_');
    }

    return true;
  }
}

