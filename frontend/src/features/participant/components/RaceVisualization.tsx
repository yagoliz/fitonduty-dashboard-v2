import { useMemo } from 'react'
import { BaseChart } from '@/shared/components/charts/BaseChart'
import { useChartTheme } from '@/shared/hooks/useChartTheme'
import type { EChartsOption } from 'echarts'
import type { GroupRanking } from '@/shared/types/api'

interface RaceVisualizationProps {
  participants: GroupRanking[]
  currentUserId: number
  title?: string
  loading?: boolean
}

export function RaceVisualization({
  participants,
  currentUserId,
  title = 'Your Data Consistency',
  loading,
}: RaceVisualizationProps) {
  const theme = useChartTheme()

  const option = useMemo<EChartsOption>(() => {
    if (!participants.length) {
      return {}
    }

    // Find current user and others
    const currentUser = participants.find((p) => p.participant_id === currentUserId)
    const others = participants.filter((p) => p.participant_id !== currentUserId)

    // Use completion_rate (0-100) and normalize to 0-1
    const currentNormalized = currentUser ? currentUser.completion_rate / 100 : 0

    // Create y positions for other participants (spread them vertically)
    const otherData = others.map((p, i) => {
      const normalizedValue = p.completion_rate / 100
      const yPosition = ((i - others.length / 2) / (others.length / 2)) * 0.4
      return {
        value: [normalizedValue, yPosition],
        name: p.username,
      }
    })

    // Choose emoji based on completion rate
    const emojis = ['😴', '😐', '😊', '😎', '👑']
    let emoji = emojis[0]
    if (currentNormalized >= 1) emoji = emojis[4]
    else if (currentNormalized >= 0.8) emoji = emojis[3]
    else if (currentNormalized >= 0.5) emoji = emojis[2]
    else if (currentNormalized >= 0.25) emoji = emojis[1]

    // Calculate rank based on completion rate
    const rank = others.filter((p) => p.completion_rate > (currentUser?.completion_rate || 0)).length + 1

    return {
      title: {
        text: title,
        left: 'center',
        top: 5,
        textStyle: { fontSize: 14, fontWeight: 600, color: theme.textColor },
      },
      grid: {
        left: 40,
        right: 40,
        top: 50,
        bottom: 60,
      },
      xAxis: {
        type: 'value',
        min: -0.01,
        max: 1.01,
        axisLabel: {
          formatter: (value: number) => `${Math.round(value * 100)}%`,
          color: theme.textColor,
        },
        splitLine: { show: false },
        axisLine: { lineStyle: { color: theme.axisColor } },
      },
      yAxis: {
        type: 'value',
        min: -0.8,
        max: 0.8,
        show: false,
      },
      graphic: [
        // Track background
        {
          type: 'rect',
          left: 40,
          right: 40,
          top: 80,
          bottom: 90,
          shape: { r: 4 },
          style: { fill: 'rgba(6, 182, 212, 0.15)' },
          z: -1,
        },
        // Start line
        {
          type: 'line',
          shape: { x1: 40, y1: 60, x2: 40, y2: 200 },
          style: { stroke: theme.axisColor, lineWidth: 2 },
        },
        // Finish line
        {
          type: 'line',
          shape: { x1: 'auto', y1: 60, x2: 'auto', y2: 200 },
          left: 'auto',
          right: 70,
          style: { stroke: '#22c55e', lineWidth: 3, lineDash: [5, 3] },
        },
        // Start label
        {
          type: 'text',
          left: 35,
          top: 45,
          style: { text: 'Start', fill: theme.textColor, fontSize: 11 },
        },
        // Finish label
        {
          type: 'text',
          right: 55,
          top: 45,
          style: { text: '🏁 Leader', fill: '#22c55e', fontSize: 12, fontWeight: 600 },
        },
      ],
      series: [
        // Other participants
        {
          type: 'scatter',
          data: otherData,
          symbolSize: 28,
          itemStyle: {
            color: 'rgba(156, 163, 175, 0.5)',
            borderColor: 'rgba(75, 85, 99, 0.6)',
            borderWidth: 2,
          },
          emphasis: {
            itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.2)' },
          },
          z: 1,
        },
        // Current user
        {
          type: 'scatter',
          data: [[currentNormalized, 0]],
          symbolSize: 50,
          itemStyle: {
            color: 'rgba(250, 204, 21, 0.4)',
            borderColor: 'transparent',
          },
          label: {
            show: true,
            formatter: emoji,
            fontSize: 32,
            position: 'inside',
          },
          z: 2,
        },
        // Position annotation (using a hidden scatter with label)
        {
          type: 'scatter',
          data: [[currentNormalized, -0.65]],
          symbol: 'none',
          label: {
            show: true,
            formatter: `Position: ${rank}/${participants.length}`,
            fontSize: 12,
            fontWeight: 600,
            color: theme.textColor,
          },
          z: 3,
        },
      ],
      tooltip: {
        trigger: 'item',
        backgroundColor: theme.tooltipBg,
        borderColor: theme.tooltipBorder,
        textStyle: { color: theme.tooltipText },
        formatter: (params: { data: { name?: string; value: number[] } }) => {
          if (params.data.name) {
            const pct = Math.round(params.data.value[0] * 100)
            return `${params.data.name}: ${pct}%`
          }
          return ''
        },
      },
    }
  }, [participants, currentUserId, title, theme])

  if (!participants.length && !loading) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500">
        No ranking data available
      </div>
    )
  }

  return <BaseChart option={option} loading={loading} style={{ height: '280px' }} />
}