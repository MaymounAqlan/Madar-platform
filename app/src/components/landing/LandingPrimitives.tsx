import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { Icon } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { landingReveal } from './landingMotion';

interface FeatureIconProps {
  icon: Icon;
  size?: 'card' | 'hero';
  tone?: 'green' | 'neutral' | 'dark' | 'white';
  className?: string;
}

export function FeatureIcon({
  icon: IconComponent,
  size = 'card',
  tone = 'green',
  className,
}: FeatureIconProps) {
  return (
    <span
      className={cn(
        'landing-feature-icon inline-flex shrink-0 items-center justify-center',
        size === 'card' ? 'h-16 w-16' : 'h-20 w-20',
        `landing-feature-icon--${tone}`,
        className,
      )}
      aria-hidden="true"
    >
      <IconComponent
        size={size === 'card' ? 34 : 48}
        weight="regular"
        mirrored={false}
      />
    </span>
  );
}

interface SectionHeaderProps {
  eyebrow: ReactNode;
  title: ReactNode;
  description: ReactNode;
  number?: string;
  align?: 'center' | 'start';
  inverse?: boolean;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  number,
  align = 'center',
  inverse = false,
  className,
}: SectionHeaderProps) {
  return (
    <motion.header
      {...landingReveal}
      className={cn(
        'landing-section-header relative max-w-3xl',
        align === 'center' ? 'mx-auto text-center' : 'text-start',
        className,
      )}
    >
      <div
        className={cn(
          'landing-section-meta relative flex items-center gap-3',
          align === 'center' && 'justify-center',
        )}
      >
        {number ? (
          <span className="landing-section-number" aria-hidden="true">
            {number}
          </span>
        ) : null}
        <p className="text-xs font-bold">{eyebrow}</p>
      </div>
      <h2
        className={cn(
          'landing-section-title relative mt-4 text-3xl font-bold leading-[1.2] sm:text-4xl',
          inverse && 'landing-section-title--inverse',
        )}
      >
        {title}
      </h2>
      <p
        className={cn(
          'landing-section-description relative mt-4 text-sm font-medium leading-7 sm:text-base',
          inverse && 'landing-section-description--inverse',
        )}
      >
        {description}
      </p>
    </motion.header>
  );
}

interface BentoCardProps extends ComponentPropsWithoutRef<typeof motion.article> {
  children: ReactNode;
  tone?: 'white' | 'soft' | 'green' | 'dark';
  cut?: 'none' | 'start' | 'end' | 'both';
}

export function BentoCard({
  children,
  tone = 'white',
  cut = 'end',
  className,
  ...props
}: BentoCardProps) {
  return (
    <motion.article
      {...landingReveal}
      whileHover={{ y: -4 }}
      className={cn(
        'landing-bento-card landing-icon-card relative min-w-0 overflow-hidden',
        `landing-bento-card--${tone}`,
        cut === 'start' && 'landing-cut-start',
        cut === 'end' && 'landing-cut-end',
        cut === 'both' && 'landing-cut-both',
        className,
      )}
      {...props}
    >
      {children}
    </motion.article>
  );
}

interface ConnectedNodeProps {
  icon: Icon;
  label: ReactNode;
  active?: boolean;
  compact?: boolean;
}

export function ConnectedNode({
  icon,
  label,
  active = false,
  compact = false,
}: ConnectedNodeProps) {
  const NodeIcon = icon;
  return (
    <div
      className={cn(
        'landing-connected-node relative z-10 flex min-w-0 items-center gap-3',
        compact ? 'min-h-12 px-3 py-2' : 'min-h-16 px-4 py-3',
        active && 'landing-connected-node--active',
      )}
    >
      <span
        className={cn(
          'landing-connected-node-icon flex shrink-0 items-center justify-center',
          compact ? 'h-8 w-8' : 'h-10 w-10',
        )}
        aria-hidden="true"
      >
        <NodeIcon size={compact ? 24 : 29} weight="regular" />
      </span>
      <span className="landing-connected-node-label min-w-0 text-sm font-bold">{label}</span>
    </div>
  );
}

interface ProcessStepProps {
  icon: Icon;
  number: string;
  title: ReactNode;
  compact?: boolean;
}

export function ProcessStep({
  icon,
  number,
  title,
  compact = false,
}: ProcessStepProps) {
  const StepIcon = icon;
  return (
    <div
      className={cn(
        'landing-process-step relative flex min-w-0 items-center gap-3',
        compact ? 'min-h-14 px-3 py-2' : 'min-h-20 px-4 py-3',
      )}
    >
      <span className="landing-step-number" aria-hidden="true">
        {number}
      </span>
      <span className="landing-process-step-icon relative z-10 flex h-11 w-11 shrink-0 items-center justify-center">
        <StepIcon size={30} weight="regular" />
      </span>
      <span className="landing-process-step-title relative z-10 text-sm font-bold leading-6">
        {title}
      </span>
    </div>
  );
}

interface MetricVisualProps {
  label: ReactNode;
  value?: number;
  muted?: boolean;
}

export function MetricVisual({ label, value, muted = false }: MetricVisualProps) {
  const safeValue = Math.min(100, Math.max(0, value ?? 64));
  return (
    <div className="landing-metric-visual">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold">
        <span>{label}</span>
        {value === undefined ? null : <span>{value}%</span>}
      </div>
      <div className="landing-metric-track mt-2 h-1.5 overflow-hidden rounded-full">
        <span
          className={cn('landing-metric-fill block h-full rounded-full', muted && 'landing-metric-fill--muted')}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
