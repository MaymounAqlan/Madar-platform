import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  icon: React.ReactNode;
  iconBg?: string;
  value: string | number;
  label: string;
  trend?: number;
  trendLabel?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  className?: string;
  valueColor?: string;
}

export default function MetricCard({
  icon,
  iconBg = '#E7FDD8',
  value,
  label,
  trend,
  trendLabel,
  trendDirection = 'up',
  className,
  valueColor = '#0e0f0c',
}: MetricCardProps) {
  const direction = trend !== undefined
    ? (trendDirection !== 'neutral' ? trendDirection : 'neutral')
    : 'neutral';

  const trendColor = direction === 'up' ? '#1ba442' : direction === 'down' ? '#dc2626' : '#828782';

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-3xl border p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
      style={{ background: '#ffffff', borderColor: '#dfe1dd' }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <div>
        <p
          className="text-3xl font-black tracking-tight"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: valueColor }}
        >
          {value}
        </p>
        <p className="mt-1 text-sm font-semibold" style={{ color: '#5b5e5a' }}>
          {label}
        </p>
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1.5">
          <span
            className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ background: `${trendColor}15`, color: trendColor }}
          >
            {direction === 'up' && <TrendingUp size={12} />}
            {direction === 'down' && <TrendingDown size={12} />}
            {direction === 'neutral' && <Minus size={12} />}
            {trend > 0 && direction !== 'down' ? '+' : ''}{trend}
            {trendLabel && ` ${trendLabel}`}
          </span>
        </div>
      )}
    </div>
  );
}
