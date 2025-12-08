"""seed business domains

Revision ID: 9fb96aadca3b
Revises: 7daa00be91d2
Create Date: 2025-12-08 15:09:12.203521

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9fb96aadca3b'
down_revision: Union[str, Sequence[str], None] = '7daa00be91d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DOMAINS = [
    ("INTERNAL", "内部运营域", "内部操作、自建流程"),
    ("WAREHOUSE", "仓储域", "与仓库/库内业务相关"),
]

def upgrade() -> None:
    """Upgrade schema."""
    # 插入数据，避免重复（ON CONFLICT DO NOTHING）
    for code, name, desc in DOMAINS:
        op.execute(
            sa.text(
                """
                INSERT INTO business_domains (code, name, description)
                VALUES (:code, :name, :desc)
                ON CONFLICT (code) DO NOTHING;
                """
            ).bindparams(code=code, name=name, desc=desc)
        )


def downgrade() -> None:
    """Downgrade schema."""
    # 回滚数据（删除掉我们插入的）
    for code, _, _ in DOMAINS:
        op.execute(
            sa.text(
                """
                DELETE FROM business_domains WHERE code = :code;
                """
            ).bindparams(code=code)
        )
