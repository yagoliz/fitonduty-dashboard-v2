from datetime import datetime
from datetime import date as DateType
from decimal import Decimal
from sqlalchemy import ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class QuestionnaireData(Base):
    __tablename__ = "questionnaire_data"
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="questionnaire_data_user_date_key"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date: Mapped[DateType] = mapped_column(nullable=False)

    # Original subjective fields
    perceived_sleep_quality: Mapped[int | None] = mapped_column(nullable=True)
    fatigue_level: Mapped[int | None] = mapped_column(nullable=True)
    motivation_level: Mapped[int | None] = mapped_column(nullable=True)

    # Extended fields from migration 007
    sleep_hours: Mapped[Decimal | None] = mapped_column(Numeric(4, 2), nullable=True)
    recovery_morning: Mapped[int | None] = mapped_column(nullable=True)
    fatigue_24h: Mapped[int | None] = mapped_column(nullable=True)
    fit_24h: Mapped[int | None] = mapped_column(nullable=True)
    mentalenergy_24h: Mapped[int | None] = mapped_column(nullable=True)
    physicalwellness_24h: Mapped[int | None] = mapped_column(nullable=True)
    drugs_kind: Mapped[int | None] = mapped_column(nullable=True)
    drugs_timepoint: Mapped[int | None] = mapped_column(nullable=True)
    sickness: Mapped[int | None] = mapped_column(nullable=True)
    sickness_impact: Mapped[int | None] = mapped_column(nullable=True)

    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)