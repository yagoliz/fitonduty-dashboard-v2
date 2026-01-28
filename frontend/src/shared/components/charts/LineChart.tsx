import { BaseChart } from './BaseChart'
import { useChartTheme } from '@/shared/hooks/useChartTheme'
import type { EChartsOption } from 'echarts'

interface LineChartProps {
  title?: string
  data: { date: string; value: number | null }[]
  color?: string
  yAxisLabel?: string
  loading?: boolean
  height?: string
}

export function LineChart({
  title,
  data,
  color = '#06b6d4',
  yAxisLabel,
  loading,
  height = '300px',
}: LineChartProps) {
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
      trigger: 'axis',
      backgroundColor: theme.tooltipBg,
      borderColor: theme.tooltipBorder,
      textStyle: { color: theme.tooltipText },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: title ? '15%' : '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.date),
      axisLine: { lineStyle: { color: theme.axisColor } },
      axisLabel: { color: theme.textColor, fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: yAxisLabel,
      nameLocation: 'middle',
      nameGap: 50,
      nameTextStyle: { color: theme.textColor },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: theme.gridColor } },
      axisLabel: { color: theme.textColor, fontSize: 11 },
    },
    series: [
      {
        type: 'line',
        data: data.map((d) => d.value),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color, width: 2 },
        itemStyle: { color },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${color}40` },
              { offset: 1, color: `${color}05` },
            ],
          },
        },
      },
    ],
  }

  return <BaseChart option={option} loading={loading} style={{ height }} />
}