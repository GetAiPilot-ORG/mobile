import { NormalizedConversation, NormalizedMessage, SocialPost } from '../types/index.js';

export class SocialAdapter {
  private static postsStore: SocialPost[] = [
    {
      id: 'post_1',
      platforms: ['instagram', 'facebook'],
      caption: '🚀 Scale your business communication 10x with GetAiPilot AI agents. Try for free today!',
      mediaUrls: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800'],
      status: 'scheduled',
      scheduledFor: new Date(Date.now() + 4 * 3600000).toISOString(),
    },
    {
      id: 'post_2',
      platforms: ['linkedin'],
      caption: 'Announcing unified multi-channel messaging support on GetAiPilot!',
      mediaUrls: [],
      status: 'published',
      scheduledFor: new Date(Date.now() - 24 * 3600000).toISOString(),
      publishedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    },
  ];

  public static async getConnectedAccounts(workspaceId: string) {
    return [
      { id: 'acc_ig', platform: 'instagram', username: '@getaipilot', followers: 14200, connected: true },
      { id: 'acc_fb', platform: 'facebook', username: 'GetAiPilot Official', followers: 8500, connected: true },
      { id: 'acc_li', platform: 'linkedin', username: 'GetAiPilot Technologies', followers: 23400, connected: true },
      { id: 'acc_yt', platform: 'youtube', username: 'GetAiPilot Academy', followers: 5100, connected: false },
    ];
  }

  public static async getPosts(workspaceId: string): Promise<SocialPost[]> {
    return this.postsStore;
  }

  public static async schedulePost(post: Partial<SocialPost>): Promise<SocialPost> {
    const newPost: SocialPost = {
      id: `post_${Date.now()}`,
      platforms: post.platforms || ['instagram'],
      caption: post.caption || '',
      mediaUrls: post.mediaUrls || [],
      status: 'scheduled',
      scheduledFor: post.scheduledFor || new Date(Date.now() + 3600000).toISOString(),
    };
    this.postsStore.unshift(newPost);
    return newPost;
  }

  public static async getConversations(workspaceId: string): Promise<NormalizedConversation[]> {
    return [
      {
        id: 'ig_conv_1',
        organization_id: workspaceId,
        contact: {
          name: 'Marta Vance',
          handle_or_phone: '@dev_marta',
        },
        channel: 'instagram',
        last_message: {
          content: 'How do I integrate the API into my Next.js store?',
          created_at: new Date(Date.now() - 12 * 60000).toISOString(),
          direction: 'inbound',
        },
        unread_count: 1,
        status: 'active',
      },
      {
        id: 'fb_conv_1',
        organization_id: workspaceId,
        contact: {
          name: 'Tech Ventures FB',
          handle_or_phone: 'fb.com/techventures',
        },
        channel: 'facebook',
        last_message: {
          content: 'Interested in enterprise bulk seat provisioning.',
          created_at: new Date(Date.now() - 180 * 60000).toISOString(),
          direction: 'inbound',
        },
        unread_count: 0,
        status: 'active',
      },
    ];
  }

  public static async getMessages(conversationId: string): Promise<NormalizedMessage[]> {
    const isInstagram = conversationId.startsWith('ig_');
    return [
      {
        id: `${conversationId}_msg_1`,
        conversation_id: conversationId,
        channel: isInstagram ? 'instagram' : 'facebook',
        direction: 'inbound',
        content: isInstagram
          ? 'How do I integrate the API into my Next.js store?'
          : 'Interested in enterprise bulk seat provisioning.',
        media: [],
        sender: { name: isInstagram ? '@dev_marta' : 'Tech Ventures', type: 'contact' },
        created_at: new Date(Date.now() - 15 * 60000).toISOString(),
      },
      {
        id: `${conversationId}_msg_2`,
        conversation_id: conversationId,
        channel: isInstagram ? 'instagram' : 'facebook',
        direction: 'outbound',
        content: 'Hi! You can use our official TypeScript SDK or direct REST endpoints with Bearer auth.',
        media: [],
        sender: { name: 'Support Agent', type: 'agent' },
        created_at: new Date(Date.now() - 10 * 60000).toISOString(),
      },
    ];
  }

  public static async sendMessage(
    conversationId: string,
    content: string,
    attachments?: Array<{ url: string; type: string }>
  ): Promise<NormalizedMessage> {
    const isInstagram = conversationId.startsWith('ig_');
    return {
      id: `soc_msg_${Date.now()}`,
      conversation_id: conversationId,
      channel: isInstagram ? 'instagram' : 'facebook',
      direction: 'outbound',
      content,
      media: (attachments || []).map((a) => ({ url: a.url, type: a.type as any })),
      sender: { name: 'Support Agent', type: 'agent' },
      created_at: new Date().toISOString(),
    };
  }
}
