-- ============================================================================
-- SOLUÇÃO 100% FUNCIONAL - Multi-Tenant Database
-- ============================================================================
-- Este script cria um banco multi-tenant que funciona com o código modificado
-- Data: 2026-01-11
-- ============================================================================

-- ETAPA 1: LIMPEZA
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

-- ETAPA 2: CRIAR TABELAS COM user_id
CREATE TABLE "configuracoes" (
    "id" TEXT,
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
    "horario_funcionamento" JSONB,
    "whatsapp_message_template" TEXT,
    PRIMARY KEY (user_id, id)
);

CREATE TABLE "usuarios" (
    "id" TEXT,
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "nome" TEXT NOT NULL,
    "papel" TEXT NOT NULL,
    PRIMARY KEY (user_id, id)
);

CREATE TABLE "marcas" (
    "id" TEXT,
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "nome" TEXT NOT NULL,
    "logo_url" TEXT,
    PRIMARY KEY (user_id, id)
);

CREATE TABLE "cambios" (
    "id" TEXT,
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "codigo" TEXT,
    "modelo" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "tipo" TEXT,
    "specs" TEXT,
    "tempo_montagem" TEXT,
    PRIMARY KEY (user_id, id)
);

CREATE TABLE "servicos" (
    "id" TEXT,
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "codigo" TEXT,
    "nome" TEXT NOT NULL,
    "categoria" TEXT,
    "preco" NUMERIC(10, 2) DEFAULT 0,
    "tempo" TEXT,
    PRIMARY KEY (user_id, id)
);

CREATE TABLE "itens_estoque" (
    "id" TEXT,
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "codigo" TEXT,
    "nome" TEXT NOT NULL,
    "fornecedor" TEXT,
    "preco_custo" NUMERIC(10, 2) DEFAULT 0,
    "preco_venda" NUMERIC(10, 2) DEFAULT 0,
    "estoque" INTEGER DEFAULT 0,
    "estoque_minimo" INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, id)
);

CREATE TABLE "clientes" (
    "id" TEXT,
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "cpf" TEXT,
    "endereco" TEXT,
    "numero_endereco" TEXT,
    "cidade" TEXT,
    "cep" TEXT,
    "bairro" TEXT,
    "estado" TEXT,
    PRIMARY KEY (user_id, id)
);

CREATE TABLE "veiculos" (
    "id" TEXT,
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "id_cliente" TEXT NOT NULL,
    "placa" TEXT,
    "modelo" TEXT,
    "marca" TEXT,
    "ano" INTEGER,
    "cor" TEXT,
    PRIMARY KEY (user_id, id),
    FOREIGN KEY (user_id, id_cliente) REFERENCES clientes(user_id, id) ON DELETE CASCADE
);

CREATE TABLE "transacoes" (
    "id" TEXT,
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "descricao" TEXT,
    "categoria" TEXT,
    "valor" NUMERIC(10, 2),
    "tipo" TEXT,
    "status" TEXT,
    "data" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "id_ordem" TEXT,
    PRIMARY KEY (user_id, id)
);

CREATE TABLE "ordens_servico" (
    "id" TEXT,
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "id_veiculo" TEXT,
    "status" TEXT NOT NULL,
    "prioridade" TEXT,
    "categoria" TEXT,
    "quilometragem" INTEGER DEFAULT 0,
    "nivel_combustivel" INTEGER DEFAULT 0,
    "defeito_relatado" TEXT,
    "diagnostico" TEXT,
    "id_mecanico" TEXT,
    "data_agendamento" TIMESTAMP WITH TIME ZONE,
    "duracao_estimada" INTEGER,
    "desconto" NUMERIC(10, 2) DEFAULT 0,
    "tipo_desconto" TEXT DEFAULT 'value',
    "observacoes" TEXT,
    "criado_em" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "atualizado_em" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, id),
    FOREIGN KEY (user_id, id_veiculo) REFERENCES veiculos(user_id, id) ON DELETE SET NULL
);

CREATE TABLE "itens_ordem" (
    "id" TEXT,
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "id_ordem" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" NUMERIC(10, 2) DEFAULT 1,
    "preco" NUMERIC(10, 2) DEFAULT 0,
    PRIMARY KEY (user_id, id),
    FOREIGN KEY (user_id, id_ordem) REFERENCES ordens_servico(user_id, id) ON DELETE CASCADE
);

CREATE TABLE "itens_checklist" (
    "id" TEXT,
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "id_ordem" TEXT NOT NULL,
    "rotulo" TEXT NOT NULL,
    "marcado" BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (user_id, id),
    FOREIGN KEY (user_id, id_ordem) REFERENCES ordens_servico(user_id, id) ON DELETE CASCADE
);

CREATE TABLE "order_documents" (
    "id" TEXT,
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "order_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, id),
    FOREIGN KEY (user_id, order_id) REFERENCES ordens_servico(user_id, id) ON DELETE CASCADE
);

CREATE TABLE "historico_ordem" (
    "id" TEXT,
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "id_ordem" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "diff" TEXT,
    "data_hora" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "id_usuario" TEXT,
    PRIMARY KEY (user_id, id),
    FOREIGN KEY (user_id, id_ordem) REFERENCES ordens_servico(user_id, id) ON DELETE CASCADE
);

-- ETAPA 3: ROW LEVEL SECURITY
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "isolate_by_user" ON configuracoes FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "isolate_by_user" ON usuarios FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE marcas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "isolate_by_user" ON marcas FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE cambios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "isolate_by_user" ON cambios FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "isolate_by_user" ON servicos FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE itens_estoque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "isolate_by_user" ON itens_estoque FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "isolate_by_user" ON clientes FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "isolate_by_user" ON veiculos FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "isolate_by_user" ON transacoes FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "isolate_by_user" ON ordens_servico FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE itens_ordem ENABLE ROW LEVEL SECURITY;
CREATE POLICY "isolate_by_user" ON itens_ordem FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE itens_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "isolate_by_user" ON itens_checklist FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE order_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "isolate_by_user" ON order_documents FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE historico_ordem ENABLE ROW LEVEL SECURITY;
CREATE POLICY "isolate_by_user" ON historico_ordem FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- FIM
