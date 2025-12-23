class CarrierAlreadyExistsError(ValueError):
    """Carrier code already exists."""


class CarrierNotFoundError(ValueError):
    """Carrier not found."""


class CarrierServiceAlreadyExistsError(ValueError):
    """Carrier service code already exists."""


class CarrierServiceNotFoundError(ValueError):
    """Carrier service not found."""


class CarrierServiceGeoGroupConflictError(ValueError):
    """Carrier service geo group conflicts with existing active group."""


class CarrierServiceGeoGroupNotFoundError(ValueError):
    """Geo group not found."""


class RegionNotFoundError(ValueError):
    """Region code not found."""


class CarrierServiceTariffRegionMismatchError(ValueError):
    """Tariff region not in geo group."""
