// tokenStorage.js
const fs = require('fs');
const path = require('path');

const tokenPath = path.join(__dirname, 'token.json');

function getToken() {
  if (fs.existsSync(tokenPath)) {
    const data = fs.readFileSync(tokenPath);
    return JSON.parse(data);
  }
  return null;
}

function saveToken(token) {
  fs.writeFileSync(tokenPath, JSON.stringify(token, null, 2));
}

module.exports = { getToken, saveToken };