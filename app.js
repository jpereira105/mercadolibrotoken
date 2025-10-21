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
const { analizarCSP } = require('./utils/csp'); // ✅ Importar helper
const PORT = process.env.PORT || 3000;
const session = require('express-session');
const analyzeCSP = require('./helpers/analyzeCSP');
const axios = require('axios');
const { generateVerifier, generateChallenge } = require('./helpers/pkceUtils');




const isProduction = process.env.NODE_ENV === 'production';

// Si no hay SESSION_SECRET en desarrollo, generá uno temporal
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex');

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: isProduction, // solo cookies seguras en producción
    maxAge: 1000 * 60 * 60 // 1 hora
  }
}));

if (!isProduction) {
  console.log('🧪 Modo desarrollo: sesión no segura, logs extendidos habilitados');
}

app.use(express.static(path.join(__dirname, 'public')));

// ✅ Ruta para debug de CSP
app.get('/csp-debug', (req, res) => {
  const headers = req.headers;
  res.render('csp-debug', { headers });
});

app.get('/response-headers', (req, res) => {
  const responseHeaders = res.getHeaders();
  res.render('response-headers', { responseHeaders });
});

// Configurar EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ Paso 2: Ruta que usa el helper

// const analyzeCSP = require('./helpers/analyzeCSP');

app.get('/csp-status', (req, res) => {
  const cspHeader = "default-src 'self'; style-src 'self'; script-src 'none'; img-src 'self' data:; font-src 'self'";
  res.setHeader('Content-Security-Policy', cspHeader);

  const estadoDirectivas = analyzeCSP(cspHeader);
  const definidas = Object.values(estadoDirectivas).filter(Boolean).length;
  const total = Object.keys(estadoDirectivas).length;
  const status = definidas === total ? 'ok' : 'partial';

  res.render('csp-status', { cspHeader, estadoDirectivas, status });
});


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
    console.log('🔐 Token obtenido:', token);

    if (!token || !token.access_token) {
      return res.render('permisos', {
        permisos: null,
        error: '❌ Token no disponible. Autenticá primero.'
      });
    }

    const response = await axios.get('https://api.mercadolibre.com/users/me', {
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

    const response = await axios.post('https://api.mercadolibre.com/oauth/token', null, {
  params: {
    grant_type: 'authorization_code',
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    code: req.query.code,
    redirect_uri: process.env.REDIRECT_URI,
    code_verifier: req.session.code_verifier
  },
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
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
  const receivedState = req.query.state;
  const expectedState = req.session.oauth_state;
  const codeVerifier = req.session.code_verifier;
  const redirectUri = getRedirectUri();

  if (receivedState !== expectedState) {
    return res.status(403).send('❌ Estado inválido.');
  }

  const formData = new URLSearchParams();
  formData.append('grant_type', 'authorization_code');
  formData.append('client_id', process.env.CLIENT_ID);
  formData.append('client_secret', process.env.CLIENT_SECRET);
  formData.append('code', code);
  formData.append('redirect_uri', redirectUri);
  formData.append('code_verifier', codeVerifier);

  const startTime = Date.now(); // ⏱️ Inicio del cronómetro

  try {
    const response = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });

    const responseTime = Date.now() - startTime; // ⏱️ Fin del cronómetro
    const tokenData = await response.json();
    saveToken(tokenData);

    res.render('debug', {
      code,
      codeVerifier,
      state: receivedState,
      expectedState,
      redirectUri,
      responseTime, // 👈 esto es clave
      status: response.status,
      token: tokenData,
      error: tokenData.error ? tokenData.error_description || tokenData.message : null,
      logs: {
        codeLog: `🔁 Código recibido: ${code}`,
        verifierLog: `🔐 Verifier usado: ${codeVerifier}`,
        stateLog: `🧾 State recibido: ${receivedState} (esperado: ${expectedState})`,
        statusLog: `📡 Status HTTP: ${response.status}`,
        timeLog: `⏱️ Tiempo de respuesta: ${responseTime} ms`
  }
});


  } catch (err) {
    console.error('❌ Error en /callback:', err); // 👈 esto te muestra el error real
    res.render('debug', {
      code,
      codeVerifier,
      state: receivedState,
      expectedState,
      redirectUri,
      responseTime: null,
      status: 500,
      token: null,
      error: '❌ Error inesperado al obtener el token'
    });
  }
});

const { getRedirectUri } = require('./helpers/oauthConfig');

app.get('/login', (req, res) => {
  const codeVerifier = generateVerifier();
  req.session.code_verifier = codeVerifier;

  const state = crypto.randomBytes(16).toString('hex');
  req.session.oauth_state = state;

  const codeChallenge = generateChallenge(codeVerifier);
  const redirectUri = getRedirectUri();

  const authUrl = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${process.env.CLIENT_ID}&redirect_uri=${redirectUri}&code_challenge=${codeChallenge}&code_challenge_method=S256&state=${state}`;

  res.redirect(authUrl);
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


// validación de API_KEY en tu endpoint existente
// versión protegida

app.get('/api/token', async (req, res) => {
  console.log('🔐 Request recibido en /api/token');
  const apiKey = req.headers['x-api-key'];
  console.log('🔑 API_KEY recibida:', apiKey);

  if (apiKey !== process.env.API_KEY) {
    console.log('❌ API_KEY inválida');
    return res.status(403).json({ error: 'API_KEY inválida' });
  }

  try {
    const token = await getToken(); // asegurate que sea async
    console.log('🔐 Token obtenido:', token);

    if (!token || !token.access_token) {
      return res.status(404).json({ error: 'Token no disponible' });
    }

    res.json({ token: token.access_token });
  } catch (err) {
    console.error('❌ Error en /api/token:', err);
    res.status(500).json({ error: 'Error interno al obtener el token' });
  }
});


// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
