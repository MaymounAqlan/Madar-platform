import { cn } from '@/lib/utils'

interface MatchScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
  className?: string
  showLabel?: boolean
}

export default function MatchScoreRing({
  score,
  size = 64,
  strokeWidth = 4,
  className,
  showLabel = true,
}: MatchScoreRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  let color = '#9fe870'
  if (score < 40) color = '#dc2626'
  else if (score < 60) color = '#f59e0b'
  else if (score < 80) color = '#3b82f6'

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center',
        className
      )}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#dfe1dd"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 800ms ease-out 200ms',
          }}
        />
      </svg>
      {showLabel && (
        <span
          className="absolute font-bold text-[#0e0f0c]"
          style={{ fontSize: size * 0.28 }}
        >
          {score}%
        </span>
      )}
    </div>
  )
}
