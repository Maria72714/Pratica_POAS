from fastapi import APIRouter
from pydantic import BaseModel

from deps.deps import SessionDep
from services.usuario_service import UsuarioService


router = APIRouter(
    prefix='/usuarios',
    tags=['Usuario']
)


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
    return UsuarioService(session).listar_usuarios()


@router.post('/', response_model=UserResponseModel)
def cadastrar(session: SessionDep, nome_completo: str, matricula: str, email: str, senha: str) -> UserResponseModel:
    usuario = UsuarioService(session).cadastrar_usuario(nome_completo, matricula, email, senha)
    return UserResponseModel(
        nome_completo=usuario.nome,
        matricula=usuario.matricula,
        email=usuario.email,
        senha=usuario.senha,
    )


@router.post('/mediador/solicitar')
def solicitar_mediador(session: SessionDep, payload: SolicitarMediadorInput):
    return UsuarioService(session).solicitar_mediador(payload)


@router.delete('/{matricula}')
def deletar(session: SessionDep, matricula: str):
    return UsuarioService(session).deletar_usuario(matricula)


@router.put('/{matricula}')
def atualizar(session: SessionDep, nome: str, matricula: str, email: str):
    return UsuarioService(session).atualizar_usuario(nome, matricula, email)
