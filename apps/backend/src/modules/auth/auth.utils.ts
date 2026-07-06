import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { env } from "../../config/env.js";
import type { JwtPayload } from "./auth.types.js";

const BCRYPT_ROUNDS = 12;
const TOKEN_BYTES = 32;
const RESET_TOKEN_BYTES = 48;
const VERIFY_TOKEN_BYTES = 32;
const VERIFY_TOKEN_EXPIRY_MS = 86_400_000;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signAccessToken(
  payload: Pick<JwtPayload, "sub" | "organizationId" | "role">,
  jti: string
): string {
  return jwt.sign(
    {
      sub: payload.sub,
      organizationId: payload.organizationId,
      role: payload.role,
      jti,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

export function signRefreshToken(jti: string): string {
  return jwt.sign({ jti, type: "refresh" }, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function parseTokenExpiration(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 900;

  const value = Number.parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 3600 * 1000;
    case "d":
      return value * 86400 * 1000;
    default:
      return 900000;
  }
}

export function generateTokenId(): string {
  return crypto.randomUUID();
}

export function getVerificationTokenExpiresAt(): Date {
  return new Date(Date.now() + VERIFY_TOKEN_EXPIRY_MS);
}

export function generateResetToken(): string {
  return crypto.randomBytes(RESET_TOKEN_BYTES).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateVerificationToken(): string {
  return crypto.randomBytes(VERIFY_TOKEN_BYTES).toString("hex");
}

export function getAccessTokenExpiresAt(): Date {
  return new Date(
    Date.now() + parseTokenExpiration(env.JWT_EXPIRES_IN)
  );
}

export function getRefreshTokenExpiresAt(): Date {
  return new Date(
    Date.now() + parseTokenExpiration(env.JWT_REFRESH_EXPIRES_IN)
  );
}
