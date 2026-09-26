from fastapi import APIRouter, HTTPException
from models.users.user import Usuario
from models.users.mediador import Mediador
from models.enums import TipoMediador
from pwdlib import PasswordHash
from deps.deps import SessionDep
from sqlmodel import select
from pydantic import BaseModel


def map_tipo_mediacao(tipo: str) -> TipoMediador:
    valor = (tipo or '').strip().lower()
    opcoes = {
        'acompanhamento': TipoMediador.ACOMPANHAMENTO,
        'libras': TipoMediador.LIBRAS,
        'braile': TipoMediador.BRAILE,
        'mobilidade': TipoMediador.MOBILIDADE,
        'transtornos_especificos': TipoMediador.TRANSTORNOS_ESPECIFICOS,
        'transtornos-especificos': TipoMediador.TRANSTORNOS_ESPECIFICOS,
        'apoio': TipoMediador.OUTRO,
        'monitoria': TipoMediador.OUTRO,
        'outro': TipoMediador.OUTRO,
    }
    return opcoes.get(valor, TipoMediador.OUTRO)

router = APIRouter(
    prefix='/usuarios',
    tags=['Usuario']
)

senha_context = PasswordHash.recommended()

class UserResponseModel(BaseModel):
    nome_completo: str
    matricula: str
    email: str
    senha: str


class SolicitarMediadorInput(BaseModel):
    nome: str
    email: str
    usuario: str
    matricula: str | None = None
    senha: str
    confirmarSenha: str
    tipoMediacao: str
    descricao: str | None = None

@router.get('/')
def listar(session: SessionDep):
    usuarios  = session.exec(select(Usuario)).all()
    return usuarios

@router.post('/', response_model=UserResponseModel)
def cadastrar(session:SessionDep, nome_completo:str, matricula:str, email:str, senha:str) -> UserResponseModel:
    senha_hash = senha_context.hash(senha)
    usuario_existente = session.exec(select(Usuario).where(Usuario.matricula == matricula)).first()
    if usuario_existente:
        raise HTTPException(
            status_code=400,
            detail="Usuário já cadastrado"
        )
    
    usuario = Usuario(nome=nome_completo, matricula=matricula, email=email, senha=senha_hash)
    session.add(usuario)
    session.commit()
    session.refresh(usuario)

    return UserResponseModel(
        nome_completo=usuario.nome,
        matricula=usuario.matricula,
        email=usuario.email,
        senha=usuario.senha,
    )

@router.post('/mediador/solicitar')
def solicitar_mediador(session: SessionDep, payload: SolicitarMediadorInput):
    if payload.senha != payload.confirmarSenha:
        raise HTTPException(status_code=400, detail='As senhas não conferem.')

    if len(payload.senha) < 6:
        raise HTTPException(status_code=400, detail='A senha deve ter pelo menos 6 caracteres.')

    email = payload.email.strip().lower()
    usuario = payload.usuario.strip()
    matricula = (payload.matricula or usuario or '').strip()

    if not usuario:
        raise HTTPException(status_code=400, detail='Nome de usuário é obrigatório.')

    if not matricula:
        raise HTTPException(status_code=400, detail='Informe a matrícula ou um identificador válido.')

    if session.exec(select(Usuario).where(Usuario.email == email)).first():
        raise HTTPException(status_code=400, detail='E-mail já cadastrado no sistema.')

    if session.exec(select(Usuario).where(Usuario.matricula == matricula)).first():
        raise HTTPException(status_code=400, detail='Matrícula já cadastrada no sistema.')

    usuario_novo = Usuario(
        nome=payload.nome.strip(),
        email=email,
        matricula=matricula,
        senha=senha_context.hash(payload.senha),
    )
    session.add(usuario_novo)
    session.commit()
    session.refresh(usuario_novo)

    mediador = Mediador(
        id=usuario_novo.id,
        tipo=map_tipo_mediacao(payload.tipoMediacao),
        apoio_descricao=(payload.descricao or '').strip() or None,
    )
    session.add(mediador)
    session.commit()
    session.refresh(mediador)

    # Notificação automática para o novo Mediador no Neon DB
    try:
        from models.notificacao import Notificacao
        from models.associativas.usuario_notificacao import UsuarioNotificacao
        notif = Notificacao(
            titulo="Perfil de Mediador Registrado",
            mensagem="Sua solicitação de cadastro como Mediador foi recebida com sucesso no pratiCA.",
            lida=False,
        )
        session.add(notif)
        session.commit()
        session.refresh(notif)
        session.add(UsuarioNotificacao(usuario_id=usuario_novo.id, notificacao_id=notif.id))
        session.commit()
    except Exception as e:
        print(f"[NOTIFICAÇÕES] Erro ao notificar novo mediador: {e}")

    return {
        'message': 'Solicitação de mediador enviada com sucesso.',
        'tipo_mediacao': mediador.tipo.value,
        'email': usuario_novo.email,
        'matricula': usuario_novo.matricula,
    }


@router.delete('/{matricula}')
def deletar(session:SessionDep, matricula:str):
    userDelet = session.exec(select(Usuario).where(Usuario.matricula == matricula)).first()
    if not userDelet:
        raise HTTPException(
            status_code=400,
            detail="Usuário não encontrado"
        )
    
    session.delete(userDelet)
    session.commit()
    return {"message": "Usuário deletado com sucesso"}

@router.put('/{matricula}')
def atualizar(session:SessionDep, nome:str, matricula:str, email:str) -> Usuario:
    
    userUpdate = session.exec(select(Usuario).where(Usuario.matricula == matricula)).first()

    if not userUpdate:
            raise HTTPException(
                status_code=400,
                detail="Usuário não encontrado"
            )

    userUpdate.nome = nome
    userUpdate.matricula = matricula
    userUpdate.email = email

    session.add(userUpdate)
    session.commit()
    session.refresh(userUpdate)
    return userUpdate

    