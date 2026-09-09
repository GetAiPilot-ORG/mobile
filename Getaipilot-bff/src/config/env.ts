import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  JWT_SECRET: z.string().default('getaipilot-super-secure-mobile-bff-jwt-secret-2026'),
  SUPABASE_URL: z.string().url().default('https://uklxlappjcuvdqjvecfh.supabase.co'),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  WHATSAPP_SERVICE_URL: z.string().default('https://whatsapp.getaipilot.in'),
  VOICE_SERVICE_URL: z.string().default('https://voice.getaipilot.in'),
  SOCIAL_SERVICE_URL: z.string().default('https://social.getaipilot.in'),
  TELEGRAM_SERVICE_URL: z.string().default('https://tg.getaipilot.in'),
  CRM_BASE_URL: z.string().default('https://getaipilot.online'),
  CRM_SUPABASE_URL: z.string().url().default('https://hhieilvvechtdhhfjomn.supabase.co'),
  CRM_SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  WEB_APP_URL: z.string().url().default('https://getaipilot.in'),
  WEBVIEW_AUTH_CODE_TTL_SECONDS: z.coerce.number().int().min(30).max(600).default(300),
});

export const env = envSchema.parse(process.env);
