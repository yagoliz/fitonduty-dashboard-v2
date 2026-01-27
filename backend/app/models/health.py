from datetime import datetime
from datetime import date as DateType
from decimal import Decimal
from sqlalchemy import ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class HealthMetric(Base):
    __tablename__ = "health_metrics"
    __table_args__ = (UniqueConstraint("user_id", "date", name="health_metrics_user_date_key"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date: Mapped[DateType] = mapped_column(nullable=False)
    resting_hr: Mapped[int | None] = mapped_column(nullable=True)
    max_hr: Mapped[int | None] = mapped_column(nullable=True)
    sleep_hours: Mapped[Decimal | None] = mapped_column(Numeric(4, 2), nullable=True)
    hrv_rest: Mapped[int | None] = mapped_column(nullable=True)
    step_count: Mapped[int] = mapped_column(default=0)
    data_volume: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="health_metrics")
    heart_rate_zones: Mapped["HeartRateZone | None"] = relationship(
        back_populates="health_metric", uselist=False
    )
    movement_speeds: Mapped["MovementSpeed | None"] = relationship(
        back_populates="health_metric", uselist=False
    )


class HeartRateZone(Base):
    __tablename__ = "heart_rate_zones"

    id: Mapped[int] = mapped_column(primary_key=True)
    health_metric_id: Mapped[int] = mapped_column(
        ForeignKey("health_metrics.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    very_light_percent: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    light_percent: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    moderate_percent: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    intense_percent: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    beast_mode_percent: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)

    # Relationships
    health_metric: Mapped["HealthMetric"] = relationship(back_populates="heart_rate_zones")


class MovementSpeed(Base):
    __tablename__ = "movement_speeds"

    id: Mapped[int] = mapped_column(primary_key=True)
    health_metric_id: Mapped[int] = mapped_column(
        ForeignKey("health_metrics.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    walking_minutes: Mapped[int] = mapped_column(default=0)
    walking_fast_minutes: Mapped[int] = mapped_column(default=0)
    jogging_minutes: Mapped[int] = mapped_column(default=0)
    running_minutes: Mapped[int] = mapped_column(default=0)

    # Relationships
    health_metric: Mapped["HealthMetric"] = relationship(back_populates="movement_speeds")


class AnomalyScore(Base):
    __tablename__ = "anomaly_scores"
    __table_args__ = (
        UniqueConstraint("user_id", "date", "time_slot", name="anomaly_scores_user_date_slot_key"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date: Mapped[DateType] = mapped_column(nullable=False)
    time_slot: Mapped[int] = mapped_column(nullable=False)  # Minutes from midnight (0-1439)
    score: Mapped[Decimal] = mapped_column(Numeric(7, 4), nullable=False)
    label: Mapped[str | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


# Forward reference for type hints
from app.models.user import User  # noqa: E402