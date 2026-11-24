
class FormValidator {
  constructor() {
    this.forms = {
      pessoaFisica: document.getElementById('formPessoaFisica'),
      empresa: document.getElementById('formEmpresa')
    };
    
    this.validators = {
      pessoaFisica: {
        nome: this.validateName,
        cpf: this.validateCPF,
        email: this.validateEmail,
        senha: this.validatePassword,
        confirmarSenha: this.validateConfirmPassword
      },
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
      document.addEventListener('DOMContentLoaded', () => this.start());
    } else {
      this.start();
    }
  }

  start() {
    this.showBackendErrors();
    this.setupEventListeners();
    this.setupPasswordToggles();
    this.setupFormSubmission();
    this.initPasswordRequirements();

    window.addEventListener('pageshow', () => {
      document.querySelectorAll('.submit-btn.loading').forEach(btn => {
        btn.classList.remove('loading');
        btn.disabled = false;
      });
    });
  }

  showBackendErrors() {
    Object.keys(this.forms).forEach(formType => {
      const form = this.forms[formType];
      if (!form) return;

      form.querySelectorAll('.form-input').forEach(input => {
        const inputGroup = input.closest('.input-group');
        const errorElement = inputGroup && inputGroup.querySelector('.error-message');
        const mensagem = errorElement ? errorElement.textContent.trim() : '';

        if (mensagem) {
          input.dataset.backendError = mensagem.replace(/^\*/, '');
          input.dataset.backendValue = input.value;
          this.updateFieldUI(input, { isValid: false, message: input.dataset.backendError });
        } else if (errorElement) {
          errorElement.textContent = '';
        }
      });
    });
  }

  getBackendError(input) {
    if (input.dataset.backendError === undefined) return null;
    if (input.value === input.dataset.backendValue) return input.dataset.backendError;
    delete input.dataset.backendError;
    delete input.dataset.backendValue;
    return null;
  }

  setupEventListeners() {
    Object.keys(this.forms).forEach(formType => {
      const form = this.forms[formType];
      if (!form) return;

      const inputs = form.querySelectorAll('.form-input');
      inputs.forEach(input => {
        input.addEventListener('blur', (e) => {
          this.validateField(formType, e.target);
        });

        input.addEventListener('input', this.debounce((e) => {
          this.validateField(formType, e.target);
        }, 300));

        if (input.name === 'senha') {
          input.addEventListener('focus', (e) => {
            this.showPasswordStrength(e.target);
          });
          
          input.addEventListener('input', (e) => {
            this.updatePasswordStrength(e.target);
            this.updatePasswordRequirements(e.target);

            const confirmar = form.querySelector('input[name="confirmarSenha"]');
            if (confirmar && confirmar.value) {
              this.validateField(formType, confirmar);
            }
          });
        }

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
        const valido = this.validateAllFields(formType);

        if (!valido) {
          e.preventDefault();
          this.hideLoadingState(form);
          this.focusFirstInvalid(form);
          return;
        }

        this.showLoadingState(form);
      });
    });
  }

  validateField(formType, input) {
    const fieldName = input.name;
    const validator = this.validators[formType][fieldName];
    
    if (!validator) return { isValid: true, message: '' };

    let result = validator.call(this, input.value, formType, input);

    if (result.isValid) {
      const erroBackend = this.getBackendError(input);
      if (erroBackend) {
        result = { isValid: false, message: erroBackend };
      }
    } else {
      this.getBackendError(input);
    }

    this.updateFieldUI(input, result);
    
    return result;
  }

  focusFirstInvalid(form) {
    const primeiro = form.querySelector('.input-group.invalid .form-input');
    if (primeiro) {
      primeiro.focus();
      if (typeof primeiro.scrollIntoView === 'function') {
        primeiro.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
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
      submitButton.disabled = true;
    }
  }

  hideLoadingState(form) {
    const submitButton = form.querySelector('.submit-btn');
    if (submitButton) {
      submitButton.classList.remove('loading');
      submitButton.disabled = false;
    }
  }
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

    const cpf = value.replace(/\D/g, '');

    if (cpf.length !== 11) {
      return {
        isValid: false,
        message: 'CPF deve ter 11 dígitos'
      };
    }

    if (/^(\d)\1{10}$/.test(cpf)) {
      return {
        isValid: false,
        message: 'CPF inválido'
      };
    }

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

    const cnpj = value.replace(/\D/g, '');

    if (cnpj.length !== 14) {
      return {
        isValid: false,
        message: 'CNPJ deve ter 14 dígitos'
      };
    }

    if (/^(\d)\1{13}$/.test(cnpj)) {
      return {
        isValid: false,
        message: 'CNPJ inválido'
      };
    }

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
    if (window.SenhaRegras) {
      const mensagem = window.SenhaRegras.mensagemErro(value || '');
      return { isValid: !mensagem, message: mensagem };
    }

    if (!value) return { isValid: false, message: 'Senha é obrigatória' };
    if (value.length > 128) return { isValid: false, message: 'Senha muito longa (máximo 128 caracteres)' };
    const faltando = [];
    if (value.length < 8) faltando.push('pelo menos 8 caracteres');
    if (!/[a-z]/.test(value)) faltando.push('uma letra minúscula');
    if (!/[A-Z]/.test(value)) faltando.push('uma letra maiúscula');
    if (!/[0-9]/.test(value)) faltando.push('um número');
    if (!/[-#!$@£%^&*()_+|~=`{}\[\]:";'<>?,.\/\\ ]/.test(value)) faltando.push('um caractere especial');
    if (faltando.length) return { isValid: false, message: 'A senha precisa ter ' + faltando.join(', ') + '.' };
    return { isValid: true, message: '' };
  }

  initPasswordRequirements() {
    document.querySelectorAll('input[name="senha"]').forEach(input => {
      if (input.value) this.updatePasswordRequirements(input);
    });
  }

  updatePasswordRequirements(input) {
    const inputGroup = input.closest('.input-group');
    const lista = inputGroup && inputGroup.querySelector('.password-requirements');
    if (!lista || !window.SenhaRegras) return;

    const vazio = !input.value;
    window.SenhaRegras.verificar(input.value).forEach(req => {
      const item = lista.querySelector('[data-req="' + req.id + '"]');
      if (!item) return;
      const icone = item.querySelector('.req-icone');
      item.classList.toggle('ok', !vazio && req.ok);
      item.classList.toggle('falta', !vazio && !req.ok);
      if (icone) icone.textContent = vazio ? '•' : (req.ok ? '✓' : '✗');
      item.setAttribute('aria-label', req.texto + (vazio ? '' : (req.ok ? ': atendido' : ': pendente')));
    });
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

  isValidCPF(cpf) {
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
    if (window.SenhaRegras
      ? window.SenhaRegras.verificar(password).some(r => r.id === 'especial' && r.ok)
      : /[^a-zA-Z\d]/.test(password)) score++;
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

let validator;

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

  const inputGroups = document.querySelectorAll('.input-group');
  inputGroups.forEach((group, index) => {
    group.style.animationDelay = `${index * 0.1}s`;
  });


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


if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormValidator;
}
