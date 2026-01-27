from datetime import date
from pydantic import BaseModel


class QuestionnaireResponse(BaseModel):
    date: date
    perceived_sleep_quality: int | None
    fatigue_level: int | None
    motivation_level: int | None
    sleep_hours: float | None
    recovery_morning: int | None

    class Config:
        from_attributes = True