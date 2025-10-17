// produccion render

function getRedirectUri() {
  return process.env.REDIRECT_URI || 'https://justo-scraper.onrender.com/callback';
}

module.exports = { getRedirectUri };