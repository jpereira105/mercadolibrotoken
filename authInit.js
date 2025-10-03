// Mercado Libre permite enviar un parámetro state en la URL 
// de autorización. Lo podemos usar para incluir el 
// code_verifier directamente, así Render lo recibe en /callback.
// 🧱 Nuevo authInit.js sin archivos locales
// corre desde Render

const crypto = require('crypto');
const open = require('open');
require('dotenv').config();

// Generar code_verifier y code_challenge
const verifier = crypto.randomBytes(32).toString('base64url');
const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
const codeVerifier = req.query.state;

// Construir URL con code_challenge y state
const clientId = process.env.CLIENT_ID;
const redirectUri = process.env.REDIRECT_URI;

const authUrl = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&code_challenge=${challenge}&code_challenge_method=S256&state=${verifier}`;

console.log('🌐 Abriendo navegador con state incluido...');
open(authUrl);
