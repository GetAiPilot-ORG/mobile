import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type TargetTool = "bio-builder" | "landing-templates" | "quick-forms";

interface RequestBody {
  action?: "create" | "consume";

  clientId?: TargetTool;
  targetTool?: TargetTool;

  templateId?: string;
  quickFormId?: string;

  code?: string;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const WEB_APP_URL = Deno.env.get("WEB_APP_URL") ?? "http://localhost:8080";

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
      if (quickFormId) {
        return `/free-tools/quick-forms/builder/${encodeURIComponent(
          quickFormId,
        )}`;
      }

      return "/free-tools/quick-forms/builder";
    }

    case "bio-builder": {
      if (templateId) {
        return `/tools/bio-builder/${encodeURIComponent(templateId)}`;
      }

      return "/tools/bio-builder";
    }

    case "landing-templates": {
      if (templateId) {
        return `/tools/landing-templates/${encodeURIComponent(templateId)}`;
      }

      return "/tools/landing-templates";
    }

    default:
      return "/";
  }
}

async function createHandoff(
  req: Request,
  body: RequestBody,
): Promise<Response> {
  const token = getBearerToken(req);

  if (!token) {
    return jsonResponse(
      {
        error: "Missing authorization token.",
      },
      401,
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAuth.auth.getUser(token);

  if (userError || !user) {
    console.error("[web-handoff] Authentication failed:", userError);

    return jsonResponse(
      {
        error: "Invalid or expired authentication session.",
      },
      401,
    );
  }

  const targetTool = body.targetTool ?? body.clientId;

  if (
    targetTool !== "bio-builder" &&
    targetTool !== "landing-templates" &&
    targetTool !== "quick-forms"
  ) {
    return jsonResponse(
      {
        error: "Unsupported target tool.",
      },
      400,
    );
  }

  const templateId =
    typeof body.templateId === "string" ? body.templateId.trim() : undefined;

  const quickFormId =
    typeof body.quickFormId === "string" ? body.quickFormId.trim() : undefined;

  /*
   * QUICK FORM
   *
   * Verify that the requested form actually belongs
   * to the currently authenticated user.
   */
  if (targetTool === "quick-forms" && quickFormId) {
    const { data: quickForm, error: quickFormError } = await supabaseAdmin
      .from("quick_forms")
      .select("id,user_id")
      .eq("id", quickFormId)
      .maybeSingle();

    if (quickFormError) {
      console.error("[web-handoff] Quick form lookup failed:", quickFormError);

      return jsonResponse(
        {
          error: "Unable to verify Quick Form.",
        },
        500,
      );
    }

    if (!quickForm) {
      return jsonResponse(
        {
          error: "Quick Form not found.",
        },
        404,
      );
    }

    if (quickForm.user_id !== user.id) {
      return jsonResponse(
        {
          error: "You do not have access to this Quick Form.",
        },
        403,
      );
    }
  }

  /*
   * BIO BUILDER
   *
   * A template ID is required.
   */
  if (targetTool === "bio-builder" && !templateId) {
    return jsonResponse(
      {
        error: "templateId is required for bio-builder.",
      },
      400,
    );
  }

  const redirectPath = buildRedirectPath(targetTool, templateId, quickFormId);

  /*
   * Generate a random one-time code.
   *
   * Only the SHA-256 hash is stored in the database.
   */
  const code = generateRandomCode();
  const codeHash = await sha256(code);

  /*
   * Handoff is valid for 2 minutes.
   */
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();

  const { error: insertError } = await supabaseAdmin
    .from("web_handoff_codes")
    .insert({
      code_hash: codeHash,
      user_id: user.id,
      email: user.email ?? "",
      organization_id: user.app_metadata?.organization_id ?? null,
      client_id: body.clientId ?? targetTool,
      target_tool: targetTool,
      template_id: templateId ?? null,
      redirect_path: redirectPath,
      expires_at: expiresAt,
    });

  if (insertError) {
    console.error("[web-handoff] Failed to create handoff:", insertError);

    return jsonResponse(
      {
        error: "Unable to create secure web handoff.",
      },
      500,
    );
  }

  /*
   * The code is returned to the mobile app.
   *
   * The access token is NEVER placed in the URL.
   */
  const targetUrl = new URL("/auth/handoff", WEB_APP_URL);
  targetUrl.searchParams.set("code", code);

  console.log("[web-handoff] Created handoff:", {
    userId: user.id,
    targetTool,
    quickFormId,
    templateId,
    redirectPath,
  });

  return jsonResponse({
    targetUrl: targetUrl.toString(),
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

  return jsonResponse({
    success: true,

    user: {
      id: handoff.user_id,
      email: handoff.email,
    },

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
