import { FastifyInstance } from "fastify";
import { z } from "zod";
import { HubAdapter } from "../adapters/hub.adapter.js";
import { env } from "../config/env.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  WebviewAuthCodeService,
  WebviewTool,
} from "../services/webview-auth-code.service.js";
import { JWTPayload } from "../types/index.js";

const targetToolSchema = z.enum([
  "landing-builder",
  "bio-builder",
  "flow-builder",
  "workflow-builder",
]);
const createSessionSchema = z.object({
  targetTool: targetToolSchema,
  // A submission ID for saved bios, or a catalog template ID for landings.
  templateId: z.string().trim().min(1).max(160).optional(),
});
const exchangeSessionSchema = z.object({
  authCode: z.string().trim().min(1).max(512),
});
const builderWebPaths = {
  "landing-builder": "/free-tools/landing-templates",
  "bio-builder": "/free-tools/bio-templates",
  "flow-builder": "/tools/flow-builder",
  "workflow-builder": "/tools/workflow-builder",
} as const;

function invalidPayload(reply: any) {
  return reply.status(400).send({
    statusCode: 400,
    error: "BadRequest",
    message: "Invalid builder session payload",
  });
}

export async function webviewRoutes(fastify: FastifyInstance) {
  /**
   * Creates an authenticated deep link for a builder. `auth_code` is opaque,
   * expires quickly, and can be exchanged only once by the web builder.
   */
  fastify.post(
    "/webview/session-token",
    { preHandler: [authenticateToken] },
    async (request, reply) => {
      const user = request.user as JWTPayload;
      const parsedBody = createSessionSchema.safeParse(request.body);
      if (!parsedBody.success) return invalidPayload(reply);
      const body = parsedBody.data;
      if (body.targetTool === "bio-builder" && body.templateId) {
        const ownsTemplate = await HubAdapter.userOwnsBioTemplate(
          user.user_id,
          body.templateId,
        );
        if (!ownsTemplate) {
          return reply.status(404).send({
            statusCode: 404,
            error: "NotFound",
            message: "Bio template not found",
          });
        }
      }

      const authCode = WebviewAuthCodeService.create(
        {
          userId: user.user_id,
          email: user.email,
          organizationId: user.organization_id,
          tool: body.targetTool,
          templateId: body.templateId,
        },
        env.WEBVIEW_AUTH_CODE_TTL_SECONDS,
      );

      const targetUrl = new URL(
        builderWebPaths[body.targetTool],
        env.WEB_APP_URL,
      );
      targetUrl.searchParams.set("auth_code", authCode);
      if (body.templateId) {
        targetUrl.searchParams.set("template_id", body.templateId);
      }

      return reply.header("Cache-Control", "no-store").send({
        targetUrl: targetUrl.toString(),
        expiresInSeconds: env.WEBVIEW_AUTH_CODE_TTL_SECONDS,
      });
    },
  );

  /**
   * Called by getaipilot.in when it receives an `auth_code` from a mobile deep
   * link. The web client must POST the code, then immediately remove it from
   * the address bar with history.replaceState().
   */
  fastify.post("/webview/session-token/exchange", async (request, reply) => {
    const parsedBody = exchangeSessionSchema.safeParse(request.body);
    if (!parsedBody.success) return invalidPayload(reply);
    const { authCode } = parsedBody.data;
    const session = WebviewAuthCodeService.consume(authCode);

    if (!session) {
      return reply.status(401).send({
        statusCode: 401,
        error: "Unauthorized",
        message:
          "This builder link is invalid, expired, or has already been used.",
      });
    }

    const toolSessionToken = fastify.jwt.sign(
      {
        user_id: session.userId,
        email: session.email,
        organization_id: session.organizationId,
        tool: session.tool,
        template_id: session.templateId,
        type: "webview_session",
      },
      { expiresIn: `${env.WEBVIEW_AUTH_CODE_TTL_SECONDS}s` },
    );

    return reply.header("Cache-Control", "no-store").send({
      toolSessionToken,
      targetTool: session.tool as WebviewTool,
      templateId: session.templateId,
      expiresInSeconds: env.WEBVIEW_AUTH_CODE_TTL_SECONDS,
    });
  });
}
