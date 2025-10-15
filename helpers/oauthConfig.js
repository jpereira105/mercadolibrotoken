// produccion o local REDIRECT_URI 

function getRedirectUri() {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction
    ? 'https://justo-scraper.onrender.com/callback'
    : 'http://localhost:3000/callback';
}

module.exports = { getRedirectUri };
