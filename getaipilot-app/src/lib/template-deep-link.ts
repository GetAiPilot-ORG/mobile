import * as Linking from "expo-linking";
import { Alert } from "react-native";
import { apiClient } from "../core/api/client";
import { authStorage } from "../core/storage/authStorage";
import { useAuthStore } from "../core/store/authStore";
import { supabase } from "./supabase";

export type SsoClientId =
  | "web"
  | "bio-builder"
  | "bio-dashboard"
  | "landing-templates"
  | "landing-dashboard"
  | "my-designs"
  | "quick-forms";

interface SsoResponse {
  targetUrl: string;
  redirectPath?: string;
  webAppBaseUrl?: string;
}

export interface OpenExternalSsoOptions {
  clientId?: SsoClientId;
  templateId?: string;
  quickFormId?: string;
}

const PRODUCTION_WEB_APP_URL = "https://getaipilot.in";

const isLoopbackUrl = (value: string): boolean =>
  /^https?:\/\/(?:localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0|\[::1\])(?::\d+)?(?:\/|$)/i.test(
    value.trim(),
  );

/** Returns a public web-app origin suitable for external mobile handoffs. */
export function getWebAppBaseUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_WEB_APP_URL?.trim();
  if (configuredUrl && /^https?:\/\//i.test(configuredUrl) && !isLoopbackUrl(configuredUrl)) {
    return configuredUrl.replace(/\/+$/, "");
  }

  return PRODUCTION_WEB_APP_URL;
}

/**
 * Constructs the direct web redirect path for a given target tool.
 */
export function buildRedirectPath(
  clientId?: SsoClientId,
  templateId?: string,
  quickFormId?: string,
): string {
  switch (clientId) {
    case "quick-forms":
      return quickFormId && quickFormId !== "new"
        ? `/free-tools/quick-forms/builder/${encodeURIComponent(quickFormId)}`
        : `/free-tools/quick-forms/builder/new`;

    case "bio-builder":
      return `/free-tools/builder/${encodeURIComponent(templateId || "creators-v1")}`;

    case "bio-dashboard":
      return `/free-tools/bio-dashboard`;

    case "landing-templates":
      return templateId && templateId.trim().length > 0
        ? `/free-tools/landing-builder/${encodeURIComponent(templateId.trim())}`
        : `/free-tools/landing-templates`;

    case "landing-dashboard":
      return `/free-tools/landing-dashboard`;

    case "my-designs":
      return `/free-tools/dashboard`;

    case "web":
      return `/dashboard`;

    default:
      return `/free-tools/dashboard`;
  }
}

/**
 * Constructs the fallback direct web URL for unauthenticated users or offline dev.
 */
export function buildDirectWebUrl(
  webAppUrl: string,
  clientId?: SsoClientId,
  templateId?: string,
  quickFormId?: string,
): string {
  const base = webAppUrl.replace(/\/+$/, "");
  const path = buildRedirectPath(clientId, templateId, quickFormId);
  return `${base}${path}`;
}

/** Opens the web app using the current session (with SSO) or direct web URL. */
export async function openExternalSSO({
  clientId = "web",
  templateId,
  quickFormId,
}: OpenExternalSsoOptions = {}): Promise<void> {
  const webAppUrl = getWebAppBaseUrl();
  const redirectPath = buildRedirectPath(clientId, templateId, quickFormId);
  const directFallbackUrl = `${webAppUrl}${redirectPath}`;

  const [storedToken, supabaseSessionResult] = await Promise.all([
    authStorage.getAccessToken().catch(() => null),
    supabase.auth.getSession().catch(() => ({ data: { session: null } })),
  ]);
  const supabaseSession = supabaseSessionResult.data.session;
  const supabaseToken = supabaseSession?.access_token || null;
  const userEmail =
    supabaseSession?.user?.email || useAuthStore.getState().user?.email || undefined;

  // 1. Preferred flow: exchange the current app session for a short-lived,
  // one-time handoff code. The web app consumes the code and creates its own
  // browser session without exposing access tokens in the URL.
  if (supabaseToken) {
    try {
      const { data, error } = await supabase.functions.invoke<{
        targetUrl?: string;
      }>("web-handoff", {
        headers: { Authorization: `Bearer ${supabaseToken}` },
        body: {
          action: "create",
          targetTool: clientId,
          clientId,
          templateId,
          quickFormId,
          webAppUrl,
          userEmail,
        },
      });

      if (!error && data?.targetUrl && !isLoopbackUrl(data.targetUrl)) {
        await Linking.openURL(data.targetUrl);
        return;
      }
    } catch {}
  }

  // 2. Request an authenticated callback or magic link from the BFF.
  if (storedToken) {
    try {
      const response = await apiClient.post<{ success: boolean; ssoUrl: string }>(
        "/mobile/v1/auth/sso-url",
        {
          redirectPath,
          webAppUrl,
        },
      );

      if (response?.ssoUrl && !isLoopbackUrl(response.ssoUrl)) {
        await Linking.openURL(response.ssoUrl);
        return;
      }
    } catch (bffErr) {
      console.warn(
        "[openExternalSSO] BFF SSO generation failed, checking local supabase session:",
        bffErr,
      );
    }
  }

  // 3. Compatibility fallback for deployments that have not enabled the
  // one-time handoff endpoint yet. Only Supabase tokens are valid here.
  try {
    if (supabaseToken) {
      const ssoUrl = `${webAppUrl}/auth/callback?next=${encodeURIComponent(
        redirectPath,
      )}#access_token=${encodeURIComponent(
        supabaseToken,
      )}&refresh_token=${encodeURIComponent(
        supabaseSession?.refresh_token || "",
      )}&token_type=bearer`;

      await Linking.openURL(ssoUrl);
      return;
    }
  } catch (tokenErr) {
    console.warn("[openExternalSSO] Local session check failed:", tokenErr);
  }

  // An authenticated app session should never degrade into a logged-out web
  // page. Keep the user in the app and provide a clear recovery action.
  if (useAuthStore.getState().isAuthenticated) {
    Alert.alert(
      "Could not sign in to the web tool",
      "Please check your connection and try again. If this continues, sign out and sign back in to refresh your session.",
    );
    return;
  }

  // 4. Guest fallback. This opens the requested tool without a session.
  await Linking.openURL(directFallbackUrl);
}

/** Opens the full web application dashboard with a one-time Supabase SSO handoff. */
export async function openAuthenticatedWebApp(): Promise<void> {
  await openExternalSSO({ clientId: "web" });
}

/** Opens specific web dashboards (Bio, Landing, or My Designs) with seamless SSO. */
export async function openAuthenticatedDashboard(
  target: "bio-dashboard" | "landing-dashboard" | "my-designs" = "my-designs",
): Promise<void> {
  await openExternalSSO({ clientId: target });
}

/**
 * Starts a browser builder or template editor with a one-time Supabase SSO handoff.
 */
export function openAuthenticatedTemplate(
  targetTool:
    | "landing-templates"
    | "bio-builder"
    | "bio-dashboard"
    | "landing-dashboard"
    | "my-designs",
  templateId?: string,
): Promise<void>;
export function openAuthenticatedTemplate(options: {
  targetTool: "quick-forms";
  quickFormId?: string;
}): Promise<void>;
export async function openAuthenticatedTemplate(
  targetOrOptions:
    | "landing-templates"
    | "bio-builder"
    | "bio-dashboard"
    | "landing-dashboard"
    | "my-designs"
    | { targetTool: "quick-forms"; quickFormId?: string },
  templateId?: string,
): Promise<void> {
  if (typeof targetOrOptions === "object") {
    const quickFormId = targetOrOptions.quickFormId?.trim();

    await openExternalSSO({
      clientId: "quick-forms",
      ...(quickFormId ? { quickFormId } : {}),
    });
    return;
  }

  const normalizedTemplateId = templateId?.trim() ?? "";
  const finalTemplateId =
    !normalizedTemplateId && targetOrOptions === "bio-builder"
      ? "creators-v1"
      : normalizedTemplateId;

  await openExternalSSO({
    clientId: targetOrOptions,
    ...(finalTemplateId ? { templateId: finalTemplateId } : {}),
  });
}
