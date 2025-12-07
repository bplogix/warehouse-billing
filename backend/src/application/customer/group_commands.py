from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class CreateCustomerGroupCommand:
    name: str
    business_domain: str
    description: str | None = None
    member_ids: list[int] | None = None


@dataclass(slots=True)
class ReplaceGroupMembersCommand:
    group_id: int
    member_ids: list[int]
