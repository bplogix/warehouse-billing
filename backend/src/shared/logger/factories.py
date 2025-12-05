import structlog
from structlog.stdlib import BoundLogger

log: BoundLogger = structlog.get_logger("log")
# 按 Clean Architecture 分层
domain_logger: BoundLogger = structlog.get_logger("domain")
app_logger: BoundLogger = structlog.get_logger("application")
infra_logger: BoundLogger = structlog.get_logger("infrastructure")
presentation_logger: BoundLogger = structlog.get_logger("presentation")
