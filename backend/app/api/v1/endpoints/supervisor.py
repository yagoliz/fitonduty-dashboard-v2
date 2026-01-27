from datetime import date

from fastapi import APIRouter, Query
from sqlalchemy import func, text

from app.api.deps import DbSession, SupervisorUser
from app.models.user import Group
from app.models.health import HealthMetric
from app.models.questionnaire import QuestionnaireData
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/supervisor", tags=["supervisor"])


@router.get("/group-info")
def get_supervisor_group_info(
    db: DbSession,
    current_user: SupervisorUser,
) -> dict:
    """Get the supervisor's assigned group info."""
    if not current_user.groups:
        raise NotFoundError("Group assignment")

    group = current_user.groups[0]
    participant_count = len([u for u in group.users if u.role == "participant"])

    return {
        "id": group.id,
        "group_name": group.group_name,
        "participant_count": participant_count,
    }


@router.get("/group-data")
def get_supervisor_group_data(
    db: DbSession,
    current_user: SupervisorUser,
    start_date: date = Query(...),
    end_date: date = Query(...),
) -> list[dict]:
    """Get aggregated health data for the supervisor's group."""
    if not current_user.groups:
        raise NotFoundError("Group assignment")

    group = current_user.groups[0]
    participant_ids = [u.id for u in group.users if u.role == "participant"]

    if not participant_ids:
        return []

    # Query for daily aggregated health metrics
    result = db.execute(
        text("""
            WITH date_series AS (
                SELECT generate_series(CAST(:start_date AS date), CAST(:end_date AS date), '1 day'::interval)::date AS date
            ),
            daily_health AS (
                SELECT
                    hm.date,
                    COUNT(*) as physio_count,
                    AVG(hm.resting_hr) as avg_resting_hr,
                    AVG(hm.max_hr) as avg_max_hr,
                    AVG(CASE WHEN hm.sleep_hours > 0.5 THEN hm.sleep_hours END) as avg_sleep_hours,
                    AVG(CASE WHEN hm.hrv_rest > 0 THEN hm.hrv_rest END) as avg_hrv_rest,
                    AVG(hm.step_count) as avg_step_count
                FROM health_metrics hm
                WHERE hm.user_id = ANY(:participant_ids)
                    AND hm.date BETWEEN :start_date AND :end_date
                GROUP BY hm.date
            ),
            daily_questionnaire AS (
                SELECT
                    qd.date,
                    COUNT(*) as questionnaire_count,
                    AVG(qd.perceived_sleep_quality) as avg_sleep_quality,
                    AVG(qd.fatigue_level) as avg_fatigue_level,
                    AVG(qd.motivation_level) as avg_motivation_level
                FROM questionnaire_data qd
                WHERE qd.user_id = ANY(:participant_ids)
                    AND qd.date BETWEEN :start_date AND :end_date
                GROUP BY qd.date
            )
            SELECT
                ds.date,
                COALESCE(dh.physio_count, 0) as physio_data_count,
                dh.avg_resting_hr,
                dh.avg_max_hr,
                dh.avg_sleep_hours,
                dh.avg_hrv_rest,
                dh.avg_step_count,
                COALESCE(dq.questionnaire_count, 0) as questionnaire_data_count,
                dq.avg_sleep_quality,
                dq.avg_fatigue_level,
                dq.avg_motivation_level
            FROM date_series ds
            LEFT JOIN daily_health dh ON ds.date = dh.date
            LEFT JOIN daily_questionnaire dq ON ds.date = dq.date
            ORDER BY ds.date
        """),
        {
            "start_date": start_date,
            "end_date": end_date,
            "participant_ids": participant_ids,
        },
    ).fetchall()

    return [
        {
            "date": str(row.date),
            "group_id": group.id,
            "group_name": group.group_name,
            "physio_data_count": row.physio_data_count,
            "avg_resting_hr": float(row.avg_resting_hr) if row.avg_resting_hr else None,
            "avg_max_hr": float(row.avg_max_hr) if row.avg_max_hr else None,
            "avg_sleep_hours": float(row.avg_sleep_hours) if row.avg_sleep_hours else None,
            "avg_hrv_rest": float(row.avg_hrv_rest) if row.avg_hrv_rest else None,
            "avg_step_count": float(row.avg_step_count) if row.avg_step_count else None,
            "questionnaire_data_count": row.questionnaire_data_count,
            "avg_sleep_quality": float(row.avg_sleep_quality) if row.avg_sleep_quality else None,
            "avg_fatigue_level": float(row.avg_fatigue_level) if row.avg_fatigue_level else None,
            "avg_motivation_level": float(row.avg_motivation_level) if row.avg_motivation_level else None,
        }
        for row in result
    ]


@router.get("/participants")
def get_supervisor_participants(
    db: DbSession,
    current_user: SupervisorUser,
) -> list[dict]:
    """Get list of participants in the supervisor's group."""
    if not current_user.groups:
        raise NotFoundError("Group assignment")

    group = current_user.groups[0]
    participants = [u for u in group.users if u.role == "participant"]

    return [
        {
            "id": p.id,
            "username": p.username,
            "is_active": p.is_active,
        }
        for p in participants
    ]