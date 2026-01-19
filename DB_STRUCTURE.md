# Estrutura do Banco de Dados

Este arquivo descreve as tabelas e campos do banco de dados do sistema, de forma simplificada.

## 1. configuracoes
Armazena as configurações gerais da oficina e do sistema.
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | TEXT | Chave primária |
| `user_id` | UUID | ID do usuário dono (vinculado ao auth) |
| `nome_oficina` | TEXT | Nome da oficina |
| `cnpj` | TEXT | CNPJ da oficina |
| `email` | TEXT | Email de contato |
| `telefone` | TEXT | Telefone de contato |
| `cep`, `endereco`... | TEXT | Dados de endereço completos |
| `logo_url` | TEXT | URL da logomarca |
| `horario_funcionamento` | JSONB | Estrutura JSON com horários |
| `whatsapp_message_template` | TEXT | Modelo de mensagem para WhatsApp |
| `auth_term_template` | TEXT | Modelo de termo de autorização |

## 2. usuarios
Usuários do sistema (além da autenticação).
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | TEXT | Chave primária |
| `user_id` | UUID | Vinculo com auth.uid() |
| `nome` | TEXT | Nome completo |
| `papel` | TEXT | Nível de acesso ('ADMIN', 'MECHANIC', 'ADVISOR') |

## 3. marcas
Marcas de veículos atendidas.
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | TEXT | Chave primária |
| `user_id` | UUID | ID do usuário |
| `nome` | TEXT | Nome da marca |
| `logo_url` | TEXT | URL do logo da marca |

## 4. cambios
Modelos de câmbios e transmissões.
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | TEXT | Chave primária |
| `user_id` | UUID | ID do usuário |
| `codigo` | TEXT | Código interno |
| `modelo` | TEXT | Modelo do câmbio |
| `marca` | TEXT | Marca fabricante |
| `tipo` | TEXT | Tipo de transmissão |
| `specs` | TEXT | Especificações técnicas |
| `tempo_montagem` | TEXT | Tempo estimado de montagem |

## 5. servicos
Catálogo de serviços oferecidos.
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | TEXT | Chave primária |
| `user_id` | UUID | ID do usuário |
| `codigo` | TEXT | Código do serviço |
| `nome` | TEXT | Nome descritivo |
| `categoria` | TEXT | Categoria do serviço |
| `preco` | NUMERIC | Preço padrão |
| `tempo` | TEXT | Tempo estimado |

## 6. itens_estoque
Peças e produtos em estoque.
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | TEXT | Chave primária |
| `user_id` | UUID | ID do usuário |
| `codigo` | TEXT | Código da peça (SKU) |
| `nome` | TEXT | Nome da peça |
| `fornecedor` | TEXT | Nome do fornecedor |
| `preco_custo` | NUMERIC | Preço de custo |
| `preco_venda` | NUMERIC | Preço de venda |
| `estoque` | INTEGER | Quantidade atual |
| `estoque_minimo` | INTEGER | Alerta de estoque mínimo |

## 7. clientes
Cadastro de clientes.
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | TEXT | Chave primária |
| `user_id` | UUID | ID do usuário (dono do registro) |
| `nome` | TEXT | Nome do cliente |
| `email` | TEXT | Email |
| `telefone` | TEXT | Telefone/WhatsApp |
| `cpf` | TEXT | CPF ou CNPJ |
| `endereco`... | TEXT | Dados completos de endereço |

## 8. veiculos
Veículos dos clientes.
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | TEXT | Chave primária |
| `id_cliente` | TEXT | Relacionamento com tabela `clientes` |
| `placa` | TEXT | Placa do veículo |
| `modelo` | TEXT | Modelo do veículo |
| `marca` | TEXT | Marca do veículo |
| `ano` | INTEGER | Ano de fabricação |
| `cor` | TEXT | Cor do veículo |

## 9. transacoes
Entradas e saídas financeiras.
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | TEXT | Chave primária |
| `user_id` | UUID | ID do usuário |
| `descricao` | TEXT | Descrição da transação |
| `categoria` | TEXT | Categoria financeira |
| `valor` | NUMERIC | Valor da transação |
| `tipo` | TEXT | Tipo ('receita' ou 'despesa' - implícito) |
| `status` | TEXT | Status do pagamento |
| `data` | TIMESTAMP | Data da transação |
| `id_ordem` | TEXT | Vínculo opcional com OS |
| `forma_pagamento`| TEXT | Forma de pagamento utilizada |

## 10. ordens_servico
Tabela principal das Ordens de Serviço (OS).
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | TEXT | Chave primária |
| `user_id` | UUID | ID do usuário |
| `id_veiculo` | TEXT | Vínculo com tabela `veiculos` |
| `status` | TEXT | Status atual da OS |
| `prioridade` | TEXT | Nível de prioridade |
| `categoria` | TEXT | Categoria do serviço |
| `quilometragem` | INTEGER | KM atual do veículo |
| `nivel_combustivel`| INTEGER | Nível de combustível (0-100) |
| `defeito_relatado` | TEXT | Relato do cliente |
| `diagnostico` | TEXT | Diagnóstico técnico |
| `id_mecanico` | TEXT | Mecânico responsável |
| `data_agendamento` | TIMESTAMP | Data agendada |
| `duracao_estimada` | INTEGER | Duração prevista (minutos/horas) |
| `desconto` | NUMERIC | Valor de desconto aplicado |
| `tipo_desconto` | TEXT | Tipo ('value' ou 'percent') |
| `observacoes` | TEXT | Observações gerais |
| `criado_em` | TIMESTAMP | Data de criação |

## 11. itens_ordem
Peças e serviços adicionados a uma OS.
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | TEXT | Chave primária |
| `id_ordem` | TEXT | Vínculo com `ordens_servico` |
| `tipo` | TEXT | Tipo do item ('PART' ou 'SERVICE') |
| `descricao` | TEXT | Nome/descrição do item |
| `quantidade` | NUMERIC | Quantidade utilizada |
| `preco` | NUMERIC | Preço unitário |
| `waiting_parts` | BOOLEAN | Se está aguardando peça |
| `expected_arrival` | TIMESTAMP | Previsão de chegada da peça |

## 12. itens_checklist
Itens de verificação (checklist) da OS.
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | TEXT | Chave primária |
| `id_ordem` | TEXT | Vínculo com `ordens_servico` |
| `rotulo` | TEXT | Nome do item verificado |
| `marcado` | BOOLEAN | Se foi verificado/aprovado |

## 13. order_documents
Documentos e anexos da OS.
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | TEXT | Chave primária |
| `order_id` | TEXT | Vínculo com `ordens_servico` |
| `name` | TEXT | Nome do arquivo |
| `url` | TEXT | URL do arquivo (Bucket) |
| `type` | TEXT | Tipo (MIME type ou categoria) |
| `created_at` | TIMESTAMP | Data de upload |

## 14. historico_ordem
Log de atividades e alterações da OS.
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | TEXT | Chave primária |
| `id_ordem` | TEXT | Vínculo com `ordens_servico` |
| `acao` | TEXT | Descrição da ação (ex: "Mudou status") |
| `diff` | TEXT | Detalhes da alteração (JSON stringfy) |
| `data_hora` | TIMESTAMP | Momento da ação |
| `id_usuario` | TEXT | Usuário que realizou a ação |

## 15. formas_pagamento
Configuração de métodos de pagamento aceitos.
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | UUID | Chave primária |
| `user_id` | UUID | ID do usuário |
| `name` | TEXT | Nome da forma de pagamento |
| `active` | BOOLEAN | Se está ativa para uso |
| `created_at` | TIMESTAMP | Data de criação |
