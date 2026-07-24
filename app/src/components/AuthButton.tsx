import { cn } from '@/lib/utils';

interface AuthButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export default function AuthButton({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  loading = false,
  className,
  icon,
}: AuthButtonProps) {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all duration-200",
        "disabled:cursor-not-allowed disabled:opacity-50",
        !disabled && "hover:scale-[1.02] active:scale-[0.98]",
        isPrimary && "text-[#0e0f0c] shadow-sm hover:shadow-md",
        isSecondary && "border text-[#0e0f0c] hover:bg-[#f0f1ee]",
        isOutline && "border bg-transparent text-[#5b5e5a] hover:bg-[#f0f1ee] hover:text-[#0e0f0c]",
        className
      )}
      style={{
        height: 48,
        background: isPrimary ? '#9fe870' : isSecondary ? '#ffffff' : 'transparent',
        borderColor: isOutline ? '#dfe1dd' : undefined,
      }}
    >
      {loading ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0e0f0c] border-t-transparent" />
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
