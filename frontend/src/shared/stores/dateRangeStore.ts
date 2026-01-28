import { create } from 'zustand'
import { subDays, addDays, format } from 'date-fns'

type DateMode = 'last_7' | 'last_30' | 'last_90' | 'custom'

interface DateRangeState {
  startDate: Date
  endDate: Date
  mode: DateMode
  setDateRange: (start: Date, end: Date) => void
  setMode: (mode: DateMode) => void
  setEndDate: (endDate: Date) => void
  navigateDay: (direction: 'prev' | 'next') => void
  setDaysBack: (days: number) => void
  formattedStartDate: () => string
  formattedEndDate: () => string
}

export const useDateRangeStore = create<DateRangeState>((set, get) => ({
  startDate: subDays(new Date(), 7),
  endDate: new Date(),
  mode: 'last_7',

  setDateRange: (start: Date, end: Date) => {
    set({ startDate: start, endDate: end, mode: 'custom' })
  },

  setMode: (mode: DateMode) => {
    const { endDate } = get()
    let days = 7
    if (mode === 'last_30') days = 30
    if (mode === 'last_90') days = 90

    if (mode !== 'custom') {
      set({
        mode,
        startDate: subDays(endDate, days),
      })
    } else {
      set({ mode })
    }
  },

  setEndDate: (endDate: Date) => {
    const { mode } = get()
    let days = 7
    if (mode === 'last_30') days = 30
    if (mode === 'last_90') days = 90

    set({
      endDate,
      startDate: subDays(endDate, days),
    })
  },

  navigateDay: (direction: 'prev' | 'next') => {
    const { startDate, endDate } = get()
    const delta = direction === 'prev' ? -1 : 1
    set({
      startDate: addDays(startDate, delta),
      endDate: addDays(endDate, delta),
      mode: 'custom',
    })
  },

  setDaysBack: (days: number) => {
    const today = new Date()
    set({
      startDate: subDays(today, days),
      endDate: today,
      mode: days === 7 ? 'last_7' : days === 30 ? 'last_30' : days === 90 ? 'last_90' : 'custom',
    })
  },

  formattedStartDate: () => format(get().startDate, 'yyyy-MM-dd'),
  formattedEndDate: () => format(get().endDate, 'yyyy-MM-dd'),
}))