import { BaseChart } from './BaseChart'
import { useChartTheme } from '@/shared/hooks/useChartTheme'
import type { EChartsOption } from 'echarts'

interface DoughnutChartProps {
  title?: string
  data: { name: string; value: number; color?: string }[]
  loading?: boolean
  height?: string
  unit?: string
}

const defaultColors = ['#10b981', '#22c55e', '#eab308', '#f97316', '#ef4444']

export function DoughnutChart({ title, data, loading, height = '300px', unit = '%' }: DoughnutChartProps) {
  const theme = useChartTheme()

  const option: EChartsOption = {
    title: title
      ? {
          text: title,
          left: 'center',
          textStyle: { fontSize: 14, fontWeight: 600, color: theme.textColor },
        }
      : undefined,
    tooltip: {
      trigger: 'item',
      formatter: `{b}: {c}${unit}`,
      backgroundColor: theme.tooltipBg,
      borderColor: theme.tooltipBorder,
      textStyle: { color: theme.tooltipText },
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { fontSize: 11, color: theme.textColor },
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' },
        },
        data: data.map((d, i) => ({
          name: d.name,
          value: d.value,
          itemStyle: { color: d.color || defaultColors[i % defaultColors.length] },
        })),
      },
    ],
  }

  return <BaseChart option={option} loading={loading} style={{ height }} />
}