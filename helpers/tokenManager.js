// helpers/tokenManager.js
// Este módulo se encargará de:
// obtener el token (si no existe o está vencido)
// guardarlo en memoria o archivo temporal
// devolverlo a quien lo necesite

const { solicitarTokenOAuth2 } = require('./oauthRequester');

let cachedToken = null;
let expiresAt = null;

function isTokenValid() {
  return cachedToken && Date.now() < expiresAt;
}

async function fetchToken() {
  const tokenData = await solicitarTokenOAuth2();
  cachedToken = tokenData.token_de_acceso;
  expiresAt = Date.now() + tokenData.caduca_en * 1000;
  return cachedToken;
}

async function getToken() {
  if (isTokenValid()) return cachedToken;
  return await fetchToken();
}

module.exports = { getToken };
