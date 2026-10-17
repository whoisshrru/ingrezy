import crypto from "crypto";

const OTP_SECRET = process.env.JWT_SECRET || "ingrezy_otp_internal_secure_salt_2026";

/**
 * Generate a cryptographically secure 6-digit numeric OTP.
 */
export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Hash an OTP using HMAC-SHA256 with an internal salt.
 * Plaintext OTP is NEVER stored in database.
 */
export function hashOtp(otp: string): string {
  return crypto
    .createHmac("sha256", OTP_SECRET)
    .update(otp)
    .digest("hex");
}

/**
 * Secure, timing-safe comparison of candidate OTP against stored hash.
 */
export function verifyOtp(candidateOtp: string, storedHash: string): boolean {
  const candidateHash = hashOtp(candidateOtp);
  const a = Buffer.from(candidateHash, "hex");
  const b = Buffer.from(storedHash, "hex");

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}
