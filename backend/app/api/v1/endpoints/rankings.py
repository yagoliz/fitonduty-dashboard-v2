from datetime import date, timedelta

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession
from app.core.exceptions import AuthorizationError, NotFoundError
from app.models.user import User
from app.schemas.ranking import (
    GroupRankingResponse,
    QuestionnaireRankingResponse,
    RankingResponse,
)
from app.services.ranking_service import RankingService

router = APIRouter(prefix="/rankings", tags=["rankings"])


def _get_user_campaign_dates(user, db) -> tuple[date, date]:
    """Get campaign start/end dates from the user's first group."""
    if not user.groups:
        end = date.today()
        start = end - timedelta(days=30)
        return start, end

    group = user.groups[0]
    start = group.campaign_start_date or date(2024, 1, 1)
    end = group.campaign_end_date or date.today()

    if end > date.today():
        end = date.today()

    return start, end


@router.get("/{user_id}/data-consistency", response_model=RankingResponse)
def get_data_consistency_ranking(
    user_id: int,
    db: DbSession,
    current_user: CurrentUser,
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
) -> RankingResponse:
    """Get data consistency ranking for a user."""
    if current_user.is_participant and current_user.id != user_id:
        raise AuthorizationError("Cannot access this user's ranking")

    service = RankingService(db)

    if not start_date or not end_date:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise NotFoundError("User")
        start_date, end_date = _get_user_campaign_dates(user, db)

    ranking = service.get_data_consistency_rank(user_id, start_date, end_date)
    if not ranking:
        raise NotFoundError("Ranking data")

    return ranking


@router.get("/{user_id}/group", response_model=list[GroupRankingResponse])
def get_group_rankings(
    user_id: int,
    db: DbSession,
    current_user: CurrentUser,
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
) -> list[GroupRankingResponse]:
    """Get rankings for all participants in the user's group."""
    if current_user.is_participant and current_user.id != user_id:
        raise AuthorizationError("Cannot access this user's group rankings")

    service = RankingService(db)

    if not start_date or not end_date:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise NotFoundError("User")
        start_date, end_date = _get_user_campaign_dates(user, db)

    return service.get_group_rankings(user_id, start_date, end_date)


@router.get("/{user_id}/history")
def get_ranking_history(
    user_id: int,
    db: DbSession,
    current_user: CurrentUser,
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
) -> list[dict]:
    """Get historical data for ranking over time visualization."""
    if current_user.is_participant and current_user.id != user_id:
        raise AuthorizationError("Cannot access this user's ranking history")

    service = RankingService(db)

    if not start_date or not end_date:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise NotFoundError("User")
        start_date, end_date = _get_user_campaign_dates(user, db)

    return service.get_ranking_history(user_id, start_date, end_date)


@router.get("/{user_id}/questionnaire", response_model=QuestionnaireRankingResponse)
def get_questionnaire_ranking(
    user_id: int,
    db: DbSession,
    current_user: CurrentUser,
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
) -> QuestionnaireRankingResponse:
    """Get questionnaire completion ranking for a user."""
    if current_user.is_participant and current_user.id != user_id:
        raise AuthorizationError("Cannot access this user's questionnaire ranking")

    service = RankingService(db)

    if not start_date or not end_date:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise NotFoundError("User")
        start_date, end_date = _get_user_campaign_dates(user, db)

    ranking = service.get_questionnaire_rank(user_id, start_date, end_date)
    if not ranking:
        raise NotFoundError("Questionnaire ranking data")

    return ranking


@router.get("/{user_id}/questionnaire/group", response_model=list[QuestionnaireRankingResponse])
def get_group_questionnaire_rankings(
    user_id: int,
    db: DbSession,
    current_user: CurrentUser,
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
) -> list[QuestionnaireRankingResponse]:
    """Get questionnaire rankings for all participants in the user's group."""
    if current_user.is_participant and current_user.id != user_id:
        raise AuthorizationError("Cannot access this group's questionnaire rankings")

    service = RankingService(db)

    if not start_date or not end_date:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise NotFoundError("User")
        start_date, end_date = _get_user_campaign_dates(user, db)

    return service.get_group_questionnaire_rankings(user_id, start_date, end_date)