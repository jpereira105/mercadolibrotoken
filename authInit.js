// paso 1 authInit.js
// Script authInit.js — Generar code_verifier y 
// abrir navegador

// Genera code_verifier y code_challenge.
// lo guarda en code_verifier.txt.
// Abre el navegador para que autorices la app.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const open = require('open');

const verifier = crypto.randomBytes(32).toString('base64url');
const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');

// Guardar el code_verifier
const filePath = path.join(__dirname, 'code_verifier.txt');
fs.writeFileSync(filePath, verifier);

const clientId = process.env.CLIENT_ID;
const redirectUri = process.env.REDIRECT_URI;

const authUrl = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&code_challenge=${challenge}&code_challenge_method=S256`;

console.log('🔑 URL de autorización:', authUrl);
open(authUrl);
