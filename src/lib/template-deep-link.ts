import * as Linking from "expo-linking";
import { supabase } from "./supabase";

type Builder = "bio-builder" | "landing-templates";
type SsoClientId = "web" | "bio-builder" | "landing-templates";

interface SsoResponse {
  targetUrl: string;
}

export interface OpenExternalSsoOptions {
  clientId?: SsoClientId;
  templateId?: string;
}

/** Opens the web app using the current Supabase session and a one-time code. */
export async function openExternalSSO({
  clientId = "web",
  templateId,
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
      },
    },
  );
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
export async function openAuthenticatedTemplate(
  // builder: Builder,
  targetTool: "landing-templates" | "bio-builder",
  templateId: string,
): Promise<void> {
  const normalizedTemplateId = templateId.trim();
  if (!normalizedTemplateId && targetTool === "bio-builder") {
    throw new Error("A template must be selected before opening the editor.");
  }

  await openExternalSSO({
    clientId: targetTool,
    templateId: normalizedTemplateId,
  });
}
