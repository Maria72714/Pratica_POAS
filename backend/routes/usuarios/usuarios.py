from fastapi import APIRouter, HTTPException
from models.users.user import Usuario
from pwdlib import PasswordHash
from deps.deps import SessionDep
from sqlmodel import select
from pydantic import BaseModel

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

    