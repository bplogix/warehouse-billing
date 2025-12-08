import secrets


def generate_urlsafe_code(length: int = 16) -> str:
    return secrets.token_urlsafe(length)
