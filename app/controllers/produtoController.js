const produtosModel = require('../models/models.js');
const { vendedorModel, notificacoesModel } = require('../models/models.js');
const { arquivoParaDataUri } = require('../helpers/imagem');

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

    res.render('pages/item', { produto, avaliacoes, mediaNotas, vendedor, usuario: usuarioSessao });
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
  deleteProduto
};
