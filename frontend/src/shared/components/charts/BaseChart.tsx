import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import { CSSProperties } from 'react'

interface BaseChartProps {
  option: EChartsOption
  style?: CSSProperties
  loading?: boolean
  className?: string
}

export function BaseChart({ option, style, loading, className }: BaseChartProps) {
  const defaultStyle: CSSProperties = {
    height: '300px',
    width: '100%',
    ...style,
  }

  return (
    <ReactECharts
      option={option}
      style={defaultStyle}
      className={className}
      showLoading={loading}
      opts={{ renderer: 'canvas' }}
      notMerge={true}
    />
  )
}