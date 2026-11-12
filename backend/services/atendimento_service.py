from fastapi import HTTPException
from sqlmodel import select
import logging
from datetime import date, datetime, timedelta, timezone

from models.atendimento import Atendimento
from models.users.aluno import Aluno
from models.associativas.aluno_atendimento import AlunoAtendimento
from models.users.professor import Professor
from models.users.user import Usuario
from models.disciplina import Disciplina
from models.sala import Sala
from models.horario import Horario
from models.enums import TipoAtendimento, ModalidadeAula
from repositories.atendimento_repository import AtendimentoRepository
from repositories.usuario_repository import UsuarioRepository
from services.notification_service import NotificationService

logger = logging.getLogger(__name__)

# O servidor pode rodar em UTC; a referência de "hoje" é sempre a do Brasil.
_FUSO_BRASIL = timezone(timedelta(hours=-3))


def _hoje_brasil() -> date:
    return datetime.now(_FUSO_BRASIL).date()


class AtendimentoService:
    def __init__(self, session):
        self.session = session
        self.repository = AtendimentoRepository(session)
        self.usuario_repository = UsuarioRepository(session)
        self.notification_service = NotificationService(session)

    def listar_atendimentos(self):
        return self.repository.list_all()

    def listar_por_matricula(self, matricula: str):
        usuario = self.usuario_repository.get_by_matricula(matricula)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")

        # garante que o usuário tem perfil de aluno (a tabela 'alunos' usa id == usuarios.id)
        aluno = self.session.exec(select(Aluno).where(Aluno.id == usuario.id)).first()
        if not aluno:
            # se preferir, podemos retornar [] em vez de 404
            raise HTTPException(status_code=404, detail="Perfil de aluno não encontrado.")

        vinculados = self.repository.list_by_aluno_id(aluno.id)
        # TAL abertos pelo professor para as disciplinas do aluno (sem aluno vinculado)
        abertos = self.repository.list_tal_abertos_por_aluno(aluno.id)

        vistos: set[int] = set()
        atendimentos: list[tuple[Atendimento, bool]] = []
        for atendimento in vinculados:
            if atendimento.id in vistos:
                continue
            vistos.add(atendimento.id)
            atendimentos.append((atendimento, False))
        for atendimento in abertos:
            if atendimento.id in vistos:
                continue
            vistos.add(atendimento.id)
            atendimentos.append((atendimento, True))

        # Carrega disciplinas e professores em lote (evita N+1 por atendimento).
        disc_ids = {a.id_disciplina for a, _ in atendimentos if a.id_disciplina}
        prof_ids = {a.id_professor for a, _ in atendimentos if a.id_professor}
        disc_map = {
            d.id: d
            for d in self.session.exec(select(Disciplina).where(Disciplina.id.in_(disc_ids))).all()
        } if disc_ids else {}
        prof_map = {
            u.id: u
            for u in self.session.exec(select(Usuario).where(Usuario.id.in_(prof_ids))).all()
        } if prof_ids else {}

        # Sala e horário do atendimento (carregados em lote).
        sala_ids = {a.id_sala for a, _ in atendimentos if a.id_sala}
        horario_ids = {a.id_horario for a, _ in atendimentos if a.id_horario}
        sala_map = {
            s.id: s
            for s in self.session.exec(select(Sala).where(Sala.id.in_(sala_ids))).all()
        } if sala_ids else {}
        horario_map = {
            h.id: h
            for h in self.session.exec(select(Horario).where(Horario.id.in_(horario_ids))).all()
        } if horario_ids else {}

        # Contagem de alunos por atendimento (para exibir "N alunos" no card).
        contagem_map: dict[int, int] = {}
        at_ids = {a.id for a, _ in atendimentos}
        if at_ids:
            for aa in self.session.exec(
                select(AlunoAtendimento).where(AlunoAtendimento.atendimento_id.in_(at_ids))
            ).all():
                contagem_map[aa.atendimento_id] = contagem_map.get(aa.atendimento_id, 0) + 1

        return [
            self._serializar_para_aluno(
                atendimento,
                aberto=aberto,
                disc_map=disc_map,
                prof_map=prof_map,
                sala_map=sala_map,
                horario_map=horario_map,
                total_alunos=contagem_map.get(atendimento.id, 0),
            )
            for atendimento, aberto in atendimentos
        ]

    def _serializar_para_aluno(
        self,
        atendimento: Atendimento,
        aberto: bool = False,
        disc_map: dict | None = None,
        prof_map: dict | None = None,
        sala_map: dict | None = None,
        horario_map: dict | None = None,
        total_alunos: int = 0,
    ) -> dict:
        """Formata o atendimento para o aluno, incluindo professor e disciplina.

        ``aberto`` indica um CA/TAL aberto pelo professor para a turma: o aluno
        pode adicionar ao calendário e usar o chat, mas não cancelar.
        """
        if disc_map is not None:
            disciplina = disc_map.get(atendimento.id_disciplina) if atendimento.id_disciplina else None
        else:
            disciplina = (
                self.session.get(Disciplina, atendimento.id_disciplina)
                if atendimento.id_disciplina
                else None
            )

        professor_nome = None
        if atendimento.id_professor:
            u_prof = prof_map.get(atendimento.id_professor) if prof_map is not None else self.session.get(Usuario, atendimento.id_professor)
            professor_nome = u_prof.nome if u_prof else None

        sala = None
        if atendimento.id_sala:
            sala = sala_map.get(atendimento.id_sala) if sala_map is not None else self.session.get(Sala, atendimento.id_sala)

        horario = None
        if atendimento.id_horario:
            horario = horario_map.get(atendimento.id_horario) if horario_map is not None else self.session.get(Horario, atendimento.id_horario)

        return {
            "id": atendimento.id,
            "assunto": atendimento.assunto,
            "relatorio": atendimento.relatorio,
            "tipo_atendimento": atendimento.tipo_atendimento.value
            if hasattr(atendimento.tipo_atendimento, "value")
            else str(atendimento.tipo_atendimento),
            "modalidade": atendimento.modalidade.value
            if hasattr(atendimento.modalidade, "value")
            else str(atendimento.modalidade),
            "status": atendimento.status.value
            if hasattr(atendimento.status, "value")
            else str(atendimento.status),
            "data_atendimento": atendimento.data_atendimento.isoformat()
            if atendimento.data_atendimento
            else None,
            "link_ca_online": atendimento.link_ca_online,
            "disciplina_nome": disciplina.nome if disciplina else None,
            "professor_nome": professor_nome,
            "sala_nome": sala.nome if sala else None,
            "horario_inicio": horario.horario_inicio.isoformat()
            if horario and horario.horario_inicio
            else None,
            "horario_termino": horario.horario_termino.isoformat()
            if horario and horario.horario_termino
            else None,
            "total_alunos": total_alunos,
            "aberto": aberto,
            "pode_cancelar": not aberto,
        }

    def buscar_por_id(self, atendimento_id: int):
        atendimento = self.repository.get_by_id(atendimento_id)
        if not atendimento:
            raise HTTPException(status_code=404, detail="Atendimento não encontrado")
        return atendimento

    def _resolver_sala(self, nome: str | None) -> int | None:
        """Resolve o id de uma sala pelo nome, criando-a se ainda não existir."""
        if not nome or not str(nome).strip():
            return None
        nome = str(nome).strip()[:100]
        sala = self.session.exec(select(Sala).where(Sala.nome == nome)).first()
        if not sala:
            sala = Sala(nome=nome)
            self.session.add(sala)
            self.session.commit()
            self.session.refresh(sala)
        return sala.id

    def _resolver_horario(self, inicio, termino) -> int | None:
        """Resolve o id de um horário (início/término), criando-o se não existir."""
        if inicio is None and termino is None:
            return None
        if inicio is None or termino is None:
            raise HTTPException(
                status_code=400,
                detail="Informe o horário de início e de término.",
            )
        horario = self.session.exec(
            select(Horario)
            .where(Horario.horario_inicio == inicio)
            .where(Horario.horario_termino == termino)
        ).first()
        if not horario:
            horario = Horario(horario_inicio=inicio, horario_termino=termino)
            self.session.add(horario)
            self.session.commit()
            self.session.refresh(horario)
        return horario.id

    def criar_atendimento(self, dados):
        # coleta as matrículas (opcional): preferir 'matriculas' (lista), senão 'matricula' único
        if dados.matriculas:
            matriculas = list(dict.fromkeys(dados.matriculas))  # remove duplicatas mantendo ordem
        elif dados.matricula:
            matriculas = [dados.matricula]
        else:
            # Atendimentos CA/TAL são abertos: a matrícula do aluno é opcional
            matriculas = []

        # Resolve e valida os alunos informados (quando houver)
        aluno_ids = []
        for mat in matriculas:
            usuario = self.usuario_repository.get_by_matricula(mat)
            if not usuario:
                raise HTTPException(status_code=404, detail=f"Usuário com matrícula {mat} não encontrado.")
            aluno = self.session.exec(select(Aluno).where(Aluno.id == usuario.id)).first()
            if not aluno:
                raise HTTPException(status_code=404, detail=f"Perfil de aluno não encontrado para matrícula {mat}.")
            aluno_ids.append(aluno.id)

        # (Opcional) resolve professor se fornecido
        id_professor = None
        professor = None
        if getattr(dados, "professor_matricula", None):
            usuario_prof = self.usuario_repository.get_by_matricula(dados.professor_matricula)
            if not usuario_prof:
                raise HTTPException(status_code=404, detail="Professor (usuário) não encontrado.")
            professor = self.usuario_repository.get_professor_by_user_id(usuario_prof.id)
            if not professor:
                raise HTTPException(status_code=404, detail="Perfil de professor não encontrado.")
            id_professor = professor.id

        # Resolve a disciplina pelo nome (para exibir no histórico/relatórios).
        # Se ainda não existir no catálogo local, registra on-demand — sem isso o
        # CA/TAL ficaria sem id_disciplina e não apareceria para nenhum aluno.
        id_disciplina = None
        if dados.disciplina and dados.disciplina.strip():
            nome_disciplina = dados.disciplina.strip()
            db_disc = self.session.exec(
                select(Disciplina).where(Disciplina.nome == nome_disciplina)
            ).first()
            if not db_disc:
                db_disc = Disciplina(nome=nome_disciplina)
                self.session.add(db_disc)
                self.session.commit()
                self.session.refresh(db_disc)
            id_disciplina = db_disc.id

        # Monta o assunto: usa o informado pelo professor ou compõe a partir dos campos
        if getattr(dados, "assunto", None) and dados.assunto.strip():
            assunto = dados.assunto.strip()
        else:
            partes = [f"Disciplina: {dados.disciplina}"]
            if dados.tipo_suporte:
                partes.append(f"Suporte: {dados.tipo_suporte}")
            if dados.descricao:
                partes.append(f"Obs: {dados.descricao}")
            assunto = " | ".join(partes)

        # Tipo e modalidade (aceita os valores enviados pelo frontend)
        tipo_atendimento = TipoAtendimento.TAI
        if getattr(dados, "tipo_atendimento", None):
            try:
                tipo_atendimento = TipoAtendimento(dados.tipo_atendimento)
            except ValueError:
                pass

        modalidade = ModalidadeAula.PRESENCIAL
        if getattr(dados, "modalidade", None):
            try:
                modalidade = ModalidadeAula(dados.modalidade)
            except ValueError:
                pass

        # Sala e horário informados pelo professor (opcionais): resolvidos/
        # criados no catálogo para permitir exibi-los no CA.
        id_sala = self._resolver_sala(getattr(dados, "sala", None))
        id_horario = self._resolver_horario(
            getattr(dados, "horario_inicio", None),
            getattr(dados, "horario_termino", None),
        )

        # cria atendimento
        atendimento = Atendimento(
            data_atendimento=dados.data_atendimento,
            assunto=assunto[:250],
            id_professor=id_professor,
            id_disciplina=id_disciplina,
            id_sala=id_sala,
            id_horario=id_horario,
            tipo_atendimento=tipo_atendimento,
            modalidade=modalidade,
            link_ca_online=(dados.link_ca_online.strip()[:500] if getattr(dados, "link_ca_online", None) else None),
        )
        atendimento = self.repository.create(atendimento)

        # cria associações para todos os alunos participantes
        for aid in aluno_ids:
            assoc = AlunoAtendimento(aluno_id=aid, atendimento_id=atendimento.id)
            self.session.add(assoc)
        self.session.commit()

        # notificações usando NotificationService
        try:
            data_str = dados.data_atendimento.strftime("%d/%m/%Y")
            link_ca = f"/ca/{atendimento.id}"
            
            # Notificar alunos
            if aluno_ids:
                self.notification_service.notificar_multiplos(
                    usuario_ids=aluno_ids,
                    titulo=f"Atendimento Registrado: {dados.disciplina}",
                    mensagem=f"Seu atendimento em {dados.disciplina} foi agendado para {data_str}.",
                    link_destino=link_ca,
                )
            
            # Notificar professor
            if professor:
                self.notification_service.notificar_usuario(
                    usuario_id=professor.id,
                    titulo=f"Atendimento Agendado: {dados.disciplina}",
                    mensagem=f"Um atendimento foi agendado em {dados.disciplina} para {data_str}.",
                    link_destino=link_ca,
                )
            
            # Notificar mediadores se TAI
            if dados.tipo_suporte:
                from models.users.mediador import Mediador
                mediadores = self.session.exec(select(Mediador)).all()
                mediador_ids = [m.id for m in mediadores]
                if mediador_ids:
                    self.notification_service.notificar_multiplos(
                        usuario_ids=mediador_ids,
                        titulo=f"Nova Demanda TAI: {dados.tipo_suporte}",
                        mensagem=f"Demanda TAI registrada para {dados.disciplina} em {data_str}.",
                        link_destino=link_ca,
                    )
                    
        except Exception as exc:
            logger.error(f"[NOTIFICAÇÕES] Erro ao disparar notificação automática: {exc}")

        return atendimento

    def deletar_atendimento(self, atendimento_id: int):
        atendimento = self.repository.get_by_id(atendimento_id)
        if not atendimento:
            raise HTTPException(status_code=404, detail="Atendimento não encontrado")

        self.repository.delete(atendimento)
        return {"ok": True}

    def _tal_aberto(self, atendimento: Atendimento) -> bool:
        """True quando é um CA/TAL aberto pelo professor (sem aluno vinculado)."""
        if atendimento.tipo_atendimento != TipoAtendimento.TAL:
            return False
        vinculo = self.session.exec(
            select(AlunoAtendimento).where(AlunoAtendimento.atendimento_id == atendimento.id)
        ).first()
        return vinculo is None

    def _pode_concluir(self, atendimento: Atendimento, current_user) -> bool:
        """Admin e mediador concluem qualquer CA; professor apenas os seus."""
        role = getattr(current_user, "role", None)
        if role in ("admin", "mediador"):
            return True
        if role == "professor":
            return getattr(atendimento, "id_professor", None) == getattr(current_user, "id", None)
        return False

    def _data_futura(self, atendimento: Atendimento) -> bool:
        """True quando o encontro do CA ainda não aconteceu."""
        data = getattr(atendimento, "data_atendimento", None)
        if data is None:
            return False
        if isinstance(data, datetime):
            data = data.date()
        return data > _hoje_brasil()

    def editar_atendimento(self, atendimento_id: int, dados: Atendimento, current_user=None):
        import logging
        from models.enums import StatusAtendimento
        
        logger = logging.getLogger(__name__)
        
        atendimento = self.repository.get_by_id(atendimento_id)
        if not atendimento:
            logger.error(f"Atendimento {atendimento_id} não encontrado")
            raise HTTPException(status_code=404, detail="Atendimento não encontrado")

        dados_update = dados.model_dump(exclude_unset=True)
        logger.info(f"Editando atendimento {atendimento_id} com dados: {dados_update}")
        
        # Validar cancelamento
        if 'status' in dados_update:
            novo_status = dados_update['status']
            logger.info(f"Novo status: {novo_status}, tipo: {type(novo_status)}")
            
            try:
                status_enum = StatusAtendimento(novo_status) if isinstance(novo_status, str) else novo_status
                logger.info(f"Status enum: {status_enum}")
            except ValueError as e:
                logger.error(f"Status inválido: {novo_status}. Erro: {e}")
                raise HTTPException(status_code=400, detail=f"Status inválido: {novo_status}")
            
            if status_enum == StatusAtendimento.CANCELADO:
                status_atual = atendimento.status
                status_valor = status_atual.value if hasattr(status_atual, "value") else str(status_atual)
                logger.info(f"Tentando cancelar. Status atual: {status_valor}")
                if status_valor not in (StatusAtendimento.AGENDADO.value, "Confirmado"):
                    logger.error(f"Não pode cancelar. Status atual: {status_valor}")
                    raise HTTPException(
                        status_code=400,
                        detail=f"Não é possível cancelar atendimento com status {status_valor}."
                    )

                # CA/TAL aberto pelo professor para a turma não pode ser
                # cancelado pelo aluno.
                if getattr(current_user, "role", None) == "aluno" and self._tal_aberto(atendimento):
                    raise HTTPException(
                        status_code=403,
                        detail="Este CA/TAL é aberto para a turma e não pode ser cancelado pelo aluno.",
                    )

            if status_enum == StatusAtendimento.CONCLUIDO:
                status_atual = atendimento.status
                status_valor = status_atual.value if hasattr(status_atual, "value") else str(status_atual)
                logger.info(f"Tentando concluir. Status atual: {status_valor}")
                if status_valor not in (StatusAtendimento.AGENDADO.value, "Confirmado"):
                    raise HTTPException(
                        status_code=400,
                        detail=f"Não é possível concluir atendimento com status {status_valor}."
                    )
                if not self._pode_concluir(atendimento, current_user):
                    raise HTTPException(
                        status_code=403,
                        detail="Apenas o professor responsável, o mediador ou o admin podem concluir este CA."
                    )
                if self._data_futura(atendimento):
                    raise HTTPException(
                        status_code=400,
                        detail="Não é possível concluir um CA cuja data ainda não chegou."
                    )

        # Sala e horário vêm como texto/hora e precisam ser resolvidos para os
        # respectivos ids antes de aplicar no atendimento.
        sala_nome = dados_update.pop("sala", None)
        hora_inicio = dados_update.pop("horario_inicio", None)
        hora_termino = dados_update.pop("horario_termino", None)

        for campo, valor in dados_update.items():
            setattr(atendimento, campo, valor)

        if sala_nome is not None:
            atendimento.id_sala = self._resolver_sala(sala_nome)
        if hora_inicio is not None or hora_termino is not None:
            atendimento.id_horario = self._resolver_horario(hora_inicio, hora_termino)

        resultado = self.repository.update(atendimento)
        
        # Notificações conforme a mudança de status
        try:
            novo_status_valor = None
            if 'status' in dados_update:
                novo_status_valor = (
                    dados_update['status'].value
                    if hasattr(dados_update['status'], 'value')
                    else str(dados_update['status'])
                )

            if novo_status_valor in ('Cancelado', 'Concluído'):
                # Buscar alunos associados
                aluno_atendimentos = self.session.exec(
                    select(AlunoAtendimento).where(AlunoAtendimento.atendimento_id == atendimento_id)
                ).all()
                aluno_ids = [aa.aluno_id for aa in aluno_atendimentos]
                
                disciplina_nome = getattr(atendimento, 'assunto', 'Atendimento').split('|')[0].replace('Disciplina:', '').strip()
                professor_id = getattr(atendimento, 'id_professor', None)
                
                if novo_status_valor == 'Cancelado':
                    self.notification_service.notificar_atendimento_cancelado(
                        aluno_ids=aluno_ids,
                        professor_id=professor_id,
                        disciplina_nome=disciplina_nome,
                        atendimento_id=atendimento_id,
                    )
                else:
                    self.notification_service.notificar_atendimento_concluido(
                        aluno_ids=aluno_ids,
                        disciplina_nome=disciplina_nome,
                        atendimento_id=atendimento_id,
                    )
        except Exception as e:
            logger.error(f"Erro ao notificar mudança de status: {e}")
        
        logger.info(f"Atendimento {atendimento_id} atualizado: {resultado}")
        return resultado
