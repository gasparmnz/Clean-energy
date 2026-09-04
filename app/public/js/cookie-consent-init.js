/**
 * Configuração do banner de cookies (LGPD)
 * Biblioteca usada: CookieConsent v3 (orestbida/cookieconsent)
 * Docs oficiais: https://cookieconsent.orestbida.com
 *
 * Este arquivo só CONFIGURA e CHAMA a biblioteca.
 * Quem desenha o banner, salva a escolha do usuário e reabre
 * o painel de preferências é a biblioteca em si (cookieconsent.umd.js),
 * carregada no partial partial/cookie_consent.ejs.
 */

CookieConsent.run({

  // Onde e como o banner e o painel aparecem na tela
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

  // Categorias de cookies do site.
  // "necessary" fica travado (o site não funciona sem ele: sessão de login, carrinho etc).
  // "analytics" é opcional — só existe pra quando vocês adicionarem
  // Google Analytics ou outra ferramenta de métricas no futuro.
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

  // Todos os textos do banner, em português
  language: {
    default: 'pt',
    translations: {
      pt: {
        consentModal: {
          title: 'Nós usamos cookies 🍪',
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
