from fastapi import APIRouter

from app.api.deps import AdminUser, DbSession
from app.core.exceptions import NotFoundError
from app.models.user import Group
from app.schemas.user import GroupResponse, GroupWithParticipants, UserResponse

router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("", response_model=list[GroupResponse])
def get_all_groups(db: DbSession, current_user: AdminUser) -> list[GroupResponse]:
    """Get all groups (admin only)."""
    groups = (
        db.query(Group)
        .filter(Group.group_name != "Unassigned")
        .order_by(Group.group_name)
        .all()
    )
    return [GroupResponse.model_validate(g) for g in groups]


@router.get("/{group_id}", response_model=GroupWithParticipants)
def get_group(group_id: int, db: DbSession, current_user: AdminUser) -> GroupWithParticipants:
    """Get a group with its participants (admin only)."""
    group = db.query(Group).filter(Group.id == group_id).first()

    if not group:
        raise NotFoundError("Group")

    participants = [
        UserResponse.model_validate(u) for u in group.users if u.role == "participant"
    ]

    return GroupWithParticipants(
        id=group.id,
        group_name=group.group_name,
        description=group.description,
        campaign_start_date=group.campaign_start_date,
        campaign_end_date=group.campaign_end_date,
        participants=participants,
    )


@router.get("/{group_id}/participants", response_model=list[UserResponse])
def get_group_participants(
    group_id: int,
    db: DbSession,
    current_user: AdminUser,
) -> list[UserResponse]:
    """Get participants in a group (admin only)."""
    group = db.query(Group).filter(Group.id == group_id).first()

    if not group:
        raise NotFoundError("Group")

    participants = [u for u in group.users if u.role == "participant"]
    return [UserResponse.model_validate(p) for p in participants]
