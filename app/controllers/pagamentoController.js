const produtosModel = require('../models/models.js');
const { notificacoesModel, pedidoModel } = require('../models/models.js');
const cartModel = require('../models/cartModel');
const { preferenceClient } = require('../../config/mercadopago');

// GET /minhascompras
function getMinhasCompras(req, res) {
  const pendentes = req.session.pedidosPendentes || [];
  const emTransito = req.session.pedidosEmTransito || [];
  const concluidos = req.session.pedidosConcluidos || [];
  res.render('pages/minhascompras', { pendentes, emTransito, concluidos });
}

// POST /minhascompras/finalizar — move itens do carrinho para pedidos pendentes na sessão
async function finalizarCompra(req, res) {
  try {
    const userId = req.session.userId;
    const cart = await cartModel.getCartByUser(userId);
    if (cart && cart.length > 0) {
      req.session.pedidosPendentes = cart;
      const pool = require('../../config/pool_conexoes');
      await pool.query('DELETE FROM carrinho WHERE userId = ?', [userId]);

      // Notifica cada vendedor sobre o novo pedido
      for (const item of cart) {
        try {
          const produto = await produtosModel.findById(item.productId);
          if (produto && produto.usuario_id) {
            await notificacoesModel.criar({
              usuarioId: produto.usuario_id,
              tipo: 'novo_pedido',
              mensagem: `Novo pedido recebido: ${item.nome}`,
              link: '/listaprodutos'
            });
          }
        } catch (e) { console.error('Erro ao notificar vendedor sobre novo pedido:', e); }
      }
    }
    res.redirect('/minhascompras');
  } catch (err) {
    console.error('Erro ao finalizar compra:', err);
    res.redirect('/carrinho');
  }
}

// POST /pagamento/criar
async function criarPagamento(req, res) {
  console.log('>>> ROTA DE PAGAMENTO FOI CHAMADA!');
  try {
    const userId = req.session.userId || req.sessionID;
    const cart = await cartModel.getCartByUser(userId);

    if (!cart || cart.length === 0) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Seu carrinho está vazio.'
      });
    }

    const items = cart.map(item => ({
      id: String(item.productId),
      title: item.nome,
      quantity: item.quantidade,
      currency_id: 'BRL',
      unit_price: Number(item.preco)
    }));

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

    const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');

    const preferenceBody = {
      items,
      back_urls: {
        success: `${baseUrl}/pagamento/sucesso`,
        failure: `${baseUrl}/pagamento/falha`,
        pending: `${baseUrl}/pagamento/pendente`
      },
      notification_url: `${baseUrl}/pagamento/webhook`
    };

    if (!isLocalhost) {
      preferenceBody.auto_return = 'approved';
    }

    const preference = await preferenceClient.create({
      body: preferenceBody
    });

    console.log('Preference criada!');
    console.log(preference);

    // Move os itens do carrinho para "pendentes" assim que o checkout é iniciado
    req.session.pedidosPendentes = [...(req.session.pedidosPendentes || []), ...cart];
    const pool = require('../../config/pool_conexoes');
    await pool.query('DELETE FROM carrinho WHERE CAST(userId AS CHAR) = ?', [String(userId)]);
    for (const item of cart) {
      try {
        const produto = await produtosModel.findById(item.productId);
        if (produto && produto.usuario_id) {
          await notificacoesModel.criar({
            usuarioId: produto.usuario_id,
            tipo: 'novo_pedido',
            mensagem: `Novo pedido recebido: ${item.nome}`,
            link: '/listaprodutos'
          });
        }
      } catch (e) { console.error('Erro ao notificar vendedor sobre novo pedido:', e); }
    }

    res.json({
      sucesso: true,
      initPoint: preference.init_point
    });
  } catch (err) {
    console.error('ERRO COMPLETO:');
    console.error(err);

    res.status(500).json({
      sucesso: false,
      erro: err.message
    });
  }
}

// POST /pagamento/pendente/pagar — gera um novo checkout do Mercado Pago para um pedido já pendente
async function pagarPendente(req, res) {
  try {
    const { index } = req.body;
    const pendentes = req.session.pedidosPendentes || [];
    const item = pendentes[index];

    if (!item) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Pedido pendente não encontrado.'
      });
    }

    const items = [{
      id: String(item.productId),
      title: item.nome,
      quantity: item.quantidade,
      currency_id: 'BRL',
      unit_price: Number(item.preco)
    }];

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');

    const preferenceBody = {
      items,
      back_urls: {
        success: `${baseUrl}/pagamento/sucesso`,
        failure: `${baseUrl}/pagamento/falha`,
        pending: `${baseUrl}/pagamento/pendente`
      },
      notification_url: `${baseUrl}/pagamento/webhook`
    };

    if (!isLocalhost) {
      preferenceBody.auto_return = 'approved';
    }

    const preference = await preferenceClient.create({
      body: preferenceBody
    });

    res.json({
      sucesso: true,
      initPoint: preference.init_point
    });
  } catch (err) {
    console.error('ERRO ao pagar pedido pendente:', err);
    res.status(500).json({
      sucesso: false,
      erro: err.message
    });
  }
}

// GET /pagamento/sucesso
async function getSucesso(req, res) {
  const pendentes = req.session.pedidosPendentes || [];
  if (pendentes.length > 0) {
    const compradorId = req.session.userId;
    for (const item of pendentes) {
      try {
        const valorTotal = Number(item.preco) * (item.quantidade || 1);
        item.pedidoId = await pedidoModel.criar({
          compradorId,
          produtoId: item.productId,
          valorTotal
        });
      } catch (e) { console.error('Erro ao gravar pedido no banco:', e); }
    }
    req.session.pedidosEmTransito = [...(req.session.pedidosEmTransito || []), ...pendentes];
    req.session.pedidosPendentes = [];
  }
  res.render('pages/pagamento-sucesso');
}

// POST /pagamento/concluir — comprador confirma o recebimento e move para "Concluídos"
async function concluirPedido(req, res) {
  const { index } = req.body;
  const emTransito = req.session.pedidosEmTransito || [];
  const item = emTransito[index];

  if (!item) {
    return res.status(400).json({ sucesso: false, erro: 'Pedido em trânsito não encontrado.' });
  }

  try {
    if (item.pedidoId) {
      await pedidoModel.marcarConcluido(item.pedidoId, req.session.userId);
    }
  } catch (e) { console.error('Erro ao marcar pedido como concluído no banco:', e); }

  req.session.pedidosConcluidos = [...(req.session.pedidosConcluidos || []), item];
  emTransito.splice(index, 1);
  req.session.pedidosEmTransito = emTransito;

  res.json({ sucesso: true });
}

// GET /pagamento/falha
function getFalha(req, res) {
  res.render('pages/pagamento-falha');
}

// GET /pagamento/pendente
function getPendente(req, res) {
  res.render('pages/pagamento-pendente');
}

// POST /pagamento/webhook
function webhook(req, res) {
  console.log('Notificação recebida do Mercado Pago');
  console.log(req.body);
  res.sendStatus(200);
}

module.exports = {
  getMinhasCompras,
  finalizarCompra,
  criarPagamento,
  pagarPendente,
  getSucesso,
  concluirPedido,
  getFalha,
  getPendente,
  webhook
};
