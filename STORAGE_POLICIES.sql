-- SCRIPT CORRIGIDO - CONFIGURAÇÃO DE STORAGE
-- Execute este script no Editor SQL do Supabase.

-- 1. Políticas de Acesso (Isso é o principal para permitir uploads)
-- Removemos o comando "ALTER TABLE" que causava erro, pois o RLS já vem ativado por padrão.

-- Remover políticas antigas para evitar conflito
DROP POLICY IF EXISTS "Acesso Publico Documents" ON storage.objects;
DROP POLICY IF EXISTS "Acesso Publico Assets" ON storage.objects;
DROP POLICY IF EXISTS "Public Access All" ON storage.objects;
DROP POLICY IF EXISTS "Acesso Total Storage" ON storage.objects;

-- Criar NOVA Política Universal (Leitura e Escrita para 'documents' e 'company-assets')
CREATE POLICY "Acesso Total Storage"
ON storage.objects FOR ALL
USING ( bucket_id IN ('documents', 'company-assets') )
WITH CHECK ( bucket_id IN ('documents', 'company-assets') );

-- 2. Criação de Buckets (Tente rodar. Se der erro de permissão aqui, crie pelo menu Storage do lado esquerdo)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;
