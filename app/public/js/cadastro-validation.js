
class FormValidator {
  constructor() {
    this.forms = {
      pessoaFisica: document.getElementById('formPessoaFisica'),
      empresa: document.getElementById('formEmpresa')
    };
    
    this.validators = {
      // Validadores para Pessoa Física
      pessoaFisica: {
        nome: this.validateName,
        cpf: this.validateCPF,
        email: this.validateEmail,
        senha: this.validatePassword,
        confirmarSenha: this.validateConfirmPassword
      },
      // Validadores para Empresa
      empresa: {
        nome: this.validateCompanyName,
        cnpj: this.validateCNPJ,
        email: this.validateEmail,
        senha: this.validatePassword,
        confirmarSenha: this.validateConfirmPassword
      }
    };
    
    this.init();
  }

  init() {

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupEventListeners();
        this.setupPasswordToggles();
        this.setupFormSubmission();
        this.clearBackendErrors();
      });
    } else {
      this.setupEventListeners();
      this.setupPasswordToggles();
      this.setupFormSubmission();
      this.clearBackendErrors();
    }
  }

  clearBackendErrors() {
    
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
      if (element.textContent.trim()) {
        element.textContent = '';
      }
    });
  }

  setupEventListeners() {
    Object.keys(this.forms).forEach(formType => {
      const form = this.forms[formType];
      if (!form) return;

      const inputs = form.querySelectorAll('.form-input');
      inputs.forEach(input => {
        // Validação em tempo real
        input.addEventListener('blur', (e) => {
          this.validateField(formType, e.target);
        });

        // Validação durante a digitação
        input.addEventListener('input', this.debounce((e) => {
          this.validateField(formType, e.target);
        }, 300));

         // indicador de força da senha
        if (input.type === 'password' && input.name === 'senha') {
          input.addEventListener('focus', (e) => {
            this.showPasswordStrength(e.target);
          });
          
          input.addEventListener('input', (e) => {
            this.updatePasswordStrength(e.target);
          });
        }

        // Formatação para CPF e CNPJ
        if (input.name === 'cpf') {
          input.addEventListener('input', (e) => {
            this.formatCPF(e.target);
          });
        }

        if (input.name === 'cnpj') {
          input.addEventListener('input', (e) => {
            this.formatCNPJ(e.target);
          });
        }
      });
    });
  }

  setupPasswordToggles() {
    const toggleButtons = document.querySelectorAll('.password-toggle');
    toggleButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.togglePasswordVisibility(button);
      });
    });
  }

  setupFormSubmission() {
    Object.keys(this.forms).forEach(formType => {
      const form = this.forms[formType];
      if (!form) return;

      form.addEventListener('submit', (e) => {
        this.validateAllFields(formType);
        
        this.showLoadingState(form);
      });
    });
  }

  validateField(formType, input) {
    const fieldName = input.name;
    const validator = this.validators[formType][fieldName];
    
    if (!validator) return { isValid: true, message: '' };

    const result = validator.call(this, input.value, formType, input);
    this.updateFieldUI(input, result);
    
    return result;
  }

  validateAllFields(formType) {
    const form = this.forms[formType];
    const inputs = form.querySelectorAll('.form-input[required]');
    let allValid = true;
    
    inputs.forEach(input => {
      const result = this.validateField(formType, input);
      if (!result || !result.isValid) {
        allValid = false;
      }
    });
    
    return allValid;
  }

  updateFieldUI(input, result) {
    const inputGroup = input.closest('.input-group');
    const errorElement = inputGroup.querySelector('.error-message');
    const successElement = inputGroup.querySelector('.success-message');

    inputGroup.classList.remove('valid', 'invalid');

    if (result.isValid) {
      inputGroup.classList.add('valid');
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
      }
      if (successElement) {
        successElement.style.display = 'flex';
      }
    } else {
      inputGroup.classList.add('invalid');
      if (errorElement) {
        errorElement.textContent = result.message;
        errorElement.style.display = 'flex';
      }
      if (successElement) {
        successElement.style.display = 'none';
      }
    }
  }

  showLoadingState(form) {
    const submitButton = form.querySelector('.submit-btn');
    if (submitButton) {
      submitButton.classList.add('loading');

    }
  }
  // Validações específicas
  validateName(value) {
    if (!value || value.trim().length < 2) {
      return {
        isValid: false,
        message: 'Nome deve ter pelo menos 2 caracteres'
      };
    }

    if (value.trim().length > 100) {
      return {
        isValid: false,
        message: 'Nome muito longo (máximo 100 caracteres)'
      };
    }

    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(value.trim())) {
      return {
        isValid: false,
        message: 'Nome deve conter apenas letras e espaços'
      };
    }

    return { isValid: true, message: '' };
  }

  validateCompanyName(value) {
    if (!value || value.trim().length < 2) {
      return {
        isValid: false,
        message: 'Nome da empresa deve ter pelo menos 2 caracteres'
      };
    }

    if (value.trim().length > 150) {
      return {
        isValid: false,
        message: 'Nome da empresa muito longo (máximo 150 caracteres)'
      };
    }

    return { isValid: true, message: '' };
  }

  validateCPF(value) {
    if (!value) {
      return {
        isValid: false,
        message: 'CPF é obrigatório'
      };
    }

    // Remove formatação
    const cpf = value.replace(/\D/g, '');

    if (cpf.length !== 11) {
      return {
        isValid: false,
        message: 'CPF deve ter 11 dígitos'
      };
    }

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) {
      return {
        isValid: false,
        message: 'CPF inválido'
      };
    }

    // Validação do algoritmo do CPF
    if (!this.isValidCPF(cpf)) {
      return {
        isValid: false,
        message: 'CPF inválido'
      };
    }

    return { isValid: true, message: '' };
  }

  validateCNPJ(value) {
    if (!value) {
      return {
        isValid: false,
        message: 'CNPJ é obrigatório'
      };
    }

    // Remove formatação
    const cnpj = value.replace(/\D/g, '');

    if (cnpj.length !== 14) {
      return {
        isValid: false,
        message: 'CNPJ deve ter 14 dígitos'
      };
    }

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cnpj)) {
      return {
        isValid: false,
        message: 'CNPJ inválido'
      };
    }

    // Validação do algoritmo do CNPJ
    if (!this.isValidCNPJ(cnpj)) {
      return {
        isValid: false,
        message: 'CNPJ inválido'
      };
    }

    return { isValid: true, message: '' };
  }

  validateEmail(value) {
    if (!value) {
      return {
        isValid: false,
        message: 'E-mail é obrigatório'
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return {
        isValid: false,
        message: 'E-mail inválido'
      };
    }

    if (value.length > 254) {
      return {
        isValid: false,
        message: 'E-mail muito longo'
      };
    }

    return { isValid: true, message: '' };
  }

  validatePassword(value, formType, input) {
    if (!value) {
      return {
        isValid: false,
        message: 'Senha é obrigatória'
      };
    }

    if (value.length < 8) {
      return {
        isValid: false,
        message: 'Senha deve ter pelo menos 8 caracteres'
      };
    }

    if (value.length > 128) {
      return {
        isValid: false,
        message: 'Senha muito longa (máximo 128 caracteres)'
      };
    }

    if (!/(?=.*[a-z])/.test(value)) {
      return {
        isValid: false,
        message: 'Senha deve conter pelo menos uma letra minúscula'
      };
    }

    if (!/(?=.*[A-Z])/.test(value)) {
      return {
        isValid: false,
        message: 'Senha deve conter pelo menos uma letra maiúscula'
      };
    }

    if (!/(?=.*\d)/.test(value)) {
      return {
        isValid: false,
        message: 'Senha deve conter pelo menos um número'
      };
    }

    return { isValid: true, message: '' };
  }

  validateConfirmPassword(value, formType, input) {
    if (!value) {
      return {
        isValid: false,
        message: 'Confirmação de senha é obrigatória'
      };
    }

    const form = this.forms[formType];
    const passwordInput = form.querySelector('input[name="senha"]');
    const passwordValue = passwordInput ? passwordInput.value : '';

    if (value !== passwordValue) {
      return {
        isValid: false,
        message: 'Senhas não coincidem'
      };
    }

    return { isValid: true, message: '' };
  }

  // Utilitários
  isValidCPF(cpf) {
    // Algoritmo de validação do CPF
    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;

    return true;
  }

  isValidCNPJ(cnpj) {
    // Algoritmo de validação do CNPJ
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj.charAt(i)) * weights1[i];
    }

    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;

    if (digit1 !== parseInt(cnpj.charAt(12))) return false;

    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj.charAt(i)) * weights2[i];
    }

    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;

    return digit2 === parseInt(cnpj.charAt(13));
  }

  formatCPF(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    input.value = value;
  }

  formatCNPJ(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/(\d{2})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1/$2');
    value = value.replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    input.value = value;
  }

  showPasswordStrength(input) {
    const inputGroup = input.closest('.input-group');
    if (inputGroup) {
      inputGroup.classList.add('password-focused');
    }
  }

  updatePasswordStrength(input) {
    const inputGroup = input.closest('.input-group');
    const strengthFill = inputGroup.querySelector('.strength-fill');
    const strengthText = inputGroup.querySelector('.strength-text');
    
    if (!strengthFill || !strengthText) return;

    const password = input.value;
    const strength = this.calculatePasswordStrength(password);

    // Remove classes anteriores
    strengthFill.className = 'strength-fill';
    
    switch (strength.level) {
      case 1:
        strengthFill.classList.add('weak');
        strengthText.textContent = 'Senha fraca';
        break;
      case 2:
        strengthFill.classList.add('fair');
        strengthText.textContent = 'Senha razoável';
        break;
      case 3:
        strengthFill.classList.add('good');
        strengthText.textContent = 'Senha boa';
        break;
      case 4:
        strengthFill.classList.add('strong');
        strengthText.textContent = 'Senha forte';
        break;
      default:
        strengthText.textContent = 'Força da senha';
    }
  }

  calculatePasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;
    if (password.length >= 12) score++;

    return {
      level: Math.min(Math.floor(score / 1.5), 4),
      score: score
    };
  }

  togglePasswordVisibility(button) {
    const passwordInput = button.parentElement.querySelector('.form-input');
    const icon = button.querySelector('i');

    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      icon.className = 'bx bx-show';
      button.setAttribute('aria-label', 'Ocultar senha');
    } else {
      passwordInput.type = 'password';
      icon.className = 'bx bx-hide';
      button.setAttribute('aria-label', 'Mostrar senha');
    }
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Função para alternar entre formulários (já existente no HTML)
function mostrarFormulario(tipo) {
  const formPessoaFisica = document.getElementById('formPessoaFisica');
  const formEmpresa = document.getElementById('formEmpresa');
  const btnPessoaFisica = document.getElementById('btnPessoaFisica');
  const btnEmpresa = document.getElementById('btnEmpresa');

  if (tipo === 'pessoaFisica') {
    formPessoaFisica.classList.remove('hidden');
    formEmpresa.classList.add('hidden');
    btnPessoaFisica.classList.add('active');
    btnEmpresa.classList.remove('active');
    btnPessoaFisica.setAttribute('aria-selected', 'true');
    btnEmpresa.setAttribute('aria-selected', 'false');
  } else {
    formEmpresa.classList.remove('hidden');
    formPessoaFisica.classList.add('hidden');
    btnEmpresa.classList.add('active');
    btnPessoaFisica.classList.remove('active');
    btnEmpresa.setAttribute('aria-selected', 'true');
    btnPessoaFisica.setAttribute('aria-selected', 'false');
  }
}

// Inicializar validação
let validator;

// Aguardar o DOM estar carregado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    validator = new FormValidator();
    setupAccessibility();
    setupAnimations();
  });
} else {
  validator = new FormValidator();
  setupAccessibility();
  setupAnimations();
}

function setupAccessibility() {
  // Melhorar navegação por teclado
  const inputs = document.querySelectorAll('.form-input');
  inputs.forEach((input, index) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.type !== 'submit') {
        e.preventDefault();
        const nextInput = inputs[index + 1];
        if (nextInput && !nextInput.closest('.hidden')) {
          nextInput.focus();
        } else {
          const submitButton = input.closest('form').querySelector('.submit-btn');
          if (submitButton) {
            submitButton.click();
          }
        }
      }
    });
  });

  // Anunciar mudanças para leitores de tela
  const errorMessages = document.querySelectorAll('.error-message');
  errorMessages.forEach(message => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          if (message.textContent.trim()) {
            message.setAttribute('aria-live', 'polite');
          }
        }
      });
    });
    
    observer.observe(message, {
      childList: true,
      characterData: true,
      subtree: true
    });
  });
}

function setupAnimations() {
  // Adicionar animações de entrada escalonadas
  const inputGroups = document.querySelectorAll('.input-group');
  inputGroups.forEach((group, index) => {
    group.style.animationDelay = `${index * 0.1}s`;
  });

  // Animação de foco nos inputs
  const inputs = document.querySelectorAll('.form-input');
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      const inputGroup = input.closest('.input-group');
      if (inputGroup) {
        inputGroup.style.transform = 'scale(1.02)';
      }
    });
    
    input.addEventListener('blur', () => {
      const inputGroup = input.closest('.input-group');
      if (inputGroup) {
        inputGroup.style.transform = 'scale(1)';
      }
    });
  });
}

// Exportar para uso em outros scripts se necessário
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormValidator;
}
