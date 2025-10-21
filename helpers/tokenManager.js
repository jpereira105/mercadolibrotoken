// helpers/tokenManager.js
// Este módulo se encargará de:
// obtener el token (si no existe o está vencido)
// guardarlo en memoria o archivo temporal
// devolverlo a quien lo necesite
// Exponer el módulo como endpoint

// routes/tokenRoute.js
const express = require('express');
const router = express.Router();
const { getToken } = require('../helpers/tokenManager');

router.get('/token', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({ error: 'API_KEY inválida' });
  }

  try {
    const token = await getToken();
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener token' });
  }
});

module.exports = router;
