from sqlalchemy.exc import IntegrityError


def format_integrity_error(error: IntegrityError) -> str:
    error_message = str(getattr(error, "orig", error)).lower()

    if "riders_phone_key" in error_message or "riders.phone" in error_message:
        return "A rider with that phone number already exists"

    if "transactions_receipt_number_key" in error_message or "receipt_number" in error_message:
        return "That receipt number is already in use"

    if "foreign key" in error_message:
        return "This record references a rider or station that does not exist"

    if "not-null" in error_message or "null value" in error_message:
        return "A required field is missing"

    if "check_" in error_message or "check constraint" in error_message:
        return "The submitted data failed validation rules"

    return "The submitted data violates a database constraint"
