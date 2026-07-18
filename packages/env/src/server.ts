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
    // Server-internal S3 API endpoint (used for any direct server-side ops).
    S3_ENDPOINT: z.url().default("http://localhost:9000"),
    // S3 API host the BROWSER uses to execute presigned uploads. Must be the
    // host that ends up in the signed URL (signing is offline, so this client
    // never connects). In dev this is the host-mapped MinIO port; in prod (R2)
    // it is the R2 S3 API endpoint and can differ from S3_PUBLIC_URL.
    S3_PUBLIC_ENDPOINT: z.url().default("http://localhost:9000"),
    S3_REGION: z.string().min(1).default("us-east-1"),
    S3_AVATARS_BUCKET: z.string().min(1).default("watch3r-avatars"),
    S3_COVERS_BUCKET: z.string().min(1).default("watch3r-covers"),
    S3_ACCESS_KEY_ID: z.string().min(1).default("minioadmin"),
    S3_SECRET_ACCESS_KEY: z.string().min(1).default("minioadmin"),
    // Public base URL used to build image src for reads (bucket appended).
    S3_PUBLIC_URL: z.url().default("http://localhost:9000/"),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
