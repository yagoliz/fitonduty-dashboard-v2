from datetime import date
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.health import HealthMetric, HeartRateZone, MovementSpeed, AnomalyScore
from app.models.questionnaire import QuestionnaireData


class HealthService:
    def __init__(self, db: Session):
        self.db = db

    def get_metrics(
        self,
        user_id: int,
        start_date: date,
        end_date: date,
    ) -> list[HealthMetric]:
        """Get health metrics for a user within a date range."""
        return (
            self.db.query(HealthMetric)
            .filter(
                HealthMetric.user_id == user_id,
                HealthMetric.date >= start_date,
                HealthMetric.date <= end_date,
            )
            .order_by(HealthMetric.date)
            .all()
        )

    def get_daily_metrics(self, user_id: int, target_date: date) -> HealthMetric | None:
        """Get health metrics for a specific day with zones and movement."""
        return (
            self.db.query(HealthMetric)
            .options(
                joinedload(HealthMetric.heart_rate_zones),
                joinedload(HealthMetric.movement_speeds),
            )
            .filter(
                HealthMetric.user_id == user_id,
                HealthMetric.date == target_date,
            )
            .first()
        )

    def get_latest_data_date(self, user_id: int) -> date | None:
        """Get the most recent date with data for a user."""
        result = (
            self.db.query(func.max(HealthMetric.date))
            .filter(HealthMetric.user_id == user_id)
            .scalar()
        )
        return result

    def get_anomalies(
        self,
        user_id: int,
        target_date: date | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> list[AnomalyScore]:
        """Get anomaly scores for a user."""
        query = self.db.query(AnomalyScore).filter(AnomalyScore.user_id == user_id)

        if target_date:
            query = query.filter(AnomalyScore.date == target_date)
        elif start_date and end_date:
            query = query.filter(
                AnomalyScore.date >= start_date,
                AnomalyScore.date <= end_date,
            )

        return query.order_by(AnomalyScore.date, AnomalyScore.time_slot).all()

    def get_questionnaire_data(
        self,
        user_id: int,
        start_date: date,
        end_date: date,
    ) -> list[QuestionnaireData]:
        """Get questionnaire data for a user within a date range."""
        return (
            self.db.query(QuestionnaireData)
            .filter(
                QuestionnaireData.user_id == user_id,
                QuestionnaireData.date >= start_date,
                QuestionnaireData.date <= end_date,
            )
            .order_by(QuestionnaireData.date)
            .all()
        )