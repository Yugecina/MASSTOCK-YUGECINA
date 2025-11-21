/**
 * Encryption Utility
 *
 * Provides AES-256-GCM encryption/decryption for sensitive data like API keys.
 * Uses environment variable ENCRYPTION_KEY for the encryption key.
 *
 * Security Note:
 * - ENCRYPTION_KEY must be a 32-byte (64 hex characters) random string
 * - Store it securely in environment variables, never commit to git
 * - Rotate keys regularly in production
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes IV for GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes auth tag
const SALT_LENGTH = 64; // 64 bytes salt

/**
 * Get encryption key from environment
 * @returns {Buffer} The encryption key as a Buffer
 * @throws {Error} If ENCRYPTION_KEY is not set or invalid
 */
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }

  return Buffer.from(key, 'hex');
}

/**
 * Generate a random encryption key
 * Use this to generate a new ENCRYPTION_KEY for your environment
 * @returns {string} A 64-character hex string (32 bytes)
 */
function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Encrypt a string using AES-256-GCM
 *
 * @param {string} plaintext - The text to encrypt
 * @returns {object} Object containing encrypted data, iv, authTag, and salt
 *
 * @example
 * const encrypted = encryptApiKey('my-secret-api-key');
 * // Store encrypted.encrypted, encrypted.iv, encrypted.authTag, encrypted.salt in database
 */
function encryptApiKey(plaintext) {
  if (!plaintext || typeof plaintext !== 'string') {
    throw new Error('Invalid plaintext: must be a non-empty string');
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      salt: salt.toString('hex'),
      algorithm: ALGORITHM
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt an encrypted string
 *
 * @param {object} encryptedData - Object containing encrypted, iv, authTag
 * @param {string} encryptedData.encrypted - The encrypted data (hex string)
 * @param {string} encryptedData.iv - The initialization vector (hex string)
 * @param {string} encryptedData.authTag - The authentication tag (hex string)
 * @returns {string} The decrypted plaintext
 *
 * @example
 * const decrypted = decryptApiKey({
 *   encrypted: '...',
 *   iv: '...',
 *   authTag: '...'
 * });
 */
function decryptApiKey(encryptedData) {
  if (!encryptedData || typeof encryptedData !== 'object') {
    throw new Error('Invalid encrypted data: must be an object');
  }

  const { encrypted, iv, authTag } = encryptedData;

  if (!encrypted || !iv || !authTag) {
    throw new Error('Invalid encrypted data: missing required fields (encrypted, iv, authTag)');
  }

  try {
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Hash a value using SHA-256
 * Useful for creating secure hashes of API keys for comparison
 *
 * @param {string} value - The value to hash
 * @returns {string} The SHA-256 hash (hex string)
 */
function hashValue(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Securely compare two strings in constant time
 * Prevents timing attacks
 *
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} True if strings are equal
 */
function secureCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

module.exports = {
  encryptApiKey,
  decryptApiKey,
  generateEncryptionKey,
  hashValue,
  secureCompare
};
