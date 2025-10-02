// tokenStorage.js
const fs = require('fs');
const path = require('path');

const tokenPath = path.join(__dirname, 'token.json');

// Guarda el token en un archivo JSON
function saveToken(token) {
  if (!token || token.error) {
    console.warn('⚠️ Token inválido, no se guarda');
    return;
  }

  try {
    fs.writeFileSync(tokenPath, JSON.stringify(token, null, 2));
    console.log('✅ Token guardado correctamente');
  } catch (error) {
    console.error('❌ Error al guardar el token:', error);
  }
}

// Lee el token desde el archivo JSON
function getToken() {
  try {
    if (!fs.existsSync(tokenPath)) {
      console.warn('⚠️ No se encontró el archivo de token');
      return null;
    }

    const data = fs.readFileSync(tokenPath);
    const token = JSON.parse(data);
    return token;
  } catch (error) {
    console.error('❌ Error al leer el token:', error);
    return null;
  }
}

module.exports = { saveToken, getToken };
