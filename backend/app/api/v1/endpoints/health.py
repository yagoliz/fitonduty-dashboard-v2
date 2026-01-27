from datetime import date

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession
from app.core.exceptions import AuthorizationError, NotFoundError
from app.schemas.health import (
    DailyHealthResponse,
    HealthMetricResponse,
    HeartRateZonesResponse,
    MovementSpeedsResponse,
)
from app.schemas.questionnaire import QuestionnaireResponse
from app.services.health_service import HealthService

router = APIRouter(prefix="/health", tags=["health"])


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


@router.get("/{user_id}/metrics", response_model=list[HealthMetricResponse])
def get_health_metrics(
    user_id: int,
    db: DbSession,
    current_user: CurrentUser,
    start_date: date = Query(...),
    end_date: date = Query(...),
) -> list[HealthMetricResponse]:
    """Get health metrics for a user within a date range."""
    if not _can_access_user_data(current_user, user_id):
        raise AuthorizationError("Cannot access this user's data")

    service = HealthService(db)
    metrics = service.get_metrics(user_id, start_date, end_date)
    return [HealthMetricResponse.model_validate(m) for m in metrics]


@router.get("/{user_id}/daily/{target_date}", response_model=DailyHealthResponse)
def get_daily_health(
    user_id: int,
    target_date: date,
    db: DbSession,
    current_user: CurrentUser,
) -> DailyHealthResponse:
    """Get health metrics for a specific day with HR zones and movement."""
    if not _can_access_user_data(current_user, user_id):
        raise AuthorizationError("Cannot access this user's data")

    service = HealthService(db)
    metric = service.get_daily_metrics(user_id, target_date)

    if not metric:
        raise NotFoundError("Health data for this date")

    zones = None
    if metric.heart_rate_zones:
        zones = HeartRateZonesResponse.model_validate(metric.heart_rate_zones)

    speeds = None
    if metric.movement_speeds:
        speeds = MovementSpeedsResponse.model_validate(metric.movement_speeds)

    return DailyHealthResponse(
        date=metric.date,
        resting_hr=metric.resting_hr,
        max_hr=metric.max_hr,
        sleep_hours=float(metric.sleep_hours) if metric.sleep_hours else None,
        hrv_rest=metric.hrv_rest,
        step_count=metric.step_count,
        heart_rate_zones=zones,
        movement_speeds=speeds,
    )


@router.get("/{user_id}/latest-date")
def get_latest_data_date(
    user_id: int,
    db: DbSession,
    current_user: CurrentUser,
) -> dict:
    """Get the most recent date with data for a user."""
    if not _can_access_user_data(current_user, user_id):
        raise AuthorizationError("Cannot access this user's data")

    service = HealthService(db)
    latest = service.get_latest_data_date(user_id)
    return {"latest_date": latest}


@router.get("/{user_id}/questionnaires", response_model=list[QuestionnaireResponse])
def get_questionnaire_data(
    user_id: int,
    db: DbSession,
    current_user: CurrentUser,
    start_date: date = Query(...),
    end_date: date = Query(...),
) -> list[QuestionnaireResponse]:
    """Get questionnaire data for a user within a date range."""
    if not _can_access_user_data(current_user, user_id):
        raise AuthorizationError("Cannot access this user's data")

    service = HealthService(db)
    data = service.get_questionnaire_data(user_id, start_date, end_date)
    return [QuestionnaireResponse.model_validate(q) for q in data]
