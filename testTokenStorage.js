const { getToken, saveToken } = require('./tokenStorage');

// Simulamos un token de prueba
const tokenDePrueba = {
  access_token: 'eyJhbGciOiTEST',
  expires_at: Date.now() + 3600000, // 1 hora
  scope: 'read write',
  user_id: 12345678
};

// Guardamos el token
console.log('💾 Guardando token de prueba...');
saveToken(tokenDePrueba);

// Leemos el token
console.log('📖 Leyendo token desde archivo...');
const token = getToken();

if (token) {
  console.log('✅ Token leído correctamente:', token);
} else {
  console.log('❌ No se pudo leer el token');
}
