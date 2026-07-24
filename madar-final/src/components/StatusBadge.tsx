import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'ai' | 'pending' | 'default';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
  icon?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  success: { bg: '#E7FDD8', text: '#1ba442', border: '#1ba442' },
  warning: { bg: '#FEF3C7', text: '#B45309', border: '#F59E0B' },
  error: { bg: '#FEE2E2', text: '#B91C1C', border: '#DC2626' },
  info: { bg: '#DBEAFE', text: '#1D4ED8', border: '#3B82F6' },
  ai: { bg: '#F3E8FF', text: '#7C3AED', border: '#A855F7' },
  pending: { bg: '#FEF3C7', text: '#B45309', border: '#F59E0B' },
  default: { bg: '#f0f1ee', text: '#5b5e5a', border: '#dfe1dd' },
};

export default function StatusBadge({ label, variant = 'default', className, icon }: StatusBadgeProps) {
  const style = variantStyles[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold",
        className
      )}
      style={{ background: style.bg, color: style.text, borderColor: style.border }}
    >
      {icon}
      {label}
    </span>
  );
}
