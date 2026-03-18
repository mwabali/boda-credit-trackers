import re
from datetime import datetime

from sqlalchemy import CheckConstraint, Numeric
from sqlalchemy.orm import validates
from werkzeug.security import check_password_hash, generate_password_hash
from app.database.db import db


PHONE_PATTERN = re.compile(r"^\+?[0-9]{9,15}$")
VALID_RIDER_STATUSES = {"active", "suspended", "inactive"}
VALID_STATION_STATUSES = {"active", "closed", "maintenance"}
VALID_TRANSACTION_STATUSES = {"pending", "approved", "paid", "cancelled"}
VALID_PAYMENT_METHODS = {"credit", "cash", "mobile_money", "card"}
VALID_ACCOUNT_ROLES = {"company", "station", "rider"}
VALID_ACCOUNT_APPROVAL_STATUSES = {"pending", "approved", "rejected"}
VALID_NOTIFICATION_TYPES = {"info", "success", "warning", "approval"}


def serialize_datetime(value):
    if value is None:
        return None

    if isinstance(value, str):
        return value

    if isinstance(value, datetime):
        return value.isoformat()

    return str(value)


def current_timestamp():
    return datetime.utcnow().isoformat()


class Company(db.Model):
    __tablename__ = "companies"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False, unique=True)
    created_at = db.Column(db.String(64), nullable=False, default=current_timestamp)
    updated_at = db.Column(
        db.String(64),
        nullable=False,
        default=current_timestamp,
        onupdate=current_timestamp,
    )

    stations = db.relationship("Station", back_populates="company", lazy="select")
    accounts = db.relationship("AuthAccount", back_populates="company", lazy="select")

    @validates("name")
    def validate_name(self, key, value):
        cleaned_value = (value or "").strip()
        if not cleaned_value:
            raise ValueError("Company name is required")
        return cleaned_value

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "created_at": serialize_datetime(self.created_at),
            "updated_at": serialize_datetime(self.updated_at),
        }


class Rider(db.Model):
    __tablename__ = "riders"
    __table_args__ = (
        CheckConstraint("credit_limit >= 0", name="check_riders_credit_limit_non_negative"),
        CheckConstraint(
            "current_balance >= 0", name="check_riders_current_balance_non_negative"
        ),
        CheckConstraint(
            "status IN ('active', 'suspended', 'inactive')",
            name="check_riders_status_valid",
        ),
    )

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False, unique=True)
    license_plate = db.Column(db.String(20), nullable=False)
    national_id = db.Column(db.String(50))
    credit_limit = db.Column(Numeric(12, 2), nullable=False, default=100000.00)
    current_balance = db.Column(Numeric(12, 2), nullable=False, default=0.00)
    status = db.Column(db.String(20), nullable=False, default="active")
    created_at = db.Column(db.String(64), nullable=False, default=current_timestamp)
    updated_at = db.Column(
        db.String(64),
        nullable=False,
        default=current_timestamp,
        onupdate=current_timestamp,
    )

    transactions = db.relationship("Transaction", back_populates="rider", lazy="select")
    account = db.relationship(
        "AuthAccount",
        back_populates="rider",
        lazy="select",
        uselist=False,
    )

    @validates("name", "license_plate")
    def validate_required_text(self, key, value):
        cleaned_value = (value or "").strip()
        if not cleaned_value:
            raise ValueError(f"{key.replace('_', ' ').title()} is required")
        return cleaned_value

    @validates("phone")
    def validate_phone(self, key, value):
        cleaned_value = (value or "").strip()
        if not cleaned_value:
            raise ValueError("Phone is required")
        normalized_value = cleaned_value.replace(" ", "")
        if not PHONE_PATTERN.match(normalized_value):
            raise ValueError("Phone must be a valid number like +254712345678")
        return normalized_value

    @validates("status")
    def validate_status(self, key, value):
        if value not in VALID_RIDER_STATUSES:
            raise ValueError("Rider status is invalid")
        return value

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "phone": self.phone,
            "licensePlate": self.license_plate,
            "license_plate": self.license_plate,
            "nationalId": self.national_id,
            "creditLimit": float(self.credit_limit or 0),
            "currentBalance": float(self.current_balance or 0),
            "status": self.status,
            "created_at": serialize_datetime(self.created_at),
            "updated_at": serialize_datetime(self.updated_at),
        }


class Station(db.Model):
    __tablename__ = "stations"
    __table_args__ = (
        CheckConstraint(
            "status IN ('active', 'closed', 'maintenance')",
            name="check_stations_status_valid",
        ),
    )

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey("companies.id"))
    company_name = db.Column(db.String(100), nullable=False, default="Total")
    location = db.Column(db.String(200), nullable=False)
    manager_name = db.Column(db.String(100))
    manager_phone = db.Column(db.String(20))
    status = db.Column(db.String(20), nullable=False, default="active")
    created_at = db.Column(db.String(64), nullable=False, default=current_timestamp)
    updated_at = db.Column(
        db.String(64),
        nullable=False,
        default=current_timestamp,
        onupdate=current_timestamp,
    )

    transactions = db.relationship("Transaction", back_populates="station", lazy="select")
    company = db.relationship("Company", back_populates="stations", lazy="joined")
    account = db.relationship(
        "AuthAccount",
        back_populates="station",
        lazy="select",
        uselist=False,
    )

    @validates("name", "company_name", "location")
    def validate_station_text(self, key, value):
        cleaned_value = (value or "").strip()
        if not cleaned_value:
            raise ValueError(f"{key.replace('_', ' ').title()} is required")
        return cleaned_value

    @validates("manager_name")
    def validate_manager_name(self, key, value):
        if value is None:
            return None
        cleaned_value = value.strip()
        return cleaned_value or None

    @validates("manager_phone")
    def validate_manager_phone(self, key, value):
        if value is None:
            return None
        cleaned_value = value.strip().replace(" ", "")
        if not cleaned_value:
            return None
        if not PHONE_PATTERN.match(cleaned_value):
            raise ValueError("Management phoneline must be a valid phone number")
        return cleaned_value

    @validates("status")
    def validate_station_status(self, key, value):
        if value not in VALID_STATION_STATUSES:
            raise ValueError("Station status is invalid")
        return value

    def to_dict(self):
        branch_name = self.name
        company_name = self.company.name if self.company else self.company_name
        display_name = f"{company_name} {branch_name}".strip()

        return {
            "id": self.id,
            "name": self.name,
            "companyId": self.company_id,
            "company_id": self.company_id,
            "companyName": company_name,
            "company_name": company_name,
            "location": self.location,
            "managerName": self.manager_name,
            "manager_name": self.manager_name,
            "managerPhone": self.manager_phone,
            "manager_phone": self.manager_phone,
            "status": self.status,
            "branchName": branch_name,
            "displayName": display_name,
            "created_at": serialize_datetime(self.created_at),
            "updated_at": serialize_datetime(self.updated_at),
        }


class Transaction(db.Model):
    __tablename__ = "transactions"
    __table_args__ = (
        CheckConstraint("amount > 0", name="check_transactions_amount_positive"),
        CheckConstraint(
            "liters IS NULL OR liters > 0", name="check_transactions_liters_positive"
        ),
        CheckConstraint(
            "price_per_liter IS NULL OR price_per_liter >= 0",
            name="check_transactions_price_per_liter_non_negative",
        ),
        CheckConstraint(
            "status IN ('pending', 'approved', 'paid', 'cancelled')",
            name="check_transactions_status_valid",
        ),
        CheckConstraint(
            "payment_method IN ('credit', 'cash', 'mobile_money', 'card')",
            name="check_transactions_payment_method_valid",
        ),
    )

    id = db.Column(db.Integer, primary_key=True)
    rider_id = db.Column(db.Integer, db.ForeignKey("riders.id"), nullable=False)
    station_id = db.Column(db.Integer, db.ForeignKey("stations.id"), nullable=False)
    amount = db.Column(Numeric(10, 2), nullable=False)
    fuel_type = db.Column(db.String(20), nullable=False, default="petrol")
    liters = db.Column(Numeric(8, 2))
    price_per_liter = db.Column(Numeric(8, 2))
    status = db.Column(db.String(20), nullable=False, default="pending")
    payment_method = db.Column(db.String(30), nullable=False, default="credit")
    payment_date = db.Column(db.String(64))
    receipt_number = db.Column(db.String(50), unique=True)
    notes = db.Column(db.Text)
    created_at = db.Column(db.String(64), nullable=False, default=current_timestamp)
    updated_at = db.Column(
        db.String(64),
        nullable=False,
        default=current_timestamp,
        onupdate=current_timestamp,
    )

    rider = db.relationship("Rider", back_populates="transactions", lazy="joined")
    station = db.relationship("Station", back_populates="transactions", lazy="joined")

    @validates("amount")
    def validate_amount(self, key, value):
        numeric_value = float(value or 0)
        if numeric_value <= 0:
            raise ValueError("Amount must be greater than zero")
        return value

    @validates("liters")
    def validate_liters(self, key, value):
        if value is None:
            return None
        numeric_value = float(value)
        if numeric_value <= 0:
            raise ValueError("Liters must be greater than zero")
        return value

    @validates("price_per_liter")
    def validate_price_per_liter(self, key, value):
        if value is None:
            return None
        numeric_value = float(value)
        if numeric_value < 0:
            raise ValueError("Price per liter cannot be negative")
        return value

    @validates("status")
    def validate_transaction_status(self, key, value):
        if value not in VALID_TRANSACTION_STATUSES:
            raise ValueError("Transaction status is invalid")
        return value

    @validates("payment_method")
    def validate_payment_method(self, key, value):
        if value not in VALID_PAYMENT_METHODS:
            raise ValueError("Payment method is invalid")
        return value

    def to_dict(self):
        return {
            "id": self.id,
            "riderId": self.rider_id,
            "rider_id": self.rider_id,
            "stationId": self.station_id,
            "station_id": self.station_id,
            "amount": float(self.amount or 0),
            "fuelType": self.fuel_type,
            "fuel_type": self.fuel_type,
            "liters": float(self.liters) if self.liters is not None else None,
            "pricePerLiter": float(self.price_per_liter) if self.price_per_liter is not None else None,
            "price_per_liter": float(self.price_per_liter) if self.price_per_liter is not None else None,
            "status": self.status,
            "paymentMethod": self.payment_method,
            "payment_method": self.payment_method,
            "paymentDate": serialize_datetime(self.payment_date),
            "payment_date": serialize_datetime(self.payment_date),
            "receiptNumber": self.receipt_number,
            "receipt_number": self.receipt_number,
            "notes": self.notes,
            "created_at": serialize_datetime(self.created_at),
            "updated_at": serialize_datetime(self.updated_at),
        }


class AuthAccount(db.Model):
    __tablename__ = "auth_accounts"
    __table_args__ = (
        CheckConstraint(
            "role IN ('company', 'station', 'rider')",
            name="check_auth_accounts_role_valid",
        ),
        CheckConstraint(
            "approval_status IN ('pending', 'approved', 'rejected')",
            name="check_auth_accounts_approval_status_valid",
        ),
        CheckConstraint(
            "(station_id IS NULL) OR (rider_id IS NULL)",
            name="check_auth_accounts_single_profile_link",
        ),
    )

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey("companies.id"))
    company_name = db.Column(db.String(100), nullable=False, default="Total")
    station_id = db.Column(db.Integer, db.ForeignKey("stations.id"), unique=True)
    rider_id = db.Column(db.Integer, db.ForeignKey("riders.id"), unique=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    approval_status = db.Column(db.String(20), nullable=False, default="approved")
    approved_at = db.Column(db.String(64))
    approved_by_account_id = db.Column(db.Integer, db.ForeignKey("auth_accounts.id"))
    created_at = db.Column(db.String(64), nullable=False, default=current_timestamp)
    updated_at = db.Column(
        db.String(64),
        nullable=False,
        default=current_timestamp,
        onupdate=current_timestamp,
    )

    company = db.relationship("Company", back_populates="accounts", lazy="joined")
    station = db.relationship("Station", back_populates="account", lazy="joined")
    rider = db.relationship("Rider", back_populates="account", lazy="joined")
    approved_by = db.relationship("AuthAccount", remote_side=[id], lazy="joined")
    notifications = db.relationship(
        "Notification",
        back_populates="recipient_account",
        lazy="select",
        foreign_keys="Notification.recipient_account_id",
    )

    @validates("email")
    def validate_email(self, key, value):
        cleaned_value = (value or "").strip().lower()
        if not cleaned_value or "@" not in cleaned_value:
            raise ValueError("Email must be valid")
        return cleaned_value

    @validates("full_name", "company_name")
    def validate_account_text(self, key, value):
        cleaned_value = (value or "").strip()
        if not cleaned_value:
            raise ValueError(f"{key.replace('_', ' ').title()} is required")
        return cleaned_value

    @validates("role")
    def validate_role(self, key, value):
        if value not in VALID_ACCOUNT_ROLES:
            raise ValueError("Account role is invalid")
        return value

    @validates("approval_status")
    def validate_approval_status(self, key, value):
        if value not in VALID_ACCOUNT_APPROVAL_STATUSES:
            raise ValueError("Approval status is invalid")
        return value

    def set_password(self, raw_password):
        trimmed_password = (raw_password or "").strip()
        if len(trimmed_password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        self.password_hash = generate_password_hash(trimmed_password)

    def check_password(self, raw_password):
        return check_password_hash(self.password_hash, raw_password or "")

    def to_dict(self):
        company_name = self.company.name if self.company else self.company_name
        return {
            "id": self.id,
            "email": self.email,
            "role": self.role,
            "fullName": self.full_name,
            "companyId": self.company_id,
            "companyName": company_name,
            "stationId": self.station_id,
            "riderId": self.rider_id,
            "isActive": self.is_active,
            "approvalStatus": self.approval_status,
            "approvedAt": serialize_datetime(self.approved_at),
            "approvedByAccountId": self.approved_by_account_id,
            "created_at": serialize_datetime(self.created_at),
            "updated_at": serialize_datetime(self.updated_at),
        }

    def to_session_dict(self):
        payload = self.to_dict()

        if self.station:
            payload["station"] = {
                "id": self.station.id,
                "name": self.station.name,
                "displayName": f"{(self.station.company.name if self.station.company else self.station.company_name)} {self.station.name}".strip(),
                "location": self.station.location,
            }

        if self.company:
            payload["company"] = self.company.to_dict()

        if self.rider:
            payload["rider"] = {
                "id": self.rider.id,
                "name": self.rider.name,
                "licensePlate": self.rider.license_plate,
                "phone": self.rider.phone,
            }

        return payload


class Notification(db.Model):
    __tablename__ = "notifications"
    __table_args__ = (
        CheckConstraint(
            "type IN ('info', 'success', 'warning', 'approval')",
            name="check_notifications_type_valid",
        ),
    )

    id = db.Column(db.Integer, primary_key=True)
    recipient_account_id = db.Column(
        db.Integer, db.ForeignKey("auth_accounts.id"), nullable=False
    )
    title = db.Column(db.String(160), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(20), nullable=False, default="info")
    is_read = db.Column(db.Boolean, nullable=False, default=False)
    action_path = db.Column(db.String(255))
    created_at = db.Column(db.String(64), nullable=False, default=current_timestamp)
    updated_at = db.Column(
        db.String(64),
        nullable=False,
        default=current_timestamp,
        onupdate=current_timestamp,
    )

    recipient_account = db.relationship(
        "AuthAccount",
        back_populates="notifications",
        lazy="joined",
        foreign_keys=[recipient_account_id],
    )

    @validates("title", "message")
    def validate_text(self, key, value):
        cleaned_value = (value or "").strip()
        if not cleaned_value:
            raise ValueError(f"{key.title()} is required")
        return cleaned_value

    @validates("type")
    def validate_type(self, key, value):
        if value not in VALID_NOTIFICATION_TYPES:
            raise ValueError("Notification type is invalid")
        return value

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "message": self.message,
            "type": self.type,
            "isRead": self.is_read,
            "actionPath": self.action_path,
            "created_at": serialize_datetime(self.created_at),
            "updated_at": serialize_datetime(self.updated_at),
        }
