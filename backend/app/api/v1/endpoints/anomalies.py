from datetime import date

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession
from app.core.exceptions import AuthorizationError
from app.schemas.health import AnomalyScoreResponse
from app.services.health_service import HealthService

router = APIRouter(prefix="/anomalies", tags=["anomalies"])


def _can_access_user_data(current_user, target_user_id: int) -> bool:
    """Check if the current user can access another user's data."""
    if current_user.is_admin:
        return True
    if current_user.id == target_user_id:
        return True
    if current_user.is_supervisor:
        for group in current_user.groups:
            for user in group.users:
                if user.id == target_user_id:
                    return True
    return False


def _time_slot_to_string(time_slot: int) -> str:
    """Convert time slot (minutes from midnight) to HH:MM string."""
    hours = time_slot // 60
    minutes = time_slot % 60
    return f"{hours:02d}:{minutes:02d}"


@router.get("/{user_id}", response_model=list[AnomalyScoreResponse])
def get_anomalies_for_date(
    user_id: int,
    db: DbSession,
    current_user: CurrentUser,
    target_date: date = Query(..., alias="date"),
) -> list[AnomalyScoreResponse]:
    """Get anomaly scores for a specific date."""
    if not _can_access_user_data(current_user, user_id):
        raise AuthorizationError("Cannot access this user's data")

    service = HealthService(db)
    anomalies = service.get_anomalies(user_id, target_date=target_date)

    return [
        AnomalyScoreResponse(
            date=a.date,
            time_slot=a.time_slot,
            score=float(a.score),
            label=a.label,
            time_string=_time_slot_to_string(a.time_slot),
        )
        for a in anomalies
    ]


@router.get("/{user_id}/range", response_model=list[AnomalyScoreResponse])
def get_anomalies_for_range(
    user_id: int,
    db: DbSession,
    current_user: CurrentUser,
    start_date: date = Query(...),
    end_date: date = Query(...),
) -> list[AnomalyScoreResponse]:
    """Get anomaly scores for a date range (for heatmap visualization)."""
    if not _can_access_user_data(current_user, user_id):
        raise AuthorizationError("Cannot access this user's data")

    service = HealthService(db)
    anomalies = service.get_anomalies(user_id, start_date=start_date, end_date=end_date)

    return [
        AnomalyScoreResponse(
            date=a.date,
            time_slot=a.time_slot,
            score=float(a.score),
            label=a.label,
            time_string=_time_slot_to_string(a.time_slot),
        )
        for a in anomalies
    ]