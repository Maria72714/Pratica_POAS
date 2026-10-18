import os
import logging

logger = logging.getLogger(__name__)


class SecurityConfig:
    @staticmethod
    def get_jwt_secret() -> str:
        secret = os.getenv("JWT_SECRET", "").strip()
        if not secret:
            raise RuntimeError("JWT_SECRET não configurado no .env")

        if secret == "altere-este-segredo-em-producao" or len(secret) < 8:
            env = os.getenv("ENVIRONMENT", "development").lower()
            if env == "production":
                raise RuntimeError("JWT_SECRET padrão ou muito curto para ambiente de produção.")
            logger.warning("JWT_SECRET em modo de desenvolvimento.")

        return secret

    @staticmethod
    def get_environment() -> str:
        return os.getenv("ENVIRONMENT", "development").lower()

    @staticmethod
    def is_production() -> bool:
        return SecurityConfig.get_environment() == "production"

    @staticmethod
    def validate_all():
        errors = []

        try:
            SecurityConfig.get_jwt_secret()
        except RuntimeError as e:
            errors.append(str(e))

        db_url = os.getenv("DATABASE_URL", "").strip()
        if not db_url:
            errors.append("DATABASE_URL não configurado.")

        if SecurityConfig.is_production():
            allowed = os.getenv("ALLOWED_ORIGINS", "").strip()
            if not allowed or allowed == "*":
                errors.append("ALLOWED_ORIGINS inválido para produção.")

        if errors:
            logger.error("Erros de configuração: %s", errors)
            raise RuntimeError("Configuração de ambiente inválida.")


if os.getenv("ENVIRONMENT", "development").lower() == "production":
    SecurityConfig.validate_all()
