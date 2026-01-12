-- Migration: Add Estimated Duration column to ordens_servico table
-- Run this in the Supabase SQL Editor

ALTER TABLE "ordens_servico" 
ADD COLUMN IF NOT EXISTS "duracao_estimada" INTEGER;

-- Optional: Default 60 minutes for existing orders (uncomment if desired)
-- UPDATE "ordens_servico" SET "duracao_estimada" = 60 WHERE "duracao_estimada" IS NULL;
