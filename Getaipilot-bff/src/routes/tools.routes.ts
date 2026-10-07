import { createClient } from '@supabase/supabase-js';
import FormData from 'form-data';
import { FastifyInstance } from 'fastify';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { JWTPayload } from '../types/index.js';
import { env } from '../config/env.js';

const getSupabase = () =>
  createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY);

export async function toolsRoutes(fastify: FastifyInstance) {
  // POST /tools/transcribe - send base64 audio, get transcript + summary
  fastify.post('/tools/transcribe', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { audioBase64, language = 'en', mimeType = 'audio/m4a' } =
      request.body as { audioBase64: string; language?: string; mimeType?: string };

    if (!audioBase64) return reply.status(400).send({ message: 'audioBase64 is required' });

    const openaiKey = (env as any).OPENAI_API_KEY;
    if (!openaiKey) return reply.status(503).send({ message: 'OpenAI API key not configured' });

    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const form = new FormData();
    form.append('file', audioBuffer, {
      filename: 'recording.m4a',
      contentType: mimeType,
    });
    form.append('model', 'whisper-1');
    form.append('language', language);
    form.append('response_format', 'json');

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openaiKey}`, ...form.getHeaders() },
      body: form as any,
    });

    if (!whisperRes.ok) {
      const errBody = await whisperRes.text();
      fastify.log.error('[Whisper] Error: ' + errBody);
      return reply.status(502).send({ message: 'Transcription failed', detail: errBody });
    }

    const whisperData = (await whisperRes.json()) as { text: string };
    const transcript = whisperData.text?.trim() || '';

    let summaryBullets: string[] = [];
    try {
      const summaryRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Given a voice transcript, return 3-5 concise bullet point key takeaways as a JSON array of strings. Return only the JSON array.' },
            { role: 'user', content: transcript },
          ],
          max_tokens: 300,
          temperature: 0.3,
        }),
      });
      if (summaryRes.ok) {
        const sd = (await summaryRes.json()) as any;
        summaryBullets = JSON.parse(sd?.choices?.[0]?.message?.content || '[]');
      }
    } catch (_e) {
      fastify.log.warn('[Tools] Summary generation failed');
    }

    const supabase = getSupabase();
    const { data: saved, error: dbErr } = await supabase
      .from('speech_transcriptions')
      .insert({ organization_id: user.organization_id, user_id: user.user_id, transcript, summary_bullets: summaryBullets, language, created_at: new Date().toISOString() })
      .select().single();

    if (dbErr) fastify.log.warn('[Tools] DB insert failed: ' + dbErr.message);

    return reply.send({ id: saved?.id || null, transcript, summaryBullets, language, createdAt: saved?.created_at || new Date().toISOString() });
  });

  // GET /tools/transcriptions - fetch history (last 20)
  fastify.get('/tools/transcriptions', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('speech_transcriptions')
      .select('id, transcript, summary_bullets, language, duration_seconds, created_at')
      .eq('organization_id', user.organization_id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) { fastify.log.warn('[Tools] Fetch failed: ' + error.message); return reply.send([]); }
    return reply.send(data || []);
  });
}
