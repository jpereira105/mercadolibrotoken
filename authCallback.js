// ¿Qué hace este script?
// Lee el code que llega por query string.
// Recupera el code_verifier guardado en code_verifier.txt.
// Hace una petición POST al endpoint de Mercado Libre para obtener el access_token.
// Muestra el token y los datos del usuario autenticado.

const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();

app.get('/privacy', (req, res) => {
  res.send(`
    <h2>🔒 Política de Privacidad</h2>
    <p>Esta aplicación utiliza OAuth2 para autenticar usuarios de Mercado Libre. No se almacena información personal sin consentimiento.</p>
  `);
});

app.get('/terms', (req, res) => {
  res.send(`
    <h2>📜 Términos y Condiciones</h2>
    <p>El uso de esta app implica la aceptación del flujo de autenticación OAuth2 y la visualización de métricas asociadas al usuario autenticado.</p>
  `);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('❌ Falta el parámetro "code"');

  // Leer el code_verifier guardado
  const verifierPath = path.join(__dirname, 'code_verifier.txt');
  const codeVerifier = fs.readFileSync(verifierPath, 'utf8');

  // Construir payload para obtener el token
  const payload = {
    grant_type: 'authorization_code',
    client_id: process.env.CLIENT_ID,
    redirect_uri: process.env.REDIRECT_URI,
    code,
    code_verifier: codeVerifier
  };

  try {
    const response = await axios.post('https://api.mercadolibre.com/oauth/token', payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    const tokenData = response.data;
    console.log('✅ Token recibido:', tokenData);

    // Mostrar token y datos en la vista
    res.send(`
      <h2>🎉 Autenticación exitosa</h2>
      <pre>${JSON.stringify(tokenData, null, 2)}</pre>
    `);
  } catch (error) {
    console.error('❌ Error al obtener el token:', error.response?.data || error.message);
    res.status(500).send('Error al obtener el token');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`));
