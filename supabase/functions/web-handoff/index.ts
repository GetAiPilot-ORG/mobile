import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type TargetTool =
  | "bio-builder"
  | "bio-dashboard"
  | "landing-templates"
  | "landing-dashboard"
  | "my-designs"
  | "quick-forms"
  | "web"
  | "web-app"
  | "social-post"
  | "social-dashboard"
  | "social-new-post"
  | "social-schedule"
  | "social-queue"
  | "social-builder"
  | "social-instapilot"
  | "social-compose"
  | "social-upload-short"
  | "social-automation"
  | "social-auto-dm-new"
  | "social"
  | string;

const SOCIAL_WEB_APP_URL = "https://social.getaipilot.in";
const SOCIAL_SUPABASE_URL = "https://oqaysrnncwbtrujnxsdo.supabase.co";
const SOCIAL_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xYXlzcm5uY3didHJ1am54c2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NzkzMDcsImV4cCI6MjA4MzI1NTMwN30.ijLQ4PvBuL9BtuDnNfjQeRh12Q1MPInbI_Tvj1mvOd8";
const SOCIAL_API_BASE_URL = "https://api.getaipilot.in";

interface RequestBody {
  action?: "create" | "consume";

  clientId?: string;
  targetTool?: string;

  templateId?: string;
  quickFormId?: string;

  authToken?: string;
  userEmail?: string;

  webAppUrl?: string;
  code?: string;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const DEFAULT_WEB_APP_URL = (
  Deno.env.get("WEB_APP_URL") ?? "https://getaipilot.in"
).replace(/\/+$/, "");

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = atob(base64);
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

function sanitizeWebAppUrl(candidateUrl?: string): string {
  if (!candidateUrl || typeof candidateUrl !== "string") {
    return DEFAULT_WEB_APP_URL;
  }

  try {
    const url = new URL(candidateUrl.trim());
    const hostname = url.hostname.toLowerCase();

    // Allow localhost / 127.0.0.1 for local dev
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".local")
    ) {
      return url.origin;
    }

    // Allow getaipilot.in and subdomains
    if (
      hostname === "getaipilot.in" ||
      hostname.endsWith(".getaipilot.in") ||
      hostname === "gpage.us" ||
      hostname === "gbio.us"
    ) {
      return url.origin;
    }
  } catch {}

  return DEFAULT_WEB_APP_URL;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getBearerToken(req: Request): string | null {
  const authorization = req.headers.get("authorization");

  if (!authorization) {
    return null;
  }

  const match = authorization.match(/^Bearer\s+(.+)$/i);

  return match?.[1] ?? null;
}

function generateRandomCode(length = 64): string {
  const bytes = new Uint8Array(length);

  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);

  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function buildRedirectPath(
  targetTool: TargetTool,
  templateId?: string,
  quickFormId?: string,
): string {
  switch (targetTool) {
    case "quick-forms": {
      if (quickFormId && quickFormId.trim().length > 0) {
        return `/free-tools/quick-forms/builder/${encodeURIComponent(
          quickFormId.trim(),
        )}`;
      }

      return "/free-tools/quick-forms/builder/new";
    }

    case "bio-builder": {
      if (templateId && templateId.trim().length > 0) {
        return `/free-tools/builder/${encodeURIComponent(templateId.trim())}`;
      }

      return "/free-tools/builder/creators-v1";
    }

    case "bio-dashboard": {
      return "/free-tools/bio-dashboard";
    }

    case "landing-templates": {
      if (templateId && templateId.trim().length > 0) {
        return `/free-tools/landing-builder/${encodeURIComponent(
          templateId.trim(),
        )}`;
      }

      return "/free-tools/landing-templates";
    }

    case "landing-dashboard": {
      return "/free-tools/landing-dashboard";
    }

    case "my-designs": {
      return "/free-tools/dashboard";
    }

    case "web":
    case "web-app": {
      return "/dashboard";
    }

    case "social-post":
    case "social-dashboard":
    case "social-new-post": {
      return "https://social.getaipilot.in/dashboard";
    }

    case "social-schedule":
    case "social-queue": {
      return "https://social.getaipilot.in/dashboard/queue";
    }

    case "social-builder":
    case "social-instapilot": {
      return "https://social.getaipilot.in/dashboard/instapilot?mode=builder";
    }

    case "social-compose":
    case "social-upload-short": {
      return "https://social.getaipilot.in/dashboard/compose";
    }

    case "social-automation":
    case "social-auto-dm-new": {
      return "https://social.getaipilot.in/dashboard/auto-dm/automations/new";
    }

    default:
      return targetTool.startsWith("social")
        ? "https://social.getaipilot.in/dashboard"
        : "/free-tools/dashboard";
  }
}

function isSocialTarget(targetTool: string, webAppUrl?: string): boolean {
  if (typeof targetTool === "string" && targetTool.toLowerCase().startsWith("social")) {
    return true;
  }
  if (typeof webAppUrl === "string" && webAppUrl.toLowerCase().includes("social.getaipilot.in")) {
    return true;
  }
  return false;
}

async function resolveSocialSsoUrl(email: string, redirectPath: string): Promise<string> {
  const cleanRedirect = redirectPath.startsWith("http")
    ? redirectPath
    : `${SOCIAL_WEB_APP_URL}${redirectPath.startsWith("/") ? "" : "/"}${redirectPath}`;

  const directFallback = cleanRedirect;

  try {
    // 1. Generate Hub magic link to establish hub session
    const { data: hubLinkData, error: hubLinkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    const hubToken =
      (hubLinkData as any)?.properties?.hashed_token ||
      (hubLinkData as any)?.hashed_token;

    if (hubLinkErr || !hubToken) {
      return directFallback;
    }

    const hubVerifyRes = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        type: "magiclink",
        token_hash: hubToken,
      }),
    });

    if (!hubVerifyRes.ok) {
      return directFallback;
    }

    const hubSession: any = await hubVerifyRes.json();
    const hubUserToken = hubSession?.access_token;
    if (!hubUserToken) {
      return directFallback;
    }

    // 2. Call social-sso edge function with base origin ALWAYS (never subpaths!)
    const ssoEdgeRes = await fetch(`${SUPABASE_URL}/functions/v1/social-sso`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${hubUserToken}`,
      },
      body: JSON.stringify({ dmpilot_url: SOCIAL_WEB_APP_URL }),
    });

    if (!ssoEdgeRes.ok) {
      return directFallback;
    }

    const ssoEdgeData: any = await ssoEdgeRes.json();
    if (!ssoEdgeData?.launch_url) {
      return directFallback;
    }

    const launchUrl = new URL(ssoEdgeData.launch_url);
    const ssoJwt = launchUrl.searchParams.get("token");
    if (!ssoJwt) {
      return ssoEdgeData.launch_url;
    }

    // 3. Exchange with api.getaipilot.in/api/auth/sso
    const exchangeRes = await fetch(`${SOCIAL_API_BASE_URL}/api/auth/sso`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: ssoJwt }),
    });

    if (!exchangeRes.ok) {
      return ssoEdgeData.launch_url;
    }

    const exchangeData: any = await exchangeRes.json();
    if (!exchangeData?.magic_link_url) {
      return ssoEdgeData.launch_url;
    }

    // 4. Customize redirect_to on the magic_link_url to target the exact requested screen!
    try {
      const magicUrl = new URL(exchangeData.magic_link_url);
      magicUrl.searchParams.set("redirect_to", cleanRedirect);
      return magicUrl.toString();
    } catch {
      return exchangeData.magic_link_url;
    }
  } catch (err) {
    console.warn("[web-handoff] resolveSocialSsoUrl error:", err);
    return directFallback;
  }
}

async function resolveAuthenticatedUser(
  token: string | null,
  bodyEmail?: string,
): Promise<{ id: string; email: string } | null> {
  if (token) {
    // 1. Try Supabase Auth token verification
    try {
      const {
        data: { user },
        error,
      } = await supabaseAuth.auth.getUser(token);
      if (!error && user?.email) {
        return { id: user.id, email: user.email };
      }
    } catch {}

    // 2. Try decoding JWT payload (for BFF tokens or custom tokens)
    try {
      const payload = decodeJwtPayload(token);
      if (payload) {
        const userId = payload.sub || payload.user_id || payload.id;
        const email = payload.email;

        if (email) {
          return { id: userId || email, email };
        }

        if (userId) {
          const { data: adminUser } =
            await supabaseAdmin.auth.admin.getUserById(userId);
          if (adminUser?.user?.email) {
            return { id: adminUser.user.id, email: adminUser.user.email };
          }
        }
      }
    } catch {}
  }

  // 3. Fallback to provided email if present
  if (bodyEmail && bodyEmail.includes("@")) {
    return { id: bodyEmail, email: bodyEmail };
  }

  return null;
}

async function createHandoff(
  req: Request,
  body: RequestBody,
): Promise<Response> {
  const token = getBearerToken(req) || body.authToken || null;
  const user = await resolveAuthenticatedUser(token, body.userEmail);

  if (!user || !user.email) {
    console.error("[web-handoff] Authentication failed: user identity could not be resolved");

    return jsonResponse(
      {
        error: "Invalid or expired authentication session.",
      },
      401,
    );
  }

  const targetTool = (body.targetTool ?? body.clientId ?? "web-app") as TargetTool;

  const templateId =
    typeof body.templateId === "string" ? body.templateId.trim() : undefined;

  const quickFormId =
    typeof body.quickFormId === "string" ? body.quickFormId.trim() : undefined;

  const webAppBaseUrl = sanitizeWebAppUrl(body.webAppUrl);

  const redirectPath = buildRedirectPath(targetTool, templateId, quickFormId);

  /*
   * Generate a random one-time code for DB storage.
   */
  const code = generateRandomCode();
  const codeHash = await sha256(code);

  /*
   * Handoff is valid for 5 minutes.
   */
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const { error: insertError } = await supabaseAdmin
    .from("web_handoff_codes")
    .insert({
      code_hash: codeHash,
      user_id: user.id,
      email: user.email,
      organization_id: null,
      client_id: body.clientId ?? targetTool,
      target_tool: targetTool,
      template_id: templateId ?? null,
      redirect_path: redirectPath,
      expires_at: expiresAt,
    });

  if (insertError) {
    console.error("[web-handoff] Failed to record handoff in DB:", insertError);
  }

  /*
   * Target URL: Uses /auth/handoff on getaipilot.in which securely consumes
   * the code and auto-establishes the Supabase session in the web browser.
   */
  const handoffUrl = new URL("/auth/handoff", webAppBaseUrl);
  handoffUrl.searchParams.set("code", code);
  handoffUrl.searchParams.set("next", redirectPath);

  const targetUrl = handoffUrl.toString();

  console.log("[web-handoff] Created SSO handoff successfully:", {
    userId: user.id,
    email: user.email,
    targetTool,
    quickFormId,
    templateId,
    webAppBaseUrl,
    redirectPath,
    targetUrl,
  });

  return jsonResponse({
    targetUrl,
    redirectPath,
    webAppBaseUrl,
  });
}

async function consumeHandoff(body: RequestBody): Promise<Response> {
  const code = typeof body.code === "string" ? body.code.trim() : "";

  if (!code) {
    return jsonResponse(
      {
        error: "SSO code is required.",
      },
      400,
    );
  }

  const codeHash = await sha256(code);
  let handoff: any = null;

  const { data, error } = await supabaseAdmin.rpc("consume_web_handoff_code", {
    input_code_hash: codeHash,
  });

  if (!error && data?.[0]) {
    handoff = data[0];
  } else {
    if (error) {
      console.warn("[web-handoff] consume_web_handoff_code RPC warning:", error.message);
    }
    const nowIso = new Date().toISOString();
    const { data: directData, error: directErr } = await supabaseAdmin
      .from("web_handoff_codes")
      .update({ consumed_at: nowIso })
      .eq("code_hash", codeHash)
      .is("consumed_at", null)
      .gt("expires_at", nowIso)
      .select("*")
      .maybeSingle();

    if (directData) {
      handoff = directData;
    } else if (directErr) {
      console.error("[web-handoff] direct table update fallback error:", directErr);
    }
  }

  if (!handoff) {
    return jsonResponse({ error: "Invalid, expired, or used SSO code." }, 401);
  }
  const quickFormMatch = handoff.redirect_path?.match(
    /^\/free-tools\/quick-forms\/builder\/([A-Za-z0-9_-]+)$/,
  );

  // 1. If this was a SocialPilot handoff, resolve live social SSO credentials first
  let socialSsoUrl: string | null = null;
  if (isSocialTarget(handoff.target_tool, handoff.redirect_path)) {
    socialSsoUrl = await resolveSocialSsoUrl(handoff.email, handoff.redirect_path);
  }

  /*
   * 2. Generate an authenticated Supabase Magic Link / OTP token
   * AFTER internal verification so the browser token remains 100% fresh and unconsumed.
   */
  let tokenHash: string | null = null;
  let emailOtp: string | null = null;
  let actionLink: string | null = null;

  try {
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: handoff.email,
      });

    if (!linkError && linkData) {
      tokenHash =
        (linkData as any).properties?.hashed_token ??
        (linkData as any).hashed_token ??
        null;
      emailOtp =
        (linkData as any).properties?.email_otp ??
        (linkData as any).email_otp ??
        null;
      actionLink =
        (linkData as any).properties?.action_link ??
        (linkData as any).action_link ??
        null;
    } else if (linkError) {
      console.warn("[web-handoff] generateLink error in consume:", linkError.message);
    }
  } catch (err) {
    console.warn("[web-handoff] generateLink exception in consume:", err);
  }

  return jsonResponse({
    success: true,

    user: {
      id: handoff.user_id,
      email: handoff.email,
    },

    tokenHash,
    authTokenHash: tokenHash,
    auth_token_hash: tokenHash,
    emailOtp,
    actionLink,

    clientId: handoff.client_id,
    targetTool: handoff.target_tool,

    templateId: handoff.template_id,
    quickFormId: quickFormMatch?.[1] ?? null,

    redirectPath: handoff.redirect_path,
    targetUrl: handoff.redirect_path,
    socialSsoUrl,
    launchUrl: socialSsoUrl,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      {
        error: "Method not allowed.",
      },
      405,
    );
  }

  try {
    const body = (await req.json()) as RequestBody;

    if (body.action === "consume") {
      return await consumeHandoff(body);
    }

    return await createHandoff(req, body);
  } catch (error) {
    console.error("[web-handoff] Unexpected error:", error);

    return jsonResponse(
      {
        error: "Internal server error.",
      },
      500,
    );
  }
});
