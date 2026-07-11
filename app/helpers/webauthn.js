let webauthnLib = null;
let disponivel = false;
try {
  webauthnLib = require('@simplewebauthn/server');
  disponivel = true;
} catch (err) {
  console.warn('[Biometria/Face ID] Pacote @simplewebauthn/server não instalado. Rode "npm install" para habilitar o login biométrico.');
}

// IMPORTANTE: em produção, defina estas variáveis de ambiente com o domínio real.
// rpID deve ser exatamente o hostname do site (sem porta, sem protocolo).
// WebAuthn só funciona em contexto seguro: https:// ou http://localhost.
const RP_NAME = process.env.WEBAUTHN_RP_NAME || 'Clean Energy';
const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost';
const ORIGIN = process.env.WEBAUTHN_ORIGIN || `http://${RP_ID}:${process.env.PORT || 3000}`;

module.exports = {
  disponivel,
  RP_NAME, RP_ID, ORIGIN,
  generateRegistrationOptions: disponivel ? webauthnLib.generateRegistrationOptions : null,
  verifyRegistrationResponse: disponivel ? webauthnLib.verifyRegistrationResponse : null,
  generateAuthenticationOptions: disponivel ? webauthnLib.generateAuthenticationOptions : null,
  verifyAuthenticationResponse: disponivel ? webauthnLib.verifyAuthenticationResponse : null
};
