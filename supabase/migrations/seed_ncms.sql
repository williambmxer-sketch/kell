-- ============================================================================
-- SEED DATA: Common NCMs for Automotive Workshops
-- ============================================================================

INSERT INTO fiscal_ncm (code, description, federal_tax_rate, state_tax_rate, unic_tax_rate) VALUES
-- Óleos e Lubrificantes
('2710.19.32', 'Óleo lubrificante para motores (sem biodiesel)', 0, 18, 0),
('2710.19.99', 'Outros óleos lubrificantes', 0, 18, 0),
('3403.19.00', 'Preparações lubrificantes contendo óleos de petróleo', 0, 18, 0),

-- Pneus e Câmaras
('4011.10.00', 'Pneus novos de borracha para automóveis de passageiros', 13.45, 18, 0),
('4013.10.90', 'Câmaras de ar de borracha', 13.45, 18, 0),

-- Correias e Juntas
('4010.31.00', 'Correias de transmissão de borracha vulcanizada', 9.25, 18, 0),
('4016.93.00', 'Juntas, gaxetas e semelhantes de borracha vulcanizada', 9.25, 18, 0),
('8484.10.00', 'Juntas metaloplásticas (Juntas de cabeçote)', 9.25, 18, 0),

-- Vidros e Espelhos
('7007.11.00', 'Vidros de segurança temperados para automóveis', 9.25, 18, 0),
('7007.21.00', 'Vidros de segurança formados por folhas contracoladas', 9.25, 18, 0),
('7009.10.00', 'Espelhos retrovisores para veículos', 9.25, 18, 0),

-- Motor e Peças Internas
('8407.34.90', 'Motores de pistão alternativo, > 1000cm3', 9.25, 18, 0),
('8409.91.11', 'Bielas', 9.25, 18, 0),
('8409.91.12', 'Blocos de cilindros e cárteres', 9.25, 18, 0),
('8409.91.13', 'Cabeçotes', 9.25, 18, 0),
('8409.91.14', 'Pistões ou êmbolos', 9.25, 18, 0),
('8409.91.15', 'Anéis de segmento', 9.25, 18, 0),
('8409.91.16', 'Válvulas de admissão ou de escape', 9.25, 18, 0),
('8409.91.90', 'Outras partes de motores', 9.25, 18, 0),

-- Bombas e Filtros
('8413.30.10', 'Bombas de combustível para motores', 9.25, 18, 0),
('8413.30.20', 'Bombas de injeção de combustível', 9.25, 18, 0),
('8413.30.30', 'Bombas de óleo lubrificante', 9.25, 18, 0),
('8413.30.90', 'Bombas de água para motores', 9.25, 18, 0),
('8421.23.00', 'Filtros de óleo para motores', 9.25, 18, 0),
('8421.31.00', 'Filtros de entrada de ar para motores', 9.25, 18, 0),

-- Elétrica e Ignição
('8507.10.10', 'Acumuladores elétricos (Baterias) de chumbo, < 15kg', 9.25, 18, 0),
('8511.10.00', 'Velas de ignição', 9.25, 18, 0),
('8511.40.00', 'Motores de arranque (partida)', 9.25, 18, 0),
('8511.50.10', 'Alternadores', 9.25, 18, 0),
('8512.20.11', 'Faróis', 9.25, 18, 0),
('8512.20.22', 'Luzes de sinalização e freio', 9.25, 18, 0),
('8544.30.00', 'Jogos de fios para velas (Cabos de ignição)', 9.25, 18, 0),

-- Peças Gerais (Capítulo 87)
('8708.10.00', 'Para-choques e suas partes', 9.25, 18, 0),
('8708.29.99', 'Outras partes e acessórios de carroçaria', 9.25, 18, 0),
('8708.30.19', 'Pastilhas de freio e guarnições', 9.25, 18, 0),
('8708.30.90', 'Outras partes de freios e servo-freios', 9.25, 18, 0),
('8708.40.19', 'Caixas de marchas e suas partes', 9.25, 18, 0),
('8708.50.99', 'Eixos de transmissão com diferencial', 9.25, 18, 0),
('8708.70.10', 'Rodas e suas partes', 9.25, 18, 0),
('8708.80.00', 'Sistemas de suspensão e amortecedores', 9.25, 18, 0),
('8708.91.00', 'Radiadores e suas partes', 9.25, 18, 0),
('8708.92.00', 'Silenciosos e tubos de escape', 9.25, 18, 0),
('8708.93.00', 'Embreagens e suas partes', 9.25, 18, 0),
('8708.94.12', 'Volantes de direção', 9.25, 18, 0),
('8708.99.90', 'Outras partes e acessórios de veículos', 9.25, 18, 0)

ON CONFLICT (code) DO UPDATE 
SET description = EXCLUDED.description;
