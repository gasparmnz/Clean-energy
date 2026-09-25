let cardParaEditar = null;
const editarModal = new bootstrap.Modal(document.getElementById('editarModal'));

// Converte os valores crus do banco (ex.: "1500.00", "25.00") para o formato
// que o modal e a validação usam ("1.500,00", "25").
function formatarPrecoBR(valor) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatarQuantidadeBR(valor) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return String(valor ?? '');
  return String(Number(n.toFixed(2))).replace('.', ',');
}


// Validação em Tempo Real

const validationState = {
  nome: false,
  endereco: false,
  preco: false,
  quantidade: false
};

// Função para validar o campo Nome
function validarNome(valor) {
  const errorElement = document.getElementById('errorNome');
  const inputElement = document.getElementById('editarNome');
  
  valor = valor.trim();
  
  if (valor.length === 0) {
    mostrarErro(inputElement, errorElement, 'O nome do produto é obrigatório.');
    return false;
  }
  
  if (valor.length < 3) {
    mostrarErro(inputElement, errorElement, 'O nome deve ter pelo menos 3 caracteres.');
    return false;
  }
  
  if (valor.length > 100) {
    mostrarErro(inputElement, errorElement, 'O nome não pode exceder 100 caracteres.');
    return false;
  }

  const regex = /^[a-zA-ZÀ-ÿ0-9\s]+$/;
  if (!regex.test(valor)) {
    mostrarErro(inputElement, errorElement, 'O nome deve conter apenas letras, números e espaços.');
    return false;
  }
  
  mostrarSucesso(inputElement, errorElement);
  return true;
}

// Endereco
function validarEndereco(valor) {
  const errorElement = document.getElementById('errorEndereco');
  const inputElement = document.getElementById('editarEndereco');
  
  valor = valor.trim();
  
  if (valor.length === 0) {
    mostrarErro(inputElement, errorElement, 'O endereço é obrigatório.');
    return false;
  }
  
  if (valor.length < 10) {
    mostrarErro(inputElement, errorElement, 'O endereço deve ter pelo menos 10 caracteres.');
    return false;
  }
  
  if (valor.length > 200) {
    mostrarErro(inputElement, errorElement, 'O endereço não pode exceder 200 caracteres.');
    return false;
  }

  if (!valor.includes(',') && !valor.includes('-')) {
    mostrarErro(inputElement, errorElement, 'O endereço deve conter vírgula ou hífen (Ex: Rua X, 123 - Cidade).');
    return false;
  }
  
  mostrarSucesso(inputElement, errorElement);
  return true;
}

// Preco
function validarPreco(valor) {
  const errorElement = document.getElementById('errorPreco');
  const inputElement = document.getElementById('editarPreco');
  
  valor = valor.trim();
  
  if (valor.length === 0) {
    mostrarErro(inputElement, errorElement, 'O preço é obrigatório.');
    return false;
  }
  
  valor = valor.replace(/R\$\s*/g, '').trim();

  const regexPreco = /^(\d{1,3}(\.\d{3})*|\d+)(,\d{2})?$/;
  if (!regexPreco.test(valor)) {
    mostrarErro(inputElement, errorElement, 'Formato inválido. Use: 1500,00 ou 1.500,00');
    return false;
  }

  const valorNumerico = parseFloat(valor.replace(/\./g, '').replace(',', '.'));
  
  if (valorNumerico <= 0) {
    mostrarErro(inputElement, errorElement, 'O preço deve ser maior que zero.');
    return false;
  }
  
  if (valorNumerico > 999999.99) {
    mostrarErro(inputElement, errorElement, 'O preço não pode exceder R$ 999.999,99.');
    return false;
  }
  
  mostrarSucesso(inputElement, errorElement);
  return true;
}

// Quantidade
function validarQuantidade(valor) {
  const errorElement = document.getElementById('errorQuantidade');
  const inputElement = document.getElementById('editarQuantidade');
  
  valor = valor.trim();
  
  if (valor.length === 0) {
    mostrarErro(inputElement, errorElement, 'A quantidade é obrigatória.');
    return false;
  }
  
  const regexQuantidade = /^(\d+(?:,\d+)?)\s*(Tonelada\(s\)|Kg|Quilograma\(s\)|Unidade\(s\))?$/i;
  const match = valor.match(regexQuantidade);
  
  if (!match) {
    mostrarErro(inputElement, errorElement, 'Formato inválido. Use: 20 Tonelada(s) ou apenas 20');
    return false;
  }
  
  const quantidade = parseFloat(match[1].replace(',', '.'));
  
  if (quantidade <= 0) {
    mostrarErro(inputElement, errorElement, 'A quantidade deve ser maior que zero.');
    return false;
  }
  
  if (quantidade > 10000) {
    mostrarErro(inputElement, errorElement, 'A quantidade não pode exceder 10.000 unidades.');
    return false;
  }
  
  mostrarSucesso(inputElement, errorElement);
  return true;
}

function mostrarErro(inputElement, errorElement, mensagem) {
  inputElement.classList.add('is-invalid');
  inputElement.classList.remove('is-valid');
  errorElement.textContent = mensagem;
  errorElement.style.display = 'block';
}

function mostrarSucesso(inputElement, errorElement) {
  inputElement.classList.remove('is-invalid');
  inputElement.classList.add('is-valid');
  errorElement.textContent = '';
  errorElement.style.display = 'none';
}

function verificarFormularioValido() {
  const todosValidos = Object.values(validationState).every(estado => estado === true);
  const salvarBtn = document.getElementById('salvarEdicaoBtn');
  
  if (todosValidos) {
    salvarBtn.disabled = false;
    salvarBtn.classList.remove('btn-disabled');
  } else {
    salvarBtn.disabled = true;
    salvarBtn.classList.add('btn-disabled');
  }
}


// NOME
document.getElementById('editarNome').addEventListener('input', function(e) {
  validationState.nome = validarNome(e.target.value);
  verificarFormularioValido();
});

//ENdereco
document.getElementById('editarEndereco').addEventListener('input', function(e) {
  validationState.endereco = validarEndereco(e.target.value);
  verificarFormularioValido();
});

// Preco
document.getElementById('editarPreco').addEventListener('input', function(e) {
  validationState.preco = validarPreco(e.target.value);
  verificarFormularioValido();
});

// QUAntidade
document.getElementById('editarQuantidade').addEventListener('input', function(e) {
  validationState.quantidade = validarQuantidade(e.target.value);
  verificarFormularioValido();
});


document.getElementById('editarNome').addEventListener('blur', function(e) {
  validationState.nome = validarNome(e.target.value);
  verificarFormularioValido();
});

document.getElementById('editarEndereco').addEventListener('blur', function(e) {
  validationState.endereco = validarEndereco(e.target.value);
  verificarFormularioValido();
});

document.getElementById('editarPreco').addEventListener('blur', function(e) {
  validationState.preco = validarPreco(e.target.value);
  verificarFormularioValido();
});

document.getElementById('editarQuantidade').addEventListener('blur', function(e) {
  validationState.quantidade = validarQuantidade(e.target.value);
  verificarFormularioValido();
});


// Exclusão: continua sendo feita por /js/produto-delete.js (confirmação +
// DELETE /produtos/:id). O antigo handler daqui só removia o card da tela,
// sem apagar no banco, e nunca chegava a rodar (o script falhava ao
// carregar); foi retirado para a exclusão continuar funcionando como hoje.


// Funcionalidade de Edição

document.querySelectorAll('.btn-warning').forEach(btn => {
  btn.addEventListener('click', function() {
    cardParaEditar = this.closest('.produto-card');
    esconderErroGeral();

    // Valores reais do produto (data-* do card), no formato aceito pela validação.
    const nome = cardParaEditar.dataset.nome ?? cardParaEditar.querySelector('h3').textContent;
    const endereco = cardParaEditar.dataset.local ?? cardParaEditar.querySelector('.endereco').textContent;
    const preco = formatarPrecoBR(cardParaEditar.dataset.preco);
    const quantidade = formatarQuantidadeBR(cardParaEditar.dataset.quantidade);


    document.getElementById('editarNome').value = nome;
    document.getElementById('editarEndereco').value = endereco;
    document.getElementById('editarPreco').value = preco;
    document.getElementById('editarQuantidade').value = quantidade;

    validationState.nome = validarNome(nome);
    validationState.endereco = validarEndereco(endereco);
    validationState.preco = validarPreco(preco);
    validationState.quantidade = validarQuantidade(quantidade);
    
    verificarFormularioValido();
    
    editarModal.show();
  });
});

// Mensagem de erro geral do modal (falha ao salvar no servidor).
function mostrarErroGeral(mensagem) {
  let el = document.getElementById('erroSalvarProduto');
  if (!el) {
    el = document.createElement('p');
    el.id = 'erroSalvarProduto';
    el.className = 'text-danger mt-2 mb-0';
    el.setAttribute('role', 'alert');
    document.getElementById('formEditarProduto').appendChild(el);
  }
  el.textContent = mensagem;
  el.style.display = 'block';
}
function esconderErroGeral() {
  const el = document.getElementById('erroSalvarProduto');
  if (el) { el.textContent = ''; el.style.display = 'none'; }
}

// Campos do backend -> input/erro do modal
const CAMPOS_EDICAO = {
  nome: ['editarNome', 'errorNome'],
  local: ['editarEndereco', 'errorEndereco'],
  preco: ['editarPreco', 'errorPreco'],
  quantidade: ['editarQuantidade', 'errorQuantidade']
};

// Salvar alterações: envia ao backend (PUT /produtos/:id), que valida,
// confere se o produto é do vendedor logado e grava no MySQL. O card só é
// atualizado depois da resposta positiva, com os valores que o banco salvou.
document.getElementById('salvarEdicaoBtn').addEventListener('click', async function() {
  if (!cardParaEditar) return;

  const nomeValido = validarNome(document.getElementById('editarNome').value);
  const enderecoValido = validarEndereco(document.getElementById('editarEndereco').value);
  const precoValido = validarPreco(document.getElementById('editarPreco').value);
  const quantidadeValido = validarQuantidade(document.getElementById('editarQuantidade').value);
  if (!(nomeValido && enderecoValido && precoValido && quantidadeValido)) return;

  const botao = this;
  const textoOriginal = botao.textContent;
  botao.disabled = true;
  botao.textContent = 'Salvando...';
  esconderErroGeral();

  const card = cardParaEditar;
  try {
    const resposta = await fetch('/produtos/' + encodeURIComponent(card.dataset.id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        nome: document.getElementById('editarNome').value,
        local: document.getElementById('editarEndereco').value,
        preco: document.getElementById('editarPreco').value,
        quantidade: document.getElementById('editarQuantidade').value
      })
    });

    if (resposta.redirected && resposta.url.includes('/login')) {
      window.location.href = '/login';
      return;
    }

    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok || !dados.sucesso) {
      if (dados.erros) {
        Object.entries(dados.erros).forEach(([campo, mensagem]) => {
          const ids = CAMPOS_EDICAO[campo];
          if (ids) mostrarErro(document.getElementById(ids[0]), document.getElementById(ids[1]), mensagem);
        });
      }
      throw new Error(dados.erro || 'Não foi possível salvar as alterações.');
    }

    // Atualiza o card com o que foi realmente gravado no banco.
    const p = dados.produto;
    card.dataset.nome = p.nome;
    card.dataset.local = p.local || '';
    card.dataset.preco = p.preco;
    card.dataset.quantidade = p.quantidade;
    card.querySelector('h3').textContent = p.nome;
    card.querySelector('.endereco').textContent = p.local || '';
    card.querySelector('.preco').textContent = 'R$ ' + formatarPrecoBR(p.preco);
    card.querySelector('.quantidade').textContent = p.quantidade;
    const img = card.querySelector('img');
    if (img) img.alt = p.nome;

    editarModal.hide();
    if (typeof mostrarNotificacao === 'function') {
      mostrarNotificacao('✓ Produto atualizado com sucesso!', 'success');
    }
  } catch (erro) {
    mostrarErroGeral(erro.message);
  } finally {
    botao.textContent = textoOriginal;
    verificarFormularioValido();
  }
});


document.getElementById('editarModal').addEventListener('hidden.bs.modal', function () {
  document.querySelectorAll('.form-control').forEach(input => {
    input.classList.remove('is-valid', 'is-invalid');
  });
  
  document.querySelectorAll('.error-message').forEach(error => {
    error.style.display = 'none';
    error.textContent = '';
  });

  validationState.nome = false;
  validationState.endereco = false;
  validationState.preco = false;
  validationState.quantidade = false;
  
  verificarFormularioValido();
});

