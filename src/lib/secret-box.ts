import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Small at-rest encryption for the few secrets the Hub keeps (account
 * passwords in Brankas). AES-256-GCM with a key derived from PAYLOAD_SECRET,
 * the same secret Payload uses for its own API keys, so no new env var is
 * needed. Format: v1:<iv>:<tag>:<ciphertext>, all base64.
 */
const key = () => {
  const secret = process.env.PAYLOAD_SECRET;
  if (!secret) throw new Error("PAYLOAD_SECRET is not set");
  return createHash("sha256").update(secret).digest();
};

export function seal(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), enc.toString("base64")].join(":");
}

export function open(sealed: string): string {
  const [version, iv, tag, enc] = sealed.split(":");
  if (version !== "v1" || !iv || !tag || !enc) throw new Error("Unknown secret format");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(enc, "base64")), decipher.final()]).toString("utf8");
}
