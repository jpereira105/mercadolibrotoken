// verifier.js
const crypto = require('crypto');

let verifier = null;

function generateVerifier() {
  verifier = base64URLEncode(crypto.randomBytes(32));
  return verifier;
}

function generateChallenge() {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return base64URLEncode(hash);
}

function base64URLEncode(buffer) {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function getVerifier() {
  return verifier;
}

module.exports = { generateVerifier, generateChallenge, getVerifier };
