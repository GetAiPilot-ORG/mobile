import { env } from '../config/env.js';

async function printOpenApiDetails() {
  const upstreamUrl = env.TELEGRAM_SERVICE_URL || 'https://tg.getaipilot.in';
  const res = await fetch(`${upstreamUrl.replace(/\/$/, '')}/openapi.json`);
  const spec: any = await res.json();

  console.log('=== TELEGRAM SERVICE OPENAPI SPEC ===');
  for (const [path, methods] of Object.entries(spec.paths)) {
    console.log(`\n--- PATH: ${path} ---`);
    for (const [method, details] of Object.entries(methods as Record<string, any>)) {
      const d = details as any;
      console.log(`  [${method.toUpperCase()}] summary: ${d.summary || d.description || ''}`);
      if (d.parameters) {
        console.log(`    Parameters:`, JSON.stringify(d.parameters));
      }
      if (d.requestBody) {
        console.log(`    RequestBody:`, JSON.stringify(d.requestBody));
      }
      if (d.responses) {
        console.log(`    Responses:`, Object.keys(d.responses));
      }
    }
  }
}

printOpenApiDetails();
