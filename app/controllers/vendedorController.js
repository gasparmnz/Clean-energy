const models = require('../models/models');
const { vendedorModel, notificacoesModel } = models;

// GET /vendedor/:id
async function getPerfilVendedor(req, res) {
  try {
    const vendedorId = req.params.id;

    const vendedor = await vendedorModel.findById(vendedorId);
    if (!vendedor) return res.status(404).send('Vendedor não encontrado');

    const avgData = await vendedorModel.findMediaAvaliacao(vendedorId);
    vendedor.mediaAvaliacao = avgData.media;
    vendedor.totalAvaliacoes = avgData.total;

    const prodRows = await vendedorModel.findProdutos(vendedorId);
    vendedor.totalVendas = await vendedorModel.findTotalVendas(vendedorId);
    vendedor.totalProdutos = prodRows.length;

    const comentarios = await vendedorModel.findAvaliacoes(vendedorId);

    let jaAvaliou = false;
    let minhaAvaliacao = null;
    if (req.session.userId) {
      minhaAvaliacao = await vendedorModel.findAvaliacaoByAvaliador(vendedorId, req.session.userId);
      if (minhaAvaliacao) jaAvaliou = true;
    }

    const usuarioSessao = req.session.userId
      ? { id: req.session.userId, nome: req.session.nomeUsuario, perfil: req.session.perfil }
      : null;

    res.render('pages/perfil_vendedor', {
      vendedor,
      produtos: prodRows,
      comentarios,
      jaAvaliou,
      minhaAvaliacao,
      usuario: usuarioSessao
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao carregar perfil do vendedor');
  }
}

// POST /vendedor/:id/avaliar
async function avaliarVendedor(req, res) {
  const vendedorId = req.params.id;
  const { nota, comentario } = req.body;
  const notaNum = parseInt(nota, 10);

  if (!notaNum || notaNum < 1 || notaNum > 5) {
    return res.redirect(`/vendedor/${vendedorId}?erro=nota`);
  }

  if (parseInt(vendedorId) === req.session.userId) {
    return res.redirect(`/vendedor/${vendedorId}?erro=proprio`);
  }

  try {
    const jaAv = await vendedorModel.findAvaliacaoId(vendedorId, req.session.userId);

    if (jaAv) {
      await vendedorModel.updateAvaliacao({ vendedorId, avaliadorId: req.session.userId, nota: notaNum, comentario });
    } else {
      await vendedorModel.createAvaliacao({ vendedorId, avaliadorId: req.session.userId, nota: notaNum, comentario });
      try {
        await notificacoesModel.criar({
          usuarioId: vendedorId,
          tipo: 'nova_avaliacao_vendedor',
          mensagem: 'Seu perfil de vendedor recebeu uma nova avaliação.',
          link: `/vendedor/${vendedorId}#avaliacoes`
        });
      } catch (e) { console.error('Erro ao notificar avaliação de vendedor:', e); }
    }
    res.redirect(`/vendedor/${vendedorId}?sucesso=1#avaliacoes`);
  } catch (err) {
    console.error(err);
    res.redirect(`/vendedor/${vendedorId}?erro=salvar`);
  }
}

module.exports = { getPerfilVendedor, avaliarVendedor };
