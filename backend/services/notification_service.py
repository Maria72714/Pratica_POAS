"""
Serviço centralizado para disparo de notificações.
Consolida toda lógica de notificações do sistema.
"""
import logging
from sqlmodel import Session, select
from models.notificacao import Notificacao
from models.associativas.usuario_notificacao import UsuarioNotificacao
from models.users.user import Usuario

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, session: Session):
        self.session = session

    def notificar_usuario(self, usuario_id: int, titulo: str, mensagem: str, link_destino: str | None = None) -> bool:
        """Notifica um usuário específico"""
        try:
            usuario = self.session.get(Usuario, usuario_id)
            if not usuario:
                logger.warning(f"Usuário {usuario_id} não encontrado para notificação")
                return False
            
            notif = Notificacao(
                titulo=titulo,
                mensagem=mensagem,
                lida=False,
                link_destino=(link_destino or None),
            )
            self.session.add(notif)
            self.session.commit()
            self.session.refresh(notif)
            
            link = UsuarioNotificacao(usuario_id=usuario_id, notificacao_id=notif.id)
            self.session.add(link)
            self.session.commit()
            
            logger.info(f"Notificação enviada a usuário {usuario_id}: {titulo}")
            return True
        except Exception as e:
            logger.error(f"Erro ao notificar usuário {usuario_id}: {e}")
            return False

    def notificar_multiplos(self, usuario_ids: list, titulo: str, mensagem: str, link_destino: str | None = None) -> int:
        """Notifica múltiplos usuários com a mesma mensagem. Retorna quantidade de sucessos."""
        if not usuario_ids:
            return 0
        
        count = 0
        try:
            notif = Notificacao(
                titulo=titulo,
                mensagem=mensagem,
                lida=False,
                link_destino=(link_destino or None),
            )
            self.session.add(notif)
            self.session.commit()
            self.session.refresh(notif)
            
            for uid in usuario_ids:
                try:
                    usuario = self.session.get(Usuario, uid)
                    if usuario:
                        link = UsuarioNotificacao(usuario_id=uid, notificacao_id=notif.id)
                        self.session.add(link)
                        count += 1
                except Exception as e:
                    logger.error(f"Erro ao notificar usuário {uid}: {e}")
            
            if count > 0:
                self.session.commit()
                logger.info(f"Notificação em massa enviada a {count} usuários: {titulo}")
            
            return count
        except Exception as e:
            logger.error(f"Erro ao notificar múltiplos usuários: {e}")
            return count

    def notificar_aluno_criou_solicitacao(self, aluno_id: int, aluno_nome: str, disciplina_nome: str) -> bool:
        """Notifica mediadores quando aluno cria uma solicitação TAI"""
        try:
            # Busca todos os mediadores
            from models.users.mediador import Mediador
            mediadores = self.session.exec(select(Mediador)).all()
            mediador_ids = [m.id for m in mediadores]
            
            titulo = "Nova Solicitação TAI Recebida"
            mensagem = f"O aluno {aluno_nome} solicitou apoio em {disciplina_nome}. Verificar e validar conforme necessário."
            
            if mediador_ids:
                self.notificar_multiplos(mediador_ids, titulo, mensagem, link_destino="/mediador/solicitacoes")
            
            return True
        except Exception as e:
            logger.error(f"Erro ao notificar criação de solicitação: {e}")
            return False

    def notificar_mediador_selou_solicitacao(self, aluno_id: int, disciplina_nome: str, mediador_nome: str) -> bool:
        """Notifica aluno quando mediador aprova (sela) sua solicitação"""
        titulo = "Seu Pedido de Apoio foi Validado"
        mensagem = f"O Mediador Pedagógico ({mediador_nome}) validou sua solicitação de TAI em {disciplina_nome}. O professor agora pode conferir."
        return self.notificar_usuario(aluno_id, titulo, mensagem, link_destino="/historico")

    def notificar_mediador_negou_solicitacao(self, aluno_id: int, disciplina_nome: str) -> bool:
        """Notifica aluno quando mediador recusa sua solicitação"""
        titulo = "Solicitação de Apoio Não Validada"
        mensagem = f"Infelizmente, sua solicitação de TAI em {disciplina_nome} não foi validada pelo mediador. Você pode tentar novamente."
        return self.notificar_usuario(aluno_id, titulo, mensagem, link_destino="/historico")

    def notificar_professor_aprovou_solicitacao(self, aluno_id: int, aluno_nome: str, disciplina_nome: str) -> bool:
        """Notifica aluno quando professor aprova sua solicitação (cria atendimento)"""
        titulo = "Seu Atendimento foi Agendado"
        mensagem = f"Seu pedido de apoio em {disciplina_nome} foi aprovado. Um atendimento será agendado em breve. Confira sua agenda."
        return self.notificar_usuario(aluno_id, titulo, mensagem, link_destino="/agendamentos")

    def notificar_professor_negou_solicitacao(self, aluno_id: int, disciplina_nome: str) -> bool:
        """Notifica aluno quando professor recusa sua solicitação"""
        titulo = "Solicitação de Apoio Recusada"
        mensagem = f"Sua solicitação de TAI em {disciplina_nome} foi recusada pelo professor."
        return self.notificar_usuario(aluno_id, titulo, mensagem, link_destino="/historico")

    def notificar_atendimento_criado(self, aluno_ids: list, professor_id: int | None, disciplina_nome: str, data_atendimento: str, atendimento_id: int | None = None) -> int:
        """Notifica alunos e professor quando um atendimento é criado"""
        count = 0
        link_aluno = f"/ca/{atendimento_id}" if atendimento_id else "/agendamentos"
        link_prof = f"/ca/{atendimento_id}" if atendimento_id else "/professor/atendimentos"
        
        # Notificar alunos
        if aluno_ids:
            titulo = f"Atendimento Registrado: {disciplina_nome}"
            mensagem = f"Seu atendimento em {disciplina_nome} foi agendado para {data_atendimento}."
            count += self.notificar_multiplos(aluno_ids, titulo, mensagem, link_destino=link_aluno)
        
        # Notificar professor
        if professor_id:
            titulo = f"Novo Atendimento: {disciplina_nome}"
            mensagem = f"Um atendimento foi agendado para {data_atendimento} em {disciplina_nome}."
            if self.notificar_usuario(professor_id, titulo, mensagem, link_destino=link_prof):
                count += 1
        
        return count

    def notificar_atendimento_cancelado(self, aluno_ids: list, professor_id: int | None, disciplina_nome: str, atendimento_id: int | None = None) -> int:
        """Notifica quando um atendimento é cancelado"""
        count = 0
        link_destino = f"/ca/{atendimento_id}" if atendimento_id else "/agendamentos"
        
        # Notificar alunos
        if aluno_ids:
            titulo = f"Atendimento Cancelado: {disciplina_nome}"
            mensagem = f"O atendimento em {disciplina_nome} foi cancelado."
            count += self.notificar_multiplos(aluno_ids, titulo, mensagem, link_destino=link_destino)
        
        # Notificar professor
        if professor_id:
            titulo = f"Atendimento Cancelado: {disciplina_nome}"
            mensagem = f"Um atendimento em {disciplina_nome} foi cancelado."
            if self.notificar_usuario(professor_id, titulo, mensagem, link_destino=link_destino):
                count += 1
        
        return count

    def notificar_atendimento_concluido(self, aluno_ids: list, disciplina_nome: str, atendimento_id: int | None = None) -> int:
        """Notifica alunos quando um atendimento é concluído"""
        if not aluno_ids:
            return 0
        
        titulo = f"Atendimento Concluído: {disciplina_nome}"
        mensagem = f"Seu atendimento em {disciplina_nome} foi concluído. Avalie o CA e veja o relatório."
        link_destino = f"/ca/{atendimento_id}" if atendimento_id else "/historico"
        return self.notificar_multiplos(aluno_ids, titulo, mensagem, link_destino=link_destino)
