const models = require('../models/models');
const { usuarioModel, webauthnModel } = models;
const {
  disponivel: webauthnDisponivel,
  RP_NAME, RP_ID, ORIGIN,
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('../helpers/webauthn');

// GET /perfil/biometria/listar — lista os dispositivos biométricos cadastrados do usuário logado
async function listarCredenciais(req, res) {
  try {
    const credenciais = await webauthnModel.getCredentialsByUsuario(req.session.userId);
    res.json({ credenciais, disponivel: webauthnDisponivel });
  } catch (err) {
    console.error('Erro ao listar credenciais biométricas:', err);
    res.status(500).json({ credenciais: [], disponivel: webauthnDisponivel });
  }
}

// GET /perfil/biometria/opcoes-registro — gera o desafio para cadastrar biometria/Face ID neste dispositivo
async function opcoesRegistro(req, res) {
  try {
    const existentes = await webauthnModel.getCredentialsByUsuario(req.session.userId);
    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: Buffer.from(String(req.session.userId)),
      userName: req.session.emailUsuario || 'usuario',
      userDisplayName: req.session.nomeUsuario || 'Usuário',
      attestationType: 'none',
      excludeCredentials: existentes.map(c => ({ id: c.credential_id, type: 'public-key' })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform' // biometria/Face ID do próprio dispositivo
      }
    });
    req.session.webauthnChallenge = options.challenge;
    res.json(options);
  } catch (err) {
    console.error('Erro ao gerar opções de registro WebAuthn:', err);
    res.status(500).json({ error: 'Erro ao gerar opções de registro.' });
  }
}

// POST /perfil/biometria/verificar-registro — verifica e salva a credencial biométrica recém-criada no navegador
async function verificarRegistro(req, res) {
  try {
    const expectedChallenge = req.session.webauthnChallenge;
    if (!expectedChallenge) return res.status(400).json({ error: 'Desafio expirado. Tente novamente.' });

    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID
    });

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ error: 'Não foi possível verificar o registro.' });
    }

    const info = verification.registrationInfo;
    // Compatibilidade entre versões da lib (algumas expõem `credential`, outras campos separados)
    const credential = info.credential || {
      id: info.credentialID,
      publicKey: info.credentialPublicKey,
      counter: info.counter
    };

    const credentialIdStr = typeof credential.id === 'string'
      ? credential.id
      : Buffer.from(credential.id).toString('base64url');
    const publicKeyStr = Buffer.from(credential.publicKey).toString('base64');
    const transports = Array.isArray(req.body?.response?.transports)
      ? req.body.response.transports.join(',')
      : null;

    await webauthnModel.addCredential({
      usuarioId: req.session.userId,
      credentialId: credentialIdStr,
      publicKey: publicKeyStr,
      counter: credential.counter || 0,
      deviceName: (req.body && req.body.deviceName) || 'Dispositivo',
      transports
    });

    delete req.session.webauthnChallenge;
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao verificar registro WebAuthn:', err);
    res.status(500).json({ error: 'Erro ao verificar registro.' });
  }
}

// POST /perfil/biometria/remover/:id — remove uma credencial biométrica cadastrada
async function removerCredencial(req, res) {
  try {
    const ok = await webauthnModel.removerCredencial(req.params.id, req.session.userId);
    res.json({ success: ok });
  } catch (err) {
    console.error('Erro ao remover credencial biométrica:', err);
    res.status(500).json({ success: false });
  }
}

// POST /login/biometria/opcoes — gera o desafio de login biométrico a partir do e-mail informado
async function opcoesLoginBiometria(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Informe o e-mail cadastrado.' });

    const credenciais = await webauthnModel.getCredentialsByEmail(email);
    if (credenciais.length === 0) {
      return res.status(404).json({ error: 'Nenhuma biometria cadastrada para este e-mail.' });
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: 'preferred',
      allowCredentials: credenciais.map(c => ({
        id: c.credential_id,
        type: 'public-key',
        transports: c.transports ? c.transports.split(',') : undefined
      }))
    });

    req.session.webauthnChallenge = options.challenge;
    req.session.webauthnEmail = email;
    res.json(options);
  } catch (err) {
    console.error('Erro ao gerar opções de login WebAuthn:', err);
    res.status(500).json({ error: 'Erro ao gerar opções de login.' });
  }
}

// POST /login/biometria/verificar — verifica a resposta biométrica e efetiva o login
async function verificarLoginBiometria(req, res) {
  try {
    const expectedChallenge = req.session.webauthnChallenge;
    const email = req.session.webauthnEmail;
    if (!expectedChallenge || !email) {
      return res.status(400).json({ error: 'Sessão de login expirada. Tente novamente.' });
    }

    const credentialIdRecebido = req.body.id;
    const credencial = await webauthnModel.getCredentialByCredentialId(credentialIdRecebido);
    if (!credencial) return res.status(400).json({ error: 'Credencial não reconhecida.' });

    const verification = await verifyAuthenticationResponse({
      response: req.body,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: credencial.credential_id,
        publicKey: Buffer.from(credencial.public_key, 'base64'),
        counter: Number(credencial.counter)
      }
    });

    if (!verification.verified) {
      return res.status(401).json({ error: 'Verificação biométrica falhou.' });
    }

    await webauthnModel.atualizarContador(
      credencial.credential_id,
      verification.authenticationInfo.newCounter
    );

    const usuario = await usuarioModel.findByEmail(email);
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });
    if (usuario.status === 'suspended') {
      return res.status(403).json({ error: 'Sua conta foi suspensa pelo administrador.' });
    }

    req.session.userId = usuario.Usuario_ID;
    req.session.nomeUsuario = usuario.Nome;
    req.session.emailUsuario = usuario.Email;
    req.session.perfil = usuario.Tipo === 'PJ' ? 'vendedor' : 'comprador';
    req.session.tipo = usuario.Tipo;
    delete req.session.webauthnChallenge;
    delete req.session.webauthnEmail;

    res.json({ success: true, redirect: '/perfil' });
  } catch (err) {
    console.error('Erro ao verificar login WebAuthn:', err);
    res.status(500).json({ error: 'Erro ao verificar login.' });
  }
}

module.exports = {
  listarCredenciais,
  opcoesRegistro,
  verificarRegistro,
  removerCredencial,
  opcoesLoginBiometria,
  verificarLoginBiometria
};
