import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  PORT: z.coerce.number().int().positive().optional().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).optional().default("development"),
  CLIENT_URL: z.string().url().optional().default("http://localhost:5173"),
  UPLOAD_DIR: z.string().min(1).optional().default("./uploads"),
  APP_BASE_URL: z.string().url().optional(),
});

const rawPort = process.env.PORT;
const rawNodeEnv = process.env.NODE_ENV ?? "development";

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET ?? process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  PORT: rawPort,
  NODE_ENV: rawNodeEnv,
  CLIENT_URL: process.env.CLIENT_URL,
  UPLOAD_DIR: process.env.UPLOAD_DIR,
  APP_BASE_URL:
    process.env.APP_BASE_URL ??
    `http://localhost:${rawPort && Number(rawPort) > 0 ? rawPort : 4000}`,
});

if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
