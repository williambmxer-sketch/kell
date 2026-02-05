-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. FISCAL SETTINGS & TABLES
-- ============================================================================

-- 1.1 Fiscal Settings (Global)
CREATE TABLE IF NOT EXISTS fiscal_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    company_tax_regime TEXT NOT NULL DEFAULT 'SIMPLES_NACIONAL' CHECK (company_tax_regime IN ('SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL')),
    default_pis_cofins_cst TEXT,
    state_registration TEXT, -- Inscrição Estadual
    digital_certificate_id TEXT -- ID/Path reference for uploaded cert
);

-- 1.2 NCMs (Nomenclatura Comum do Mercosul)
CREATE TABLE IF NOT EXISTS fiscal_ncm (
    code TEXT PRIMARY KEY, -- NCM Code is unique
    description TEXT NOT NULL,
    federal_tax_rate NUMERIC(5,2) DEFAULT 0, -- Lei da Transparência
    state_tax_rate NUMERIC(5,2) DEFAULT 0,
    unic_tax_rate NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.3 Operations (CFOP)
CREATE TABLE IF NOT EXISTS fiscal_operations (
    code TEXT PRIMARY KEY, -- CFOP (e.g., 5102)
    description TEXT NOT NULL,
    is_devolution BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.4 Tax Rules (Regras Tributárias / Tax Groups)
CREATE TABLE IF NOT EXISTS fiscal_tax_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL, -- e.g., "Tributado Integral", "Substituição Tributária"
    description TEXT,
    
    -- Default CFOPs
    cfop_state TEXT REFERENCES fiscal_operations(code),
    cfop_interstate TEXT REFERENCES fiscal_operations(code),
    
    -- ICMS
    csosn TEXT, -- Simples Nacional (e.g., 101, 102)
    cst_icms TEXT, -- Normal Regime (e.g., 00, 10)
    icms_rate NUMERIC(5,2) DEFAULT 0,
    
    -- IPI
    cst_ipi TEXT,
    ipi_rate NUMERIC(5,2) DEFAULT 0,
    
    -- PIS/COFINS
    cst_pis_cofins TEXT,
    pis_rate NUMERIC(5,2) DEFAULT 0,
    cofins_rate NUMERIC(5,2) DEFAULT 0,

    -- Tax Reform (IBS/CBS) -- Added in latest update
    cst_ibs TEXT,
    ibs_rate NUMERIC(5,2) DEFAULT 0,
    cst_cbs TEXT,
    cbs_rate NUMERIC(5,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 2. NOTAS FISCAIS (INVOICES)
-- ============================================================================

CREATE TABLE IF NOT EXISTS notas_fiscais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_ordem TEXT NOT NULL REFERENCES ordens_servico(id), -- Assuming ordens_servico table exists
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
-- 3. UPDATES to EXISTING TABLES
-- ============================================================================

-- Update Inventory Table (itens_estoque) to link with Fiscal Tables
ALTER TABLE itens_estoque 
ADD COLUMN IF NOT EXISTS ncm_code TEXT REFERENCES fiscal_ncm(code),
ADD COLUMN IF NOT EXISTS cest TEXT, 
ADD COLUMN IF NOT EXISTS origin INTEGER DEFAULT 0 CHECK (origin >= 0 AND origin <= 8),
ADD COLUMN IF NOT EXISTS tax_rule_id UUID REFERENCES fiscal_tax_rules(id);

-- ============================================================================
-- 4. SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE fiscal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_ncm ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_fiscais ENABLE ROW LEVEL SECURITY;

-- Policies (Adjust definitions as needed for granular control)
CREATE POLICY "Public read/write access for fiscal_settings" ON fiscal_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write access for fiscal_ncm" ON fiscal_ncm FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write access for fiscal_operations" ON fiscal_operations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write access for fiscal_tax_rules" ON fiscal_tax_rules FOR ALL USING (true) WITH CHECK (true);

-- Authenticated policies for invoices
CREATE POLICY "Enable read access for authenticated users" ON notas_fiscais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON notas_fiscais FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for authenticated users" ON notas_fiscais FOR UPDATE TO authenticated USING (true);
