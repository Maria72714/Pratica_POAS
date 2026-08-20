from enum import Enum

class TipoAtendimento(str, Enum):
    TAI = 'TAI'
    TAL = 'TAL'

class ModalidadeAula(str, Enum):
    PRESENCIAL = 'Presencial'
    REMOTO = 'Remoto' 

class StatusAtendimento(str, Enum):
    AGENDADO = 'Agendado'
    CONCLUIDO = 'Concluído'
    CANCELADO = 'Cancelado'

class StatusSolicitacao(str, Enum):
    PENDENTE = 'Pendente'
    APROVADO = 'Aprovado'
    RECUSADO = 'Recusado'
    CANCELADO = 'Cancelado'

class StatusHorario(str, Enum):
    DISPONIVEL = 'Disponível'
    RESERVADO = 'Reservado'

class TipoMediador(str, Enum):
    LIBRAS = 'Libras'
    BRAILE = 'Braile'
    ACOMPANHAMENTO = 'Acompanhamento'
    MOBILIDADE = 'Mobilidade'
    TRANSTORNOS_ESPECIFICOS = 'Transtornos Específicos'
    OUTRO = 'Outro'


