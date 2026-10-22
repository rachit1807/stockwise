import "dotenv/config";
import { randomBytes } from "node:crypto";
export function config(overrides = {}) {
  const production = process.env.NODE_ENV === "production";
  const secret =
    process.env.JWT_SECRET ||
    (production ? "" : randomBytes(48).toString("hex"));
  if (secret.length < 32)
    throw new Error("JWT_SECRET must contain at least 32 characters.");
  if (production && !process.env.DATABASE_URL && !process.env.SQLITE_PATH)
    throw new Error(
      "Configure DATABASE_URL or a persistent SQLITE_PATH in production.",
    );
  return {
    secret,
    expiresIn: process.env.JWT_EXPIRES_IN || "2h",
    issuer: "stockwise",
    audience: "stockwise-api",
    production,
    ...overrides,
  };
}
