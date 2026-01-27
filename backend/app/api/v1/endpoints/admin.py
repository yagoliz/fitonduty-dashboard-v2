from datetime import date
from collections import defaultdict

from fastapi import APIRouter, Query
from sqlalchemy import text

from app.api.deps import DbSession, AdminUser
from app.models.user import Group
from app.core.exceptions import NotFoundError
from app.schemas.admin import (
    GroupDailyData,
    GroupComparisonData,
    GroupsComparisonResponse,
    GroupAggregatedResponse,
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/groups/comparison", response_model=GroupsComparisonResponse)
def get_groups_comparison(
    db: DbSession,
    current_user: AdminUser,
    start_date: date = Query(...),
    end_date: date = Query(...),
) -> GroupsComparisonResponse:
    """Get aggregated health data for all groups for comparison."""
    result = db.execute(
        text("""
            WITH date_series AS (
                SELECT generate_series(CAST(:start_date AS date), CAST(:end_date AS date), '1 day'::interval)::date AS date
            ),
            group_participants AS (
                SELECT g.id as group_id, g.group_name, u.id as user_id
                FROM groups g
                JOIN user_groups ug ON g.id = ug.group_id
                JOIN users u ON ug.user_id = u.id
                WHERE u.role = 'participant' AND u.is_active = true
            ),
            daily_group_health AS (
                SELECT
                    gp.group_id,
                    gp.group_name,
                    hm.date,
                    COUNT(*) as physio_count,
                    COUNT(DISTINCT hm.user_id) as participants_reporting,
                    AVG(hm.resting_hr) as avg_resting_hr,
                    AVG(hm.max_hr) as avg_max_hr,
                    AVG(CASE WHEN hm.sleep_hours > 0.5 THEN hm.sleep_hours END) as avg_sleep_hours,
                    AVG(CASE WHEN hm.hrv_rest > 0 THEN hm.hrv_rest END) as avg_hrv_rest,
                    AVG(hm.step_count) as avg_step_count
                FROM group_participants gp
                JOIN health_metrics hm ON gp.user_id = hm.user_id
                WHERE hm.date BETWEEN :start_date AND :end_date
                GROUP BY gp.group_id, gp.group_name, hm.date
            ),
            daily_group_questionnaire AS (
                SELECT
                    gp.group_id,
                    qd.date,
                    COUNT(*) as questionnaire_count,
                    AVG(qd.perceived_sleep_quality) as avg_sleep_quality,
                    AVG(qd.fatigue_level) as avg_fatigue_level,
                    AVG(qd.motivation_level) as avg_motivation_level
                FROM group_participants gp
                JOIN questionnaire_data qd ON gp.user_id = qd.user_id
                WHERE qd.date BETWEEN :start_date AND :end_date
                GROUP BY gp.group_id, qd.date
            ),
            group_totals AS (
                SELECT group_id, group_name, COUNT(*) as total_participants
                FROM group_participants
                GROUP BY group_id, group_name
            )
            SELECT
                gt.group_id,
                gt.group_name,
                gt.total_participants,
                ds.date,
                COALESCE(dgh.physio_count, 0) as physio_count,
                COALESCE(dgh.participants_reporting, 0) as participants_reporting,
                dgh.avg_resting_hr,
                dgh.avg_max_hr,
                dgh.avg_sleep_hours,
                dgh.avg_hrv_rest,
                dgh.avg_step_count,
                COALESCE(dgq.questionnaire_count, 0) as questionnaire_count,
                dgq.avg_sleep_quality,
                dgq.avg_fatigue_level,
                dgq.avg_motivation_level
            FROM group_totals gt
            CROSS JOIN date_series ds
            LEFT JOIN daily_group_health dgh ON gt.group_id = dgh.group_id AND ds.date = dgh.date
            LEFT JOIN daily_group_questionnaire dgq ON gt.group_id = dgq.group_id AND ds.date = dgq.date
            ORDER BY gt.group_name, ds.date
        """),
        {"start_date": start_date, "end_date": end_date},
    ).fetchall()

    # Group results by group_id
    groups_data: dict[int, GroupComparisonData] = {}
    for row in result:
        group_id = row.group_id
        if group_id not in groups_data:
            groups_data[group_id] = GroupComparisonData(
                group_id=group_id,
                group_name=row.group_name,
                total_participants=row.total_participants,
                daily_data=[],
            )
        groups_data[group_id].daily_data.append(
            GroupDailyData(
                date=row.date,
                physio_count=row.physio_count,
                participants_reporting=row.participants_reporting,
                avg_resting_hr=float(row.avg_resting_hr) if row.avg_resting_hr else None,
                avg_max_hr=float(row.avg_max_hr) if row.avg_max_hr else None,
                avg_sleep_hours=float(row.avg_sleep_hours) if row.avg_sleep_hours else None,
                avg_hrv_rest=float(row.avg_hrv_rest) if row.avg_hrv_rest else None,
                avg_step_count=float(row.avg_step_count) if row.avg_step_count else None,
                questionnaire_count=row.questionnaire_count,
                avg_sleep_quality=float(row.avg_sleep_quality) if row.avg_sleep_quality else None,
                avg_fatigue_level=float(row.avg_fatigue_level) if row.avg_fatigue_level else None,
                avg_motivation_level=float(row.avg_motivation_level) if row.avg_motivation_level else None,
            )
        )

    return GroupsComparisonResponse(groups=list(groups_data.values()))


@router.get("/groups/{group_id}/aggregated", response_model=GroupAggregatedResponse)
def get_group_aggregated(
    group_id: int,
    db: DbSession,
    current_user: AdminUser,
    start_date: date = Query(...),
    end_date: date = Query(...),
) -> GroupAggregatedResponse:
    """Get aggregated health data for a specific group."""
    # Verify group exists
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise NotFoundError("Group")

    # Get participant count
    participant_count = len([u for u in group.users if u.role == "participant" and u.is_active])

    result = db.execute(
        text("""
            WITH date_series AS (
                SELECT generate_series(CAST(:start_date AS date), CAST(:end_date AS date), '1 day'::interval)::date AS date
            ),
            group_participants AS (
                SELECT u.id as user_id
                FROM users u
                JOIN user_groups ug ON u.id = ug.user_id
                WHERE ug.group_id = :group_id AND u.role = 'participant' AND u.is_active = true
            ),
            daily_health AS (
                SELECT
                    hm.date,
                    COUNT(*) as physio_count,
                    COUNT(DISTINCT hm.user_id) as participants_reporting,
                    AVG(hm.resting_hr) as avg_resting_hr,
                    AVG(hm.max_hr) as avg_max_hr,
                    AVG(CASE WHEN hm.sleep_hours > 0.5 THEN hm.sleep_hours END) as avg_sleep_hours,
                    AVG(CASE WHEN hm.hrv_rest > 0 THEN hm.hrv_rest END) as avg_hrv_rest,
                    AVG(hm.step_count) as avg_step_count
                FROM group_participants gp
                JOIN health_metrics hm ON gp.user_id = hm.user_id
                WHERE hm.date BETWEEN :start_date AND :end_date
                GROUP BY hm.date
            ),
            daily_questionnaire AS (
                SELECT
                    qd.date,
                    COUNT(*) as questionnaire_count,
                    AVG(qd.perceived_sleep_quality) as avg_sleep_quality,
                    AVG(qd.fatigue_level) as avg_fatigue_level,
                    AVG(qd.motivation_level) as avg_motivation_level
                FROM group_participants gp
                JOIN questionnaire_data qd ON gp.user_id = qd.user_id
                WHERE qd.date BETWEEN :start_date AND :end_date
                GROUP BY qd.date
            )
            SELECT
                ds.date,
                COALESCE(dh.physio_count, 0) as physio_count,
                COALESCE(dh.participants_reporting, 0) as participants_reporting,
                dh.avg_resting_hr,
                dh.avg_max_hr,
                dh.avg_sleep_hours,
                dh.avg_hrv_rest,
                dh.avg_step_count,
                COALESCE(dq.questionnaire_count, 0) as questionnaire_count,
                dq.avg_sleep_quality,
                dq.avg_fatigue_level,
                dq.avg_motivation_level
            FROM date_series ds
            LEFT JOIN daily_health dh ON ds.date = dh.date
            LEFT JOIN daily_questionnaire dq ON ds.date = dq.date
            ORDER BY ds.date
        """),
        {"group_id": group_id, "start_date": start_date, "end_date": end_date},
    ).fetchall()

    daily_data = [
        GroupDailyData(
            date=row.date,
            physio_count=row.physio_count,
            participants_reporting=row.participants_reporting,
            avg_resting_hr=float(row.avg_resting_hr) if row.avg_resting_hr else None,
            avg_max_hr=float(row.avg_max_hr) if row.avg_max_hr else None,
            avg_sleep_hours=float(row.avg_sleep_hours) if row.avg_sleep_hours else None,
            avg_hrv_rest=float(row.avg_hrv_rest) if row.avg_hrv_rest else None,
            avg_step_count=float(row.avg_step_count) if row.avg_step_count else None,
            questionnaire_count=row.questionnaire_count,
            avg_sleep_quality=float(row.avg_sleep_quality) if row.avg_sleep_quality else None,
            avg_fatigue_level=float(row.avg_fatigue_level) if row.avg_fatigue_level else None,
            avg_motivation_level=float(row.avg_motivation_level) if row.avg_motivation_level else None,
        )
        for row in result
    ]

    return GroupAggregatedResponse(
        group_id=group_id,
        group_name=group.group_name,
        total_participants=participant_count,
        daily_data=daily_data,
    )