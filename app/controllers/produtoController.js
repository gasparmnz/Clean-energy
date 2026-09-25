const produtosModel = require('../models/models.js');
const { vendedorModel, notificacoesModel } = require('../models/models.js');
const { arquivoParaDataUri } = require('../helpers/imagem');
const pedidoModel = require('../models/pedidoModel');

// GET / — vitrine pública de produtos, com filtros de busca
async function listarProdutos(req, res) {
  const { busca, estado, categoria, precoMin, precoMax } = req.query;
  try {
    const produtos = await produtosModel.findAllComFiltros({ busca, estado, categoria, precoMin, precoMax });
    res.render('pages/produtos', {
      produtos,
      filtros: { busca: busca || '', estado: estado || '', categoria: categoria || '', precoMin: precoMin || '', precoMax: precoMax || '' }
    });
  } catch (err) {
    console.error('Erro ao buscar produtos:', err.message);
    res.render('pages/produtos', { produtos: [], filtros: {} });
  }
}

// GET /cadastrar_produto
function getCadastrarProdutoForm(req, res) {
  res.render('pages/cadastrar_produto');
}

// POST /cadastrar_produto
async function postCadastrarProduto(req, res) {
  const { nome, descricao, preco, quantidade, categoria, cidade, bairro, rua, numero, complemento, estado } = req.body;
  const local = [cidade, bairro, rua, numero, complemento].filter(Boolean).join(', ');

  // Antes: nome do arquivo salvo em disco (req.file.filename).
  // Agora: a imagem vira uma data URI e é salva direto na coluna `imagem`.
  const imagem = req.file ? arquivoParaDataUri(req.file) : 'sem-foto.png';

  let precoLimpo = (preco || '0').toString().trim()
    .replace(/R\$\s*/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const precoNumerico = parseFloat(precoLimpo) || 0;

  let quantidadeLimpa = (quantidade || '0').toString().trim()
    .replace(/ t$/i, '')
    .replace(/\s/g, '')
    .replace(',', '.');
  const quantidadeNumerica = parseFloat(quantidadeLimpa) || 0;

  try {
    await produtosModel.create({ nome, descricao, preco: precoNumerico, quantidade: quantidadeNumerica, categoria, local, imagem, estado, usuario_id: req.session.userId });
    res.redirect('/listaprodutos');
  } catch (err) {
    console.error('Erro ao cadastrar produto:', err);
    res.status(500).send('Erro ao cadastrar produto. Tente novamente.');
  }
}

// GET /listaprodutos — produtos do vendedor logado
async function getListaProdutos(req, res) {
  try {
    const produtos = await produtosModel.findByUsuario(req.session.userId);
    res.render('pages/listaprodutos', { produtos });
  } catch (err) {
    console.error('Erro ao buscar produtos do usuário:', err);
    res.render('pages/listaprodutos', { produtos: [] });
  }
}

// GET /item/:id
async function getItem(req, res) {
  try {
    const produto = await produtosModel.findById(req.params.id);
    if (!produto) return res.status(404).send('Produto não encontrado');

    const avaliacoes = await produtosModel.findAvaliacoes(req.params.id);

    const mediaNotas = avaliacoes.length
      ? (avaliacoes.reduce((s, a) => s + (a.Nota || 0), 0) / avaliacoes.length).toFixed(1)
      : null;

    let vendedor = null;
    if (produto.usuario_id) {
      vendedor = await vendedorModel.findUsuarioById(produto.usuario_id);
      if (vendedor) {
        const avgData = await vendedorModel.findMediaAvaliacao(produto.usuario_id);
        vendedor.mediaAvaliacao = avgData.media || null;
        vendedor.totalAvaliacoes = avgData.total || 0;
        vendedor.totalProdutos = await vendedorModel.findTotalProdutos(produto.usuario_id);
      }
    }

    const usuarioSessao = req.session.userId
      ? { id: req.session.userId, nome: req.session.nomeUsuario, perfil: req.session.perfil }
      : null;

    // "Comprou" considera tanto pedidos já concluídos quanto em trânsito
    // (o pagamento já foi aprovado nos dois casos, só falta a entrega).
    // Consultado no banco (tabela `pedidos`), não na sessão.
    const comprou = await pedidoModel.comprouProduto(req.session.userId, req.params.id);

    res.render('pages/item', { produto, avaliacoes, mediaNotas, vendedor, usuario: usuarioSessao, comprou });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro interno do servidor');
  }
}

// POST /item/:id/avaliar
async function avaliarItem(req, res) {
  const produtoId = req.params.id;
  const { nota, comentario } = req.body;
  const notaNum = parseInt(nota, 10);

  if (!notaNum || notaNum < 1 || notaNum > 5) {
    return res.redirect(`/item/${produtoId}?erro=nota`);
  }

  const comprou = await pedidoModel.comprouProduto(req.session.userId, produtoId);
  if (!comprou) {
    return res.redirect(`/item/${produtoId}?erro=naocomprou`);
  }

  try {
    const jaAvaliou = await produtosModel.findAvaliacaoByUsuario(req.session.userId, produtoId);

    if (jaAvaliou) {
      await produtosModel.updateAvaliacao({ nota: notaNum, comentario, usuarioId: req.session.userId, produtoId });
    } else {
      await produtosModel.createAvaliacao({ nota: notaNum, comentario, usuarioId: req.session.userId, produtoId, nomeUsuario: req.session.nomeUsuario });
      try {
        const produto = await produtosModel.findById(produtoId);
        if (produto && produto.usuario_id && Number(produto.usuario_id) !== Number(req.session.userId)) {
          await notificacoesModel.criar({
            usuarioId: produto.usuario_id,
            tipo: 'nova_avaliacao',
            mensagem: `Seu produto "${produto.nome}" recebeu uma nova avaliação.`,
            link: `/item/${produtoId}#comentarios`
          });
        }
      } catch (e) { console.error('Erro ao notificar avaliação de produto:', e); }
    }

    res.redirect(`/item/${produtoId}#comentarios`);
  } catch (err) {
    console.error('Erro ao salvar avaliação:', err);
    res.redirect(`/item/${produtoId}?erro=salvar`);
  }
}

// ── Edição de produto pelo vendedor ──────────────────────────────────
// Mesmas regras do modal de edição (app/public/js/listaprodutos.js); o
// backend repete a validação porque é a autoridade final.
function validarEdicaoProduto(body) {
  const erros = {};
  const nome = String(body.nome ?? '').trim();
  const local = String(body.local ?? '').trim();
  const precoTexto = String(body.preco ?? '').replace(/R\$\s*/g, '').trim();
  const quantidadeTexto = String(body.quantidade ?? '').trim();

  if (!nome) erros.nome = 'O nome do produto é obrigatório.';
  else if (nome.length < 3) erros.nome = 'O nome deve ter pelo menos 3 caracteres.';
  else if (nome.length > 100) erros.nome = 'O nome não pode exceder 100 caracteres.';
  else if (!/^[a-zA-ZÀ-ÿ0-9\s]+$/.test(nome)) erros.nome = 'O nome deve conter apenas letras, números e espaços.';

  if (!local) erros.local = 'O endereço é obrigatório.';
  else if (local.length < 10) erros.local = 'O endereço deve ter pelo menos 10 caracteres.';
  else if (local.length > 200) erros.local = 'O endereço não pode exceder 200 caracteres.';
  else if (!local.includes(',') && !local.includes('-')) erros.local = 'O endereço deve conter vírgula ou hífen (Ex: Rua X, 123 - Cidade).';

  let preco = null;
  if (!precoTexto) erros.preco = 'O preço é obrigatório.';
  else if (!/^(\d{1,3}(\.\d{3})*|\d+)(,\d{2})?$/.test(precoTexto)) erros.preco = 'Formato inválido. Use: 1500,00 ou 1.500,00';
  else {
    preco = parseFloat(precoTexto.replace(/\./g, '').replace(',', '.'));
    if (!(preco > 0)) erros.preco = 'O preço deve ser maior que zero.';
    else if (preco > 999999.99) erros.preco = 'O preço não pode exceder R$ 999.999,99.';
  }

  let quantidade = null;
  const m = quantidadeTexto.match(/^(\d+(?:,\d+)?)\s*(Tonelada\(s\)|Kg|Quilograma\(s\)|Unidade\(s\))?$/i);
  if (!quantidadeTexto) erros.quantidade = 'A quantidade é obrigatória.';
  else if (!m) erros.quantidade = 'Formato inválido. Use: 20 Tonelada(s) ou apenas 20';
  else {
    quantidade = parseFloat(m[1].replace(',', '.'));
    if (!(quantidade > 0)) erros.quantidade = 'A quantidade deve ser maior que zero.';
    else if (quantidade > 10000) erros.quantidade = 'A quantidade não pode exceder 10.000 unidades.';
  }

  return { erros, dados: { nome, local, preco, quantidade } };
}

// PUT /produtos/:id — vendedor salva as alterações feitas no modal "Editar"
async function atualizarProduto(req, res) {
  try {
    const produtoId = parseInt(req.params.id, 10);
    if (!Number.isInteger(produtoId) || produtoId <= 0) {
      return res.status(400).json({ sucesso: false, erro: 'Produto inválido.' });
    }

    const produto = await produtosModel.findById(produtoId);
    if (!produto) {
      return res.status(404).json({ sucesso: false, erro: 'Produto não encontrado.' });
    }
    // O produto precisa ser do vendedor logado: trocar o ID na requisição
    // não permite editar produto de outra pessoa.
    if (String(produto.usuario_id) !== String(req.session.userId)) {
      return res.status(403).json({ sucesso: false, erro: 'Você não tem permissão para editar este produto.' });
    }

    const { erros, dados } = validarEdicaoProduto(req.body || {});
    if (Object.keys(erros).length > 0) {
      return res.status(400).json({ sucesso: false, erro: 'Corrija os campos destacados.', erros });
    }

    // Segunda trava no próprio SQL (WHERE id = ? AND usuario_id = ?).
    const resultado = await produtosModel.update(produtoId, dados, { usuarioId: req.session.userId });
    if (!resultado.affectedRows) {
      return res.status(403).json({ sucesso: false, erro: 'Você não tem permissão para editar este produto.' });
    }

    const atualizado = await produtosModel.findById(produtoId);
    return res.json({
      sucesso: true,
      produto: {
        id: atualizado.id,
        nome: atualizado.nome,
        local: atualizado.local,
        preco: Number(atualizado.preco),
        quantidade: atualizado.quantidade
      }
    });
  } catch (err) {
    console.error('Erro ao atualizar produto:', err);
    return res.status(500).json({ sucesso: false, erro: 'Não foi possível salvar as alterações. Tente novamente.' });
  }
}

// DELETE /produtos/:id
async function deleteProduto(req, res) {
  try {
    await produtosModel.delete(req.params.id);
    res.json({ success: true, message: 'Produto deletado com sucesso' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao deletar produto' });
  }
}

module.exports = {
  listarProdutos,
  getCadastrarProdutoForm,
  postCadastrarProduto,
  getListaProdutos,
  getItem,
  avaliarItem,
  atualizarProduto,
  deleteProduto
};
