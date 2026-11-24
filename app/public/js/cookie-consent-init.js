CookieConsent.run({

  guiOptions: {
    consentModal: {
      layout: 'box',
      position: 'bottom left',
      equalWeightButtons: true,
      flipButtons: false
    },
    preferencesModal: {
      layout: 'box',
      equalWeightButtons: true,
      flipButtons: false
    }
  },

  categories: {
    necessary: {
      readOnly: true
    },
    analytics: {
      autoClear: {
        cookies: [
          { name: /^_ga/ },
          { name: '_gid' }
        ]
      }
    }
  },

  language: {
    default: 'pt',
    translations: {
      pt: {
        consentModal: {
          title: 'Nós usamos cookies',
          description: 'Usamos cookies essenciais para o funcionamento do site (como manter seu login e seu carrinho) e, opcionalmente, cookies de análise para entender como o site é usado. Você pode aceitar todos ou gerenciar suas preferências.',
          acceptAllBtn: 'Aceitar todos',
          acceptNecessaryBtn: 'Recusar',
          showPreferencesBtn: 'Gerenciar preferências',
          footer: '<a href="/sobre_nos">Política de Privacidade</a>'
        },
        preferencesModal: {
          title: 'Preferências de cookies',
          acceptAllBtn: 'Aceitar todos',
          acceptNecessaryBtn: 'Recusar todos',
          savePreferencesBtn: 'Salvar preferências',
          closeIconLabel: 'Fechar',
          sections: [
            {
              title: 'Uso de cookies',
              description: 'Aqui você pode ativar ou desativar cada categoria de cookie, exceto a de cookies necessários, que é indispensável para o site funcionar.'
            },
            {
              title: 'Cookies necessários',
              description: 'Essenciais para funções básicas do site, como login, sessão e carrinho de compras. Não podem ser desativados.',
              linkedCategory: 'necessary'
            },
            {
              title: 'Cookies de análise/estatísticas',
              description: 'Nos ajudam a entender como os visitantes usam o site, para melhorá-lo. Só são carregados se você aceitar.',
              linkedCategory: 'analytics'
            }
          ]
        }
      }
    }
  }

});
