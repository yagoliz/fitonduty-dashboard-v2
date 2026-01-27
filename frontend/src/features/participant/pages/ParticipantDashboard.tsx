import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/shared/stores/authStore'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { DatePicker } from '@/shared/components/ui/DatePicker'
import { RaceVisualization } from '../components/RaceVisualization'
import { RankingCard } from '../components/RankingCard'
import { DailySnapshot } from '../components/DailySnapshot'
import { HealthTrends } from '../components/HealthTrends'
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">FitonDuty</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.username}</span>
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
          <h2 className="text-xl font-bold text-gray-900 mb-6">Your Performance</h2>

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
              <h2 className="text-xl font-bold text-gray-900">Daily Snapshot</h2>
              {latestDate && (
                <p className="text-sm text-gray-500">
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
        </section>

        {/* Section 3: Health Trends */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Health Trends</h2>
              {trendStartDate && trendEndDate && (
                <p className="text-sm text-gray-500">
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