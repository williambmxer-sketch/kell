-- Create table for Payment Methods
CREATE TABLE IF NOT EXISTS "formas_pagamento" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID DEFAULT auth.uid() NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE "formas_pagamento" ENABLE ROW LEVEL SECURITY;

-- Create Policies (Drop first to avoid "already exists" error)
DROP POLICY IF EXISTS "Users can view their own payment methods" ON "formas_pagamento";
CREATE POLICY "Users can view their own payment methods" ON "formas_pagamento"
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own payment methods" ON "formas_pagamento";
CREATE POLICY "Users can insert their own payment methods" ON "formas_pagamento"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own payment methods" ON "formas_pagamento";
CREATE POLICY "Users can update their own payment methods" ON "formas_pagamento"
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own payment methods" ON "formas_pagamento";
CREATE POLICY "Users can delete their own payment methods" ON "formas_pagamento"
    FOR DELETE USING (auth.uid() = user_id);

-- Add 'forma_pagamento' column to 'transacoes' table if it doesn't exist
ALTER TABLE "transacoes" ADD COLUMN IF NOT EXISTS "forma_pagamento" TEXT;
