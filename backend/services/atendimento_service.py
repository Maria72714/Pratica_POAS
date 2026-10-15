from fastapi import HTTPException
from sqlmodel import select

from models.atendimento import Atendimento
from models.users.professor import Professor
from models.users.user import Usuario
from repositories.atendimento_repository import AtendimentoRepository
from repositories.usuario_repository import UsuarioRepository


class AtendimentoService:
    def __init__(self, session):
        self.session = session
        self.repository = AtendimentoRepository(session)
        self.usuario_repository = UsuarioRepository(session)

    def listar_atendimentos(self):
        return self.repository.list_all()

    def listar_por_matricula(self, matricula: str):
        usuario = self.usuario_repository.get_by_matricula(matricula)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")

        return self.repository.get_by_matricula(matricula)

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
        usuario = self.usuario_repository.get_by_matricula(dados.matricula)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")

        professor = self.usuario_repository.get_professor_by_user_id(usuario.id)
        if not professor:
            raise HTTPException(status_code=404, detail="Professor não encontrado.")

        partes = [f"Disciplina: {dados.disciplina}"]
        if dados.tipo_suporte:
            partes.append(f"Suporte: {dados.tipo_suporte}")
        if dados.descricao:
            partes.append(f"Obs: {dados.descricao}")
        assunto = " | ".join(partes)

        atendimento = Atendimento(
            data_atendimento=dados.data_atendimento,
            assunto=assunto[:250],
            id_professor=professor.id,
        )
        atendimento = self.repository.create(atendimento)

        try:
            from models.associativas.usuario_notificacao import UsuarioNotificacao
            from models.notificacao import Notificacao
            from models.users.mediador import Mediador

            data_str = dados.data_atendimento.strftime("%d/%m/%Y")

            notif_aluno = Notificacao(
                titulo=f"Atendimento em {dados.disciplina} Solicitado",
                mensagem=f"Sua solicitação de atendimento para {data_str} foi registrada com sucesso.",
                lida=False,
            )
            self.session.add(notif_aluno)
            self.session.commit()
            self.session.refresh(notif_aluno)
            self.session.add(UsuarioNotificacao(usuario_id=usuario.id, notificacao_id=notif_aluno.id))

            notif_docente = Notificacao(
                titulo=f"Novo Agendamento: {dados.disciplina}",
                mensagem=f"O aluno {usuario.nome} solicitou atendimento de CA em {dados.disciplina} para {data_str}.",
                lida=False,
            )
            self.session.add(notif_docente)
            self.session.commit()
            self.session.refresh(notif_docente)

            professores = self.session.exec(select(Professor)).all()
            for professor_atual in professores:
                self.session.add(UsuarioNotificacao(usuario_id=professor_atual.id, notificacao_id=notif_docente.id))

            if dados.tipo_suporte:
                notif_mediador = Notificacao(
                    titulo=f"Nova Demanda TAI: {dados.tipo_suporte}",
                    mensagem=f"O aluno {usuario.nome} solicitou suporte inclusivo ({dados.tipo_suporte}) para o atendimento de {dados.disciplina}.",
                    lida=False,
                )
                self.session.add(notif_mediador)
                self.session.commit()
                self.session.refresh(notif_mediador)
                mediadores = self.session.exec(select(Mediador)).all()
                for mediador in mediadores:
                    self.session.add(UsuarioNotificacao(usuario_id=mediador.id, notificacao_id=notif_mediador.id))

            self.session.commit()
        except Exception as exc:  # pragma: no cover
            print(f"[NOTIFICAÇÕES] Erro ao disparar notificação automática: {exc}")

        return atendimento

    def deletar_atendimento(self, atendimento_id: int):
        atendimento = self.repository.get_by_id(atendimento_id)
        if not atendimento:
            raise HTTPException(status_code=404, detail="Atendimento não encontrado")

        self.repository.delete(atendimento)
        return {"ok": True}

    def editar_atendimento(self, atendimento_id: int, dados: Atendimento):
        atendimento = self.repository.get_by_id(atendimento_id)
        if not atendimento:
            raise HTTPException(status_code=404, detail="Atendimento não encontrado")

        dados_update = dados.model_dump(exclude_unset=True)
        for campo, valor in dados_update.items():
            setattr(atendimento, campo, valor)

        return self.repository.update(atendimento)
