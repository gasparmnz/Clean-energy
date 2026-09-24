const produtosModel = require('../models/models.js');
const { notificacoesModel } = require('../models/models.js');
const cartModel = require('../models/cartModel');
const { preferenceClient } = require('../../config/mercadopago');

// GET /minhascompras
function getMinhasCompras(req, res) {
  const pendentes = req.session.pedidosPendentes || [];
  const concluidos = req.session.pedidosConcluidos || [];
  res.render('pages/minhascompras', { pendentes, concluidos });
}

// POST /minhascompras/finalizar — move itens do carrinho para pedidos pendentes na sessão
// (fluxo de "finalizar compra para pagar depois", independente do checkout imediato)
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

// Monta o corpo da preferência do Mercado Pago a partir de uma lista de itens do carrinho.
// Centralizado aqui para não duplicar a lógica de back_urls/auto_return entre
// criarPagamento e pagarPendente.
function montarPreferenceBody(req, items) {
  // Em produção (Render), usar sempre BASE_URL para não depender de
  // req.protocol/req.get('host'), que podem variar conforme proxy/headers.
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

  // auto_return só é aceito pelo Mercado Pago quando a back_url de sucesso
  // é uma URL pública (não localhost). Em desenvolvimento local ele é omitido.
  if (!isLocalhost) {
    preferenceBody.auto_return = 'approved';
  }

  return preferenceBody;
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

    const preferenceBody = montarPreferenceBody(req, items);

    const preference = await preferenceClient.create({
      body: preferenceBody
    });

    console.log('Preference criada!');
    console.log(preference);

    // IMPORTANTE: o carrinho NÃO é apagado aqui.
    // Ele só será removido quando o pagamento for de fato aprovado
    // (ver getSucesso), para que o comprador não perca os itens caso
    // desista do checkout, o pagamento seja recusado ou fique pendente.
    // Guardamos apenas uma cópia do que estava sendo pago, para o caso
    // de o pagamento ser aprovado e precisarmos limpar o carrinho e
    // registrar o pedido como concluído.
    req.session.checkoutEmAndamento = {
      userId: String(userId),
      cart,
      preferenceId: preference.id
    };

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

    const preferenceBody = montarPreferenceBody(req, items);

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
  try {
    // 1) Fluxo de checkout imediato (carrinho -> Mercado Pago -> aprovado).
    // Só agora, com o pagamento aprovado, o carrinho é de fato esvaziado
    // e o pedido é considerado concluído.
    const checkout = req.session.checkoutEmAndamento;
    if (checkout && Array.isArray(checkout.cart) && checkout.cart.length > 0) {
      const pool = require('../../config/pool_conexoes');
      await pool.query('DELETE FROM carrinho WHERE CAST(userId AS CHAR) = ?', [checkout.userId]);

      req.session.pedidosConcluidos = [...(req.session.pedidosConcluidos || []), ...checkout.cart];

      for (const item of checkout.cart) {
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
    req.session.checkoutEmAndamento = null;

    // 2) Fluxo de "pedidos pendentes" (finalizarCompra / pagarPendente),
    // já existente — mantido como estava.
    const pendentes = req.session.pedidosPendentes || [];
    if (pendentes.length > 0) {
      req.session.pedidosConcluidos = [...(req.session.pedidosConcluidos || []), ...pendentes];
      req.session.pedidosPendentes = [];
    }

    res.render('pages/pagamento-sucesso');
  } catch (err) {
    console.error('Erro ao processar retorno de sucesso do pagamento:', err);
    // Mesmo se algo falhar aqui, o pagamento já foi aprovado no Mercado Pago,
    // então ainda mostramos a página de sucesso ao comprador.
    res.render('pages/pagamento-sucesso');
  }
}

// GET /pagamento/falha
function getFalha(req, res) {
  // O comprador desistiu ou o pagamento foi recusado: o carrinho NUNCA foi
  // apagado (ver criarPagamento), então ele continua disponível em /carrinho.
  // Só descartamos a referência ao checkout que não foi concluído.
  req.session.checkoutEmAndamento = null;
  res.render('pages/pagamento-falha');
}

// GET /pagamento/pendente
function getPendente(req, res) {
  // Pagamento ainda em análise (ex.: boleto/Pix aguardando compensação).
  // O carrinho também não foi apagado neste caso. Mantemos o registro do
  // checkout em andamento na sessão, pois a confirmação definitiva deste
  // pagamento só chega depois, via /pagamento/webhook.
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
  getFalha,
  getPendente,
  webhook
};