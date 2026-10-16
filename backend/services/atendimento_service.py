from fastapi import HTTPException
from sqlmodel import select

from models.atendimento import Atendimento
from models.users.aluno import Aluno
from models.associativas.aluno_atendimento import AlunoAtendimento
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

        # notificações: adapte para notificar todos os alunos se quiser
        try:
            from models.associativas.usuario_notificacao import UsuarioNotificacao
            from models.notificacao import Notificacao
            from models.users.mediador import Mediador

            data_str = dados.data_atendimento.strftime("%d/%m/%Y")

            notif_aluno = Notificacao(
                titulo=f"Atendimento em {dados.disciplina} Registrado",
                mensagem=f"O atendimento para {data_str} foi registrado com sucesso.",
                lida=False,
            )
            self.session.add(notif_aluno)
            self.session.commit()
            self.session.refresh(notif_aluno)

            # associa notificação a cada aluno participante
            for aid in aluno_ids:
                self.session.add(UsuarioNotificacao(usuario_id=aid, notificacao_id=notif_aluno.id))

            # notificar professor (se houver)
            if professor:
                notif_prof = Notificacao(
                    titulo=f"Atendimento Agendado: {dados.disciplina}",
                    mensagem=f"Há um atendimento agendado para {data_str}.",
                    lida=False,
                )
                self.session.add(notif_prof)
                self.session.commit()
                self.session.refresh(notif_prof)
                self.session.add(UsuarioNotificacao(usuario_id=professor.id, notificacao_id=notif_prof.id))

            # notificar mediadores se tipo_suporte
            if dados.tipo_suporte:
                notif_mediador = Notificacao(
                    titulo=f"Nova Demanda TAI: {dados.tipo_suporte}",
                    mensagem=f"Demanda TAI registrada para {dados.disciplina} em {data_str}.",
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
