DEFAULT_COMPANY_NAME = "Independent"
LEGACY_COMPANY_PREFIXES = ["Total", "Shell", "Gapco", "City Oil"]


def normalize_station_branch_name(name=""):
    trimmed_name = str(name or "").strip()

    if not trimmed_name:
        return ""

    for prefix in LEGACY_COMPANY_PREFIXES:
        prefix_with_space = f"{prefix} "
        if trimmed_name.lower().startswith(prefix_with_space.lower()):
            return trimmed_name[len(prefix_with_space) :].strip()

    return trimmed_name


def get_station_company_name(station=None):
    station = station or {}

    if isinstance(station, dict):
        company = station.get("company") or {}
        return (
            company.get("name")
            or station.get("companyName")
            or station.get("company_name")
            or DEFAULT_COMPANY_NAME
        )

    company = getattr(station, "company", None)
    if company and getattr(company, "name", None):
        return company.name

    return getattr(station, "company_name", DEFAULT_COMPANY_NAME)


def get_station_display_name(station=None):
    station = station or {}
    company_name = get_station_company_name(station)

    if isinstance(station, dict):
        branch_name = normalize_station_branch_name(station.get("name"))
    else:
        branch_name = normalize_station_branch_name(getattr(station, "name", ""))

    return f"{company_name} {branch_name}".strip() if branch_name else company_name


def hydrate_station(station):
    station_data = station.to_dict() if hasattr(station, "to_dict") else dict(station or {})

    station_data["name"] = normalize_station_branch_name(station_data.get("name"))
    station_data["companyName"] = get_station_company_name(station_data)
    station_data["displayName"] = get_station_display_name(station_data)

    return station_data


def prepare_station_payload(payload=None):
    payload = payload or {}

    return {
        **payload,
        "name": normalize_station_branch_name(payload.get("name")),
        "company_id": payload.get("company_id") or payload.get("companyId"),
        "company_name": payload.get("company_name")
        or payload.get("companyName")
        or DEFAULT_COMPANY_NAME,
    }
