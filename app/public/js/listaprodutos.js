// ===================================
// Variáveis Globais
// ===================================
let cardParaExcluir = null;
let cardParaEditar = null;
const excluirModal = new bootstrap.Modal(document.getElementById('excluirModal'));
const editarModal = new bootstrap.Modal(document.getElementById('editarModal'));

// ===================================
// Validação em Tempo Real
// ===================================

// Objeto para armazenar o estado de validação de cada campo
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
  
  // Remove espaços em branco no início e fim
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
  
  // Verifica se contém apenas letras, números e espaços
  const regex = /^[a-zA-ZÀ-ÿ0-9\s]+$/;
  if (!regex.test(valor)) {
    mostrarErro(inputElement, errorElement, 'O nome deve conter apenas letras, números e espaços.');
    return false;
  }
  
  mostrarSucesso(inputElement, errorElement);
  return true;
}

// Função para validar o campo Endereço
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
  
  // Verifica se contém pelo menos uma vírgula ou hífen (formato de endereço)
  if (!valor.includes(',') && !valor.includes('-')) {
    mostrarErro(inputElement, errorElement, 'O endereço deve conter vírgula ou hífen (Ex: Rua X, 123 - Cidade).');
    return false;
  }
  
  mostrarSucesso(inputElement, errorElement);
  return true;
}

// Função para validar o campo Preço
function validarPreco(valor) {
  const errorElement = document.getElementById('errorPreco');
  const inputElement = document.getElementById('editarPreco');
  
  valor = valor.trim();
  
  if (valor.length === 0) {
    mostrarErro(inputElement, errorElement, 'O preço é obrigatório.');
    return false;
  }
  
  // Remove "R$" e espaços se existirem
  valor = valor.replace(/R\$\s*/g, '').trim();
  
  // Verifica se o formato é válido (aceita 1500,00 ou 1.500,00 ou 1500)
  const regexPreco = /^(\d{1,3}(\.\d{3})*|\d+)(,\d{2})?$/;
  if (!regexPreco.test(valor)) {
    mostrarErro(inputElement, errorElement, 'Formato inválido. Use: 1500,00 ou 1.500,00');
    return false;
  }
  
  // Converte para número para validar valor mínimo
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

// Função para validar o campo Quantidade
function validarQuantidade(valor) {
  const errorElement = document.getElementById('errorQuantidade');
  const inputElement = document.getElementById('editarQuantidade');
  
  valor = valor.trim();
  
  if (valor.length === 0) {
    mostrarErro(inputElement, errorElement, 'A quantidade é obrigatória.');
    return false;
  }
  
  // Extrai o número da string (ex: "20 Tonelada(s)" -> 20)
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

// Função auxiliar para mostrar erro
function mostrarErro(inputElement, errorElement, mensagem) {
  inputElement.classList.add('is-invalid');
  inputElement.classList.remove('is-valid');
  errorElement.textContent = mensagem;
  errorElement.style.display = 'block';
}

// Função auxiliar para mostrar sucesso
function mostrarSucesso(inputElement, errorElement) {
  inputElement.classList.remove('is-invalid');
  inputElement.classList.add('is-valid');
  errorElement.textContent = '';
  errorElement.style.display = 'none';
}

// Função para verificar se todos os campos são válidos
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

// ===================================
// Event Listeners para Validação
// ===================================

// Validação em tempo real para o campo Nome
document.getElementById('editarNome').addEventListener('input', function(e) {
  validationState.nome = validarNome(e.target.value);
  verificarFormularioValido();
});

// Validação em tempo real para o campo Endereço
document.getElementById('editarEndereco').addEventListener('input', function(e) {
  validationState.endereco = validarEndereco(e.target.value);
  verificarFormularioValido();
});

// Validação em tempo real para o campo Preço
document.getElementById('editarPreco').addEventListener('input', function(e) {
  validationState.preco = validarPreco(e.target.value);
  verificarFormularioValido();
});

// Validação em tempo real para o campo Quantidade
document.getElementById('editarQuantidade').addEventListener('input', function(e) {
  validationState.quantidade = validarQuantidade(e.target.value);
  verificarFormularioValido();
});

// Validação ao perder o foco (blur)
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

// ===================================
// Funcionalidade de Exclusão
// ===================================
document.querySelectorAll('.btn-excluir').forEach(btn => {
  btn.addEventListener('click', function() {
    cardParaExcluir = this.closest('.produto-card');
    excluirModal.show();
  });
});

document.getElementById('confirmarExcluirBtn').addEventListener('click', function() {
  if (cardParaExcluir) {
    cardParaExcluir.remove();
    excluirModal.hide();
    cardParaExcluir = null;
  }
});

// ===================================
// Funcionalidade de Edição
// ===================================
document.querySelectorAll('.btn-warning').forEach(btn => {
  btn.addEventListener('click', function() {
    cardParaEditar = this.closest('.produto-card');
    
    const nome = cardParaEditar.querySelector('h3').textContent;
    const endereco = cardParaEditar.querySelector('.endereco').textContent;
    const preco = cardParaEditar.querySelector('.preco').textContent;
    const quantidade = cardParaEditar.querySelector('.quantidade').textContent;

    // Preenche os campos do modal
    document.getElementById('editarNome').value = nome;
    document.getElementById('editarEndereco').value = endereco;
    document.getElementById('editarPreco').value = preco;
    document.getElementById('editarQuantidade').value = quantidade;

    // Valida todos os campos ao abrir o modal
    validationState.nome = validarNome(nome);
    validationState.endereco = validarEndereco(endereco);
    validationState.preco = validarPreco(preco);
    validationState.quantidade = validarQuantidade(quantidade);
    
    verificarFormularioValido();
    
    editarModal.show();
  });
});

// Salvar alterações
document.getElementById('salvarEdicaoBtn').addEventListener('click', function() {
  if (cardParaEditar) {
    // Valida todos os campos antes de salvar
    const nomeValido = validarNome(document.getElementById('editarNome').value);
    const enderecoValido = validarEndereco(document.getElementById('editarEndereco').value);
    const precoValido = validarPreco(document.getElementById('editarPreco').value);
    const quantidadeValido = validarQuantidade(document.getElementById('editarQuantidade').value);
    
    if (nomeValido && enderecoValido && precoValido && quantidadeValido) {
      const nome = document.getElementById('editarNome').value;
      const endereco = document.getElementById('editarEndereco').value;
      const preco = document.getElementById('editarPreco').value;
      const quantidade = document.getElementById('editarQuantidade').value;

      // Atualiza o card com os novos valores
      cardParaEditar.querySelector('h3').textContent = nome;
      cardParaEditar.querySelector('.endereco').textContent = endereco;
      cardParaEditar.querySelector('.preco').textContent = preco;
      cardParaEditar.querySelector('.quantidade').textContent = quantidade;

      // Limpa os estados de validação
      document.querySelectorAll('.form-control').forEach(input => {
        input.classList.remove('is-valid', 'is-invalid');
      });
      
      document.querySelectorAll('.error-message').forEach(error => {
        error.style.display = 'none';
        error.textContent = '';
      });

      editarModal.hide();
    }
  }
});

// Limpa validações ao fechar o modal
document.getElementById('editarModal').addEventListener('hidden.bs.modal', function () {
  document.querySelectorAll('.form-control').forEach(input => {
    input.classList.remove('is-valid', 'is-invalid');
  });
  
  document.querySelectorAll('.error-message').forEach(error => {
    error.style.display = 'none';
    error.textContent = '';
  });
  
  // Reseta o estado de validação
  validationState.nome = false;
  validationState.endereco = false;
  validationState.preco = false;
  validationState.quantidade = false;
  
  verificarFormularioValido();
});

