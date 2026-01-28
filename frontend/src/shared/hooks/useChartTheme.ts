import { useThemeStore } from '@/shared/stores/themeStore'

interface ChartTheme {
  backgroundColor: string
  textColor: string
  gridColor: string
  axisColor: string
  tooltipBg: string
  tooltipBorder: string
  tooltipText: string
}

const lightTheme: ChartTheme = {
  backgroundColor: '#ffffff',
  textColor: '#374151',
  gridColor: '#f3f4f6',
  axisColor: '#e5e7eb',
  tooltipBg: 'rgba(255, 255, 255, 0.95)',
  tooltipBorder: '#e5e7eb',
  tooltipText: '#111827',
}

const darkTheme: ChartTheme = {
  backgroundColor: '#1f2937',
  textColor: '#d1d5db',
  gridColor: '#374151',
  axisColor: '#4b5563',
  tooltipBg: 'rgba(31, 41, 55, 0.95)',
  tooltipBorder: '#4b5563',
  tooltipText: '#f9fafb',
}

export function useChartTheme(): ChartTheme {
  const { theme } = useThemeStore()
  return theme === 'dark' ? darkTheme : lightTheme
}