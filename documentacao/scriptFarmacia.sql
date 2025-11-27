-- ===============================================
-- SISTEMA DE FARMÁCIA - SCRIPT COMPLETO (PostgreSQL)
-- ===============================================

-- 🧹 LIMPEZA DO BANCO
DROP TABLE IF EXISTS public.pagamento_has_forma_pagamento CASCADE;
DROP TABLE IF EXISTS public.pagamento CASCADE;
DROP TABLE IF EXISTS public.pedido_has_produto CASCADE;
DROP TABLE IF EXISTS public.pedido CASCADE;
DROP TABLE IF EXISTS public.produto CASCADE;
DROP TABLE IF EXISTS public.cliente CASCADE;
DROP TABLE IF EXISTS public.funcionario CASCADE;
DROP TABLE IF EXISTS public.cargo CASCADE;
DROP TABLE IF EXISTS public.forma_pagamento CASCADE;
DROP TABLE IF EXISTS public.categoria CASCADE;
DROP TABLE IF EXISTS public.pessoa CASCADE;

-- ===============================================
-- 📋 CRIAÇÃO DAS TABELAS
-- ===============================================

CREATE TABLE public.pessoa (
    cpf_pessoa VARCHAR(20) PRIMARY KEY,
    nome_pessoa VARCHAR(60),
    data_nascimento_pessoa DATE,
    endereco_pessoa VARCHAR(150),
    senha_pessoa VARCHAR(50),
    email_pessoa VARCHAR(75) UNIQUE
);

CREATE TABLE public.cargo (
    id_cargo SERIAL PRIMARY KEY,
    nome_cargo VARCHAR(45)
);

CREATE TABLE public.categoria (
    id_categoria SERIAL PRIMARY KEY,
    nome_categoria VARCHAR(45)
);

CREATE TABLE public.cliente (
    pessoa_cpf_pessoa VARCHAR(20) PRIMARY KEY REFERENCES public.pessoa(cpf_pessoa),
    renda_cliente DOUBLE PRECISION,
    data_cadastro_cliente DATE
);

CREATE TABLE public.funcionario (
    pessoa_cpf_pessoa VARCHAR(20) PRIMARY KEY REFERENCES public.pessoa(cpf_pessoa),
    salario_funcionario DOUBLE PRECISION,
    cargo_id_cargo INTEGER REFERENCES public.cargo(id_cargo),
    porcentagem_comissao_funcionario DOUBLE PRECISION
);

CREATE TABLE public.produto (
    id_produto SERIAL PRIMARY KEY,
    nome_produto VARCHAR(45),
    categoria_id_categoria INTEGER REFERENCES public.categoria(id_categoria),
    quantidade_estoque_produto INTEGER,
    preco_unitario_produto DOUBLE PRECISION
);

CREATE TABLE public.pedido (
    id_pedido SERIAL PRIMARY KEY,
    data_pedido DATE,
    cliente_pessoa_cpf_pessoa VARCHAR(20) REFERENCES public.cliente(pessoa_cpf_pessoa),
    funcionario_pessoa_cpf_pessoa VARCHAR(20) REFERENCES public.funcionario(pessoa_cpf_pessoa)
);

CREATE TABLE public.pagamento (
    pedido_id_pedido INTEGER PRIMARY KEY REFERENCES public.pedido(id_pedido),
    data_pagamento TIMESTAMP,
    valor_total_pagamento DOUBLE PRECISION
);

CREATE TABLE public.forma_pagamento (
    id_forma_pagamento SERIAL PRIMARY KEY,
    nome_forma_pagamento VARCHAR(100)
);

CREATE TABLE public.pedido_has_produto (
    produto_id_produto INTEGER REFERENCES public.produto(id_produto),
    pedido_id_pedido INTEGER REFERENCES public.pedido(id_pedido),
    quantidade INTEGER,
    preco_unitario DOUBLE PRECISION,
    PRIMARY KEY (produto_id_produto, pedido_id_pedido)
);

CREATE TABLE public.pagamento_has_forma_pagamento (
    pagamento_id_pedido INTEGER REFERENCES public.pagamento(pedido_id_pedido),
    forma_pagamento_id_forma_pagamento INTEGER REFERENCES public.forma_pagamento(id_forma_pagamento),
    valor_pago DOUBLE PRECISION,
    PRIMARY KEY (pagamento_id_pedido, forma_pagamento_id_forma_pagamento)
);

-- ===============================================
-- 👤 DADOS DE PESSOAS, CARGOS, CLIENTES E FUNCIONÁRIOS
-- ===============================================

INSERT INTO public.pessoa VALUES
('11111111111', 'Maria da Silva', '1990-01-10', 'Rua das Flores, 123', 'senha123', 'maria@gmail.com'),
('22222222222', 'João Souza', '1985-03-15', 'Av. Brasil, 456', 'senha123', 'joao@gmail.com'),
('33333333333', 'Ana Costa', '1992-07-21', 'Rua das Palmeiras, 789', 'senha123', 'ana@gmail.com'),
('44444444444', 'Carlos Pereira', '1988-12-05', 'Av. Central, 100', 'senha123', 'carlos@gmail.com'),
('55555555555', 'Fernanda Lima', '1995-09-12', 'Rua A, 50', 'senha123', 'fernanda@gmail.com'),
('66666666666', 'Rafael Gomes', '1991-05-30', 'Rua B, 60', 'senha123', 'rafael@gmail.com'),
('77777777777', 'Patrícia Santos', '1989-11-22', 'Rua C, 70', 'senha123', 'patricia@gmail.com'),
('88888888888', 'Bruno Almeida', '1987-02-18', 'Rua D, 80', 'senha123', 'bruno@gmail.com'),
('99999999999', 'Juliana Rocha', '1993-08-09', 'Rua E, 90', 'senha123', 'juliana@gmail.com'),
('10101010101', 'Lucas Ferreira', '1986-06-25', 'Rua F, 100', 'senha123', 'lucas@gmail.com');

-- Cargos
INSERT INTO public.cargo (nome_cargo) VALUES
('Atendente'),
('Caixa'),
('Farmacêutico');

-- Clientes
INSERT INTO public.cliente VALUES
('11111111111', 2500, '2024-01-10'),
('33333333333', 3200, '2024-01-12'),
('44444444444', 1800, '2024-01-15'),
('55555555555', 4200, '2024-01-18'),
('66666666666', 3100, '2024-01-20'),
('77777777777', 2750, '2024-01-22'),
('88888888888', 3600, '2024-01-25'),
('99999999999', 2900, '2024-01-28'),
('10101010101', 5000, '2024-02-01');

-- Funcionários
INSERT INTO public.funcionario VALUES
('22222222222', 2800, 1, 0.05),
('33333333333', 3000, 2, 0.10),
('44444444444', 3500, 3, 0.12),
('55555555555', 2800, 1, 0.05),
('66666666666', 3000, 2, 0.08),
('77777777777', 3100, 3, 0.12),
('88888888888', 2900, 1, 0.06),
('99999999999', 2700, 2, 0.07),
('10101010101', 3300, 3, 0.10);

-- ===============================================
-- 💊 CATEGORIAS E PRODUTOS
-- ===============================================

INSERT INTO public.categoria (nome_categoria) VALUES
('Analgésico'),
('Antibiótico'),
('Antialérgico'),
('Antigripal'),
('Antiinflamatório');

INSERT INTO public.produto (nome_produto, categoria_id_categoria, quantidade_estoque_produto, preco_unitario_produto) VALUES
('Paracetamol', 1, 200, 5.00),
('Dipirona', 1, 150, 6.00),
('Amoxicilina', 2, 100, 12.00),
('Azitromicina', 2, 80, 15.00),
('Loratadina', 3, 120, 10.00),
('Desloratadina', 3, 100, 11.00),
('Benegrip', 4, 90, 8.00),
('Neosoro', 4, 50, 6.00),
('Diclofenaco', 5, 70, 9.50),
('Nimesulida', 5, 60, 8.50);

-- ===============================================
-- 💳 FORMAS DE PAGAMENTO
-- ===============================================

INSERT INTO public.forma_pagamento (nome_forma_pagamento) VALUES
('Dinheiro'),
('Cartão de Crédito'),
('Pix');

-- ===============================================
-- 🧾 PEDIDOS, PAGAMENTOS E RELAÇÕES
-- ===============================================

INSERT INTO public.pedido (data_pedido, cliente_pessoa_cpf_pessoa, funcionario_pessoa_cpf_pessoa) VALUES
('2024-02-01', '44444444444', '22222222222'),
('2024-02-02', '77777777777', '44444444444'),
('2024-02-03', '55555555555', '66666666666'),
('2024-02-04', '99999999999', '88888888888'),
('2024-02-05', '33333333333', '10101010101');

INSERT INTO public.pagamento VALUES
(1, '2024-02-01 10:00:00', 50),
(2, '2024-02-02 11:00:00', 30),
(3, '2024-02-03 12:00:00', 20),
(4, '2024-02-04 13:00:00', 70),
(5, '2024-02-05 14:00:00', 100);

INSERT INTO public.pedido_has_produto VALUES
(1, 1, 2, 5.00),   -- Paracetamol
(2, 2, 1, 6.00),   -- Dipirona
(3, 3, 1, 12.00),  -- Amoxicilina
(4, 4, 2, 15.00),  -- Azitromicina
(5, 5, 1, 10.00);  -- Loratadina

INSERT INTO public.pagamento_has_forma_pagamento VALUES
(1, 1, 20),
(2, 2, 30),
(3, 3, 20),
(4, 1, 70),
(5, 2, 100);

-- ===============================================
-- ✅ FIM DO SCRIPT
-- ===============================================
