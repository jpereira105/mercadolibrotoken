window.addEventListener("securitypolicyviolation", function(e) {
  const log = document.getElementById("csp-log");
  const msg = `🚫 Bloqueado: ${e.blockedURI || 'inline script'} → ${e.violatedDirective}`;
  const item = document.createElement("li");
  item.textContent = msg;
  log.appendChild(item);
});
