const axios = require('axios');

async function solicitarTokenOAuth2() {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const redirectUri = process.env.REDIRECT_URI;
  const code = global.lastCode; // o como estés guardando el código recibido
  const verifier = global.lastVerifier;

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('code', code);
  params.append('redirect_uri', redirectUri);
  params.append('code_verifier', verifier);

  const response = await axios.post('https://api.mercadolibre.com/oauth/token', params);
  return {
    token_de_acceso: response.data.access_token,
    caduca_en: response.data.expires_in,
    token_de_actualización: response.data.refresh_token,
    scope: response.data.scope,
    id_usuario: response.data.user_id
  };
}

module.exports = { solicitarTokenOAuth2 };
