from datetime import datetime, timedelta

from app.database.db import db
from sqlalchemy import or_
from models import AuthAccount, Notification


def create_notification(recipient_account_id, title, message, notification_type="info", action_path=None):
    notification = Notification(
        recipient_account_id=recipient_account_id,
        title=title,
        message=message,
        type=notification_type,
        action_path=action_path,
    )
    db.session.add(notification)
    return notification


def create_notification_once(
    recipient_account_id,
    title,
    message,
    notification_type="info",
    action_path=None,
    dedupe_hours=24,
):
    cutoff = (datetime.utcnow() - timedelta(hours=dedupe_hours)).isoformat()
    existing_notification = (
        Notification.query.filter(
            Notification.recipient_account_id == recipient_account_id,
            Notification.title == title,
            Notification.message == message,
            Notification.created_at >= cutoff,
        )
        .order_by(Notification.created_at.desc())
        .first()
    )

    if existing_notification:
        return existing_notification

    return create_notification(
        recipient_account_id,
        title,
        message,
        notification_type=notification_type,
        action_path=action_path,
    )


def notify_company_accounts(
    company_id=None,
    company_name=None,
    title="",
    message="",
    notification_type="approval",
    action_path=None,
):
    query = AuthAccount.query.filter_by(role="company", is_active=True)

    if company_id and company_name:
        query = query.filter(
            or_(
                AuthAccount.company_id == company_id,
                AuthAccount.company_name == company_name,
            )
        )
    elif company_id:
        query = query.filter(AuthAccount.company_id == company_id)
    elif company_name:
        query = query.filter(AuthAccount.company_name == company_name)
    else:
        return []

    company_accounts = query.order_by(AuthAccount.created_at.desc()).all()

    notifications = []
    for account in company_accounts:
        notifications.append(
            create_notification(
                account.id,
                title,
                message,
                notification_type=notification_type,
                action_path=action_path,
            )
        )

    return notifications


def notify_company_accounts_once(
    company_id=None,
    company_name=None,
    title="",
    message="",
    notification_type="approval",
    action_path=None,
    dedupe_hours=24,
):
    query = AuthAccount.query.filter_by(role="company", is_active=True)

    if company_id and company_name:
        query = query.filter(
            or_(
                AuthAccount.company_id == company_id,
                AuthAccount.company_name == company_name,
            )
        )
    elif company_id:
        query = query.filter(AuthAccount.company_id == company_id)
    elif company_name:
        query = query.filter(AuthAccount.company_name == company_name)
    else:
        return []

    company_accounts = query.order_by(AuthAccount.created_at.desc()).all()

    notifications = []
    for account in company_accounts:
        notifications.append(
            create_notification_once(
                account.id,
                title,
                message,
                notification_type=notification_type,
                action_path=action_path,
                dedupe_hours=dedupe_hours,
            )
        )

    return notifications
