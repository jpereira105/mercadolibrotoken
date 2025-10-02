// paso 2 tokenExchange.js
// Script tokenExchange.js — Intercambiar el authorization_code

// en bash se ejecuta
// node tokenExchange.js TU_AUTHORIZATION_CODE

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { saveToken } = require('./tokenStorage');

const code = process.argv[2]; // Pasás el código como argumento
const verifier = fs.readFileSync(path.join(__dirname, 'code_verifier.txt'), 'utf-8');

async function exchangeCode() {
  const response = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code,
      redirect_uri: process.env.REDIRECT_URI,
      code_verifier: verifier
    })
  });

  const token = await response.json();
  console.log('🔁 Respuesta del intercambio:', token);

  if (token.error) {
    console.error('❌ Error al intercambiar el código:', token.message);
    return;
  }

  saveToken(token);
  console.log('✅ Token guardado correctamente');
}

exchangeCode();
