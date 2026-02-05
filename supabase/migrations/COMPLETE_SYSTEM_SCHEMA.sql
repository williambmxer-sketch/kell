-- ============================================================================
-- COMPLETE SYSTEM SCHEMA
-- Combines Core Schema + Fiscal Module + Tax Reform
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Often useful

-- ============================================================================
-- 1. CORE TABLES (Base Entities)
-- ============================================================================

-- 1.1 Configurações
CREATE TABLE IF NOT EXISTS "configuracoes" (
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

-- 1.2 Usuários
CREATE TABLE IF NOT EXISTS "usuarios" (
    "id" TEXT PRIMARY KEY,
    "user_id" UUID DEFAULT auth.uid(),
    "nome" TEXT NOT NULL,
    "papel" TEXT NOT NULL -- 'ADMIN', 'MECHANIC', 'ADVISOR'
);

-- 1.3 Clientes
CREATE TABLE IF NOT EXISTS "clientes" (
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

-- 1.4 Veículos
CREATE TABLE IF NOT EXISTS "veiculos" (
    "id" TEXT PRIMARY KEY,
    "id_cliente" TEXT REFERENCES "clientes"("id") ON DELETE CASCADE,
    "placa" TEXT,
    "modelo" TEXT,
    "marca" TEXT,
    "ano" INTEGER,
    "cor" TEXT
);

-- 1.5 Serviços
CREATE TABLE IF NOT EXISTS "servicos" (
    "id" TEXT PRIMARY KEY,
    "user_id" UUID DEFAULT auth.uid(),
    "codigo" TEXT,
    "nome" TEXT NOT NULL,
    "categoria" TEXT,
    "preco" NUMERIC(10, 2) DEFAULT 0,
    "tempo" TEXT
);

-- 1.6 Câmbios
CREATE TABLE IF NOT EXISTS "cambios" (
    "id" TEXT PRIMARY KEY,
    "user_id" UUID DEFAULT auth.uid(),
    "codigo" TEXT,
    "modelo" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "tipo" TEXT,
    "specs" TEXT,
    "tempo_montagem" TEXT
);

-- 1.7 Marcas
CREATE TABLE IF NOT EXISTS "marcas" (
    "id" TEXT PRIMARY KEY,
    "user_id" UUID DEFAULT auth.uid(),
    "nome" TEXT NOT NULL,
    "logo_url" TEXT
);

-- 1.8 Formas de Pagamento
CREATE TABLE IF NOT EXISTS "formas_pagamento" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID DEFAULT auth.uid(),
    "name" TEXT NOT NULL,
    "active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 2. FISCAL CONFIGURATION (Fiscal Module)
-- ============================================================================

-- 2.1 Fiscal Settings
CREATE TABLE IF NOT EXISTS fiscal_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    company_tax_regime TEXT NOT NULL DEFAULT 'SIMPLES_NACIONAL' CHECK (company_tax_regime IN ('SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL')),
    default_pis_cofins_cst TEXT,
    state_registration TEXT,
    digital_certificate_id TEXT
);

-- 2.2 NCMs
CREATE TABLE IF NOT EXISTS fiscal_ncm (
    code TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    federal_tax_rate NUMERIC(5,2) DEFAULT 0,
    state_tax_rate NUMERIC(5,2) DEFAULT 0,
    unic_tax_rate NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.3 Operations (CFOP)
CREATE TABLE IF NOT EXISTS fiscal_operations (
    code TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    is_devolution BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.4 Tax Rules (Regras Tributárias + IBS/CBS)
CREATE TABLE IF NOT EXISTS fiscal_tax_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    
    -- Default CFOPs
    cfop_state TEXT REFERENCES fiscal_operations(code),
    cfop_interstate TEXT REFERENCES fiscal_operations(code),
    
    -- ICMS
    csosn TEXT,
    cst_icms TEXT,
    icms_rate NUMERIC(5,2) DEFAULT 0,
    
    -- IPI
    cst_ipi TEXT,
    ipi_rate NUMERIC(5,2) DEFAULT 0,
    
    -- PIS/COFINS
    cst_pis_cofins TEXT,
    pis_rate NUMERIC(5,2) DEFAULT 0,
    cofins_rate NUMERIC(5,2) DEFAULT 0,

    -- Tax Reform (IBS/CBS)
    cst_ibs TEXT,
    ibs_rate NUMERIC(5,2) DEFAULT 0,
    cst_cbs TEXT,
    cbs_rate NUMERIC(5,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 3. INVENTORY (Linked to Fiscal)
-- ============================================================================

-- 3.1 Itens de Estoque (Updated with Fiscal Keys)
CREATE TABLE IF NOT EXISTS "itens_estoque" (
    "id" TEXT PRIMARY KEY,
    "user_id" UUID DEFAULT auth.uid(),
    "codigo" TEXT,
    "nome" TEXT NOT NULL,
    "fornecedor" TEXT,
    "preco_custo" NUMERIC(10, 2) DEFAULT 0,
    "preco_venda" NUMERIC(10, 2) DEFAULT 0,
    "estoque" INTEGER DEFAULT 0,
    "estoque_minimo" INTEGER DEFAULT 0,
    
    -- Fiscal Fields
    "ncm_code" TEXT REFERENCES fiscal_ncm(code),
    "cest" TEXT,
    "origin" INTEGER DEFAULT 0 CHECK (origin >= 0 AND origin <= 8),
    "tax_rule_id" UUID REFERENCES fiscal_tax_rules(id)
);

-- ============================================================================
-- 4. OPERATIONS & TRANSACTIONS
-- ============================================================================

-- 4.1 Ordens de Serviço
CREATE TABLE IF NOT EXISTS "ordens_servico" (
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

-- 4.2 Itens da OS
CREATE TABLE IF NOT EXISTS "itens_ordem" (
    "id" TEXT PRIMARY KEY,
    "id_ordem" TEXT REFERENCES "ordens_servico"("id") ON DELETE CASCADE,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" NUMERIC(10, 2) DEFAULT 1,
    "preco" NUMERIC(10, 2) DEFAULT 0,
    "waiting_parts" BOOLEAN DEFAULT FALSE,
    "expected_arrival" TIMESTAMP WITH TIME ZONE
);

-- 4.3 Checklist
CREATE TABLE IF NOT EXISTS "itens_checklist" (
    "id" TEXT PRIMARY KEY,
    "id_ordem" TEXT REFERENCES "ordens_servico"("id") ON DELETE CASCADE,
    "rotulo" TEXT NOT NULL,
    "marcado" BOOLEAN DEFAULT FALSE
);

-- 4.4 Histórico
CREATE TABLE IF NOT EXISTS "historico_ordem" (
    "id" TEXT PRIMARY KEY,
    "id_ordem" TEXT REFERENCES "ordens_servico"("id") ON DELETE CASCADE,
    "acao" TEXT NOT NULL,
    "diff" TEXT,
    "data_hora" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "id_usuario" TEXT
);

-- 4.5 Documentos
CREATE TABLE IF NOT EXISTS "order_documents" (
    "id" TEXT PRIMARY KEY,
    "order_id" TEXT REFERENCES "ordens_servico"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4.6 Transações Financeiras
CREATE TABLE IF NOT EXISTS "transacoes" (
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

-- 4.7 Notas Fiscais (Invoices)
CREATE TABLE IF NOT EXISTS notas_fiscais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_ordem TEXT NOT NULL REFERENCES ordens_servico(id),
    id_externo TEXT, -- PlugNotas ID
    tipo TEXT NOT NULL CHECK (tipo IN ('NFE', 'NFSE')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'AUTHORIZED', 'REJECTED', 'CANCELED', 'ERROR')),
    numero TEXT,
    serie TEXT,
    chave_acesso TEXT,
    pdf_url TEXT,
    xml_url TEXT,
    mensagem_erro TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. STORAGE BUCKETS
-- ============================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('company-assets', 'company-assets', true) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. RLS POLICIES (All Public/Permissive for Internal Use)
-- ============================================================================

ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cambios ENABLE ROW LEVEL SECURITY;
ALTER TABLE marcas ENABLE ROW LEVEL SECURITY;
ALTER TABLE formas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_ncm ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_ordem ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_ordem ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_fiscais ENABLE ROW LEVEL SECURITY;

-- Apply "Public Access" policy to all tables
DO $$ 
DECLARE 
    tablename text; 
BEGIN 
    FOR tablename IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS "Public Access" ON %I', tablename);
        EXECUTE format('CREATE POLICY "Public Access" ON %I FOR ALL USING (true) WITH CHECK (true)', tablename);
    END LOOP; 
END $$;
