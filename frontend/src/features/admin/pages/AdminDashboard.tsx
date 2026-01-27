import { useState, useEffect } from 'react'
import { useAuthStore } from '@/shared/stores/authStore'
import { useUIStore } from '@/shared/stores/uiStore'
import { useDateRangeStore } from '@/shared/stores/dateRangeStore'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { DatePicker } from '@/shared/components/ui/DatePicker'
import { ParticipantDetail } from '../components/ParticipantDetail'
import {
  useGroups,
  useGroupParticipants,
  useHealthMetrics,
  useDailyHealth,
  useAnomalies,
  useQuestionnaires,
  useLatestDataDate,
} from '@/shared/hooks/useApi'
import { format, subDays } from 'date-fns'

export function AdminDashboard() {
  const { user, logout } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { mode, setMode, formattedStartDate, formattedEndDate } = useDateRangeStore()

  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [selectedParticipantId, setSelectedParticipantId] = useState<number | null>(null)
  const [snapshotDate, setSnapshotDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  // Fetch groups
  const { data: groups, isLoading: loadingGroups } = useGroups()

  // Fetch participants when group is selected
  const { data: participants, isLoading: loadingParticipants } = useGroupParticipants(selectedGroupId)

  // Get selected participant's name
  const selectedParticipant = participants?.find((p) => p.id === selectedParticipantId)

  // Fetch latest data date for selected participant
  const { data: latestDate } = useLatestDataDate(selectedParticipantId || 0)

  useEffect(() => {
    if (latestDate) {
      setSnapshotDate(latestDate)
    }
  }, [latestDate])

  // Fetch participant data
  const { data: healthMetrics, isLoading: loadingMetrics } = useHealthMetrics(
    selectedParticipantId || 0,
    formattedStartDate(),
    formattedEndDate()
  )

  const { data: dailyHealth, isLoading: loadingDaily } = useDailyHealth(
    selectedParticipantId || 0,
    snapshotDate
  )

  const { data: anomalies, isLoading: loadingAnomalies } = useAnomalies(
    selectedParticipantId || 0,
    snapshotDate
  )

  const { data: questionnaires, isLoading: loadingQuestionnaires } = useQuestionnaires(
    selectedParticipantId || 0,
    formattedStartDate(),
    formattedEndDate()
  )

  // Reset participant when group changes
  useEffect(() => {
    setSelectedParticipantId(null)
  }, [selectedGroupId])

  const isLoading = loadingMetrics || loadingDaily || loadingAnomalies || loadingQuestionnaires

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-72' : 'w-0'
        } bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden flex flex-col`}
      >
        <div className="p-4 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900">FitonDuty</h1>
          <p className="text-sm text-gray-500">Admin Dashboard</p>
        </div>

        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Group Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Group
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Participant
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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

          {/* Date Selection */}
          {selectedParticipantId && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Snapshot Date
                </label>
                <DatePicker
                  value={snapshotDate}
                  onChange={(e) => setSnapshotDate(e.target.value)}
                  max={format(new Date(), 'yyyy-MM-dd')}
                />
                {latestDate && (
                  <p className="text-xs text-gray-500 mt-1">Latest: {latestDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trend Period
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={mode === 'last_7' ? 'primary' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setMode('last_7')}
                  >
                    7d
                  </Button>
                  <Button
                    variant={mode === 'last_30' ? 'primary' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setMode('last_30')}
                  >
                    30d
                  </Button>
                  <Button
                    variant={mode === 'last_90' ? 'primary' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setMode('last_90')}
                  >
                    90d
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.username}</p>
              <p className="text-xs text-gray-500">Admin</p>
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
          className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="p-8 pt-16">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {selectedParticipantId && selectedParticipant
                ? `${selectedParticipant.username}'s Health Data`
                : selectedGroupId
                  ? 'Group Overview'
                  : 'Select a Group and Participant'}
            </h2>

            {/* Content */}
            {selectedParticipantId ? (
              <ParticipantDetail
                participantName={selectedParticipant?.username || ''}
                dailyHealth={dailyHealth}
                healthMetrics={healthMetrics}
                anomalies={anomalies}
                questionnaires={questionnaires}
                loading={isLoading}
              />
            ) : selectedGroupId ? (
              <Card>
                <div className="p-8 text-center text-gray-500">
                  <p>Select a participant from the sidebar to view their health data.</p>
                  <p className="text-sm mt-2">
                    {participants?.length || 0} participants in this group
                  </p>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="p-8 text-center text-gray-500">
                  <p>Select a group from the sidebar to get started.</p>
                  <p className="text-sm mt-2">{groups?.length || 0} groups available</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}