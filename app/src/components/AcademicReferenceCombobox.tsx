import { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, ChevronDown, Landmark, Loader2, Search } from 'lucide-react';
import type { PublicAcademicOption } from '@/types/university.types';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  value: string;
  items: PublicAcademicOption[];
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  selected?: PublicAcademicOption;
  loading?: boolean;
  disabled?: boolean;
  error?: string;
  showUniversityDetails?: boolean;
  onSearch?: (value: string) => void;
  onSelect: (item: PublicAcademicOption) => void;
  onRetry?: () => void;
}

function resolveAsset(value?: string | null) {
  if (!value || typeof window === 'undefined') return '';
  if (/^https?:/i.test(value)) return value;
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const origin = /^https?:/i.test(apiBase) ? new URL(apiBase).origin : window.location.origin;
  return new URL(value, `${origin}/`).toString();
}

export default function AcademicReferenceCombobox({ value, items, placeholder, searchPlaceholder, emptyText, selected, loading, disabled, error, showUniversityDetails, onSearch, onSelect, onRetry }: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedItem = selected?.id === value ? selected : undefined;
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleItems = useMemo(() => {
    if (onSearch || !normalizedQuery) return items;
    return items.filter((item) => [item.name, item.nameAr, item.nameEn, item.governorate]
      .filter(Boolean)
      .some((field) => field!.toLocaleLowerCase().includes(normalizedQuery)));
  }, [items, normalizedQuery, onSearch]);

  const closeMenu = () => {
    setOpen(false);
    setActiveIndex(-1);
    setQuery('');
    onSearch?.('');
  };

  const selectItem = (item: PublicAcademicOption) => {
    onSelect(item);
    closeMenu();
  };

  useEffect(() => {
    const close = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) closeMenu(); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (activeIndex >= visibleItems.length) setActiveIndex(visibleItems.length ? 0 : -1);
  }, [activeIndex, visibleItems.length]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) setOpen(true);
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((current) => {
        if (!visibleItems.length) return -1;
        if (current < 0) return direction > 0 ? 0 : visibleItems.length - 1;
        return (current + direction + visibleItems.length) % visibleItems.length;
      });
      return;
    }
    if (event.key === 'Enter' && open && activeIndex >= 0 && visibleItems[activeIndex]) {
      event.preventDefault();
      selectItem(visibleItems[activeIndex]);
    }
  };

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button type="button" disabled={disabled} onClick={() => open ? closeMenu() : setOpen(true)} onKeyDown={handleKeyDown} className="flex min-h-12 w-full min-w-0 items-center gap-3 rounded-2xl border border-[#dfe1dd] bg-white px-3 text-start text-sm transition hover:border-[#9fe870] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9fe870]/40 disabled:cursor-not-allowed disabled:opacity-50" aria-haspopup="listbox" aria-expanded={open}>
        {showUniversityDetails ? (
          selectedItem?.logoUrl ? <img src={resolveAsset(selectedItem.logoUrl)} alt="" className="h-9 w-9 shrink-0 rounded-lg border border-[#dfe1dd] bg-white object-contain p-1" /> : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f0f1ee]"><Landmark size={18} /></span>
        ) : <Building2 size={18} className="shrink-0 text-[#5b5e5a]" />}
        <span className="min-w-0 flex-1">
          <span className={cn('block break-words font-semibold', selectedItem ? 'text-[#0e0f0c]' : 'text-[#828782]')} title={selectedItem?.nameAr || selectedItem?.name}>{selectedItem ? (selectedItem.nameAr || selectedItem.name) : placeholder}</span>
          {showUniversityDetails && selectedItem && <span className="mt-0.5 block truncate text-xs text-[#5b5e5a]" title={[selectedItem.nameEn, selectedItem.governorate].filter(Boolean).join(' - ')}>{[selectedItem.nameEn, selectedItem.governorate].filter(Boolean).join(' - ')}</span>}
        </span>
        <ChevronDown size={17} className={cn('shrink-0 transition', open && 'rotate-180')} />
      </button>
      {open && !disabled && (
        <div className="absolute z-50 mt-2 w-full min-w-0 overflow-hidden rounded-2xl border border-[#dfe1dd] bg-white shadow-lg">
          <div className="relative border-b border-[#dfe1dd] p-2">
            <Search size={16} className="pointer-events-none absolute start-5 top-1/2 -translate-y-1/2 text-[#828782]" />
            <input autoFocus value={query} onKeyDown={handleKeyDown} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); onSearch?.(event.target.value); }} placeholder={searchPlaceholder} className="h-11 w-full rounded-xl bg-[#f0f1ee] pe-3 ps-10 text-sm outline-none focus:ring-2 focus:ring-[#9fe870]" />
          </div>
          <div role="listbox" className="max-h-72 overflow-y-auto p-1">
            {loading ? <div className="flex min-h-20 items-center justify-center"><Loader2 size={20} className="animate-spin text-[#1ba442]" /></div> : error ? (
              <div className="p-4 text-center text-xs text-red-700"><p>{error}</p>{onRetry && <button type="button" onClick={onRetry} className="mt-2 min-h-11 rounded-xl border border-[#dfe1dd] px-4 font-semibold text-[#0e0f0c]">{t('إعادة المحاولة', 'Retry')}</button>}</div>
            ) : visibleItems.length ? visibleItems.map((item, index) => (
              <button key={item.id} type="button" role="option" aria-selected={item.id === value} onMouseEnter={() => setActiveIndex(index)} onClick={() => selectItem(item)} className={cn('flex min-h-12 w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2 text-start hover:bg-[#f0f1ee]', item.id === value && 'bg-[#e7fdd8]', index === activeIndex && item.id !== value && 'bg-[#f0f1ee]')}>
                {showUniversityDetails ? item.logoUrl ? <img src={resolveAsset(item.logoUrl)} alt="" className="h-10 w-10 shrink-0 rounded-lg border border-[#dfe1dd] bg-white object-contain p-1" /> : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0f1ee]"><Landmark size={18} /></span> : <Building2 size={17} className="shrink-0 text-[#5b5e5a]" />}
                <span className="min-w-0 flex-1"><span className="block break-words text-sm font-semibold text-[#0e0f0c]" title={item.nameAr || item.name}>{item.nameAr || item.name}</span>{showUniversityDetails && <span className="mt-0.5 block truncate text-xs text-[#5b5e5a]" title={[item.nameEn, item.governorate, item.ownership === 'public' ? t('حكومية', 'Public') : t('أهلية', 'Private')].filter(Boolean).join(' - ')}>{[item.nameEn, item.governorate, item.ownership === 'public' ? t('حكومية', 'Public') : t('أهلية', 'Private')].filter(Boolean).join(' - ')}</span>}</span>
              </button>
            )) : <p className="p-5 text-center text-sm text-[#5b5e5a]">{emptyText}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
