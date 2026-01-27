import { Card } from '@/shared/components/ui/Card'
import { LineChart } from '@/shared/components/charts/LineChart'
import type { GroupAggregatedResponse } from '@/shared/types/api'
import { format, parseISO } from 'date-fns'

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
      ? Math.round((d.participants_reporting / data.total_participants) * 100)
      : 0,
  })) || []

  // Questionnaire completion rate
  const questionnaireData = data?.daily_data.map((d) => ({
    date: formatDate(d.date),
    value: data.total_participants > 0
      ? Math.round((d.questionnaire_count / data.total_participants) * 100)
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <Card key={i}>
              <div className="h-64 animate-pulse bg-gray-100 rounded" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">{groupName}</h3>
        <span className="text-sm text-gray-500">
          {data?.total_participants || 0} participants
        </span>
      </div>

      {/* Summary Card */}
      <Card title="Group Averages (Latest)">
        <div className="grid grid-cols-5 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-red-500">
              {latestData?.avg_resting_hr?.toFixed(0) ?? '--'}
            </p>
            <p className="text-xs text-gray-500">Avg Resting HR</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">
              {latestData?.avg_max_hr?.toFixed(0) ?? '--'}
            </p>
            <p className="text-xs text-gray-500">Avg Max HR</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-500">
              {latestData?.avg_sleep_hours?.toFixed(1) ?? '--'}
            </p>
            <p className="text-xs text-gray-500">Avg Sleep (hrs)</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-500">
              {latestData?.avg_hrv_rest?.toFixed(0) ?? '--'}
            </p>
            <p className="text-xs text-gray-500">Avg HRV (ms)</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-500">
              {latestData?.avg_step_count?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? '--'}
            </p>
            <p className="text-xs text-gray-500">Avg Steps</p>
          </div>
        </div>
      </Card>

      {/* Physiological Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Avg Resting Heart Rate">
          <LineChart data={hrData} color="#ef4444" height="220px" />
        </Card>

        <Card title="Avg HRV">
          <LineChart data={hrvData} color="#8b5cf6" height="220px" />
        </Card>

        <Card title="Avg Sleep Hours">
          <LineChart data={sleepData} color="#3b82f6" height="220px" />
        </Card>

        <Card title="Avg Steps">
          <LineChart data={stepsData} color="#22c55e" height="220px" />
        </Card>

        <Card title="Physio Reporting Rate (%)">
          <LineChart data={reportingData} color="#6366f1" height="220px" />
        </Card>

        <Card title="Questionnaire Completion (%)">
          <LineChart data={questionnaireData} color="#f59e0b" height="220px" />
        </Card>
      </div>

      {/* Questionnaire Metrics */}
      <h4 className="text-md font-medium text-gray-700">Questionnaire Metrics</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Avg Sleep Quality (1-10)">
          <LineChart data={sleepQualityData} color="#06b6d4" height="220px" />
        </Card>

        <Card title="Avg Fatigue Level (1-10)">
          <LineChart data={fatigueData} color="#f97316" height="220px" />
        </Card>

        <Card title="Avg Motivation Level (1-10)">
          <LineChart data={motivationData} color="#10b981" height="220px" />
        </Card>
      </div>
    </div>
  )
}