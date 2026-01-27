import { BaseChart } from './BaseChart'
import type { EChartsOption } from 'echarts'
import { format, parseISO } from 'date-fns'

interface SeriesData {
  name: string
  data: { date: string; value: number | null }[]
  color?: string
}

interface MultiLineChartProps {
  title?: string
  series: SeriesData[]
  yAxisLabel?: string
  loading?: boolean
  height?: string
  formatDates?: boolean // If true, dates are ISO strings that need formatting
}

// Default colors for multiple series
const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
]

export function MultiLineChart({
  title,
  series,
  yAxisLabel,
  loading,
  height = '300px',
  formatDates = false,
}: MultiLineChartProps) {
  // Get all unique dates across all series and sort chronologically
  const allDates = [...new Set(series.flatMap((s) => s.data.map((d) => d.date)))]
    .sort((a, b) => {
      // Try to parse as dates for proper sorting
      const dateA = new Date(a)
      const dateB = new Date(b)
      if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
        return dateA.getTime() - dateB.getTime()
      }
      // Fallback to string comparison
      return a.localeCompare(b)
    })

  // Format dates for display if needed
  const displayDates = formatDates
    ? allDates.map((d) => {
        try {
          return format(parseISO(d), 'MMM d')
        } catch {
          return d
        }
      })
    : allDates

  const option: EChartsOption = {
    title: title
      ? {
          text: title,
          left: 'center',
          textStyle: { fontSize: 14, fontWeight: 600 },
        }
      : undefined,
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      textStyle: { color: '#111827' },
    },
    legend: {
      data: series.map((s) => s.name),
      bottom: 0,
      textStyle: { fontSize: 11, color: '#6b7280' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: title ? '15%' : '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: displayDates,
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: yAxisLabel,
      nameLocation: 'middle',
      nameGap: 50,
      nameTextStyle: { color: '#6b7280' },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: { color: '#6b7280', fontSize: 11 },
    },
    series: series.map((s, index) => {
      const color = s.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
      // Map series data to match allDates
      const dataMap = new Map(s.data.map((d) => [d.date, d.value]))
      const values = allDates.map((date) => dataMap.get(date) ?? null)

      return {
        name: s.name,
        type: 'line' as const,
        data: values,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { color, width: 2 },
        itemStyle: { color },
      }
    }),
  }

  return <BaseChart option={option} loading={loading} style={{ height }} />
}