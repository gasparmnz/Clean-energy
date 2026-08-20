// ── Utilitários de conversão (o navegador trabalha com ArrayBuffer, a API com base64url) ──
function bufferParaBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlParaBuffer(base64url) {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const buffer = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buffer[i] = raw.charCodeAt(i);
  return buffer.buffer;
}

// ── Cadastro de biometria/Face ID neste dispositivo (chamado a partir da tela de Perfil) ──
async function cadastrarBiometria() {
  if (!window.PublicKeyCredential) {
    alert('Este navegador/dispositivo não suporta biometria ou Face ID.');
    return false;
  }
  try {
    const resp = await fetch('/perfil/biometria/opcoes-registro');
    const options = await resp.json();
    if (!resp.ok) { alert(options.error || 'Não foi possível iniciar o cadastro.'); return false; }

    options.challenge = base64urlParaBuffer(options.challenge);
    options.user.id = base64urlParaBuffer(options.user.id);
    if (options.excludeCredentials) {
      options.excludeCredentials = options.excludeCredentials.map((c) => ({
        ...c, id: base64urlParaBuffer(c.id)
      }));
    }

    const credential = await navigator.credentials.create({ publicKey: options });

    const payload = {
      id: bufferParaBase64url(credential.rawId),
      rawId: bufferParaBase64url(credential.rawId),
      type: credential.type,
      response: {
        attestationObject: bufferParaBase64url(credential.response.attestationObject),
        clientDataJSON: bufferParaBase64url(credential.response.clientDataJSON),
        transports: credential.response.getTransports ? credential.response.getTransports() : []
      },
      clientExtensionResults: credential.getClientExtensionResults ? credential.getClientExtensionResults() : {}
    };

    const verResp = await fetch('/perfil/biometria/verificar-registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const verData = await verResp.json();
    if (!verResp.ok || !verData.success) {
      alert(verData.error || 'Não foi possível concluir o cadastro da biometria.');
      return false;
    }
    return true;
  } catch (err) {
    console.error('Erro ao cadastrar biometria:', err);
    if (err.name === 'NotAllowedError') {
      alert('Cadastro cancelado ou não autorizado.');
    } else {
      alert('Erro ao cadastrar biometria neste dispositivo.');
    }
    return false;
  }
}

// ── Login com biometria/Face ID (chamado a partir da tela de Login) ──
async function loginComBiometria(email) {
  if (!window.PublicKeyCredential) {
    alert('Este navegador/dispositivo não suporta biometria ou Face ID.');
    return;
  }
  if (!email) {
    alert('Digite seu e-mail cadastrado antes de usar a biometria.');
    return;
  }
  try {
    const resp = await fetch('/login/biometria/opcoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const options = await resp.json();
    if (!resp.ok) { alert(options.error || 'Não foi possível iniciar o login biométrico.'); return; }

    options.challenge = base64urlParaBuffer(options.challenge);
    if (options.allowCredentials) {
      options.allowCredentials = options.allowCredentials.map((c) => ({
        ...c, id: base64urlParaBuffer(c.id)
      }));
    }

    const assertion = await navigator.credentials.get({ publicKey: options });

    const payload = {
      id: bufferParaBase64url(assertion.rawId),
      rawId: bufferParaBase64url(assertion.rawId),
      type: assertion.type,
      response: {
        authenticatorData: bufferParaBase64url(assertion.response.authenticatorData),
        clientDataJSON: bufferParaBase64url(assertion.response.clientDataJSON),
        signature: bufferParaBase64url(assertion.response.signature),
        userHandle: assertion.response.userHandle ? bufferParaBase64url(assertion.response.userHandle) : null
      },
      clientExtensionResults: assertion.getClientExtensionResults ? assertion.getClientExtensionResults() : {}
    };

    const verResp = await fetch('/login/biometria/verificar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const verData = await verResp.json();
    if (verResp.ok && verData.success) {
      window.location.href = verData.redirect || '/perfil';
    } else {
      alert(verData.error || 'Não foi possível concluir o login biométrico.');
    }
  } catch (err) {
    console.error('Erro no login biométrico:', err);
    if (err.name === 'NotAllowedError') {
      alert('Login biométrico cancelado.');
    } else {
      alert('Erro ao tentar login biométrico.');
    }
  }
}
