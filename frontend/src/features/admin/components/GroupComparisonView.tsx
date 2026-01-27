import { Card } from '@/shared/components/ui/Card'
import { MultiLineChart } from '@/shared/components/charts/MultiLineChart'
import type { GroupComparisonData } from '@/shared/types/api'

interface GroupComparisonViewProps {
  data: GroupComparisonData[] | undefined
  loading?: boolean
}

export function GroupComparisonView({
  data,
  loading,
}: GroupComparisonViewProps) {
  // Total participants across all groups
  const totalParticipants = data?.reduce((sum, g) => sum + g.total_participants, 0) || 0

  // Prepare multi-series chart data (use original ISO dates for proper sorting)
  const prepareSeriesData = (
    getValue: (d: GroupComparisonData['daily_data'][0]) => number | null
  ) =>
    data?.map((group) => ({
      name: group.group_name,
      data: group.daily_data.map((d) => ({
        date: d.date,  // Keep original ISO date for proper sorting
        value: getValue(d),
      })),
    })) || []

  const hrSeries = prepareSeriesData((d) => d.avg_resting_hr)
  const sleepSeries = prepareSeriesData((d) => d.avg_sleep_hours)
  const hrvSeries = prepareSeriesData((d) => d.avg_hrv_rest)
  const stepsSeries = prepareSeriesData((d) => d.avg_step_count)

  // Reporting rate series
  const reportingSeries = data?.map((group) => ({
    name: group.group_name,
    data: group.daily_data.map((d) => ({
      date: d.date,  // Keep original ISO date for proper sorting
      value: group.total_participants > 0
        ? Math.round((d.participants_reporting / group.total_participants) * 100)
        : 0,
    })),
  })) || []

  // Questionnaire completion series
  const questionnaireSeries = data?.map((group) => ({
    name: group.group_name,
    data: group.daily_data.map((d) => ({
      date: d.date,  // Keep original ISO date for proper sorting
      value: group.total_participants > 0
        ? Math.round((d.questionnaire_count / group.total_participants) * 100)
        : 0,
    })),
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

  if (!data || data.length === 0) {
    return (
      <Card>
        <div className="p-8 text-center text-gray-500">
          <p>No groups available.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">All Groups Comparison</h3>
        <span className="text-sm text-gray-500">
          {data.length} groups, {totalParticipants} total participants
        </span>
      </div>

      {/* Summary Table */}
      <Card title="Group Overview">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Group
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participants
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Reporting Rate
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Questionnaire Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((group) => {
                const avgReporting = group.daily_data.length > 0
                  ? group.daily_data.reduce((sum, d) =>
                      sum + (group.total_participants > 0
                        ? (d.participants_reporting / group.total_participants) * 100
                        : 0), 0) / group.daily_data.length
                  : 0
                const avgQuestionnaire = group.daily_data.length > 0
                  ? group.daily_data.reduce((sum, d) =>
                      sum + (group.total_participants > 0
                        ? (d.questionnaire_count / group.total_participants) * 100
                        : 0), 0) / group.daily_data.length
                  : 0

                return (
                  <tr key={group.group_id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {group.group_name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                      {group.total_participants}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      <span className={avgReporting >= 70 ? 'text-green-600' : avgReporting >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                        {avgReporting.toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      <span className={avgQuestionnaire >= 70 ? 'text-green-600' : avgQuestionnaire >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                        {avgQuestionnaire.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Comparison Charts */}
      <h4 className="text-md font-medium text-gray-700">Physiological Comparisons</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Avg Resting Heart Rate by Group">
          <MultiLineChart series={hrSeries} height="280px" formatDates />
        </Card>

        <Card title="Avg Sleep Hours by Group">
          <MultiLineChart series={sleepSeries} height="280px" formatDates />
        </Card>

        <Card title="Avg HRV by Group">
          <MultiLineChart series={hrvSeries} height="280px" formatDates />
        </Card>

        <Card title="Avg Steps by Group">
          <MultiLineChart series={stepsSeries} height="280px" formatDates />
        </Card>
      </div>

      {/* Data Quality Comparison */}
      <h4 className="text-md font-medium text-gray-700">Data Quality Comparisons</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Physio Reporting Rate (%) by Group">
          <MultiLineChart series={reportingSeries} height="280px" formatDates />
        </Card>

        <Card title="Questionnaire Completion (%) by Group">
          <MultiLineChart series={questionnaireSeries} height="280px" formatDates />
        </Card>
      </div>
    </div>
  )
}