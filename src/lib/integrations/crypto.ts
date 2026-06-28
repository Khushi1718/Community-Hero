import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// We need a 32-byte key for AES-256
function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set. It must be a 32-byte (64 hex characters) string.");
  }
  // If the key is provided as a hex string, convert it. If it's a raw string, pad or truncate it to 32 bytes.
  if (key.length === 64) {
    return Buffer.from(key, 'hex');
  }
  
  // Fallback for simple strings (pad or truncate to 32 bytes)
  const paddedKey = Buffer.alloc(32);
  Buffer.from(key, 'utf8').copy(paddedKey);
  return paddedKey;
}

export function encryptToken(text: string): string {
  if (!text) return "";
  const iv = crypto.randomBytes(12); // GCM standard IV size
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Format: iv:encryptedData:authTag
  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

export function decryptToken(encryptedText: string): string {
  if (!encryptedText) return "";
  
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedData = Buffer.from(parts[1], 'hex');
  const authTag = Buffer.from(parts[2], 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedData, undefined, 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
