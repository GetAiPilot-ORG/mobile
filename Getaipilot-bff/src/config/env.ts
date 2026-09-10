import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  JWT_SECRET: z.string(),

  // Supabase Production Identity Hub
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Live Product Service Endpoints
  SOCIAL_SERVICE_URL: z.string().url(),
  VOICE_SERVICE_URL: z.string().url(),
  WHATSAPP_SERVICE_URL: z.string().url(),
  TELEGRAM_SERVICE_URL: z.string().url(),
  CRM_BASE_URL: z.string().url(),

  // Service Databases & Token Bridges
  CRM_SUPABASE_URL: z.string().url().default('https://hhieilvvechtdhhfjomn.supabase.co'),
  CRM_SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  VOICE_SUPABASE_URL: z.string().url().default('https://gkyilicraflkgcfgqypc.supabase.co'),
  VOICE_SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SOCIAL_SUPABASE_URL: z.string().url().default('https://oqaysrnncwbtrujnxsdo.supabase.co'),
  SOCIAL_SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  TOKEN_ENCRYPTION_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);


