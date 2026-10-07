import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { JWTPayload } from '../types/index.js';

const supabase: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
);

// Whitelisted domains to prevent Open Redirect vulnerabilities
const ALLOWED_REDIRECT_DOMAINS = [
  'tg.getaipilot.in',
  'getaipilot.in',
  'app.getaipilot.in',
  't.me',
  'telegram.me',
  'telegram.org',
];

function isSafeUrl(targetUrl: string): boolean {
  try {
    const parsed = new URL(targetUrl);
    return ALLOWED_REDIRECT_DOMAINS.some(
      (domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

export async function redirectRoutes(fastify: FastifyInstance) {
  /**
   * 1. Public Shortlink / Tracker Redirect: /r/:slug
   */
  fastify.get('/r/:slug', async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as { slug?: string };
    const slug = params?.slug;
    if (!slug) {
      return reply.redirect('https://tg.getaipilot.in', 302);
    }

    try {
      const { data: link, error } = await supabase
        .from('tg_tracking_links')
        .select('id, destination_url, click_count, bot_id')
        .eq('slug', slug)
        .maybeSingle();

      if (error || !link || !link.destination_url) {
        // Check fallback in landing pages
        const { data: lp } = await supabase
          .from('tg_landing_pages')
          .select('id, slug')
          .eq('slug', slug)
          .maybeSingle();

        if (lp) {
          return reply.redirect(`https://tg.getaipilot.in/p/${lp.slug}`, 302);
        }

        return reply.redirect('https://tg.getaipilot.in', 302);
      }

      // Non-blocking analytics logging
      const userAgent = request.headers['user-agent'] || '';
      const ip = (request.headers['x-forwarded-for'] as string) || request.ip || '';

      supabase
        .from('tg_tracking_links')
        .update({
          click_count: (link.click_count || 0) + 1,
          last_clicked_at: new Date().toISOString(),
        })
        .eq('id', link.id)
        .then();

      // Log link click event asynchronously
      Promise.resolve(
        supabase.from('tg_link_clicks').insert({
          link_id: link.id,
          user_agent: userAgent,
          ip_address: typeof ip === 'string' ? ip.split(',')[0].trim() : '',
          created_at: new Date().toISOString(),
        })
      ).catch(() => {});

      return reply.redirect(link.destination_url, 302);
    } catch (err) {
      request.log.error(err, '[REDIRECT_TRACKER_ERROR]');
      return reply.redirect('https://tg.getaipilot.in', 302);
    }
  });

  /**
   * 2. Public Hosted Landing Page Redirect: /p/:slug or /sub/:slug
   */
  fastify.get('/p/:slug', async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as { slug?: string };
    const slug = params?.slug || '';
    return reply.redirect(`https://tg.getaipilot.in/p/${encodeURIComponent(slug)}`, 302);
  });

  fastify.get('/sub/:slug', async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as { slug?: string };
    const slug = params?.slug || '';
    return reply.redirect(`https://tg.getaipilot.in/p/${encodeURIComponent(slug)}`, 302);
  });

  /**
   * 3. Authenticated SSO Web Handoff Redirect: GET /mobile/v1/redirect/sso
   */
  fastify.get(
    '/mobile/v1/redirect/sso',
    { preHandler: [authenticateToken] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as JWTPayload;
      const query = (request.query || {}) as { destination?: string };
      const destination = query.destination || '/telesub';

      const handoffToken = fastify.jwt.sign(
        {
          userId: user.user_id,
          email: user.email,
          orgId: user.organization_id,
          purpose: 'sso_handoff',
        },
        { expiresIn: '60s' }
      );

      const targetWebUrl = `https://tg.getaipilot.in/auth/sso?token=${encodeURIComponent(
        handoffToken
      )}&redirect=${encodeURIComponent(destination)}`;

      return reply.send({
        url: targetWebUrl,
        destination,
        expiresIn: 60,
      });
    }
  );

  /**
   * 4. Safe External Redirect Proxy: GET /mobile/v1/redirect/external
   */
  fastify.get('/mobile/v1/redirect/external', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = (request.query || {}) as { url?: string };
    const url = query.url || '';
    if (!url || !isSafeUrl(url)) {
      return reply.status(400).send({ error: 'Invalid or unauthorized redirect URL' });
    }
    return reply.redirect(url, 302);
  });

  /**
   * 5. Payment Gateway Callback Deep Link Redirect: GET /mobile/v1/payment/callback
   */
  fastify.get('/mobile/v1/payment/callback', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = (request.query || {}) as {
      order_id?: string;
      status?: string;
      tx_id?: string;
      plan_id?: string;
    };
    const order_id = query.order_id || '';
    const status = query.status || 'success';
    const tx_id = query.tx_id || '';
    const plan_id = query.plan_id || '';
    const isSuccess = status.toLowerCase() === 'success' || status.toLowerCase() === 'paid';

    const deepLink = `getaipilot://sub-manager/status?orderId=${encodeURIComponent(
      order_id
    )}&status=${encodeURIComponent(status)}&txId=${encodeURIComponent(
      tx_id
    )}&planId=${encodeURIComponent(plan_id)}&success=${isSuccess}`;

    return reply.redirect(deepLink, 302);
  });
}
