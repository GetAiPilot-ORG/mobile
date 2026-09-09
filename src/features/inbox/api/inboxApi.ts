import { apiClient } from '../../../core/api/client';
import { supabase } from '../../../lib/supabase';
import { ContactItem, MetaTemplate, NormalizedConversation, NormalizedMessage, SendMessagePayload, TeamMember } from '../types';

function normalizeMetaTemplate(t: any): MetaTemplate {
  const comps = Array.isArray(t.components) ? t.components : [];
  const headerComp = comps.find((c: any) => c.type === 'HEADER');
  const bodyComp = comps.find((c: any) => c.type === 'BODY');
  const footerComp = comps.find((c: any) => c.type === 'FOOTER');
  const buttonsComp = comps.find((c: any) => c.type === 'BUTTONS');

  const label = t.name
    ? t.name
        .split('_')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : 'WhatsApp Template';

  return {
    name: t.name || 'template',
    label: t.label || label,
    category: (t.category?.toUpperCase() as any) || 'UTILITY',
    header: headerComp?.text || t.header?.text || (typeof t.header === 'string' ? t.header : undefined),
    body: bodyComp?.text || t.body?.text || (typeof t.body === 'string' ? t.body : ''),
    footer: footerComp?.text || t.footer?.text || (typeof t.footer === 'string' ? t.footer : undefined),
    buttons: Array.isArray(buttonsComp?.buttons)
      ? buttonsComp.buttons.map((b: any) => ({
          type: b.type === 'URL' ? 'URL' : b.type === 'PHONE_NUMBER' ? 'PHONE_NUMBER' : 'QUICK_REPLY',
          text: b.text || 'Action',
          url: b.url,
          phone_number: b.phone_number,
        }))
      : Array.isArray(t.buttons)
      ? t.buttons
      : undefined,
  };
}

export const inboxApi = {
  getConversations: async (
    channel?: string,
    status?: string,
    search?: string
  ): Promise<NormalizedConversation[]> => {
    try {
      const data = await apiClient.get<NormalizedConversation[]>('/mobile/v1/conversations', {
        params: {
          channel: channel || 'all',
          status: status || 'all',
          search: search || undefined,
        },
      });
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (_) {}

    // Fallback directly to Supabase live data strictly for user's organization
    try {
      let orgId = (await import('../../../core/store/authStore')).useAuthStore.getState().user?.organizationId;
      if (!orgId) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id) {
          const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', authData.user.id)
            .maybeSingle();
          orgId = member?.organization_id;
        }
      }

      if (!orgId) {
        return [];
      }

      const { data: convs } = await supabase
        .from('w_conversations')
        .select(`
          id,
          organization_id,
          contact_id,
          last_message_preview,
          last_message_at,
          unread_count,
          assigned_agent_name,
          assigned_agent_id,
          assigned_to,
          bot_enabled,
          status,
          created_at
        `)
        .eq('organization_id', orgId)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .limit(50);

      if (!convs || convs.length === 0) return [];

      const contactIds = convs.map((c) => c.contact_id).filter(Boolean);
      let contactsMap = new Map<string, any>();
      if (contactIds.length > 0) {
        const { data: contacts } = await supabase
          .from('w_contacts')
          .select('id, name, phone, wa_id, custom_name')
          .in('id', contactIds);
        (contacts || []).forEach((cnt) => contactsMap.set(cnt.id, cnt));
      }

      let result: NormalizedConversation[] = convs.map((c) => {
        const contact = contactsMap.get(c.contact_id);
        const contactName = contact?.name || contact?.custom_name || contact?.phone || 'WhatsApp Contact';
        const handle = contact?.phone || contact?.wa_id || '';
        return {
          id: c.id,
          organization_id: c.organization_id,
          contact: {
            name: contactName,
            handle_or_phone: handle,
          },
          channel: 'whatsapp' as const,
          last_message: {
            content: c.last_message_preview || 'Media Message',
            created_at: c.last_message_at || c.created_at || new Date().toISOString(),
            direction: 'inbound' as const,
          },
          unread_count: c.unread_count || 0,
          assigned_to: c.assigned_agent_name || c.assigned_to || undefined,
          assigned_agent_name: c.assigned_agent_name || undefined,
          assigned_agent_id: c.assigned_agent_id || undefined,
          bot_enabled: c.bot_enabled !== false,
          bot_paused: c.bot_enabled === false,
          latest_customer_message_at: c.last_message_at || undefined,
          status: c.status === 'resolved' ? ('resolved' as const) : ('active' as const),
        };
      });

      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        result = result.filter(
          (c) =>
            c.contact.name.toLowerCase().includes(q) ||
            c.contact.handle_or_phone.toLowerCase().includes(q) ||
            c.last_message.content.toLowerCase().includes(q)
        );
      }

      return result;
    } catch {
      return [];
    }
  },

  getConversationDetails: async (
    id: string
  ): Promise<{ conversation: NormalizedConversation | null; messages: NormalizedMessage[] }> => {
    try {
      const res = await apiClient.get<{
        conversation: NormalizedConversation | null;
        messages: NormalizedMessage[];
      }>(`/mobile/v1/conversations/${id}`);
      if (res && res.messages) {
        return res;
      }
    } catch (_) {}

    try {
      const { data: convData } = await supabase
        .from('w_conversations')
        .select(`
          id,
          organization_id,
          contact_id,
          last_message_preview,
          last_message_at,
          unread_count,
          assigned_agent_name,
          assigned_agent_id,
          assigned_to,
          bot_enabled,
          status,
          created_at
        `)
        .eq('id', id)
        .maybeSingle();

      let convNormalized: NormalizedConversation | null = null;
      if (convData) {
        let contactName = 'WhatsApp Contact';
        let handle = '';
        if (convData.contact_id) {
          const { data: cnt } = await supabase
            .from('w_contacts')
            .select('name, custom_name, phone, wa_id')
            .eq('id', convData.contact_id)
            .maybeSingle();
          if (cnt) {
            contactName = cnt.name || cnt.custom_name || cnt.phone || 'WhatsApp Contact';
            handle = cnt.phone || cnt.wa_id || '';
          }
        }

        convNormalized = {
          id: convData.id,
          organization_id: convData.organization_id,
          contact: { name: contactName, handle_or_phone: handle },
          channel: 'whatsapp',
          last_message: {
            content: convData.last_message_preview || '',
            created_at: convData.last_message_at || convData.created_at || new Date().toISOString(),
            direction: 'inbound',
          },
          unread_count: convData.unread_count || 0,
          assigned_to: convData.assigned_agent_name || convData.assigned_to || undefined,
          assigned_agent_name: convData.assigned_agent_name || undefined,
          assigned_agent_id: convData.assigned_agent_id || undefined,
          bot_enabled: convData.bot_enabled !== false,
          bot_paused: convData.bot_enabled === false,
          latest_customer_message_at: convData.last_message_at || undefined,
          status: convData.status === 'resolved' ? 'resolved' : 'active',
        };
      }

      const { data: msgs } = await supabase
        .from('w_messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true })
        .limit(100);

      const currentUserId = (await import('../../../core/store/authStore')).useAuthStore.getState().user?.id;

      const normalizedMsgs: NormalizedMessage[] = (msgs || []).map((m) => {
        const textContent = m.text_body || (typeof m.content === 'object' ? m.content?.text || m.content?.body : m.content) || '';
        const isNote = m.is_internal_note || m.type === 'note';
        const isBot = m.is_bot_reply || m.sender_type === 'bot' || m.sender_type === 'ai_agent';
        const isMe = currentUserId && m.sender_user_id === currentUserId;

        let templateData: any = undefined;
        if (m.type === 'template' || (typeof m.content === 'object' && m.content?.template)) {
          templateData = typeof m.content === 'object' && m.content?.template ? m.content.template : m.content;
        }

        const senderType: 'contact' | 'agent' | 'bot' | 'system' = isNote
          ? 'agent'
          : m.direction === 'inbound'
          ? 'contact'
          : isBot
          ? 'bot'
          : 'agent';

        return {
          id: m.id,
          conversation_id: id,
          channel: 'whatsapp' as const,
          direction: m.direction === 'inbound' ? ('inbound' as const) : ('outbound' as const),
          content: textContent || (isNote ? 'Internal Note' : 'Message'),
          media: m.media_url ? [{ url: m.media_url, type: 'image' as const }] : [],
          sender: {
            name: isNote
              ? (isMe ? 'You' : 'Agent Note')
              : m.direction === 'inbound'
              ? 'Contact'
              : isBot
              ? 'AI Bot'
              : (isMe ? 'You' : 'Agent'),
            type: senderType,
          },
          sender_user_id: m.sender_user_id || undefined,
          sender_type: m.sender_type || undefined,
          is_internal_note: isNote,
          is_bot_reply: isBot,
          status: m.status || 'delivered',
          template: templateData,
          created_at: m.created_at || new Date().toISOString(),
        };
      });

      return { conversation: convNormalized, messages: normalizedMsgs };
    } catch {
      return { conversation: null, messages: [] };
    }
  },

  sendMessage: async (payload: SendMessagePayload): Promise<NormalizedMessage> => {
    return await apiClient.post<NormalizedMessage>('/mobile/v1/messages', payload);
  },

  assignAgent: async (conversationId: string, agentId: string | null, agentName?: string | null) => {
    try {
      await apiClient.patch(`/mobile/v1/conversations/${conversationId}/assign`, {
        agent_id: agentId,
        agent_name: agentName,
      });
    } catch {
      await supabase
        .from('w_conversations')
        .update({
          assigned_agent_id: agentId,
          assigned_to: agentId,
          assigned_agent_name: agentName || null,
        })
        .eq('id', conversationId);
    }
  },

  toggleBot: async (conversationId: string, enabled: boolean, botId?: string | null) => {
    try {
      await apiClient.patch(`/mobile/v1/conversations/${conversationId}/bot`, {
        bot_enabled: enabled,
        assigned_bot_id: botId || null,
      });
    } catch {
      await supabase
        .from('w_conversations')
        .update({
          bot_enabled: enabled,
          assigned_bot_id: botId || null,
          handoff_status: enabled ? 'bot_active' : 'human_takeover',
        })
        .eq('id', conversationId);
    }
  },

  getTeamMembers: async (): Promise<TeamMember[]> => {
    try {
      const data = await apiClient.get<TeamMember[]>('/mobile/v1/team/members');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (_) {}

    try {
      let orgId = (await import('../../../core/store/authStore')).useAuthStore.getState().user?.organizationId;
      if (!orgId) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id) {
          const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', authData.user.id)
            .maybeSingle();
          orgId = member?.organization_id;
        }
      }

      if (!orgId) return [];

      const { data } = await supabase
        .from('organization_members')
        .select('id, organization_id, user_id, role, name, email, is_active, is_online, avatar_color')
        .eq('organization_id', orgId)
        .eq('is_active', true);

      return data || [];
    } catch {
      return [];
    }
  },

  getContacts: async (): Promise<ContactItem[]> => {
    try {
      let orgId = (await import('../../../core/store/authStore')).useAuthStore.getState().user?.organizationId;
      if (!orgId) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id) {
          const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', authData.user.id)
            .maybeSingle();
          orgId = member?.organization_id;
        }
      }

      if (!orgId) return [];

      const { data } = await supabase
        .from('w_contacts')
        .select('id, name, custom_name, phone, wa_id, tags, custom_fields')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      return data || [];
    } catch {
      return [];
    }
  },

  startConversation: async (contactId: string): Promise<{ id: string }> => {
    try {
      return await apiClient.post<{ id: string }>('/mobile/v1/conversations', { contact_id: contactId });
    } catch {
      let orgId = (await import('../../../core/store/authStore')).useAuthStore.getState().user?.organizationId;
      if (!orgId) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id) {
          const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', authData.user.id)
            .maybeSingle();
          orgId = member?.organization_id;
        }
      }

      const { data: existing } = await supabase
        .from('w_conversations')
        .select('id')
        .eq('organization_id', orgId)
        .eq('contact_id', contactId)
        .maybeSingle();

      if (existing) return existing;

      const { data: created, error } = await supabase
        .from('w_conversations')
        .insert({
          organization_id: orgId,
          contact_id: contactId,
          last_message_at: new Date().toISOString(),
          last_message_preview: 'Conversation started',
          unread_count: 0,
          status: 'open',
          bot_enabled: true,
        })
        .select('id')
        .single();

      if (error) throw error;
      return created;
    }
  },

  getTemplates: async (status?: string): Promise<MetaTemplate[]> => {
    try {
      const data = await apiClient.get<any[]>('/mobile/v1/whatsapp/templates', {
        params: { status: status || 'APPROVED' },
      });
      if (Array.isArray(data) && data.length > 0) {
        return data.map(normalizeMetaTemplate);
      }
    } catch (_) {}

    try {
      let orgId = (await import('../../../core/store/authStore')).useAuthStore.getState().user?.organizationId;
      if (!orgId) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id) {
          const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', authData.user.id)
            .maybeSingle();
          orgId = member?.organization_id;
        }
      }

      if (!orgId) return [];

      let query = supabase
        .from('w_template_submissions')
        .select('*')
        .eq('organization_id', orgId);

      if (status && status !== 'ALL') {
        query = query.eq('status', status.toUpperCase());
      } else if (!status) {
        query = query.eq('status', 'APPROVED');
      }

      const { data: subData } = await query.order('name', { ascending: true });
      if (subData && subData.length > 0) {
        return subData.map(normalizeMetaTemplate);
      }

      let fallbackQuery = supabase
        .from('w_templates')
        .select('*')
        .eq('organization_id', orgId);

      if (status && status !== 'ALL') {
        fallbackQuery = fallbackQuery.eq('status', status.toUpperCase());
      }

      const { data: tplData } = await fallbackQuery.order('name', { ascending: true });
      if (tplData && tplData.length > 0) {
        return tplData.map(normalizeMetaTemplate);
      }

      return [];
    } catch {
      return [];
    }
  },
};


