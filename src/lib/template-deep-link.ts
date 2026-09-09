import * as Linking from "expo-linking";
import { apiClient } from "../core/api/client";

type Builder = "bio-builder" | "landing-builder";

interface BuilderLinkResponse {
  targetUrl: string;
}

/**
 * Starts a browser builder with a one-time authenticated handoff. The mobile
 * session token stays in SecureStore; only an opaque, expiring code is put in
 * the URL by the BFF.
 */
export async function openAuthenticatedTemplate(
  builder: Builder,
  templateId: string,
): Promise<void> {
  const normalizedTemplateId = templateId.trim();
  if (!normalizedTemplateId) {
    throw new Error("A template must be selected before opening the editor.");
  }

  const response = await apiClient.post<BuilderLinkResponse>(
    "/mobile/v1/webview/session-token",
    { targetTool: builder, templateId: normalizedTemplateId },
  );

  if (
    !response ||
    typeof response.targetUrl !== "string" ||
    !response.targetUrl
  ) {
    throw new Error("The authenticated template link could not be created.");
  }

  await Linking.openURL(response.targetUrl);
}
