from datetime import datetime, date
from pydantic import BaseModel


class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class UserMe(BaseModel):
    id: int
    username: str
    role: str
    is_active: bool
    last_login: datetime | None
    groups: list["GroupResponse"]

    class Config:
        from_attributes = True


class GroupResponse(BaseModel):
    id: int
    group_name: str
    description: str | None
    campaign_start_date: date | None
    campaign_end_date: date | None

    class Config:
        from_attributes = True


class GroupWithParticipants(BaseModel):
    id: int
    group_name: str
    description: str | None
    campaign_start_date: date | None
    campaign_end_date: date | None
    participants: list[UserResponse]

    class Config:
        from_attributes = True


# Update forward references
UserMe.model_rebuild()