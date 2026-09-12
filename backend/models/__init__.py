from .users.user import Usuario
from .users.aluno import Aluno
from .users.professor import Professor
from .users.mediador import Mediador
from .disciplina import Disciplina
from .horario import Horario
from .notificacao import Notificacao
from .curso import Curso      # Curso antes de Turma — Turma referencia Curso
from .turma import Turma
from .solicitacao import Solicitacao
from .atendimento import Atendimento
from .sala import Sala
from .associativas.aluno_atendimento import AlunoAtendimento
from .associativas.professor_turma import ProfessorTurma
from .associativas.professor_disciplina import ProfessorDisciplina
from .associativas.horario_sala import HorarioSala
from .associativas.usuario_notificacao import UsuarioNotificacao
