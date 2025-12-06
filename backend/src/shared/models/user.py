from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(slots=True)
class UserContext:
    """轻量级的当前用户上下文模型，避免对 Pydantic 的依赖。"""

    user_id: str
    union_id: str
    name: str
    avatar: str | None = None
    domain_codes: list[str] = field(default_factory=list)
