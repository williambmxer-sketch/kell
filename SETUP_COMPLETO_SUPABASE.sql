-- ============================================================================
-- SCRIPT DE SETUP COMPLETO v2 (COM CORREÇÃO DE COLUNAS)
-- Execute este script no Editor SQL do Supabase.
-- Ele tenta corrigir tabelas antigas adicionando a coluna 'user_id' faltante.
-- ============================================================================

-- PARTE 1: STORAGE
-- ============================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Acesso Total Storage" ON storage.objects;
CREATE POLICY "Acesso Total Storage" ON storage.objects FOR ALL
USING ( bucket_id IN ('documents', 'company-assets') )
WITH CHECK ( bucket_id IN ('documents', 'company-assets') );


-- PARTE 2: BANCO DE DADOS - CRIAÇÃO E CORREÇÃO
-- ============================================================================

-- Função Auxiliar
CREATE OR REPLACE FUNCTION auto_set_user_id() RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 1. Tabela CONFIGURACOES
CREATE TABLE IF NOT EXISTS "configuracoes" (
    "id" TEXT PRIMARY KEY,
    "user_id" UUID DEFAULT auth.uid(),
    "nome_oficina" TEXT,
    "cnpj" TEXT,
    "horario_funcionamento" JSONB,
    "logo_url" TEXT
);
-- CORREÇÃO: Garante que user_id existe se a tabela já existia
ALTER TABLE "configuracoes" ADD COLUMN IF NOT EXISTS "user_id" UUID DEFAULT auth.uid();
ALTER TABLE "configuracoes" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own settings" ON "configuracoes";
CREATE POLICY "Users manage own settings" ON "configuracoes" FOR ALL 
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- 2. Tabela CLIENTES
CREATE TABLE IF NOT EXISTS "clientes" (
    "id" TEXT PRIMARY KEY,
    "user_id" UUID DEFAULT auth.uid(),
    "nome" TEXT NOT NULL
);
ALTER TABLE "clientes" ADD COLUMN IF NOT EXISTS "user_id" UUID DEFAULT auth.uid();
ALTER TABLE "clientes" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own clients" ON "clientes";
CREATE POLICY "Users manage own clients" ON "clientes" FOR ALL 
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- 3. Tabela VEICULOS
CREATE TABLE IF NOT EXISTS "veiculos" (
    "id" TEXT PRIMARY KEY,
    "id_cliente" TEXT,
    "placa" TEXT,
    "modelo" TEXT
);
-- Veiculos não tem user_id direto, usa via cliente, mas se precisar adicionar campos faltantes:
ALTER TABLE "veiculos" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage vehicles through clients" ON "veiculos";
CREATE POLICY "Users manage vehicles through clients" ON "veiculos" FOR ALL 
USING ( EXISTS ( SELECT 1 FROM clientes WHERE clientes.id = veiculos.id_cliente AND clientes.user_id = auth.uid() ) )
WITH CHECK ( EXISTS ( SELECT 1 FROM clientes WHERE clientes.id = veiculos.id_cliente AND clientes.user_id = auth.uid() ) );


-- 4. Tabela ORDENS_SERVICO
CREATE TABLE IF NOT EXISTS "ordens_servico" (
    "id" TEXT PRIMARY KEY,
    "user_id" UUID DEFAULT auth.uid(),
    "status" TEXT
);
ALTER TABLE "ordens_servico" ADD COLUMN IF NOT EXISTS "user_id" UUID DEFAULT auth.uid();
ALTER TABLE "ordens_servico" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own orders" ON "ordens_servico";
CREATE POLICY "Users manage own orders" ON "ordens_servico" FOR ALL 
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- 5. Outras Tabelas (marcas, usuarios, servicos, itens_estoque...)
-- Adicione conforme necessário se encontrar mais erros, mas estas são as principais.

CREATE TABLE IF NOT EXISTS "marcas" ("id" TEXT PRIMARY KEY, "nome" TEXT);
ALTER TABLE "marcas" ADD COLUMN IF NOT EXISTS "user_id" UUID DEFAULT auth.uid();
ALTER TABLE "marcas" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own brands" ON "marcas";
CREATE POLICY "Users manage own brands" ON "marcas" FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS "servicos" ("id" TEXT PRIMARY KEY, "nome" TEXT);
ALTER TABLE "servicos" ADD COLUMN IF NOT EXISTS "user_id" UUID DEFAULT auth.uid();
ALTER TABLE "servicos" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own services" ON "servicos";
CREATE POLICY "Users manage own services" ON "servicos" FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 6. Aplicação de triggers para preenchimento de user_id
DROP TRIGGER IF EXISTS set_user_id_configuracoes ON configuracoes;
CREATE TRIGGER set_user_id_configuracoes BEFORE INSERT ON configuracoes FOR EACH ROW EXECUTE FUNCTION auto_set_user_id();

DROP TRIGGER IF EXISTS set_user_id_clientes ON clientes;
CREATE TRIGGER set_user_id_clientes BEFORE INSERT ON clientes FOR EACH ROW EXECUTE FUNCTION auto_set_user_id();

DROP TRIGGER IF EXISTS set_user_id_ordens_servico ON ordens_servico;
CREATE TRIGGER set_user_id_ordens_servico BEFORE INSERT ON ordens_servico FOR EACH ROW EXECUTE FUNCTION auto_set_user_id();
