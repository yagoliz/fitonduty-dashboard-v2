import { useAuthStore } from '@/shared/stores/authStore'
import { useDateRangeStore } from '@/shared/stores/dateRangeStore'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { DatePicker } from '@/shared/components/ui/DatePicker'
import { LineChart } from '@/shared/components/charts/LineChart'
import { apiClient } from '@/shared/services/apiClient'
import { format, parseISO, parse } from 'date-fns'

interface MetricCardProps {
  label: string
  value: string | number | null | undefined
  unit?: string
  color: string
  loading?: boolean
}

function MetricCard({ label, value, unit, color, loading }: MetricCardProps) {
  if (loading) {
    return (
      <Card className="text-center p-4 animate-pulse">
        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-2" />
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
      </Card>
    )
  }

  return (
    <Card className="text-center p-4">
      <p className={`text-2xl font-bold ${color}`}>
        {value ?? '--'}
        {unit && value && <span className="text-sm font-normal ml-1">{unit}</span>}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </Card>
  )
}

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
  const { mode, setMode, setEndDate, formattedStartDate, formattedEndDate } = useDateRangeStore()

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

  // Calculate latest averages for summary (filter for days with data)
  const latestData = groupData?.filter((d) => d.physio_data_count > 0).slice(-1)[0]

  // Prepare chart data
  const avgHrData = groupData?.map((d) => ({
    date: formatDate(d.date),
    value: d.avg_resting_hr,
  })) || []

  const avgHrvData = groupData?.map((d) => ({
    date: formatDate(d.date),
    value: d.avg_hrv_rest,
  })) || []

  const avgSleepData = groupData?.map((d) => ({
    date: formatDate(d.date),
    value: d.avg_sleep_hours,
  })) || []

  const avgStepsData = groupData?.map((d) => ({
    date: formatDate(d.date),
    value: d.avg_step_count,
  })) || []

  // Data quality: reporting rate (physio count / total participants)
  const reportingData = groupData?.map((d) => ({
    date: formatDate(d.date),
    value: groupInfo?.participant_count && groupInfo.participant_count > 0
      ? Math.round((d.physio_data_count / groupInfo.participant_count) * 100)
      : 0,
  })) || []

  // Questionnaire completion rate
  const questionnaireCompletionData = groupData?.map((d) => ({
    date: formatDate(d.date),
    value: groupInfo?.participant_count && groupInfo.participant_count > 0
      ? Math.round((d.questionnaire_data_count / groupInfo.participant_count) * 100)
      : 0,
  })) || []

  // Questionnaire metrics
  const avgSleepQualityData = groupData?.map((d) => ({
    date: formatDate(d.date),
    value: d.avg_sleep_quality,
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">FitonDuty</h1>
              <span className="ml-4 px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded-full text-sm">
                Supervisor
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
        {/* Header with date controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {loadingInfo ? 'Loading...' : groupInfo?.group_name || 'Group Overview'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {loadingInfo ? '--' : groupInfo?.participant_count || 0} participants
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
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
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">End:</span>
              <DatePicker
                value={formattedEndDate()}
                onChange={(e) => setEndDate(parse(e.target.value, 'yyyy-MM-dd', new Date()))}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
          </div>
        </div>

        {/* Section 1: Completion Rates */}
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">Completion Rates</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          <Card title="Physio Reporting Rate (%)">
            {isLoading ? (
              <div className="h-56 animate-pulse bg-gray-100 dark:bg-gray-700 rounded" />
            ) : (
              <LineChart data={reportingData} color="#6366f1" height="220px" />
            )}
          </Card>
          <Card title="Questionnaire Completion (%)">
            {isLoading ? (
              <div className="h-56 animate-pulse bg-gray-100 dark:bg-gray-700 rounded" />
            ) : (
              <LineChart data={questionnaireCompletionData} color="#f59e0b" height="220px" />
            )}
          </Card>
        </div>

        {/* Section 2: Physiological Group Averages */}
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mt-6">Physiological Group Averages (Latest)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-2">
          <MetricCard
            label="Avg Resting HR"
            value={latestData?.avg_resting_hr?.toFixed(0)}
            unit="bpm"
            color="text-red-500"
            loading={isLoading}
          />
          <MetricCard
            label="Avg Max HR"
            value={latestData?.avg_max_hr?.toFixed(0)}
            unit="bpm"
            color="text-red-600"
            loading={isLoading}
          />
          <MetricCard
            label="Avg HRV"
            value={latestData?.avg_hrv_rest?.toFixed(0)}
            unit="ms"
            color="text-purple-500"
            loading={isLoading}
          />
          <MetricCard
            label="Avg Steps"
            value={latestData?.avg_step_count?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            color="text-green-500"
            loading={isLoading}
          />
          <MetricCard
            label="Avg Sleep"
            value={latestData?.avg_sleep_hours?.toFixed(1)}
            unit="hrs"
            color="text-blue-500"
            loading={isLoading}
          />
        </div>
        {/* Physiological Charts - Row 1: HR, HRV */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <Card title="Avg Resting Heart Rate">
            {isLoading ? (
              <div className="h-56 animate-pulse bg-gray-100 dark:bg-gray-700 rounded" />
            ) : (
              <LineChart data={avgHrData} color="#ef4444" height="220px" />
            )}
          </Card>
          <Card title="Avg HRV">
            {isLoading ? (
              <div className="h-56 animate-pulse bg-gray-100 dark:bg-gray-700 rounded" />
            ) : (
              <LineChart data={avgHrvData} color="#8b5cf6" height="220px" />
            )}
          </Card>
        </div>
        {/* Physiological Charts - Row 2: Steps, Sleep */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <Card title="Avg Steps">
            {isLoading ? (
              <div className="h-56 animate-pulse bg-gray-100 dark:bg-gray-700 rounded" />
            ) : (
              <LineChart data={avgStepsData} color="#22c55e" height="220px" />
            )}
          </Card>
          <Card title="Avg Sleep Hours">
            {isLoading ? (
              <div className="h-56 animate-pulse bg-gray-100 dark:bg-gray-700 rounded" />
            ) : (
              <LineChart data={avgSleepData} color="#06b6d4" height="220px" />
            )}
          </Card>
        </div>

        {/* Section 3: Questionnaire Metrics */}
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mt-6">Questionnaire Metrics</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <Card title="Avg Sleep Quality (1-100)">
            {isLoading ? (
              <div className="h-56 animate-pulse bg-gray-100 dark:bg-gray-700 rounded" />
            ) : (
              <LineChart data={avgSleepQualityData} color="#06b6d4" height="220px" />
            )}
          </Card>
          <Card title="Avg Fatigue Level (1-100)">
            {isLoading ? (
              <div className="h-56 animate-pulse bg-gray-100 dark:bg-gray-700 rounded" />
            ) : (
              <LineChart data={avgFatigueData} color="#f97316" height="220px" />
            )}
          </Card>
          <Card title="Avg Motivation Level (1-100)">
            {isLoading ? (
              <div className="h-56 animate-pulse bg-gray-100 dark:bg-gray-700 rounded" />
            ) : (
              <LineChart data={avgMotivationData} color="#10b981" height="220px" />
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}