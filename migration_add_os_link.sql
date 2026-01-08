-- Migration to add link between transactions and service orders
-- Run this in Supabase SQL Editor

ALTER TABLE "transacoes" 
ADD COLUMN IF NOT EXISTS "id_ordem" TEXT REFERENCES "ordens_servico"("id") ON DELETE SET NULL;
