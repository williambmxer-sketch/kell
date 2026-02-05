-- Create table for storing Fiscal Invoices (NF-e / NFS-e)
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

-- Add RLS Policies
ALTER TABLE notas_fiscais ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Enable read access for authenticated users" ON notas_fiscais
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow insert access to authenticated users
CREATE POLICY "Enable insert access for authenticated users" ON notas_fiscais
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow update access to authenticated users
CREATE POLICY "Enable update access for authenticated users" ON notas_fiscais
    FOR UPDATE
    TO authenticated
    USING (true);
