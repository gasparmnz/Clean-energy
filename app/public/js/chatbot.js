document.addEventListener('DOMContentLoaded', () => {
  const mensagensEl = document.getElementById('chatbot-messages');
  const form = document.getElementById('chatbot-form');
  const textarea = document.getElementById('chatbot-input');
  const enviarBtn = document.getElementById('chatbot-send');

  if (!form || !mensagensEl) return;

  let historico = [];
  let aguardandoResposta = false;

  function escaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  }

  function adicionarMensagem(autor, texto, opcoes = {}) {
    const bolha = document.createElement('div');
    bolha.className = `chat-msg msg-${autor === 'ia' ? 'ia' : autor === 'erro' ? 'erro' : 'usuario'}`;
    bolha.innerHTML = escaparHtml(texto).replace(/\n/g, '<br>');
    mensagensEl.appendChild(bolha);
    mensagensEl.scrollTop = mensagensEl.scrollHeight;

    if (opcoes.salvarHistorico !== false && (autor === 'ia' || autor === 'usuario')) {
      historico.push({ autor, texto });
    }
  }

  function mostrarDigitando() {
    const el = document.createElement('div');
    el.className = 'chat-typing';
    el.id = 'chatbot-typing-indicator';
    el.innerHTML = '<span></span><span></span><span></span>';
    mensagensEl.appendChild(el);
    mensagensEl.scrollTop = mensagensEl.scrollHeight;
  }

  function esconderDigitando() {
    const el = document.getElementById('chatbot-typing-indicator');
    if (el) el.remove();
  }

  async function enviarPergunta(pergunta) {
    adicionarMensagem('usuario', pergunta);
    textarea.value = '';
    textarea.style.height = 'auto';
    aguardandoResposta = true;
    enviarBtn.disabled = true;
    mostrarDigitando();

    try {
      const resposta = await fetch('/duvidas/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pergunta,
          historico: historico.slice(0, -1)
        })
      });

      const dados = await resposta.json();
      esconderDigitando();

      if (!resposta.ok) {
        adicionarMensagem('erro', dados.erro || 'Não foi possível obter uma resposta agora.', { salvarHistorico: false });
        return;
      }

      adicionarMensagem('ia', dados.resposta);
    } catch (err) {
      esconderDigitando();
      adicionarMensagem('erro', 'Falha de conexão. Verifique sua internet e tente novamente.', { salvarHistorico: false });
    } finally {
      aguardandoResposta = false;
      enviarBtn.disabled = false;
      textarea.focus();
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const pergunta = textarea.value.trim();
    if (!pergunta || aguardandoResposta) return;
    enviarPergunta(pergunta);
  });

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 110) + 'px';
  });

  adicionarMensagem(
    'ia',
    'Olá! Sou o assistente virtual do Clean Energy. Posso ajudar com dúvidas sobre cadastro, login, perfil, compras, vendas, carrinho, pagamentos, entrega e navegação no site. Como posso ajudar?',
    { salvarHistorico: false }
  );
  textarea.focus();
});
