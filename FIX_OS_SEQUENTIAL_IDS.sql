-- Atualizar nomes de tabelas para garantir compatibilidade
-- Alterar PK para Composite (id, user_id)
-- Permite IDs sequenciais (01, 02) por usuário sem conflito global

DO $$
BEGIN
    -- 1. Garantir que todo registro tenha um dono (user_id)
    -- Se houver registros antigos sem user_id, atribui ao usuário atual que está rodando o script
    UPDATE "ordens_servico" 
    SET "user_id" = auth.uid() 
    WHERE "user_id" IS NULL;

    -- 2. Garantir que a coluna user_id não aceite nulos (necessário para PK)
    ALTER TABLE "ordens_servico" ALTER COLUMN "user_id" SET NOT NULL;

    -- 3. Remover PK antiga (se existir)
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ordens_servico_pkey') THEN
        ALTER TABLE "ordens_servico" DROP CONSTRAINT "ordens_servico_pkey";
    END IF;

    -- 4. Adicionar nova PK Composta
    ALTER TABLE "ordens_servico" ADD PRIMARY KEY ("id", "user_id");

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao alterar PK: %', SQLERRM;
END $$;
