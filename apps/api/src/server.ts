import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { uploadsRoot } from "./config/storage";
import authRoutes from "./routes/auth.routes";
import meRoutes from "./routes/me.routes";
import jobsRoutes from "./routes/jobs.routes";
import applicationsRoutes from "./routes/applications.routes";
import adminRoutes from "./routes/admin.routes";
import companyRoutes from "./routes/company.routes";
import companiesRoutes from "./routes/companies.routes";
import messageRoutes from "./routes/message.routes";
import notificationRoutes from "./routes/notification.routes";
import profileStrengthRoutes from "./routes/profileStrength.routes";

const app = express();
const allowedOrigins = new Set(
  [
    "http://localhost:5173",
    "https://bright-gumdrop-4fe1c0.netlify.app",
    env.CLIENT_URL,
    env.FRONTEND_URL,
  ].filter((value): value is string => Boolean(value))
);

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const isConfiguredClient = allowedOrigins.has(origin);
      const isVercelPreview = /^https:\/\/.+\.vercel\.app$/i.test(origin);

      if (isConfiguredClient || isVercelPreview) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(
  "/uploads",
  express.static(uploadsRoot, {
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);
app.use("/auth", authRoutes);
app.use("/me", meRoutes);
app.use("/me", profileStrengthRoutes);
app.use("/jobs", jobsRoutes);
app.use("/admin", adminRoutes);
app.use("/company", companyRoutes);
app.use("/companies", companiesRoutes);
app.use("/messages", messageRoutes);
app.use("/notifications", notificationRoutes);
app.use("/", applicationsRoutes);
app.get("/health", (_req, res) => {
  return res.json({
    status: "ok",
    environment: env.NODE_ENV,
    time: new Date().toISOString(),
  });
});

app.use((_req, res) => {
  return res.status(404).json({ message: "Route not found" });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  return res.status(500).json({ message: "Internal server error" });
});

const port = env.PORT;

async function start() {
  try {
    await prisma.$connect();
    console.log("Connected to database");

    app.listen(port, () => {
      console.log(`Tifawin API running on ${env.APP_BASE_URL}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

start();
