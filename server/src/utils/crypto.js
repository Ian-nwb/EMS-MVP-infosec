import crypto from "crypto";

// 32-byte encryption key derived from JWT_SECRET or ENCRYPTION_KEY
const getSecretKey = () => {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "ems_fallback_encryption_key_32_bytes_len";
  return crypto.createHash("sha256").update(String(secret)).digest();
};

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts plaintext string using AES-256-GCM.
 * Output format: iv:authTag:encryptedHex
 */
export function encryptField(plainText) {
  if (!plainText) return plainText;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv);
  let encrypted = cipher.update(String(plainText), "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts string encrypted with AES-256-GCM.
 */
export function decryptField(encryptedText) {
  if (!encryptedText || typeof encryptedText !== "string" || !encryptedText.includes(":")) {
    return encryptedText;
  }
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) return encryptedText;
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, getSecretKey(), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Decryption failed:", err.message);
    return "[Decryption Error]";
  }
}
