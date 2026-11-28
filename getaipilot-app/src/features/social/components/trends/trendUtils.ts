import { TrendItem } from '../../types';

export interface TrendPlatformMeta {
  label: string;
  color: string;
  bg: string;
}

export function formatCompact(val?: number | string | null): string | null {
  if (val == null || val === '') return null;
  const n = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.]/g, '')) : Number(val);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return n.toLocaleString();
}

export function formatTimeAgo(value?: string): string {
  if (!value) return 'Live';
  try {
    const date = new Date(value);
    const diffHours = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
  } catch {
    return 'Trending';
  }
}

export function getPlatformMeta(platformRaw: string = ''): TrendPlatformMeta {
  const p = (platformRaw || '').toLowerCase();
  if (p.includes('youtube')) {
    return { label: 'YouTube', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.14)' };
  }
  if (p.includes('pinterest')) {
    return { label: 'Pinterest', color: '#E11D48', bg: 'rgba(225, 29, 72, 0.14)' };
  }
  if (p.includes('instagram')) {
    return { label: 'Instagram', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.14)' };
  }
  if (p.includes('pexels')) {
    return { label: 'Pexels Reel', color: '#10B981', bg: 'rgba(16, 185, 129, 0.14)' };
  }
  if (p.includes('unsplash')) {
    return { label: 'Unsplash', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.14)' };
  }
  if (p.includes('gnews') || p.includes('news')) {
    return { label: 'News', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.14)' };
  }
  if (p.includes('google_trends') || p.includes('trend')) {
    return { label: 'Google Trends', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.14)' };
  }
  if (p.includes('reddit')) {
    return { label: 'Reddit', color: '#F97316', bg: 'rgba(249, 115, 22, 0.14)' };
  }
  if (p.includes('socialpilot')) {
    return { label: 'SocialPilot', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.14)' };
  }
  return {
    label: platformRaw ? platformRaw.charAt(0).toUpperCase() + platformRaw.slice(1) : 'Trend',
    color: '#7055E8',
    bg: 'rgba(112, 85, 232, 0.14)',
  };
}

export interface FormatTab {
  id: 'all' | 'shorts' | 'pinterest' | 'videos' | 'visuals' | 'news' | 'searches';
  label: string;
}

export const FORMAT_TABS: FormatTab[] = [
  { id: 'all', label: 'All Trends' },
  { id: 'shorts', label: 'YouTube Shorts' },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'videos', label: 'Reels & Videos' },
  { id: 'visuals', label: 'Visuals & Photos' },
  { id: 'news', label: 'News & Stories' },
  { id: 'searches', label: 'Search Trends' },
];

export interface RegionOption {
  code: string;
  label: string;
  flag: string;
}

export const REGION_OPTIONS: RegionOption[] = [
  { code: 'IN', label: 'India', flag: '🇮🇳' },
  { code: 'US', label: 'United States', flag: '🇺🇸' },
  { code: 'GLOBAL', label: 'Global', flag: '🌐' },
  { code: 'GB', label: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', label: 'Canada', flag: '🇨🇦' },
  { code: 'AU', label: 'Australia', flag: '🇦🇺' },
];

export interface TrendInterestTopic {
  id: string;
  label: string;
  emoji: string;
  category: string;
  keywords: string;
}

export const TOPIC_CATEGORIES = [
  'All',
  'Tech & AI',
  'Business & Wealth',
  'Creative & Media',
  'Lifestyle & Health',
  'Travel & Culture',
  'Entertainment',
] as const;

export const TREND_INTEREST_TOPICS: TrendInterestTopic[] = [
  // 1. Tech & AI
  { id: 'ai_chatgpt', label: 'AI & ChatGPT', emoji: '🤖', category: 'Tech & AI', keywords: 'ai, chatgpt, llm, artificial intelligence, claude, midjourney, prompt, openai, generative ai' },
  { id: 'tech_gadgets', label: 'Tech & Gadgets', emoji: '⚡', category: 'Tech & AI', keywords: 'tech, gadgets, apple, smartphone, setup, hardware, devices, desk setup' },
  { id: 'coding_dev', label: 'Coding & Dev', emoji: '💻', category: 'Tech & AI', keywords: 'coding, programmer, developer, software, web development, python, javascript, code, github' },
  { id: 'science_space', label: 'Future & Space', emoji: '🚀', category: 'Tech & AI', keywords: 'science, future, space, astrophysics, robotics, astronomy, nasa, spacex' },
  { id: 'robotics_hardware', label: 'Robotics & Hardware', emoji: '🦾', category: 'Tech & AI', keywords: 'robotics, hardware, engineering, arduino, raspberry pi, drones, automation, sensors' },
  { id: 'cybersecurity_privacy', label: 'Cyber & Security', emoji: '🛡️', category: 'Tech & AI', keywords: 'cybersecurity, hacking, security, privacy, encryption, infosec, ethical hacking, malware' },
  { id: 'apple_ecosystem', label: 'Apple Ecosystem', emoji: '🍎', category: 'Tech & AI', keywords: 'apple, iphone, macbook, ios, ipad, apple watch, macos, airpods, tim cook' },
  { id: 'crypto_bitcoin', label: 'Crypto & Bitcoin', emoji: '🪙', category: 'Tech & AI', keywords: 'crypto, bitcoin, ethereum, blockchain, web3, solana, crypto news, defi' },

  // 2. Business & Wealth
  { id: 'startups_saas', label: 'Startups & SaaS', emoji: '🏢', category: 'Business & Wealth', keywords: 'startups, saas, founder, indie hacker, entrepreneurship, building in public, business' },
  { id: 'marketing_growth', label: 'Marketing & Growth', emoji: '📈', category: 'Business & Wealth', keywords: 'marketing, growth, seo, copywriting, sales, advertising, branding, funnel, viral growth' },
  { id: 'finance_stocks', label: 'Investing & Stocks', emoji: '💵', category: 'Business & Wealth', keywords: 'investing, stocks, wealth, portfolio, passive income, market, etf, finance, dividends' },
  { id: 'real_estate', label: 'Real Estate & Homes', emoji: '🏠', category: 'Business & Wealth', keywords: 'real estate, property, housing, architecture, rental properties, real estate investing, mortgage' },
  { id: 'ecommerce_dropship', label: 'E-Commerce & Brands', emoji: '🛍️', category: 'Business & Wealth', keywords: 'ecommerce, shopify, amazon fba, dropshipping, direct to consumer, retail, store' },
  { id: 'creator_economy', label: 'Creator Economy', emoji: '📱', category: 'Business & Wealth', keywords: 'creator, monetization, youtube growth, hooks, editing, viral, content creator, sponsorships' },
  { id: 'side_hustles', label: 'Side Hustles & Wealth', emoji: '💼', category: 'Business & Wealth', keywords: 'side hustle, passive income, make money online, freelancing, solopreneur, work from home' },
  { id: 'business_strategy', label: 'Business Strategy', emoji: '📊', category: 'Business & Wealth', keywords: 'business strategy, economics, case studies, corporate, management, venture capital, market analysis' },

  // 3. Creative & Media
  { id: 'reels_video', label: 'Reels & Short Video', emoji: '🎥', category: 'Creative & Media', keywords: 'video editing, reels, tiktok, capcut, cinematography, shortform, broll, viral video' },
  { id: 'video_editing_vfx', label: 'Video Editing & VFX', emoji: '🎬', category: 'Creative & Media', keywords: 'premiere pro, after effects, davinci resolve, vfx, color grading, sound design, transitions' },
  { id: 'design_3d', label: 'Design & 3D Art', emoji: '🎨', category: 'Creative & Media', keywords: 'design, ui, ux, 3d, blender, graphic design, animation, typography, aesthetic, figma' },
  { id: 'photography_gear', label: 'Photo & Cameras', emoji: '📸', category: 'Creative & Media', keywords: 'photography, camera, lighting, portraits, aesthetic, photo, cinematic photo, sony, canon' },
  { id: 'architecture_interiors', label: 'Interior & Architecture', emoji: '🏛️', category: 'Creative & Media', keywords: 'architecture, interior design, home decor, modern home, minimal living, aesthetic room' },
  { id: 'typography_branding', label: 'Branding & Logos', emoji: '✒️', category: 'Creative & Media', keywords: 'branding, logos, typography, visual identity, poster design, aesthetic fonts, creative director' },
  { id: 'animation_motion', label: 'Motion & Animation', emoji: '🎞️', category: 'Creative & Media', keywords: 'animation, motion graphics, 2d animation, stop motion, anime aesthetic, cgi, motion design' },
  { id: 'filmmaking_cinema', label: 'Filmmaking & Directing', emoji: '🎥', category: 'Creative & Media', keywords: 'filmmaking, director, cinematography, indie film, screenwriting, camera gear, movie scenes' },

  // 4. Lifestyle & Health
  { id: 'fitness_gym', label: 'Fitness & Gym', emoji: '🏋️', category: 'Lifestyle & Health', keywords: 'fitness, gym, workout, muscle, bodybuilding, health, training, nutrition, lifting' },
  { id: 'running_cardio', label: 'Running & Cardio', emoji: '🏃', category: 'Lifestyle & Health', keywords: 'running, marathon, sprint, cardio, endurance, trail running, athletics, runner' },
  { id: 'yoga_mindfulness', label: 'Yoga & Mindfulness', emoji: '🧘', category: 'Lifestyle & Health', keywords: 'yoga, meditation, mindfulness, breathing, flexibility, calm, mental health, zen' },
  { id: 'nutrition_mealprep', label: 'Nutrition & Diet', emoji: '🥗', category: 'Lifestyle & Health', keywords: 'nutrition, healthy food, meal prep, high protein, clean eating, diet, macros, vitamins' },
  { id: 'biohacking_sleep', label: 'Biohacking & Sleep', emoji: '🧬', category: 'Lifestyle & Health', keywords: 'biohacking, sleep optimization, longevity, recovery, cold plunge, sauna, circadian rhythm' },
  { id: 'productivity_habits', label: 'Productivity & Focus', emoji: '💡', category: 'Lifestyle & Health', keywords: 'productivity, habits, focus, notion, daily routine, systems, deep work, time management' },
  { id: 'mindset_selfhelp', label: 'Mindset & Motivation', emoji: '🧠', category: 'Lifestyle & Health', keywords: 'motivation, discipline, psychology, mindset, self improvement, stoicism, mental toughness' },
  { id: 'books_learning', label: 'Books & Knowledge', emoji: '📚', category: 'Lifestyle & Health', keywords: 'books, reading, non fiction, book recommendations, learning, philosophy, summary' },
  { id: 'skincare_beauty', label: 'Skincare & Self-Care', emoji: '💧', category: 'Lifestyle & Health', keywords: 'skincare, beauty, grooming, morning routine, dermatologists, glow, self care' },

  // 5. Travel, Food & Style
  { id: 'travel_nomad', label: 'Travel & Nomad', emoji: '✈️', category: 'Travel & Culture', keywords: 'travel, nomad, adventure, explore, destinations, vacation, digital nomad, wanderlust' },
  { id: 'luxury_hiddenplaces', label: 'Luxury Escapes', emoji: '🏝️', category: 'Travel & Culture', keywords: 'luxury travel, hidden gems, resorts, islands, hotels, first class, scenic views' },
  { id: 'food_cooking', label: 'Food & Recipes', emoji: '🍔', category: 'Travel & Culture', keywords: 'food, cooking, recipes, street food, baking, chef, restaurant, meal prep, gourmet' },
  { id: 'coffee_drinks', label: 'Specialty Coffee', emoji: '☕', category: 'Travel & Culture', keywords: 'coffee, espresso, latte art, cafe, barista, pour over, cocktails, matchalatte' },
  { id: 'fashion_style', label: 'Fashion & Streetwear', emoji: '👟', category: 'Travel & Culture', keywords: 'fashion, streetwear, outfits, styling, sneakers, luxury, drip, lookbook' },
  { id: 'sneakerhead_drops', label: 'Sneakers & Kicks', emoji: '🔥', category: 'Travel & Culture', keywords: 'sneakers, sneakerhead, jordan, nike, yeezy, kicks, unboxing, sneaker collection' },
  { id: 'gardening_plants', label: 'Plants & Gardening', emoji: '🌿', category: 'Travel & Culture', keywords: 'gardening, house plants, urban garden, botany, nature, plant care, balcony garden' },
  { id: 'diy_crafting', label: 'DIY & Woodworking', emoji: '🔨', category: 'Travel & Culture', keywords: 'diy, woodworking, carpentry, crafting, handmade, restoration, maker, workshop' },

  // 6. Entertainment & Pop
  { id: 'gaming_stream', label: 'Gaming & Esports', emoji: '🎮', category: 'Entertainment', keywords: 'gaming, gta, playstation, twitch, steam, esports, xbox, pc gaming, gameplay' },
  { id: 'retro_nintendo', label: 'Retro & Nintendo', emoji: '👾', category: 'Entertainment', keywords: 'retro gaming, nintendo, zelda, pokemon, mario, game boy, arcade, nostalgic gaming' },
  { id: 'cinema_movies', label: 'Cinema & TV Shows', emoji: '🍿', category: 'Entertainment', keywords: 'movies, cinema, trailer, series, netflix, hollywood, film, box office, actors' },
  { id: 'anime_manga', label: 'Anime & Manga', emoji: '⛩️', category: 'Entertainment', keywords: 'anime, manga, animation, japan, otaku, cosplay, shonen, studio ghibli' },
  { id: 'comedy_memes', label: 'Comedy & Memes', emoji: '😂', category: 'Entertainment', keywords: 'comedy, memes, jokes, funny, skits, relatable, humor, viral jokes, laugh' },
  { id: 'music_audio', label: 'Music & Viral Audio', emoji: '🎵', category: 'Entertainment', keywords: 'music, beats, trending audio, sound, artists, live music, new album, concert' },
  { id: 'hiphop_beats', label: 'Hip Hop & Beatmaking', emoji: '🎧', category: 'Entertainment', keywords: 'hip hop, rap, beatmaker, fl studio, producer, instrumentals, trap, sampling' },
  { id: 'podcasts_talks', label: 'Podcasts & Interviews', emoji: '🎙️', category: 'Entertainment', keywords: 'podcasts, interview, conversation, longform, creator talks, speech, discussion' },
  { id: 'cars_supercars', label: 'Supercars & Racing', emoji: '🏎️', category: 'Entertainment', keywords: 'cars, supercars, automotive, racing, f1, vehicles, tuning, ferrari, porsche' },
  { id: 'motorcycles_biker', label: 'Motorcycles & Moto', emoji: '🏍️', category: 'Entertainment', keywords: 'motorcycles, biker, moto, cafe racer, harley, ducati, superbike, riding' },
  { id: 'history_lore', label: 'History & Lore', emoji: '📜', category: 'Entertainment', keywords: 'history, ancient history, mythology, warfare, historical facts, deep lore, empires' },
  { id: 'pets_cuteanimals', label: 'Cute Pets & Animals', emoji: '🐾', category: 'Entertainment', keywords: 'pets, dogs, cats, puppies, kittens, cute animals, wildlife, pet memes' },
  { id: 'nature_exploration', label: 'Nature & Wildlife', emoji: '🌲', category: 'Entertainment', keywords: 'nature, wildlife, ocean, deep sea, national parks, animals, documentary, planet' },
];

export function detectFormatFromGoal(goal?: string): FormatTab['id'] | null {
  if (!goal) return null;
  const lower = String(goal).toLowerCase().trim();
  if (lower.includes('short') || lower.includes('reel') || lower.includes('tiktok') || lower.includes('clip')) {
    return 'shorts';
  }
  if (lower.includes('video') || lower.includes('youtube') || lower.includes('film')) {
    return 'videos';
  }
  if (
    lower.includes('photo') ||
    lower.includes('visual') ||
    lower.includes('image') ||
    lower.includes('carousel') ||
    lower.includes('picture') ||
    lower.includes('pin')
  ) {
    return 'visuals';
  }
  if (lower.includes('news') || lower.includes('story') || lower.includes('article') || lower.includes('thread')) {
    return 'news';
  }
  return null;
}

export function sanitizeRecentSearches(searches?: unknown[]): string[] {
  if (!Array.isArray(searches)) return [];
  const cleaned = searches
    .map((s) => String(s || '').trim().replace(/^#/, ''))
    .filter((s) => s.length >= 2);

  const result: string[] = [];
  for (const term of cleaned) {
    const lower = term.toLowerCase();
    const isFragment = cleaned.some((other) => {
      const otherLower = other.toLowerCase();
      if (otherLower === lower) return false;
      const lowerNorm = lower.replace(/[^a-z0-9]/g, '');
      const otherNorm = otherLower.replace(/[^a-z0-9]/g, '');
      if (otherNorm.length > lowerNorm.length && otherNorm.startsWith(lowerNorm)) return true;
      if (otherLower.length > lower.length && otherLower.startsWith(lower)) return true;
      if (otherLower.length > lower.length && otherLower.includes(lower) && lower.length <= 4) return true;
      if (
        otherLower.length > lower.length &&
        lower.length >= 4 &&
        otherLower.startsWith(lower.slice(0, 4)) &&
        otherLower.length - lower.length <= 4
      ) {
        return true;
      }
      return false;
    });

    if (!isFragment && !result.some((x) => x.toLowerCase() === lower)) {
      result.push(term);
    }
  }
  return result.slice(0, 10);
}

export function addTermToInterestsString(existingInterestsStr?: string, newTerm?: string): string {
  const cleanTerm = String(newTerm || '').trim().replace(/^#/, '');
  if (!cleanTerm || cleanTerm.length < 2) return existingInterestsStr || '';

  const cleanLower = cleanTerm.toLowerCase();
  const list = typeof existingInterestsStr === 'string'
    ? existingInterestsStr.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const filtered = list.filter((item) => {
    const itemLower = item.toLowerCase();
    if (itemLower === cleanLower) return false;
    if (cleanLower.startsWith(itemLower)) return false;
    if (cleanLower.length > itemLower.length && cleanLower.includes(itemLower) && itemLower.length <= 4) return false;
    if (
      cleanLower.length > itemLower.length &&
      itemLower.length >= 4 &&
      cleanLower.startsWith(itemLower.slice(0, 4)) &&
      cleanLower.length - itemLower.length <= 3
    ) {
      return false;
    }
    return true;
  });

  return [cleanTerm, ...filtered].join(', ');
}

export function getYouTubeVideoId(post?: TrendItem | null): string | null {
  if (!post) return null;
  if ((post.source_platform === 'youtube' || post.target_platform === 'youtube') && post.video_id && post.video_id.length === 11) {
    return post.video_id;
  }
  const candidates = [post.video_id, post.source_url, post.embed_html, post.id];
  for (const value of candidates) {
    if (!value || typeof value !== 'string') continue;
    const match = value.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function getBestMediaUrl(post?: TrendItem | null): string | null {
  if (!post) return null;
  const videoId = getYouTubeVideoId(post);
  const ytThumb = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
  return post.thumbnail_url || ytThumb || post.video_url || post.full_image_url || null;
}

export function getClientPostKey(post?: TrendItem | null): string {
  if (!post) return '';
  if (post.video_id) return `yt_${post.video_id}`;
  const ytMatch = String(post.source_url || post.embed_html || '').match(/(?:shorts\/|v=|embed\/|youtu\.be\/)([\w-]{11})/i);
  if (ytMatch?.[1]) return `yt_${ytMatch[1]}`;
  const pinMatch = String(post.source_url || '').match(/pin\/(\d+)/i);
  if (pinMatch?.[1]) return `pin_${pinMatch[1]}`;
  const pxMatch = String(post.source_url || '').match(/video[s]?\/(\d+)/i);
  if (pxMatch?.[1]) return `px_${pxMatch[1]}`;
  if (post.source_url) {
    const cleanUrl = post.source_url.split('?')[0].replace(/\/+$/, '').toLowerCase();
    if (cleanUrl.length > 10) return cleanUrl;
  }
  if (post.title) {
    const cleanTitle = post.title.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanTitle.length > 6) {
      return `${post.source_platform || 'p'}_${cleanTitle.slice(0, 40)}`;
    }
  }
  return String(post.id || '');
}

export function dedupeClientPosts(posts?: TrendItem[]): TrendItem[] {
  if (!Array.isArray(posts)) return [];
  const seenIds = new Set<string>();
  const seenKeys = new Set<string>();
  const result: TrendItem[] = [];
  for (const post of posts) {
    if (!post) continue;
    const id = post.id ? String(post.id) : null;
    const cKey = getClientPostKey(post);
    if (id && seenIds.has(id)) continue;
    if (cKey && seenKeys.has(cKey)) continue;
    if (id) seenIds.add(id);
    if (cKey) seenKeys.add(cKey);
    result.push(post);
  }
  return result;
}
