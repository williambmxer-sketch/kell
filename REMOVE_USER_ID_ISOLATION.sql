-- Make System Single-Tenant / Shared Workspace
-- This script removes the requirement for user_id in Primary Keys and Policies.
-- It ensures that any authenticated user can see and edit ALL data.

-- 1. Revert `ordens_servico` PK to just `id` (if it was composite)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ordens_servico_pkey') THEN
        ALTER TABLE "ordens_servico" DROP CONSTRAINT "ordens_servico_pkey";
    END IF;
    ALTER TABLE "ordens_servico" ADD PRIMARY KEY ("id");
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'PK already correct or error: %', SQLERRM;
END $$;

-- 2. Update RLS Policies to allow ALL access for Authenticated Users (ignore user_id)

-- Helper macro for permissive policy
create or replace function create_permissive_policy(tbl text, pol_name text) returns void as $$
begin
    execute format('DROP POLICY IF EXISTS %I ON %I', pol_name, tbl);
    execute format('CREATE POLICY %I ON %I FOR ALL USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')', pol_name, tbl);
end;
$$ language plpgsql;

-- Apply to all relevant tables
SELECT create_permissive_policy('clientes', 'Permissive Access');
SELECT create_permissive_policy('veiculos', 'Permissive Access');
SELECT create_permissive_policy('ordens_servico', 'Permissive Access');
SELECT create_permissive_policy('itens_estoque', 'Permissive Access');
SELECT create_permissive_policy('servicos', 'Permissive Access');
SELECT create_permissive_policy('transacoes', 'Permissive Access');
SELECT create_permissive_policy('formas_pagamento', 'Permissive Access');
SELECT create_permissive_policy('marcas', 'Permissive Access');
SELECT create_permissive_policy('usuarios', 'Permissive Access'); -- Be careful with this one if multiple users exist
SELECT create_permissive_policy('configuracoes', 'Permissive Access');

-- 3. Make user_id nullable in case migration made it strict
ALTER TABLE "ordens_servico" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "clientes" ALTER COLUMN "user_id" DROP NOT NULL;
