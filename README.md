# Projeto Prática

docs: https://docs.google.com/document/d/1TAAgqXNDqt-VwOz2UvTYLu7HG_jW5TVuvvDxYErDZT8/edit?usp=sharing

O **Projeto Prática** é um sistema web desenvolvido para modernizar e centralizar o cadastro de **Centros de Aprendizagem (CA)** do **IFRN**, servindo como uma ponte eficiente entre alunos e professores.
---
## Equipe
A execução do projeto é realizada pelos desenvolvedores:

* **Eduardo Vinícius**
* **José Abílio**
* **Lucas Fernando**
* **Maria Luíza**

---

## Proposta
Auxiliar a comunidade acadêmica do IFRN através de uma interface intuitiva que facilite o registro, a consulta e a gestão dos Centros de Aprendizagem, otimizando o fluxo de informações institucionais.

---

## Tecnologia Front-End

**React.js**

---

## Cronograma Planejado (Atualizado)

Analise do estado atual (com base no codigo do repositorio):

- Aluno: autenticacao SUAP, complementacao de perfil, solicitacao de atendimento e estrutura de telas principais implementadas.
- Professor: existe rota e dashboard, porem a tela atual ainda usa dados mock e sem CRUD completo integrado ao backend.
- Mediador/Admin: ha indicios de modelagem e botoes no login, mas sem fluxo completo de telas, rotas dedicadas e autorizacao por papel implementados.
- Backend: existem rotas de alunos, usuarios e atendimentos, mas faltam endpoints completos por papel e camada de seguranca/autorizacao consolidada.

Marco temporal confirmado:

- Sprint 8: 05/09/2026 a 11/09/2026.

Com isso, o planejamento ajustado da Sprint 9 em diante fica:

| Sprint | Periodo | Foco principal | Entregas esperadas |
|---|---|---|---|
| Sprint 9 | 12/09 a 01/10 | Integracao back-front (prioridade herdada da Sprint 8) | Concluir conexao back-front de atendimentos e concluir integracao back-front de agendamentos |
| Sprint 10 | 02/10 a 18/10 | Professor (frontend - fase 2) | Finalizar telas de horarios, indicadores e relatorios com estados reais (loading, erro, vazio) |
| Sprint 11 | 19/10 a 31/10 | Professor (backend + integracao) | Entregar endpoints de professor e integrar CRUD principal de atendimentos |
| Sprint 12 | 01/11 a 10/11 | Mediador + Admin (MVP) | Fluxo minimo de mediador e painel admin essencial para usuarios, turmas e disciplinas |
| Sprint 13 | 11/11 a 15/11 | Fechamento (meados de novembro) | Seguranca por papel, testes ponta a ponta, regressao e validacao final de requisitos |

### Detalhamento por Sprint

Sprint 9 (12/09 a 01/10) - Integracao back-front (prioridade herdada da Sprint 8)

1. Concluir conexao back-front de atendimentos.
2. Concluir integracao back-front de agendamentos.
3. Validar persistencia dos dados no banco e refletir atualizacoes no frontend sem dados mock.
4. Corrigir inconsistencias de campos/contratos entre respostas da API e telas.

Sprint 10 (02/10 a 18/10) - Professor (frontend - fase 2)

1. Finalizar telas de Horarios, Indicadores e Relatorios do professor.
2. Substituir dados mock por estado preparado para consumo real de API (loading, erro, vazio).
3. Padronizar feedback visual (mensagens, toasts e estados sem dados).
4. Revisar responsividade e usabilidade do fluxo completo do professor no frontend.

Sprint 11 (19/10 a 31/10) - Professor (backend + integracao)

1. Criar endpoints de professor para listar atendimentos por docente e atualizar status.
2. Implementar operacoes de editar/cancelar atendimento com validacoes de regra de negocio.
3. Conectar frontend do professor com backend para os fluxos principais de atendimento.
4. Validar regras de negocio dos estados do atendimento e fechar versao funcional completa do modulo professor.

Sprint 12 (01/11 a 10/11) - Mediador + Admin (MVP)

1. Criar tela inicial do mediador com fila de solicitacoes TAI.
2. Implementar backend para atribuicao/acompanhamento de solicitacoes por mediador.
3. Criar area admin com gestao de usuarios (aluno, professor, mediador), turmas e disciplinas.
4. Liberar acoes minimas de mediador/admin para operacao basica do sistema.

Sprint 13 (11/11 a 15/11) - Fechamento (meados de novembro)

1. Definir middleware/dependencias de autenticacao para proteger rotas sensiveis.
2. Aplicar autorizacao por papel em backend (aluno/professor/mediador/admin).
3. Ajustar frontend para esconder/acessar apenas funcionalidades permitidas por papel.
4. Executar testes ponta a ponta, corrigir regressao e validar requisitos para entrega ate 15/11.

### Revisoes Finais

- Periodo de revisoes e ajustes finais: 16/11 a 01/12.
- Atividades: revisao tecnica, validacao com usuarios, ajustes de usabilidade, documentacao final e preparacao de demonstracao.

---


