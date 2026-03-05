-- ============================================================================
-- UNIFIED SCHEMA — MASTER (Single Source of Truth)
-- Oficina de Câmbio Management System
-- No Nota Fiscal / NF-e / fiscal tables included.
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- 1. CLEANUP (Drop in dependency order)
-- ============================================================================
DROP TABLE IF EXISTS "historico_ordem" CASCADE;
DROP TABLE IF EXISTS "order_documents" CASCADE;
DROP TABLE IF EXISTS "itens_checklist" CASCADE;
DROP TABLE IF EXISTS "itens_ordem" CASCADE;
DROP TABLE IF EXISTS "transacoes" CASCADE;
DROP TABLE IF EXISTS "ordens_servico" CASCADE;
DROP TABLE IF EXISTS "itens_estoque" CASCADE;
DROP TABLE IF EXISTS "veiculos" CASCADE;
DROP TABLE IF EXISTS "clientes" CASCADE;
DROP TABLE IF EXISTS "servicos" CASCADE;
DROP TABLE IF EXISTS "cambios" CASCADE;
DROP TABLE IF EXISTS "marcas" CASCADE;
DROP TABLE IF EXISTS "formas_pagamento" CASCADE;
DROP TABLE IF EXISTS "suppliers" CASCADE;
DROP TABLE IF EXISTS "usuarios" CASCADE;
DROP TABLE IF EXISTS "configuracoes" CASCADE;

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- Configurações
CREATE TABLE "configuracoes" (
    "id" TEXT PRIMARY KEY,
    "user_id" UUID DEFAULT auth.uid(),
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
    "auth_term_template" TEXT,
    "tema" TEXT DEFAULT 'light',
    "modo_barra_lateral" TEXT DEFAULT 'automatic'
);

-- Usuários
CREATE TABLE "usuarios" (
    "id" TEXT PRIMARY KEY,
    "user_id" UUID DEFAULT auth.uid(),
    "nome" TEXT NOT NULL,
    "papel" TEXT NOT NULL -- 'ADMIN', 'MECHANIC', 'ADVISOR'
);

-- Marcas
CREATE TABLE "marcas" (
    "id" TEXT PRIMARY KEY,
    "user_id" UUID DEFAULT auth.uid(),
    "nome" TEXT NOT NULL,
    "logo_url" TEXT
);

-- Câmbios
CREATE TABLE "cambios" (
    "id" TEXT PRIMARY KEY,
    "user_id" UUID DEFAULT auth.uid(),
    "codigo" TEXT,
    "modelo" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "tipo" TEXT,
    "specs" TEXT,
    "tempo_montagem" TEXT
);

-- Serviços
CREATE TABLE "servicos" (
    "id" TEXT PRIMARY KEY,
    "user_id" UUID DEFAULT auth.uid(),
    "codigo" TEXT,
    "nome" TEXT NOT NULL,
    "categoria" TEXT,
    "preco" NUMERIC(10, 2) DEFAULT 0,
    "tempo" TEXT
);

-- Itens de Estoque
CREATE TABLE "itens_estoque" (
    "id" TEXT PRIMARY KEY,
    "user_id" UUID DEFAULT auth.uid(),
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
    "user_id" UUID DEFAULT auth.uid(),
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "cpf" TEXT,
    "endereco" TEXT,
    "numero_endereco" TEXT,
    "cidade" TEXT,
    "cep" TEXT,
    "bairro" TEXT,
    "estado" TEXT
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
    "user_id" UUID DEFAULT auth.uid(),
    "descricao" TEXT,
    "categoria" TEXT,
    "valor" NUMERIC(10, 2),
    "tipo" TEXT,
    "status" TEXT,
    "data" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "id_ordem" TEXT,
    "forma_pagamento" TEXT
);

-- Ordens de Serviço
CREATE TABLE "ordens_servico" (
    "id" TEXT PRIMARY KEY,
    "user_id" UUID DEFAULT auth.uid(),
    "id_veiculo" TEXT REFERENCES "veiculos"("id") ON DELETE SET NULL,
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
    "atualizado_em" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Itens da OS
CREATE TABLE "itens_ordem" (
    "id" TEXT PRIMARY KEY,
    "id_ordem" TEXT REFERENCES "ordens_servico"("id") ON DELETE CASCADE,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" NUMERIC(10, 2) DEFAULT 1,
    "preco" NUMERIC(10, 2) DEFAULT 0,
    "waiting_parts" BOOLEAN DEFAULT FALSE,
    "expected_arrival" TIMESTAMP WITH TIME ZONE
);

-- Checklist
CREATE TABLE "itens_checklist" (
    "id" TEXT PRIMARY KEY,
    "id_ordem" TEXT REFERENCES "ordens_servico"("id") ON DELETE CASCADE,
    "rotulo" TEXT NOT NULL,
    "marcado" BOOLEAN DEFAULT FALSE
);

-- Documentos
CREATE TABLE "order_documents" (
    "id" TEXT PRIMARY KEY,
    "order_id" TEXT REFERENCES "ordens_servico"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Histórico de OS
CREATE TABLE "historico_ordem" (
    "id" TEXT PRIMARY KEY,
    "id_ordem" TEXT REFERENCES "ordens_servico"("id") ON DELETE CASCADE,
    "acao" TEXT NOT NULL,
    "diff" TEXT,
    "data_hora" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "id_usuario" TEXT
);

-- Formas de Pagamento
CREATE TABLE "formas_pagamento" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID DEFAULT auth.uid(),
    "name" TEXT NOT NULL,
    "active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Fornecedores
CREATE TABLE "suppliers" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID DEFAULT auth.uid(),
    "name" TEXT NOT NULL,
    "contact_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "cnpj" TEXT,
    "address" TEXT,
    "active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 3. RLS (Permissive — all authenticated users)
-- ============================================================================

ALTER TABLE "configuracoes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "usuarios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "marcas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cambios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "servicos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "itens_estoque" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clientes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "veiculos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transacoes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ordens_servico" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "itens_ordem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "itens_checklist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "historico_ordem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "formas_pagamento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "suppliers" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access" ON "configuracoes" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON "usuarios" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON "marcas" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON "cambios" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON "servicos" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON "itens_estoque" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON "clientes" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON "veiculos" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON "transacoes" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON "ordens_servico" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON "itens_ordem" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON "itens_checklist" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON "order_documents" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON "historico_ordem" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON "formas_pagamento" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON "suppliers" FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 4. STORAGE BUCKETS
-- ============================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('company-assets', 'company-assets', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Acesso Total Storage" ON storage.objects;
CREATE POLICY "Acesso Total Storage" ON storage.objects FOR ALL
USING (bucket_id IN ('documents', 'company-assets'))
WITH CHECK (bucket_id IN ('documents', 'company-assets'));

-- ============================================================================
-- 5. FUNCTIONS & TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_set_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_user_id_configuracoes BEFORE INSERT ON configuracoes FOR EACH ROW EXECUTE FUNCTION auto_set_user_id();
CREATE TRIGGER set_user_id_usuarios BEFORE INSERT ON usuarios FOR EACH ROW EXECUTE FUNCTION auto_set_user_id();
CREATE TRIGGER set_user_id_marcas BEFORE INSERT ON marcas FOR EACH ROW EXECUTE FUNCTION auto_set_user_id();
CREATE TRIGGER set_user_id_cambios BEFORE INSERT ON cambios FOR EACH ROW EXECUTE FUNCTION auto_set_user_id();
CREATE TRIGGER set_user_id_servicos BEFORE INSERT ON servicos FOR EACH ROW EXECUTE FUNCTION auto_set_user_id();
CREATE TRIGGER set_user_id_itens_estoque BEFORE INSERT ON itens_estoque FOR EACH ROW EXECUTE FUNCTION auto_set_user_id();
CREATE TRIGGER set_user_id_clientes BEFORE INSERT ON clientes FOR EACH ROW EXECUTE FUNCTION auto_set_user_id();
CREATE TRIGGER set_user_id_transacoes BEFORE INSERT ON transacoes FOR EACH ROW EXECUTE FUNCTION auto_set_user_id();
CREATE TRIGGER set_user_id_ordens_servico BEFORE INSERT ON ordens_servico FOR EACH ROW EXECUTE FUNCTION auto_set_user_id();

-- ============================================================================
-- 6. SEED DATA
-- ============================================================================

INSERT INTO "itens_estoque" ("id", "codigo", "nome", "fornecedor", "preco_custo", "preco_venda", "estoque", "estoque_minimo") VALUES
('peca-001', 'PE-0001', 'Disco de embreagem', 'Fornecedor Geral', 120.00, 180.00, 15, 5),
('peca-002', 'PE-0002', 'Platô de embreagem', 'Fornecedor Geral', 250.00, 380.00, 10, 3),
('peca-003', 'PE-0003', 'Rolamento de embreagem', 'Fornecedor Geral', 85.00, 130.00, 20, 5),
('peca-004', 'PE-0004', 'Engrenagem da 1ª marcha', 'Fornecedor Geral', 320.00, 480.00, 8, 2),
('peca-005', 'PE-0005', 'Engrenagem da 2ª marcha', 'Fornecedor Geral', 310.00, 465.00, 8, 2),
('peca-006', 'PE-0006', 'Engrenagem da 3ª marcha', 'Fornecedor Geral', 300.00, 450.00, 8, 2),
('peca-007', 'PE-0007', 'Engrenagem da 4ª marcha', 'Fornecedor Geral', 290.00, 435.00, 8, 2),
('peca-008', 'PE-0008', 'Engrenagem da ré', 'Fornecedor Geral', 280.00, 420.00, 6, 2),
('peca-009', 'PE-0009', 'Eixo piloto (primário)', 'Fornecedor Geral', 450.00, 680.00, 4, 1),
('peca-010', 'PE-0010', 'Eixo secundário', 'Fornecedor Geral', 480.00, 720.00, 4, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO configuracoes (id, nome_oficina, tema, modo_barra_lateral, horario_funcionamento)
VALUES ('01', 'Oficina Master Pro', 'light', 'automatic', '{"segunda": {"ativo": true, "inicio": "08:00", "fim": "18:00"}}')
ON CONFLICT (id) DO NOTHING;
