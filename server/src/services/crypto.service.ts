import crypto from "crypto";
import { env } from "../config/env.js";

// derive a 32-byte key from the JWT secret bcz AES-256 requires exactly 256 bits(32bytes) key
const KEY = crypto.scryptSync(
  env.JWT_SECRET || "default_secure_key_fallback_32_bytes_long",
  "salt-for-db-encryption",
  32
);

// deterministic encryption — same input always gives same output
// used for emails so we can query them by exact match
const ALGORITHM = "aes-256-cbc";
// AES -> Advanced Encyption Standard
// 256 -> 256 - bit Key
// CBC -> Cipher Block Chaining

const STATIC_IV = Buffer.alloc(16, 0); //Creates a 16 - byte initilaization Vector

export function encryptDeterministic(text: string | null | undefined): string {
  if (!text) return "";
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, STATIC_IV);
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
}
// suppose two users have the same email so it is difficult to find them using normal encryption
// Using deterministic encryption will generate same encrypted email for the same email
// Hence using this we can find them

export function decryptDeterministic(ciphertext: string | null | undefined): string {
  if (!ciphertext) return "";
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, STATIC_IV);
    let decrypted = decipher.update(ciphertext, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return ciphertext;
  }
}

// non-deterministic encryption — uses a random IV each time
// used for message content
export function encryptMessage(text: string | null | undefined): string {
  if (!text) return "";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

export function decryptMessage(ciphertext: string | null | undefined): string {
  if (!ciphertext) return "";
  try {
    const parts = ciphertext.split(":");
    if (parts.length !== 2) {
      return ciphertext;
    }
    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return ciphertext;
  }
}

// generates a secure random hex token (for invite links etc.)
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}
