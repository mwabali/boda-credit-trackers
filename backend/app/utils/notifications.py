from app.database.db import db
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


def notify_company_accounts(company_name, title, message, notification_type="approval", action_path=None):
    company_accounts = (
        AuthAccount.query.filter_by(role="company", company_name=company_name, is_active=True)
        .order_by(AuthAccount.created_at.desc())
        .all()
    )

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
