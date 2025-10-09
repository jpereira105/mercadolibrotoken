// utils/csp.js
function analizarCSP(header) {
  const directivas = ['default-src', 'style-src', 'script-src', 'img-src', 'font-src'];
  const estado = {};

  directivas.forEach(dir => {
    const regex = new RegExp(`${dir}\\s+([^;]+)`);
    const match = header.match(regex);
    estado[dir] = match ? match[1].trim() : null;
  });

  return estado;
}

module.exports = { analizarCSP };