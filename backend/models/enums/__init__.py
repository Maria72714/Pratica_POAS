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

