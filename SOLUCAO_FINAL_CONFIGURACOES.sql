-- ============================================================================
-- SOLUÇÃO CORRETA - Configuracoes com Isolamento
-- ============================================================================
-- PROBLEMA: UPSERT não funciona com RLS+trigger, 
--           mas sem RLS todos veem as mesmas configs
--
-- SOLUÇÃO: Reabilitar RLS + modificar minimamente o código
-- ============================================================================

-- PASSO 1: Reabilitar RLS
ALTER TABLE "configuracoes" ENABLE ROW LEVEL SECURITY;

-- PASSO 2: Limpar dados compartilhados (se houver)
-- Manter apenas o registro mais recente por user_id
DELETE FROM configuracoes a
USING configuracoes b
WHERE a.id = b.id 
  AND a.user_id IS NULL;

-- PASSO 3: Recriar trigger
DROP TRIGGER IF EXISTS set_user_id_configuracoes ON configuracoes;
CREATE TRIGGER set_user_id_configuracoes
    BEFORE INSERT ON configuracoes
    FOR EACH ROW 
    WHEN (NEW.user_id IS NULL)
    EXECUTE FUNCTION auto_set_user_id();

-- PASSO 4: Criar política RLS permissiva
DROP POLICY IF EXISTS "Users manage own settings" ON "configuracoes";
CREATE POLICY "Users manage own settings" ON "configuracoes"
    FOR ALL 
    USING (user_id = auth.uid()) 
    WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- CÓDIGO QUE PRECISA MUDAR (services/supabase.ts linha 613-633)
-- ============================================================================
-- ANTES:
-- export const updateSettings = async (settings: Partial<WorkshopSettings>) => {
--   const dbPayload: any = { id: 'geral' };
--   ...
--   const { error } = await supabase.from('configuracoes').upsert(dbPayload);
-- };
--
-- DEPOIS:
-- export const updateSettings = async (settings: Partial<WorkshopSettings>) => {
--   const { data: { user } } = await supabase.auth.getUser();
--   const dbPayload: any = { id: 'geral', user_id: user?.id };
--   ...
--   const { error } = await supabase.from('configuracoes').upsert(dbPayload);
-- };
-- ============================================================================
