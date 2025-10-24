// helpers/tokenManager.js
// Este módulo se encargará de:
// obtener el token (si no existe o está vencido)
// guardarlo en memoria o archivo temporal
// devolverlo a quien lo necesite
// Exponer el módulo como endpoint

// helpers/tokenManager.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const tokenPath = path.join(__dirname, '../.token-cache.json');

function isTokenValid(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64'));
    const exp = payload.exp * 1000;
    return Date.now() < exp - 60000; // válido si falta más de 1 min
  } catch {
    return false;
  }
}

async function fetchNewToken() {
  const res = await axios.get('https://justo-scraper.onrender.com/api/token', {
    headers: { 'x-api-key': process.env.API_KEY_MERCADOLIBRE },
    timeout: 5000
  });

  if (!res.data?.token) throw new Error('Token no disponible');
  fs.writeFileSync(tokenPath, JSON.stringify({ token: res.data.token }));
  return res.data.token;
}

async function getToken() {
  if (fs.existsSync(tokenPath)) {
    const { token } = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
    if (isTokenValid(token)) return token;
  }
  return await fetchNewToken();
}

module.exports = { getToken };