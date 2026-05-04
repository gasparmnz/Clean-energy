
 /* Sistema de Validação em Tempo Real para Login*/


class LoginValidator {
  constructor() {
    this.form = null;
    this.emailInput = null;
    this.passwordInput = null;
    this.submitButton = null;
    
    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupElements();
        this.setupEventListeners();
        this.setupPasswordToggle();
        this.clearBackendErrors();
      });
    } else {
      this.setupElements();
      this.setupEventListeners();
      this.setupPasswordToggle();
      this.clearBackendErrors();
    }
  }

  setupElements() {
    this.form = document.querySelector('.login-form') || document.querySelector('form');
    this.emailInput = document.getElementById('usuarioDigitado') || 
                     document.querySelector('input[name="usuarioDigitado"]') ||
                     document.querySelector('input[type="email"]');
    this.passwordInput = document.getElementById('senhaDigitada') || 
                        document.querySelector('input[name="senhaDigitada"]') ||
                        document.querySelector('input[type="password"]');
    this.submitButton = document.getElementById('btnClique') || 
                       document.querySelector('.submit-btn') ||
                       document.querySelector('button[type="submit"]');

    console.log('🔍 Elementos encontrados:', {
      form: !!this.form,
      email: !!this.emailInput,
      password: !!this.passwordInput,
      submit: !!this.submitButton
    });
  }

  clearBackendErrors() {

    const backendError = document.querySelector('.backend-error');
    if (backendError) {
      backendError.style.display = 'none';
    }


    if (this.emailInput) {
      this.emailInput.classList.remove('erro');
    }
    if (this.passwordInput) {
      this.passwordInput.classList.remove('erro');
    }
  }

  setupEventListeners() {
    if (!this.emailInput || !this.passwordInput) {
      console.warn('⚠️ Inputs não encontrados');
      return;
    }

    // Validação do e-mail
    this.emailInput.addEventListener('blur', () => {
      this.validateEmail();
    });

    this.emailInput.addEventListener('input', this.debounce(() => {
      this.validateEmail();
    }, 300));

    // Validação da senha
    this.passwordInput.addEventListener('blur', () => {
      this.validatePassword();
    });

    this.passwordInput.addEventListener('input', this.debounce(() => {
      this.validatePassword();
    }, 300));

    // Validação no envio do formulário
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        this.validateAllFields();
        this.showLoadingState();
        //
      });
    }

    console.log('✅ Event listeners configurados');
  }

  validateEmail() {
    if (!this.emailInput) return { isValid: true, message: '' };

    const value = this.emailInput.value.trim();
    let result = { isValid: true, message: '' };

    if (!value) {
      result = { isValid: false, message: 'E-mail é obrigatório' };
    } else if (!this.isValidEmail(value)) {
      result = { isValid: false, message: 'E-mail inválido' };
    } else if (value.length > 254) {
      result = { isValid: false, message: 'E-mail muito longo' };
    }

    this.updateFieldUI(this.emailInput, result);
    return result;
  }

  validatePassword() {
    if (!this.passwordInput) return { isValid: true, message: '' };

    const value = this.passwordInput.value;
    let result = { isValid: true, message: '' };

    if (!value) {
      result = { isValid: false, message: 'Senha é obrigatória' };
    } else if (value.length < 3) {
      result = { isValid: false, message: 'Senha muito curta' };
    } else if (value.length > 128) {
      result = { isValid: false, message: 'Senha muito longa' };
    }

    this.updateFieldUI(this.passwordInput, result);
    return result;
  }

  validateAllFields() {
    const emailResult = this.validateEmail();
    const passwordResult = this.validatePassword();
    
    return emailResult.isValid && passwordResult.isValid;
  }

  updateFieldUI(input, result) {
    const inputGroup = input.closest('.input-group') || input.closest('article');
    if (!inputGroup) return;

    let errorElement = inputGroup.querySelector('.error-message') || 
                      inputGroup.querySelector('.msgErro');
    let successElement = inputGroup.querySelector('.success-message');

    if (!errorElement) {
      errorElement = document.createElement('span');
      errorElement.className = 'error-message';
      errorElement.setAttribute('role', 'alert');
      inputGroup.appendChild(errorElement);
    }

    inputGroup.classList.remove('valid', 'invalid');
    input.classList.remove('valid', 'invalid', 'erro');

    if (result.isValid) {

      inputGroup.classList.add('valid');
      input.classList.add('valid');
      input.style.borderColor = '#22c55e';
      input.style.backgroundColor = 'rgba(34, 197, 94, 0.05)';
      
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
      }
      
      if (successElement) {
        successElement.style.display = 'flex';
      }
      
      console.log(`✅ Campo válido: ${input.name || input.id}`);
    } else {

      inputGroup.classList.add('invalid');
      input.classList.add('invalid', 'erro');
      input.style.borderColor = '#ef4444';
      input.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
      
      if (errorElement) {
        errorElement.textContent = result.message;
        errorElement.style.display = 'flex';
        errorElement.style.color = '#ef4444';
        errorElement.style.fontSize = '0.875rem';
        errorElement.style.marginTop = '0.5rem';
        errorElement.style.padding = '0.5rem 1rem';
        errorElement.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
        errorElement.style.border = '1px solid rgba(239, 68, 68, 0.2)';
        errorElement.style.borderRadius = '0.375rem';
        errorElement.style.alignItems = 'center';
        errorElement.style.gap = '0.25rem';
      }
      
      if (successElement) {
        successElement.style.display = 'none';
      }
      
      console.log(`❌ Campo inválido: ${input.name || input.id} - ${result.message}`);
    }
  }

  showLoadingState() {
    if (this.submitButton) {
      this.submitButton.classList.add('loading');
      console.log('🔄 Estado de loading ativado');
    }
  }

  setupPasswordToggle() {
    const toggleButton = document.querySelector('.password-toggle');
    
    if (toggleButton && this.passwordInput) {
      toggleButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.togglePasswordVisibility();
      });
      
      console.log('👁️ Toggle de senha configurado');
    }
  }

  togglePasswordVisibility() {
    if (!this.passwordInput) return;

    const toggleButton = document.querySelector('.password-toggle');
    const icon = toggleButton?.querySelector('i');

    if (this.passwordInput.type === 'password') {
      this.passwordInput.type = 'text';
      if (icon) {
        icon.className = 'bx bx-show';
      }
      if (toggleButton) {
        toggleButton.setAttribute('aria-label', 'Ocultar senha');
      }
    } else {
      this.passwordInput.type = 'password';
      if (icon) {
        icon.className = 'bx bx-hide';
      }
      if (toggleButton) {
        toggleButton.setAttribute('aria-label', 'Mostrar senha');
      }
    }
  }

  // Utilitários
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

let loginValidator;


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    loginValidator = new LoginValidator();
    setupAccessibility();
    setupAnimations();
  });
} else {
  loginValidator = new LoginValidator();
  setupAccessibility();
  setupAnimations();
}

function setupAccessibility() {

  const inputs = document.querySelectorAll('.form-input');
  inputs.forEach((input, index) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const nextInput = inputs[index + 1];
        if (nextInput) {
          nextInput.focus();
        } else {
          const submitButton = document.querySelector('.submit-btn, #btnClique');
          if (submitButton) {
            submitButton.click();
          }
        }
      }
    });
  });


  const errorMessages = document.querySelectorAll('.error-message, .msgErro');
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
  module.exports = LoginValidator;
}

console.log('🚀 Sistema de validação de login carregado e pronto!');
