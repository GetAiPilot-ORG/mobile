import * as Linking from "expo-linking";
import { supabase } from "./supabase";

type SsoClientId = "web" | "bio-builder" | "landing-templates" | "quick-forms";

interface SsoResponse {
  targetUrl: string;
}

export interface OpenExternalSsoOptions {
  clientId?: SsoClientId;
  templateId?: string;
  quickFormId?: string;
}

/** Opens the web app using the current Supabase session and a one-time code. */
export async function openExternalSSO({
  clientId = "web",
  templateId,
  quickFormId,
}: OpenExternalSsoOptions = {}): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Please log in to continue.");
  }

  const { data, error } = await supabase.functions.invoke<SsoResponse>(
    "web-handoff",
    {
      body: {
        action: "create",
        clientId,
        targetTool: clientId,
        ...(templateId ? { templateId } : {}),
        ...(quickFormId ? { quickFormId } : {}),
      },
    },
  );

  console.log("data========== ", data);
  console.log("error========= ", error);
  if (error || !data?.targetUrl) {
    const backendMessage = error instanceof Error ? error.message : null;
    throw new Error(
      backendMessage ?? "The secure web sign-in link could not be created.",
    );
  }

  await Linking.openURL(data.targetUrl);
}

/** Opens the full web application with a one-time Supabase SSO handoff. */
export async function openAuthenticatedWebApp(): Promise<void> {
  await openExternalSSO();
}

/**
 * Starts a browser builder with a one-time Supabase SSO handoff.
 */
export function openAuthenticatedTemplate(
  targetTool: "landing-templates" | "bio-builder",
  templateId: string,
): Promise<void>;
export function openAuthenticatedTemplate(options: {
  targetTool: "quick-forms";
  quickFormId?: string;
}): Promise<void>;
export async function openAuthenticatedTemplate(
  targetOrOptions:
    | "landing-templates"
    | "bio-builder"
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
  if (!normalizedTemplateId && targetOrOptions === "bio-builder") {
    throw new Error("A template must be selected before opening the editor.");
  }

  await openExternalSSO({
    clientId: targetOrOptions,
    templateId: normalizedTemplateId,
  });
}
