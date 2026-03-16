import re
from datetime import datetime

from sqlalchemy import CheckConstraint, Numeric
from sqlalchemy.orm import validates
from app.database.db import db


PHONE_PATTERN = re.compile(r"^\+?[0-9]{9,15}$")
VALID_RIDER_STATUSES = {"active", "suspended", "inactive"}
VALID_STATION_STATUSES = {"active", "closed", "maintenance"}
VALID_TRANSACTION_STATUSES = {"pending", "approved", "paid", "cancelled"}
VALID_PAYMENT_METHODS = {"credit", "cash", "mobile_money", "card"}


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
        display_name = f"{self.company_name} {branch_name}".strip()

        return {
            "id": self.id,
            "name": self.name,
            "companyName": self.company_name,
            "company_name": self.company_name,
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
