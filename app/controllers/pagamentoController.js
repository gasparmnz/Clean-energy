const produtosModel = require('../models/models.js');
const { notificacoesModel } = require('../models/models.js');
const cartModel = require('../models/cartModel');
const pedidoModel = require('../models/pedidoModel');
const { preferenceClient, paymentClient, merchantOrderClient } = require('../../config/mercadopago');

// Tempo máximo de cada chamada à API do Mercado Pago feita durante uma
// requisição do usuário (retorno de pagamento / abrir Minhas Compras).
const MP_TIMEOUT_MS = 8000;

// O endereço do produto é gravado em `local` (e copiado para
// pedidos.produto_local) no formato "cidade, bairro, rua, número,
// complemento" — ver produtoController.postCadastrarProduto, que faz
// [cidade, bairro, rua, numero, complemento].filter(Boolean).join(', ').
// Aqui desmontamos de volta para exibir o endereço completo campo a campo.
// Se o texto não tiver pelo menos cidade/bairro/rua/número (cadastros
// antigos ou fora do padrão), devolvemos só o texto completo.
function montarEndereco(local, estado) {
  const texto = (local || '').trim();
  const partes = texto ? texto.split(',').map(p => p.trim()).filter(Boolean) : [];

  if (partes.length >= 4) {
    return {
      cidade: partes[0],
      estado: estado || '',
      bairro: partes[1],
      rua: partes[2],
      numero: partes[3],
      complemento: partes.slice(4).join(', '),
      completo: texto
    };
  }

  return { cidade: '', estado: estado || '', bairro: '', rua: '', numero: '', complemento: '', completo: texto };
}

// Adapta uma linha da tabela `pedidos` para o formato que as views já
// esperavam (mesmos nomes de campo que os itens do carrinho usavam:
// nome, imagem, local, preco, quantidade).
function mapPedidoParaView(pedido) {
  const local = pedido.produto_local || pedido.produto_local_atual || '';
  return {
    id: pedido.id,
    productId: pedido.produto_id,
    nome: pedido.produto_nome,
    imagem: pedido.produto_imagem || pedido.produto_imagem_atual || null,
    local,
    endereco: montarEndereco(local, pedido.produto_estado),
    preco: pedido.valor_unitario,
    quantidade: pedido.quantidade
  };
}

// Notifica o vendedor de um pedido pago (usado tanto no checkout imediato
// quanto no fluxo de "pagar pendente" e no de "finalizar compra").
async function notificarVendedor(item) {
  try {
    const produtoId = item.productId ?? item.produto_id;
    const nome = item.nome ?? item.produto_nome;
    const produto = await produtosModel.findById(produtoId);
    if (produto && produto.usuario_id) {
      await notificacoesModel.criar({
        usuarioId: produto.usuario_id,
        tipo: 'novo_pedido',
        mensagem: `Novo pedido recebido: ${nome}`,
        link: '/listaprodutos'
      });
    }
  } catch (e) { console.error('Erro ao notificar vendedor sobre novo pedido:', e); }
}

// GET /minhascompras
async function getMinhasCompras(req, res) {
  try {
    const userId = req.session.userId;

    // Antes de listar, confere no Mercado Pago se algum pedido ainda
    // "pendente" já foi pago (ex.: Pix aprovado depois do retorno, ou
    // ambiente local, onde o webhook não chega). Falhas aqui não impedem a
    // página de abrir.
    await reconciliarPendentesDoComprador(userId);

    const [pendentes, emTransito, concluidos] = await Promise.all([
      pedidoModel.listarPorComprador(userId, 'pendente'),
      pedidoModel.listarPorComprador(userId, 'em_transito'),
      pedidoModel.listarPorComprador(userId, 'concluido')
    ]);
    res.render('pages/minhascompras', {
      pendentes: pendentes.map(mapPedidoParaView),
      emTransito: emTransito.map(mapPedidoParaView),
      concluidos: concluidos.map(mapPedidoParaView)
    });
  } catch (err) {
    console.error('Erro ao carregar minhas compras:', err);
    res.render('pages/minhascompras', { pendentes: [], emTransito: [], concluidos: [] });
  }
}

// POST /minhascompras/finalizar — move itens do carrinho para pedidos pendentes
// no banco (fluxo de "finalizar compra para pagar depois", independente do
// checkout imediato pelo carrinho).
async function finalizarCompra(req, res) {
  try {
    const userId = req.session.userId;
    const cart = await cartModel.getCartByUser(userId);
    if (cart && cart.length > 0) {
      await pedidoModel.criarPendentes(userId, cart, null);

      const pool = require('../../config/pool_conexoes');
      await pool.query('DELETE FROM carrinho WHERE userId = ?', [userId]);

      for (const item of cart) {
        await notificarVendedor(item);
      }
    }
    res.redirect('/minhascompras');
  } catch (err) {
    console.error('Erro ao finalizar compra:', err);
    res.redirect('/carrinho');
  }
}

// Monta o corpo da preferência do Mercado Pago a partir de uma lista de itens.
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

// ---------------------------------------------------------------------------
// CONFIRMAÇÃO DE PAGAMENTO (Mercado Pago)
//
// Toda mudança pendente -> em_transito passa por aqui, seja vinda do
// retorno do navegador (/pagamento/sucesso), do webhook
// (/pagamento/webhook) ou da reconciliação ao abrir /minhascompras. Em
// nenhum caso confiamos só no que veio na URL/corpo: o status é sempre
// consultado na API do Mercado Pago com o nosso access token.
// ---------------------------------------------------------------------------

// O Mercado Pago às vezes manda os parâmetros como a string "null".
function limparId(valor) {
  if (valor === undefined || valor === null) return null;
  const texto = String(valor).trim();
  if (!texto || texto === 'null' || texto === 'undefined') return null;
  return texto;
}

function temPagamentoAprovado(merchantOrder) {
  return Array.isArray(merchantOrder && merchantOrder.payments) &&
    merchantOrder.payments.some(p => p && p.status === 'approved');
}

// Consulta o Mercado Pago e devolve { preferenceId, aprovado, status }.
//  - paymentId: GET /v1/payments/:id  -> status real do pagamento; a
//    preferência é descoberta pela merchant_order do pagamento
//    (payment.order.id -> merchant_order.preference_id).
//  - merchantOrderId: GET /merchant_orders/:id -> preference_id + lista de
//    pagamentos com status.
//  - preferenceId sozinho: busca as merchant_orders daquela preferência.
// `preferenceEsperada` (a que veio na URL de retorno) é comparada com a
// preferência real do pagamento, para impedir que alguém use o payment_id
// aprovado de outra compra para "pagar" um pedido seu.
async function consultarPagamentoMP({ paymentId, merchantOrderId, preferenceId }) {
  paymentId = limparId(paymentId);
  merchantOrderId = limparId(merchantOrderId);
  const preferenceEsperada = limparId(preferenceId);
  const requestOptions = { timeout: MP_TIMEOUT_MS };

  if (paymentId) {
    const pagamento = await paymentClient.get({ id: paymentId, requestOptions });
    const status = pagamento.status;
    const moId = (pagamento.order && pagamento.order.id) || merchantOrderId;

    const externalReference = pagamento.external_reference || null;

    let preferenceReal = null;
    if (moId) {
      const mo = await merchantOrderClient.get({ merchantOrderId: moId, requestOptions });
      preferenceReal = mo.preference_id || null;
    }

    if (!preferenceReal) {
      return { preferenceId: null, externalReference, aprovado: false, status };
    }
    if (preferenceEsperada && preferenceEsperada !== preferenceReal) {
      console.warn('[MP] payment_id não pertence à preferência informada:', { paymentId, preferenceEsperada, preferenceReal });
      return { preferenceId: null, externalReference: null, aprovado: false, status: 'divergente' };
    }
    return { preferenceId: preferenceReal, externalReference, aprovado: status === 'approved', status };
  }

  if (merchantOrderId) {
    const mo = await merchantOrderClient.get({ merchantOrderId, requestOptions });
    const preferenceReal = mo.preference_id || null;
    if (preferenceEsperada && preferenceReal && preferenceEsperada !== preferenceReal) {
      return { preferenceId: null, externalReference: null, aprovado: false, status: 'divergente' };
    }
    const aprovado = temPagamentoAprovado(mo);
    return {
      preferenceId: preferenceReal,
      externalReference: mo.external_reference || null,
      aprovado,
      status: aprovado ? 'approved' : (mo.order_status || mo.status)
    };
  }

  if (preferenceEsperada) {
    const busca = await merchantOrderClient.search({ options: { preference_id: preferenceEsperada }, requestOptions });
    const ordens = (busca && busca.elements) || [];
    const aprovado = ordens.some(temPagamentoAprovado);
    return { preferenceId: preferenceEsperada, aprovado, status: aprovado ? 'approved' : (ordens.length ? 'pending' : 'sem_pagamento') };
  }

  return { preferenceId: null, aprovado: false, status: null };
}

// Efeitos de um pagamento aprovado: pendente -> em_transito, remove os
// produtos pagos do carrinho do comprador e notifica os vendedores.
// Idempotente: pedidoModel.confirmarPagamentoPorPreference só devolve os
// pedidos para a primeira chamada que os mudou de status; as demais
// (webhook repetido, usuário recarregando /pagamento/sucesso, etc.)
// recebem [] e não repetem remoção nem notificação.
function pedidoIdDaReferencia(externalReference) {
  const m = /^pedido:(\d+)$/.exec(String(externalReference || ''));
  return m ? Number(m[1]) : null;
}

async function aplicarPagamentoAprovado(preferenceId, externalReference = null) {
  const confirmados = await pedidoModel.confirmarPagamentoPorPreference(
    preferenceId,
    pedidoIdDaReferencia(externalReference)
  );
  if (confirmados.length === 0) return confirmados;

  console.log('>>> Pedidos confirmados como em_transito:', confirmados.map(p => p.id), 'preference:', preferenceId);

  const porComprador = new Map();
  for (const pedido of confirmados) {
    const lista = porComprador.get(pedido.comprador_id) || [];
    lista.push(pedido.produto_id);
    porComprador.set(pedido.comprador_id, lista);
  }
  for (const [compradorId, produtoIds] of porComprador) {
    try {
      await cartModel.removerProdutos(compradorId, produtoIds);
    } catch (e) {
      console.error('Erro ao remover produtos pagos do carrinho:', e);
    }
  }

  for (const pedido of confirmados) {
    await notificarVendedor(pedido);
  }

  return confirmados;
}

// Consulta + aplica. Devolve o resultado da consulta e os pedidos que
// foram efetivamente confirmados nesta chamada.
async function verificarEConfirmarPagamento(ids) {
  const resultado = await consultarPagamentoMP(ids);
  let confirmados = [];
  if (resultado.aprovado && resultado.preferenceId) {
    confirmados = await aplicarPagamentoAprovado(resultado.preferenceId, resultado.externalReference);
  }
  return { ...resultado, confirmados };
}

// Reconciliação ao abrir /minhascompras (limitada às preferências mais
// recentes para não atrasar a página).
async function reconciliarPendentesDoComprador(userId) {
  try {
    const preferences = await pedidoModel.listarPreferencesPendentes(userId);
    for (const preferenceId of preferences) {
      try {
        await verificarEConfirmarPagamento({ preferenceId });
      } catch (e) {
        console.error('[MP] Falha ao reconciliar preferência', preferenceId, '-', e.message);
      }
    }
  } catch (e) {
    console.error('[MP] Falha ao listar pedidos pendentes para reconciliar:', e.message);
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

    // Exatamente os itens do carrinho gravado no banco — o mesmo que
    // GET /carrinho exibe (quantidade normalizada do mesmo jeito).
    const items = cart.map(item => ({
      id: String(item.productId),
      title: item.nome,
      quantity: cartModel.normalizarQuantidade(item.quantidade),
      currency_id: 'BRL',
      unit_price: Math.round(Number(item.preco) * 100) / 100
    }));

    // Validação + log do que vai para o Mercado Pago.
    const invalidos = items.filter(i => !i.id || !Number.isInteger(i.quantity) || i.quantity < 1 ||
      !Number.isFinite(i.unit_price) || i.unit_price <= 0);
    if (invalidos.length > 0) {
      console.error('>>> Itens inválidos no carrinho, checkout cancelado:', invalidos);
      return res.status(400).json({
        sucesso: false,
        erro: 'Há um item com preço ou quantidade inválidos no carrinho. Remova-o e tente novamente.'
      });
    }
    const totalCheckout = items.reduce((soma, i) => soma + i.unit_price * i.quantity, 0);
    console.log('>>> Itens enviados ao Mercado Pago (usuário ' + userId + '):');
    console.table(items.map(i => ({
      produto: `${i.title} (#${i.id})`,
      quantidade: i.quantity,
      preco_unitario: i.unit_price.toFixed(2),
      subtotal: (i.unit_price * i.quantity).toFixed(2)
    })));
    console.log('>>> Total do checkout: R$ ' + totalCheckout.toFixed(2));

    const preferenceBody = montarPreferenceBody(req, items);

    const preference = await preferenceClient.create({
      body: preferenceBody
    });

    console.log('Preference criada!', preference.id);

    // IMPORTANTE: o carrinho NÃO é apagado aqui — só quando o pagamento for
    // de fato aprovado (ver getSucesso). Em vez de guardar isso na sessão
    // (que pode se perder entre o momento em que o comprador sai para o
    // Mercado Pago e o momento em que ele volta — é exatamente isso que
    // fazia o pedido nunca chegar em "em trânsito"), gravamos o pedido como
    // "pendente" direto no banco, vinculado ao ID da preferência. O Mercado
    // Pago devolve esse mesmo preference_id como query string nas back_urls,
    // então conseguimos encontrar o pedido de novo mesmo sem sessão.
    if (req.session.userId) {
      await pedidoModel.criarPendentes(
        req.session.userId,
        cart.map(item => ({ ...item, quantidade: cartModel.normalizarQuantidade(item.quantidade) })),
        preference.id
      );
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
    const userId = req.session.userId;
    const pedidoId = req.body.id;
    const pedido = await pedidoModel.buscarPorId(pedidoId);

    if (!pedido || String(pedido.comprador_id) !== String(userId) || pedido.status !== 'pendente') {
      return res.status(400).json({
        sucesso: false,
        erro: 'Pedido pendente não encontrado.'
      });
    }

    const items = [{
      id: String(pedido.produto_id),
      title: pedido.produto_nome,
      quantity: pedido.quantidade,
      currency_id: 'BRL',
      unit_price: Number(pedido.valor_unitario)
    }];

    const preferenceBody = montarPreferenceBody(req, items);
    // Identifica o pedido dentro do próprio pagamento (ver
    // aplicarPagamentoAprovado): se o comprador clicar em "Efetuar
    // Pagamento" mais de uma vez, o preference_id do pedido é trocado, mas
    // um pagamento aprovado de uma tentativa anterior ainda encontra o
    // pedido por aqui.
    preferenceBody.external_reference = `pedido:${pedido.id}`;

    const preference = await preferenceClient.create({
      body: preferenceBody
    });

    await pedidoModel.definirPreferenceId(pedido.id, preference.id);

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
// O Mercado Pago redireciona para cá com ?payment_id (ou collection_id),
// &merchant_order_id, &preference_id, &status... Esses valores vêm do
// navegador e podem ser forjados, então só servem para saber O QUE
// consultar: o status real é conferido na API antes de mudar o pedido.
async function getSucesso(req, res) {
  console.log('>>> RETORNO /pagamento/sucesso — query recebida:', req.query);

  const ids = {
    paymentId: req.query.payment_id || req.query.collection_id,
    merchantOrderId: req.query.merchant_order_id,
    preferenceId: req.query.preference_id
  };

  try {
    const resultado = await verificarEConfirmarPagamento(ids);
    console.log('>>> Verificação do pagamento no Mercado Pago:', {
      status: resultado.status,
      aprovado: resultado.aprovado,
      confirmadosAgora: resultado.confirmados.map(p => p.id)
    });

    if (!resultado.aprovado && ['pending', 'in_process', 'authorized', 'in_mediation'].includes(resultado.status)) {
      // Ainda em análise: o pedido continua pendente e será confirmado
      // pelo webhook (ou ao abrir Minhas Compras) quando for aprovado.
      return res.render('pages/pagamento-pendente');
    }
  } catch (err) {
    // Não conseguimos consultar o Mercado Pago agora (timeout, API fora do
    // ar...). O pedido NÃO é alterado aqui; o webhook ou a próxima
    // abertura de /minhascompras vão confirmar quando possível.
    console.error('Erro ao verificar pagamento no retorno de sucesso:', err.message || err);
  }

  res.render('pages/pagamento-sucesso');
}

// GET /pagamento/falha
async function getFalha(req, res) {
  try {
    // O comprador desistiu ou o pagamento foi recusado: o carrinho NUNCA foi
    // apagado (ver criarPagamento), então ele continua disponível em
    // /carrinho. Só marcamos o pedido pendente como cancelado, para não
    // ficar poluindo a aba "Pendentes"/o painel admin para sempre.
    console.log('>>> RETORNO /pagamento/falha — query recebida:', req.query);
    const preferenceId = req.query.preference_id;
    await pedidoModel.atualizarStatusPorPreference(preferenceId, 'pendente', 'cancelado');
  } catch (err) {
    console.error('Erro ao registrar cancelamento do pedido:', err);
  }
  res.render('pages/pagamento-falha');
}

// GET /pagamento/pendente
async function getPendente(req, res) {
  // Pagamento ainda em análise (ex.: boleto/Pix aguardando compensação).
  // O carrinho também não foi apagado neste caso, e o pedido continua
  // "pendente" no banco até a confirmação pelo webhook
  // (/pagamento/webhook) ou pela reconciliação ao abrir /minhascompras.
  // Se por acaso o pagamento já estiver aprovado quando o comprador
  // voltar, já confirmamos aqui (a verificação é feita na API do MP).
  try {
    const paymentId = req.query.payment_id || req.query.collection_id;
    if (limparId(paymentId) || limparId(req.query.merchant_order_id)) {
      const resultado = await verificarEConfirmarPagamento({
        paymentId,
        merchantOrderId: req.query.merchant_order_id,
        preferenceId: req.query.preference_id
      });
      if (resultado.aprovado) {
        return res.render('pages/pagamento-sucesso');
      }
    }
  } catch (err) {
    console.error('Erro ao verificar pagamento no retorno pendente:', err.message || err);
  }
  res.render('pages/pagamento-pendente');
}

// POST /minhascompras/cancelar — comprador cancela um pedido que ainda não
// foi pago (aba "Pendentes").
async function cancelarPendente(req, res) {
  try {
    const userId = req.session.userId;
    const pedidoId = req.body.id;

    const sucesso = await pedidoModel.cancelarPendente(userId, pedidoId);
    if (!sucesso) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Pedido pendente não encontrado.'
      });
    }

    res.json({ sucesso: true });
  } catch (err) {
    console.error('Erro ao cancelar pedido:', err);
    res.status(500).json({ sucesso: false, erro: err.message });
  }
}

// POST /minhascompras/confirmar-recebimento — comprador confirma que recebeu
// o produto, movendo o pedido de "em trânsito" para "concluído".
async function confirmarRecebimento(req, res) {
  try {
    const userId = req.session.userId;
    const pedidoId = req.body.id;

    const sucesso = await pedidoModel.confirmarRecebimento(userId, pedidoId);
    if (!sucesso) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Pedido em trânsito não encontrado.'
      });
    }

    res.json({ sucesso: true });
  } catch (err) {
    console.error('Erro ao confirmar recebimento:', err);
    res.status(500).json({ sucesso: false, erro: err.message });
  }
}

// POST /pagamento/webhook
// Aceita os dois formatos que o Mercado Pago usa:
//  - Webhooks: corpo JSON { type: 'payment', action: 'payment.updated',
//    data: { id } } e/ou query ?type=payment&data.id=...
//  - IPN (legado): query ?topic=payment|merchant_order&id=... e corpo
//    { resource, topic }.
// O corpo da notificação NÃO é tratado como prova de pagamento — ele só diz
// qual pagamento/merchant_order consultar na API.
async function webhook(req, res) {
  const body = req.body || {};
  const query = req.query || {};

  const tipo = String(body.type || body.topic || query.type || query.topic || '').toLowerCase();

  let id = (body.data && body.data.id) || query['data.id'] || query.id || body.id || null;
  if (!id && body.resource) {
    // IPN de merchant_order manda "https://api.mercadolibre.com/merchant_orders/123"
    id = String(body.resource).split('/').filter(Boolean).pop();
  }

  console.log('>>> Webhook Mercado Pago recebido:', { tipo, id, action: body.action });

  let ids = null;
  if (tipo === 'payment' || tipo.startsWith('payment')) {
    ids = { paymentId: id };
  } else if (tipo === 'merchant_order' || tipo === 'topic_merchant_order_wh') {
    ids = { merchantOrderId: id };
  }

  if (!ids || !limparId(id)) {
    // Outros tópicos (chargebacks, planos...) ou notificação sem id: nada a fazer.
    return res.sendStatus(200);
  }

  try {
    const resultado = await verificarEConfirmarPagamento(ids);
    console.log('>>> Webhook processado:', {
      status: resultado.status,
      aprovado: resultado.aprovado,
      preferenceId: resultado.preferenceId,
      confirmadosAgora: resultado.confirmados.map(p => p.id)
    });
    return res.sendStatus(200);
  } catch (err) {
    const httpStatus = err && (err.status || (err.cause && err.cause.status));
    if (httpStatus === 404) {
      // Id inexistente (ex.: notificação de teste do painel do MP).
      console.warn('>>> Webhook: recurso não encontrado no Mercado Pago:', ids);
      return res.sendStatus(200);
    }
    // Erro temporário: responder != 2xx faz o Mercado Pago reenviar depois.
    console.error('Erro ao processar webhook do Mercado Pago:', err.message || err);
    return res.sendStatus(500);
  }
}

module.exports = {
  getMinhasCompras,
  finalizarCompra,
  criarPagamento,
  pagarPendente,
  getSucesso,
  getFalha,
  getPendente,
  cancelarPendente,
  confirmarRecebimento,
  webhook
};