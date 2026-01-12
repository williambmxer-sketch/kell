-- Insert Demo Parts for GMPG System
-- Run this in the Supabase SQL Editor

INSERT INTO "itens_estoque" ("id", "codigo", "nome", "fornecedor", "preco_custo", "preco_venda", "estoque", "estoque_minimo") VALUES
('peca-001', 'PE-0001', 'Disco de embreagem', 'Fornecedor Geral', 120.00, 180.00, 15, 5),
('peca-002', 'PE-0002', 'Platô de embreagem', 'Fornecedor Geral', 250.00, 380.00, 10, 3),
('peca-003', 'PE-0003', 'Rolamento de embreagem (colher ou atuador)', 'Fornecedor Geral', 85.00, 130.00, 20, 5),
('peca-004', 'PE-0004', 'Engrenagem da 1ª marcha', 'Fornecedor Geral', 320.00, 480.00, 8, 2),
('peca-005', 'PE-0005', 'Engrenagem da 2ª marcha', 'Fornecedor Geral', 310.00, 465.00, 8, 2),
('peca-006', 'PE-0006', 'Engrenagem da 3ª marcha', 'Fornecedor Geral', 300.00, 450.00, 8, 2),
('peca-007', 'PE-0007', 'Engrenagem da 4ª marcha', 'Fornecedor Geral', 290.00, 435.00, 8, 2),
('peca-008', 'PE-0008', 'Engrenagem da ré', 'Fornecedor Geral', 280.00, 420.00, 6, 2),
('peca-009', 'PE-0009', 'Eixo piloto (primário)', 'Fornecedor Geral', 450.00, 680.00, 4, 1),
('peca-010', 'PE-0010', 'Eixo secundário (contra eixo)', 'Fornecedor Geral', 480.00, 720.00, 4, 1);
