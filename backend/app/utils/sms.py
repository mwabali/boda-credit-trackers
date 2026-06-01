import json
import os
from urllib.parse import urlencode
from urllib.error import URLError
from urllib.request import Request, urlopen

from app.database.db import db
from models import SmsOutbox


def queue_sms_alert(recipient_phone, message, rider_id=None, transaction_id=None):
    alert = SmsOutbox(
        rider_id=rider_id,
        transaction_id=transaction_id,
        recipient_phone=recipient_phone,
        message=message,
    )
    db.session.add(alert)
    db.session.flush()

    africastalking_api_key = os.getenv("AFRICASTALKING_API_KEY", "").strip()
    if africastalking_api_key:
        return _send_africastalking(alert, africastalking_api_key)

    webhook_url = os.getenv("SMS_WEBHOOK_URL", "").strip()
    if not webhook_url:
        return alert

    payload = json.dumps(
        {
            "to": alert.recipient_phone,
            "message": alert.message,
            "reference": f"boda-credit-sms-{alert.id}",
        }
    ).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    webhook_token = os.getenv("SMS_WEBHOOK_TOKEN", "").strip()
    if webhook_token:
        headers["Authorization"] = f"Bearer {webhook_token}"

    try:
        request = Request(webhook_url, data=payload, headers=headers, method="POST")
        with urlopen(request, timeout=5) as response:
            alert.status = "sent" if 200 <= response.status < 300 else "failed"
            alert.provider_response = f"HTTP {response.status}"
    except (OSError, URLError) as error:
        alert.status = "failed"
        alert.provider_response = str(error)[:500]

    return alert


def _send_africastalking(alert, api_key):
    api_url = os.getenv(
        "AFRICASTALKING_SMS_URL",
        "https://api.sandbox.africastalking.com/version1/messaging",
    ).strip()
    username = os.getenv("AFRICASTALKING_USERNAME", "sandbox").strip()
    payload = urlencode(
        {
            "username": username,
            "to": alert.recipient_phone,
            "message": alert.message,
        }
    ).encode("utf-8")

    try:
        request = Request(
            api_url,
            data=payload,
            headers={
                "Accept": "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
                "apiKey": api_key,
            },
            method="POST",
        )
        with urlopen(request, timeout=5) as response:
            alert.status = "sent" if 200 <= response.status < 300 else "failed"
            alert.provider_response = response.read().decode("utf-8", errors="replace")[:500]
    except (OSError, URLError) as error:
        alert.status = "failed"
        alert.provider_response = str(error)[:500]

    return alert
