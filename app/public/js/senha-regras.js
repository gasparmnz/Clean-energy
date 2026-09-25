/**
 * Regras de senha da Clean Energy — FONTE ÚNICA.
 *
 * Este mesmo arquivo é usado:
 *  - no navegador (<script src="/js/senha-regras.js">), expondo window.SenhaRegras,
 *    para o feedback em tempo real do cadastro;
 *  - no servidor (require('../public/js/senha-regras')), em authController,
 *    que continua sendo a autoridade final da validação.
 *
 * As expressões abaixo são exatamente as usadas por validator.isStrongPassword
 * (dependência do express-validator), que o backend também aplica com as
 * opções OPCOES_VALIDATOR. Assim frontend e backend nunca divergem:
 *  - minúscula:  [a-z]
 *  - maiúscula:  [A-Z]
 *  - número:     [0-9]
 *  - especial:   - # ! $ @ £ % ^ & * ( ) _ + | ~ = ` { } [ ] : " ; ' < > ? , . / \ e espaço
 */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) {
    module.exports = fabrica();
  } else {
    raiz.SenhaRegras = fabrica();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var TAMANHO_MINIMO = 8;
  var TAMANHO_MAXIMO = 128;
  var REGEX_SIMBOLO = /[-#!$@£%^&*()_+|~=`{}\[\]:";'<>?,.\/\\ ]/;

  var REQUISITOS = [
    { id: 'tamanho',   texto: 'Pelo menos 8 caracteres', falta: 'pelo menos 8 caracteres', teste: function (s) { return s.length >= TAMANHO_MINIMO; } },
    { id: 'minuscula', texto: 'Uma letra minúscula',     falta: 'uma letra minúscula',     teste: function (s) { return /[a-z]/.test(s); } },
    { id: 'maiuscula', texto: 'Uma letra maiúscula',     falta: 'uma letra maiúscula',     teste: function (s) { return /[A-Z]/.test(s); } },
    { id: 'numero',    texto: 'Um número',               falta: 'um número',               teste: function (s) { return /[0-9]/.test(s); } },
    { id: 'especial',  texto: 'Um caractere especial',   falta: 'um caractere especial (ex.: ! @ # $ %)', teste: function (s) { return REGEX_SIMBOLO.test(s); } }
  ];

  // Opções equivalentes para validator/express-validator isStrongPassword.
  var OPCOES_VALIDATOR = {
    minLength: TAMANHO_MINIMO,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  };

  // [{ id, texto, ok }] — um item por requisito, na ordem de exibição.
  function verificar(senha) {
    var s = typeof senha === 'string' ? senha : '';
    return REQUISITOS.map(function (r) {
      return { id: r.id, texto: r.texto, ok: r.teste(s) };
    });
  }

  function juntar(lista) {
    if (lista.length <= 1) return lista.join('');
    return lista.slice(0, -1).join(', ') + ' e ' + lista[lista.length - 1];
  }

  // Mensagem dizendo exatamente o que falta; '' se a senha é válida.
  function mensagemErro(senha) {
    var s = typeof senha === 'string' ? senha : '';
    if (!s) return 'Senha é obrigatória';
    if (s.length > TAMANHO_MAXIMO) return 'Senha muito longa (máximo ' + TAMANHO_MAXIMO + ' caracteres)';
    var faltando = REQUISITOS.filter(function (r) { return !r.teste(s); }).map(function (r) { return r.falta; });
    if (faltando.length === 0) return '';
    return 'A senha precisa ter ' + juntar(faltando) + '.';
  }

  function valida(senha) {
    return mensagemErro(senha) === '';
  }

  return {
    TAMANHO_MINIMO: TAMANHO_MINIMO,
    TAMANHO_MAXIMO: TAMANHO_MAXIMO,
    REQUISITOS: REQUISITOS,
    OPCOES_VALIDATOR: OPCOES_VALIDATOR,
    verificar: verificar,
    mensagemErro: mensagemErro,
    valida: valida
  };
});
