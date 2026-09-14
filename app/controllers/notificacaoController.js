const models = require('../models/models');
const { notificacoesModel } = models;

// GET /notificacoes
async function listar(req, res) {
  try {
    const notificacoes = await notificacoesModel.listarPorUsuario(req.session.userId, 20);
    res.json({ notificacoes });
  } catch (err) {
    console.error('Erro ao buscar notificações:', err);
    res.status(500).json({ notificacoes: [] });
  }
}

// GET /notificacoes/nao-lidas
async function contarNaoLidas(req, res) {
  try {
    const total = await notificacoesModel.contarNaoLidas(req.session.userId);
    res.json({ total });
  } catch (err) {
    console.error('Erro ao contar notificações não lidas:', err);
    res.status(500).json({ total: 0 });
  }
}

// POST /notificacoes/:id/ler
async function marcarLida(req, res) {
  try {
    await notificacoesModel.marcarLida(req.params.id, req.session.userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
}

// POST /notificacoes/marcar-todas-lidas
async function marcarTodasLidas(req, res) {
  try {
    await notificacoesModel.marcarTodasLidas(req.session.userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
}

module.exports = { listar, contarNaoLidas, marcarLida, marcarTodasLidas };
