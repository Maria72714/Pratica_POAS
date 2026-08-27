from fastapi import APIRouter
from models.users.user import Usuario
from pwdlib import PasswordHash
from deps.deps import SessionDep
from sqlmodel import select

router = APIRouter(
    prefix='/usuarios',
    tags=['Usuario']
)

senha_context = PasswordHash.recommended()

@router.get('/')
def listar(session: SessionDep) -> list[Usuario]:
    usuarios  = session.exec(select(Usuario).all)
    return usuarios

@router.post('/')
def cadastrar(session:SessionDep, new_user:Usuario, nome:str, matricula:str, email:str, senha:str) -> Usuario:
    senha_hash = senha_context.hash(senha)
    new_user = Usuario(nome=nome, matricula=matricula, email=email, senha=senha_hash)
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user

@router.delete('/{matricula}')
def deletar(session:SessionDep, matricula:str):
    userDelet = session.get(Usuario, matricula)
    session.delete(userDelet)
    session.commit(userDelet)

@router.put('/')
def atualizar(session:SessionDep, nome:str, matricula:str, email:str) -> Usuario:
    userUpdate = session.get(Usuario, matricula)
    userUpdate.nome = nome
    userUpdate.matricula = matricula
    userUpdate.email = email

    session.add(userUpdate)
    session.commit()
    session.refresh(userUpdate)
    return userUpdate

    