// Integrando Express con EJS y conectando con la API de 
// Mercado Libre para manejar tokens OAuth, 
// ver permisos y refrescar el token.

// Ventajas de este enfoque
// No dependés de archivos locales (code_verifier.txt)
// Todo el flujo funciona desde Render sin intervención manual
// Podés escalarlo y automatizarlo fácilmente

require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const fetch = require('node-fetch'); // node-fetch@2
const { getToken, saveToken } = require('./tokenStorage');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Ruta principal: muestra el estado del token
app.get('/', (req, res) => {
  const token = getToken();
  res.render('token', {
    token,
    error: token ? null : '❌ Token no disponible o inválido. Por favor, autenticá primero.'
  });
});

// Ruta para ver permisos del token
app.get('/ver-permisos', async (req, res) => {
  try {
    const token = getToken();
    if (!token || !token.access_token) {
      return res.render('permisos', {
        permisos: null,
        error: '❌ Token no disponible. Autenticá primero.'
      });
    }

    const response = await fetch('https://api.mercadolibre.com/users/me', {
      headers: {
        Authorization: `Bearer ${token.access_token}`
      }
    });

    const permisos = await response.json();
    if (permisos.error) {
      return res.render('permisos', {
        permisos: null,
        error: `❌ Error al obtener permisos: ${permisos.message}`
      });
    }

    res.render('permisos', { permisos, error: null });
  } catch (error) {
    console.error('Error al obtener permisos:', error);
    res.render('permisos', {
      permisos: null,
      error: '❌ Error inesperado al consultar permisos'
    });
  }
});

// Ruta para refrescar el token
app.get('/refresh', async (req, res) => {
  try {
    const token = getToken();
    if (!token || !token.refresh_token) {
      return res.status(400).send('❌ No hay refresh_token disponible');
    }

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
    if (nuevoToken.error) {
      return res.status(400).send('❌ Error al refrescar el token: ' + nuevoToken.message);
    }

    saveToken(nuevoToken);
    res.redirect('/');
  } catch (error) {
    console.error('Error al refrescar el token:', error);
    res.status(500).send('❌ No se pudo refrescar el token');
  }
});

// Ruta para recibir el authorization_code y guardar el token
app.get('/callback', async (req, res) => {
  const code = req.query.code;
  const codeVerifier = getVerifier(); // recuperamos desde memoria

  // 🔍 Logs para depuración
  console.log('🔁 Código recibido:', code);
  console.log('🔐 Code Verifier usado:', codeVerifier);

  if (!code || !codeVerifier) {
    return res.render('token', {
      token: null,
      error: '❌ No se recibió el code o el code_verifier está ausente'
    });
  }

  const payload = {
    grant_type: 'authorization_code',
    client_id: process.env.CLIENT_ID,
    code,
    redirect_uri: process.env.REDIRECT_URI,
    code_verifier: codeVerifier
  };

  try {
    const response = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const tokenData = await response.json();

    if (tokenData.error) {
      return res.render('token', {
        token: null,
        error: `❌ Error al obtener el token: ${tokenData.message}`
      });
    }

    saveToken(tokenData);
    res.render('token', { token: tokenData, error: null });
  } catch (error) {
    res.render('token', {
      token: null,
      error: '❌ Error inesperado al obtener el token'
    });
  }
});

const { setVerifier, getVerifier } = require('./verifier');


app.get('/login', (req, res) => {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  setVerifier(codeVerifier); // guardamos en memoria

  const authUrl = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  res.redirect(authUrl); // redirige al login
});


// Dashboard visual
app.get('/dashboard', (req, res) => {
  const token = getToken();
  const scraping = {
    lastRun: '2025-10-03 14:22',
    items: 128,
    errors: 2
  };
  const system = {
    mode: 'Producción',
    autonomy: true
  };

  res.render('dashboard', { token, scraping, system });
});

// Rutas informativas
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
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
