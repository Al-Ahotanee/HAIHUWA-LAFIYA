"""Delivery, newborn and PNC validation schemas."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from pydantic import BaseModel, Field


class NewbornCreate(BaseModel):
    first_name: str | None = None
    birth_order: int = Field(default=1, ge=1)
    sex: str = Field(..., description="male | female | ambiguous")
    birth_weight_grams: int = Field(..., ge=400, le=7000)
    length_cm: float | None = None
    head_circumference_cm: float | None = None
    apgar_1min: int | None = Field(None, ge=0, le=10)
    apgar_5min: int | None = Field(None, ge=0, le=10)
    apgar_10min: int | None = Field(None, ge=0, le=10)
    resuscitation_performed: bool = False
    immediate_complications: str | None = None
    status: str = Field(default="alive", description="alive | stillbirth_fresh | stillbirth_macerated | deceased")


class DeliveryCreate(BaseModel):
    pregnancy_id: uuid.UUID
    facility_id: uuid.UUID | None = None
    delivery_date: date = Field(default_factory=date.today)
    delivery_time: str | None = None
    delivery_mode: str = Field(default="vaginal", description="vaginal | caesarean | assisted")
    place_of_delivery: str = Field(default="facility", description="facility | home | en_route | other")
    maternal_outcome: str = Field(default="alive", description="alive | deceased | critically_ill")
    number_of_babies: int = Field(default=1, ge=1, le=5)
    blood_loss_ml: int | None = None
    postpartum_haemorrhage: bool = False
    attended_by_name: str | None = None
    attended_by_cadre: str | None = None
    notes: str | None = None

    newborns: list[NewbornCreate] = []


class NewbornResponse(BaseModel):
    id: uuid.UUID
    newborn_id: str
    delivery_id: uuid.UUID
    mother_id: uuid.UUID
    birth_order: int
    first_name: str | None = None
    sex: str
    birth_weight_grams: int
    apgar_1min: int | None = None
    apgar_5min: int | None = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class DeliveryResponse(BaseModel):
    id: uuid.UUID
    pregnancy_id: uuid.UUID
    delivery_date: date
    delivery_mode: str
    place_of_delivery: str
    maternal_outcome: str
    number_of_babies: int
    postpartum_haemorrhage: bool
    notes: str | None = None
    newborns: list[NewbornResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True
