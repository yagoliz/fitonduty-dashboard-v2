import { Card } from '@/shared/components/ui/Card'
import { LineChart } from '@/shared/components/charts/LineChart'
import type { GroupAggregatedResponse } from '@/shared/types/api'
import { format, parseISO } from 'date-fns'

interface MetricCardProps {
  label: string
  value: string | number | null | undefined
  unit?: string
  color: string
}

function MetricCard({ label, value, unit, color }: MetricCardProps) {
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

interface GroupAggregationViewProps {
  groupName: string
  data: GroupAggregatedResponse | undefined
  loading?: boolean
}

export function GroupAggregationView({
  groupName,
  data,
  loading,
}: GroupAggregationViewProps) {
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM d')
    } catch {
      return dateStr
    }
  }

  // Calculate latest averages for summary
  const latestData = data?.daily_data.filter((d) => d.physio_count > 0).slice(-1)[0]

  // Prepare chart data
  const hrData = data?.daily_data.map((d) => ({
    date: formatDate(d.date),
    value: d.avg_resting_hr,
  })) || []

  const hrvData = data?.daily_data.map((d) => ({
    date: formatDate(d.date),
    value: d.avg_hrv_rest,
  })) || []

  const sleepData = data?.daily_data.map((d) => ({
    date: formatDate(d.date),
    value: d.avg_sleep_hours,
  })) || []

  const stepsData = data?.daily_data.map((d) => ({
    date: formatDate(d.date),
    value: d.avg_step_count,
  })) || []

  // Data quality: reporting rate
  const reportingData = data?.daily_data.map((d) => ({
    date: formatDate(d.date),
    value: data.total_participants > 0
      // ? Math.round((d.participants_reporting / data.total_participants) * 100)
      ? Math.round(d.participants_reporting)
      : 0,
  })) || []

  // Questionnaire completion rate
  const questionnaireData = data?.daily_data.map((d) => ({
    date: formatDate(d.date),
    value: data.total_participants > 0
      // ? Math.round((d.questionnaire_count / data.total_participants) * 100)
      ? Math.round(d.questionnaire_count)
      : 0,
  })) || []

  // Questionnaire metrics
  const sleepQualityData = data?.daily_data.map((d) => ({
    date: formatDate(d.date),
    value: d.avg_sleep_quality,
  })) || []

  const fatigueData = data?.daily_data.map((d) => ({
    date: formatDate(d.date),
    value: d.avg_fatigue_level,
  })) || []

  const motivationData = data?.daily_data.map((d) => ({
    date: formatDate(d.date),
    value: d.avg_motivation_level,
  })) || []

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="text-center p-4 animate-pulse">
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-2" />
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <div className="h-56 animate-pulse bg-gray-100 dark:bg-gray-700 rounded" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{groupName}</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {data?.total_participants || 0} participants
        </span>
      </div>

      {/* Section 1: Completion Rates */}
      <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">Completion Rates</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Physio Reporting - Total Participants">
          <LineChart data={reportingData} color="#6366f1" height="220px" />
        </Card>
        <Card title="Questionnaire Completion - Total Participants">
          <LineChart data={questionnaireData} color="#f59e0b" height="220px" />
        </Card>
      </div>

      {/* Section 2: Physiological Group Averages */}
      <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">Physiological Group Averages (Latest)</h4>
      {/* Row 1: HR, Max HR, HRV */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard
          label="Avg Resting HR"
          value={latestData?.avg_resting_hr?.toFixed(0)}
          unit="bpm"
          color="text-red-500"
        />
        <MetricCard
          label="Avg Max HR"
          value={latestData?.avg_max_hr?.toFixed(0)}
          unit="bpm"
          color="text-red-600"
        />
        <MetricCard
          label="Avg HRV"
          value={latestData?.avg_hrv_rest?.toFixed(0)}
          unit="ms"
          color="text-purple-500"
        />
      </div>
      {/* Row 2: Steps, Sleep */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label="Avg Steps"
          value={latestData?.avg_step_count?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          color="text-green-500"
        />
        <MetricCard
          label="Avg Sleep"
          value={latestData?.avg_sleep_hours?.toFixed(1)}
          unit="hrs"
          color="text-blue-500"
        />
      </div>
      {/* Physiological Charts - Row 1: HR, HRV */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Avg Resting Heart Rate">
          <LineChart data={hrData} color="#ef4444" height="220px" />
        </Card>
        <Card title="Avg HRV">
          <LineChart data={hrvData} color="#8b5cf6" height="220px" />
        </Card>
      </div>
      {/* Physiological Charts - Row 2: Steps, Sleep */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Avg Steps">
          <LineChart data={stepsData} color="#22c55e" height="220px" />
        </Card>
        <Card title="Avg Sleep Hours">
          <LineChart data={sleepData} color="#06b6d4" height="220px" />
        </Card>
      </div>

      {/* Section 3: Questionnaire Metrics */}
      <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">Questionnaire Metrics</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Avg Sleep Quality (1-100)">
          <LineChart data={sleepQualityData} color="#06b6d4" height="220px" />
        </Card>
        <Card title="Avg Fatigue Level (1-100)">
          <LineChart data={fatigueData} color="#f97316" height="220px" />
        </Card>
        <Card title="Avg Motivation Level (1-100)">
          <LineChart data={motivationData} color="#10b981" height="220px" />
        </Card>
      </div>
    </div>
  )
}