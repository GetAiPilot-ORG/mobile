import { TenantMapping } from '../types/index.js';

export class TenantService {
  /**
   * Resolves unified tenant mapping across all ecosystem products
   */
  public static async resolveTenantMapping(
    userId: string,
    orgId?: string,
    telegramUserId?: string
  ): Promise<TenantMapping> {
    const hubOrgId = orgId || `org_${userId.slice(0, 8)}`;
    const cleanId = userId.replace(/-/g, '').slice(0, 12);

    const validTgId =
      telegramUserId && /^\d{5,16}$/.test(String(telegramUserId).trim())
        ? String(telegramUserId).trim()
        : '';

    return {
      id: `map_${cleanId}`,
      hub_org_id: hubOrgId,
      whatsapp_org_id: hubOrgId,
      voice_workspace_id: `v_ws_${cleanId}`,
      social_workspace_id: `soc_ws_${cleanId}`,
      telegram_user_id: validTgId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}
