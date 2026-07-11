class ProductFormValidator {
  constructor() {
    this.form = null;
    this.fields = {};
    this.validationRules = {};
    
    this.init();
  }

  init() {
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupElements();
        this.setupValidationRules();
        this.setupEventListeners();
        this.setupFileUpload();
        this.setupFormatters();
        console.log('🚀 Sistema de validação de produto iniciado');
      });
    } else {
      this.setupElements();
      this.setupValidationRules();
      this.setupEventListeners();
      this.setupFileUpload();
      this.setupFormatters();
      console.log('🚀 Sistema de validação de produto iniciado');
    }
  }

  setupElements() {
    this.form = document.querySelector('.product-form') || document.querySelector('form');
    
    // Mapear todos os campos
    this.fields = {
      nome: document.getElementById('nome'),
      descricao: document.getElementById('descricao'),
      preco: document.getElementById('preco'),
      quantidade: document.getElementById('quantidade'),
      categoria: document.getElementById('categoria'),
      imagem: document.getElementById('imagem'),
      cidade: document.getElementById('cidade'),
      bairro: document.getElementById('bairro'),
      rua: document.getElementById('rua'),
      numero: document.getElementById('numero'),
      complemento: document.getElementById('complemento')
    };

    console.log('🔍 Campos encontrados:', Object.keys(this.fields).filter(key => this.fields[key]));
  }

  setupValidationRules() {
    this.validationRules = {
      nome: {
        required: true,
        minLength: 3,
        maxLength: 100,
        pattern: /^[a-zA-ZÀ-ÿ0-9\s\-.,()]+$/,
        message: {
          required: 'Nome do produto é obrigatório',
          minLength: 'Nome deve ter pelo menos 3 caracteres',
          maxLength: 'Nome deve ter no máximo 100 caracteres',
          pattern: 'Nome contém caracteres inválidos'
        }
      },
      descricao: {
        required: true,
        minLength: 10,
        maxLength: 500,
        message: {
          required: 'Descrição é obrigatória',
          minLength: 'Descrição deve ter pelo menos 10 caracteres',
          maxLength: 'Descrição deve ter no máximo 500 caracteres'
        }
      },
      preco: {
        required: true,
        min: 0.01,
        max: 999999.99,
        pattern: /^\d+([.,]\d{1,2})?$/,
        message: {
          required: 'Preço é obrigatório',
          min: 'Preço deve ser maior que zero',
          max: 'Preço muito alto',
          pattern: 'Formato de preço inválido'
        }
      },
      quantidade: {
        required: true,
        min: 0.01,
        max: 99999.99,
        pattern: /^\d+([.,]\d{1,2})?$/,
        message: {
          required: 'Quantidade é obrigatória',
          min: 'Quantidade deve ser maior que zero',
          max: 'Quantidade muito alta',
          pattern: 'Formato de quantidade inválido'
        }
      },
      categoria: {
        required: true,
        message: {
          required: 'Selecione uma categoria'
        }
      },
      imagem: {
        required: true,
        fileTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        maxSize: 5 * 1024 * 1024, // 5MB
        message: {
          required: 'Selecione uma imagem',
          fileType: 'Formato inválido. Use JPG, PNG ou WEBP',
          maxSize: 'Imagem muito grande. Máximo 5MB'
        }
      },
      cidade: {
        required: true,
        minLength: 2,
        maxLength: 100,
        pattern: /^[a-zA-ZÀ-ÿ\s\-.']+$/,
        message: {
          required: 'Cidade é obrigatória',
          minLength: 'Nome da cidade muito curto',
          maxLength: 'Nome da cidade muito longo',
          pattern: 'Nome da cidade contém caracteres inválidos'
        }
      },
      bairro: {
        required: true,
        minLength: 2,
        maxLength: 100,
        pattern: /^[a-zA-ZÀ-ÿ0-9\s\-.']+$/,
        message: {
          required: 'Bairro é obrigatório',
          minLength: 'Nome do bairro muito curto',
          maxLength: 'Nome do bairro muito longo',
          pattern: 'Nome do bairro contém caracteres inválidos'
        }
      },
      rua: {
        required: true,
        minLength: 3,
        maxLength: 200,
        pattern: /^[a-zA-ZÀ-ÿ0-9\s\-.,()]+$/,
        message: {
          required: 'Rua é obrigatória',
          minLength: 'Nome da rua muito curto',
          maxLength: 'Nome da rua muito longo',
          pattern: 'Nome da rua contém caracteres inválidos'
        }
      },
      numero: {
        required: true,
        minLength: 1,
        maxLength: 10,
        pattern: /^[0-9a-zA-Z\s\-]+$/,
        message: {
          required: 'Número é obrigatório',
          minLength: 'Número é obrigatório',
          maxLength: 'Número muito longo',
          pattern: 'Formato de número inválido'
        }
      },
      complemento: {
        required: false,
        maxLength: 100,
        pattern: /^[a-zA-ZÀ-ÿ0-9\s\-.,()]*$/,
        message: {
          maxLength: 'Complemento muito longo',
          pattern: 'Complemento contém caracteres inválidos'
        }
      }
    };
  }

  setupEventListeners() {

    Object.keys(this.fields).forEach(fieldName => {
      const field = this.fields[fieldName];
      if (!field) return;

      field.addEventListener('blur', () => {
        this.validateField(fieldName);
      });

      field.addEventListener('input', this.debounce(() => {
        this.validateField(fieldName);

        if (fieldName === 'descricao') {
          this.updateCharCounter(field);
        }
      }, 300));

      if (field.tagName === 'SELECT') {
        field.addEventListener('change', () => {
          this.validateField(fieldName);
        });
      }
    });

    // Validação no envio do formulário
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        this.validateAllFields();
        this.showLoadingState();
        

        console.log('📤 Formulário enviado para validação backend');
      });
    }

    console.log('✅ Event listeners configurados');
  }

  validateField(fieldName) {
    const field = this.fields[fieldName];
    const rules = this.validationRules[fieldName];
    
    if (!field || !rules) return { isValid: true, message: '' };

    let result = { isValid: true, message: '' };


    if (fieldName === 'imagem') {
      result = this.validateFile(field, rules);
    } else {
      result = this.validateTextInput(field, rules);
    }

    this.updateFieldUI(field, result);
    console.log(`${result.isValid ? '✅' : '❌'} ${fieldName}: ${result.message || 'válido'}`);
    
    return result;
  }

  validateTextInput(field, rules) {
    const value = field.value.trim();

    // Campo obrigatório
    if (rules.required && !value) {
      return { isValid: false, message: rules.message.required };
    }

    if (!rules.required && !value) {
      return { isValid: true, message: '' };
    }

    // Tamanho mínimo
    if (rules.minLength && value.length < rules.minLength) {
      return { isValid: false, message: rules.message.minLength };
    }

    // Tamanho máximo
    if (rules.maxLength && value.length > rules.maxLength) {
      return { isValid: false, message: rules.message.maxLength };
    }

    // Padrão regex
    if (rules.pattern && !rules.pattern.test(value)) {
      return { isValid: false, message: rules.message.pattern };
    }

    // Validação de valor numérico
    if (rules.min !== undefined || rules.max !== undefined) {
      const numValue = parseFloat(value.replace(',', '.'));
      
      if (isNaN(numValue)) {
        return { isValid: false, message: rules.message.pattern };
      }
      
      if (rules.min !== undefined && numValue < rules.min) {
        return { isValid: false, message: rules.message.min };
      }
      
      if (rules.max !== undefined && numValue > rules.max) {
        return { isValid: false, message: rules.message.max };
      }
    }

    return { isValid: true, message: '' };
  }

  validateFile(field, rules) {
    const files = field.files;

    // Campo obrigatório
    if (rules.required && (!files || files.length === 0)) {
      return { isValid: false, message: rules.message.required };
    }

    if (!rules.required && (!files || files.length === 0)) {
      return { isValid: true, message: '' };
    }

    if (files.length > 6) {
      return { isValid: false, message: 'Selecione no máximo 6 imagens' };
    }

    for (const file of files) {
      if (rules.fileTypes && !rules.fileTypes.includes(file.type)) {
        return { isValid: false, message: rules.message.fileType };
      }
      if (rules.maxSize && file.size > rules.maxSize) {
        return { isValid: false, message: rules.message.maxSize };
      }
    }

    return { isValid: true, message: '' };
  }

  validateAllFields() {
    let allValid = true;
    
    Object.keys(this.fields).forEach(fieldName => {
      const result = this.validateField(fieldName);
      if (!result.isValid) {
        allValid = false;
      }
    });

    console.log(`📋 Validação geral: ${allValid ? 'todos os campos válidos' : 'há campos inválidos'}`);
    return allValid;
  }

  updateFieldUI(field, result) {
    const inputGroup = field.closest('.input-group');
    if (!inputGroup) return;


    let errorElement = inputGroup.querySelector('.error-message');
    let successElement = inputGroup.querySelector('.success-message');

    inputGroup.classList.remove('valid', 'invalid');
    field.classList.remove('valid', 'invalid');

    if (result.isValid) {

      inputGroup.classList.add('valid');
      field.classList.add('valid');
      
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
      }
      
      if (successElement) {
        successElement.style.display = 'flex';
      }
    } else {
      // Estado inválido
      inputGroup.classList.add('invalid');
      field.classList.add('invalid');
      
      if (errorElement) {
        errorElement.innerHTML = `<i class='bx bx-error-circle'></i>${result.message}`;
        errorElement.style.display = 'flex';
      }
      
      if (successElement) {
        successElement.style.display = 'none';
      }
    }
  }

  setupFileUpload() {
    const fileInput = this.fields.imagem;
    const fileLabel = document.querySelector('.file-upload-label');
    const filePreview = document.getElementById('file-preview-multi');

    if (!fileInput || !fileLabel || !filePreview) return;

    const renderPreviews = () => {
      filePreview.innerHTML = '';
      const files = Array.from(fileInput.files || []);

      files.forEach((file, index) => {
        const thumb = document.createElement('div');
        thumb.style.cssText = 'position:relative; width:90px; height:90px;';

        const img = document.createElement('img');
        img.style.cssText = 'width:100%; height:100%; object-fit:cover; border-radius:8px; border:2px solid ' + (index === 0 ? 'var(--primary-color, #16a34a)' : '#ddd') + ';';
        img.alt = index === 0 ? 'Imagem de capa' : `Imagem ${index + 1}`;

        const reader = new FileReader();
        reader.onload = (e) => { img.src = e.target.result; };
        reader.readAsDataURL(file);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.setAttribute('aria-label', 'Remover esta imagem');
        removeBtn.textContent = '×';
        removeBtn.style.cssText = 'position:absolute; top:-6px; right:-6px; width:22px; height:22px; border-radius:50%; border:none; background:#dc2626; color:#fff; cursor:pointer; line-height:1;';
        removeBtn.addEventListener('click', () => {
          const dt = new DataTransfer();
          files.filter((_, i) => i !== index).forEach(f => dt.items.add(f));
          fileInput.files = dt.files;
          renderPreviews();
          this.validateField('imagem');
        });

        if (index === 0) {
          const badge = document.createElement('span');
          badge.textContent = 'Capa';
          badge.style.cssText = 'position:absolute; bottom:2px; left:2px; background:rgba(22,163,74,.9); color:#fff; font-size:.65rem; padding:1px 5px; border-radius:4px;';
          thumb.appendChild(badge);
        }

        thumb.appendChild(img);
        thumb.appendChild(removeBtn);
        filePreview.appendChild(thumb);
      });

      fileLabel.style.display = files.length > 0 ? 'none' : 'flex';
    };

    fileInput.addEventListener('change', () => {
      this.validateField('imagem');
      renderPreviews();
    });

    fileLabel.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileLabel.style.borderColor = 'var(--primary-color)';
      fileLabel.style.background = 'var(--primary-light)';
    });

    fileLabel.addEventListener('dragleave', (e) => {
      e.preventDefault();
      fileLabel.style.borderColor = 'var(--border-color)';
      fileLabel.style.background = 'var(--background-light)';
    });

    fileLabel.addEventListener('drop', (e) => {
      e.preventDefault();
      fileLabel.style.borderColor = 'var(--border-color)';
      fileLabel.style.background = 'var(--background-light)';

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        fileInput.files = files;
        fileInput.dispatchEvent(new Event('change'));
      }
    });

    console.log('📁 Upload de múltiplos arquivos configurado');
  }

  clearFilePreview() {
    const fileLabel = document.querySelector('.file-upload-label');
    const filePreview = document.getElementById('file-preview');
    
    if (fileLabel && filePreview) {
      fileLabel.style.display = 'flex';
      filePreview.style.display = 'none';
    }
  }

  setupFormatters() {

    const precoField = this.fields.preco;
    if (precoField) {
      precoField.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value) {
          value = (parseInt(value) / 100).toFixed(2);
          value = value.replace('.', ',');
          value = 'R$ ' + value;
        }
        e.target.value = value;
      });

      precoField.addEventListener('focus', (e) => {
        let value = e.target.value.replace(/[^\d,]/g, '');
        e.target.value = value;
      });

      precoField.addEventListener('blur', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value) {
          value = (parseInt(value) / 100).toFixed(2);
          value = value.replace('.', ',');
          value = 'R$ ' + value;
        }
        e.target.value = value;
      });
    }

    const quantidadeField = this.fields.quantidade;
    if (quantidadeField) {
      quantidadeField.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^\d,]/g, '');
        e.target.value = value;
      });

      quantidadeField.addEventListener('blur', (e) => {
        let value = e.target.value;
        if (value && !value.includes(' t')) {
          e.target.value = value + ' t';
        }
      });

      quantidadeField.addEventListener('focus', (e) => {
        let value = e.target.value.replace(' t', '');
        e.target.value = value;
      });
    }

    console.log('🔢 Formatadores configurados');
  }

  updateCharCounter(textarea) {
    const counter = document.getElementById('descricao-counter');
    if (counter) {
      const current = textarea.value.length;
      const max = 500;
      counter.textContent = `${current}/${max}`;
      
      if (current > max * 0.9) {
        counter.style.color = 'var(--warning-color)';
      } else if (current > max) {
        counter.style.color = 'var(--error-color)';
      } else {
        counter.style.color = 'var(--text-light)';
      }
    }
  }

  showLoadingState() {
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
      submitBtn.classList.add('loading');
      console.log('🔄 Estado de loading ativado');
    }
  }

  hideLoadingState() {
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
      submitBtn.classList.remove('loading');
      console.log('✅ Estado de loading desativado');
    }
  }

  // Utilitários
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

  formatMoney(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  formatNumber(value, decimals = 2) {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }
}

// Inicializar validação
let productValidator;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    productValidator = new ProductFormValidator();
    setupAccessibility();
    setupAnimations();
  });
} else {
  productValidator = new ProductFormValidator();
  setupAccessibility();
  setupAnimations();
}

function setupAccessibility() {

  const inputs = document.querySelectorAll('.form-input, .form-textarea, .form-select');
  inputs.forEach((input, index) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const nextInput = inputs[index + 1];
        if (nextInput) {
          nextInput.focus();
        } else {
          const submitButton = document.querySelector('.submit-btn');
          if (submitButton) {
            submitButton.focus();
          }
        }
      }
    });
  });

  const fileInput = document.getElementById('imagem');
  const fileLabel = document.querySelector('.file-upload-label');
  
  if (fileInput && fileLabel) {
    fileLabel.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });
  }
}

function setupAnimations() {

  const inputGroups = document.querySelectorAll('.input-group');
  inputGroups.forEach((group, index) => {
    group.style.animationDelay = `${index * 0.1}s`;
  });


  const inputs = document.querySelectorAll('.form-input, .form-textarea, .form-select');
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


  const fileLabel = document.querySelector('.file-upload-label');
  if (fileLabel) {
    fileLabel.addEventListener('mouseenter', () => {
      fileLabel.style.transform = 'scale(1.02)';
    });
    
    fileLabel.addEventListener('mouseleave', () => {
      fileLabel.style.transform = 'scale(1)';
    });
  }
}

console.log('🚀 Sistema de validação de cadastro de produto carregado e pronto!');
