import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/shared/stores/authStore'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { DatePicker } from '@/shared/components/ui/DatePicker'
import { RaceVisualization } from '../components/RaceVisualization'
import { RankingCard } from '../components/RankingCard'
import { DailySnapshot } from '../components/DailySnapshot'
import { HealthTrends } from '../components/HealthTrends'
import { DoughnutChart } from '@/shared/components/charts/DoughnutChart'
import {
  useDataConsistencyRanking,
  useQuestionnaireRanking,
  useGroupRankings,
  useDailyHealth,
  useHealthMetrics,
  useQuestionnaires,
  useLatestDataDate,
} from '@/shared/hooks/useApi'
import { format, subDays, parseISO } from 'date-fns'

type TrendMode = 'last_7' | 'last_30' | 'last_90'

export function ParticipantDashboard() {
  const { user, logout } = useAuthStore()
  const [snapshotDate, setSnapshotDate] = useState('')
  const [trendMode, setTrendMode] = useState<TrendMode>('last_7')

  const userId = user?.id || 0

  // Fetch latest data date to set initial snapshot date
  const { data: latestDate } = useLatestDataDate(userId)

  useEffect(() => {
    if (latestDate && !snapshotDate) {
      setSnapshotDate(latestDate)
    }
  }, [latestDate, snapshotDate])

  // Calculate trend date range based on snapshot date and mode
  const { trendStartDate, trendEndDate } = useMemo(() => {
    if (!snapshotDate) {
      return { trendStartDate: '', trendEndDate: '' }
    }

    const endDate = parseISO(snapshotDate)
    const days = trendMode === 'last_7' ? 7 : trendMode === 'last_30' ? 30 : 90
    const startDate = subDays(endDate, days)

    return {
      trendStartDate: format(startDate, 'yyyy-MM-dd'),
      trendEndDate: format(endDate, 'yyyy-MM-dd'),
    }
  }, [snapshotDate, trendMode])

  // Rankings
  const { data: dataRanking, isLoading: loadingDataRanking } = useDataConsistencyRanking(userId)
  const { data: questionnaireRanking, isLoading: loadingQRanking } = useQuestionnaireRanking(userId)
  const { data: groupRankings, isLoading: loadingGroupRankings } = useGroupRankings(userId)

  // Daily snapshot
  const { data: dailyHealth, isLoading: loadingDaily } = useDailyHealth(userId, snapshotDate)

  // Trends (based on snapshot date)
  const { data: healthMetrics, isLoading: loadingMetrics } = useHealthMetrics(
    userId,
    trendStartDate,
    trendEndDate
  )
  const { data: questionnaires, isLoading: loadingQuestionnaires } = useQuestionnaires(
    userId,
    trendStartDate,
    trendEndDate
  )

  // Heart rate zones for doughnut chart
  const zonesData = dailyHealth?.heart_rate_zones
    ? [
        { name: 'Very Light', value: dailyHealth.heart_rate_zones.very_light_percent || 0, color: '#10b981' },
        { name: 'Light', value: dailyHealth.heart_rate_zones.light_percent || 0, color: '#22c55e' },
        { name: 'Moderate', value: dailyHealth.heart_rate_zones.moderate_percent || 0, color: '#eab308' },
        { name: 'Intense', value: dailyHealth.heart_rate_zones.intense_percent || 0, color: '#f97316' },
        { name: 'Beast Mode', value: dailyHealth.heart_rate_zones.beast_mode_percent || 0, color: '#ef4444' },
      ]
    : []

  // Movement speeds for doughnut chart (in minutes)
  const movementData = dailyHealth?.movement_speeds
    ? [
        { name: 'Walking', value: dailyHealth.movement_speeds.walking_minutes || 0, color: '#22c55e' },
        { name: 'Fast Walking', value: dailyHealth.movement_speeds.walking_fast_minutes || 0, color: '#eab308' },
        { name: 'Jogging', value: dailyHealth.movement_speeds.jogging_minutes || 0, color: '#f97316' },
        { name: 'Running', value: dailyHealth.movement_speeds.running_minutes || 0, color: '#ef4444' },
      ]
    : []

  const total_time = movementData.reduce((sum, current) => sum + current.value, 0);
  const speed_card_title = `Movement Speeds. Total Time: ${total_time} minutes`

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">FitonDuty</h1>
              <span className="ml-4 px-3 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded-full text-sm">
                Participant
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">{user?.username}</span>
              <Button variant="ghost" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section 1: Rankings */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Your Performance</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RankingCard
              title="Data Consistency Ranking"
              rank={dataRanking?.rank ?? null}
              totalParticipants={dataRanking?.total_participants ?? null}
              subtitle="Completion rate"
              value={dataRanking ? `${dataRanking.completion_rate.toFixed(1)}%` : undefined}
              color="primary"
              loading={loadingDataRanking}
            />

            <RankingCard
              title="Questionnaire Completion"
              rank={questionnaireRanking?.rank ?? null}
              totalParticipants={questionnaireRanking?.total_participants ?? null}
              subtitle="Completion rate"
              value={questionnaireRanking ? `${questionnaireRanking.completion_rate.toFixed(1)}%` : undefined}
              color="green"
              loading={loadingQRanking}
            />
          </div>

          {/* Race Visualization */}
          <Card className="mt-6">
            <RaceVisualization
              participants={groupRankings || []}
              currentUserId={userId}
              loading={loadingGroupRankings}
            />
          </Card>
        </section>

        {/* Section 2: Daily Snapshot */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Daily Snapshot</h2>
              {latestDate && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Latest data: {latestDate}
                </p>
              )}
            </div>
            <DatePicker
              value={snapshotDate}
              onChange={(e) => setSnapshotDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
              className="w-40"
            />
          </div>

          <DailySnapshot data={dailyHealth} loading={loadingDaily} />

          {/* Heart Rate Zones and Movement Speeds */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card title="Heart Rate Zones">
              {loadingDaily ? (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full w-32 h-32" />
                </div>
              ) : zonesData.length > 0 ? (
                <DoughnutChart data={zonesData} height="200px" />
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No heart rate zone data available
                </div>
              )}
            </Card>

            <Card title={speed_card_title}>
              {loadingDaily ? (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full w-32 h-32" />
                </div>
              ) : movementData.length > 0 ? (
                <DoughnutChart data={movementData} height="200px" unit=" min" />
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No walking speed data available
                </div>
              )}
            </Card>
          </div>
        </section>

        {/* Section 3: Health Trends */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Health Trends</h2>
              {trendStartDate && trendEndDate && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {trendStartDate} to {trendEndDate}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant={trendMode === 'last_7' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTrendMode('last_7')}
              >
                7 Days
              </Button>
              <Button
                variant={trendMode === 'last_30' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTrendMode('last_30')}
              >
                30 Days
              </Button>
              <Button
                variant={trendMode === 'last_90' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTrendMode('last_90')}
              >
                90 Days
              </Button>
            </div>
          </div>

          <HealthTrends
            metrics={healthMetrics}
            questionnaires={questionnaires}
            loading={loadingMetrics || loadingQuestionnaires}
          />
        </section>
      </main>
    </div>
  )
}