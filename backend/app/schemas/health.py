from datetime import date
from decimal import Decimal
from pydantic import BaseModel


class HeartRateZonesResponse(BaseModel):
    very_light_percent: float | None
    light_percent: float | None
    moderate_percent: float | None
    intense_percent: float | None
    beast_mode_percent: float | None

    class Config:
        from_attributes = True


class MovementSpeedsResponse(BaseModel):
    walking_minutes: int
    walking_fast_minutes: int
    jogging_minutes: int
    running_minutes: int

    class Config:
        from_attributes = True


class HealthMetricResponse(BaseModel):
    date: date
    resting_hr: int | None
    max_hr: int | None
    sleep_hours: float | None
    hrv_rest: int | None
    step_count: int

    class Config:
        from_attributes = True


class DailyHealthResponse(BaseModel):
    date: date
    resting_hr: int | None
    max_hr: int | None
    sleep_hours: float | None
    hrv_rest: int | None
    step_count: int
    heart_rate_zones: HeartRateZonesResponse | None
    movement_speeds: MovementSpeedsResponse | None

    class Config:
        from_attributes = True


class AnomalyScoreResponse(BaseModel):
    date: date
    time_slot: int
    score: float
    label: str | None
    time_string: str | None = None  # HH:MM format

    class Config:
        from_attributes = True