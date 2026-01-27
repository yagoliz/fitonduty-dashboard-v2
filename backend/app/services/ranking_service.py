from datetime import date
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.schemas.ranking import (
    RankingResponse,
    GroupRankingResponse,
    RankingHistoryResponse,
    QuestionnaireRankingResponse,
)


class RankingService:
    def __init__(self, db: Session):
        self.db = db

    def get_data_consistency_rank(
        self,
        user_id: int,
        start_date: date,
        end_date: date,
    ) -> RankingResponse | None:
        """Get the data consistency ranking for a user using the PostgreSQL function."""
        result = self.db.execute(
            text("SELECT * FROM get_participant_data_consistency_rank(:user_id, :start_date, :end_date)"),
            {"user_id": user_id, "start_date": start_date, "end_date": end_date},
        ).fetchone()

        if not result:
            return None

        return RankingResponse(
            participant_id=result.participant_id,
            username=result.username,
            rank=result.rank,
            total_participants=result.total_participants,
            data_volume_mb=float(result.data_volume_mb or 0),
        )

    def get_group_rankings(
        self,
        user_id: int,
        start_date: date,
        end_date: date,
    ) -> list[GroupRankingResponse]:
        """Get rankings for all participants in the user's group."""
        result = self.db.execute(
            text("SELECT * FROM get_group_participants_ranking(:user_id, :start_date, :end_date)"),
            {"user_id": user_id, "start_date": start_date, "end_date": end_date},
        ).fetchall()

        return [
            GroupRankingResponse(
                participant_id=row.participant_id,
                username=row.username,
                rank=row.rank,
                data_volume_mb=float(row.data_volume_mb or 0),
            )
            for row in result
        ]

    def get_ranking_history(
        self,
        user_id: int,
        start_date: date,
        end_date: date,
    ) -> list[dict]:
        """Get historical ranking data for calculating rank over time."""
        result = self.db.execute(
            text("SELECT * FROM get_group_historical_data(:user_id, :start_date, :end_date)"),
            {"user_id": user_id, "start_date": start_date, "end_date": end_date},
        ).fetchall()

        return [
            {
                "participant_id": row.participant_id,
                "date": row.date,
            }
            for row in result
        ]

    def get_questionnaire_rank(
        self,
        user_id: int,
        start_date: date,
        end_date: date,
    ) -> QuestionnaireRankingResponse | None:
        """Get questionnaire completion ranking for a user."""
        result = self.db.execute(
            text("SELECT * FROM get_participant_questionnaire_rank(:user_id, :start_date, :end_date)"),
            {"user_id": user_id, "start_date": start_date, "end_date": end_date},
        ).fetchone()

        if not result:
            return None

        return QuestionnaireRankingResponse(
            participant_id=result.participant_id,
            username=result.username,
            rank=result.rank,
            total_participants=result.total_participants,
            completion_rate=float(result.completion_rate or 0),
            questionnaire_days=result.questionnaire_days or 0,
        )

    def get_group_questionnaire_rankings(
        self,
        user_id: int,
        start_date: date,
        end_date: date,
    ) -> list[QuestionnaireRankingResponse]:
        """Get questionnaire rankings for all participants in the user's group."""
        result = self.db.execute(
            text("SELECT * FROM get_group_questionnaire_ranking(:user_id, :start_date, :end_date)"),
            {"user_id": user_id, "start_date": start_date, "end_date": end_date},
        ).fetchall()

        return [
            QuestionnaireRankingResponse(
                participant_id=row.participant_id,
                username=row.username,
                rank=row.rank,
                total_participants=len(result),
                completion_rate=float(row.completion_rate or 0),
                questionnaire_days=row.questionnaire_days or 0,
            )
            for row in result
        ]