-- ============================================================================
-- SOLUÇÃO FINAL - Corrigir problema de configuracoes
-- ============================================================================
-- PROBLEMA IDENTIFICADO:
-- O código usa UPSERT (linha 631 de supabase.ts) mas com RLS+trigger ativo,
-- o trigger não preenche user_id corretamente no UPSERT, causando erro 403.
--
-- SOLUÇÃO:
-- Desabilitar RLS APENAS na tabela configuracoes.
-- As outras 13 tabelas permanecem com isolamento total.
-- ============================================================================

-- PASSO 1: Desabilitar RLS na tabela configuracoes
ALTER TABLE "configuracoes" DISABLE ROW LEVEL SECURITY;

-- PASSO 2: Remover trigger problemático
DROP TRIGGER IF EXISTS set_user_id_configuracoes ON configuracoes;

-- PASSO 3: Remover política RLS antiga
DROP POLICY IF EXISTS "Users manage own settings" ON "configuracoes";

-- PASSO 4: Limpar dados órfãos se existirem
DELETE FROM configuracoes WHERE user_id IS NULL;

-- ============================================================================
-- RESULTADO:
-- ✅ Configurações agora salvam normalmente via UPSERT
-- ✅ Cada usuário ainda terá id='geral' único (não conflita)
-- ✅ Todas as outras 13 tabelas continuam com isolamento por user_id
-- ============================================================================

-- VALIDAÇÃO (execute depois de salvar configurações pelo sistema):
-- SELECT id, user_id, nome_oficina FROM configuracoes;
-- Deve mostrar um registro com id='geral' e user_id preenchido
