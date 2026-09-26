from fastapi import APIRouter, HTTPException
from sqlmodel import select
from pydantic import BaseModel
from typing import List, Optional
from datetime import date

from deps.deps import SessionDep
from models.users.user import Usuario
from models.users.professor import Professor
from models.disciplina import Disciplina
from models.turma import Turma
from models.associativas.professor_disciplina import ProfessorDisciplina
from models.associativas.professor_turma import ProfessorTurma
from data.cursos import CURSOS, get_curso
from data.turmas import get_turmas, get_turma

router = APIRouter(
    prefix="/professores",
    tags=["Professores"]
)


class VinculoTurmaInput(BaseModel):
    """Vínculo de uma turma com as disciplinas que o professor ministra nela."""
    turma_id: str
    disciplinas: List[str]


class ComplementarPerfilProfessorInput(BaseModel):
    """Novo formato: vínculos turma→disciplinas. Compatibilidade: campos legados opcionais."""
    vinculos: List[VinculoTurmaInput]
    # Legado (ignorado se vinculos estiver presente)
    disciplinas: Optional[List[str]] = None
    turmas: Optional[List[str]] = None
    departamento: Optional[str] = None
    biografia: Optional[str] = None


@router.get("/dados-complementares")
def obter_dados_complementares():
    """
    Retorna catálogo completo de cursos, disciplinas e turmas para
    o formulário de complemento de perfil do professor.
    """
    # Extrai todas as disciplinas únicas do catálogo de cursos
    disciplinas_set = set()
    cursos_resumidos = []

    for curso in CURSOS:
        curso_disciplinas = set()
        for ano in curso.get("anos", []):
            for d in ano.get("disciplinas", []):
                disciplinas_set.add(d)
                curso_disciplinas.add(d)
        cursos_resumidos.append({
            "id": curso["id"],
            "nome": curso["nome"],
            "disciplinas": sorted(list(curso_disciplinas))
        })

    turmas = get_turmas()

    return {
        "cursos": cursos_resumidos,
        "todas_disciplinas": sorted(list(disciplinas_set)),
        "turmas": turmas
    }


@router.get("/disciplinas-da-turma/{turma_id:path}")
def disciplinas_da_turma(turma_id: str):
    """
    Dado um turma_id (ex: informatica_internet_2023_2M),
    retorna TODAS as disciplinas do curso agrupadas por ano.
    """
    turma = get_turma(turma_id)
    if not turma:
        raise HTTPException(status_code=404, detail=f"Turma '{turma_id}' não encontrada.")

    curso = get_curso(turma["curso_id"])
    if not curso:
        raise HTTPException(status_code=404, detail=f"Curso '{turma['curso_id']}' não encontrado.")

    # Calcula o ano letivo atual da turma
    ano_atual = date.today().year
    posicao = ano_atual - turma["ano_ingresso"] + 1
    anos_letivos = ["1º Ano", "2º Ano", "3º Ano", "4º Ano"]
    ano_letivo_label = anos_letivos[min(posicao, len(anos_letivos)) - 1] if posicao >= 1 else anos_letivos[0]

    # Todas as disciplinas do curso agrupadas por ano
    todas_disciplinas_flat = []
    disciplinas_por_ano = []
    for ano_data in curso["anos"]:
        todas_disciplinas_flat.extend(ano_data["disciplinas"])
        disciplinas_por_ano.append({
            "ano": ano_data["ano"],
            "disciplinas": ano_data["disciplinas"],
            "is_ano_atual": ano_data["ano"] == ano_letivo_label
        })

    return {
        "turma_id": turma_id,
        "turma_nome": turma["nome"],
        "curso_id": turma["curso_id"],
        "curso_nome": turma["curso_nome"],
        "ano_letivo_atual": ano_letivo_label,
        "disciplinas_por_ano": disciplinas_por_ano,
        "todas_disciplinas": sorted(list(set(todas_disciplinas_flat)))
    }


@router.get("/perfil/{matricula_ou_id}")
def obter_perfil_professor(matricula_ou_id: str, session: SessionDep):
    db_user = None
    if matricula_ou_id.isdigit():
        db_user = session.exec(select(Usuario).where(Usuario.id == int(matricula_ou_id))).first()
    if not db_user:
        db_user = session.exec(select(Usuario).where(Usuario.matricula == matricula_ou_id)).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário professor não encontrado.")

    prof = session.exec(select(Professor).where(Professor.id == db_user.id)).first()
    if not prof:
        # Se usuário existe mas ainda não tinha registro na tabela professores, cria automaticamente
        prof = Professor(id=db_user.id)
        session.add(prof)
        session.commit()
        session.refresh(prof)

    # Busca disciplinas vinculadas
    disciplinas_nomes = [d.nome for d in prof.disciplinas] if prof.disciplinas else []
    turmas_codigos = [f"{t.ano}_{t.codigo}" for t in prof.turmas] if prof.turmas else []

    return {
        "id": db_user.id,
        "nome": db_user.nome,
        "email": db_user.email,
        "matricula": db_user.matricula,
        "disciplinas": disciplinas_nomes,
        "turmas": turmas_codigos,
        "perfil_completo": len(disciplinas_nomes) > 0 or len(turmas_codigos) > 0
    }


@router.post("/perfil/{matricula_ou_id}")
def complementar_perfil_professor(
    matricula_ou_id: str,
    payload: ComplementarPerfilProfessorInput,
    session: SessionDep
):
    db_user = None
    if matricula_ou_id.isdigit():
        db_user = session.exec(select(Usuario).where(Usuario.id == int(matricula_ou_id))).first()
    if not db_user:
        db_user = session.exec(select(Usuario).where(Usuario.matricula == matricula_ou_id)).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    prof = session.exec(select(Professor).where(Professor.id == db_user.id)).first()
    if not prof:
        prof = Professor(id=db_user.id)
        session.add(prof)
        session.commit()
        session.refresh(prof)

    # Limpa vínculos antigos de disciplinas e turmas
    links_disc = session.exec(select(ProfessorDisciplina).where(ProfessorDisciplina.professor_id == prof.id)).all()
    for l in links_disc:
        session.delete(l)

    links_turma = session.exec(select(ProfessorTurma).where(ProfessorTurma.professor_id == prof.id)).all()
    for l in links_turma:
        session.delete(l)

    session.commit()

    # Processa os vínculos turma→disciplinas
    todas_disciplinas_salvas = []
    todas_turmas_salvas = []

    for vinculo in payload.vinculos:
        turma_id_str = vinculo.turma_id.strip()
        if not turma_id_str:
            continue

        # Busca ou cria a turma
        db_turma = session.exec(select(Turma).where(Turma.codigo == turma_id_str)).first()
        if not db_turma:
            # Tenta parsear o ID para extrair informações
            parts = turma_id_str.rsplit("_", 2)
            ano_str = parts[1] if len(parts) >= 3 else "2026"
            codigo_str = parts[2] if len(parts) >= 3 else turma_id_str[-2:]
            db_turma = Turma(ano=ano_str, turno="Flexível", codigo=turma_id_str)
            session.add(db_turma)
            session.commit()
            session.refresh(db_turma)

        link_t = ProfessorTurma(professor_id=prof.id, turma_id=db_turma.id)
        session.add(link_t)
        todas_turmas_salvas.append(turma_id_str)

        # Vincula disciplinas desta turma
        for disc_nome in vinculo.disciplinas:
            d_nome = disc_nome.strip()
            if not d_nome:
                continue
            db_disc = session.exec(select(Disciplina).where(Disciplina.nome == d_nome)).first()
            if not db_disc:
                db_disc = Disciplina(nome=d_nome)
                session.add(db_disc)
                session.commit()
                session.refresh(db_disc)

            link_d = ProfessorDisciplina(professor_id=prof.id, disciplina_id=db_disc.id)
            session.add(link_d)
            if d_nome not in todas_disciplinas_salvas:
                todas_disciplinas_salvas.append(d_nome)

    session.commit()

    return {
        "message": "Perfil do professor atualizado com vínculos turma→disciplinas!",
        "professor_id": prof.id,
        "vinculos": [{"turma_id": v.turma_id, "disciplinas": v.disciplinas} for v in payload.vinculos],
        "disciplinas": todas_disciplinas_salvas,
        "turmas": todas_turmas_salvas,
        "perfil_completo": True
    }
