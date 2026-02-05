-- Create Suppliers Table
CREATE TABLE IF NOT EXISTS "suppliers" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID DEFAULT auth.uid(),
    "name" TEXT NOT NULL,
    "contact_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "cnpj" TEXT,
    "address" TEXT,
    "active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE "suppliers" ENABLE ROW LEVEL SECURITY;

-- Public Access Policy (for MVP as per other tables)
CREATE POLICY "Public Access" ON "suppliers" FOR ALL USING (true) WITH CHECK (true);
