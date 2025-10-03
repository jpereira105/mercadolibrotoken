// Integrando Express con EJS y conectando con la API de 
// Mercado Libre para manejar tokens OAuth, 
// ver permisos y refrescar el token.

require('dotenv').config();
const express = require('express');
const path = require('path');
const fetch = require('node-fetch'); // Asegurate de tener node-fetch@2 instalado
const { getToken, saveToken } = require('./tokenStorage');
const app = express();
const PORT = process.env.PORT || 3000;

// Configurar EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Ruta principal: muestra el estado del token
app.get('/', (req, res) => {
  const token = getToken();
  console.log('Token actual:', token); // token disponible ?
  res.render('token', { token });
});

// Ruta para ver permisos del token
app.get('/ver-permisos', async (req, res) => {
  try {
    const token = getToken();
    console.log('Token para permisos:', token); // 👈 Verificás antes de usarlo

    const response = await fetch('https://api.mercadolibre.com/users/me', {
      headers: {
        Authorization: `Bearer ${token.access_token}`
      }
    });

    const permisos = await response.json();
    res.render('permisos', { permisos });
  } catch (error) {
    console.error('Error al obtener permisos:', error);
    res.status(500).send('No se pudieron obtener los permisos');
  }
});

// Ruta para refrescar el token
app.get('/refresh', async (req, res) => {
  try {
    const token = getToken();
    console.log('Token antes de refrescar:', token);

    const response = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        refresh_token: token.refresh_token
      })
    });

    const nuevoToken = await response.json();
    console.log('Respuesta del refresh:', nuevoToken);

    // Validación: solo guardar si no hay error
    if (nuevoToken.error) {
      console.error('❌ Error en el refresh:', nuevoToken.error);
      return res.status(400).send('Error al refrescar el token: ' + nuevoToken.message);
    }

    saveToken(nuevoToken);
    res.redirect('/');
  } catch (error) {
    console.error('Error al refrescar el token:', error);
    res.status(500).send('No se pudo refrescar el token');
  }
});

// Ruta para recibir el authorization_code y guardar el token
app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('No se recibió el authorization code');
  }

  // Leer el code_verifier guardado previamente
  const fs = require('fs');
  const verifierPath = path.join(__dirname, 'code_verifier.txt');
  if (!fs.existsSync(verifierPath)) {
    return res.status(500).send('No se encontró el code_verifier');
  }
  const code_verifier = fs.readFileSync(verifierPath, 'utf-8');

  try {
    const response = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code,
        redirect_uri: process.env.REDIRECT_URI,
        code_verifier
      })
    });

    const token = await response.json();
    console.log('🔁 Token recibido:', token);

    if (token.error) {
      return res.status(400).send('Error al intercambiar el código: ' + token.message);
    }

    saveToken(token);
    res.send('✅ Token guardado correctamente. Ya podés usar el dashboard.');
  } catch (error) {
    console.error('❌ Error en el intercambio:', error);
    res.status(500).send('Error interno al procesar el token');
  }
});

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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
