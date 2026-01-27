// Authentication types
export interface LoginRequest {
  username: string
  password: string
}

export interface Token {
  access_token: string
  refresh_token: string
  token_type: string
}

// User types
export interface User {
  id: number
  username: string
  role: 'admin' | 'supervisor' | 'participant'
  is_active: boolean
  last_login?: string
  groups?: Group[]
}

export interface Group {
  id: number
  group_name: string
  description?: string
  campaign_start_date?: string
  campaign_end_date?: string
  participants?: User[]
}

// Health types
export interface HealthMetric {
  date: string
  resting_hr: number | null
  max_hr: number | null
  sleep_hours: number | null
  hrv_rest: number | null
  step_count: number
}

export interface HeartRateZones {
  very_light_percent: number | null
  light_percent: number | null
  moderate_percent: number | null
  intense_percent: number | null
  beast_mode_percent: number | null
}

export interface MovementSpeeds {
  walking_minutes: number
  walking_fast_minutes: number
  jogging_minutes: number
  running_minutes: number
}

export interface DailyHealth extends HealthMetric {
  heart_rate_zones: HeartRateZones | null
  movement_speeds: MovementSpeeds | null
}

export interface AnomalyScore {
  date: string
  time_slot: number
  score: number
  label: string | null
  time_string: string | null
}

// Ranking types
export interface Ranking {
  participant_id: number
  username: string
  rank: number
  total_participants: number
  data_volume_mb: number
}

export interface GroupRanking {
  participant_id: number
  username: string
  rank: number
  data_volume_mb: number
}

export interface QuestionnaireRanking {
  participant_id: number
  username: string
  rank: number
  total_participants: number
  completion_rate: number
  days_completed: number
}

// Questionnaire types
export interface Questionnaire {
  date: string
  perceived_sleep_quality: number | null
  fatigue_level: number | null
  motivation_level: number | null
  sleep_hours: number | null
  recovery_morning: number | null
}