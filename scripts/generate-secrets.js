#!/usr/bin/env node

/**
 * Generate Production Secrets
 *
 * This script generates cryptographically secure secrets for production deployment.
 * Run: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 Generating Production Secrets...\n');
console.log('Copy these values to your backend/.env.production file:\n');
console.log('─'.repeat(80));

// JWT Secret (64 bytes = 128 hex chars)
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('\n# JWT Configuration');
console.log(`JWT_SECRET=${jwtSecret}`);

// Encryption Key (32 bytes = 64 hex chars for AES-256)
const encryptionKey = crypto.randomBytes(32).toString('hex');
console.log('\n# Encryption Key (for API keys storage)');
console.log(`ENCRYPTION_KEY=${encryptionKey}`);

// Redis Password (32 bytes base64)
const redisPassword = crypto.randomBytes(32).toString('base64');
console.log('\n# Redis Configuration');
console.log(`REDIS_PASSWORD=${redisPassword}`);

console.log('\n' + '─'.repeat(80));
console.log('\n✅ Secrets generated successfully!\n');
console.log('⚠️  IMPORTANT:');
console.log('  1. Copy these values to backend/.env.production');
console.log('  2. Never commit .env.production to Git');
console.log('  3. Keep these secrets secure');
console.log('  4. Generate new secrets for each environment\n');
