import { Card } from '@/shared/components/ui/Card'
import { LineChart } from '@/shared/components/charts/LineChart'
import { MultiLineChart } from '@/shared/components/charts/MultiLineChart'
import type { HealthMetric, Questionnaire } from '@/shared/types/api'
import { format, parseISO } from 'date-fns'

interface HealthTrendsProps {
  metrics: HealthMetric[] | undefined
  questionnaires: Questionnaire[] | undefined
  loading?: boolean
}

export function HealthTrends({ metrics, questionnaires, loading }: HealthTrendsProps) {
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM d')
    } catch {
      return dateStr
    }
  }

  // Use original ISO dates for MultiLineChart (proper sorting)
  const restingHrData = metrics?.map((m) => ({
    date: m.date,
    value: m.resting_hr,
  })) || []

  const maxHrData = metrics?.map((m) => ({
    date: m.date,
    value: m.max_hr,
  })) || []

  const hrvData = metrics?.map((m) => ({
    date: formatDate(m.date),
    value: m.hrv_rest,
  })) || []

  const sleepData = metrics?.map((m) => ({
    date: formatDate(m.date),
    value: m.sleep_hours,
  })) || []

  const stepsData = metrics?.map((m) => ({
    date: formatDate(m.date),
    value: m.step_count,
  })) || []

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <h3 className="text-l font-bold text-gray-900">Physiological Trends</h3> <br></br>
      <Card title="Heart Rate">
        {loading ? (
          <div className="h-64 animate-pulse bg-gray-100 rounded" />
        ) : (
          <MultiLineChart
            series={[
              { name: 'Resting HR', data: restingHrData, color: '#3b82f6' },
              { name: 'Max HR', data: maxHrData, color: '#ef4444' },
            ]}
            yAxisLabel="BPM"
            height="250px"
            formatDates
          />
        )}
      </Card>

      <Card title="Heart Rate Variability">
        {loading ? (
          <div className="h-64 animate-pulse bg-gray-100 rounded" />
        ) : (
          <LineChart
            data={hrvData}
            color="#8b5cf6"
            yAxisLabel="ms"
            height="250px"
          />
        )}
      </Card>

      <Card title="Sleep Duration">
        {loading ? (
          <div className="h-64 animate-pulse bg-gray-100 rounded" />
        ) : (
          <LineChart
            data={sleepData}
            color="#3b82f6"
            yAxisLabel="Hours"
            height="250px"
          />
        )}
      </Card>

      <Card title="Steps">
        {loading ? (
          <div className="h-64 animate-pulse bg-gray-100 rounded" />
        ) : (
          <LineChart
            data={stepsData}
            color="#22c55e"
            yAxisLabel="Steps"
            height="250px"
          />
        )}
      </Card>

      <h3 className="text-l font-bold text-gray-900 md:col-span-2">Psychological Trends</h3>
      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Sleep Quality (0-100)">
          {loading ? (
            <div className="h-64 animate-pulse bg-gray-100 rounded" />
          ) : (
            <LineChart
              data={sleepQualityData}
              color="#06b6d4"
              yAxisLabel="Level (0-100)"
              height="250px"
            />
          )}
        </Card>

        <Card title="Fatigue Level (0-100)">
          {loading ? (
            <div className="h-64 animate-pulse bg-gray-100 rounded" />
          ) : (
            <LineChart
              data={fatigueData}
              color="#f97316"
              yAxisLabel="Level (0-100)"
              height="250px"
            />
          )}
        </Card>

        <Card title="Motivation Level (0-100)">
          {loading ? (
            <div className="h-64 animate-pulse bg-gray-100 rounded" />
          ) : (
            <LineChart
              data={motivationData}
              color="#06b6d4"
              yAxisLabel="Level (0-100)"
              height="250px"
            />
          )}
        </Card>
      </div>
    </div>
  )
}