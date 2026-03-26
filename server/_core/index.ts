import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

// ─── Rate limiters ────────────────────────────────────────────────────────────

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const llmLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 LLM/message calls per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Message rate limit exceeded. Please slow down." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 auth attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts, please try again later." },
});

const checkoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 checkout attempts per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many checkout attempts, please try again later." },
});

const voiceLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 voice transcription/synthesis calls per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Voice transcription rate limit exceeded." },
});

// ─── Port helpers ─────────────────────────────────────────────────────────────

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// ─── Server ───────────────────────────────────────────────────────────────────

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Security headers via helmet
  // X-Frame-Options and frame-ancestors are set to allow the Manus Management UI
  // preview iframe (*.manusvm.computer) while blocking all other framing.
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'", "https://api.stripe.com", "wss:", "ws:"],
        frameSrc: ["https://js.stripe.com", "https://hooks.stripe.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
        // Allow Manus Management UI preview iframes from *.manusvm.computer and *.manus.space
        frameAncestors: ["'self'", "https://*.manusvm.computer", "https://*.manus.space", "https://*.manus.im"],
      },
    },
    // Disable X-Frame-Options so CSP frame-ancestors takes full control
    // (X-Frame-Options only supports DENY/SAMEORIGIN, not wildcard domains)
    frameguard: false,
    crossOriginEmbedderPolicy: false, // Required for Vite HMR in dev
  }));

  // Apply general rate limiter to all API routes
  app.use("/api", generalLimiter);

  // Granular rate limiters for sensitive endpoints
  app.use("/api/oauth", authLimiter);

  // Stripe webhook (MUST be before express.json() to get raw body)
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const { handleStripeWebhook } = await import("../stripe-webhook");
      await handleStripeWebhook(req, res);
    }
  );

  // Body parser — 10mb covers base64-encoded voice audio (~7.5mb raw).
  // All file uploads go through S3 directly, so 10mb is sufficient.
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "2mb", extended: true }));

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // Granular tRPC rate limiters (applied before the tRPC middleware)
  app.use("/api/trpc/messages.send", llmLimiter);
  app.use("/api/trpc/voice.transcribe", voiceLimiter);
  app.use("/api/trpc/voice.synthesize", voiceLimiter);
  app.use("/api/trpc/subscription.createCheckoutSession", checkoutLimiter);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError({ error, type, path }) {
        // Log tRPC errors
        console.error('[tRPC Middleware Error]', {
          type,
          path,
          code: error.code,
          message: error.message,
          cause: error.cause,
        });
      },
    })
  );

  // Global error handler - ensures all errors return JSON for API routes
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Only handle errors for API routes
    if (req.path.startsWith('/api/')) {
      console.error('[Express Error Handler]', {
        path: req.path,
        method: req.method,
        error: err.message,
        stack: err.stack,
      });

      // Always return JSON for API routes
      res.status(err.status || 500).json({
        error: {
          message: err.message || 'Internal Server Error',
          code: err.code || 'INTERNAL_SERVER_ERROR',
          ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
          }),
        },
      });
    } else {
      // For non-API routes, pass to next handler
      next(err);
    }
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);

    // Initialize scheduled jobs (email digests)
    import("../scheduled-jobs").then(({ initializeScheduler }) => {
      initializeScheduler();
      console.log("[Scheduler] Email digest jobs initialized");
    }).catch(error => {
      console.error("[Scheduler] Failed to initialize:", error);
    });
  });
}

startServer().catch(console.error);
