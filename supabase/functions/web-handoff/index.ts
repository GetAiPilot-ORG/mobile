import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin, Access-Control-Request-Headers",
};

const HANDOFF_TTL_SECONDS = 300;
const targetTools = new Set([
  "web-app",
  "landing-builder",
  "bio-builder",
  "flow-builder",
  "workflow-builder",
]);
const clients = new Map([
  [
    "web",
    new Set([
      "/",
      "/dashboard",
      "/free-tools/bio-templates",
      "/free-tools/landing-templates",
    ]),
  ],
  ["bio-builder", new Set(["/free-tools/bio-templates"])],
  ["landing-builder", new Set(["/free-tools/landing-templates"])],
]);

function isAllowedRedirect(clientId: string, redirectPath: string) {
  if (clientId === "bio-builder") {
    return /^\/free-tools\/builder\/[A-Za-z0-9_-]+$/.test(redirectPath);
  }

  return clients.get(clientId)?.has(redirectPath) === true;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getBearerToken(request: Request) {
  const value = request.headers.get("Authorization") ?? "";
  return value.startsWith("Bearer ") ? value.slice(7).trim() : null;
}

async function hashCode(code: string) {
  const bytes = new TextEncoder().encode(code);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST")
    return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const webAppUrl = Deno.env.get("WEB_APP_URL") || "https://getaipilot.com";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "Function is not configured" }, 500);
  }

  const body = (await request.json().catch(() => null)) as {
    action?: "create" | "consume" | "exchange";
    targetTool?: string;
    clientId?: string;
    templateId?: string;
    authCode?: string;
  } | null;

  if (!body?.action) return json({ error: "action is required" }, 400);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (body.action === "create") {
    const accessToken = getBearerToken(request);
    if (!accessToken) return json({ error: "Missing bearer token" }, 401);
    if (!body.targetTool || !targetTools.has(body.targetTool)) {
      return json({ error: "Invalid target tool" }, 400);
    }
    const clientId = body.clientId || "web";
    if (clientId !== "web" && clientId !== body.targetTool) {
      return json({ error: "Client and target tool do not match" }, 400);
    }

    const redirectPath =
      body.targetTool === "bio-builder"
        ? `/free-tools/builder/${encodeURIComponent(body.templateId?.trim() || "creators-v1")}`
        : body.targetTool === "landing-builder"
          ? "/free-tools/landing-templates"
          : "/";
    if (!isAllowedRedirect(clientId, redirectPath)) {
      return json({ error: "Invalid client or redirect path" }, 400);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data: authData, error: authError } =
      await userClient.auth.getUser();
    if (authError || !authData.user)
      return json({ error: "Invalid access token" }, 401);

    const templateId = body.templateId?.trim() || undefined;
    const code =
      crypto.randomUUID().replaceAll("-", "") +
      crypto.randomUUID().replaceAll("-", "");
    const codeHash = await hashCode(code);
    const expiresAt = new Date(
      Date.now() + HANDOFF_TTL_SECONDS * 1000,
    ).toISOString();

    const { error: insertError } = await admin
      .from("web_handoff_codes")
      .insert({
        code_hash: codeHash,
        user_id: authData.user.id,
        email: authData.user.email || "",
        organization_id: authData.user.app_metadata?.organization_id || null,
        target_tool: body.targetTool,
        client_id: clientId,
        redirect_path: redirectPath,
        template_id: templateId,
        expires_at: expiresAt,
      });
    if (insertError)
      return json({ error: "Could not create handoff code" }, 500);

    const targetUrl = new URL("/auth/handoff", webAppUrl);
    targetUrl.searchParams.set("code", code);

    return json({
      targetUrl: targetUrl.toString(),
      expiresInSeconds: HANDOFF_TTL_SECONDS,
    });
  }

  if (body.action === "consume" || body.action === "exchange") {
    if (!body.authCode?.trim())
      return json({ error: "authCode is required" }, 400);
    const codeHash = await hashCode(body.authCode.trim());
    const { data, error } = await admin.rpc("consume_web_handoff_code", {
      input_code_hash: codeHash,
    });
    if (error || !data?.[0]) {
      return json(
        { error: "Invalid, expired, or already used handoff code" },
        401,
      );
    }

    const sessionUser = data[0];
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email: sessionUser.email,
        options: { redirectTo: `${webAppUrl}${sessionUser.redirect_path}` },
      });
    const tokenHash = linkData?.properties?.hashed_token;
    if (linkError || !tokenHash) {
      return json({ error: "Could not create web session" }, 500);
    }

    return json({
      tokenHash,
      verificationType: "magiclink",
      redirectPath: sessionUser.redirect_path,
      clientId: sessionUser.client_id,
      expiresInSeconds: HANDOFF_TTL_SECONDS,
    });
  }

  return json({ error: "Invalid action" }, 400);
});
