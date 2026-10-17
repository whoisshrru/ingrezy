import jwt from "jsonwebtoken";
import { TokenPayload } from "../types/auth.js";

function getSecret(): string {
  return process.env.JWT_SECRET || "fallback_default_secret_do_not_use_in_prod";
}

function getExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN || "7d";
}

/**
 * Signs a JWT access token for the given payload.
 */
export function signAccessToken(payload: TokenPayload): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, getSecret(), { expiresIn: getExpiresIn() as any });
}

/**
 * Verifies a JWT access token and returns the typed payload.
 */
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, getSecret()) as TokenPayload;
}
