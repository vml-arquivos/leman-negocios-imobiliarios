import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import authRouter from "../auth-simple";
import * as db from "../db";
import { computeLeadScore } from "../crm/score";

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Health check endpoint for Google Cloud Load Balancer
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // Simple Auth API
  app.use("/api/auth", authRouter);

  // ─── N8N / WhatsApp Webhook ────────────────────────────────────────────────
  app.post("/api/webhooks/n8n/whatsapp", async (req, res) => {
    // Auth por token (header ou query param)
    const token =
      req.header("x-webhook-token") || (req.query.token as string | undefined);
    if (process.env.N8N_WEBHOOK_TOKEN && token !== process.env.N8N_WEBHOOK_TOKEN) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
    try {
      const body = req.body || {};

      // Normalizar telefone: manter só dígitos, garantir DDI 55
      const rawPhone: string = String(body.phone || body.telefone || "");
      const digits = rawPhone.replace(/\D/g, "");
      const phone =
        digits.startsWith("55")
          ? `+${digits}`
          : digits.length >= 10
          ? `+55${digits}`
          : `+${digits}`;

      if (!phone || phone.length < 8) {
        return res.status(400).json({ ok: false, error: "phone obrigatório" });
      }

      const content: string = String(
        body.content || body.message || body.text || ""
      );
      const direction: string = body.direction || "incoming";
      const messageId: string = body.messageId || body.message_id || "";
      const timestamp = body.timestamp
        ? new Date(
            typeof body.timestamp === "number"
              ? body.timestamp * 1000
              : body.timestamp
          )
        : new Date();

      // 1) Persistir no message_buffer
      const bufferEntry = await db.createMessageBuffer({
        phone,
        message: content,
        messageId,
        type: direction,
        timestamp,
        processed: 0,
      });

      // 2) Webhook log
      await db.createWebhookLog({
        source: "n8n",
        event_type: "whatsapp_message",
        payload: JSON.stringify(body),
        response: JSON.stringify({ ok: true }),
        status: "success",
      });

      // 3) Upsert lead por telefone
      const name: string =
        body.name || body.pushName || body.contact_name || "Lead WhatsApp";
      const lead = await db.upsertLeadFromWhatsApp({
        phone,
        telefone: phone,
        name,
        email: body.email,
        message: content,
        origem: "whatsapp",
        stage: "novo",
      });

      // 4) Lead Scoring
      if (lead?.id) {
        const { score, priority, reasons } = computeLeadScore(lead, content);
        await db.updateLead(lead.id, {
          score,
          metadata: { ...(lead.metadata || {}), priority, scoreReasons: reasons },
        });
        lead.score = score;
        lead.metadata = { ...(lead.metadata || {}), priority };
      }

      console.log(
        `[N8N Webhook] phone=${phone} lead=${lead?.id} score=${lead?.score} buffer=${bufferEntry?.id}`
      );
      return res.json({ ok: true, leadId: lead?.id, bufferId: bufferEntry?.id, score: lead?.score });
    } catch (err: any) {
      console.error("[N8N Webhook] Error:", err);
      return res
        .status(500)
        .json({ ok: false, error: err?.message || "Internal error" });
    }
  });

  // Client-side error ingest endpoint (ErrorBoundary)
  app.post("/api/client-errors", (req, res) => {
    const token =
      req.header("x-client-error-token") ||
      (req.query.token as string | undefined);
    if (
      process.env.CLIENT_ERROR_TOKEN &&
      token !== process.env.CLIENT_ERROR_TOKEN
    ) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
    // Log estruturado para facilitar grep em produção
    console.log("[ClientErrorIngest]", JSON.stringify(req.body));
    return res.json({ ok: true });
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Development mode uses Vite with dynamic import, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    // Dynamic import to avoid loading Vite in production bundle
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    // Dynamic import for production static file serving
    const { serveStatic } = await import("./vite");
    serveStatic(app);
  }

  // Use PORT from environment variable, bind to 0.0.0.0 for external access
  const port = Number(process.env.PORT) || 5000;

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
    console.log(`Health check available at http://0.0.0.0:${port}/health`);
  });
}

startServer().catch(console.error);
