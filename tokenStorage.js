// tokenStorage.js
const fs = require('fs');
const path = require('path');

const tokenPath = path.join(__dirname, 'token.json');

// Leer el token desde archivo
function getToken() {
  try {
    if (!fs.existsSync(tokenPath)) return null;
    const data = fs.readFileSync(tokenPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error al leer el token:', error);
    return null;
  }
}

// Guardar el token en archivo
function saveToken(tokenData) {
  try {
    fs.writeFileSync(tokenPath, JSON.stringify(tokenData, null, 2));
    console.log('✅ Token guardado correctamente');
  } catch (error) {
    console.error('❌ Error al guardar el token:', error);
  }
}

module.exports = { getToken, saveToken };
