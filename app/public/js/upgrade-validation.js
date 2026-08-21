class UpgradeValidator {
  constructor() {
    this.form = document.getElementById('formUpgrade');
    this.validators = {
      company_name: this.validateCompanyName,
      company_email: this.validateEmail,
      cnpj: this.validateCNPJ
    };
    this.init();
  }

  init() {
    if (!this.form) return;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.clearBackendErrors();
    this.setupEventListeners();
    this.setupFormSubmission();
    this.setupAnimations();
  }

  clearBackendErrors() {
    const errorElements = this.form.querySelectorAll('.error-message');
    errorElements.forEach(el => {
      if (el.textContent.trim()) el.textContent = '';
    });
  }

  setupEventListeners() {
    const inputs = this.form.querySelectorAll('.form-input[required]');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', this.debounce(() => this.validateField(input), 300));

      if (input.name === 'cnpj') {
        input.addEventListener('input', () => this.formatCNPJ(input));
      }
    });
  }

  setupFormSubmission() {
    this.form.addEventListener('submit', (e) => {
      const allValid = this.validateAllFields();
      if (!allValid) {
        e.preventDefault();
        // Foca no primeiro campo inválido
        const firstInvalid = this.form.querySelector('.input-group.invalid .form-input');
        if (firstInvalid) firstInvalid.focus();
      } else {
        const btn = this.form.querySelector('.submit-btn');
        if (btn) btn.classList.add('loading');
      }
    });
  }

  validateAllFields() {
    const inputs = this.form.querySelectorAll('.form-input[required]');
    let allValid = true;
    inputs.forEach(input => {
      const result = this.validateField(input);
      if (!result || !result.isValid) allValid = false;
    });
    return allValid;
  }

  validateField(input) {
    const validator = this.validators[input.name];
    if (!validator) return { isValid: true };

    const result = validator.call(this, input.value);
    this.updateFieldUI(input, result);
    return result;
  }

  updateFieldUI(input, result) {
    const group = input.closest('.input-group');
    if (!group) return;

    const errorEl = group.querySelector('.error-message');
    const successEl = group.querySelector('.success-message');

    group.classList.remove('valid', 'invalid');

    if (result.isValid) {
      group.classList.add('valid');
      if (errorEl) { errorEl.textContent = ''; errorEl.style.display = 'none'; }
      if (successEl) successEl.style.display = 'flex';
    } else {
      group.classList.add('invalid');
      if (errorEl) { errorEl.textContent = result.message; errorEl.style.display = 'flex'; }
      if (successEl) successEl.style.display = 'none';
    }
  }

  // ── Validadores ────────────────────────────────────────────────

  validateCompanyName(value) {
    if (!value || value.trim().length < 2)
      return { isValid: false, message: 'Nome da empresa deve ter pelo menos 2 caracteres' };
    if (value.trim().length > 150)
      return { isValid: false, message: 'Nome da empresa muito longo (máximo 150 caracteres)' };
    return { isValid: true };
  }

  validateEmail(value) {
    if (!value)
      return { isValid: false, message: 'E-mail é obrigatório' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return { isValid: false, message: 'E-mail inválido' };
    if (value.length > 254)
      return { isValid: false, message: 'E-mail muito longo' };
    return { isValid: true };
  }

  validateCNPJ(value) {
    if (!value)
      return { isValid: false, message: 'CNPJ é obrigatório' };

    const cnpj = value.replace(/\D/g, '');
    if (cnpj.length !== 14)
      return { isValid: false, message: 'CNPJ deve ter 14 dígitos' };
    if (/^(\d)\1{13}$/.test(cnpj))
      return { isValid: false, message: 'CNPJ inválido' };
    if (!this.isValidCNPJ(cnpj))
      return { isValid: false, message: 'CNPJ inválido' };

    return { isValid: true };
  }

  // ── Algoritmo CNPJ ─────────────────────────────────────────────

  isValidCNPJ(cnpj) {
    const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 12; i++) sum += parseInt(cnpj[i]) * w1[i];
    const d1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (d1 !== parseInt(cnpj[12])) return false;

    sum = 0;
    for (let i = 0; i < 13; i++) sum += parseInt(cnpj[i]) * w2[i];
    const d2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return d2 === parseInt(cnpj[13]);
  }

  // ── Formatação CNPJ ────────────────────────────────────────────

  formatCNPJ(input) {
    let v = input.value.replace(/\D/g, '').slice(0, 14);
    v = v.replace(/^(\d{2})(\d)/, '$1.$2');
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
    v = v.replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    input.value = v;
  }

  // ── Animações ──────────────────────────────────────────────────

  setupAnimations() {
    const groups = this.form.querySelectorAll('.input-group');
    groups.forEach((g, i) => { g.style.animationDelay = `${i * 0.08}s`; });

    const inputs = this.form.querySelectorAll('.form-input');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        const g = input.closest('.input-group');
        if (g) g.style.transform = 'scale(1.02)';
      });
      input.addEventListener('blur', () => {
        const g = input.closest('.input-group');
        if (g) g.style.transform = 'scale(1)';
      });
    });
  }

  // ── Utilitário debounce ────────────────────────────────────────

  debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }
}

// Inicialização
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new UpgradeValidator());
} else {
  new UpgradeValidator();
}