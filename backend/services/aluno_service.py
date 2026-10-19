import re
import uuid
from pathlib import Path

from fastapi import HTTPException
from sqlmodel import select

from data.cursos import CURSOS, get_curso, get_disciplinas
from data.turmas import ano_letivo_da_turma, get_turma
from models.users.aluno import Aluno
from models.users.user import Usuario
from repositories.aluno_repository import AlunoRepository
from repositories.usuario_repository import UsuarioRepository


EMAIL_ESCOLAR_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@escolar\.ifrn\.edu\.br$")
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads" / "laudos"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class PerfilAlunoResponse:
    def __init__(self, usuario: Usuario, aluno: Aluno | None, foto: str | None = None):
        turma = get_turma(aluno.turma_id) if aluno and aluno.turma_id else None
        curso_id_efetivo = turma["curso_id"] if turma else (aluno.curso_id if aluno else None)
        ano_letivo_efetivo = (
            ano_letivo_da_turma(aluno.turma_id)
            if aluno and aluno.turma_id
            else (aluno.ano_letivo if aluno else None)
        )
        curso = get_curso(curso_id_efetivo) if curso_id_efetivo else None
        disciplinas = (
            get_disciplinas(curso_id_efetivo, ano_letivo_efetivo)
            if curso_id_efetivo and ano_letivo_efetivo
            else []
        )

        self.matricula = usuario.matricula
        self.nome = usuario.nome
        self.email = usuario.email
        self.foto = foto or (aluno.foto_suap if aluno else None)
        self.tipo_vinculo = "Aluno"
        self.turma_id = aluno.turma_id if aluno else None
        self.turma_nome = turma["nome"] if turma else None
        self.turma_codigo = turma["codigo"] if turma else None
        self.turno = turma["turno"] if turma else None
        self.turno_label = turma["turno_label"] if turma else None
        self.curso_id = curso_id_efetivo
        self.curso_nome = curso["nome"] if curso else None
        self.ano_letivo = ano_letivo_efetivo
        self.necessidades_especiais = aluno.necessidades_especiais if aluno else False
        self.tipo_necessidade = aluno.tipo_necessidade if aluno else None
        self.perfil_completo = aluno.perfil_completo if aluno else False
        self.laudo_path = aluno.laudo_path if aluno else None
        self.disciplinas = disciplinas


def _as_dict(perfil: PerfilAlunoResponse):
    return {
        "matricula": perfil.matricula,
        "nome": perfil.nome,
        "email": perfil.email,
        "foto": perfil.foto,
        "tipo_vinculo": perfil.tipo_vinculo,
        "turma_id": perfil.turma_id,
        "turma_nome": perfil.turma_nome,
        "turma_codigo": perfil.turma_codigo,
        "turno": perfil.turno,
        "turno_label": perfil.turno_label,
        "curso_id": perfil.curso_id,
        "curso_nome": perfil.curso_nome,
        "ano_letivo": perfil.ano_letivo,
        "necessidades_especiais": perfil.necessidades_especiais,
        "tipo_necessidade": perfil.tipo_necessidade,
        "perfil_completo": perfil.perfil_completo,
        "laudo_path": perfil.laudo_path,
        "disciplinas": perfil.disciplinas,
    }


class AlunoService:
    def __init__(self, session):
        self.session = session
        self.usuario_repository = UsuarioRepository(session)
        self.aluno_repository = AlunoRepository(session)

    def get_usuario_e_aluno(self, matricula: str) -> tuple[Usuario, Aluno]:
        usuario = self.usuario_repository.get_by_matricula(matricula)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")

        aluno = self.aluno_repository.get_by_user_id(usuario.id)
        if not aluno:
            raise HTTPException(status_code=404, detail="Perfil de aluno não encontrado.")

        return usuario, aluno

    def listar_cursos(self):
        return [
            {
                "id": curso["id"],
                "nome": curso["nome"],
                "anos": [{"ano": a["ano"], "disciplinas": a["disciplinas"]} for a in curso["anos"]],
            }
            for curso in CURSOS
        ]

    def listar_disciplinas(self, curso_id: str, ano_letivo: str):
        curso = get_curso(curso_id)
        if not curso:
            raise HTTPException(status_code=404, detail="Curso não encontrado.")

        disciplinas = get_disciplinas(curso_id, ano_letivo)
        if not disciplinas:
            raise HTTPException(status_code=404, detail="Ano letivo não encontrado para este curso.")

        return {"curso_id": curso_id, "curso_nome": curso["nome"], "ano_letivo": ano_letivo, "disciplinas": disciplinas}

    def listar_turmas(self, ano_ingresso: int | None = None):
        from data.turmas import get_turmas

        return get_turmas(ano_ingresso=ano_ingresso)

    def listar_codigos_turma(self, curso_id: str):
        from data.turmas import CURSOS_TURMAS, TURNO_LABEL

        info = CURSOS_TURMAS.get(curso_id)
        if not info:
            raise HTTPException(status_code=404, detail="Curso não encontrado.")

        codigos = []
        for turno in info["turnos"]:
            for serie in range(1, info["series_por_turno"] + 1):
                codigos.append({
                    "codigo": f"{serie}{turno}",
                    "serie": serie,
                    "turno": turno,
                    "turno_label": TURNO_LABEL[turno],
                    "label": f"{serie}{turno} — {TURNO_LABEL[turno]}",
                })
        return codigos

    def sugerir_turma(self, matricula: str, turno: str):
        from data.turmas import inferir_turma_sugerida

        turma = inferir_turma_sugerida(matricula, turno)
        if not turma:
            raise HTTPException(status_code=404, detail="Não foi possível inferir a turma para esta matrícula e turno.")
        return turma

    def obter_perfil(self, matricula: str):
        usuario, aluno = self.get_usuario_e_aluno(matricula)
        return _as_dict(PerfilAlunoResponse(usuario, aluno))

    async def completar_perfil(
        self,
        matricula: str,
        email: str,
        turma_id: str,
        necessidades_especiais: bool,
        tipo_necessidade: str | None,
        foto: str | None,
        laudo,
    ):
        if not EMAIL_ESCOLAR_REGEX.match(email.strip().lower()):
            raise HTTPException(
                status_code=400,
                detail="Use um e-mail institucional terminado em @escolar.ifrn.edu.br.",
            )

        turma = get_turma(turma_id)
        if not turma:
            raise HTTPException(status_code=400, detail="Turma inválida.")

        usuario, aluno = self.get_usuario_e_aluno(matricula)

        email_normalizado = email.strip().lower()
        outro = self.session.exec(
            select(Usuario).where(Usuario.email == email_normalizado, Usuario.id != usuario.id)
        ).first()
        if outro:
            raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado por outro usuário.")

        laudo_path = aluno.laudo_path
        if necessidades_especiais and laudo and laudo.filename:
            ext = Path(laudo.filename).suffix.lower()
            if ext not in {".pdf", ".png", ".jpg", ".jpeg"}:
                raise HTTPException(status_code=400, detail="Laudo deve ser PDF, PNG ou JPG.")
            filename = f"{matricula}_{uuid.uuid4().hex}{ext}"
            destino = UPLOAD_DIR / filename
            destino.write_bytes(await laudo.read())
            laudo_path = f"uploads/laudos/{filename}"

        usuario.email = email_normalizado
        aluno.turma_id = turma_id
        aluno.curso_id = turma["curso_id"]
        aluno.ano_letivo = ano_letivo_da_turma(turma_id)
        aluno.necessidades_especiais = necessidades_especiais
        if tipo_necessidade and necessidades_especiais:
            aluno.tipo_necessidade = tipo_necessidade
        aluno.perfil_completo = True
        aluno.laudo_path = laudo_path
        if foto:
            aluno.foto_suap = foto

        self.usuario_repository.update(usuario)
        self.aluno_repository.update(aluno)

        return _as_dict(PerfilAlunoResponse(usuario, aluno, foto=foto))

    async def atualizar_pnee(
        self,
        matricula: str,
        necessidades_especiais: bool,
        tipo_necessidade: str | None,
        laudo,
    ):
        """Permite ao aluno (ou mediador/admin) declarar ou atualizar o status de PNEE
        e enviar um laudo, sem refazer todo o complemento de perfil."""
        usuario, aluno = self.get_usuario_e_aluno(matricula)

        laudo_path = aluno.laudo_path
        if necessidades_especiais and laudo and laudo.filename:
            ext = Path(laudo.filename).suffix.lower()
            if ext not in {".pdf", ".png", ".jpg", ".jpeg"}:
                raise HTTPException(status_code=400, detail="Laudo deve ser PDF, PNG ou JPG.")
            filename = f"{matricula}_{uuid.uuid4().hex}{ext}"
            destino = UPLOAD_DIR / filename
            destino.write_bytes(await laudo.read())
            laudo_path = f"uploads/laudos/{filename}"

        aluno.necessidades_especiais = necessidades_especiais
        if tipo_necessidade:
            aluno.tipo_necessidade = tipo_necessidade
        if necessidades_especiais:
            aluno.laudo_path = laudo_path

        self.aluno_repository.update(aluno)

        return _as_dict(PerfilAlunoResponse(usuario, aluno))

    def listar_laudos_pnee(self):
        """Retorna lista de alunos que enviaram laudo ou se autodeclararam PNEE para análise do Mediador."""
        alunos_com_laudo = self.session.exec(
            select(Aluno).where((Aluno.laudo_path != None) | (Aluno.necessidades_especiais == True))
        ).all()

        resultado = []
        for a in alunos_com_laudo:
            u = self.session.get(Usuario, a.id)
            if not u:
                continue
            turma = get_turma(a.turma_id) if a.turma_id else None
            curso = get_curso(a.curso_id) if a.curso_id else None

            # Monta URL pública para o laudo
            url_laudo = None
            if a.laudo_path:
                nome_arquivo = Path(a.laudo_path).name
                url_laudo = f"http://localhost:8000/api/uploads/laudos/{nome_arquivo}"

            resultado.append({
                "aluno_id": a.id,
                "nome": u.nome,
                "email": u.email,
                "matricula": u.matricula,
                "turma_nome": turma["nome"] if turma else (a.turma_id or "Não informada"),
                "curso_nome": curso["nome"] if curso else "Não informado",
                "necessidades_especiais": a.necessidades_especiais,
                "laudo_path": a.laudo_path,
                "url_laudo": url_laudo,
                "status_pnee": "Aprovado" if a.necessidades_especiais else "Pendente",
            })
        return resultado

    def avaliar_laudo_pnee(self, aluno_id: int | str, aprovado: bool):
        """Permite ao Mediador aprovar ou recusar o status de PNEE do aluno com base no laudo."""
        aluno = None
        if isinstance(aluno_id, int):
            aluno = self.session.get(Aluno, aluno_id)
        elif isinstance(aluno_id, str):
            if aluno_id.isdigit():
                aluno = self.session.get(Aluno, int(aluno_id))
            if not aluno:
                u = self.usuario_repository.get_by_matricula(aluno_id)
                if u:
                    aluno = self.aluno_repository.get_by_user_id(u.id)

        if not aluno:
            raise HTTPException(status_code=404, detail="Aluno não encontrado.")

        aluno.necessidades_especiais = aprovado
        self.aluno_repository.update(aluno)

        u = self.session.get(Usuario, aluno.id)
        return {
            "message": f"Status PNEE do aluno {u.nome if u else ''} atualizado para {'Aprovado' if aprovado else 'Recusado'}.",
            "aluno_id": aluno.id,
            "necessidades_especiais": aluno.necessidades_especiais
        }
