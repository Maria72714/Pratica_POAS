from fastapi import HTTPException
from pwdlib import PasswordHash

from models.users.mediador import Mediador
from models.users.user import Usuario
from repositories.usuario_repository import UsuarioRepository


def map_tipo_mediacao(tipo: str):
    from models.enums import TipoMediador

    valor = (tipo or "").strip().lower()
    opcoes = {
        "acompanhamento": TipoMediador.ACOMPANHAMENTO,
        "libras": TipoMediador.LIBRAS,
        "braile": TipoMediador.BRAILE,
        "mobilidade": TipoMediador.MOBILIDADE,
        "transtornos_especificos": TipoMediador.TRANSTORNOS_ESPECIFICOS,
        "transtornos-especificos": TipoMediador.TRANSTORNOS_ESPECIFICOS,
        "apoio": TipoMediador.OUTRO,
        "monitoria": TipoMediador.OUTRO,
        "outro": TipoMediador.OUTRO,
    }
    return opcoes.get(valor, TipoMediador.OUTRO)


class UsuarioService:
    def __init__(self, session):
        self.session = session
        self.usuario_repository = UsuarioRepository(session)
        self.senha_context = PasswordHash.recommended()

    def listar_usuarios(self):
        return self.usuario_repository.list_all()

    def cadastrar_usuario(self, nome_completo: str, matricula: str, email: str, senha: str):
        if not nome_completo or not matricula or not email or not senha:
            raise HTTPException(status_code=400, detail="Dados do usuário incompletos.")

        matricula = matricula.strip()
        email = email.strip().lower()
        senha_hash = self.senha_context.hash(senha)

        if self.usuario_repository.exists_by_matricula(matricula):
            raise HTTPException(status_code=400, detail="Usuário já cadastrado")

        usuario = Usuario(
            nome=nome_completo,
            matricula=matricula,
            email=email,
            senha=senha_hash,
        )
        return self.usuario_repository.create(usuario)

    def autenticar_local(self, payload):
        identificador = (payload.matricula or "").strip()
        senha = (payload.senha or "").strip()

        if not identificador or not senha:
            raise HTTPException(status_code=400, detail="Informe a matrícula/e-mail e a senha.")

        db_user = self.usuario_repository.get_by_matricula(identificador)
        if not db_user:
            db_user = self.usuario_repository.get_by_email(identificador)

        if not db_user:
            raise HTTPException(status_code=400, detail="Usuário não encontrado.")

        senha_valida = False
        try:
            senha_valida = self.senha_context.verify(senha, db_user.senha)
        except Exception:
            senha_valida = db_user.senha == senha

        if not senha_valida:
            raise HTTPException(status_code=400, detail="Senha incorreta.")

        from models.users.aluno import Aluno
        from deps.auth import create_access_token

        tipo_usuario = self.usuario_repository.get_tipo_usuario(db_user.id)
        if tipo_usuario == "mediador":
            mediador = self.usuario_repository.get_mediador_by_user_id(db_user.id)
            if mediador and not mediador.aprovado:
                raise HTTPException(
                    status_code=403,
                    detail="Cadastro de mediador aguardando aprovação do administrador.",
                )

        aluno = self.session.exec(
            __import__('sqlmodel').select(Aluno).where(Aluno.id == db_user.id)
        ).first()

        token = create_access_token(db_user, tipo_usuario)

        return {
            "id": db_user.id,
            "nome": db_user.nome,
            "email": db_user.email,
            "matricula": db_user.matricula,
            "tipo_usuario": tipo_usuario,
            "perfil_completo": True,
            "necessidades_especiais": aluno.necessidades_especiais if aluno else False,
            "curso": aluno.curso_id if aluno else None,
            "id_turma": aluno.turma_id if aluno else None,
            "access_token": token,
            "token_type": "bearer",
        }

    def solicitar_mediador(self, payload):
        if payload.senha != payload.confirmarSenha:
            raise HTTPException(status_code=400, detail="As senhas não conferem.")

        if len(payload.senha) < 6:
            raise HTTPException(status_code=400, detail="A senha deve ter pelo menos 6 caracteres.")

        email = payload.email.strip().lower()
        usuario = payload.usuario.strip()
        matricula = (payload.matricula or usuario or "").strip()

        if not usuario:
            raise HTTPException(status_code=400, detail="Nome de usuário é obrigatório.")

        if not matricula:
            raise HTTPException(status_code=400, detail="Informe a matrícula ou um identificador válido.")

        if self.usuario_repository.exists_by_email(email):
            raise HTTPException(status_code=400, detail="E-mail já cadastrado no sistema.")

        if self.usuario_repository.exists_by_matricula(matricula):
            raise HTTPException(status_code=400, detail="Matrícula já cadastrada no sistema.")

        usuario_novo = Usuario(
            nome=payload.nome.strip(),
            email=email,
            matricula=matricula,
            senha=self.senha_context.hash(payload.senha),
        )
        usuario_novo = self.usuario_repository.create(usuario_novo)

        mediador = Mediador(
            id=usuario_novo.id,
            tipo=map_tipo_mediacao(payload.tipoMediacao),
            apoio_descricao=(payload.descricao or "").strip() or None,
            aprovado=False,
        )
        self.session.add(mediador)
        self.session.commit()
        self.session.refresh(mediador)

        try:
            from models.associativas.usuario_notificacao import UsuarioNotificacao
            from models.notificacao import Notificacao

            notif = Notificacao(
                titulo="Perfil de Mediador Registrado",
                mensagem="Sua solicitação de cadastro como Mediador foi recebida com sucesso no pratiCA.",
                lida=False,
            )
            self.session.add(notif)
            self.session.commit()
            self.session.refresh(notif)
            self.session.add(UsuarioNotificacao(usuario_id=usuario_novo.id, notificacao_id=notif.id))
            self.session.commit()
        except Exception as exc:  # pragma: no cover
            print(f"[NOTIFICAÇÕES] Erro ao notificar novo mediador: {exc}")

        return {
            "message": "Solicitação de mediador enviada com sucesso.",
            "tipo_mediacao": mediador.tipo.value,
            "email": usuario_novo.email,
            "matricula": usuario_novo.matricula,
        }

    def deletar_usuario(self, matricula: str):
        usuario = self.usuario_repository.get_by_matricula(matricula)
        if not usuario:
            raise HTTPException(status_code=400, detail="Usuário não encontrado")

        self.usuario_repository.delete(usuario)
        return {"message": "Usuário deletado com sucesso"}

    def atualizar_usuario(self, nome: str, matricula: str, email: str):
        usuario = self.usuario_repository.get_by_matricula(matricula)
        if not usuario:
            raise HTTPException(status_code=400, detail="Usuário não encontrado")

        usuario.nome = nome
        usuario.matricula = matricula
        usuario.email = email

        return self.usuario_repository.update(usuario)
