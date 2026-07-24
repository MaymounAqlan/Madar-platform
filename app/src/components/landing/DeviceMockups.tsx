import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DeviceProps {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
}

interface FloatingCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
}

export function LaptopMockup({ src, alt, className, imageClassName }: DeviceProps) {
  return (
    <div className={cn('relative w-full', className)}>
      <div className="rounded-[18px] border border-white/20 bg-[#161814] p-1.5 shadow-[0_24px_70px_rgba(0,0,0,0.32)] sm:rounded-[24px] sm:p-2">
        <div className="flex h-6 items-center gap-1.5 rounded-t-[13px] bg-[#242722] px-3 sm:h-8 sm:rounded-t-[17px]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5b5e5a]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#5b5e5a]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#9fe870]" />
        </div>
        <div className="aspect-[16/9] overflow-hidden rounded-b-[13px] bg-white sm:rounded-b-[17px]">
          <img
            src={src}
            alt={alt}
            loading="eager"
            decoding="async"
            className={cn('h-full w-full object-contain object-top', imageClassName)}
          />
        </div>
      </div>
      <div className="mx-auto h-2 w-[88%] rounded-b-xl bg-[#c9ccc6] shadow-sm sm:h-3" />
      <div className="mx-auto h-1 w-[18%] rounded-b-lg bg-[#aeb2ab]" />
    </div>
  );
}

export function PhoneMockup({ src, alt, className, imageClassName }: DeviceProps) {
  return (
    <div
      className={cn(
        'relative aspect-[390/844] w-full overflow-hidden rounded-[28px] border-[5px] border-[#161814] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.3)] sm:rounded-[34px] sm:border-[7px]',
        className,
      )}
    >
      <span className="absolute left-1/2 top-1.5 z-10 h-3 w-14 -translate-x-1/2 rounded-full bg-[#161814] sm:top-2 sm:h-4 sm:w-20" />
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn('h-full w-full object-contain object-top', imageClassName)}
      />
    </div>
  );
}

export function TabletMockup({ src, alt, className, imageClassName }: DeviceProps) {
  return (
    <div
      className={cn(
        'relative aspect-[16/10] w-full overflow-hidden rounded-[24px] border-[7px] border-[#161814] bg-white shadow-[0_20px_55px_rgba(14,15,12,0.2)]',
        className,
      )}
    >
      <span className="absolute left-1/2 top-1 z-10 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#5b5e5a]" />
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn('h-full w-full object-contain object-top', imageClassName)}
      />
    </div>
  );
}

export function FloatingCard({ icon, title, description, className }: FloatingCardProps) {
  return (
    <div
      className={cn(
        'landing-float-card hidden w-56 items-start gap-3 rounded-xl border border-[#dfe1dd] bg-white p-3.5 text-start shadow-[0_14px_35px_rgba(14,15,12,0.14)] sm:flex',
        className,
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#e7fdd8] text-[#1ba442]">
        {icon}
      </span>
      <span className="min-w-0">
        <strong className="block text-xs font-bold text-[#0e0f0c]">{title}</strong>
        <span className="mt-0.5 block text-[11px] font-medium leading-5 text-[#5b5e5a]">{description}</span>
      </span>
    </div>
  );
}
