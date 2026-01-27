from datetime import date

from pydantic import BaseModel


class GroupDailyData(BaseModel):
    date: date
    physio_count: int
    participants_reporting: int
    avg_resting_hr: float | None
    avg_max_hr: float | None
    avg_sleep_hours: float | None
    avg_hrv_rest: float | None
    avg_step_count: float | None
    questionnaire_count: int
    avg_sleep_quality: float | None
    avg_fatigue_level: float | None
    avg_motivation_level: float | None


class GroupComparisonData(BaseModel):
    group_id: int
    group_name: str
    total_participants: int
    daily_data: list[GroupDailyData]


class GroupsComparisonResponse(BaseModel):
    groups: list[GroupComparisonData]


class GroupAggregatedResponse(BaseModel):
    group_id: int
    group_name: str
    total_participants: int
    daily_data: list[GroupDailyData]