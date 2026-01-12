-- Migration: Add WhatsApp Message Template column to configuracoes table
-- Run this in the Supabase SQL Editor

ALTER TABLE "configuracoes" 
ADD COLUMN IF NOT EXISTS "whatsapp_message_template" TEXT;

-- Optional: Set a default template
UPDATE "configuracoes" 
SET "whatsapp_message_template" = 'Olá {CLIENTE}, segue o orçamento do seu {VEICULO} (Placa: {PLACA}). Valor total: R$ {VALOR}. Qualquer dúvida estou à disposição!'
WHERE "id" = 'geral' AND "whatsapp_message_template" IS NULL;
