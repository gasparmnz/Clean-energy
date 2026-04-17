===================================
-- Script SQL atualizado - Biomassa Hub
-- Inclui diferenciação de perfis comprador/vendedor
-- ================================================

CREATE DATABASE IF NOT EXISTS produtos;
USE produtos;

CREATE TABLE IF NOT EXISTS Usuario (
    Usuario_ID INT AUTO_INCREMENT PRIMARY KEY,
    Nome VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Senha VARCHAR(255) NOT NULL,
    Biografia VARCHAR(255),
    Tipo ENUM('PF','PJ') NOT NULL,
    Data_Criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Tentativas_Login INT DEFAULT 0,
    Ultimo_Login DATETIME
);

CREATE TABLE IF NOT EXISTS Pessoa_Fisica (
    Usuario_ID INT PRIMARY KEY,
    CPF CHAR(11) UNIQUE NOT NULL,
    FOREIGN KEY (Usuario_ID) REFERENCES Usuario(Usuario_ID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Pessoa_Juridica (
    Usuario_ID INT PRIMARY KEY,
    CNPJ CHAR(14) UNIQUE NOT NULL,
    FOREIGN KEY (Usuario_ID) REFERENCES Usuario(Usuario_ID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Categoria (
    Categoria_ID INT AUTO_INCREMENT PRIMARY KEY,
    Nome VARCHAR(50) NOT NULL UNIQUE
);

-- Tabela produtos usada pelo Node.js (nome em minúsculo, colunas em minúsculo)
CREATE TABLE IF NOT EXISTS produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255),
    preco DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    quantidade INT,
    imagem VARCHAR(255),
    categoria VARCHAR(100),
    local VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE produtos MODIFY quantidade DECIMAL(10,2);

ALTER TABLE produtos ADD COLUMN estado VARCHAR(50);

CREATE TABLE IF NOT EXISTS Endereco (
    Endereco_ID INT AUTO_INCREMENT PRIMARY KEY,
    Cidade VARCHAR(100),
    Estado VARCHAR(50),
    Rua VARCHAR(100),
    Bairro VARCHAR(100),
    Numero INT,
    Complemento VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS Local_Retirada (
    Retirada_ID INT AUTO_INCREMENT PRIMARY KEY,
    Produto_ID INT,
    Endereco_ID INT,
    FOREIGN KEY (Produto_ID) REFERENCES produtos(id) ON DELETE CASCADE,
    FOREIGN KEY (Endereco_ID) REFERENCES Endereco(Endereco_ID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Compra (
    Compra_ID INT AUTO_INCREMENT PRIMARY KEY,
    Usuario_ID INT,
    Data_Compra DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Usuario_ID) REFERENCES Usuario(Usuario_ID)
);

CREATE TABLE IF NOT EXISTS Item_Compra (
    Item_ID INT AUTO_INCREMENT PRIMARY KEY,
    Compra_ID INT,
    Produto_ID INT,
    Quantidade INT NOT NULL,
    FOREIGN KEY (Compra_ID) REFERENCES Compra(Compra_ID) ON DELETE CASCADE,
    FOREIGN KEY (Produto_ID) REFERENCES produtos(id)
);

CREATE TABLE IF NOT EXISTS Avaliacao (
    Avaliacao_ID INT AUTO_INCREMENT PRIMARY KEY,
    Nota INT CHECK (Nota BETWEEN 1 AND 5),
    Comentario VARCHAR(255),
    Usuario_ID INT,
    Produto_ID INT,
    FOREIGN KEY (Usuario_ID) REFERENCES Usuario(Usuario_ID),
    FOREIGN KEY (Produto_ID) REFERENCES produtos(id)
);

-- Inserir categorias padrão
INSERT IGNORE INTO Categoria (Nome) VALUES
  ('Lenha'), ('Pellets'), ('Cavaco'), ('Bagaço de cana'),
  ('Lixo orgânico'), ('Casca de arroz'), ('Folhas secas'), ('Biomassa geral');