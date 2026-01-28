import { Card } from '@/shared/components/ui/Card'

interface RankingCardProps {
  title: string
  rank: number | null
  totalParticipants: number | null
  subtitle?: string
  value?: string
  color?: 'primary' | 'green' | 'orange' | 'purple'
  loading?: boolean
}

const colorClasses = {
  primary: 'text-primary-600 bg-primary-600',
  green: 'text-green-600 bg-green-600',
  orange: 'text-orange-600 bg-orange-600',
  purple: 'text-purple-600 bg-purple-600',
}

export function RankingCard({
  title,
  rank,
  totalParticipants,
  subtitle,
  value,
  color = 'primary',
  loading,
}: RankingCardProps) {
  const colors = colorClasses[color]
  const rankPercent = rank && totalParticipants ? ((totalParticipants - rank + 1) / totalParticipants) * 100 : 0

  if (loading) {
    return (
      <Card title={title}>
        <div className="space-y-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-10 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </Card>
    )
  }

  return (
    <Card title={title}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className={`text-4xl font-bold ${colors.split(' ')[0]}`}>
            #{rank ?? '--'}
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            of {totalParticipants ?? '--'} participants
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${colors.split(' ')[1]}`}
            style={{ width: `${rankPercent}%` }}
          />
        </div>
        {(subtitle || value) && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {subtitle}: {value ?? '--'}
          </p>
        )}
      </div>
    </Card>
  )
}