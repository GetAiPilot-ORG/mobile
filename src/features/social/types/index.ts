export type SocialTabType = 'overview' | 'trends' | 'inbox' | 'activity';

export type ActivitySubTab = 'queue' | 'instapilot' | 'youtube' | 'autodm';

export interface SocialAccount {
  id: string;
  platform: string;
  provider: string;
  account_name: string;
  username?: string;
  avatar?: string | null;
  status?: string;
  connected: boolean;
  followerCount?: number;
  raw?: any;
}

export interface TrendItem {
  id: string;
  source_platform: 'youtube' | 'unsplash' | 'pexels' | 'gnews' | 'google_trends' | 'reddit' | string;
  source_url?: string;
  embed_html?: string | null;
  thumbnail_url?: string;
  full_image_url?: string;
  video_url?: string;
  duration?: number;
  title?: string;
  caption?: string;
  creator?: string | null;
  creator_url?: string;
  content_type?: 'visual' | 'reel_video' | 'video' | 'news' | 'trend_query' | 'article' | string;
  color?: string;
  aspect_ratio?: string;
  engagement_score?: number;
  metrics?: {
    views?: number;
    likes?: number;
    shares?: number;
    comments?: number;
    duration?: string;
    quality?: string;
    searchVolume?: number;
    rank?: number;
    source?: string;
    [key: string]: any;
  };
  niche_tags?: string[];
  published_at?: string;
  ingested_at?: string;
  rank_score?: number;
  platform?: string;
  category?: string;
}

export interface TrendFeedResponse {
  success: boolean;
  items: TrendItem[];
  nextCursor?: string | null;
  page: number;
  totalCandidateCount?: number;
  cached?: boolean;
}

export interface ScheduledPost {
  id: string;
  user_id?: string;
  caption: string;
  status: string;
  scheduled_for?: string | null;
  posted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  cancelled_at?: string | null;
  processing_started_at?: string | null;
  attempt_count?: number;
  last_error?: string | null;
  media_type?: 'video' | 'image' | string;
  media_url?: string;
  media_urls?: string[];
  thumbnail_url?: string | null;
  video_filename?: string;
  selected_channels?: string[];
  youtube_success?: boolean;
  youtube_video_id?: string | null;
  youtube_url?: string | null;
  youtube_shorts_url?: string | null;
  youtube_error?: string | null;
  instagram_success?: boolean;
  instagram_post_id?: string | null;
  instagram_url?: string | null;
  instagram_error?: string | null;
  facebook_success?: boolean;
  facebook_post_id?: string | null;
  facebook_url?: string | null;
  facebook_error?: string | null;
  x_success?: boolean;
  x_post_id?: string | null;
  x_url?: string | null;
  x_error?: string | null;
  linkedin_success?: boolean;
  linkedin_post_id?: string | null;
  linkedin_url?: string | null;
  linkedin_error?: string | null;
  pinterest_success?: boolean;
  pinterest_pin_id?: string | null;
  pinterest_url?: string | null;
  pinterest_error?: string | null;
  threads_success?: boolean;
  threads_post_id?: string | null;
  threads_url?: string | null;
  threads_error?: string | null;
  bluesky_success?: boolean;
  bluesky_post_id?: string | null;
  bluesky_url?: string | null;
  bluesky_error?: string | null;
  mastodon_success?: boolean;
  mastodon_post_id?: string | null;
  mastodon_url?: string | null;
  mastodon_error?: string | null;
  tiktok_success?: boolean;
  tiktok_publish_id?: string | null;
  tiktok_error?: string | null;
  platform_data?: any;
}

export interface InstapilotMessage {
  direction: 'inbound' | 'outbound' | string;
  created_at: string;
  message_text: string;
}

export interface InstapilotConversation {
  id: string;
  user_id?: string;
  bot_id?: string | null;
  instagram_account_id?: string;
  instagram_user_id?: string;
  instagram_username: string;
  instagram_name?: string;
  status?: 'bot_active' | 'bot_paused' | string;
  assigned_to?: string | null;
  bot_paused?: boolean;
  failure_count?: number;
  lead_data?: {
    email?: string;
    phone?: string;
    [key: string]: any;
  };
  labels?: string[];
  notes?: string | null;
  last_message_at?: string;
  created_at?: string;
  updated_at?: string;
  profile_pic_url?: string | null;
  follower_count?: number;
  is_user_follow_business?: boolean;
  is_business_follow_user?: boolean;
  instagram_bots?: any;
  instagram_messages?: InstapilotMessage[];
}

export interface InstapilotStats {
  accountUsername: string;
  followers: number;
  following: number;
  engagementRate: string;
  autoReelsActive: boolean;
  autoStoriesActive: boolean;
  scheduledReelsCount: number;
  recentStories: { id: string; title: string; views: number; date: string }[];
}

export interface YoutubeVideoItem {
  id: string;
  title: string;
  description?: string;
  views?: number | string;
  likes?: number | string;
  duration?: string;
  status: 'public' | 'unlisted' | 'private' | 'scheduled' | string;
  publishedAt?: string;
  scheduledFor?: string;
  thumbnailUrl?: string;
  category?: 'Videos' | 'Shorts' | 'Playlists' | 'Posts' | string;
  videoUrl?: string;
}

export interface YoutubeChannelAccount {
  id: string;
  username?: string;
  account_name?: string;
  channel_id?: string;
  connected?: boolean;
  avatar_url?: string;
  youtube?: {
    id?: string;
    snippet?: {
      title?: string;
      description?: string;
      customUrl?: string;
      thumbnails?: {
        default?: { url?: string };
        medium?: { url?: string };
        high?: { url?: string };
      };
    };
    statistics?: {
      viewCount?: string | number;
      subscriberCount?: string | number;
      videoCount?: string | number;
    };
  };
  videos?: YoutubeVideoItem[];
}

export interface SystemSettings {
  id: string;
  global_maintenance_enabled: boolean;
  title?: string | null;
  message?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  updated_at?: string;
}

export interface SystemProductStatus {
  id: string;
  product_key: string;
  product_name: string;
  maintenance_enabled: boolean;
  maintenance_type?: string;
  maintenance_title?: string;
  maintenance_message?: string;
  status: 'operational' | 'degraded' | 'maintenance' | string;
  block_frontend?: boolean;
  block_api?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface YoutubeStudioStats {
  channelTitle: string;
  subscriberCount: number | string;
  totalViews: number | string;
  videoCount: number | string;
  recentVideos: YoutubeVideoItem[];
}

export type AutoDMSubCategory = 'automations' | 'contacts' | 'profile';

export interface AutoDMDailyMetric {
  id: string;
  user_id: string;
  instagram_account_id: string;
  date: string;
  messages_sent: number;
  messages_seen: number;
  total_clicks: number;
  followers_gained: number;
  leads_captured: number;
  created_at: string;
}

export interface AutoDMAutomationItem {
  id: string;
  instagram_account_id: string;
  user_id: string;
  name: string;
  trigger_type: 'comment_on_post' | 'story_reply' | 'direct_message' | string;
  keyword?: string;
  keywords?: string[];
  reply_text?: string;
  is_active: boolean;
  is_case_sensitive?: boolean;
  comment_reply_enabled?: boolean;
  comment_reply_text?: string;
  response_flow?: {
    nodes?: Array<{
      id: string;
      type: string;
      content?: string;
      buttons?: Array<{ id: string; url: string; type: string; title: string }>;
    }>;
    opening_button?: string;
    opening_message?: string;
    opening_message_enabled?: boolean;
  };
  follower_count_at_create?: number;
  latest_followers_count?: number | null;
  media_id?: string | null;
  media_url?: string | null;
  media_thumbnail?: string | null;
  media_caption?: string | null;
  schedule_type?: string;
  starts_at?: string;
  ends_at?: string;
  require_follow?: boolean;
  comments?: number;
  dms_sent?: number;
  created_at: string;
  updated_at?: string;
}

export interface AutoDMAccount {
  id: string;
  user_id: string;
  page_id?: string;
  page_name?: string;
  instagram_business_account_id?: string;
  instagram_username?: string;
  username?: string;
  is_connected?: boolean;
  webhook_status?: string;
  token_status?: string;
  token_expires_at?: string;
  profile_picture_url?: string;
  full_name?: string;
  account_type?: string;
  followers_count?: number;
  media_count?: number;
  webhook_instagram_user_id?: string;
}

export interface AutoDMInstagramMediaItem {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | string;
  media_url?: string;
  permalink?: string;
  thumbnail_url?: string;
  timestamp: string;
  username?: string;
  like_count?: number;
  comments_count?: number;
}

export interface AutoDMContactItem {
  id: string;
  user_id: string;
  instagram_account_id: string;
  instagram_user_id: string;
  username: string;
  full_name?: string | null;
  profile_picture_url?: string | null;
  follower_count?: number;
  is_following_you?: boolean;
  you_are_following?: boolean;
  first_interaction_at?: string | null;
  last_interaction_at?: string | null;
  total_messages_sent?: number;
  total_messages_received?: number;
  tags?: string[];
  notes?: string | null;
  canonical_contact_id?: string | null;
  ecosystem_synced_at?: string | null;
  ecosystem_sync_source?: string | null;
  ecosystem_sync_status?: string | null;
}

export interface AutoDMRule {
  id: string;
  name: string;
  triggerKeyword: string;
  channel: 'instagram' | 'facebook' | 'all';
  matchType: 'exact' | 'contains';
  replyMessage: string;
  includeLink?: string;
  enabled: boolean;
  triggerCount: number;
  leadsCaptured: number;
}

export interface SocialInboxConversationItem {
  id: string;
  databaseId: string;
  externalConversationId: string;
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | string;
  accountId: string;
  accountName?: string;
  postId?: string | null;
  postTitle?: string | null;
  postThumbnail?: string | null;
  commentId?: string | null;
  topLevelCommentId?: string | null;
  replyRecipientId?: string | null;
  threadComplete?: boolean;
  authorName?: string | null;
  authorAvatar?: string | null;
  authorHandle?: string | null;
  text?: string;
  createdAt: string;
  replied?: boolean;
  starred?: boolean;
  unread?: boolean;
  replyCount?: number;
  replies?: Array<any>;
  persisted?: boolean;
}

export interface SocialInboxMessageItem {
  id: string;
  text: string;
  createdAt: string;
  isSelf: boolean;
  status: 'sent' | 'received' | string;
}

export interface SocialInboxReplyPayload {
  platform: string;
  accountId?: string;
  commentId?: string;
  recipientId?: string;
  postId?: string | null;
  text: string;
  conversationDatabaseId?: string;
}

