import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

interface AuthInputProps {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  icon?: React.ReactNode;
  required?: boolean;
}

export default function AuthInput({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  icon,
  required = false,
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold" style={{ color: '#5b5e5a' }}>
        {label}
        {required && <span style={{ color: '#dc2626' }}> *</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4">
            {icon}
          </div>
        )}
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-xl border bg-white px-4 py-3 text-sm font-semibold text-[#0e0f0c] outline-none transition-all duration-200",
            "placeholder:text-[#828782]",
            "focus:border-[#9fe870] focus:ring-2 focus:ring-[#E7FDD8]",
            error && "border-[#dc2626] ring-2 ring-red-100 focus:border-[#dc2626] focus:ring-red-100",
            icon && "ps-11"
          )}
          style={{ height: 48, borderColor: error ? '#dc2626' : '#dfe1dd' }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 end-0 flex items-center pe-4 text-[#828782] hover:text-[#5b5e5a] transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs font-semibold" style={{ color: '#dc2626' }}>{error}</p>
      )}
    </div>
  );
}
