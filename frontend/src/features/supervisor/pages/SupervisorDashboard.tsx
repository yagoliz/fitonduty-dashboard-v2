import { useAuthStore } from '@/shared/stores/authStore'
import { useDateRangeStore } from '@/shared/stores/dateRangeStore'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { LineChart } from '@/shared/components/charts/LineChart'
import { apiClient } from '@/shared/services/apiClient'
import { format, parseISO } from 'date-fns'

interface SupervisorGroupData {
  date: string
  group_id: number
  group_name: string
  physio_data_count: number
  avg_resting_hr: number | null
  avg_max_hr: number | null
  avg_sleep_hours: number | null
  avg_hrv_rest: number | null
  avg_step_count: number | null
  avg_sleep_quality: number | null
  avg_fatigue_level: number | null
  avg_motivation_level: number | null
  questionnaire_data_count: number
}

interface GroupInfo {
  id: number
  group_name: string
  participant_count: number
}

function useSupervisorGroupInfo() {
  return useQuery({
    queryKey: ['supervisor', 'group-info'],
    queryFn: async () => {
      const { data } = await apiClient.get<GroupInfo>('/api/v1/supervisor/group-info')
      return data
    },
  })
}

function useSupervisorGroupData(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['supervisor', 'group-data', startDate, endDate],
    queryFn: async () => {
      const { data } = await apiClient.get<SupervisorGroupData[]>('/api/v1/supervisor/group-data', {
        params: { start_date: startDate, end_date: endDate },
      })
      return data
    },
    enabled: !!startDate && !!endDate,
  })
}

export function SupervisorDashboard() {
  const { user, logout } = useAuthStore()
  const { mode, setMode, formattedStartDate, formattedEndDate } = useDateRangeStore()

  const { data: groupInfo, isLoading: loadingInfo } = useSupervisorGroupInfo()
  const { data: groupData, isLoading: loadingData } = useSupervisorGroupData(
    formattedStartDate(),
    formattedEndDate()
  )

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM d')
    } catch {
      return dateStr
    }
  }

  // Prepare chart data
  const physioCountData = groupData?.map((d) => ({
    date: formatDate(d.date),
    value: d.physio_data_count,
  })) || []

  const questionnaireCountData = groupData?.map((d) => ({
    date: formatDate(d.date),
    value: d.questionnaire_data_count,
  })) || []

  const avgHrData = groupData?.map((d) => ({
    date: formatDate(d.date),
    value: d.avg_resting_hr,
  })) || []

  const avgSleepData = groupData?.map((d) => ({
    date: formatDate(d.date),
    value: d.avg_sleep_hours,
  })) || []

  const avgHrvData = groupData?.map((d) => ({
    date: formatDate(d.date),
    value: d.avg_hrv_rest,
  })) || []

  const avgStepsData = groupData?.map((d) => ({
    date: formatDate(d.date),
    value: d.avg_step_count,
  })) || []

  const avgFatigueData = groupData?.map((d) => ({
    date: formatDate(d.date),
    value: d.avg_fatigue_level,
  })) || []

  const avgMotivationData = groupData?.map((d) => ({
    date: formatDate(d.date),
    value: d.avg_motivation_level,
  })) || []

  const isLoading = loadingInfo || loadingData

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">FitonDuty</h1>
              <span className="ml-4 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                Supervisor
              </span>
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
        {/* Header with date controls */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {loadingInfo ? 'Loading...' : groupInfo?.group_name || 'Group Overview'}
            </h2>
            <p className="text-gray-500">
              {loadingInfo ? '--' : groupInfo?.participant_count || 0} participants
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={mode === 'last_7' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setMode('last_7')}
            >
              7 Days
            </Button>
            <Button
              variant={mode === 'last_30' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setMode('last_30')}
            >
              30 Days
            </Button>
            <Button
              variant={mode === 'last_90' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setMode('last_90')}
            >
              90 Days
            </Button>
          </div>
        </div>

        {/* Data Collection Overview */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Collection</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Physiological Data Count">
              {isLoading ? (
                <div className="h-64 animate-pulse bg-gray-100 rounded" />
              ) : (
                <LineChart data={physioCountData} color="#3b82f6" height="250px" yAxisLabel="Records" />
              )}
            </Card>
            <Card title="Questionnaire Data Count">
              {isLoading ? (
                <div className="h-64 animate-pulse bg-gray-100 rounded" />
              ) : (
                <LineChart data={questionnaireCountData} color="#22c55e" height="250px" yAxisLabel="Records" />
              )}
            </Card>
          </div>
        </section>

        {/* Group Average Metrics */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Averages</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card title="Average Resting Heart Rate">
              {isLoading ? (
                <div className="h-48 animate-pulse bg-gray-100 rounded" />
              ) : (
                <LineChart data={avgHrData} color="#ef4444" height="200px" yAxisLabel="BPM" />
              )}
            </Card>
            <Card title="Average Sleep">
              {isLoading ? (
                <div className="h-48 animate-pulse bg-gray-100 rounded" />
              ) : (
                <LineChart data={avgSleepData} color="#3b82f6" height="200px" yAxisLabel="Hours" />
              )}
            </Card>
            <Card title="Average HRV">
              {isLoading ? (
                <div className="h-48 animate-pulse bg-gray-100 rounded" />
              ) : (
                <LineChart data={avgHrvData} color="#8b5cf6" height="200px" yAxisLabel="ms" />
              )}
            </Card>
            <Card title="Average Steps">
              {isLoading ? (
                <div className="h-48 animate-pulse bg-gray-100 rounded" />
              ) : (
                <LineChart data={avgStepsData} color="#22c55e" height="200px" yAxisLabel="Steps" />
              )}
            </Card>
            <Card title="Average Fatigue Level">
              {isLoading ? (
                <div className="h-48 animate-pulse bg-gray-100 rounded" />
              ) : (
                <LineChart data={avgFatigueData} color="#f97316" height="200px" yAxisLabel="Level" />
              )}
            </Card>
            <Card title="Average Motivation Level">
              {isLoading ? (
                <div className="h-48 animate-pulse bg-gray-100 rounded" />
              ) : (
                <LineChart data={avgMotivationData} color="#06b6d4" height="200px" yAxisLabel="Level" />
              )}
            </Card>
          </div>
        </section>
      </main>
    </div>
  )
}