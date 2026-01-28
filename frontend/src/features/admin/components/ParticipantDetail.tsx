import { Card } from '@/shared/components/ui/Card'
import { LineChart } from '@/shared/components/charts/LineChart'
import { MultiLineChart } from '@/shared/components/charts/MultiLineChart'
import { DoughnutChart } from '@/shared/components/charts/DoughnutChart'
import type { HealthMetric, DailyHealth, AnomalyScore, Questionnaire } from '@/shared/types/api'
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

interface ParticipantDetailProps {
  participantName: string
  dailyHealth: DailyHealth | null | undefined
  healthMetrics: HealthMetric[] | undefined
  anomalies: AnomalyScore[] | undefined
  anomaliesRange: AnomalyScore[] | undefined
  questionnaires: Questionnaire[] | undefined
  loading?: boolean
}

export function ParticipantDetail({
  participantName,
  dailyHealth,
  healthMetrics,
  anomalies,
  anomaliesRange,
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

  // Prepare health metric chart data
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

  // Combined HR series for MultiLineChart (use original dates for proper sorting)
  const hrSeries = [
    {
      name: 'Resting HR',
      data: healthMetrics?.map((m) => ({ date: m.date, value: m.resting_hr })) || [],
      color: '#ef4444'
    },
    {
      name: 'Max HR',
      data: healthMetrics?.map((m) => ({ date: m.date, value: m.max_hr })) || [],
      color: '#dc2626'
    },
  ]

  // Questionnaire chart data
  const sleepQualityData = questionnaires?.map((q) => ({
    date: formatDate(q.date),
    value: q.perceived_sleep_quality,
  })) || []

  const fatigueData = questionnaires?.map((q) => ({
    date: formatDate(q.date),
    value: q.fatigue_level,
  })) || []

  const motivationData = questionnaires?.map((q) => ({
    date: formatDate(q.date),
    value: q.motivation_level,
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

  // Movement speeds for doughnut chart
  const movementData = dailyHealth?.movement_speeds
    ? [
        { name: 'Walking', value: dailyHealth.movement_speeds.walking_minutes || 0, color: '#22c55e' },
        { name: 'Fast Walking', value: dailyHealth.movement_speeds.walking_fast_minutes || 0, color: '#eab308' },
        { name: 'Jogging', value: dailyHealth.movement_speeds.jogging_minutes || 0, color: '#f97316' },
        { name: 'Running', value: dailyHealth.movement_speeds.running_minutes || 0, color: '#ef4444' },
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
        {/* Loading skeleton for daily snapshot */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="text-center p-4 animate-pulse">
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-2" />
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
            </Card>
          ))}
        </div>
        {/* Loading skeleton for charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <div className="h-48 animate-pulse bg-gray-100 dark:bg-gray-700 rounded" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{participantName}</h3>

      {/* Daily Snapshot Section */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">Daily Snapshot</h4>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard
            label="Resting HR"
            value={dailyHealth?.resting_hr}
            unit="bpm"
            color="text-red-500"
          />
          <MetricCard
            label="Max HR"
            value={dailyHealth?.max_hr}
            unit="bpm"
            color="text-red-600"
          />
          <MetricCard
            label="Sleep"
            value={dailyHealth?.sleep_hours?.toFixed(1)}
            unit="hrs"
            color="text-blue-500"
          />
          <MetricCard
            label="HRV"
            value={dailyHealth?.hrv_rest}
            unit="ms"
            color="text-purple-500"
          />
          <MetricCard
            label="Steps"
            value={dailyHealth?.step_count?.toLocaleString()}
            color="text-green-500"
          />
        </div>

        {/* Heart Rate Zones + Movement Speeds */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Heart Rate Zones">
            {zonesData.length > 0 ? (
              <DoughnutChart data={zonesData} height="200px" />
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 dark:text-gray-500">
                No data available
              </div>
            )}
          </Card>
          <Card title="Movement Speeds (minutes)">
            {movementData.some(d => d.value > 0) ? (
              <DoughnutChart data={movementData} height="200px" />
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 dark:text-gray-500">
                No data available
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Health Trends Section */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">Health Trends</h4>

        {/* Row 1: Heart Rate (combined) + HRV */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Heart Rate">
            <MultiLineChart series={hrSeries} yAxisLabel="BPM" height="220px" formatDates />
          </Card>
          <Card title="HRV">
            <LineChart data={hrvData} color="#8b5cf6" height="220px" />
          </Card>
        </div>

        {/* Row 2: Sleep + Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Sleep Hours">
            <LineChart data={sleepData} color="#06b6d4" height="220px" />
          </Card>
          <Card title="Steps">
            <LineChart data={stepsData} color="#22c55e" height="220px" />
          </Card>
        </div>
      </div>

      {/* Psychological Trends Section */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">Psychological Trends</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="Sleep Quality (1-100)">
            {sleepQualityData.length > 0 ? (
              <LineChart data={sleepQualityData} color="#06b6d4" height="200px" />
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 dark:text-gray-500">
                No questionnaire data
              </div>
            )}
          </Card>
          <Card title="Fatigue Level (1-100)">
            {fatigueData.length > 0 ? (
              <LineChart data={fatigueData} color="#f97316" height="200px" />
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 dark:text-gray-500">
                No questionnaire data
              </div>
            )}
          </Card>
          <Card title="Motivation Level (1-100)">
            {motivationData.length > 0 ? (
              <LineChart data={motivationData} color="#10b981" height="200px" />
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 dark:text-gray-500">
                No questionnaire data
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Anomaly Section */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">Anomaly Detection</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Today's Anomaly Scores">
            {anomalyData.length > 0 ? (
              <LineChart data={anomalyData} color="#dc2626" height="220px" />
            ) : (
              <div className="h-52 flex items-center justify-center text-gray-400 dark:text-gray-500">
                No anomalies detected
              </div>
            )}
          </Card>
          <Card title="Anomaly Heatmap">
            {anomaliesRange && anomaliesRange.length > 0 ? (
              <div className="flex flex-col overflow-hidden">
                {/* Get unique dates from range data */}
                {(() => {
                  const uniqueDates = [...new Set(anomaliesRange.map(a => a.date))].sort().reverse()
                  const getScoreColor = (score: number) => {
                    if (score > 0.7) return `rgba(220, 38, 38, ${Math.min(score, 1)})`
                    if (score > 0.4) return `rgba(249, 115, 22, ${Math.min(score, 1)})`
                    if (score > 0) return `rgba(234, 179, 8, ${Math.min(score, 1)})`
                    return 'rgba(229, 231, 235, 0.5)'
                  }

                  return (
                    <>
                      <div className="max-h-48 overflow-y-auto">
                        {uniqueDates.map((date) => {
                          const dayAnomalies = anomaliesRange.filter(a => a.date === date)
                          return (
                            <div key={date} className="flex items-center gap-1 mb-0.5">
                              <span className="text-xs text-gray-500 dark:text-gray-400 w-16 shrink-0">
                                {formatDate(date)}
                              </span>
                              <div className="flex gap-0.5 flex-1">
                                {Array.from({ length: 24 }, (_, hour) => {
                                  const hourAnomalies = dayAnomalies.filter(
                                    (a) => Math.floor(a.time_slot / 60) === hour
                                  )
                                  const avgScore = hourAnomalies.length > 0
                                    ? hourAnomalies.reduce((sum, a) => sum + a.score, 0) / hourAnomalies.length
                                    : 0

                                  return (
                                    <div
                                      key={hour}
                                      className="flex-1 h-4 rounded-sm"
                                      style={{ backgroundColor: getScoreColor(avgScore) }}
                                      title={`${date} ${hour}:00 - Score: ${avgScore.toFixed(2)}`}
                                    />
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex items-center mt-2 pl-16">
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 flex-1">
                          <span>0:00</span>
                          <span>6:00</span>
                          <span>12:00</span>
                          <span>18:00</span>
                          <span>24:00</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-600" />
                          <span>None</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-sm bg-yellow-400" />
                          <span>Low</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-sm bg-orange-500" />
                          <span>Medium</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-sm bg-red-600" />
                          <span>High</span>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            ) : (
              <div className="h-52 flex items-center justify-center text-gray-400 dark:text-gray-500">
                No anomalies detected
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}