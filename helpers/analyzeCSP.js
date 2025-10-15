// helpers/analyzeCSP.js
// Este helper (analyzeCSP.js) sirve para:
// Analizar el header Content-Security-Policy
// Detectar directivas como script-src, style-src, etc.
// Evaluar si hay valores peligrosos (*, unsafe-inline, data:)
// Generar sugerencias y estados (ok, warning, missing)
// Mostrarlo en vistas como csp-debug.ejs o csp-status.ejs


function analyzeCSP(header) {
  const directivas = {};
  const partes = header.split(';').map(p => p.trim());

  const mapaDirectivas = {
    "default-src": "origen predeterminado",
    "style-src": "origen-estilo",
    "script-src": "origen-script",
    "img-src": "origen-img",
    "font-src": "origen-fuente"
  };

  const directivasEsperadas = Object.keys(mapaDirectivas);

  partes.forEach(parte => {
    const [clave, ...valores] = parte.split(' ');
    const valor = valores.join(' ').trim();
    const origenes = valor.split(' ').filter(Boolean);

    const tieneWarning = origenes.some(v => v.includes('*') || v.includes('unsafe-inline'));
    const tieneData = origenes.some(v => v.includes('data:'));

    let estado = 'ok';
    if (!valor) estado = 'missing';
    else if (tieneWarning) estado = 'warning';
    else if (tieneData) estado = 'ok-data';

    let sugerencia = null;
    if (clave === 'script-src' && !valor.includes("'self'")) {
      sugerencia = "⚠️ Agregá 'self' para limitar scripts a tu dominio.";
    }
    if (valor.includes('*')) {
      sugerencia = "⚠️ Evitá usar '*'. Es riesgoso.";
    }

    const nombreLegible = mapaDirectivas[clave] || clave;
    directivas[nombreLegible] = { valor, estado, sugerencia };
  });

  // Detectar directivas faltantes
  directivasEsperadas.forEach(clave => {
    const nombreLegible = mapaDirectivas[clave];
    if (!Object.values(directivas).some(d => d && d.valor && nombreLegible in directivas)) {
      directivas[nombreLegible] = {
        valor: null,
        estado: 'missing',
        sugerencia: `🔴 Falta ${clave}. Considerá agregarla.`
      };
    }
  });

  return directivas;
}

module.exports = analyzeCSP;
