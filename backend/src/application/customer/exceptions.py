class DuplicateCompanyError(RuntimeError):
    """Raised when company name or code already exists."""


class DuplicateCustomerError(RuntimeError):
    """Raised when customer name or code already exists."""
