import { Dices } from 'lucide-react';
import { isDevelopmentTestDataEnabled } from '@/utils/testDataGenerator';

export default function DevelopmentAutofillButton({ onClick, label = 'تعبئة بيانات تجريبية', className = '' }: { onClick: () => void; label?: string; className?: string }) {
  if (!isDevelopmentTestDataEnabled) return null;
  return <button type="button" onClick={onClick} className={`inline-flex items-center gap-2 rounded-full border border-dashed border-[#B45309] px-3 py-2 text-xs font-bold text-[#B45309] ${className}`} title="للاختبار فقط">
    <Dices size={14} />{label}<span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px]">للاختبار فقط</span>
  </button>;
}
