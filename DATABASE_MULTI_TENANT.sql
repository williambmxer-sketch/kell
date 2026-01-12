-- ============================================================================
-- BANCO DE DADOS MULTI-TENANT - SISTEMA DE GESTÃO DE OFICINA
-- ============================================================================
-- Data de criação: 2026-01-11
-- Versão: 2.0 - Multi-Tenant com Row Level Security
-- Total de tabelas: 14
-- 
-- ATENÇÃO: Este script apaga TODOS os dados existentes!
-- Execute apenas após confirmação e em ambiente apropriado.
--
-- ARQUITETURA:
-- - Isolamento total por usuário autenticado (auth.uid)
-- - Row Level Security (RLS) ativo em todas as tabelas
-- - Triggers automáticos para preencher user_id
-- - IDs sequenciais mantidos (01, 02, 03...)
-- ============================================================================

-- ============================================================================
-- ETAPA 1: LIMPEZA COMPLETA DO BANCO
-- ============================================================================
-- Remove todas as tabelas existentes (ordem inversa de dependências)

DROP TABLE IF EXISTS "historico_ordem" CASCADE;
DROP TABLE IF EXISTS "order_documents" CASCADE;
DROP TABLE IF EXISTS "itens_checklist" CASCADE;
DROP TABLE IF EXISTS "itens_ordem" CASCADE;
DROP TABLE IF EXISTS "ordens_servico" CASCADE;
DROP TABLE IF EXISTS "transacoes" CASCADE;
DROP TABLE IF EXISTS "veiculos" CASCADE;
DROP TABLE IF EXISTS "clientes" CASCADE;
DROP TABLE IF EXISTS "usuarios" CASCADE;
DROP TABLE IF EXISTS "itens_estoque" CASCADE;
DROP TABLE IF EXISTS "servicos" CASCADE;
DROP TABLE IF EXISTS "cambios" CASCADE;
DROP TABLE IF EXISTS "marcas" CASCADE;
DROP TABLE IF EXISTS "configuracoes" CASCADE;

-- ============================================================================
-- ETAPA 2: CRIAÇÃO DAS TABELAS COM ISOLAMENTO POR USUÁRIO
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABELA 1: configuracoes
-- Configurações da oficina (isolada por usuário)
-- Cada usuário tem suas próprias configurações (nome, logo, horários, etc)
-- ----------------------------------------------------------------------------
CREATE TABLE "configuracoes" (
    "id" TEXT PRIMARY KEY,
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "nome_oficina" TEXT,
    "cnpj" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "cep" TEXT,
    "endereco" TEXT,
    "numero" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "logo_url" TEXT,
    "horario_funcionamento" JSONB,
    "whatsapp_message_template" TEXT,
    CONSTRAINT unique_config_per_user UNIQUE(user_id, id)
);

CREATE INDEX idx_configuracoes_user_id ON configuracoes(user_id);
COMMENT ON TABLE configuracoes IS 'Configurações da oficina isoladas por usuário';

-- ----------------------------------------------------------------------------
-- TABELA 2: usuarios
-- Mecânicos e usuários do sistema (isolado por usuário dono)
-- Cada usuário autenticado gerencia sua própria equipe
-- ----------------------------------------------------------------------------
CREATE TABLE "usuarios" (
    "id" TEXT PRIMARY KEY,
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "nome" TEXT NOT NULL,
    "papel" TEXT NOT NULL
);

CREATE INDEX idx_usuarios_user_id ON usuarios(user_id);
COMMENT ON TABLE usuarios IS 'Mecânicos e equipe, isolados por usuário dono';
COMMENT ON COLUMN usuarios.papel IS 'Valores: ADMIN, MECHANIC, ADVISOR';

-- ----------------------------------------------------------------------------
-- TABELA 3: marcas
-- Marcas de veículos (isoladas por usuário)
-- Cada usuário cadastra suas próprias marcas
-- ----------------------------------------------------------------------------
CREATE TABLE "marcas" (
    "id" TEXT PRIMARY KEY,
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "nome" TEXT NOT NULL,
    "logo_url" TEXT
);

CREATE INDEX idx_marcas_user_id ON marcas(user_id);
COMMENT ON TABLE marcas IS 'Marcas de veículos, isoladas por usuário';

-- ----------------------------------------------------------------------------
-- TABELA 4: cambios
-- Câmbios cadastrados (isolados por usuário)
-- Cada usuário gerencia seu próprio catálogo de câmbios
-- ----------------------------------------------------------------------------
CREATE TABLE "cambios" (
    "id" TEXT PRIMARY KEY,
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "codigo" TEXT,
    "modelo" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "tipo" TEXT,
    "specs" TEXT,
    "tempo_montagem" TEXT
);

CREATE INDEX idx_cambios_user_id ON cambios(user_id);
COMMENT ON TABLE cambios IS 'Câmbios e transmissões, isolados por usuário';
COMMENT ON COLUMN cambios.tipo IS 'Ex: Automático, CVT, Manual, DSG';

-- ----------------------------------------------------------------------------
-- TABELA 5: servicos
-- Serviços/Mão de obra (isolados por usuário)
-- Cada usuário define seus próprios serviços e preços
-- ----------------------------------------------------------------------------
CREATE TABLE "servicos" (
    "id" TEXT PRIMARY KEY,
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "codigo" TEXT,
    "nome" TEXT NOT NULL,
    "categoria" TEXT,
    "preco" NUMERIC(10, 2) DEFAULT 0,
    "tempo" TEXT
);

CREATE INDEX idx_servicos_user_id ON servicos(user_id);
COMMENT ON TABLE servicos IS 'Serviços de mão de obra, isolados por usuário';

-- ----------------------------------------------------------------------------
-- TABELA 6: itens_estoque
-- Peças em estoque (isoladas por usuário)
-- Cada usuário gerencia seu próprio estoque
-- ----------------------------------------------------------------------------
CREATE TABLE "itens_estoque" (
    "id" TEXT PRIMARY KEY,
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "codigo" TEXT,
    "nome" TEXT NOT NULL,
    "fornecedor" TEXT,
    "preco_custo" NUMERIC(10, 2) DEFAULT 0,
    "preco_venda" NUMERIC(10, 2) DEFAULT 0,
    "estoque" INTEGER DEFAULT 0,
    "estoque_minimo" INTEGER DEFAULT 0
);

CREATE INDEX idx_itens_estoque_user_id ON itens_estoque(user_id);
COMMENT ON TABLE itens_estoque IS 'Peças em estoque, isoladas por usuário';

-- ----------------------------------------------------------------------------
-- TABELA 7: clientes
-- Clientes da oficina (isolados por usuário)
-- Cada usuário vê apenas seus próprios clientes
-- ----------------------------------------------------------------------------
CREATE TABLE "clientes" (
    "id" TEXT PRIMARY KEY,
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "cpf" TEXT,
    "endereco" TEXT,
    "numero_endereco" TEXT,
    "cidade" TEXT,
    "cep" TEXT,
    "bairro" TEXT,
    "estado" TEXT
);

CREATE INDEX idx_clientes_user_id ON clientes(user_id);
COMMENT ON TABLE clientes IS 'Clientes da oficina, isolados por usuário';

-- ----------------------------------------------------------------------------
-- TABELA 8: veiculos
-- Veículos dos clientes (herda isolamento via FK de clientes)
-- Não precisa de user_id direto, pois está vinculado a cliente
-- ----------------------------------------------------------------------------
CREATE TABLE "veiculos" (
    "id" TEXT PRIMARY KEY,
    "id_cliente" TEXT REFERENCES "clientes"("id") ON DELETE CASCADE,
    "placa" TEXT,
    "modelo" TEXT,
    "marca" TEXT,
    "ano" INTEGER,
    "cor" TEXT
);

CREATE INDEX idx_veiculos_id_cliente ON veiculos(id_cliente);
COMMENT ON TABLE veiculos IS 'Veículos dos clientes, herda isolamento via clientes';

-- ----------------------------------------------------------------------------
-- TABELA 9: transacoes
-- Transações financeiras (isoladas por usuário)
-- Cada usuário tem seu próprio controle financeiro
-- ----------------------------------------------------------------------------
CREATE TABLE "transacoes" (
    "id" TEXT PRIMARY KEY,
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "descricao" TEXT,
    "categoria" TEXT,
    "valor" NUMERIC(10, 2),
    "tipo" TEXT,
    "status" TEXT,
    "data" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "id_ordem" TEXT
);

CREATE INDEX idx_transacoes_user_id ON transacoes(user_id);
CREATE INDEX idx_transacoes_data ON transacoes(data);
COMMENT ON TABLE transacoes IS 'Transações financeiras, isoladas por usuário';
COMMENT ON COLUMN transacoes.tipo IS 'Valores: IN (entrada), OUT (saída)';
COMMENT ON COLUMN transacoes.status IS 'Valores: PENDING (pendente), PAID (pago)';

-- ----------------------------------------------------------------------------
-- TABELA 10: ordens_servico
-- Ordens de Serviço (isoladas por usuário)
-- Núcleo do sistema - cada OS pertence a um usuário
-- ----------------------------------------------------------------------------
CREATE TABLE "ordens_servico" (
    "id" TEXT PRIMARY KEY,
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "id_veiculo" TEXT REFERENCES "veiculos"("id") ON DELETE SET NULL,
    "status" TEXT NOT NULL,
    "prioridade" TEXT,
    "categoria" TEXT,
    "quilometragem" INTEGER DEFAULT 0,
    "nivel_combustivel" INTEGER DEFAULT 0,
    "defeito_relatado" TEXT,
    "diagnostico" TEXT,
    "id_mecanico" TEXT,
    "data_agendamento" TIMESTAMP WITH TIME ZONE,
    "duracao_estimada" INTEGER,
    "desconto" NUMERIC(10, 2) DEFAULT 0,
    "tipo_desconto" TEXT DEFAULT 'value',
    "observacoes" TEXT,
    "criado_em" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "atualizado_em" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ordens_servico_user_id ON ordens_servico(user_id);
CREATE INDEX idx_ordens_servico_id_veiculo ON ordens_servico(id_veiculo);
CREATE INDEX idx_ordens_servico_status ON ordens_servico(status);
CREATE INDEX idx_ordens_servico_data_agendamento ON ordens_servico(data_agendamento);
COMMENT ON TABLE ordens_servico IS 'Ordens de Serviço, isoladas por usuário';
COMMENT ON COLUMN ordens_servico.status IS 'Valores: RECEPTION, BUDGET, APPROVAL, SCHEDULED, EXECUTION, FINISHED';
COMMENT ON COLUMN ordens_servico.prioridade IS 'Valores: LOW, MEDIUM, HIGH';
COMMENT ON COLUMN ordens_servico.categoria IS 'Valores: PRIVATE, COMPANY, RESTORATION';
COMMENT ON COLUMN ordens_servico.tipo_desconto IS 'Valores: value (R$), percent (%)';
COMMENT ON COLUMN ordens_servico.duracao_estimada IS 'Duração em minutos';

-- ----------------------------------------------------------------------------
-- TABELA 11: itens_ordem
-- Itens (peças/serviços) da OS (herda isolamento via FK ordens_servico)
-- ----------------------------------------------------------------------------
CREATE TABLE "itens_ordem" (
    "id" TEXT PRIMARY KEY,
    "id_ordem" TEXT REFERENCES "ordens_servico"("id") ON DELETE CASCADE,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" NUMERIC(10, 2) DEFAULT 1,
    "preco" NUMERIC(10, 2) DEFAULT 0
);

CREATE INDEX idx_itens_ordem_id_ordem ON itens_ordem(id_ordem);
COMMENT ON TABLE itens_ordem IS 'Itens da OS (peças/serviços), herda isolamento';
COMMENT ON COLUMN itens_ordem.tipo IS 'Valores: PART (peça), SERVICE (serviço)';

-- ----------------------------------------------------------------------------
-- TABELA 12: itens_checklist
-- Checklist da OS (herda isolamento via FK ordens_servico)
-- ----------------------------------------------------------------------------
CREATE TABLE "itens_checklist" (
    "id" TEXT PRIMARY KEY,
    "id_ordem" TEXT REFERENCES "ordens_servico"("id") ON DELETE CASCADE,
    "rotulo" TEXT NOT NULL,
    "marcado" BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_itens_checklist_id_ordem ON itens_checklist(id_ordem);
COMMENT ON TABLE itens_checklist IS 'Checklist da OS, herda isolamento';

-- ----------------------------------------------------------------------------
-- TABELA 13: order_documents
-- Documentos anexados à OS (herda isolamento via FK ordens_servico)
-- ----------------------------------------------------------------------------
CREATE TABLE "order_documents" (
    "id" TEXT PRIMARY KEY,
    "order_id" TEXT REFERENCES "ordens_servico"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_documents_order_id ON order_documents(order_id);
COMMENT ON TABLE order_documents IS 'Documentos da OS, herda isolamento';
COMMENT ON COLUMN order_documents.type IS 'Tipo de arquivo: JPG, PNG, PDF, etc';

-- ----------------------------------------------------------------------------
-- TABELA 14: historico_ordem
-- Histórico de alterações da OS (herda isolamento via FK ordens_servico)
-- ----------------------------------------------------------------------------
CREATE TABLE "historico_ordem" (
    "id" TEXT PRIMARY KEY,
    "id_ordem" TEXT REFERENCES "ordens_servico"("id") ON DELETE CASCADE,
    "acao" TEXT NOT NULL,
    "diff" TEXT,
    "data_hora" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "id_usuario" TEXT
);

CREATE INDEX idx_historico_ordem_id_ordem ON historico_ordem(id_ordem);
CREATE INDEX idx_historico_ordem_data_hora ON historico_ordem(data_hora);
COMMENT ON TABLE historico_ordem IS 'Histórico de alterações da OS, herda isolamento';

-- ============================================================================
-- ETAPA 3: FUNÇÃO E TRIGGERS PARA AUTO-PREENCHER user_id
-- ============================================================================

-- Função genérica que preenche user_id com o ID do usuário logado
CREATE OR REPLACE FUNCTION auto_set_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auto_set_user_id() IS 'Preenche automaticamente user_id com auth.uid() no INSERT';

-- Triggers para cada tabela que possui user_id direto (9 tabelas)
CREATE TRIGGER set_user_id_configuracoes
    BEFORE INSERT ON configuracoes
    FOR EACH ROW EXECUTE FUNCTION auto_set_user_id();

CREATE TRIGGER set_user_id_usuarios
    BEFORE INSERT ON usuarios
    FOR EACH ROW EXECUTE FUNCTION auto_set_user_id();

CREATE TRIGGER set_user_id_marcas
    BEFORE INSERT ON marcas
    FOR EACH ROW EXECUTE FUNCTION auto_set_user_id();

CREATE TRIGGER set_user_id_cambios
    BEFORE INSERT ON cambios
    FOR EACH ROW EXECUTE FUNCTION auto_set_user_id();

CREATE TRIGGER set_user_id_servicos
    BEFORE INSERT ON servicos
    FOR EACH ROW EXECUTE FUNCTION auto_set_user_id();

CREATE TRIGGER set_user_id_itens_estoque
    BEFORE INSERT ON itens_estoque
    FOR EACH ROW EXECUTE FUNCTION auto_set_user_id();

CREATE TRIGGER set_user_id_clientes
    BEFORE INSERT ON clientes
    FOR EACH ROW EXECUTE FUNCTION auto_set_user_id();

CREATE TRIGGER set_user_id_transacoes
    BEFORE INSERT ON transacoes
    FOR EACH ROW EXECUTE FUNCTION auto_set_user_id();

CREATE TRIGGER set_user_id_ordens_servico
    BEFORE INSERT ON ordens_servico
    FOR EACH ROW EXECUTE FUNCTION auto_set_user_id();

-- ============================================================================
-- ETAPA 4: ROW LEVEL SECURITY (RLS) - ISOLAMENTO TOTAL
-- ============================================================================

-- ----------------------------------------------------------------------------
-- RLS TABELA 1: configuracoes
-- ----------------------------------------------------------------------------
ALTER TABLE "configuracoes" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own settings" ON "configuracoes";
CREATE POLICY "Users manage own settings" ON "configuracoes"
    FOR ALL 
    USING (user_id = auth.uid()) 
    WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- RLS TABELA 2: usuarios
-- ----------------------------------------------------------------------------
ALTER TABLE "usuarios" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own team" ON "usuarios";
CREATE POLICY "Users manage own team" ON "usuarios"
    FOR ALL 
    USING (user_id = auth.uid()) 
    WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- RLS TABELA 3: marcas
-- ----------------------------------------------------------------------------
ALTER TABLE "marcas" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own brands" ON "marcas";
CREATE POLICY "Users manage own brands" ON "marcas"
    FOR ALL 
    USING (user_id = auth.uid()) 
    WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- RLS TABELA 4: cambios
-- ----------------------------------------------------------------------------
ALTER TABLE "cambios" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own gearboxes" ON "cambios";
CREATE POLICY "Users manage own gearboxes" ON "cambios"
    FOR ALL 
    USING (user_id = auth.uid()) 
    WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- RLS TABELA 5: servicos
-- ----------------------------------------------------------------------------
ALTER TABLE "servicos" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own services" ON "servicos";
CREATE POLICY "Users manage own services" ON "servicos"
    FOR ALL 
    USING (user_id = auth.uid()) 
    WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- RLS TABELA 6: itens_estoque
-- ----------------------------------------------------------------------------
ALTER TABLE "itens_estoque" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own inventory" ON "itens_estoque";
CREATE POLICY "Users manage own inventory" ON "itens_estoque"
    FOR ALL 
    USING (user_id = auth.uid()) 
    WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- RLS TABELA 7: clientes
-- ----------------------------------------------------------------------------
ALTER TABLE "clientes" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own clients" ON "clientes";
CREATE POLICY "Users manage own clients" ON "clientes"
    FOR ALL 
    USING (user_id = auth.uid()) 
    WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- RLS TABELA 8: veiculos (isolamento através de clientes)
-- ----------------------------------------------------------------------------
ALTER TABLE "veiculos" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage vehicles through clients" ON "veiculos";
CREATE POLICY "Users manage vehicles through clients" ON "veiculos"
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM clientes 
            WHERE clientes.id = veiculos.id_cliente 
            AND clientes.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM clientes 
            WHERE clientes.id = veiculos.id_cliente 
            AND clientes.user_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- RLS TABELA 9: transacoes
-- ----------------------------------------------------------------------------
ALTER TABLE "transacoes" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own transactions" ON "transacoes";
CREATE POLICY "Users manage own transactions" ON "transacoes"
    FOR ALL 
    USING (user_id = auth.uid()) 
    WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- RLS TABELA 10: ordens_servico
-- ----------------------------------------------------------------------------
ALTER TABLE "ordens_servico" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own orders" ON "ordens_servico";
CREATE POLICY "Users manage own orders" ON "ordens_servico"
    FOR ALL 
    USING (user_id = auth.uid()) 
    WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- RLS TABELA 11: itens_ordem (isolamento através de ordens_servico)
-- ----------------------------------------------------------------------------
ALTER TABLE "itens_ordem" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage items through orders" ON "itens_ordem";
CREATE POLICY "Users manage items through orders" ON "itens_ordem"
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM ordens_servico 
            WHERE ordens_servico.id = itens_ordem.id_ordem 
            AND ordens_servico.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM ordens_servico 
            WHERE ordens_servico.id = itens_ordem.id_ordem 
            AND ordens_servico.user_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- RLS TABELA 12: itens_checklist (isolamento através de ordens_servico)
-- ----------------------------------------------------------------------------
ALTER TABLE "itens_checklist" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage checklist through orders" ON "itens_checklist";
CREATE POLICY "Users manage checklist through orders" ON "itens_checklist"
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM ordens_servico 
            WHERE ordens_servico.id = itens_checklist.id_ordem 
            AND ordens_servico.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM ordens_servico 
            WHERE ordens_servico.id = itens_checklist.id_ordem 
            AND ordens_servico.user_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- RLS TABELA 13: order_documents (isolamento através de ordens_servico)
-- ----------------------------------------------------------------------------
ALTER TABLE "order_documents" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage documents through orders" ON "order_documents";
CREATE POLICY "Users manage documents through orders" ON "order_documents"
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM ordens_servico 
            WHERE ordens_servico.id = order_documents.order_id 
            AND ordens_servico.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM ordens_servico 
            WHERE ordens_servico.id = order_documents.order_id 
            AND ordens_servico.user_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- RLS TABELA 14: historico_ordem (isolamento através de ordens_servico)
-- ----------------------------------------------------------------------------
ALTER TABLE "historico_ordem" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see history through orders" ON "historico_ordem";
CREATE POLICY "Users see history through orders" ON "historico_ordem"
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM ordens_servico 
            WHERE ordens_servico.id = historico_ordem.id_ordem 
            AND ordens_servico.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM ordens_servico 
            WHERE ordens_servico.id = historico_ordem.id_ordem 
            AND ordens_servico.user_id = auth.uid()
        )
    );

-- ============================================================================
-- ETAPA 5: VALIDAÇÃO E INSTRUÇÕES
-- ============================================================================

-- Para validar que tudo funcionou corretamente:
--
-- 1. Faça login no sistema com um usuário
-- 2. Execute: SELECT * FROM clientes;
-- 3. Resultado esperado: Vazio (ou apenas dados desse usuário)
-- 4. Crie um cliente através do sistema
-- 5. Faça logout e login com outro usuário
-- 6. Execute novamente: SELECT * FROM clientes;
-- 7. Resultado esperado: Vazio (não deve ver o cliente do usuário anterior)
--
-- RESUMO:
-- - 14 tabelas criadas com sucesso
-- - 9 tabelas com user_id direto (+ triggers)
-- - 5 tabelas que herdam isolamento via FK
-- - RLS ativo em todas as 14 tabelas
-- - Isolamento total garantido
--
-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
