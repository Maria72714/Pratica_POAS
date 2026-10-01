from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlmodel import Session, select
from deps.deps import get_session
from models.pet import Pet
import os
import shutil
import uuid
from typing import List

router = APIRouter(prefix="/pets", tags=["pets"])


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "..", "uploads", "pets")
UPLOAD_DIR = os.path.normpath(UPLOAD_DIR)
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/")
async def create_pet(
    nome: str = Form(...),
    nome_usuario: str = Form(...),
    foto: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    if not foto.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="O arquivo deve ser uma imagem.")

    # Gera um nome único para o arquivo
    extensao = foto.filename.split(".")[-1]
    novo_nome = f"{uuid.uuid4()}.{extensao}"
    caminho_arquivo = os.path.join(UPLOAD_DIR, novo_nome)

    # Salva o arquivo localmente
    with open(caminho_arquivo, "wb") as buffer:
        shutil.copyfileobj(foto.file, buffer)

    # A URL da imagem será a rota estática para acessar o arquivo (vamos precisar expor a pasta uploads no main.py)
    imagem_url = f"/api/pets/imagem/{novo_nome}"

    # Salva no banco de dados
    novo_pet = Pet(
        nome=nome,
        nome_usuario=nome_usuario,
        imagem_url=imagem_url,
        aprovado=True # TODO: Voltar para False quando houver painel admin
    )
    
    session.add(novo_pet)
    session.commit()
    session.refresh(novo_pet)

    return {"mensagem": "Pet enviado para aprovação com sucesso!", "pet": novo_pet}

@router.get("/")
def get_pets(session: Session = Depends(get_session)):
    # Retorna apenas os pets aprovados para a página 404
    pets = session.exec(select(Pet).where(Pet.aprovado == True)).all()
    return pets
