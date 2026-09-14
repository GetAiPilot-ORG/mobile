import * as Linking from "expo-linking";
import { Platform } from "react-native";
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

/**
 * Returns the appropriate Web App Base URL:
 * - In local development (__DEV__ / localhost) -> http://localhost:8080
 * - In production -> https://getaipilot.in
 */
export function getWebAppBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_WEB_APP_URL) {
    return process.env.EXPO_PUBLIC_WEB_APP_URL.replace(/\/+$/, "");
  }

  if (typeof __DEV__ !== "undefined" && __DEV__) {
    // If running in browser or Expo dev
    if (
      Platform.OS === "web" &&
      typeof window !== "undefined" &&
      (window.location?.hostname === "localhost" ||
        window.location?.hostname === "127.0.0.1")
    ) {
      return "http://localhost:8080";
    }

    return "http://localhost:8080";
  }

  return "https://getaipilot.in";
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

  let token: string | null = null;
  try {
    token = await authStorage.getAccessToken();
  } catch {}

  // 1. If user is authenticated in the mobile app, request authentic SSO link from BFF
  if (token) {
    try {
      const response = await apiClient.post<{ success: boolean; ssoUrl: string }>(
        "/mobile/v1/auth/sso-url",
        {
          redirectPath,
          webAppUrl,
        },
      );

      if (response?.ssoUrl) {
        console.log("[openExternalSSO] Opening authentic BFF SSO URL:", response.ssoUrl);
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

  // 2. Fallback: Check if local Supabase client has a valid session
  try {
    const { data } = await supabase.auth.getSession();
    const session = data?.session;
    if (session?.access_token && session?.refresh_token) {
      const ssoUrl = `${webAppUrl}/auth/callback?next=${encodeURIComponent(
        redirectPath,
      )}#access_token=${encodeURIComponent(
        session.access_token,
      )}&refresh_token=${encodeURIComponent(session.refresh_token)}&token_type=bearer`;

      console.log("[openExternalSSO] Opening Supabase local session SSO URL");
      await Linking.openURL(ssoUrl);
      return;
    }
  } catch (supabaseErr) {
    console.warn("[openExternalSSO] Local Supabase session check failed:", supabaseErr);
  }

  // 3. Fallback for guest/unauthenticated users
  console.log("[openExternalSSO] Opening direct web URL (guest):", directFallbackUrl);
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
