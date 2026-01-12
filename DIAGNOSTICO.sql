-- ============================================================================
-- SCRIPT DIAGNÓSTICO - Verificar Estado das Tabelas
-- ============================================================================
-- Execute este script para ver o que está acontecendo no banco
-- ============================================================================

-- 1. Verificar se coluna user_id existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'configuracoes' 
ORDER BY ordinal_position;

-- 2. Verificar se RLS está ativo
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'configuracoes';

-- 3. Verificar políticas RLS criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'configuracoes';

-- 4. Verificar triggers
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'configuracoes';

-- 5. Verificar dados existentes (e o user_id deles)
SELECT id, user_id, nome_oficina 
FROM configuracoes;

-- 6. Verificar qual é o auth.uid() atual
SELECT auth.uid() as meu_user_id;

-- ============================================================================
-- INTERPRETAÇÃO DOS RESULTADOS:
-- ============================================================================
-- Consulta 1: Deve mostrar coluna 'user_id' com tipo 'uuid'
-- Consulta 2: Deve mostrar rowsecurity = true (t)
-- Consulta 3: Deve mostrar a política "Users manage own settings"
-- Consulta 4: Deve mostrar trigger "set_user_id_configuracoes"
-- Consulta 5: Deve mostrar apenas configs do seu user_id (ou vazio)
-- Consulta 6: Deve retornar um UUID (se null = não está logado!)
-- ============================================================================
