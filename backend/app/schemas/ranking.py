from datetime import date
from pydantic import BaseModel


class RankingResponse(BaseModel):
    participant_id: int
    username: str
    rank: int
    total_participants: int
    data_volume_mb: float
    completion_rate: float  # 0-100, based on (volume / (max_daily_volume * total_days))


class GroupRankingResponse(BaseModel):
    participant_id: int
    username: str
    rank: int
    data_volume_mb: float
    completion_rate: float  # 0-100


class RankingHistoryResponse(BaseModel):
    period: str  # e.g., "Jan 01" or "Jan 2024"
    weekly_rank: int
    cumulative_rank: int


class QuestionnaireRankingResponse(BaseModel):
    participant_id: int
    username: str
    rank: int
    total_participants: int
    completion_rate: float  # 0-100
    questionnaire_days: int