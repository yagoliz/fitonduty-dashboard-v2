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

    def _get_max_daily_volume_mb(
        self,
        user_id: int,
        start_date: date,
        end_date: date,
    ) -> float:
        """Get the maximum daily data volume (in MB) across all participants in the user's group."""
        result = self.db.execute(
            text("""
                SELECT COALESCE(MAX(hm.data_volume), 0) / 1024.0 / 1024.0 AS max_daily_mb
                FROM health_metrics hm
                JOIN user_groups ug ON hm.user_id = ug.user_id
                WHERE ug.group_id IN (
                    SELECT group_id FROM user_groups WHERE user_id = :user_id
                )
                AND hm.date BETWEEN :start_date AND :end_date
                AND hm.date NOT IN (
                    SELECT ed.date
                    FROM excluded_days ed
                    JOIN user_groups ug2 ON ed.group_id = ug2.group_id
                    WHERE ug2.user_id = :user_id
                )
            """),
            {"user_id": user_id, "start_date": start_date, "end_date": end_date},
        ).fetchone()

        return float(result.max_daily_mb) if result and result.max_daily_mb else 0.0

    def _calculate_completion_rate(
        self,
        data_volume_mb: float,
        max_daily_volume_mb: float,
        total_possible_days: int,
    ) -> float:
        """Calculate completion rate: (actual_volume / (max_daily_volume * total_days)) * 100"""
        if max_daily_volume_mb <= 0 or total_possible_days <= 0:
            return 0.0
        ideal_total = max_daily_volume_mb * total_possible_days
        return round((data_volume_mb / ideal_total) * 100, 2)

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

        # Get group rankings to find user's rank based on completion rate
        group_rankings = self.get_group_rankings(user_id, start_date, end_date)

        # Find the user's rank in the completion-rate-based ranking
        user_ranking = next((r for r in group_rankings if r.participant_id == user_id), None)

        if user_ranking:
            return RankingResponse(
                participant_id=result.participant_id,
                username=result.username,
                rank=user_ranking.rank,
                total_participants=result.total_participants,
                data_volume_mb=user_ranking.data_volume_mb,
                completion_rate=user_ranking.completion_rate,
            )

        # Fallback if user not found in group rankings
        data_volume_mb = float(result.data_volume_mb or 0)
        total_possible_days = int(result.total_possible_days or 0)
        max_daily_volume_mb = self._get_max_daily_volume_mb(user_id, start_date, end_date)
        completion_rate = self._calculate_completion_rate(data_volume_mb, max_daily_volume_mb, total_possible_days)

        return RankingResponse(
            participant_id=result.participant_id,
            username=result.username,
            rank=result.rank,
            total_participants=result.total_participants,
            data_volume_mb=data_volume_mb,
            completion_rate=completion_rate,
        )

    def _get_total_possible_days(
        self,
        user_id: int,
        start_date: date,
        end_date: date,
    ) -> int:
        """Get total possible days (date range minus excluded days)."""
        result = self.db.execute(
            text("""
                SELECT
                    (:end_date - :start_date + 1) - COALESCE(
                        (SELECT COUNT(*)
                         FROM excluded_days ed
                         JOIN user_groups ug ON ed.group_id = ug.group_id
                         WHERE ug.user_id = :user_id
                         AND ed.date BETWEEN :start_date AND :end_date),
                        0
                    ) AS total_days
            """),
            {"user_id": user_id, "start_date": start_date, "end_date": end_date},
        ).fetchone()

        return int(result.total_days) if result and result.total_days else 0

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

        # Get max daily volume and total days for completion rate calculation
        max_daily_volume_mb = self._get_max_daily_volume_mb(user_id, start_date, end_date)
        total_possible_days = self._get_total_possible_days(user_id, start_date, end_date)

        # Calculate completion rates and sort by them
        participant_data = []
        for row in result:
            data_volume_mb = float(row.data_volume_mb or 0)
            completion_rate = self._calculate_completion_rate(data_volume_mb, max_daily_volume_mb, total_possible_days)
            participant_data.append({
                "participant_id": row.participant_id,
                "username": row.username,
                "data_volume_mb": data_volume_mb,
                "completion_rate": completion_rate,
            })

        # Sort by completion rate (highest first) and assign ranks
        participant_data.sort(key=lambda x: x["completion_rate"], reverse=True)

        return [
            GroupRankingResponse(
                participant_id=p["participant_id"],
                username=p["username"],
                rank=i,
                data_volume_mb=p["data_volume_mb"],
                completion_rate=p["completion_rate"],
            )
            for i, p in enumerate(participant_data, 1)
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