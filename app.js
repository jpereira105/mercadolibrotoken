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
  res.render('token', { token });
});

// Ruta para ver permisos del token
app.get('/ver-permisos', async (req, res) => {
  try {
    const token = getToken();
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
    saveToken(nuevoToken);
    res.redirect('/');
  } catch (error) {
    console.error('Error al refrescar el token:', error);
    res.status(500).send('No se pudo refrescar el token');
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
