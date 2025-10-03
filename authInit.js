// paso 1 authInit.js
// Script authInit.js — Generar code_verifier y 
// abrir navegador

// Genera code_verifier y code_challenge.
// lo guarda en code_verifier.txt.
// Abre el navegador para que autorices la app.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
require('dotenv').config();

// Generar code_verifier y code_challenge
const verifier = crypto.randomBytes(32).toString('base64url');
const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');

// Guardar el code_verifier
const filePath = path.join(__dirname, 'code_verifier.txt');
fs.writeFileSync(filePath, verifier);
console.log('✅ code_verifier guardado en:', filePath);

// Construir URL de autorización
const clientId = process.env.CLIENT_ID;
const redirectUri = process.env.REDIRECT_URI;

console.log('🔍 CLIENT_ID:', clientId);
console.log('🔍 REDIRECT_URI:', redirectUri);
console.log('🔍 code_challenge:', challenge);


const authUrl = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&code_challenge=${challenge}&code_challenge_method=S256`;

console.log('🔑 URL de autorización:', authUrl);

// Detectar sistema operativo y abrir navegador
const platform = process.platform;
if (platform === 'win32') {
  exec(`start ${authUrl}`);
} else if (platform === 'darwin') {
  exec(`open ${authUrl}`);
} else if (platform === 'linux') {
  exec(`xdg-open ${authUrl}`);
} else {
  console.log('🌐 Abrí manualmente esta URL en tu navegador:', authUrl);
}


