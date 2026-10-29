import logging
import os
import json
import re

SENSITIVE_PATTERNS = [
    (r'Bearer\s+[^\s]+', 'Bearer [REDACTED]'),
    (r'token["\']?\s*[:=]\s*["\']?[^\s\'"]+', 'token: [REDACTED]'),
    (r'password["\']?\s*[:=]\s*["\']?[^\s\'"]+', 'password: [REDACTED]'),
    (r'Authorization["\']?\s*[:=]\s*["\']?[^\s\'"]+', 'Authorization: [REDACTED]'),
    (r'secret["\']?\s*[:=]\s*["\']?[^\s\'"]+', 'secret: [REDACTED]'),
    (r'access_token["\']?\s*[:=]\s*["\']?[^\s\'"]+', 'access_token: [REDACTED]'),
]


class SensitiveDataFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.msg = self._redact(str(record.msg))
        if record.args:
            if isinstance(record.args, dict):
                record.args = {k: self._redact(str(v)) for k, v in record.args.items()}
            elif isinstance(record.args, tuple):
                record.args = tuple(self._redact(str(arg)) for arg in record.args)
        return True

    @staticmethod
    def _redact(message: str) -> str:
        for pattern, replacement in SENSITIVE_PATTERNS:
            message = re.sub(pattern, replacement, message, flags=re.IGNORECASE)
        return message


class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id
        return json.dumps(log_data, ensure_ascii=False)


def setup_logging():
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    is_dev = os.getenv("ENVIRONMENT", "development").lower() == "development"

    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.addFilter(SensitiveDataFilter())

    if is_dev:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    else:
        formatter = JSONFormatter()

    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)

    return root_logger
