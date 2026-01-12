-- Alter OS Table PK to Composite (id, user_id)
-- This allows sequential IDs (01, 02) to exist per user without global collision.

DO $$
BEGIN
    -- 1. Drop existing PK
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ordens_servico_pkey') THEN
        ALTER TABLE "ordens_servico" DROP CONSTRAINT "ordens_servico_pkey";
    END IF;

    -- 2. Add new Composite PK
    ALTER TABLE "ordens_servico" ADD PRIMARY KEY ("id", "user_id");

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error altering PK: %', SQLERRM;
END $$;
