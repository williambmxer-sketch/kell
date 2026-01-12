-- ============================================================================
-- SCRIPT DE CORREÇÃO - Tabela Configuracoes
-- ============================================================================
-- Execute este script se estiver tendo erro 403 ao salvar configurações
-- ============================================================================

-- PASSO 1: Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users manage own settings" ON "configuracoes";
DROP POLICY IF EXISTS "Public Access" ON "configuracoes";

-- PASSO 2: Remover trigger antigo (se existir)
DROP TRIGGER IF EXISTS set_user_id_configuracoes ON configuracoes;

-- PASSO 3: Verificar se a função existe
CREATE OR REPLACE FUNCTION auto_set_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 4: Recriar trigger
CREATE TRIGGER set_user_id_configuracoes
    BEFORE INSERT ON configuracoes
    FOR EACH ROW EXECUTE FUNCTION auto_set_user_id();

-- PASSO 5: Garantir que RLS está ativo
ALTER TABLE "configuracoes" ENABLE ROW LEVEL SECURITY;

-- PASSO 6: Criar política permissiva para INSERT/UPDATE/DELETE/SELECT
CREATE POLICY "Users manage own settings" ON "configuracoes"
    FOR ALL 
    USING (user_id = auth.uid()) 
    WITH CHECK (user_id = auth.uid());

-- PASSO 7: (OPCIONAL) Limpar dados órfãos se houver
-- DELETE FROM configuracoes WHERE user_id IS NULL;

-- ============================================================================
-- TESTE DE VALIDAÇÃO
-- ============================================================================
-- Execute este SELECT para verificar se está funcionando:
-- SELECT * FROM configuracoes;
-- 
-- Se retornar vazio: OK (cada usuário vê apenas suas configs)
-- Se retornar erro: Problema ainda persiste
-- ============================================================================
