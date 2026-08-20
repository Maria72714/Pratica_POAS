# Requisitos do Projeto

Este documento descreve os requisitos funcionais (RF) e não funcionais (RNF) do sistema de agendamento/atendimento acadêmico desenvolvido neste repositório.

--

## Requisitos Funcionais (RF)

RF-01 - Autenticação de usuários
- Descrição: O sistema deve permitir que usuários se autentiquem usando credenciais próprias. Apenas os papéis `aluno` e `professor` podem se autenticar via SUAP; o `mediador` deverá criar uma conta local no sistema para acessar a aplicação. Administradores (`admin`) têm contas gerenciadas pelo sistema.
- Critério de aceite: Usuário consegue logar com email/senha ou (quando aplicável) via SUAP; `aluno`/`professor` via SUAP, `mediador` via criação de conta local, e um token de sessão válido é emitido.

RF-02 - Gestão de Perfis e Papéis
- Descrição: O sistema deve suportar os papéis `aluno`, `professor`, `mediador` e `admin` com permissões distintas. O fluxo de criação de conta difere por papel: `aluno` e `professor` podem autenticar via SUAP quando disponível; `mediador` deve criar conta local; `admin` possui privilégios administrativos.
- Critério de aceite: Usuários com papéis diferentes veem interfaces e ações autorizadas conforme seu papel; `mediador` consegue registrar sua conta localmente antes de usar a aplicação.

RF-03 - CRUD de Disciplinas
- Descrição: O gerenciamento de disciplinas é restrito ao papel `admin`. Apenas administradores podem ler, atualizar e remover disciplinas; a criação/publicação de novas disciplinas também é responsabilidade do `admin` (professores não têm permissão para gerenciar disciplinas).
- Critério de aceite: Endpoints e interfaces relacionados a disciplinas permitem operações apenas quando o usuário autenticado tem o papel `admin`; demais papéis não apresentam controles de criação/edição/remoção.

RF-04 - CRUD de Turmas
- Descrição: Professores/administradores devem gerenciar turmas (vincular disciplinas, horários, alunos).
- Critério de aceite: Turmas aparecem no dashboard e podem ser editadas.

RF-05 - Gestão de Salas e Horários
- Descrição: Administradores/mantenedores podem cadastrar salas e horários e associá-los a turmas.
- Critério de aceite: Associação horário↔sala persistida e exibida no calendário.

RF-06 - Solicitação de Atendimento
- Descrição: Alunos podem solicitar atendimento informando disciplina, preferências de horário e descrição do problema.
- Critério de aceite: Solicitações criadas, visíveis pelo professor/mediador e pelo próprio aluno no histórico.

RF-07 - Agendamento e Confirmação
- Descrição: Professores/mediadores podem aceitar, recusar ou propor novo horário para solicitações. Sistema envia confirmação ao aluno.
- Critério de aceite: Estado da solicitação (pendente, confirmado, recusado, reagendado) é persistido e comunicado.

RF-08 - Notificações
- Descrição: O sistema deve notificar usuários sobre mudanças relevantes (confirmação, recusa, lembretes).
- Critério de aceite: Notificações aparecem na interface e podem ser marcadas como lidas; associação `usuario_notificacao` registrada.

RF-09 - Histórico de Atendimentos
- Descrição: Usuários podem ver o histórico de atendimentos e solicitações com filtros por período, disciplina e status.
- Critério de aceite: Página de histórico lista eventos filtráveis e paginados.

RF-10 - Upload de Documentos
- Descrição: Usuários autorizados podem anexar arquivos (ex.: matriz curricular) a entidades relevantes.
- Critério de aceite: Uploads salvos em pasta `uploads/` e metadados persistidos.

RF-11 - Painel/Dashboard
- Descrição: Diferentes dashboards para `aluno`, `professor` e `mediador` exibindo informações relevantes (próximos atendimentos, solicitações pendentes, estatísticas).
- Critério de aceite: Layouts `Dashboard.jsx` e `DashboardProfessor.jsx` mostram dados reais via API.

RF-12 - Integração com Calendário
- Descrição: Exportar ou visualizar atendimentos em formato de calendário, com possibilidade de exportar eventos.
- Critério de aceite: Visualização calendarizada e opção de exportar em formato iCal/CSV (mínimo visualização interna).

RF-13 - Busca e Filtros
- Descrição: Buscar disciplinas, turmas, solicitações e usuários com filtros relevantes.
- Critério de aceite: Resultados retornam rapidamente e respeitam filtros aplicados.

RF-14 - API REST consistente
- Descrição: Backend deve expor endpoints REST claros para operações principais e autenticação.
- Critério de aceite: `backend/main.py` e `services/api.js` usam endpoints documentados e testáveis.

RF-15 - Relatórios Básicos
- Descrição: Gerar relatórios simples (número de atendimentos por período, por disciplina, por professor).
- Critério de aceite: Exportar ou visualizar relatório via interface administrativa.


## Requisitos Não Funcionais (RNF)

RNF-01 - Segurança e Autorização
- Descrição: Implementar autenticação segura (tokens JWT ou sessão segura) e controle de acesso por papel.
- Critério de aceite: Endpoints protegidos retornam 401/403 quando acessados sem permissão; senhas armazenadas hashed.

RNF-02 - Privacidade de Dados
- Descrição: Dados pessoais dos usuários devem ser tratados conforme boas práticas (mínimo necessário), com políticas de deleção e controle de acesso.
- Critério de aceite: API permite remoção lógica/efetiva de contas e dados sensíveis não são expostos em endpoints públicos.

RNF-03 - Performance
- Descrição: Páginas críticas devem responder em menos de 500ms em condições normais; API deve suportar concorrência moderada.
- Critério de aceite: Testes de carga básicos mostram latências aceitáveis para uso esperado (ex.: 100 req/s de pico reduzido a endpoints não críticos).

RNF-04 - Escalabilidade
- Descrição: Arquitetura deve permitir escalar componentes (stateless backend, banco de dados separado, CDN para frontend).
- Critério de aceite: Código sem dependências que impeçam escala horizontal e com configurações explícitas para variáveis de ambiente.

RNF-05 - Disponibilidade
- Descrição: Sistema deve ter tolerância a falhas básicas e reiniciar serviços sem perda de dados.
- Critério de aceite: Backups de BD e scripts de migração/documentação disponíveis.

RNF-06 - Manutenibilidade
- Descrição: Código organizado em módulos, com testes automatizados e documentação mínima (README, comentários de API).
- Critério de aceite: Estrutura clara (ex.: `backend/models`, `frontend/src/components`) e instruções para rodar localmente em `README.md`.

RNF-07 - Testabilidade
- Descrição: Backend e componentes críticos devem ter testes unitários e/ou de integração.
- Critério de aceite: Suite de testes executável com `pytest` ou framework equivalente; cobertura mínima das rotas críticas.

RNF-08 - Usabilidade e Acessibilidade
- Descrição: Interfaces devem ser responsivas e acessíveis (nível básico: navegação por teclado, contrastes adequados).
- Critério de aceite: UI responsiva em dispositivos móveis e verificação manual de pontos de acessibilidade.

RNF-09 - Internacionalização / Localização
- Descrição: Aplicação deve ter texto em Português por padrão e permitir extensão para outros idiomas.
- Critério de aceite: Todas as strings principais centralizadas / fáceis de substituir.

RNF-10 - Registro e Monitoramento
- Descrição: Logs estruturados e métricas básicas sobre erros e uso.
- Critério de aceite: Logs de erro no backend com níveis (INFO/WARN/ERROR) e pontos de instrumentação para métricas.

RNF-11 - Compatibilidade
- Descrição: Frontend deve suportar navegadores modernos (Chrome, Firefox, Edge) e se adaptar a tamanhos de tela.
- Critério de aceite: Teste manual em navegadores principais sem erros críticos.

RNF-12 - Conformidade com políticas institucionais
- Descrição: Garantir que armazenamento e processamento de dados pessoais sigam políticas da instituição (quando aplicável).
- Critério de aceite: Documentação indicando quais dados são coletados e para qual finalidade.


## Critérios Gerais de Aceitação
- Todos os requisitos devem ter endpoints/rotas correspondentes no backend quando aplicável.
- Documentação mínima para instalação e execução local disponível no `README.md`.
- Testes automatizados cobrem fluxos críticos: autenticação, criação de solicitações e alteração de status.


## Notas de Implementação e Mapeamento com o Repositório
- O esquema de banco de dados inicial está em `backend/schema.sql`.
- Modelos relevantes estão em `backend/models/` (ex.: `solicitacao.py`, `atendimento.py`, `notificacao.py`).
- Frontend possui componentes em `frontend/src/components` e serviços em `frontend/src/services`.


## Mudanças Futuras (possíveis requisitos adiante)
- Integração com calendário institucional (Google Calendar/Outlook).
- Sistema de avaliação de atendimentos e feedback.
- Painel administrativo avançado com gestão de recursos e permissões finas.
