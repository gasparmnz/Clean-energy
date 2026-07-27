/**
 * Base de conhecimento do chatbot de dúvidas do Clean Energy.
 *
 * Este arquivo NÃO tem lógica: é só uma lista de textos que o Gemini usa
 * como referência para responder às perguntas dos usuários sobre o
 * funcionamento do site.
 *
 * PARA ADICIONAR NOVAS INFORMAÇÕES NO FUTURO:
 * Basta acrescentar um novo item de texto no array abaixo (formato livre,
 * pode ser um parágrafo ou uma pergunta e resposta). Não é necessário
 * mexer em nenhum outro arquivo — o helper `geminiChat.js` já lê este
 * arquivo automaticamente a cada pergunta.
 */

module.exports = [
  // Cadastro e login
  `Cadastro: o usuário se cadastra pela página "/cadastro", informando dados como nome, e-mail, CPF e senha. Existe também o cadastro de vendedor/empresa pela página "/cadastro_vendedor" (com CNPJ). Um comprador já cadastrado também pode solicitar upgrade para vendedor na página "/upgrade_vendedor".`,
  `Login: o login é feito na página "/login" com e-mail e senha. O site também oferece login biométrico (Face ID / impressão digital), que pode ser cadastrado dentro do Perfil, na seção de biometria.`,
  `Logout: o usuário pode sair da conta pela opção de logout disponível no menu do site.`,

  // Perfil
  `Perfil: na página "/perfil" (é necessário estar logado) o usuário pode ver e atualizar seus dados pessoais, trocar a foto do perfil e gerenciar dispositivos de biometria cadastrados.`,

  // Produtos, compra e venda
  `Compra de produtos: os produtos ficam listados na página inicial ("/"), com filtros por busca, estado, categoria e faixa de preço. Ao entrar em um produto (página "/item/:id"), o usuário pode ver os detalhes e adicionar ao carrinho.`,
  `Venda de biomassa / anunciar produto: para vender, o usuário precisa ter um perfil de vendedor. O cadastro de um novo produto é feito na página "/cadastrar_produto", informando nome, descrição, preço, quantidade, categoria, estado e uma imagem. Depois de cadastrado, o produto aparece na listagem da plataforma. O vendedor acompanha seus produtos cadastrados na página "/listaprodutos".`,
  `Regras de venda: o frete segue o regime FOB (Free On Board), ou seja, o comprador assume os custos e riscos do transporte a partir do embarque. É cobrada uma taxa de 5% sobre o valor da transação para manutenção da plataforma.`,

  // Carrinho e compras
  `Carrinho: os produtos escolhidos ficam na página "/carrinho", onde é possível adicionar ou remover itens antes de finalizar a compra.`,
  `Minhas Compras: ao finalizar a compra a partir do carrinho, os itens são movidos para a página "/minhascompras", onde ficam como pedidos pendentes e o vendedor é notificado sobre o novo pedido.`,
  `Trocas e devoluções: para solicitar troca ou devolução, o usuário acessa "Meus Pedidos" no perfil, seleciona o pedido e clica em "Solicitar Troca/Devolução". O prazo é de até 7 dias após o recebimento.`,

  // Pagamento
  `Formas de pagamento: a integração com meios de pagamento (como Mercado Pago e cadastro de cartões) ainda está em desenvolvimento na plataforma. Caso o usuário pergunte sobre formas de pagamento, informe que essa funcionalidade está sendo implementada e ainda não está disponível.`,

  // Entrega
  `Rastreamento de entrega: o rastreamento do pedido pode ser acompanhado em "Meus Pedidos", no perfil, selecionando o pedido e clicando em "Rastrear Entrega".`,
  `Prazos de entrega: em geral, para capitais o prazo é de 3 a 7 dias úteis, e para o interior de 7 a 15 dias úteis. Produtos sob encomenda podem ter prazos específicos informados no momento da compra.`,
  `Problemas com entrega: em caso de atraso, produto danificado ou não recebimento, o usuário deve entrar em contato com o suporte pelo e-mail suporte@cleanenergy.com ou pelo telefone (11) 1234-5678.`,

  // Contato
  `Contato/Suporte: o suporte pode ser acionado pelo e-mail suporte@cleanenergy.com ou telefone (11) 1234-5678. O rodapé do site também traz links para redes sociais (Instagram, Facebook, WhatsApp).`,

  // Navegação
  `Navegação do site: as principais páginas são a lista de produtos ("/"), "Anunciar produto", "Seus produtos" (para vendedores), "Dúvidas" ("/duvidas"), "Sobre nós" ("/sobre_nos") e "Minhas Compras". No celular existe uma barra de navegação inferior fixa; no computador, o menu fica no cabeçalho, com acesso ao carrinho e ao avatar do perfil.`,
  `Acessibilidade: o site tem um botão de acessibilidade flutuante com opções de tamanho de texto, fonte legível, espaçamento de texto, destaque de links, guia de leitura, cursor grande, redução de animações, alto contraste, escala de cinza, inverter cores e modo escuro.`,
];
