import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

    // Object storage (S3-compatible: MinIO in dev, Cloudflare R2 in prod)
    S3_ENDPOINT: z.url().default("http://localhost:9000"),
    S3_REGION: z.string().min(1).default("us-east-1"),
    S3_AVATARS_BUCKET: z.string().min(1).default("watch3r-avatars"),
    S3_COVERS_BUCKET: z.string().min(1).default("watch3r-covers"),
    S3_ACCESS_KEY_ID: z.string().min(1).default("minioadmin"),
    S3_SECRET_ACCESS_KEY: z.string().min(1).default("minioadmin"),
    // Public base URL used to build image src (bucket-scoped)
    S3_PUBLIC_URL: z.url().default("http://localhost:9000/watch3r-avatars"),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
