import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { isRTL, t } = useLanguage();

  return (
    <div className={cn('min-h-[100dvh] flex flex-col lg:flex-row', isRTL ? 'rtl' : 'ltr')}>
      <motion.div
        initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className={cn(
          'relative flex flex-col items-center justify-center overflow-hidden px-8 py-12 lg:w-[40%] lg:min-h-[100dvh]',
          isRTL ? 'lg:order-2' : 'lg:order-1',
        )}
        style={{ background: 'linear-gradient(135deg, #0e0f0c 0%, #1a1c18 100%)' }}
      >
        <div
          className="absolute rounded-full opacity-20 blur-3xl"
          style={{
            width: 300,
            height: 300,
            background: 'radial-gradient(circle, #9fe870 0%, transparent 70%)',
            top: '10%',
            [isRTL ? 'left' : 'right']: '-10%',
          }}
        />
        <div
          className="absolute rounded-full opacity-10 blur-3xl"
          style={{
            width: 250,
            height: 250,
            background: 'radial-gradient(circle, #9fe870 0%, transparent 70%)',
            bottom: '15%',
            [isRTL ? 'right' : 'left']: '-5%',
          }}
        />

        <div className="relative z-10 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8 flex justify-center"
          >
            <img src="/images/madar-logo.png" alt="MADAR" className="w-56 sm:w-72 lg:w-80 h-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mx-auto max-w-xs text-base font-semibold leading-relaxed"
            style={{ color: '#828782' }}
          >
            {t('منصتك الذكية للتوظيف والتوجيه المهني', 'Your AI-powered career guidance and recruitment platform')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-8 flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
            style={{ background: 'rgba(159,232,112,0.1)', color: '#9fe870', border: '1px solid rgba(159,232,112,0.2)' }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: '#9fe870' }} />
            {t('مدعوم بالذكاء الاصطناعي', 'AI-Powered')}
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: isRTL ? -50 : 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className={cn(
          'flex flex-1 items-center justify-center px-6 py-12 lg:px-16',
          isRTL ? 'lg:order-1' : 'lg:order-2',
        )}
        style={{ background: '#ffffff' }}
      >
        <div className="w-full max-w-md">{children}</div>
      </motion.div>
    </div>
  );
}
