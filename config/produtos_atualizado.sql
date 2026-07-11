

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Estrutura para tabela `Avaliacao`
--

CREATE TABLE `Avaliacao` (
  `Avaliacao_ID` int NOT NULL,
  `Nota` int DEFAULT NULL,
  `Comentario` varchar(255) DEFAULT NULL,
  `Usuario_ID` int DEFAULT NULL,
  `Produto_ID` int DEFAULT NULL,
  `nome_usuario` varchar(100) DEFAULT NULL,
  `criado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `suspensa` tinyint(1) NOT NULL DEFAULT '0'
) ;

INSERT INTO `Avaliacao` (`Avaliacao_ID`, `Nota`, `Comentario`, `Usuario_ID`, `Produto_ID`, `nome_usuario`, `criado_em`, `suspensa`) VALUES
(5, 5, 'daora, fiz energia', 3, 11, 'Henrique Santos Evangelista da Silva', '2026-05-26 13:19:51', 0);



--
-- Estrutura para tabela `Avaliacao_Vendedor`
--

CREATE TABLE `Avaliacao_Vendedor` (
  `id` int NOT NULL,
  `vendedor_id` int NOT NULL,
  `avaliador_id` int NOT NULL,
  `nota` int NOT NULL,
  `comentario` text,
  `criado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ;


INSERT INTO `Avaliacao_Vendedor` (`id`, `vendedor_id`, `avaliador_id`, `nota`, `comentario`, `criado_em`) VALUES
(1, 7, 5, 5, 'asasdas', '2026-05-06 00:11:09'),
(2, 11, 3, 5, 'ótima vendedora ', '2026-05-26 13:21:17');


--
-- Estrutura para tabela `carrinho`
--

CREATE TABLE `carrinho` (
  `idCarrinho` int NOT NULL,
  `userId` varchar(255) DEFAULT NULL,
  `items` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `carrinho` (`idCarrinho`, `userId`, `items`) VALUES
(1, '2', '[{\"nome\": \"LIXO ORAGNICOO\", \"local\": \"Recife, uioeahp9gvowirhebs0ahterh, rgghehtejt, 67\", \"preco\": \"1222.22\", \"imagem\": \"sem-foto.png\", \"productId\": \"1\", \"quantidade\": 1}]'),
(2, '5', '[{\"nome\": \"Lixo orgânico\", \"local\": \"São Paulo, Belval, Rua Marte, 23, casa 1\", \"preco\": \"1000.00\", \"imagem\": null, \"productId\": \"10\", \"quantidade\": 1}, {\"nome\": \"Bagaço de cana\", \"local\": \"São Paulo, Belval, Rua Marte, 123, casa 1\", \"preco\": \"1200.00\", \"imagem\": null, \"productId\": \"7\", \"quantidade\": 1}]'),
(3, 'guest', '[{\"nome\": \"LIXO ORAGNICOO\", \"local\": \"Recife, uioeahp9gvowirhebs0ahterh, rgghehtejt, 67\", \"preco\": \"1222.22\", \"imagem\": \"sem-foto.png\", \"productId\": \"1\", \"quantidade\": 1}, {\"nome\": \"Lixo\", \"local\": \"São Paulo, Belval, Presidente, 123, bloco 1\", \"preco\": \"1000.00\", \"imagem\": null, \"productId\": \"6\", \"quantidade\": 1}, {\"nome\": \"Bagaço de cana\", \"local\": \"São Paulo, Belval, Rua Marte, 123, casa 1\", \"preco\": \"1200.00\", \"imagem\": null, \"productId\": \"7\", \"quantidade\": 1}]'),
(4, '7', '[{\"nome\": \"aaaaaaaa\", \"local\": \"aaa, aaa, aaaaaa, aaaa, aaaaa\", \"preco\": \"2000.00\", \"imagem\": \"sem-foto.png\", \"productId\": \"4\", \"quantidade\": 1}]'),
(5, '3', '[{\"nome\": \"Lixo orgânico\", \"local\": \"São Paulo, Belval, Rua Marte, 23, casa 1\", \"preco\": \"1000.00\", \"imagem\": null, \"productId\": \"10\", \"quantidade\": 1}, {\"nome\": \"Bagaço de cana\", \"local\": \"São Paulo, Belval, Rua Marte, 123, casa 1\", \"preco\": \"1200.00\", \"imagem\": null, \"productId\": \"7\", \"quantidade\": 1}]');


--
-- Estrutura para tabela `Categoria`
--

CREATE TABLE `Categoria` (
  `Categoria_ID` int NOT NULL,
  `Nome` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


INSERT INTO `Categoria` (`Categoria_ID`, `Nome`) VALUES
(4, 'Bagaço de cana'),
(8, 'Biomassa geral'),
(6, 'Casca de arroz'),
(3, 'Cavaco'),
(7, 'Folhas secas'),
(1, 'Lenha'),
(5, 'Lixo orgânico'),
(2, 'Pellets');



--
-- Estrutura para tabela `Compra`
--

CREATE TABLE `Compra` (
  `Compra_ID` int NOT NULL,
  `Usuario_ID` int DEFAULT NULL,
  `Data_Compra` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


--
-- Estrutura para tabela `Endereco`
--

CREATE TABLE `Endereco` (
  `Endereco_ID` int NOT NULL,
  `Cidade` varchar(100) DEFAULT NULL,
  `Estado` varchar(50) DEFAULT NULL,
  `Rua` varchar(100) DEFAULT NULL,
  `Bairro` varchar(100) DEFAULT NULL,
  `Numero` int DEFAULT NULL,
  `Complemento` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



--
-- Estrutura para tabela `Item_Compra`
--

CREATE TABLE `Item_Compra` (
  `Item_ID` int NOT NULL,
  `Compra_ID` int DEFAULT NULL,
  `Produto_ID` int DEFAULT NULL,
  `Quantidade` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



--
-- Estrutura para tabela `Local_Retirada`
--

CREATE TABLE `Local_Retirada` (
  `Retirada_ID` int NOT NULL,
  `Produto_ID` int DEFAULT NULL,
  `Endereco_ID` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



--
-- Estrutura para tabela `Pessoa_Fisica`
--

CREATE TABLE `Pessoa_Fisica` (
  `Usuario_ID` int NOT NULL,
  `CPF` char(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Despejando dados para a tabela `Pessoa_Fisica`
--

INSERT INTO `Pessoa_Fisica` (`Usuario_ID`, `CPF`) VALUES
(10, '20700260862'),
(4, '35384102080'),
(11, '38939711734'),
(9, '41082294012'),
(6, '43222324859'),
(7, '53690892805'),
(3, '54764716852'),
(5, '58034271870');



--
-- Estrutura para tabela `Pessoa_Juridica`
--

CREATE TABLE `Pessoa_Juridica` (
  `Usuario_ID` int NOT NULL,
  `CNPJ` char(14) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Despejando dados para a tabela `Pessoa_Juridica`
--

INSERT INTO `Pessoa_Juridica` (`Usuario_ID`, `CNPJ`) VALUES
(4, '13131313313133'),
(6, '21312242435435'),
(8, '21325436568796'),
(5, '34717776000149'),
(7, '67459843000121'),
(11, '99064336000185');



--
-- Estrutura para tabela `produtos`
--

CREATE TABLE `produtos` (
  `id` int NOT NULL,
  `nome` varchar(100) NOT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `preco` decimal(10,2) NOT NULL DEFAULT '0.00',
  `quantidade` decimal(10,2) DEFAULT NULL,
  `imagem` varchar(500) DEFAULT NULL,
  `categoria` varchar(100) DEFAULT NULL,
  `local` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` varchar(50) DEFAULT NULL,
  `usuario_id` int DEFAULT NULL,
  `status` enum('active','suspended') NOT NULL DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Despejando dados para a tabela `produtos`
--

INSERT INTO `produtos` (`id`, `nome`, `descricao`, `preco`, `quantidade`, `imagem`, `categoria`, `local`, `created_at`, `estado`, `usuario_id`, `status`) VALUES
(7, 'Bagaço de cana', 'Bagaço de cana para produção de energia biomassa', 1200.00, 25.00, NULL, 'residuos-organicos', 'São Paulo, Belval, Rua Marte, 123, casa 1', '2026-05-07 12:07:27', 'São Paulo', 5, 'active'),
(10, 'Lixo orgânico', 'Lixo usado para produção de energia biomassa', 1000.00, 10.00, NULL, 'residuos-organicos', 'São Paulo, Belval, Rua Marte, 23, casa 1', '2026-05-14 12:07:39', 'São Paulo', 5, 'active'),
(11, 'Lixo Orgânico', 'é um otimo produto para fazer biomassa', 900.00, 12.00, '1779801446646.png', 'residuos-organicos', 'Barueri, Jd. Belval, Rua Bandeirantes, 23', '2026-05-26 13:17:26', 'São Paulo', 11, 'active');



--
-- Estrutura para tabela `Usuario`
--

CREATE TABLE `Usuario` (
  `Usuario_ID` int NOT NULL,
  `Nome` varchar(100) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `Senha` char(60) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `Biografia` varchar(255) DEFAULT NULL,
  `Tipo` enum('PF','PJ') NOT NULL,
  `Data_Criacao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Tentativas_Login` int DEFAULT '0',
  `Ultimo_Login` datetime DEFAULT NULL,
  `foto` varchar(255) DEFAULT 'avatar.png',
  `status` enum('active','suspended') NOT NULL DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Despejando dados para a tabela `Usuario`
--

INSERT INTO `Usuario` (`Usuario_ID`, `Nome`, `Email`, `Senha`, `Biografia`, `Tipo`, `Data_Criacao`, `Tentativas_Login`, `Ultimo_Login`, `foto`, `status`) VALUES
(3, 'Henrique Santos Evangelista da Silva', 'henrique.evangelista08@gmail.com', '$2a$10$1mW3wTNxUiXA8Fd5HVF0mOVzsheoPp37t.7x.UNj6hi38MwTpe1bW', NULL, 'PF', '2026-04-24 11:04:36', 0, '2026-05-26 13:19:31', 'perfil_3_1777855106165.png', 'active'),
(4, 'mateusenergy', 'mateusandre0888@gmail.com', '$2a$10$OwRsjGUR650k5TuAzmOiKe.VB2SEr7jn1159Y7Yq6f6v6j59wik2i', NULL, 'PJ', '2026-04-24 11:21:10', 0, '2026-04-24 11:21:24', 'avatar.png', 'active'),
(5, 'Gaspar', 'matheusgasparmenezes@gmail.com', '$2a$10$C5yZ4si.YKLDhKXlbzR0ceTKle.g83CMrEpN7P3MkTi5l1AT57F4i', 'Empresa: CLean ltda', 'PJ', '2026-04-24 11:54:55', 0, '2026-05-26 13:05:40', 'perfil_5_1777905646055.jpg', 'active'),
(6, 'João Pedro Neto', 'joaopedronetto1529@gmail.com', '$2a$10$fB48/VKmcvRtWowB83DhsOnIsb.megyiSxzKMuV1kK2eMLAirP0m6', 'Empresa: joao ltda', 'PJ', '2026-04-24 12:10:56', 0, '2026-05-07 12:10:27', 'avatar.png', 'active'),
(7, 'Victor Carneiro', 'cvictor7n@gmail.com', '$2a$10$ZfnX/vd0JqO8ikxiOpL4ceLGnnUiiRTN.f72JTjhvObmx3wWSiwhe', 'Empresa: VCITORCORPO', 'PJ', '2026-04-27 10:32:17', 0, '2026-05-22 14:43:46', 'avatar.png', 'active'),
(8, 'Matheus ltda', 'gasparmnz1@gmail.com', '$2a$10$RWn4XUlZl2gLUldXoxJYguAXLeLAEknIfgtxxt4oKvfPDr9OvmOTC', NULL, 'PJ', '2026-04-30 01:58:34', 0, '2026-04-30 01:58:48', 'perfil_8_1777514345083.png', 'active'),
(9, 'gaoaoaoaos', 'oi@gmail.com', '$2a$10$UBBVXvbCqwQcjd4yt0KafOVu7Ct45jgtsZjaI6yZedgOXIv0.35aa', NULL, 'PF', '2026-05-07 12:08:59', 0, '2026-05-07 12:09:24', 'avatar.png', 'active'),
(10, 'Matheus menezes', 'cleanenergy100@gmail.com', '$2a$10$Elk7A7ZuZ6yO48y0vGYP2Ome9.MO/bSB62aBc0dFtCAa8SJiHCpeG', NULL, 'PF', '2026-05-21 12:14:33', 0, '2026-05-21 12:14:43', 'avatar.png', 'active'),
(11, 'Sarah dos Santos Severino', 'sarahss67@gmail.com', '$2a$10$ECixejKdGO7o4iCEEIJFVubra1TD4fFGbsg.m0oamHV9Dtl0smfTG', 'Empresa: BioClean', 'PJ', '2026-05-26 13:08:27', 0, '2026-05-26 13:14:43', 'avatar.png', 'active');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `Avaliacao`
--
ALTER TABLE `Avaliacao`
  ADD PRIMARY KEY (`Avaliacao_ID`),
  ADD KEY `Usuario_ID` (`Usuario_ID`),
  ADD KEY `Produto_ID` (`Produto_ID`);

--
-- Índices de tabela `Avaliacao_Vendedor`
--
ALTER TABLE `Avaliacao_Vendedor`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unico_avaliacao` (`vendedor_id`,`avaliador_id`),
  ADD KEY `avaliador_id` (`avaliador_id`);

--
-- Índices de tabela `carrinho`
--
ALTER TABLE `carrinho`
  ADD PRIMARY KEY (`idCarrinho`);

--
-- Índices de tabela `Categoria`
--
ALTER TABLE `Categoria`
  ADD PRIMARY KEY (`Categoria_ID`),
  ADD UNIQUE KEY `Nome` (`Nome`);

--
-- Índices de tabela `Compra`
--
ALTER TABLE `Compra`
  ADD PRIMARY KEY (`Compra_ID`),
  ADD KEY `Usuario_ID` (`Usuario_ID`);

--
-- Índices de tabela `Endereco`
--
ALTER TABLE `Endereco`
  ADD PRIMARY KEY (`Endereco_ID`);

--
-- Índices de tabela `Item_Compra`
--
ALTER TABLE `Item_Compra`
  ADD PRIMARY KEY (`Item_ID`),
  ADD KEY `Compra_ID` (`Compra_ID`),
  ADD KEY `Produto_ID` (`Produto_ID`);

--
-- Índices de tabela `Local_Retirada`
--
ALTER TABLE `Local_Retirada`
  ADD PRIMARY KEY (`Retirada_ID`),
  ADD KEY `Produto_ID` (`Produto_ID`),
  ADD KEY `Endereco_ID` (`Endereco_ID`);

--
-- Índices de tabela `Pessoa_Fisica`
--
ALTER TABLE `Pessoa_Fisica`
  ADD PRIMARY KEY (`Usuario_ID`),
  ADD UNIQUE KEY `CPF` (`CPF`);

--
-- Índices de tabela `Pessoa_Juridica`
--
ALTER TABLE `Pessoa_Juridica`
  ADD PRIMARY KEY (`Usuario_ID`),
  ADD UNIQUE KEY `CNPJ` (`CNPJ`);

--
-- Índices de tabela `produtos`
--
ALTER TABLE `produtos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_produto_usuario` (`usuario_id`);

--
-- Índices de tabela `Usuario`
--
ALTER TABLE `Usuario`
  ADD PRIMARY KEY (`Usuario_ID`),
  ADD UNIQUE KEY `Email` (`Email`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `Avaliacao`
--
ALTER TABLE `Avaliacao`
  MODIFY `Avaliacao_ID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `Avaliacao_Vendedor`
--
ALTER TABLE `Avaliacao_Vendedor`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `carrinho`
--
ALTER TABLE `carrinho`
  MODIFY `idCarrinho` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de tabela `Categoria`
--
ALTER TABLE `Categoria`
  MODIFY `Categoria_ID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de tabela `Compra`
--
ALTER TABLE `Compra`
  MODIFY `Compra_ID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `Endereco`
--
ALTER TABLE `Endereco`
  MODIFY `Endereco_ID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `Item_Compra`
--
ALTER TABLE `Item_Compra`
  MODIFY `Item_ID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `Local_Retirada`
--
ALTER TABLE `Local_Retirada`
  MODIFY `Retirada_ID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `produtos`
--
ALTER TABLE `produtos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de tabela `Usuario`
--
ALTER TABLE `Usuario`
  MODIFY `Usuario_ID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `Avaliacao`
--
ALTER TABLE `Avaliacao`
  ADD CONSTRAINT `Avaliacao_ibfk_1` FOREIGN KEY (`Usuario_ID`) REFERENCES `Usuario` (`Usuario_ID`),
  ADD CONSTRAINT `Avaliacao_ibfk_2` FOREIGN KEY (`Produto_ID`) REFERENCES `produtos` (`id`);

--
-- Restrições para tabelas `Avaliacao_Vendedor`
--
ALTER TABLE `Avaliacao_Vendedor`
  ADD CONSTRAINT `Avaliacao_Vendedor_ibfk_1` FOREIGN KEY (`vendedor_id`) REFERENCES `Usuario` (`Usuario_ID`) ON DELETE CASCADE,
  ADD CONSTRAINT `Avaliacao_Vendedor_ibfk_2` FOREIGN KEY (`avaliador_id`) REFERENCES `Usuario` (`Usuario_ID`) ON DELETE CASCADE;

--
-- Restrições para tabelas `Compra`
--
ALTER TABLE `Compra`
  ADD CONSTRAINT `Compra_ibfk_1` FOREIGN KEY (`Usuario_ID`) REFERENCES `Usuario` (`Usuario_ID`);

--
-- Restrições para tabelas `Item_Compra`
--
ALTER TABLE `Item_Compra`
  ADD CONSTRAINT `Item_Compra_ibfk_1` FOREIGN KEY (`Compra_ID`) REFERENCES `Compra` (`Compra_ID`) ON DELETE CASCADE,
  ADD CONSTRAINT `Item_Compra_ibfk_2` FOREIGN KEY (`Produto_ID`) REFERENCES `produtos` (`id`);

--
-- Restrições para tabelas `Local_Retirada`
--
ALTER TABLE `Local_Retirada`
  ADD CONSTRAINT `Local_Retirada_ibfk_1` FOREIGN KEY (`Produto_ID`) REFERENCES `produtos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Local_Retirada_ibfk_2` FOREIGN KEY (`Endereco_ID`) REFERENCES `Endereco` (`Endereco_ID`) ON DELETE CASCADE;

--
-- Restrições para tabelas `Pessoa_Fisica`
--
ALTER TABLE `Pessoa_Fisica`
  ADD CONSTRAINT `Pessoa_Fisica_ibfk_1` FOREIGN KEY (`Usuario_ID`) REFERENCES `Usuario` (`Usuario_ID`) ON DELETE CASCADE;

--
-- Restrições para tabelas `Pessoa_Juridica`
--
ALTER TABLE `Pessoa_Juridica`
  ADD CONSTRAINT `Pessoa_Juridica_ibfk_1` FOREIGN KEY (`Usuario_ID`) REFERENCES `Usuario` (`Usuario_ID`) ON DELETE CASCADE;

--
-- Restrições para tabelas `produtos`
--
ALTER TABLE `produtos`
  ADD CONSTRAINT `fk_produto_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `Usuario` (`Usuario_ID`) ON DELETE SET NULL;
COMMIT;
