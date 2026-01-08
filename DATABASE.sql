-- DANGER: This script will DELETE ALL DATA and recreate the database schema
-- Run this in the Supabase SQL Editor

-- 1. Drop existing tables (order matters for foreign keys)
DROP TABLE IF EXISTS "historico_ordem" CASCADE;
DROP TABLE IF EXISTS "order_documents" CASCADE;
DROP TABLE IF EXISTS "itens_checklist" CASCADE;
DROP TABLE IF EXISTS "itens_ordem" CASCADE;
DROP TABLE IF EXISTS "ordens_servico" CASCADE;
DROP TABLE IF EXISTS "transacoes" CASCADE;
DROP TABLE IF EXISTS "veiculos" CASCADE;
DROP TABLE IF EXISTS "clientes" CASCADE;
DROP TABLE IF EXISTS "usuarios" CASCADE;
DROP TABLE IF EXISTS "itens_estoque" CASCADE;
DROP TABLE IF EXISTS "servicos" CASCADE;
DROP TABLE IF EXISTS "cambios" CASCADE;
DROP TABLE IF EXISTS "marcas" CASCADE;
DROP TABLE IF EXISTS "configuracoes" CASCADE;

-- 2. Create Tables

-- Configurações
CREATE TABLE "configuracoes" (
    "id" TEXT PRIMARY KEY,
    "nome_oficina" TEXT,
    "cnpj" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "cep" TEXT,
    "endereco" TEXT,
    "numero" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "logo_url" TEXT,
    "horario_funcionamento" JSONB
);

-- Usuários
CREATE TABLE "usuarios" (
    "id" TEXT PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "papel" TEXT NOT NULL -- 'ADMIN', 'MECHANIC', 'ADVISOR'
);

-- Marcas
CREATE TABLE "marcas" (
    "id" TEXT PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "logo_url" TEXT
);

-- Câmbios (Gearboxes)
CREATE TABLE "cambios" (
    "id" TEXT PRIMARY KEY,
    "codigo" TEXT,
    "modelo" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "tipo" TEXT,
    "specs" TEXT,
    "tempo_montagem" TEXT
);

-- Serviços (Mão de Obra)
CREATE TABLE "servicos" (
    "id" TEXT PRIMARY KEY,
    "codigo" TEXT,
    "nome" TEXT NOT NULL,
    "categoria" TEXT,
    "preco" NUMERIC(10, 2) DEFAULT 0,
    "tempo" TEXT
);

-- Itens de Estoque (Peças)
CREATE TABLE "itens_estoque" (
    "id" TEXT PRIMARY KEY,
    "codigo" TEXT,
    "nome" TEXT NOT NULL,
    "fornecedor" TEXT,
    "preco_custo" NUMERIC(10, 2) DEFAULT 0,
    "preco_venda" NUMERIC(10, 2) DEFAULT 0,
    "estoque" INTEGER DEFAULT 0,
    "estoque_minimo" INTEGER DEFAULT 0
);

-- Clientes
CREATE TABLE "clientes" (
    "id" TEXT PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "cpf" TEXT
);

-- Veículos
CREATE TABLE "veiculos" (
    "id" TEXT PRIMARY KEY,
    "id_cliente" TEXT REFERENCES "clientes"("id") ON DELETE CASCADE,
    "placa" TEXT,
    "modelo" TEXT,
    "marca" TEXT,
    "ano" INTEGER,
    "cor" TEXT
);

-- Transações Financeiras
CREATE TABLE "transacoes" (
    "id" TEXT PRIMARY KEY,
    "descricao" TEXT,
    "categoria" TEXT,
    "valor" NUMERIC(10, 2),
    "tipo" TEXT, -- 'IN', 'OUT'
    "status" TEXT, -- 'PENDING', 'PAID'
    "data" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ordens de Serviço (OS)
CREATE TABLE "ordens_servico" (
    "id" TEXT PRIMARY KEY, -- ex: OS-123
    "id_veiculo" TEXT REFERENCES "veiculos"("id") ON DELETE SET NULL,
    "status" TEXT NOT NULL, -- 'RECEPTION', 'BUDGET', etc
    "prioridade" TEXT, -- 'LOW', 'MEDIUM', 'HIGH'
    "categoria" TEXT, -- 'PRIVATE', 'COMPANY'
    "quilometragem" INTEGER DEFAULT 0,
    "nivel_combustivel" INTEGER DEFAULT 0, -- 0-100
    "defeito_relatado" TEXT,
    "diagnostico" TEXT,
    "id_mecanico" TEXT, -- Pode referenciar usuarios.id (opcional)
    "data_agendamento" TIMESTAMP WITH TIME ZONE,
    "criado_em" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "atualizado_em" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Itens da OS (Peças e Serviços)
CREATE TABLE "itens_ordem" (
    "id" TEXT PRIMARY KEY,
    "id_ordem" TEXT REFERENCES "ordens_servico"("id") ON DELETE CASCADE,
    "tipo" TEXT NOT NULL, -- 'PART', 'SERVICE'
    "descricao" TEXT NOT NULL,
    "quantidade" NUMERIC(10, 2) DEFAULT 1,
    "preco" NUMERIC(10, 2) DEFAULT 0
);

-- Itens Checklist
CREATE TABLE "itens_checklist" (
    "id" TEXT PRIMARY KEY,
    "id_ordem" TEXT REFERENCES "ordens_servico"("id") ON DELETE CASCADE,
    "rotulo" TEXT NOT NULL,
    "marcado" BOOLEAN DEFAULT FALSE
);

-- Documentos da OS
CREATE TABLE "order_documents" (
    "id" TEXT PRIMARY KEY,
    "order_id" TEXT REFERENCES "ordens_servico"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Histórico de Alterações (Logs)
CREATE TABLE "historico_ordem" (
    "id" TEXT PRIMARY KEY,
    "id_ordem" TEXT REFERENCES "ordens_servico"("id") ON DELETE CASCADE,
    "acao" TEXT NOT NULL,
    "diff" TEXT,
    "data_hora" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "id_usuario" TEXT -- Opcional, quem fez a ação
);

-- 3. Enable Row Level Security (RLS) and Create Permissive Policies
-- WARNING: This allows ALL users (anon & authenticated) to do EVERYTHING.
-- Ideal for development/demo. For production, restrict 'anon'.

-- Helper macro not possible in pure SQL script without plpgsql, so we repeat.

-- Tabela configuracoes
ALTER TABLE "configuracoes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON "configuracoes" FOR ALL USING (true) WITH CHECK (true);

-- Tabela usuarios
ALTER TABLE "usuarios" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON "usuarios" FOR ALL USING (true) WITH CHECK (true);

-- Tabela marcas
ALTER TABLE "marcas" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON "marcas" FOR ALL USING (true) WITH CHECK (true);

-- Tabela cambios
ALTER TABLE "cambios" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON "cambios" FOR ALL USING (true) WITH CHECK (true);

-- Tabela servicos
ALTER TABLE "servicos" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON "servicos" FOR ALL USING (true) WITH CHECK (true);

-- Tabela itens_estoque
ALTER TABLE "itens_estoque" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON "itens_estoque" FOR ALL USING (true) WITH CHECK (true);

-- Tabela clientes
ALTER TABLE "clientes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON "clientes" FOR ALL USING (true) WITH CHECK (true);

-- Tabela veiculos
ALTER TABLE "veiculos" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON "veiculos" FOR ALL USING (true) WITH CHECK (true);

-- Tabela transacoes
ALTER TABLE "transacoes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON "transacoes" FOR ALL USING (true) WITH CHECK (true);

-- Tabela ordens_servico
ALTER TABLE "ordens_servico" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON "ordens_servico" FOR ALL USING (true) WITH CHECK (true);

-- Tabela itens_ordem
ALTER TABLE "itens_ordem" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON "itens_ordem" FOR ALL USING (true) WITH CHECK (true);

-- Tabela itens_checklist
ALTER TABLE "itens_checklist" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON "itens_checklist" FOR ALL USING (true) WITH CHECK (true);

-- Tabela order_documents
ALTER TABLE "order_documents" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON "order_documents" FOR ALL USING (true) WITH CHECK (true);

-- Tabela historico_ordem
ALTER TABLE "historico_ordem" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON "historico_ordem" FOR ALL USING (true) WITH CHECK (true);

-- 4. Insert Default Data (Optional but recommended so app isn't blank)

-- Insert Settings
INSERT INTO configuracoes (id, nome_oficina, horario_funcionamento) 
VALUES ('geral', 'Oficina Master Pro', '{"segunda": {" ativo": true, "inicio": "08:00", "fim": "18:00"}}');

-- Insert Sample Brands
INSERT INTO marcas (id, nome) VALUES 
('m-1', 'Volkswagen'), ('m-2', 'Toyota'), ('m-3', 'Honda'), ('m-4', 'Ford'), ('m-5', 'Chevrolet');

-- Insert Sample Gearboxes
INSERT INTO cambios (id, modelo, marca, tipo, specs) VALUES
('g-1', 'DSG DQ200', 'Volkswagen', 'Automático', '7 marchas de dupla embreagem a seco'),
('g-2', 'CVT K120', 'Toyota', 'CVT', 'Transmissão CVT Direct Shift');

-- Insert Sample Services
INSERT INTO servicos (id, nome, categoria, preco) VALUES
('s-1', 'Troca de Óleo Câmbio', 'Manutenção', 450.00),
('s-2', 'Diagnóstico Eletrônico', 'Diagnóstico', 250.00);

-- Insert Sample Inventory
INSERT INTO itens_estoque (id, nome, preco_venda, estoque) VALUES
('p-1', 'Kit Embreagem DSG', 2500.00, 5),
('p-2', 'Óleo Câmbio CVT (Litro)', 120.00, 20);

-- Insert Sample Mechanics
INSERT INTO usuarios (id, nome, papel) VALUES
('u-1', 'Carlos Silva', 'MECHANIC'),
('u-2', 'Ana Souza', 'ADVISOR');

