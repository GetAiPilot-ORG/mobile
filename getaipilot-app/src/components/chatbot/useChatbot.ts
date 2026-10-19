import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../core/api/client';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: 'assistant',
    content:
      "Hello! 👋 I'm your **GetAiPilot Assistant**.\n\nI can help you explore our features, understand **TeleSub**, set up **Landing & Bio pages**, or book a live demo with our team. How can I assist you today?",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

export function useChatbot() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturingLead, setIsCapturingLead] = useState(false);

  /**
   * Knowledge base responses for quick common queries
   */
  const getSimulatedResponse = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes('what is getaipilot') || q.includes('about getaipilot') || q.includes('gap')) {
      return (
        "🚀 **GetAiPilot** is an all-in-one business growth & automation ecosystem designed for creators, agencies, and businesses.\n\n" +
        "Key capabilities include:\n" +
        "• **TeleSub**: Automated Telegram paid subscription & member management\n" +
        "• **Landing & Bio Pages**: High-converting pages with real-time visitor & click analytics\n" +
        "• **Omnichannel CRM**: Unified inbox for WhatsApp, Telegram, and Web leads\n" +
        "• **AI Chatbots & Voice Agents**: 24/7 autonomous support & sales assistants"
      );
    }

    if (q.includes('telesub') || q.includes('telegram')) {
      return (
        "💎 **TeleSub** turns your Telegram channels and groups into an automated recurring revenue engine!\n\n" +
        "• Automatically creates single-use invite links upon successful payment\n" +
        "• Manages membership expiry and revokes access when subscriptions lapse\n" +
        "• Supports instant UPI, Card, and Netbanking payments\n" +
        "• Zero manual intervention needed—100% automated!"
      );
    }

    if (q.includes('free') || q.includes('cost') || q.includes('pricing') || q.includes('plan')) {
      return (
        "🎁 **Yes! You can start using GetAiPilot for FREE!**\n\n" +
        "• Create your initial bio page and landing pages at zero cost.\n" +
        "• Connect your social profiles and explore basic CRM features.\n" +
        "• When you're ready to scale with automated TeleSub, AI bots, and custom domains, affordable plans start from our Pro tier!"
      );
    }

    if (q.includes('demo') || q.includes('book') || q.includes('contact') || q.includes('sales')) {
      setIsCapturingLead(true);
      return (
        "🎯 **We'd love to give you a personalized walkthrough!**\n\n" +
        "Please fill in your contact details below, and our product specialist will reach out to you within 24 hours."
      );
    }

    if (q.includes('landing') || q.includes('bio') || q.includes('click')) {
      return (
        "📈 **Landing & Bio Pages on GetAiPilot**:\n\n" +
        "• Design slick, mobile-responsive bio pages and sales funnels in minutes\n" +
        "• Track real-time visitor counts and button clicks\n" +
        "• Receive push notifications at every 50-click milestone directly to your phone!\n" +
        "• Check out your designs anytime under `/tools/my-designs`."
      );
    }

    if (q.includes('whatsapp') || q.includes('crm') || q.includes('leads')) {
      return (
        "💬 **WhatsApp & CRM Integration**:\n\n" +
        "• Connect official WhatsApp Cloud API or web session\n" +
        "• Broadcast campaigns, manage prospects, and route deals across your sales team\n" +
        "• Keep track of follow-ups, statuses, and revenue milestones in one unified view."
      );
    }

    return (
      "Thank you for reaching out! 💡 GetAiPilot provides powerful tools for Telegram monetization, AI chatbots, landing page builders, and CRM automation.\n\n" +
      "Would you like to **Book a Demo** or learn more about a specific feature?"
    );
  };

  /**
   * Send a message in the chat
   */
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMsg: ChatMessage = {
        role: 'user',
        content: text.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      // Check if user is asking for a demo
      const lower = text.toLowerCase();
      if (lower.includes('book a demo') || lower.includes('demo') || lower.includes('contact sales')) {
        setIsCapturingLead(true);
      }

      try {
        // Try BFF AI Chat endpoint if available
        let botResponse = '';
        try {
          const res = await apiClient.post<any>('/mobile/v1/ai/chat', {
            message: text.trim(),
            userId: user?.id,
          });
          if (res?.response || res?.content || res?.message) {
            botResponse = res.response || res.content || res.message;
          }
        } catch {
          // BFF endpoint unavailable; fallback to smart built-in knowledge engine
        }

        if (!botResponse) {
          // Simulate short natural typing delay
          await new Promise((res) => setTimeout(res, 600));
          botResponse = getSimulatedResponse(text);
        }

        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: botResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        console.warn('[useChatbot] sendMessage error:', err);
        const fallbackMsg: ChatMessage = {
          role: 'assistant',
          content:
            "I'm here to assist you! Feel free to ask about TeleSub, Bio pages, Landing templates, or tap 'Book a Demo' to talk with our team.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id]
  );

  /**
   * Submit lead details (Name, Email, Phone)
   */
  const submitLead = useCallback(
    async (name: string, email: string, phone?: string) => {
      setIsLoading(true);
      try {
        // 1. Try to record in Supabase leads / notifications
        try {
          await supabase.from('leads').insert({
            name,
            email,
            phone: phone || null,
            source: 'Mobile App AI Chatbot',
            created_at: new Date().toISOString(),
          });
        } catch {
          // Table name might differ in schemas, ignore quietly
        }

        // 2. Also register notification / admin activity
        try {
          await supabase.from('notifications').insert({
            user_id: user?.id || null,
            title: '🚀 New Chatbot Demo Request',
            description: `${name} (${email}, ${phone || 'No phone'}) requested a demo via AI Chatbot.`,
            type: 'lead',
            is_read: false,
          });
        } catch {
          // ignore
        }

        setIsCapturingLead(false);

        const confirmationMsg: ChatMessage = {
          role: 'assistant',
          content: `🎉 **Thank you, ${name}!**\n\nWe have received your demo request. One of our specialists will reach out to **${email}**${
            phone ? ` or call on **${phone}**` : ''
          } shortly with demo access and tailored onboarding!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, confirmationMsg]);
      } catch (err: any) {
        console.warn('[useChatbot] submitLead error:', err);
        setIsCapturingLead(false);
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id]
  );

  return {
    messages,
    isLoading,
    isCapturingLead,
    setIsCapturingLead,
    sendMessage,
    submitLead,
  };
}
