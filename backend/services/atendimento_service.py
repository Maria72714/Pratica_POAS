from fastapi import HTTPException
from sqlmodel import select
import logging

from models.atendimento import Atendimento
from models.users.aluno import Aluno
from models.associativas.aluno_atendimento import AlunoAtendimento
from models.users.professor import Professor
from models.users.user import Usuario
from repositories.atendimento_repository import AtendimentoRepository
from repositories.usuario_repository import UsuarioRepository
from services.notification_service import NotificationService

logger = logging.getLogger(__name__)


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

        return self.repository.list_by_aluno_id(aluno.id)

    def buscar_por_id(self, atendimento_id: int):
        atendimento = self.repository.get_by_id(atendimento_id)
        if not atendimento:
            raise HTTPException(status_code=404, detail="Atendimento não encontrado")
        return atendimento

    def listar_por_professor(self, matricula: str):
        usuario = self.usuario_repository.get_by_matricula(matricula)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")

        professor = self.usuario_repository.get_professor_by_user_id(usuario.id)
        if not professor:
            raise HTTPException(status_code=404, detail="Professor não encontrado.")

        return self.repository.list_by_professor_id(professor.id)

    def criar_atendimento(self, dados):
        # coleta as matrículas: preferir 'matriculas' (lista), senão 'matricula' único
        if dados.matriculas:
            matriculas = list(dict.fromkeys(dados.matriculas))  # remove duplicatas mantendo ordem
        elif dados.matricula:
            matriculas = [dados.matricula]
        else:
            raise HTTPException(status_code=400, detail="É necessário informar ao menos uma matrícula de aluno.")

        # Resolve e valida todos os usuários/alunos antes de criar o atendimento
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

        # monta assunto (sua lógica atual)
        partes = [f"Disciplina: {dados.disciplina}"]
        if dados.tipo_suporte:
            partes.append(f"Suporte: {dados.tipo_suporte}")
        if dados.descricao:
            partes.append(f"Obs: {dados.descricao}")
        assunto = " | ".join(partes)

        # cria atendimento
        atendimento = Atendimento(
            data_atendimento=dados.data_atendimento,
            assunto=assunto[:250],
            id_professor=id_professor,
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
            
            # Notificar alunos
            self.notification_service.notificar_multiplos(
                usuario_ids=aluno_ids,
                titulo=f"Atendimento Registrado: {dados.disciplina}",
                mensagem=f"Seu atendimento em {dados.disciplina} foi agendado para {data_str}."
            )
            
            # Notificar professor
            if professor:
                self.notification_service.notificar_usuario(
                    usuario_id=professor.id,
                    titulo=f"Atendimento Agendado: {dados.disciplina}",
                    mensagem=f"Um atendimento foi agendado em {dados.disciplina} para {data_str}."
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
                        mensagem=f"Demanda TAI registrada para {dados.disciplina} em {data_str}."
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

    def editar_atendimento(self, atendimento_id: int, dados: Atendimento):
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
                logger.info(f"Tentando cancelar. Status atual: {status_atual}")
                if status_atual not in (StatusAtendimento.AGENDADO, StatusAtendimento.CONFIRMADO):
                    logger.error(f"Não pode cancelar. Status atual: {status_atual}")
                    raise HTTPException(
                        status_code=400,
                        detail=f"Não é possível cancelar atendimento com status {status_atual.value if hasattr(status_atual, 'value') else status_atual}."
                    )
        
        for campo, valor in dados_update.items():
            setattr(atendimento, campo, valor)

        resultado = self.repository.update(atendimento)
        
        # Notificar sobre cancelamento se aplicável
        try:
            if 'status' in dados_update and dados_update['status'] == 'Cancelado':
                # Buscar alunos associados
                aluno_atendimentos = self.session.exec(
                    select(AlunoAtendimento).where(AlunoAtendimento.atendimento_id == atendimento_id)
                ).all()
                aluno_ids = [aa.aluno_id for aa in aluno_atendimentos]
                
                disciplina_nome = getattr(atendimento, 'assunto', 'Atendimento').split('|')[0].replace('Disciplina:', '').strip()
                professor_id = getattr(atendimento, 'id_professor', None)
                
                self.notification_service.notificar_atendimento_cancelado(
                    aluno_ids=aluno_ids,
                    professor_id=professor_id,
                    disciplina_nome=disciplina_nome
                )
        except Exception as e:
            logger.error(f"Erro ao notificar cancelamento: {e}")
        
        logger.info(f"Atendimento {atendimento_id} atualizado: {resultado}")
        return resultado
