"""Delivery business service: recording labor outcomes, closing pregnancy, and creating newborn records."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.models import User
from app.common.enums import PregnancyStatus
from app.deliveries.schemas import DeliveryCreate
from app.exceptions import BusinessRuleError, NotFoundError
from app.models import Delivery, DeliveryComplication, Mother, Newborn, Pregnancy


class DeliveryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def record_delivery(self, data: DeliveryCreate, current_user: User) -> Delivery:
        preg_res = await self.db.execute(select(Pregnancy).where(Pregnancy.id == data.pregnancy_id))
        pregnancy = preg_res.scalar_one_or_none()
        if not pregnancy:
            raise NotFoundError("Pregnancy", str(data.pregnancy_id))

        if pregnancy.status != PregnancyStatus.ACTIVE.value:
            raise BusinessRuleError("Cannot record delivery for a pregnancy that is not active.")

        # Resolve mother
        m_res = await self.db.execute(select(Mother).where(Mother.id == pregnancy.mother_id))
        mother = m_res.scalar_one()

        delivery = Delivery(
            pregnancy_id=data.pregnancy_id,
            facility_id=data.facility_id or pregnancy.facility_id or current_user.facility_id,
            delivery_date=data.delivery_date,
            delivery_time=data.delivery_time,
            delivery_mode=data.delivery_mode,
            place_of_delivery=data.place_of_delivery,
            maternal_outcome=data.maternal_outcome,
            number_of_babies=data.number_of_babies,
            blood_loss_ml=data.blood_loss_ml,
            postpartum_haemorrhage=data.postpartum_haemorrhage,
            attended_by_name=data.attended_by_name,
            attended_by_cadre=data.attended_by_cadre,
            recorded_by_id=current_user.id,
            notes=data.notes,
        )
        self.db.add(delivery)
        await self.db.flush()

        # Update pregnancy status to DELIVERED
        pregnancy.status = PregnancyStatus.DELIVERED.value
        pregnancy.outcome_date = data.delivery_date
        pregnancy.updated_at = datetime.now(timezone.utc)

        # Create individual newborn records
        for nb_in in data.newborns:
            nb_code = f"{mother.mother_id}-B{nb_in.birth_order}"
            newborn = Newborn(
                newborn_id=nb_code,
                delivery_id=delivery.id,
                mother_id=mother.id,
                birth_order=nb_in.birth_order,
                first_name=nb_in.first_name,
                sex=nb_in.sex,
                birth_weight_grams=nb_in.birth_weight_grams,
                length_cm=nb_in.length_cm,
                head_circumference_cm=nb_in.head_circumference_cm,
                apgar_1min=nb_in.apgar_1min,
                apgar_5min=nb_in.apgar_5min,
                apgar_10min=nb_in.apgar_10min,
                resuscitation_performed=nb_in.resuscitation_performed,
                immediate_complications=nb_in.immediate_complications,
                status=nb_in.status,
            )
            self.db.add(newborn)

        await self.db.commit()

        # Reload with newborns
        query = (
            select(Delivery)
            .options(selectinload(Delivery.newborns))
            .where(Delivery.id == delivery.id)
        )
        res = await self.db.execute(query)
        return res.scalar_one()
