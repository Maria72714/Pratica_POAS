from datetime import date
from fastapi import HTTPException
from sqlmodel import select
import logging
import time

from models.associativas.aluno_atendimento import AlunoAtendimento
from models.associativas.professor_disciplina import ProfessorDisciplina
from models.atendimento import Atendimento
from models.disciplina import Disciplina
from models.horario import Horario
from models.sala import Sala
from models.enums import StatusSolicitacao, TipoAtendimento, StatusAtendimento
from models.solicitacao import Solicitacao
from models.users.aluno import Aluno
from models.users.professor import Professor
from models.users.user import Usuario
from repositories.aluno_repository import AlunoRepository
from repositories.solicitacao_repository import SolicitacaoRepository
from repositories.usuario_repository import UsuarioRepository
from utils.calendario_academico import is_feriado_ou_recesso
from services.notification_service import NotificationService

logger = logging.getLogger(__name__)

# Evita reconsultar o SUAP a cada carregamento da listagem do aluno.
_PROFESSORES_SYNC_RECENTE: dict[int, float] = {}
_PROFESSORES_SYNC_COOLDOWN = 600  # segundos


class SolicitacaoService:
    def __init__(self, session):
        self.session = session
        self.usuario_repository = UsuarioRepository(session)
        self.aluno_repository = AlunoRepository(session)
        self.repository = SolicitacaoRepository(session)
        self.notification_service = NotificationService(session)

    def criar_solicitacao(self, dados):
        usuario = self.usuario_repository.get_by_matricula(dados.matricula)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")

        aluno = self.aluno_repository.get_by_user_id(usuario.id)
        if not aluno:
            raise HTTPException(status_code=404, detail="Aluno não encontrado")

        # Regra: apenas alunos PNEE (com necessidade educacional específica
        # declarada na complementação de perfil) podem solicitar Centros de
        # Aprendizagem (CA).
        if not aluno.perfil_completo:
            raise HTTPException(
                status_code=403,
                detail="Complete seu perfil antes de solicitar um atendimento.",
            )
        if not aluno.necessidades_especiais:
            raise HTTPException(
                status_code=403,
                detail="Somente alunos PNEE (com necessidade educacional específica) podem solicitar Centros de Aprendizagem (CA).",
            )

        disciplina = self.repository.get_disciplina_by_nome(dados.disciplina)
        if not disciplina:
            # A disciplina é escolhida a partir do boletim oficial do SUAP e pode
            # ainda não existir no catálogo local (que só é populado pelos diários
            # dos professores). Registra on-demand para permitir a solicitação.
            nome_disciplina = (dados.disciplina or "").strip()
            if not nome_disciplina:
                raise HTTPException(status_code=400, detail="Disciplina inválida.")
            disciplina = Disciplina(nome=nome_disciplina)
            self.session.add(disciplina)
            self.session.commit()
            self.session.refresh(disciplina)

        if dados.data_preferencial:
            data_iso = dados.data_preferencial.isoformat() if hasattr(dados.data_preferencial, 'isoformat') else str(dados.data_preferencial)
            if is_feriado_ou_recesso(data_iso):
                from utils.calendario_academico import get_evento_do_dia
                evento = get_evento_do_dia(data_iso)
                evento_info = evento["descricao"] if evento else "Feriado ou Recesso"
                raise HTTPException(
                    status_code=400,
                    detail=f"Não é permitido solicitar atendimento em dias de feriado ou recesso. Data: {data_iso} ({evento_info})"
                )

        solicitacao = Solicitacao(
            id_aluno=aluno.id,
            id_disciplina=disciplina.id,
            tipo_suporte=dados.tipo_suporte,
            descricao=dados.descricao,
            data_preferencial=dados.data_preferencial,
        )
        criada = self.repository.create(solicitacao)
        
        # Notificar mediadores sobre a nova solicitação
        try:
            self.notification_service.notificar_aluno_criou_solicitacao(
                aluno_id=aluno.id,
                aluno_nome=usuario.nome,
                disciplina_nome=disciplina.nome
            )
        except Exception as e:
            logger.error(f"Erro ao notificar sobre nova solicitação: {e}")
        
        return criada

    def criar_solicitacao_por_mediador(self, dados):
        """Cria uma solicitação TAI em nome de um aluno PNEE (usado pelo mediador)."""
        # Resolve aluno pelo campo matricula_aluno
        usuario_aluno = self.usuario_repository.get_by_matricula(dados.matricula_aluno)
        if not usuario_aluno:
            raise HTTPException(status_code=404, detail="Aluno não encontrado pela matrícula informada")

        aluno = self.aluno_repository.get_by_user_id(usuario_aluno.id)
        if not aluno:
            raise HTTPException(status_code=404, detail="Registro de aluno não encontrado")

        disciplina = self.repository.get_disciplina_by_nome(dados.disciplina)
        if not disciplina:
            raise HTTPException(status_code=404, detail=f"Disciplina '{dados.disciplina}' não encontrada")

        if dados.data_preferencial:
            data_iso = dados.data_preferencial.isoformat() if hasattr(dados.data_preferencial, 'isoformat') else str(dados.data_preferencial)
            if is_feriado_ou_recesso(data_iso):
                raise HTTPException(
                    status_code=400,
                    detail=f"Não é permitido solicitar atendimento em dias de feriado ou recesso. Data: {data_iso}"
                )

        # Resolve mediador (id_mediador é opcional mas vamos tentar vincular)
        id_mediador_resolvido = None
        if dados.id_mediador is not None:
            from models.users.mediador import Mediador
            from models.enums import TipoMediador

            mediador_alvo = None
            raw = dados.id_mediador
            if isinstance(raw, int):
                mediador_alvo = self.session.get(Mediador, raw)
            elif isinstance(raw, str) and raw.strip().isdigit():
                mediador_alvo = self.session.get(Mediador, int(raw.strip()))
            elif isinstance(raw, str) and raw.strip():
                u = self.usuario_repository.get_by_matricula(raw.strip())
                if u:
                    mediador_alvo = self.session.get(Mediador, u.id)
                    if not mediador_alvo:
                        novo = Mediador(id=u.id, tipo=TipoMediador.ACOMPANHAMENTO, apoio_descricao="Mediador institucional")
                        self.session.add(novo)
                        self.session.commit()
                        mediador_alvo = novo

            if not mediador_alvo:
                mediador_alvo = self.session.exec(select(Mediador)).first()

            id_mediador_resolvido = mediador_alvo.id if mediador_alvo else None

        solicitacao = Solicitacao(
            id_aluno=aluno.id,
            id_disciplina=disciplina.id,
            id_mediador=id_mediador_resolvido,
            tipo_suporte=dados.tipo_suporte,
            descricao=dados.descricao,
            data_preferencial=dados.data_preferencial,
        )
        criada = self.repository.create(solicitacao)

        return {
            "id": criada.id,
            "id_aluno": criada.id_aluno,
            "id_disciplina": criada.id_disciplina,
            "disciplina_nome": disciplina.nome,
            "tipo_suporte": criada.tipo_suporte,
            "descricao": criada.descricao,
            "data_preferencial": criada.data_preferencial.isoformat() if criada.data_preferencial else None,
            "status": criada.status.value if hasattr(criada.status, "value") else str(criada.status),
            "aluno_nome": usuario_aluno.nome,
            "criado_por_mediador": True,
        }

    def _disciplina_tem_professor(self, id_disciplina: int | None) -> bool:
        if not id_disciplina:
            return False
        return (
            self.session.exec(
                select(ProfessorDisciplina.professor_id).where(
                    ProfessorDisciplina.disciplina_id == id_disciplina
                )
            ).first()
            is not None
        )

    async def atualizar_professores_do_suap(self, matricula: str) -> None:
        """Atualiza os vínculos professor→disciplina a partir do SUAP, sob demanda.

        Usa o token do SUAP guardado no login. Só consulta o SUAP se houver alguma
        disciplina das solicitações do aluno ainda sem professor vinculado, para
        não onerar a listagem.
        """
        from services.suap_disciplinas_service import sincronizar_disciplinas_aluno
        from services.suap_token_store import obter_token

        usuario = self.usuario_repository.get_by_matricula(matricula)
        aluno = self.aluno_repository.get_by_user_id(usuario.id) if usuario else None
        if not usuario or not aluno:
            return

        solicitacoes = self.repository.list_by_aluno_id(aluno.id)
        if not any(not self._disciplina_tem_professor(s.id_disciplina) for s in solicitacoes):
            return

        # Já sincronizamos há pouco: não repete as chamadas ao SUAP a cada carregamento.
        if time.time() - _PROFESSORES_SYNC_RECENTE.get(usuario.id, 0) < _PROFESSORES_SYNC_COOLDOWN:
            return

        token = obter_token(usuario.id)
        if not token:
            return

        _PROFESSORES_SYNC_RECENTE[usuario.id] = time.time()
        try:
            await sincronizar_disciplinas_aluno(self.session, token, aluno_id=aluno.id)
        except Exception as e:
            self.session.rollback()
            logger.warning(f"Não foi possível atualizar professores via SUAP: {e}")

    def listar_solicitacoes_aluno(self, matricula: str):
        usuario = self.usuario_repository.get_by_matricula(matricula)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")

        aluno = self.aluno_repository.get_by_user_id(usuario.id)
        if not aluno:
            raise HTTPException(status_code=404, detail="Aluno não encontrado")

        solicitacoes = self.repository.list_by_aluno_id(aluno.id)
        resultado = []
        for s in solicitacoes:
            disciplina = self.session.get(Disciplina, s.id_disciplina)

            # Professores responsáveis pela disciplina (vínculo ProfessorDisciplina),
            # preenchido quando o professor sincroniza seus diários com o SUAP.
            professores = []
            if disciplina:
                prof_ids = self.session.exec(
                    select(ProfessorDisciplina.professor_id).where(
                        ProfessorDisciplina.disciplina_id == disciplina.id
                    )
                ).all()
                for prof_id in prof_ids:
                    u_prof = self.session.get(Usuario, prof_id)
                    if u_prof:
                        professores.append({
                            "id": prof_id,
                            "nome": u_prof.nome,
                            "email": u_prof.email,
                        })

            # Sala/horário só existem depois que o atendimento é agendado.
            atendimento = self.session.exec(
                select(Atendimento).where(Atendimento.id_solicitacao == s.id)
            ).first()

            # Se o atendimento já tem professor definido, ele tem prioridade.
            if atendimento and atendimento.id_professor:
                u_prof_at = self.session.get(Usuario, atendimento.id_professor)
                if u_prof_at:
                    professores = [p for p in professores if p["id"] != atendimento.id_professor]
                    professores.insert(0, {
                        "id": atendimento.id_professor,
                        "nome": u_prof_at.nome,
                        "email": u_prof_at.email,
                    })

            professor_nome = professores[0]["nome"] if professores else None

            sala_nome = None
            horario_inicio = None
            horario_termino = None
            if atendimento:
                if atendimento.id_sala:
                    sala = self.session.get(Sala, atendimento.id_sala)
                    sala_nome = sala.nome if sala else None
                if atendimento.id_horario:
                    horario = self.session.get(Horario, atendimento.id_horario)
                    if horario:
                        horario_inicio = horario.horario_inicio.isoformat() if horario.horario_inicio else None
                        horario_termino = horario.horario_termino.isoformat() if horario.horario_termino else None

            resultado.append({
                "id": s.id,
                "id_aluno": s.id_aluno,
                "id_disciplina": s.id_disciplina,
                "disciplina": disciplina.nome if disciplina else "Atendimento TAI",
                "disciplina_nome": disciplina.nome if disciplina else "Atendimento TAI",
                "tipo_suporte": s.tipo_suporte,
                "tipo_solicitacao": "TAI",
                "descricao": s.descricao,
                "observacoes": s.descricao,
                "data_preferencial": s.data_preferencial.isoformat() if s.data_preferencial else None,
                "data": s.data_preferencial.isoformat() if s.data_preferencial else None,
                "data_atendimento": s.data_preferencial.isoformat() if s.data_preferencial else None,
                "status": s.status.value if hasattr(s.status, "value") else str(s.status),
                "professor_nome": professor_nome,
                "professores": professores,
                "sala_nome": sala_nome,
                "horario_inicio": horario_inicio,
                "horario_termino": horario_termino,
            })
        return resultado

    def listar_solicitacoes_pendentes(self, role: str = None):
        """
        Lista solicitações pendentes.
        - Mediador: vê TODAS as solicitações pendentes (para poder selar)
        - Professor: vê APENAS solicitações que já foram seladas pelo mediador
        """
        solicitacoes = self.repository.list_by_status(StatusSolicitacao.PENDENTE)
        itens = []

        for solicitacao in solicitacoes:
            # Se for professor, pular solicitações que não foram seladas
            if role == "professor" and not solicitacao.id_mediador:
                continue
            
            aluno = self.session.get(Aluno, solicitacao.id_aluno)
            aluno_user = self.session.get(Usuario, aluno.id) if aluno else None
            disciplina = self.session.get(Disciplina, solicitacao.id_disciplina)

            mediador_user = None
            if solicitacao.id_mediador:
                mediador_user = self.session.get(Usuario, solicitacao.id_mediador)

            professores = []
            if disciplina:
                professores_rows = self.session.exec(
                    select(Professor)
                    .join(ProfessorDisciplina, Professor.id == ProfessorDisciplina.professor_id)
                    .where(ProfessorDisciplina.disciplina_id == disciplina.id)
                ).all()

                for professor in professores_rows:
                    usuario_prof = self.session.get(Usuario, professor.id)
                    professores.append({
                        "id": professor.id,
                        "nome": usuario_prof.nome if usuario_prof else "Professor não identificado",
                        "email": usuario_prof.email if usuario_prof else "",
                    })

            itens.append({
                "id": solicitacao.id,
                "tipo_suporte": solicitacao.tipo_suporte,
                "descricao": solicitacao.descricao,
                "data_preferencial": solicitacao.data_preferencial.isoformat() if solicitacao.data_preferencial else None,
                "status": solicitacao.status.value if hasattr(solicitacao.status, "value") else solicitacao.status,
                "id_disciplina": solicitacao.id_disciplina,
                "disciplina_nome": disciplina.nome if disciplina else "Disciplina não localizada",
                "id_mediador": solicitacao.id_mediador,
                "tem_selo": bool(solicitacao.id_mediador),
                "mediador_nome": mediador_user.nome if mediador_user else None,
                "aluno": {
                    "id": aluno.id if aluno else None,
                    "nome": aluno_user.nome if aluno_user else "Aluno não identificado",
                    "email": aluno_user.email if aluno_user else "",
                    "matricula": aluno_user.matricula if aluno_user else "",
                },
                "professores": professores,
            })

        return itens

    def selar_solicitacao(self, solicitacao_id: int, id_mediador: int | str):
        """O mediador apenas CONCEDE O SELO à solicitação. NÃO cria atendimento nem finaliza a aprovação."""
        solicitacao = self.repository.get_by_id(solicitacao_id)
        if not solicitacao:
            raise HTTPException(status_code=404, detail="Solicitação não encontrada")

        from models.users.mediador import Mediador
        from models.enums import TipoMediador

        mediador_alvo = None
        if isinstance(id_mediador, int):
            mediador_alvo = self.session.get(Mediador, id_mediador)
            if not mediador_alvo:
                u = self.session.get(Usuario, id_mediador)
                if u:
                    novo = Mediador(id=u.id, tipo=TipoMediador.ACOMPANHAMENTO, apoio_descricao="Mediador institucional")
                    self.session.add(novo)
                    self.session.commit()
                    mediador_alvo = novo
        elif isinstance(id_mediador, str) and id_mediador.strip().isdigit():
            uid = int(id_mediador.strip())
            mediador_alvo = self.session.get(Mediador, uid)
            if not mediador_alvo:
                u = self.session.get(Usuario, uid)
                if u:
                    novo = Mediador(id=u.id, tipo=TipoMediador.ACOMPANHAMENTO, apoio_descricao="Mediador institucional")
                    self.session.add(novo)
                    self.session.commit()
                    mediador_alvo = novo
        elif isinstance(id_mediador, str) and id_mediador.strip():
            u = self.usuario_repository.get_by_matricula(id_mediador.strip())
            if u:
                mediador_alvo = self.session.get(Mediador, u.id)
                if not mediador_alvo:
                    novo = Mediador(id=u.id, tipo=TipoMediador.ACOMPANHAMENTO, apoio_descricao="Mediador institucional")
                    self.session.add(novo)
                    self.session.commit()
                    mediador_alvo = novo

        if not mediador_alvo:
            mediador_alvo = self.session.exec(select(Mediador)).first()

        solicitacao.id_mediador = mediador_alvo.id if mediador_alvo else None
        solicitacao = self.repository.update(solicitacao)

        usuario_m = self.session.get(Usuario, solicitacao.id_mediador) if solicitacao.id_mediador else None

        # Dispara notificações usando o serviço centralizado
        try:
            disciplina = self.session.get(Disciplina, solicitacao.id_disciplina)
            disc_nome = disciplina.nome if disciplina else "sua disciplina"
            mediador_nome = usuario_m.nome if usuario_m else "Mediador"
            
            # Notificar aluno
            self.notification_service.notificar_mediador_selou_solicitacao(
                aluno_id=solicitacao.id_aluno,
                disciplina_nome=disc_nome,
                mediador_nome=mediador_nome
            )
            
            # Notificar professores da disciplina
            if solicitacao.id_disciplina:
                prof_ids = self.session.exec(
                    select(ProfessorDisciplina.professor_id).where(
                        ProfessorDisciplina.disciplina_id == solicitacao.id_disciplina
                    )
                ).all()
                
                if prof_ids:
                    titulo = "Solicitação TAI com Selo de Mediador"
                    mensagem = f"Uma solicitação TAI em {disc_nome} recebeu selo de validação do mediador e aguarda sua aprovação."
                    self.notification_service.notificar_multiplos(prof_ids, titulo, mensagem)
                    
        except Exception as exc:
            logger.error(f"[NOTIFICAÇÕES] Erro ao disparar notificação de selo: {exc}")

        return {
            "id": solicitacao.id,
            "tem_selo": True,
            "id_mediador": solicitacao.id_mediador,
            "mediador_nome": usuario_m.nome if usuario_m else "Mediador",
            "message": "Selo do mediador concedido com sucesso! A aprovação final cabe ao professor."
        }

    def remover_selo_solicitacao(self, solicitacao_id: int):
        solicitacao = self.repository.get_by_id(solicitacao_id)
        if not solicitacao:
            raise HTTPException(status_code=404, detail="Solicitação não encontrada")
        
        solicitacao.id_mediador = None
        self.repository.update(solicitacao)
        
        # Notificar aluno que mediador recusou
        try:
            disciplina = self.session.get(Disciplina, solicitacao.id_disciplina)
            disc_nome = disciplina.nome if disciplina else "sua disciplina"
            self.notification_service.notificar_mediador_negou_solicitacao(
                aluno_id=solicitacao.id_aluno,
                disciplina_nome=disc_nome
            )
        except Exception as e:
            logger.error(f"Erro ao notificar remoção de selo: {e}")
        
        return {
            "id": solicitacao.id,
            "tem_selo": False,
            "message": "Selo do mediador removido."
        }

    def decidir_solicitacao(self, solicitacao_id: int, status: str, id_professor: int | str | None = None, id_mediador: int | None = None):
        """O professor é quem de fato aprova ou recusa a solicitação, mas APENAS se o mediador tiver aprovado primeiro."""
        solicitacao = self.repository.get_by_id(solicitacao_id)
        if not solicitacao:
            raise HTTPException(status_code=404, detail="Solicitação não encontrada")

        status_normalizado = (status or "").strip().title()
        valores_validos = {item.value for item in StatusSolicitacao}
        if status_normalizado not in valores_validos:
            raise HTTPException(status_code=400, detail="Status inválido. Use 'Aprovado' ou 'Recusado'.")

        # ⚠️ VALIDAÇÃO CRÍTICA: Professor PODE aprovar SÓ se mediador já selou
        if status_normalizado == StatusSolicitacao.APROVADO.value:
            # Verificar se mediador já aprovou (status "Selado")
            from models.enums import StatusSolicitacao as StatusSol
            
            # Se a solicitação ainda não foi selada (não tem id_mediador), rejeitar
            if not solicitacao.id_mediador:
                raise HTTPException(
                    status_code=400,
                    detail="Solicitação ainda não foi aprovada pelo mediador. Aguarde a aprovação antes de aprovar como professor."
                )

        # Validar se é feriado/recesso ao APROVAR
        if status_normalizado == StatusSolicitacao.APROVADO.value:
            data_atend = solicitacao.data_preferencial or date.today()
            data_iso = data_atend.isoformat() if hasattr(data_atend, 'isoformat') else str(data_atend)
            if is_feriado_ou_recesso(data_iso):
                from utils.calendario_academico import get_evento_do_dia
                evento = get_evento_do_dia(data_iso)
                evento_info = evento["descricao"] if evento else "Feriado ou Recesso"
                raise HTTPException(
                    status_code=400,
                    detail=f"Não é permitido confirmar atendimento em dias de feriado ou recesso. Data: {data_iso} ({evento_info})"
                )

        solicitacao.status = status_normalizado

        # Se mediador foi passado opcionalmente, atualiza
        if id_mediador is not None and not solicitacao.id_mediador:
            solicitacao.id_mediador = id_mediador

        solicitacao = self.repository.update(solicitacao)

        # Resolve ID do professor se passado (int ou matrícula)
        id_prof_resolvido = None
        if id_professor is not None:
            if isinstance(id_professor, int):
                id_prof_resolvido = id_professor
            elif isinstance(id_professor, str) and id_professor.strip().isdigit():
                id_prof_resolvido = int(id_professor.strip())
            elif isinstance(id_professor, str) and id_professor.strip():
                u = self.usuario_repository.get_by_matricula(id_professor.strip())
                if u:
                    id_prof_resolvido = u.id

        # Se não informado, tenta pegar o primeiro professor da disciplina
        if not id_prof_resolvido and solicitacao.id_disciplina:
            prof_row = self.session.exec(
                select(ProfessorDisciplina.professor_id)
                .where(ProfessorDisciplina.disciplina_id == solicitacao.id_disciplina)
            ).first()
            if prof_row:
                id_prof_resolvido = prof_row

        # Quando a solicitação for aprovada pelo professor, cria ou atualiza o Atendimento
        if status_normalizado == StatusSolicitacao.APROVADO.value:
            atendimento_existente = self.session.exec(
                select(Atendimento).where(Atendimento.id_solicitacao == solicitacao.id)
            ).first()

            disciplina = self.session.get(Disciplina, solicitacao.id_disciplina)
            nome_disciplina = disciplina.nome if disciplina else "Atendimento TAI"
            data_atend = solicitacao.data_preferencial or date.today()

            if not atendimento_existente:
                novo_atendimento = Atendimento(
                    id_solicitacao=solicitacao.id,
                    id_disciplina=solicitacao.id_disciplina,
                    id_professor=id_prof_resolvido,
                    data_atendimento=data_atend,
                    tipo_atendimento=TipoAtendimento.TAI,
                    status=StatusAtendimento.AGENDADO,
                    assunto=f"TAI - {nome_disciplina} ({solicitacao.tipo_suporte})",
                    relatorio=solicitacao.descricao
                )
                self.session.add(novo_atendimento)
                self.session.commit()
                self.session.refresh(novo_atendimento)

                assoc_existente = self.session.exec(
                    select(AlunoAtendimento).where(
                        AlunoAtendimento.aluno_id == solicitacao.id_aluno,
                        AlunoAtendimento.atendimento_id == novo_atendimento.id
                    )
                ).first()
                if not assoc_existente:
                    assoc = AlunoAtendimento(aluno_id=solicitacao.id_aluno, atendimento_id=novo_atendimento.id)
                    self.session.add(assoc)
                    self.session.commit()
            else:
                atendimento_existente.data_atendimento = data_atend
                atendimento_existente.status = StatusAtendimento.AGENDADO
                if id_prof_resolvido:
                    atendimento_existente.id_professor = id_prof_resolvido
                self.session.add(atendimento_existente)
                self.session.commit()

        disciplina = self.session.get(Disciplina, solicitacao.id_disciplina)
        disc_nome = disciplina.nome if disciplina else "Atendimento"

        # Dispara notificações usando NotificationService
        try:
            usuario_aluno = self.session.get(Usuario, solicitacao.id_aluno)
            aluno_nome = usuario_aluno.nome if usuario_aluno else "Aluno"
            
            if status_normalizado == StatusSolicitacao.APROVADO.value:
                # Notificar aluno que foi aprovado
                self.notification_service.notificar_professor_aprovou_solicitacao(
                    aluno_id=solicitacao.id_aluno,
                    aluno_nome=aluno_nome,
                    disciplina_nome=disc_nome
                )
            else:
                # Notificar aluno que foi recusado
                self.notification_service.notificar_professor_negou_solicitacao(
                    aluno_id=solicitacao.id_aluno,
                    disciplina_nome=disc_nome
                )
            
            # Notificar mediador
            if solicitacao.id_mediador:
                titulo = f"Solicitação TAI {status_normalizado}: {disc_nome}"
                mensagem = f"A solicitação do aluno {aluno_nome} para a disciplina {disc_nome} foi {status_normalizado.lower()} pelo professor."
                self.notification_service.notificar_usuario(
                    usuario_id=solicitacao.id_mediador,
                    titulo=titulo,
                    mensagem=mensagem
                )
                
        except Exception as exc:
            logger.error(f"[NOTIFICAÇÕES] Erro ao disparar notificação de decisão: {exc}")

        return {
            "id": solicitacao.id,
            "id_aluno": solicitacao.id_aluno,
            "id_disciplina": solicitacao.id_disciplina,
            "disciplina_nome": disciplina.nome if disciplina else "",
            "tipo_suporte": solicitacao.tipo_suporte,
            "descricao": solicitacao.descricao,
            "data_preferencial": solicitacao.data_preferencial.isoformat() if solicitacao.data_preferencial else None,
            "status": solicitacao.status.value if hasattr(solicitacao.status, "value") else str(solicitacao.status),
            "id_mediador": solicitacao.id_mediador,
            "tem_selo": bool(solicitacao.id_mediador),
            "message": f"Solicitação #{solicitacao.id} aprovada pelo professor com sucesso!" if status_normalizado == "Aprovado" else f"Solicitação #{solicitacao.id} recusada."
        }

    def buscar_por_id(self, solicitacao_id: int):
        solicitacao = self.repository.get_by_id(solicitacao_id)
        if not solicitacao:
            raise HTTPException(status_code=404, detail="Solicitacao não encontrada")

        disciplina = self.session.get(Disciplina, solicitacao.id_disciplina)
        return {
            "id": solicitacao.id,
            "id_aluno": solicitacao.id_aluno,
            "id_disciplina": solicitacao.id_disciplina,
            "disciplina_nome": disciplina.nome if disciplina else "",
            "tipo_suporte": solicitacao.tipo_suporte,
            "descricao": solicitacao.descricao,
            "data_preferencial": solicitacao.data_preferencial.isoformat() if solicitacao.data_preferencial else None,
            "status": solicitacao.status.value if hasattr(solicitacao.status, "value") else str(solicitacao.status),
        }

    def editar_solicitacao(self, solicitacao_id: int, dados):
        import logging
        logger = logging.getLogger(__name__)
        
        solicitacao = self.repository.get_by_id(solicitacao_id)
        if not solicitacao:
            raise HTTPException(status_code=404, detail="Solicitacao não encontrada")

        try:
            if getattr(dados, "disciplina", None):
                disc = self.repository.get_disciplina_by_nome(dados.disciplina)
                if disc:
                    solicitacao.id_disciplina = disc.id
                elif str(dados.disciplina).isdigit():
                    solicitacao.id_disciplina = int(dados.disciplina)
            elif getattr(dados, "id_disciplina", None):
                solicitacao.id_disciplina = dados.id_disciplina

            if getattr(dados, "tipo_suporte", None) is not None:
                solicitacao.tipo_suporte = dados.tipo_suporte
            if getattr(dados, "descricao", None) is not None:
                solicitacao.descricao = dados.descricao
            if getattr(dados, "data_preferencial", None) is not None:
                solicitacao.data_preferencial = dados.data_preferencial
            if getattr(dados, "status", None) is not None:
                solicitacao.status = dados.status

            atualizada = self.repository.update(solicitacao)

            # Atualiza o atendimento vinculado se houver
            atendimento = self.session.exec(
                select(Atendimento).where(Atendimento.id_solicitacao == solicitacao.id)
            ).first()
            if atendimento:
                if solicitacao.data_preferencial:
                    atendimento.data_atendimento = solicitacao.data_preferencial
                atendimento.id_disciplina = solicitacao.id_disciplina
                self.session.add(atendimento)
                self.session.commit()

            disciplina = self.session.get(Disciplina, solicitacao.id_disciplina)
            return {
                "id": atualizada.id,
                "id_aluno": atualizada.id_aluno,
                "id_disciplina": atualizada.id_disciplina,
                "disciplina_nome": disciplina.nome if disciplina else "",
                "tipo_suporte": atualizada.tipo_suporte,
                "descricao": atualizada.descricao,
                "data_preferencial": atualizada.data_preferencial.isoformat() if atualizada.data_preferencial else None,
                "status": atualizada.status.value if hasattr(atualizada.status, "value") else str(atualizada.status),
            }
        except Exception as e:
            logger.error(f"Erro ao editar solicitação {solicitacao_id}: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Erro ao atualizar solicitação: {str(e)}")

    def deletar_solicitacao(self, solicitacao_id: int):
        solicitacao = self.repository.get_by_id(solicitacao_id)
        if not solicitacao:
            raise HTTPException(status_code=404, detail="Solicitacao não encontrada")

        self.repository.delete(solicitacao)
        return {"ok": True}
