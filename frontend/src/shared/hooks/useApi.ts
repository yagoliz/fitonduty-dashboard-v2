import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../services/apiClient'
import type {
  Group,
  User,
  HealthMetric,
  DailyHealth,
  AnomalyScore,
  Ranking,
  GroupRanking,
  QuestionnaireRanking,
  Questionnaire,
  GroupsComparisonResponse,
  GroupAggregatedResponse,
} from '../types/api'

// Groups
export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const { data } = await apiClient.get<Group[]>('/api/v1/groups')
      return data
    },
  })
}

export function useGroupParticipants(groupId: number | null) {
  return useQuery({
    queryKey: ['groups', groupId, 'participants'],
    queryFn: async () => {
      const { data } = await apiClient.get<User[]>(`/api/v1/groups/${groupId}/participants`)
      return data
    },
    enabled: !!groupId,
  })
}

// Health Metrics
export function useHealthMetrics(userId: number, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['health', userId, 'metrics', startDate, endDate],
    queryFn: async () => {
      const { data } = await apiClient.get<HealthMetric[]>(
        `/api/v1/health/${userId}/metrics`,
        { params: { start_date: startDate, end_date: endDate } }
      )
      return data
    },
    enabled: !!userId && !!startDate && !!endDate,
  })
}

export function useDailyHealth(userId: number, date: string) {
  return useQuery({
    queryKey: ['health', userId, 'daily', date],
    queryFn: async () => {
      const { data } = await apiClient.get<DailyHealth>(`/api/v1/health/${userId}/daily/${date}`)
      return data
    },
    enabled: !!userId && !!date,
  })
}

export function useLatestDataDate(userId: number) {
  return useQuery({
    queryKey: ['health', userId, 'latest-date'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ latest_date: string | null }>(
        `/api/v1/health/${userId}/latest-date`
      )
      return data.latest_date
    },
    enabled: !!userId,
  })
}

export function useQuestionnaires(userId: number, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['health', userId, 'questionnaires', startDate, endDate],
    queryFn: async () => {
      const { data } = await apiClient.get<Questionnaire[]>(
        `/api/v1/health/${userId}/questionnaires`,
        { params: { start_date: startDate, end_date: endDate } }
      )
      return data
    },
    enabled: !!userId && !!startDate && !!endDate,
  })
}

// Anomalies
export function useAnomalies(userId: number, date: string) {
  return useQuery({
    queryKey: ['anomalies', userId, date],
    queryFn: async () => {
      const { data } = await apiClient.get<AnomalyScore[]>(
        `/api/v1/anomalies/${userId}`,
        { params: { date } }
      )
      return data
    },
    enabled: !!userId && !!date,
  })
}

export function useAnomaliesRange(userId: number, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['anomalies', userId, 'range', startDate, endDate],
    queryFn: async () => {
      const { data } = await apiClient.get<AnomalyScore[]>(
        `/api/v1/anomalies/${userId}/range`,
        { params: { start_date: startDate, end_date: endDate } }
      )
      return data
    },
    enabled: !!userId && !!startDate && !!endDate,
  })
}

// Rankings
export function useDataConsistencyRanking(userId: number) {
  return useQuery({
    queryKey: ['rankings', userId, 'data-consistency'],
    queryFn: async () => {
      const { data } = await apiClient.get<Ranking>(`/api/v1/rankings/${userId}/data-consistency`)
      return data
    },
    enabled: !!userId,
  })
}

export function useGroupRankings(userId: number) {
  return useQuery({
    queryKey: ['rankings', userId, 'group'],
    queryFn: async () => {
      const { data } = await apiClient.get<GroupRanking[]>(`/api/v1/rankings/${userId}/group`)
      return data
    },
    enabled: !!userId,
  })
}

export function useRankingHistory(userId: number) {
  return useQuery({
    queryKey: ['rankings', userId, 'history'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ participant_id: number; date: string }[]>(
        `/api/v1/rankings/${userId}/history`
      )
      return data
    },
    enabled: !!userId,
  })
}

export function useQuestionnaireRanking(userId: number) {
  return useQuery({
    queryKey: ['rankings', userId, 'questionnaire'],
    queryFn: async () => {
      const { data } = await apiClient.get<QuestionnaireRanking>(
        `/api/v1/rankings/${userId}/questionnaire`
      )
      return data
    },
    enabled: !!userId,
  })
}

export function useGroupQuestionnaireRankings(userId: number) {
  return useQuery({
    queryKey: ['rankings', userId, 'questionnaire', 'group'],
    queryFn: async () => {
      const { data } = await apiClient.get<QuestionnaireRanking[]>(
        `/api/v1/rankings/${userId}/questionnaire/group`
      )
      return data
    },
    enabled: !!userId,
  })
}

// Admin - Group Comparison (all groups)
export function useGroupsComparison(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['admin', 'groups', 'comparison', startDate, endDate],
    queryFn: async () => {
      const { data } = await apiClient.get<GroupsComparisonResponse>(
        '/api/v1/admin/groups/comparison',
        { params: { start_date: startDate, end_date: endDate } }
      )
      return data
    },
    enabled: !!startDate && !!endDate,
  })
}

// Admin - Single Group Aggregation
export function useGroupAggregation(groupId: number | null, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['admin', 'groups', groupId, 'aggregated', startDate, endDate],
    queryFn: async () => {
      const { data } = await apiClient.get<GroupAggregatedResponse>(
        `/api/v1/admin/groups/${groupId}/aggregated`,
        { params: { start_date: startDate, end_date: endDate } }
      )
      return data
    },
    enabled: !!groupId && !!startDate && !!endDate,
  })
}