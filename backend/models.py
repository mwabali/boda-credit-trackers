from datetime import datetime

from sqlalchemy import Numeric
from app.database.db import db


def serialize_datetime(value):
    if value is None:
        return None

    if isinstance(value, str):
        return value

    if isinstance(value, datetime):
        return value.isoformat()

    return str(value)


class Rider(db.Model):
    __tablename__ = "riders"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False, unique=True)
    license_plate = db.Column(db.String(20), nullable=False)
    national_id = db.Column(db.String(50))
    credit_limit = db.Column(Numeric(12, 2), nullable=False, default=100000.00)
    current_balance = db.Column(Numeric(12, 2), nullable=False, default=0.00)
    status = db.Column(db.String(20), nullable=False, default="active")
    created_at = db.Column(db.String(64), nullable=False)
    updated_at = db.Column(db.String(64), nullable=False)

    transactions = db.relationship("Transaction", back_populates="rider", lazy="select")

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

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    company_name = db.Column(db.String(100), nullable=False, default="Total")
    location = db.Column(db.String(200), nullable=False)
    manager_name = db.Column(db.String(100))
    manager_phone = db.Column(db.String(20))
    status = db.Column(db.String(20), nullable=False, default="active")
    created_at = db.Column(db.String(64), nullable=False)
    updated_at = db.Column(db.String(64), nullable=False)

    transactions = db.relationship("Transaction", back_populates="station", lazy="select")

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
    created_at = db.Column(db.String(64), nullable=False)
    updated_at = db.Column(db.String(64), nullable=False)

    rider = db.relationship("Rider", back_populates="transactions", lazy="joined")
    station = db.relationship("Station", back_populates="transactions", lazy="joined")

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
