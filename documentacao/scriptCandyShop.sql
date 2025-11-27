-- 1. Remoção de objetos existentes (garante que o script rode limpo)
DROP TABLE IF EXISTS public.pagamento_has_forma_pagamento CASCADE;
DROP TABLE IF EXISTS public.pagamento CASCADE;
DROP TABLE IF EXISTS public.pedido_has_produto CASCADE;
DROP TABLE IF EXISTS public.pedido CASCADE;
DROP TABLE IF EXISTS public.produto CASCADE;
DROP TABLE IF EXISTS public.cliente CASCADE;
DROP TABLE IF EXISTS public.funcionario CASCADE;
DROP TABLE IF EXISTS public.cargo CASCADE;
DROP TABLE IF EXISTS public.forma_pagamento CASCADE;
DROP TABLE IF EXISTS public.pessoa CASCADE;

-- 2. Criação das Tabelas
-----------------------------------------------------------------------------------------------------

-- Tabela Pessoa
CREATE TABLE public.pessoa (
    cpf_pessoa character varying(20) NOT NULL PRIMARY KEY,
    nome_pessoa character varying(60),
    data_nascimento_pessoa date,
    endereco_pessoa character varying(150),
    senha_pessoa character varying(50),
    email_pessoa character varying(75) UNIQUE
);

-- Tabela Cargo
CREATE TABLE public.cargo (
    id_cargo integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- Simplificando com GENERATED ALWAYS
    nome_cargo character varying(45)
);

-- Tabela Cliente
CREATE TABLE public.cliente (
    pessoa_cpf_pessoa character varying(20) NOT NULL PRIMARY KEY REFERENCES public.pessoa(cpf_pessoa),
    renda_cliente double precision,
    data_cadastro_cliente date
);

-- Tabela Funcionario
CREATE TABLE public.funcionario (
    pessoa_cpf_pessoa character varying(20) NOT NULL PRIMARY KEY REFERENCES public.pessoa(cpf_pessoa),
    salario_funcionario double precision,
    cargo_id_cargo integer REFERENCES public.cargo(id_cargo),
    porcentagem_comissao_funcionario double precision
);

-- Tabela Produto
CREATE TABLE public.produto (
    id_produto integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome_produto character varying(45),
    quantidade_estoque_produto integer,
    preco_unitario_produto double precision
);

-- Tabela Pedido
CREATE TABLE public.pedido (
    id_pedido integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    data_pedido date,
    cliente_pessoa_cpf_pessoa character varying(20) REFERENCES public.cliente(pessoa_cpf_pessoa),
    funcionario_pessoa_cpf_pessoa character varying(20) REFERENCES public.funcionario(pessoa_cpf_pessoa)
);

-- Tabela Pagamento
CREATE TABLE public.pagamento (
    pedido_id_pedido integer NOT NULL PRIMARY KEY REFERENCES public.pedido(id_pedido),
    data_pagamento timestamp without time zone,
    valor_total_pagamento double precision
);

-- Tabela Forma_Pagamento
CREATE TABLE public.forma_pagamento (
    id_forma_pagamento integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome_forma_pagamento character varying(100)
);

-- Tabela Pedido_Has_Produto (Muitos para Muitos)
CREATE TABLE public.pedido_has_produto (
    produto_id_produto integer NOT NULL REFERENCES public.produto(id_produto),
    pedido_id_pedido integer NOT NULL REFERENCES public.pedido(id_pedido),
    quantidade integer,
    preco_unitario double precision,
    PRIMARY KEY (produto_id_produto, pedido_id_pedido)
);

-- Tabela Pagamento_Has_Forma_Pagamento (Muitos para Muitos)
CREATE TABLE public.pagamento_has_forma_pagamento (
    pagamento_id_pedido integer NOT NULL REFERENCES public.pagamento(pedido_id_pedido),
    forma_pagamento_id_forma_pagamento integer NOT NULL REFERENCES public.forma_pagamento(id_forma_pagamento),
    valor_pago double precision,
    PRIMARY KEY (pagamento_id_pedido, forma_pagamento_id_forma_pagamento)
);

-- 3. Inserção dos Dados
-----------------------------------------------------------------------------------------------------

-- Dados para Pessoa
INSERT INTO public.pessoa VALUES ('10101010101', 'Juliana Dias ssss', '1989-10-25', 'lins, 352 ssss', '1111', 'juliana@email.comm');
INSERT INTO public.pessoa VALUES ('33333333333', 'Carlos Pereira', '1992-03-20', 'Rua que Judas perdeu as botas, 234', '.123456', 'carlos@email.com');
INSERT INTO public.pessoa VALUES ('44444444444', 'Ana Lima', '1995-04-25', 'Alameda do medo, 4534 apto 13', '.123456', 'ana@email.com');
INSERT INTO public.pessoa VALUES ('55555555555', 'Lucas Mendes', '1988-05-30', 'Rua sexta_feira, 13 _ apto 666', '.123456', 'lucas@email.com');
INSERT INTO public.pessoa VALUES ('66666666666', 'Fernanda Costa', '1993-06-05', 'muito longe, 243', '.123456', 'fernanda@email.com');
INSERT INTO public.pessoa VALUES ('77777777777', 'Ricardo Alves', '1987-07-10', 'far far faraway, 34', '.123456', 'ricardo@email.com');
INSERT INTO public.pessoa VALUES ('88888888888', 'Patrícia Gomes', '1994-08-15', 'acolá, 54', '.123456', 'patricia@email.com');
INSERT INTO public.pessoa VALUES ('99999999999', 'Marcos Rocha', '1991-09-20', 'kaxa prego _ ilha de itaparica', '.123456', 'marcos@email.com');
INSERT INTO public.pessoa VALUES ('22222222222', 'Maria Souza', '1985-02-15', 'lá longe, 1234', '.123456', 'maria@email.com');
INSERT INTO public.pessoa VALUES ('1', 'Berola', '2025-10-16', 'Lá onde Judas perdeu a unha, s/n', '12345', 'berola@gmail.com');
INSERT INTO public.pessoa VALUES ('2', 'dois', '2025-10-07', 'Rua das Magnólias', '321acb', 'dois@email.com');
INSERT INTO public.pessoa VALUES ('11111111111', 'João Silva', '2025-01-01', 'algum lugar', '.123456', 'joao@email.com');

-- Dados para Cargo
INSERT INTO public.cargo (nome_cargo) VALUES ('Vendedor');
INSERT INTO public.cargo (nome_cargo) VALUES ('Gerente');
INSERT INTO public.cargo (nome_cargo) VALUES ('Caixa');
INSERT INTO public.cargo (nome_cargo) VALUES ('Supervisor');
INSERT INTO public.cargo (nome_cargo) VALUES ('Atendente');
INSERT INTO public.cargo (nome_cargo) VALUES ('Repositor');
INSERT INTO public.cargo (nome_cargo) VALUES ('Conferente');
INSERT INTO public.cargo (nome_cargo) VALUES ('Assistente');
INSERT INTO public.cargo (nome_cargo) VALUES ('Auxiliar');
INSERT INTO public.cargo (nome_cargo) VALUES ('Diretor');

-- Dados para Cliente
INSERT INTO public.cliente VALUES ('22222222222', 3200, '2024-01-02');
INSERT INTO public.cliente VALUES ('33333333333', 1800, '2024-01-03');
INSERT INTO public.cliente VALUES ('44444444444', 4000, '2024-01-04');
INSERT INTO public.cliente VALUES ('55555555555', 2100, '2024-01-05');
INSERT INTO public.cliente VALUES ('66666666666', 3500, '2024-01-06');
INSERT INTO public.cliente VALUES ('77777777777', 2700, '2024-01-07');
INSERT INTO public.cliente VALUES ('88888888888', 5000, '2024-01-08');
INSERT INTO public.cliente VALUES ('99999999999', 3800, '2024-01-09');
INSERT INTO public.cliente VALUES ('11111111111', 2500, NULL);
INSERT INTO public.cliente VALUES ('10101010101', 4500, '2024-01-10');
INSERT INTO public.cliente VALUES ('1', 1111, '2025-10-11');
INSERT INTO public.cliente VALUES ('2', 22222, '2025-10-15');

-- Dados para Funcionario
INSERT INTO public.funcionario VALUES ('22222222222', 3000, 2, 10);
INSERT INTO public.funcionario VALUES ('33333333333', 1500, 3, 3);
INSERT INTO public.funcionario VALUES ('44444444444', 2500, 4, 6);
INSERT INTO public.funcionario VALUES ('55555555555', 1800, 5, 4);
INSERT INTO public.funcionario VALUES ('66666666666', 1600, 6, 2);
INSERT INTO public.funcionario VALUES ('77777777777', 2200, 7, 5);
INSERT INTO public.funcionario VALUES ('88888888888', 1900, 8, 3);
INSERT INTO public.funcionario VALUES ('99999999999', 2800, 9, 7);
INSERT INTO public.funcionario VALUES ('11111111111', 20005, NULL, NULL);
INSERT INTO public.funcionario VALUES ('10101010101', 5000, 2, 15);
INSERT INTO public.funcionario VALUES ('1', 1111, 9, 1);
INSERT INTO public.funcionario VALUES ('2', 2222, 10, 2);

-- Dados para Produto
INSERT INTO public.produto (nome_produto, quantidade_estoque_produto, preco_unitario_produto) VALUES ('Chocolate', 100, 5.5);
INSERT INTO public.produto (nome_produto, quantidade_estoque_produto, preco_unitario_produto) VALUES ('Bala', 200, 0.5);
INSERT INTO public.produto (nome_produto, quantidade_estoque_produto, preco_unitario_produto) VALUES ('Pirulito', 150, 1);
INSERT INTO public.produto (nome_produto, quantidade_estoque_produto, preco_unitario_produto) VALUES ('Biscoito', 80, 3.2);
INSERT INTO public.produto (nome_produto, quantidade_estoque_produto, preco_unitario_produto) VALUES ('Refrigerante', 50, 7);
INSERT INTO public.produto (nome_produto, quantidade_estoque_produto, preco_unitario_produto) VALUES ('Suco', 60, 4.5);
INSERT INTO public.produto (nome_produto, quantidade_estoque_produto, preco_unitario_produto) VALUES ('Chiclete', 300, 0.75);
INSERT INTO public.produto (nome_produto, quantidade_estoque_produto, preco_unitario_produto) VALUES ('Pão de Mel', 40, 6);
INSERT INTO public.produto (nome_produto, quantidade_estoque_produto, preco_unitario_produto) VALUES ('Doce de Leite', 30, 8.5);
INSERT INTO public.produto (nome_produto, quantidade_estoque_produto, preco_unitario_produto) VALUES ('Sorvete', 20, 10);

-- Dados para Forma_Pagamento
INSERT INTO public.forma_pagamento (nome_forma_pagamento) VALUES ('Dinheiro');
INSERT INTO public.forma_pagamento (nome_forma_pagamento) VALUES ('Cartão de Crédito');
INSERT INTO public.forma_pagamento (nome_forma_pagamento) VALUES ('Cartão de Débito');
INSERT INTO public.forma_pagamento (nome_forma_pagamento) VALUES ('Pix');
INSERT INTO public.forma_pagamento (nome_forma_pagamento) VALUES ('Boleto');
INSERT INTO public.forma_pagamento (nome_forma_pagamento) VALUES ('Vale Alimentação');
INSERT INTO public.forma_pagamento (nome_forma_pagamento) VALUES ('Transferência Bancária');
INSERT INTO public.forma_pagamento (nome_forma_pagamento) VALUES ('Cheque');
INSERT INTO public.forma_pagamento (nome_forma_pagamento) VALUES ('Crédito Loja');
INSERT INTO public.forma_pagamento (nome_forma_pagamento) VALUES ('Gift Card');

-- Dados para Pedido
-- Note que o ID é gerado automaticamente, mas como o script original especificava IDs,
-- vamos usar SETVAL para alinhar com o dump original (embora para iniciantes, gerar o ID seja mais fácil).
-- Para este script simplificado, usaremos INSERT que o PostgreSQL irá gerenciar os IDs automaticamente.

INSERT INTO public.pedido (data_pedido, cliente_pessoa_cpf_pessoa, funcionario_pessoa_cpf_pessoa) VALUES 
('2024-02-01', '44444444444', '22222222222'),  -- ID 1
('2024-02-02', '77777777777', '44444444444'),  -- ID 2
('2024-02-03', '55555555555', '66666666666'),  -- ID 3
('2024-02-04', '99999999999', '88888888888'),  -- ID 4
('2024-02-05', '33333333333', '10101010101'), -- ID 5
('2024-02-06', '22222222222', '11111111111'), -- ID 6
('2024-02-07', '44444444444', '33333333333'), -- ID 7
('2024-02-08', '66666666666', '55555555555'), -- ID 8
('2024-02-09', '88888888888', '77777777777'), -- ID 9
('2024-02-10', '10101010101', '99999999999'), -- ID 10
('2025-10-10', '33333333333', '22222222222'), -- ID 11
('2025-10-10', '10101010101', '11111111111'); -- ID 12


-- Dados para Pagamento (Assume que os IDs de Pedido são sequenciais)
INSERT INTO public.pagamento VALUES (1, '2024-02-01 10:00:00', 50);
INSERT INTO public.pagamento VALUES (2, '2024-02-02 11:00:00', 30);
INSERT INTO public.pagamento VALUES (3, '2024-02-03 12:00:00', 20);
INSERT INTO public.pagamento VALUES (4, '2024-02-04 13:00:00', 70);
INSERT INTO public.pagamento VALUES (5, '2024-02-05 14:00:00', 100);
INSERT INTO public.pagamento VALUES (6, '2024-02-06 15:00:00', 80);
INSERT INTO public.pagamento VALUES (7, '2024-02-07 16:00:00', 25);
INSERT INTO public.pagamento VALUES (8, '2024-02-08 17:00:00', 45);
INSERT INTO public.pagamento VALUES (9, '2024-02-09 18:00:00', 60);
INSERT INTO public.pagamento VALUES (10, '2024-02-10 19:00:00', 90);

-- Dados para Pedido_Has_Produto (IDs de Pedido no dump original são usados)
INSERT INTO public.pedido_has_produto VALUES (1, 1, 2, 5.5);
INSERT INTO public.pedido_has_produto VALUES (2, 2, 10, 0.5);
INSERT INTO public.pedido_has_produto VALUES (3, 2, 5, 1);
INSERT INTO public.pedido_has_produto VALUES (4, 2, 3, 3.2);
INSERT INTO public.pedido_has_produto VALUES (5, 5, 2, 7);
INSERT INTO public.pedido_has_produto VALUES (3, 1, 3, 1);
INSERT INTO public.pedido_has_produto VALUES (2, 3, 1, 0.5);
INSERT INTO public.pedido_has_produto VALUES (4, 4, 4, 4);
INSERT INTO public.pedido_has_produto VALUES (2, 1, 1000, 0.7);
-- Usando ID 11 que foi gerado como o próximo pedido, em substituição ao 20 do original
INSERT INTO public.pedido_has_produto VALUES (2, 11, 1, 0.5); 


-- Dados para Pagamento_Has_Forma_Pagamento
INSERT INTO public.pagamento_has_forma_pagamento VALUES (1, 1, 20);
INSERT INTO public.pagamento_has_forma_pagamento VALUES (2, 2, 30);
INSERT INTO public.pagamento_has_forma_pagamento VALUES (3, 3, 15);
INSERT INTO public.pagamento_has_forma_pagamento VALUES (4, 4, 50);
INSERT INTO public.pagamento_has_forma_pagamento VALUES (5, 5, 100);

-- Fim do Script
-----------------------------------------------------------------------------------------------------