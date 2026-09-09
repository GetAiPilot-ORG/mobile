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
  VOICE_SUPABASE_URL: z.string().url().default('https://gkyilicraflkgcfgqypc.supabase.co'),
  VOICE_SUPABASE_SERVICE_ROLE_KEY: z.string().default('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdreWlsaWNyYWZsa2djZmdxeXBjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjA4Mzc0NiwiZXhwIjoyMTAxNjU5NzQ2fQ.DYf3RkJp3F8WFPNio6XiUVCYv2Fc7WztfKeLwI4N3eI'),
  SOCIAL_SUPABASE_URL: z.string().url().default('https://oqaysrnncwbtrujnxsdo.supabase.co'),
  SOCIAL_SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
