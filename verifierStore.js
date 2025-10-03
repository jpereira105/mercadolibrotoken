llet verifier = null;

function setVerifier(v) {
  verifier = v;
}

function getVerifier() {
  return verifier;
}

module.exports = { setVerifier, getVerifier };