import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import authRouter from "../auth-simple";

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
