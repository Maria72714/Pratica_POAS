from typing import Annotated

from fastapi import APIRouter
from pydantic import BaseModel

from deps.auth import AuthUser, require_roles
from deps.deps import SessionDep
from services.usuario_service import UsuarioService


router = APIRouter(
    prefix='/usuarios',
    tags=['Usuario']
)

AdminUser = Annotated[AuthUser, require_roles("admin")]


class UserResponseModel(BaseModel):
    nome_completo: str
    matricula: str
    email: str


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
def listar(session: SessionDep, current_user: AdminUser):
    usuarios = UsuarioService(session).listar_usuarios()
    return [
        {"nome": u.nome, "matricula": u.matricula, "email": u.email, "id": u.id}
        for u in usuarios
    ]


@router.post('/', response_model=UserResponseModel)
def cadastrar(
    session: SessionDep,
    current_user: AdminUser,
    nome_completo: str,
    matricula: str,
    email: str,
    senha: str,
) -> UserResponseModel:
    usuario = UsuarioService(session).cadastrar_usuario(nome_completo, matricula, email, senha)
    return UserResponseModel(
        nome_completo=usuario.nome,
        matricula=usuario.matricula,
        email=usuario.email,
    )


@router.post('/mediador/solicitar')
def solicitar_mediador(session: SessionDep, payload: SolicitarMediadorInput):
    return UsuarioService(session).solicitar_mediador(payload)


@router.delete('/{matricula}')
def deletar(session: SessionDep, matricula: str, current_user: AdminUser):
    return UsuarioService(session).deletar_usuario(matricula)


@router.put('/{matricula}')
def atualizar(session: SessionDep, nome: str, matricula: str, email: str, current_user: AdminUser):
    return UsuarioService(session).atualizar_usuario(nome, matricula, email)
