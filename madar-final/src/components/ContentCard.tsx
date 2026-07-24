import { cn } from '@/lib/utils';

interface ContentCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  noPadding?: boolean;
}

export default function ContentCard({ children, className, title, subtitle, icon, action, noPadding }: ContentCardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border shadow-sm transition-all duration-200 hover:shadow-md",
        !noPadding && "p-6",
        className
      )}
      style={{ background: '#ffffff', borderColor: '#dfe1dd' }}
    >
      {(title || action) && (
        <div className={cn("flex items-start justify-between", !noPadding ? "" : "px-6 pt-6 pb-4")}>
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: '#f0f1ee' }}>
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-base font-black" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#0e0f0c' }}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-0.5 text-xs font-semibold" style={{ color: '#5b5e5a' }}>{subtitle}</p>
              )}
            </div>
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn((title || action) && !noPadding && "mt-4")}>
        {children}
      </div>
    </div>
  );
}
