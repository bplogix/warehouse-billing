"""FastAPI dependency helpers."""

from .auth import authenticate_user_dependency, get_current_user
from .customer import (
    get_create_customer_use_case,
    get_customer_detail_use_case,
    get_query_customers_use_case,
    get_update_customer_status_use_case,
)

__all__ = [
    "authenticate_user_dependency",
    "get_current_user",
    "get_create_customer_use_case",
    "get_query_customers_use_case",
    "get_customer_detail_use_case",
    "get_update_customer_status_use_case",
]
