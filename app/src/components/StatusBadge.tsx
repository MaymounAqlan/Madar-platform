import { cn } from '@/lib/utils';

type BadgeVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'ai'
  | 'pending'
  | 'default'
  | 'new'
  | 'submitted'
  | 'in-review'
  | 'interview'
  | 'accepted'
  | 'rejected';

interface StatusBadgeProps {
  label?: string;
  children?: React.ReactNode;
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
  new: { bg: '#DBEAFE', text: '#1D4ED8', border: '#3B82F6' },
  submitted: { bg: '#DBEAFE', text: '#1D4ED8', border: '#3B82F6' },
  'in-review': { bg: '#FEF3C7', text: '#B45309', border: '#F59E0B' },
  interview: { bg: '#F3E8FF', text: '#7C3AED', border: '#A855F7' },
  accepted: { bg: '#E7FDD8', text: '#1ba442', border: '#1ba442' },
  rejected: { bg: '#FEE2E2', text: '#B91C1C', border: '#DC2626' },
};

export default function StatusBadge({ label, children, variant = 'default', className, icon }: StatusBadgeProps) {
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
      {label ?? children}
    </span>
  );
}
