import { Card } from '@/shared/components/ui/Card'
import { LineChart } from '@/shared/components/charts/LineChart'
import { DoughnutChart } from '@/shared/components/charts/DoughnutChart'
import type { HealthMetric, DailyHealth, AnomalyScore, Questionnaire } from '@/shared/types/api'
import { format, parseISO } from 'date-fns'

interface ParticipantDetailProps {
  participantName: string
  dailyHealth: DailyHealth | null | undefined
  healthMetrics: HealthMetric[] | undefined
  anomalies: AnomalyScore[] | undefined
  questionnaires: Questionnaire[] | undefined
  loading?: boolean
}

export function ParticipantDetail({
  participantName,
  dailyHealth,
  healthMetrics,
  anomalies,
  questionnaires,
  loading,
}: ParticipantDetailProps) {
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM d')
    } catch {
      return dateStr
    }
  }

  // Prepare chart data
  const hrData = healthMetrics?.map((m) => ({
    date: formatDate(m.date),
    value: m.resting_hr,
  })) || []

  const hrvData = healthMetrics?.map((m) => ({
    date: formatDate(m.date),
    value: m.hrv_rest,
  })) || []

  const sleepData = healthMetrics?.map((m) => ({
    date: formatDate(m.date),
    value: m.sleep_hours,
  })) || []

  const stepsData = healthMetrics?.map((m) => ({
    date: formatDate(m.date),
    value: m.step_count,
  })) || []

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

  // Anomaly timeline data
  const anomalyData = anomalies?.map((a) => ({
    date: a.time_string || `${Math.floor(a.time_slot / 60)}:${(a.time_slot % 60).toString().padStart(2, '0')}`,
    value: a.score,
  })) || []

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
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
      <h3 className="text-lg font-semibold text-gray-900">{participantName}</h3>

      {/* Daily Snapshot Card */}
      <Card title="Daily Snapshot">
        <div className="grid grid-cols-5 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-red-500">{dailyHealth?.resting_hr ?? '--'}</p>
            <p className="text-xs text-gray-500">Resting HR</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{dailyHealth?.max_hr ?? '--'}</p>
            <p className="text-xs text-gray-500">Max HR</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-500">
              {dailyHealth?.sleep_hours?.toFixed(1) ?? '--'}
            </p>
            <p className="text-xs text-gray-500">Sleep (hrs)</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-500">{dailyHealth?.hrv_rest ?? '--'}</p>
            <p className="text-xs text-gray-500">HRV (ms)</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-500">
              {dailyHealth?.step_count?.toLocaleString() ?? '--'}
            </p>
            <p className="text-xs text-gray-500">Steps</p>
          </div>
        </div>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Heart Rate Zones */}
        <Card title="Heart Rate Zones">
          {zonesData.length > 0 ? (
            <DoughnutChart data={zonesData} height="220px" />
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-400">
              No data available
            </div>
          )}
        </Card>

        {/* Heart Rate Trend */}
        <Card title="Heart Rate Trend">
          <LineChart data={hrData} color="#ef4444" height="220px" />
        </Card>

        {/* HRV Trend */}
        <Card title="HRV Trend">
          <LineChart data={hrvData} color="#8b5cf6" height="220px" />
        </Card>

        {/* Sleep Trend */}
        <Card title="Sleep Trend">
          <LineChart data={sleepData} color="#3b82f6" height="220px" />
        </Card>

        {/* Steps Trend */}
        <Card title="Steps Trend">
          <LineChart data={stepsData} color="#22c55e" height="220px" />
        </Card>

        {/* Anomaly Timeline */}
        <Card title="Anomaly Scores">
          {anomalyData.length > 0 ? (
            <LineChart data={anomalyData} color="#dc2626" height="220px" />
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-400">
              No anomalies detected
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}