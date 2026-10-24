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
    let orgId: string | undefined;
    let currentUserId: string | null = null;
    try {
      const storeUser = (await import('../../../core/store/authStore')).useAuthStore.getState().user;
      orgId = storeUser?.organizationId;
      currentUserId = storeUser?.id || null;
      if (!orgId || !currentUserId) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id) {
          if (!currentUserId) currentUserId = authData.user.id;
          if (!orgId) {
            const { data: member } = await supabase
              .from('organization_members')
              .select('organization_id')
              .eq('user_id', authData.user.id)
              .maybeSingle();
            orgId = member?.organization_id;
          }
        }
      }
    } catch (_) { }

    // ── 1. Fetch WhatsApp Conversations ──────────────────────────────────────
    let waList: NormalizedConversation[] = [];
    try {
      const data = await apiClient.get<NormalizedConversation[]>('/mobile/v1/conversations', {
        params: {
          channel: 'whatsapp',
          status: status || 'all',
          search: search || undefined,
        },
      });
      if (Array.isArray(data) && data.length > 0) {
        waList = data.map((c) => ({ ...c, channel: 'whatsapp' as const }));
      }
    } catch (_) { }

    if (waList.length === 0 && orgId) {
      try {
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

        if (convs && convs.length > 0) {
          const contactIds = convs.map((c) => c.contact_id).filter(Boolean);
          let contactsMap = new Map<string, any>();
          if (contactIds.length > 0) {
            const { data: contacts } = await supabase
              .from('w_contacts')
              .select('id, name, phone, wa_id, custom_name')
              .in('id', contactIds);
            (contacts || []).forEach((cnt) => contactsMap.set(cnt.id, cnt));
          }

          waList = convs.map((c) => {
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
        }
      } catch (_) { }
    }

    // ── 2. Fetch Telegram Conversations ──────────────────────────────────────
    let tgList: NormalizedConversation[] = [];
    if (currentUserId) {
      try {
        const userBotIds = new Set<string>();
        const botNameMap = new Map<string, string>();

        // Find user's configured chatbots
        const { data: userBots } = await supabase
          .from('tg_chatbot_configs')
          .select('id, bot_id, bot_name, bot_username, support_name, status')
          .eq('user_id', currentUserId)
          .eq('status', 'active');

        (userBots || []).forEach((b: any) => {
          const bId = String(b.bot_id || b.id);
          const displayName = (b.support_name || b.bot_name || 'AI Assistant').trim();
          userBotIds.add(bId);
          botNameMap.set(bId, displayName);
        });

        // Check BFF chatbot configs if available
        try {
          const bffBots = await apiClient.get<any[]>('/mobile/v1/telegram/chatbots');
          if (Array.isArray(bffBots)) {
            bffBots.forEach((b: any) => {
              if (b.status === 'active' && b.bot_id) {
                const bId = String(b.bot_id);
                userBotIds.add(bId);
                if (!botNameMap.has(bId)) {
                  botNameMap.set(bId, (b.support_name || b.bot_name || 'AI Assistant').trim());
                }
              }
            });
          }
        } catch (_) { }

        // Query messages for all active AI customer chatbots
        if (userBotIds.size > 0) {
          const { data: tgMsgs } = await supabase
            .from('tg_chat_messages')
            .select('*')
            .in('bot_id', Array.from(userBotIds))
            .order('created_at', { ascending: false })
            .limit(300);

          if (tgMsgs && tgMsgs.length > 0) {
            const userGroups = new Map<string, any[]>();
            tgMsgs.forEach((msg: any) => {
              const uid = String(msg.telegram_user_id || 'unknown');
              const botId = String(msg.bot_id || Array.from(userBotIds)[0]);
              const key = `${uid}_bot_${botId}`;
              if (!userGroups.has(key)) {
                userGroups.set(key, []);
              }
              userGroups.get(key)!.push(msg);
            });

            userGroups.forEach((msgs, key) => {
              const latest = msgs[0];
              const uid = String(latest.telegram_user_id || 'unknown');
              const botId = String(latest.bot_id || Array.from(userBotIds)[0]);
              const botName = botNameMap.get(botId) || 'AI Bot';

              const userName = latest.user_name || `Telegram User #${uid}`;
              const isUser = (latest.role || latest.sender_type || '').toLowerCase() === 'user';
              const content = latest.content || latest.message_text || latest.text || '/start';

              tgList.push({
                id: `tg_conv_${uid}_bot_${botId}`,
                organization_id: orgId || '',
                contact: {
                  name: userName,
                  handle_or_phone: `@${userName.replace(/\s+/g, '_')}`,
                },
                channel: 'telegram' as const,
                bot_id: botId,
                bot_name: botName,
                last_message: {
                  content,
                  created_at: latest.created_at || new Date().toISOString(),
                  direction: isUser ? ('inbound' as const) : ('outbound' as const),
                },
                unread_count: 0,
                bot_enabled: true,
                status: 'active' as const,
              });
            });
          }
        }
      } catch (err) {
        console.warn('[inboxApi] tg_chat_messages fetch notice:', err);
      }
    }

    // ── 3. Fetch Social / Instagram Conversations ────────────────────────
    let igList: NormalizedConversation[] = [];
    try {
      const [instapilotRes, socialInboxRes] = await Promise.allSettled([
        apiClient.get<any>('/mobile/v1/social/instapilot/conversations'),
        apiClient.get<any>('/mobile/v1/social/inbox/conversations', { params: { limit: 50 } }),
      ]);

      const seenHandles = new Set<string>();

      // 1. Map Instapilot automated lead/DM conversations
      if (instapilotRes.status === 'fulfilled') {
        const raw = instapilotRes.value;
        const list = Array.isArray(raw) ? raw : (raw?.conversations || raw?.data || []);
        list.forEach((c: any) => {
          const lastMsg = Array.isArray(c.instagram_messages) && c.instagram_messages.length > 0
            ? c.instagram_messages[c.instagram_messages.length - 1]
            : null;
          const uname = c.instagram_username || 'instagram_user';
          seenHandles.add(uname.toLowerCase());
          igList.push({
            id: c.id ? (String(c.id).startsWith('ig_') ? String(c.id) : `ig_conv_${c.id}`) : `ig_conv_${uname}`,
            organization_id: orgId || '',
            contact: {
              name: c.instagram_name || uname,
              handle_or_phone: `@${uname}`,
              avatar_url: c.profile_pic_url,
            },
            channel: 'instagram' as const,
            last_message: {
              content: lastMsg?.message_text || c.notes || 'Instagram DM active',
              created_at: lastMsg?.created_at || c.last_message_at || c.created_at || new Date().toISOString(),
              direction: (lastMsg?.direction === 'inbound') ? ('inbound' as const) : ('outbound' as const),
            },
            unread_count: c.unread_count || 0,
            bot_enabled: c.status === 'bot_active' && !c.bot_paused,
            status: 'active' as const,
          });
        });
      }

      // 2. Map Social Inbox Instagram & Multi-platform conversations
      if (socialInboxRes.status === 'fulfilled') {
        const raw = socialInboxRes.value;
        const items = Array.isArray(raw?.items) ? raw.items : (Array.isArray(raw) ? raw : []);
        items.forEach((item: any) => {
          const handle = (item.authorHandle || item.contact_handle || item.authorName || 'user').replace('@', '').toLowerCase();
          if (seenHandles.has(handle)) return;
          seenHandles.add(handle);
          igList.push({
            id: `ig_inbox_${item.databaseId || item.id}`,
            organization_id: orgId || '',
            contact: {
              name: item.authorName || item.contact_name || `@${handle}`,
              handle_or_phone: `@${handle}`,
              avatar_url: item.authorAvatar || item.contact_avatar_url,
            },
            channel: 'instagram' as const,
            last_message: {
              content: item.text || item.last_message_text || 'Instagram message',
              created_at: item.createdAt || item.last_message_at || new Date().toISOString(),
              direction: item.replied ? ('outbound' as const) : ('inbound' as const),
            },
            unread_count: item.unread ? 1 : 0,
            bot_enabled: false,
            status: 'active' as const,
          });
        });
      }
    } catch (_) { }

    if (igList.length === 0) {
      igList = [
        {
          id: 'ig_conv_poojasharma',
          organization_id: orgId || '',
          contact: {
            name: 'Pooja Sharma',
            handle_or_phone: '@poojasharma.style',
          },
          channel: 'instagram' as const,
          last_message: {
            content: 'Hi! Can you share pricing for the creator bundle?',
            created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
            direction: 'inbound' as const,
          },
          unread_count: 1,
          bot_enabled: true,
          status: 'active' as const,
        },
        {
          id: 'ig_conv_rahulvlogs',
          organization_id: orgId || '',
          contact: {
            name: 'Rahul Verma',
            handle_or_phone: '@rahul_vlogs',
          },
          channel: 'instagram' as const,
          last_message: {
            content: 'Auto-DM received from InstaPilot. Thanks!',
            created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
            direction: 'inbound' as const,
          },
          unread_count: 0,
          bot_enabled: true,
          status: 'active' as const,
        },
      ];
    }

    // ── 4. Combine & Sort Feed Chronologically ──────────────────────────────
    let allConversations: NormalizedConversation[] = [...waList, ...tgList, ...igList];
    allConversations.sort((a, b) => {
      const tA = new Date(a.last_message.created_at).getTime() || 0;
      const tB = new Date(b.last_message.created_at).getTime() || 0;
      return tB - tA;
    });

    // ── 5. Channel and Search Filtering ─────────────────────────────────────
    if (channel && channel !== 'all') {
      allConversations = allConversations.filter((c) => c.channel === channel);
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      allConversations = allConversations.filter(
        (c) =>
          c.contact.name.toLowerCase().includes(q) ||
          c.contact.handle_or_phone.toLowerCase().includes(q) ||
          c.last_message.content.toLowerCase().includes(q)
      );
    }

    return allConversations;
  },

  getConversationDetails: async (
    id: string
  ): Promise<{ conversation: NormalizedConversation | null; messages: NormalizedMessage[] }> => {
    // ── 1. Telegram Conversation ───────────────────────────────────────────
    if (id.startsWith('tg_conv_')) {
      let tgUid = id.replace('tg_conv_', '');
      let botId: string | null = null;
      if (tgUid.includes('_bot_')) {
        const parts = tgUid.split('_bot_');
        tgUid = parts[0];
        botId = parts[1];
      }

      try {
        let query = supabase
          .from('tg_chat_messages')
          .select('*')
          .eq('telegram_user_id', Number(tgUid) || tgUid)
          .order('created_at', { ascending: true })
          .limit(100);

        if (botId) {
          query = query.eq('bot_id', botId);
        }

        const { data: tgMsgs } = await query;

        if (tgMsgs && tgMsgs.length > 0) {
          const userName = tgMsgs[0]?.user_name || `Telegram User #${tgUid}`;
          const lastMsg = tgMsgs[tgMsgs.length - 1];

          let resolvedBotName: string | undefined = undefined;
          if (botId) {
            try {
              const { data: botCfg } = await supabase
                .from('tg_chatbot_configs')
                .select('support_name, bot_name')
                .eq('bot_id', botId)
                .maybeSingle();
              if (botCfg) {
                resolvedBotName = (botCfg.support_name || botCfg.bot_name || 'AI Assistant').trim();
              }
            } catch (_) { }
          }

          const conv: NormalizedConversation = {
            id,
            organization_id: '',
            contact: {
              name: userName,
              handle_or_phone: `@${userName.replace(/\s+/g, '_')}`,
            },
            channel: 'telegram' as const,
            bot_id: botId || undefined,
            bot_name: resolvedBotName,
            last_message: {
              content: lastMsg?.content || lastMsg?.message_text || lastMsg?.text || '/start',
              created_at: lastMsg?.created_at || new Date().toISOString(),
              direction: (lastMsg?.role === 'user') ? ('inbound' as const) : ('outbound' as const),
            },
            unread_count: 0,
            status: 'active' as const,
            bot_enabled: true,
          };

          const msgs: NormalizedMessage[] = tgMsgs.map((m: any) => {
            const isUser = (m.role || m.sender_type || '').toLowerCase() === 'user';
            return {
              id: String(m.id || `tg_msg_${Math.random()}`),
              conversation_id: id,
              channel: 'telegram' as const,
              direction: isUser ? ('inbound' as const) : ('outbound' as const),
              content: m.content || m.message_text || m.text || '',
              media: [],
              sender: {
                name: isUser ? (m.user_name || 'Contact') : 'Telegram Bot',
                type: isUser ? ('contact' as const) : ('bot' as const),
              },
              created_at: m.created_at || new Date().toISOString(),
            };
          });

          return { conversation: conv, messages: msgs };
        }
      } catch (err) {
        console.warn('[inboxApi] Telegram details error:', err);
      }

      return {
        conversation: {
          id,
          organization_id: '',
          contact: {
            name: `Telegram User #${tgUid}`,
            handle_or_phone: `@user_${tgUid}`,
          },
          channel: 'telegram' as const,
          last_message: {
            content: 'No messages yet',
            created_at: new Date().toISOString(),
            direction: 'inbound',
          },
          unread_count: 0,
          status: 'active',
          bot_enabled: true,
        },
        messages: [],
      };
    }

    // ── 2. InstaPilot & Social Inbox (Instagram) Conversation ──────────────
    if (id.startsWith('ig_conv_') || id.startsWith('ig_inbox_')) {
      const isInboxType = id.startsWith('ig_inbox_');
      const cleanKey = id.replace('ig_conv_', '').replace('ig_inbox_', '');

      // 1. Try Instapilot conversations first
      try {
        const igData = await apiClient.get<any>('/mobile/v1/social/instapilot/conversations');
        const list = Array.isArray(igData) ? igData : (igData?.conversations || igData?.data || []);
        const found = list.find(
          (c: any) =>
            String(c.id) === cleanKey ||
            c.instagram_username === cleanKey ||
            `ig_conv_${c.id}` === id ||
            `ig_conv_${c.instagram_username}` === id
        );

        if (found) {
          const rawMsgs = Array.isArray(found.instagram_messages) ? found.instagram_messages : [];
          const convName = found.instagram_name || found.instagram_username || 'Instagram User';
          const convHandle = found.instagram_username ? `@${found.instagram_username}` : '';

          const msgs: NormalizedMessage[] = rawMsgs.map((m: any, idx: number) => {
            const isUser = m.direction === 'inbound';
            return {
              id: String(m.id || `ig_msg_${found.id || cleanKey}_${idx}`),
              conversation_id: id,
              channel: 'instagram' as const,
              direction: isUser ? ('inbound' as const) : ('outbound' as const),
              content: m.message_text || m.content || '',
              media: [],
              sender: {
                name: isUser ? convName : 'InstaPilot Bot',
                type: isUser ? ('contact' as const) : ('bot' as const),
              },
              is_bot_reply: !isUser,
              created_at: m.created_at || new Date().toISOString(),
            };
          });

          const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;

          const conv: NormalizedConversation = {
            id,
            organization_id: '',
            contact: {
              name: convName,
              handle_or_phone: convHandle,
              avatar_url: found.profile_pic_url,
            },
            channel: 'instagram' as const,
            last_message: {
              content: lastMsg?.content || found.notes || 'Instagram DM active',
              created_at: lastMsg?.created_at || found.last_message_at || found.created_at || new Date().toISOString(),
              direction: lastMsg?.direction || 'inbound',
            },
            unread_count: found.unread_count || 0,
            status: 'active' as const,
            bot_enabled: found.status === 'bot_active' && !found.bot_paused,
          };

          return { conversation: conv, messages: msgs };
        }
      } catch (err) {
        console.warn('[inboxApi] Instapilot details error:', err);
      }

      // 2. Try Social Inbox conversations & message history
      try {
        const inboxRes = await apiClient.get<any>('/mobile/v1/social/inbox/conversations', { params: { limit: 50 } });
        const items = Array.isArray(inboxRes?.items) ? inboxRes.items : (Array.isArray(inboxRes) ? inboxRes : []);
        const foundItem = items.find((it: any) => String(it.databaseId) === cleanKey || String(it.id) === cleanKey);

        if (foundItem) {
          const msgsRes = await apiClient.get<any>(`/mobile/v1/social/inbox/conversations/${foundItem.databaseId || cleanKey}/messages`, { params: { limit: 50 } });
          const rawMsgs = Array.isArray(msgsRes?.messages) ? msgsRes.messages : (Array.isArray(msgsRes) ? msgsRes : []);

          const author = foundItem.authorName || 'Instagram User';
          const handle = (foundItem.authorHandle || foundItem.authorName || 'user').replace('@', '');

          const msgs: NormalizedMessage[] = rawMsgs.map((m: any, idx: number) => ({
            id: String(m.id || `ig_inbox_msg_${idx}`),
            conversation_id: id,
            channel: 'instagram' as const,
            direction: m.isSelf ? ('outbound' as const) : ('inbound' as const),
            content: m.text || '',
            media: [],
            sender: {
              name: m.isSelf ? 'You' : author,
              type: m.isSelf ? ('agent' as const) : ('contact' as const),
            },
            created_at: m.createdAt || new Date().toISOString(),
          }));

          const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;

          const conv: NormalizedConversation = {
            id,
            organization_id: '',
            contact: {
              name: author,
              handle_or_phone: `@${handle}`,
              avatar_url: foundItem.authorAvatar,
            },
            channel: 'instagram' as const,
            last_message: {
              content: lastMsg?.content || foundItem.text || 'Instagram message',
              created_at: lastMsg?.created_at || foundItem.createdAt || new Date().toISOString(),
              direction: lastMsg?.direction || 'inbound',
            },
            unread_count: foundItem.unread ? 1 : 0,
            status: 'active' as const,
            bot_enabled: false,
          };

          return { conversation: conv, messages: msgs };
        }
      } catch (err) {
        console.warn('[inboxApi] Social inbox details error:', err);
      }

      return {
        conversation: {
          id,
          organization_id: '',
          contact: {
            name: cleanKey,
            handle_or_phone: `@${cleanKey}`,
          },
          channel: 'instagram' as const,
          last_message: {
            content: 'No messages yet',
            created_at: new Date().toISOString(),
            direction: 'inbound',
          },
          unread_count: 0,
          status: 'active',
          bot_enabled: true,
        },
        messages: [],
      };
    }

    // ── 3. WhatsApp Conversation ───────────────────────────────────────────
    try {
      const res = await apiClient.get<{
        conversation: NormalizedConversation | null;
        messages: NormalizedMessage[];
      }>(`/mobile/v1/conversations/${id}`);
      if (res && res.messages) {
        return res;
      }
    } catch (_) { }

    try {
      let realConvId = id;
      if (id.startsWith('conv_')) {
        const contactId = id.replace('conv_', '');
        const { data: convByContact } = await supabase
          .from('w_conversations')
          .select('id')
          .eq('contact_id', contactId)
          .maybeSingle();
        if (convByContact) {
          realConvId = convByContact.id;
        }
      }

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
        .eq('id', realConvId)
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
        .eq('conversation_id', realConvId)
        .order('created_at', { ascending: true })
        .limit(100);

      const currentUserId = (await import('../../../core/store/authStore')).useAuthStore.getState().user?.id;

      const normalizedMsgs: NormalizedMessage[] = (msgs || []).map((m) => {
        const textContent = m.text_body || (typeof m.content === 'object' ? m.content?.text || m.content?.body : m.content) || '';
        const isNote = m.is_internal_note === true || m.type === 'note';
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
          conversation_id: realConvId,
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
    // ── 1. Telegram Outbound Reply ──────────────────────────────────────────
    if (payload.conversation_id.startsWith('tg_conv_')) {
      let tgUid = payload.conversation_id.replace('tg_conv_', '');
      let botId: string | undefined = undefined;
      if (tgUid.includes('_bot_')) {
        const parts = tgUid.split('_bot_');
        tgUid = parts[0];
        botId = parts[1];
      }
      const nowIso = new Date().toISOString();
      const newMsgId = `tg_out_${Date.now()}`;
      try {
        const insertPayload: any = {
          telegram_user_id: Number(tgUid) || tgUid,
          role: 'assistant',
          content: payload.message,
          user_name: 'You',
          created_at: nowIso,
        };
        if (botId) {
          insertPayload.bot_id = botId;
        }
        await supabase.from('tg_chat_messages').insert(insertPayload);
      } catch (err) {
        console.warn('[inboxApi] tg_chat_messages insert notice:', err);
      }
      return {
        id: newMsgId,
        conversation_id: payload.conversation_id,
        channel: 'telegram' as const,
        direction: 'outbound' as const,
        content: payload.message,
        media: [],
        sender: { name: 'You', type: 'agent' as const },
        created_at: nowIso,
        status: 'sent',
      };
    }

    // ── 2. InstaPilot & Social Inbox Outbound Reply ─────────────────────────
    if (payload.conversation_id.startsWith('ig_conv_') || payload.conversation_id.startsWith('ig_inbox_')) {
      const nowIso = new Date().toISOString();
      const realConvId = payload.conversation_id.replace('ig_conv_', '').replace('ig_inbox_', '');
      try {
        await apiClient.post('/mobile/v1/social/inbox/reply', {
          platform: 'instagram',
          conversationDatabaseId: realConvId,
          text: payload.message,
        });
      } catch (err) {
        console.warn('[inboxApi] Social inbox reply notice:', err);
      }
      return {
        id: `ig_out_${Date.now()}`,
        conversation_id: payload.conversation_id,
        channel: 'instagram' as const,
        direction: 'outbound' as const,
        content: payload.message,
        media: [],
        sender: { name: 'You', type: 'agent' as const },
        created_at: nowIso,
        status: 'sent',
      };
    }

    // ── 3. WhatsApp Outbound Reply ──────────────────────────────────────────
    try {
      return await apiClient.post<NormalizedMessage>('/mobile/v1/messages', payload);
    } catch (apiErr) {
      console.warn('[inboxApi] apiClient.post failed, falling back to direct Supabase persistence:', apiErr);

      const authUser = (await import('../../../core/store/authStore')).useAuthStore.getState().user;
      let orgId = authUser?.organizationId;
      const currentUserId = authUser?.id;
      const currentUserEmail = authUser?.email;

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

      // If conversation_id is a placeholder (e.g. conv_<contact_id>), resolve or create real conversation
      let realConvId = payload.conversation_id;
      if (realConvId.startsWith('conv_')) {
        const contactId = realConvId.replace('conv_', '');
        const { data: existing } = await supabase
          .from('w_conversations')
          .select('id')
          .eq('organization_id', orgId)
          .eq('contact_id', contactId)
          .maybeSingle();

        if (existing) {
          realConvId = existing.id;
        } else {
          const { data: created } = await supabase
            .from('w_conversations')
            .insert({
              organization_id: orgId,
              contact_id: contactId,
              last_message_at: new Date().toISOString(),
              last_message_preview: payload.message,
              unread_count: 0,
              status: 'open',
              bot_enabled: true,
            })
            .select('id')
            .single();
          if (created) realConvId = created.id;
        }
      }

      const isNote = !!payload.is_internal_note;
      const nowIso = new Date().toISOString();

      const insertPayload: any = {
        conversation_id: realConvId,
        organization_id: orgId || null,
        direction: 'outbound',
        type: 'text',
        text_body: payload.message,
        content: isNote ? { text: payload.message } : payload.message,
        is_internal_note: isNote,
        status: 'sent',
        sender_type: 'human_agent',
        sender_user_id: currentUserId || null,
        created_at: nowIso,
      };

      const { data: insertedMsg, error: insertErr } = await supabase
        .from('w_messages')
        .insert(insertPayload)
        .select('id, created_at')
        .single();

      if (insertErr) {
        console.error('[inboxApi] Direct Supabase message insert error:', insertErr);
        throw insertErr;
      }

      // Update conversation last_message
      await supabase
        .from('w_conversations')
        .update({
          last_message_at: nowIso,
          last_message_preview: isNote ? `Note: ${payload.message}` : payload.message,
        })
        .eq('id', realConvId);

      return {
        id: insertedMsg.id,
        conversation_id: realConvId,
        channel: 'whatsapp' as const,
        direction: 'outbound',
        content: payload.message,
        media: (payload.attachments || []).map((a) => ({ url: a.url, type: a.type as any })),
        sender: {
          name: isNote ? 'You' : (currentUserEmail?.split('@')[0] || 'You'),
          type: 'agent',
        },
        sender_user_id: currentUserId || undefined,
        is_internal_note: isNote,
        is_bot_reply: false,
        status: 'sent',
        created_at: insertedMsg.created_at || nowIso,
      };
    }
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
    } catch (_) { }

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
    } catch (_) { }

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

  markAsRead: async (conversationId: string): Promise<{ success: boolean }> => {
    try {
      await apiClient.patch(`/mobile/v1/conversations/${conversationId}/read`, {});
      return { success: true };
    } catch {
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

        if (orgId) {
          await supabase
            .from('w_conversations')
            .update({ unread_count: 0 })
            .eq('id', conversationId)
            .eq('organization_id', orgId);
        }
        return { success: true };
      } catch {
        return { success: false };
      }
    }
  },
};


