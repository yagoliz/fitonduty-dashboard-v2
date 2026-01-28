import { Card } from '@/shared/components/ui/Card'
import type { DailyHealth } from '@/shared/types/api'

interface MetricCardProps {
  label: string
  value: string | number | null
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

interface DailySnapshotProps {
  data: DailyHealth | null | undefined
  loading?: boolean
}

export function DailySnapshot({ data, loading }: DailySnapshotProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="text-center p-4 animate-pulse">
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-2" />
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <MetricCard
        label="Resting HR"
        value={data?.resting_hr}
        unit="bpm"
        color="text-red-500"
      />
      <MetricCard
        label="Max HR"
        value={data?.max_hr}
        unit="bpm"
        color="text-red-600"
      />
      <MetricCard
        label="Sleep"
        value={data?.sleep_hours?.toFixed(1)}
        unit="hrs"
        color="text-blue-500"
      />
      <MetricCard
        label="HRV"
        value={data?.hrv_rest}
        unit="ms"
        color="text-purple-500"
      />
      <MetricCard
        label="Steps"
        value={data?.step_count?.toLocaleString()}
        color="text-green-500"
      />
    </div>
  )
}