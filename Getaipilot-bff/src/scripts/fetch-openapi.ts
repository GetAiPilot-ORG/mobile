import { env } from '../config/env.js';

async function fetchOpenApi() {
  const upstreamUrl = env.TELEGRAM_SERVICE_URL || 'https://tg.getaipilot.in';
  const urls = ['/openapi.json', '/docs', '/redoc', '/api/docs', '/api/v1/openapi.json'];

  for (const u of urls) {
    try {
      const res = await fetch(`${upstreamUrl.replace(/\/$/, '')}${u}`);
      console.log(`URL ${u} -> Status: ${res.status}`);
      if (res.status === 200) {
        const text = await res.text();
        if (u.endsWith('.json')) {
          const spec = JSON.parse(text);
          console.log('--- OPENAPI PATHS ---');
          console.log(Object.keys(spec.paths || {}));
        } else {
          console.log(`Preview: ${text.substring(0, 200)}`);
        }
      }
    } catch (e: any) {
      console.log(`URL ${u} -> Error: ${e.message}`);
    }
  }
}

fetchOpenApi();
