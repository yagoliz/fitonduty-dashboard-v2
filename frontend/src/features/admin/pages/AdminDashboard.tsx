import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/shared/stores/authStore'
import { useUIStore } from '@/shared/stores/uiStore'
import { useDateRangeStore } from '@/shared/stores/dateRangeStore'
import { Button } from '@/shared/components/ui/Button'
import { DatePicker } from '@/shared/components/ui/DatePicker'
import { ParticipantDetail } from '../components/ParticipantDetail'
import { GroupAggregationView } from '../components/GroupAggregationView'
import { GroupComparisonView } from '../components/GroupComparisonView'
import {
  useGroups,
  useGroupParticipants,
  useHealthMetrics,
  useDailyHealth,
  useAnomalies,
  useAnomaliesRange,
  useQuestionnaires,
  useLatestDataDate,
  useGroupsComparison,
  useGroupAggregation,
} from '@/shared/hooks/useApi'
import { format, subDays, parseISO, parse } from 'date-fns'

type TrendMode = 'last_7' | 'last_30' | 'last_90'

export function AdminDashboard() {
  const { user, logout } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { mode: globalMode, setMode: setGlobalMode, setEndDate: setGlobalEndDate, formattedStartDate, formattedEndDate } = useDateRangeStore()

  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [selectedParticipantId, setSelectedParticipantId] = useState<number | null>(null)
  const [snapshotDate, setSnapshotDate] = useState('')
  const [participantTrendMode, setParticipantTrendMode] = useState<TrendMode>('last_30')

  // Use local mode for participant, global mode for groups
  const effectiveMode = selectedParticipantId ? participantTrendMode : globalMode
  const setEffectiveMode = selectedParticipantId
    ? setParticipantTrendMode
    : setGlobalMode

  // Calculate trend date range based on snapshot date (for participant view)
  const { trendStartDate, trendEndDate } = useMemo(() => {
    if (!snapshotDate) {
      return { trendStartDate: '', trendEndDate: '' }
    }

    const endDate = parseISO(snapshotDate)
    const days = participantTrendMode === 'last_7' ? 7 : participantTrendMode === 'last_30' ? 30 : 90
    const startDate = subDays(endDate, days)

    return {
      trendStartDate: format(startDate, 'yyyy-MM-dd'),
      trendEndDate: format(endDate, 'yyyy-MM-dd'),
    }
  }, [snapshotDate, participantTrendMode])

  // Fetch groups
  const { data: groups, isLoading: loadingGroups } = useGroups()

  // Fetch participants when group is selected
  const { data: participants, isLoading: loadingParticipants } = useGroupParticipants(selectedGroupId)

  // Get selected participant's name
  const selectedParticipant = participants?.find((p) => p.id === selectedParticipantId)

  // Fetch latest data date for selected participant
  const { data: latestDate } = useLatestDataDate(selectedParticipantId || 0)

  // Set snapshot date to latest available when participant changes
  useEffect(() => {
    if (latestDate) {
      setSnapshotDate(latestDate)
    }
  }, [latestDate, selectedParticipantId])

  // Fetch participant data (using trend dates based on snapshot date)
  const { data: healthMetrics, isLoading: loadingMetrics } = useHealthMetrics(
    selectedParticipantId || 0,
    trendStartDate,
    trendEndDate
  )

  const { data: dailyHealth, isLoading: loadingDaily } = useDailyHealth(
    selectedParticipantId || 0,
    snapshotDate
  )

  const { data: anomalies, isLoading: loadingAnomalies } = useAnomalies(
    selectedParticipantId || 0,
    snapshotDate
  )

  const { data: anomaliesRange, isLoading: loadingAnomaliesRange } = useAnomaliesRange(
    selectedParticipantId || 0,
    trendStartDate,
    trendEndDate
  )

  const { data: questionnaires, isLoading: loadingQuestionnaires } = useQuestionnaires(
    selectedParticipantId || 0,
    trendStartDate,
    trendEndDate
  )

  // Fetch group comparison data (when no group selected)
  const { data: groupsComparison, isLoading: loadingComparison } = useGroupsComparison(
    formattedStartDate(),
    formattedEndDate()
  )

  // Fetch single group aggregated data (when group selected but no participant)
  const { data: groupAggregation, isLoading: loadingAggregation } = useGroupAggregation(
    selectedGroupId,
    formattedStartDate(),
    formattedEndDate()
  )

  // Reset participant when group changes
  useEffect(() => {
    setSelectedParticipantId(null)
  }, [selectedGroupId])

  const isLoading = loadingMetrics || loadingDaily || loadingAnomalies || loadingAnomaliesRange || loadingQuestionnaires

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-72' : 'w-0'
        } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 overflow-hidden flex flex-col`}
      >
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">FitonDuty</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Admin Dashboard</p>
        </div>

        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Group Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Group
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={selectedGroupId || ''}
              onChange={(e) => setSelectedGroupId(e.target.value ? Number(e.target.value) : null)}
              disabled={loadingGroups}
            >
              <option value="">All Groups</option>
              {groups?.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.group_name}
                </option>
              ))}
            </select>
          </div>

          {/* Participant Selection */}
          {selectedGroupId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Participant
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={selectedParticipantId || ''}
                onChange={(e) =>
                  setSelectedParticipantId(e.target.value ? Number(e.target.value) : null)
                }
                disabled={loadingParticipants}
              >
                <option value="">Select a participant...</option>
                {participants?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.username}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Trend Period - always visible */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Trend Period
            </label>
            <div className="flex gap-2">
              <Button
                variant={effectiveMode === 'last_7' ? 'primary' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setEffectiveMode('last_7')}
              >
                7d
              </Button>
              <Button
                variant={effectiveMode === 'last_30' ? 'primary' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setEffectiveMode('last_30')}
              >
                30d
              </Button>
              <Button
                variant={effectiveMode === 'last_90' ? 'primary' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setEffectiveMode('last_90')}
              >
                90d
              </Button>
            </div>
          </div>

          {/* End Date - for group views (no participant selected) */}
          {!selectedParticipantId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <DatePicker
                value={formattedEndDate()}
                onChange={(e) => setGlobalEndDate(parse(e.target.value, 'yyyy-MM-dd', new Date()))}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Range: {formattedStartDate()} to {formattedEndDate()}
              </p>
            </div>
          )}

          {/* Snapshot Date - only when participant selected */}
          {selectedParticipantId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Snapshot Date
              </label>
              <DatePicker
                value={snapshotDate}
                onChange={(e) => setSnapshotDate(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
              {latestDate && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Latest: {latestDate}</p>
              )}
              {trendStartDate && trendEndDate && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Trends: {trendStartDate} to {trendEndDate}
                </p>
              )}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.username}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Admin</p>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className={`fixed top-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-300 ${
            sidebarOpen ? 'left-[15rem]' : 'left-4'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="p-8 pt-16">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              {selectedParticipantId && selectedParticipant
                ? `${selectedParticipant.username}'s Health Data`
                : selectedGroupId
                  ? `${groups?.find((g) => g.id === selectedGroupId)?.group_name || 'Group'} Overview`
                  : 'All Groups Overview'}
            </h2>

            {/* Content */}
            {selectedParticipantId ? (
              <ParticipantDetail
                participantName={selectedParticipant?.username || ''}
                dailyHealth={dailyHealth}
                healthMetrics={healthMetrics}
                anomalies={anomalies}
                anomaliesRange={anomaliesRange}
                questionnaires={questionnaires}
                loading={isLoading}
              />
            ) : selectedGroupId ? (
              <GroupAggregationView
                groupName={groups?.find((g) => g.id === selectedGroupId)?.group_name || ''}
                data={groupAggregation}
                loading={loadingAggregation}
              />
            ) : (
              <GroupComparisonView
                data={groupsComparison?.groups}
                loading={loadingComparison}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}