-- ============================================================================
-- DEBUG COMPLETO - Testar INSERT Manual
-- ============================================================================
-- Este script testa se conseguimos inserir dados diretamente

-- TESTE 1: Desabilitar RLS temporariamente para testar
ALTER TABLE "configuracoes" DISABLE ROW LEVEL SECURITY;

-- TESTE 2: Tentar inserir um registro de teste
INSERT INTO configuracoes (id, user_id, nome_oficina) 
VALUES ('teste', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Teste Oficina');

-- TESTE 3: Ver se inseriu
SELECT * FROM configuracoes;

-- TESTE 4: Limpar teste
DELETE FROM configuracoes WHERE id = 'teste';

-- TESTE 5: Reabilitar RLS
ALTER TABLE "configuracoes" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Se o TESTE 2 der erro, o problema é na estrutura da tabela
-- Se o TESTE 2 funcionar, o problema é no RLS/Trigger
-- ============================================================================
