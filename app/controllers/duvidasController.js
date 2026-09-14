const geminiChat = require('../helpers/geminiChat');

// GET /duvidas
function getDuvidas(req, res) {
  res.render('pages/duvidas');
}
async function postChat(req, res) {
  try {
    const { pergunta, historico } = req.body;

    if (!pergunta || typeof pergunta !== 'string' || !pergunta.trim()) {
      return res.status(400).json({ erro: 'Digite uma pergunta antes de enviar.' });
    }

    const resposta = await geminiChat.responderDuvida(pergunta, Array.isArray(historico) ? historico : []);
    res.json({ resposta });
  } catch (err) {
    if (err.message === 'CHAVE_API_AUSENTE') {
      console.error('[Chatbot Dúvidas] GEMINI_API_KEY não configurada no .env');
      return res.status(503).json({ erro: 'O assistente virtual está indisponível no momento. Tente novamente mais tarde.' });
    }
    if (err.message === 'ERRO_API_GEMINI') {
 
      if (err.status === 401 || err.status === 403) {
        return res.status(503).json({ erro: 'Não foi possível autenticar com o assistente de IA. Verifique a chave da API do Gemini no servidor.' });
      }
      if (err.status === 429) {
        return res.status(503).json({ erro: 'O assistente de IA está com muitas solicitações no momento. Tente novamente em instantes.' });
      }
      return res.status(500).json({ erro: 'Não foi possível obter uma resposta agora. Tente novamente em instantes.' });
    }
    console.error('Erro ao consultar o chatbot de dúvidas:', err.message);
    res.status(500).json({ erro: 'Não foi possível obter uma resposta agora. Tente novamente em instantes.' });
  }
}

module.exports = { getDuvidas, postChat };
