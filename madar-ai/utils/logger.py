"""
MADAR AI Engine - Logging Setup

Structured logging configuration with JSON formatting for production
and readable formatting for development.
"""

import logging
import sys
from typing import Any, Dict, Optional

from config import settings


class JSONFormatter(logging.Formatter):
    """JSON log formatter for structured logging.

    Formats log records as JSON objects for easy parsing by
    log aggregation systems.
    """

    def format(self, record: logging.LogRecord) -> str:
        """Format a log record as JSON.

        Args:
            record: The log record to format.

        Returns:
            str: JSON-formatted log string.
        """
        import json
        import datetime

        log_entry: Dict[str, Any] = {
            "timestamp": datetime.datetime.fromtimestamp(
                record.created
            ).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        # Add extra fields from the record
        for key, value in record.__dict__.items():
            if key not in {
                "name",
                "msg",
                "args",
                "levelname",
                "levelno",
                "pathname",
                "filename",
                "module",
                "exc_info",
                "exc_text",
                "stack_info",
                "lineno",
                "funcName",
                "created",
                "msecs",
                "relativeCreated",
                "thread",
                "threadName",
                "processName",
                "process",
                "message",
                "asctime",
            }:
                log_entry[key] = value

        return json.dumps(log_entry, ensure_ascii=False, default=str)


class ColoredFormatter(logging.Formatter):
    """Colored log formatter for development environments.

    Adds ANSI color codes to log levels for better readability.
    """

    COLORS = {
        "DEBUG": "\033[36m",  # Cyan
        "INFO": "\033[32m",  # Green
        "WARNING": "\033[33m",  # Yellow
        "ERROR": "\033[31m",  # Red
        "CRITICAL": "\033[35m",  # Magenta
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        """Format a log record with colors.

        Args:
            record: The log record to format.

        Returns:
            str: Colored log string.
        """
        color = self.COLORS.get(record.levelname, "")
        record.levelname = f"{color}{record.levelname}{self.RESET}"

        return super().format(record)


def setup_logging(
    level: Optional[str] = None,
    format_type: Optional[str] = None,
) -> logging.Logger:
    """Set up application logging.

    Configures the root logger with the appropriate formatter
    and log level based on environment settings.

    Args:
        level: Log level (uses settings.LOG_LEVEL if None).
        format_type: Log format type (uses settings.LOG_FORMAT if None).

    Returns:
        logging.Logger: Configured root logger.
    """
    log_level = (level or settings.LOG_LEVEL).upper()
    log_format = (format_type or settings.LOG_FORMAT).lower()

    # Create root logger
    root_logger = logging.getLogger("madar_ai")
    root_logger.setLevel(getattr(logging, log_level, logging.INFO))

    # Remove existing handlers
    root_logger.handlers = []

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, log_level, logging.INFO))

    if log_format == "json":
        formatter = JSONFormatter()
    else:
        formatter = ColoredFormatter(
            "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # Set third-party log levels to reduce noise
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sentence_transformers").setLevel(logging.WARNING)

    return root_logger


def _get_standard_logger(name: str) -> logging.Logger:
    """Get a logger instance for a module.

    Args:
        name: Module name (typically __name__).

    Returns:
        logging.Logger: Configured logger instance.
    """
    logger = logging.getLogger(f"madar_ai.{name}")

    # Ensure logging is set up
    if not logger.handlers and not logging.getLogger("madar_ai").handlers:
        setup_logging()

    return logger


def get_logger(name: str) -> "StructLogger":
    """Get a structured logger instance for a module."""
    return StructLogger(name)


# Convenience function for structured logging
class StructLogger:
    """Structured logger wrapper for consistent key-value logging.

    Provides a simple interface for structured logging with
    automatic key-value formatting.
    """

    def __init__(self, name: str):
        """Initialize the structured logger.

        Args:
            name: Logger name.
        """
        self._logger = _get_standard_logger(name)

    def debug(self, message: str, **kwargs) -> None:
        """Log a debug message with structured data.

        Args:
            message: Log message.
            **kwargs: Key-value pairs to include in the log.
        """
        self._logger.debug(message, extra=kwargs)

    def info(self, message: str, **kwargs) -> None:
        """Log an info message with structured data.

        Args:
            message: Log message.
            **kwargs: Key-value pairs to include in the log.
        """
        self._logger.info(message, extra=kwargs)

    def warning(self, message: str, **kwargs) -> None:
        """Log a warning message with structured data.

        Args:
            message: Log message.
            **kwargs: Key-value pairs to include in the log.
        """
        self._logger.warning(message, extra=kwargs)

    def error(self, message: str, **kwargs) -> None:
        """Log an error message with structured data.

        Args:
            message: Log message.
            **kwargs: Key-value pairs to include in the log.
        """
        self._logger.error(message, extra=kwargs)

    def critical(self, message: str, **kwargs) -> None:
        """Log a critical message with structured data.

        Args:
            message: Log message.
            **kwargs: Key-value pairs to include in the log.
        """
        self._logger.critical(message, extra=kwargs)

    def exception(self, message: str, **kwargs) -> None:
        """Log an exception with structured data.

        Args:
            message: Log message.
            **kwargs: Key-value pairs to include in the log.
        """
        self._logger.exception(message, extra=kwargs)
