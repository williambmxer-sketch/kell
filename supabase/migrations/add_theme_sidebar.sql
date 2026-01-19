-- Add UI preferences to configuracoes table

-- Add 'tema' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'configuracoes' AND column_name = 'tema') THEN
        ALTER TABLE configuracoes ADD COLUMN tema text DEFAULT 'light';
    END IF;
END $$;

-- Add 'modo_barra_lateral' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'configuracoes' AND column_name = 'modo_barra_lateral') THEN
        ALTER TABLE configuracoes ADD COLUMN modo_barra_lateral text DEFAULT 'automatic';
    END IF;
END $$;
