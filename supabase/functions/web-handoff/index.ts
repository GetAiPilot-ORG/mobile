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
  | string;

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

    default:
      return "/free-tools/dashboard";
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
   * Target URL: Uses /auth/handoff which securely consumes the code
   * and auto-establishes the Supabase session in the web browser.
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

  const { data, error } = await supabaseAdmin.rpc("consume_web_handoff_code", {
    input_code_hash: codeHash,
  });

  if (error || !data?.[0]) {
    return jsonResponse({ error: "Invalid, expired, or used SSO code." }, 401);
  }

  const handoff = data[0];
  const quickFormMatch = handoff.redirect_path.match(
    /^\/free-tools\/quick-forms\/builder\/([A-Za-z0-9_-]+)$/,
  );

  /*
   * Generate an authenticated Supabase Magic Link / OTP token
   * so the browser can immediately verify and establish the Supabase Auth session.
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

    if (!linkError && linkData?.properties) {
      tokenHash = linkData.properties.hashed_token ?? null;
      emailOtp = linkData.properties.email_otp ?? null;
      actionLink = linkData.properties.action_link ?? null;
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
    emailOtp,
    actionLink,

    clientId: handoff.client_id,
    targetTool: handoff.target_tool,

    templateId: handoff.template_id,
    quickFormId: quickFormMatch?.[1] ?? null,

    redirectPath: handoff.redirect_path,
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
