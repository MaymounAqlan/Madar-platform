import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, BarChart3, CheckCircle2, TrendingUp, AlertTriangle, Sparkles, HelpCircle, ArrowRightLeft, Building2 } from 'lucide-react';
import PortalLayout from '@/components/PortalLayout';
import ContentCard from '@/components/ContentCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { universityApi } from '@/services/universityApi';

interface BenchmarkingScore {
  overall: number;
  employmentRate: number;
  curriculumAlignment: number;
  studentReadiness: number;
  matchAverage: number;
  skillCoverage: number;
  acceptanceRate: number;
  dataReliability: number;
}

interface UniversityBenchmark {
  id: string;
  name: string;
  nameAr: string;
  logoUrl: string | null;
  isMe: boolean;
  scores: BenchmarkingScore;
  strengths: string[];
  weaknesses: string[];
  gaps: string[];
  aiRecommendation: string;
}

const resolveAssetUrl = (url?: string | null) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
  return `${apiBase}${url.startsWith('/') ? url : `/${url}`}`;
};

export default function UniversityBenchmarking() {
  const { t } = useLanguage();
  const { data: benchmarks, isLoading, isError, refetch } = useQuery<UniversityBenchmark[]>({
    queryKey: ['university', 'benchmarking'],
    queryFn: universityApi.getBenchmarking,
  });

  const myUni = benchmarks?.find((u) => u.isMe);
  const competitors = benchmarks?.filter((u) => !u.isMe) || [];
  
  const [selectedCompId, setSelectedCompId] = useState<string>('');
  const targetComp = competitors.find((u) => u.id === selectedCompId) || competitors[0];

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <PortalLayout title={t('المقارنة المرجعية', 'Benchmarking')} subtitle={t('مقارنة الأداء الأكاديمي والتوظيف', 'Compare academic and employment performance')}>
        <div className="flex h-60 items-center justify-center">
          <p className="animate-pulse text-sm font-semibold text-[#828782]">{t('جاري تحميل بيانات المقارنة المرجعية...', 'Loading benchmarking data...')}</p>
        </div>
      </PortalLayout>
    );
  }

  if (isError || !myUni) {
    return (
      <PortalLayout title={t('المقارنة المرجعية', 'Benchmarking')} subtitle={t('مقارنة الأداء الأكاديمي والتوظيف', 'Compare academic and employment performance')}>
        <div className="flex h-60 flex-col items-center justify-center gap-3">
          <AlertTriangle className="text-amber-500" size={32} />
          <p className="text-sm font-semibold text-[#828782]">{t('تعذر تحميل بيانات المقارنة المرجعية. تأكد من تشغيل وبناء سيرفر الباك إند.', 'Unable to load benchmarking data. Please ensure the backend server is built and running.')}</p>
          <button onClick={handleRefresh} className="rounded-full bg-[#9fe870] px-4 py-2 text-xs font-bold">{t('إعادة المحاولة', 'Retry')}</button>
        </div>
      </PortalLayout>
    );
  }

  const metricsList = [
    { key: 'overall' as const, name: t('التقييم العام للجاهزية', 'Overall Readiness Score'), weight: '100%' },
    { key: 'employmentRate' as const, name: t('نسبة التوظيف المؤكد', 'Confirmed Employment'), weight: '25%' },
    { key: 'curriculumAlignment' as const, name: t('توافق المناهج مع سوق العمل', 'Curriculum Alignment'), weight: '20%' },
    { key: 'studentReadiness' as const, name: t('الجاهزية المهنية للطلاب', 'Student Readiness'), weight: '15%' },
    { key: 'matchAverage' as const, name: t('معدل المطابقة للفرص', 'Match Average'), weight: '15%' },
    { key: 'skillCoverage' as const, name: t('تغطية المهارات المطلوبة', 'Skill Coverage'), weight: '10%' },
    { key: 'acceptanceRate' as const, name: t('نسبة قبول طلبات التوظيف', 'Acceptance Rate'), weight: '10%' },
    { key: 'dataReliability' as const, name: t('موثوقية ومصداقية البيانات', 'Data Reliability'), weight: '5%' },
  ];

  const allUnis = [...(benchmarks || [])].sort((a, b) => b.scores.overall - a.scores.overall);

  return (
    <PortalLayout title={t('المقارنة المرجعية للجامعات', 'University Benchmarking')} subtitle={t('مقارنة الأداء الأكاديمي والتوظيف مع الجامعات الأخرى في النظام', 'Compare academic performance and employment statistics against all registered universities')}>
      
      {/* Top Section: Universities Cards Grid */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-[#0e0f0c] mb-4 flex items-center gap-2">
          <Award size={18} className="text-[#9fe870]" />
          {t('بطاقات تقييم الجامعات ونسبة التحليل لكل جامعة', 'University Assessment Cards & Analysis Percentages')}
        </h3>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allUnis.map((uni) => {
            const isMe = uni.isMe;
            const isSelected = targetComp && targetComp.id === uni.id;
            
            return (
              <div
                key={uni.id}
                onClick={() => {
                  if (!isMe) setSelectedCompId(uni.id);
                }}
                className={`relative p-5 rounded-2xl border transition-all duration-300 ${
                  isMe 
                    ? 'border-[#9fe870] bg-[#fcfdfa] ring-2 ring-[#9fe870]/20 shadow-md cursor-default' 
                    : isSelected 
                      ? 'border-blue-500 bg-blue-50/20 ring-2 ring-blue-500/20 shadow-md cursor-pointer'
                      : 'border-[#dfe1dd] bg-white hover:border-[#828782] hover:shadow-sm cursor-pointer'
                }`}
              >
                {/* Badge Type */}
                <span className={`absolute top-4 left-4 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                  isMe 
                    ? 'bg-[#9fe870] text-[#0e0f0c]' 
                    : 'bg-[#f0f1ee] text-[#5b5e5a]'
                }`}>
                  {isMe ? t('جامعتنا', 'Our University') : t('جامعة منافسة', 'Competitor')}
                </span>

                <div className="flex items-start justify-between gap-4 mt-3">
                  <div className="space-y-1 flex-1">
                    <h4 className="font-black text-sm text-[#0e0f0c]">{uni.nameAr || uni.name}</h4>
                    <p className="text-[11px] text-[#828782] line-clamp-1">{uni.name}</p>
                    {uni.logoUrl ? (
                      <div className="h-16 w-16 mt-3 relative overflow-hidden rounded-lg border border-[#dfe1dd] bg-white shadow-sm flex items-center justify-center group">
                        <Building2 className="text-[#c1c4bf] absolute z-0" size={24} />
                        <img 
                          src={resolveAssetUrl(uni.logoUrl)} 
                          alt={uni.nameAr || uni.name} 
                          className="h-full w-full object-contain p-1 z-10 bg-white" 
                          onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-16 mt-3 rounded-lg border border-[#dfe1dd] bg-[#f0f1ee] shadow-sm flex items-center justify-center">
                        <Building2 className="text-[#a4a7a3]" size={24} />
                      </div>
                    )}
                  </div>
                  
                  {/* Analysis Percentage Circle Indicator */}
                  <div className="flex flex-col items-center">
                    <div className={`flex items-center justify-center h-14 w-14 rounded-full border-4 font-black text-sm ${
                      isMe 
                        ? 'border-[#9fe870] text-emerald-800 bg-white' 
                        : isSelected
                          ? 'border-blue-500 text-blue-800 bg-white'
                          : 'border-[#dfe1dd] text-[#5b5e5a] bg-gray-50'
                    }`}>
                      {uni.scores.overall}%
                    </div>
                    <span className="text-[10px] text-[#828782] mt-1 font-semibold">{t('نسبة التحليل', 'Analysis Score')}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#f0f1ee] grid grid-cols-2 gap-2 text-xs text-[#5b5e5a]">
                  <div>
                    <span className="block text-[10px] text-[#828782]">{t('التوظيف الفعلي:', 'Confirmed Employed:')}</span>
                    <b className="text-slate-800">{uni.scores.employmentRate}%</b>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#828782]">{t('مواءمة المناهج:', 'Curriculum Align:')}</span>
                    <b className="text-slate-800">{uni.scores.curriculumAlignment}%</b>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparison & Analysis Details Workspace */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Left/Middle: Side-by-side Metric Tables */}
        <div className="lg:col-span-2 space-y-6">
          {targetComp ? (
            <ContentCard 
              title={`${t('المقارنة الرقمية التفصيلية بين', 'Detailed Comparison Between')}: ${myUni.nameAr || myUni.name} ${t('و', 'and')} ${targetComp.nameAr || targetComp.name}`} 
              icon={<ArrowRightLeft size={18} />}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-start text-sm">
                  <thead>
                    <tr className="border-b border-[#dfe1dd] text-[#828782] font-semibold text-xs">
                      <th className="py-2 text-start">{t('مؤشر القياس الرئيسي', 'Key Performance Indicator (KPI)')}</th>
                      <th className="py-2 text-center w-28 bg-[#fcfdfa]">{t('جامعتنا', 'Our Uni')}</th>
                      <th className="py-2 text-center w-28">{targetComp.nameAr || targetComp.name}</th>
                      <th className="py-2 text-center w-24">{t('الفارق (Delta)', 'Delta')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f1ee]">
                    {metricsList.map((m) => {
                      const myVal = myUni.scores[m.key];
                      const compVal = targetComp.scores[m.key];
                      const diff = myVal - compVal;
                      
                      return (
                        <tr key={m.key} className="hover:bg-[#fcfdfa] transition-all">
                          <td className="py-3 font-medium">
                            {m.name}
                            <span className="text-[10px] text-[#828782] ms-1">({t('الوزن:', 'Weight:')} {m.weight})</span>
                          </td>
                          <td className="py-3 text-center font-bold text-slate-800 bg-[#fcfdfa]/50">{myVal}%</td>
                          <td className="py-3 text-center font-bold text-slate-600">{compVal}%</td>
                          <td className={`py-3 text-center font-black ${
                            diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-slate-400'
                          }`}>
                            {diff > 0 ? `+${diff}` : diff === 0 ? '0' : diff}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ContentCard>
          ) : (
            <div className="flex h-80 items-center justify-center rounded-xl border border-[#dfe1dd] bg-white p-6">
              <div className="text-center space-y-2">
                <HelpCircle size={32} className="mx-auto text-slate-300" />
                <p className="text-xs text-[#828782]">{t('الرجاء اختيار جامعة منافسة من الأعلى لعرض تفاصيل المقارنة.', 'Please select a competitor university card above to view comparison details.')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: AI Strategic Insights & Gaps */}
        <div className="lg:col-span-1 space-y-4">
          {targetComp ? (
            <>
              {/* Strengths & Weaknesses */}
              <div className="rounded-2xl border border-[#dfe1dd] bg-white p-5 space-y-4">
                <div>
                  <h4 className="font-bold text-xs mb-2 flex items-center gap-1.5 text-emerald-700 uppercase">
                    <CheckCircle2 size={15} />
                    {t('نقاط القوة التنافسية', 'Competitive Strengths')}
                  </h4>
                  <ul className="list-inside list-disc text-xs text-[#5b5e5a] space-y-1">
                    {targetComp.strengths.map((str, idx) => (
                      <li key={idx}>{str}</li>
                    ))}
                    {targetComp.strengths.length === 0 && (
                      <li className="text-[#828782] list-none">{t('لا توجد نقاط قوة مرصودة.', 'No strengths identified.')}</li>
                    )}
                  </ul>
                </div>

                <div className="pt-3 border-t border-[#f0f1ee]">
                  <h4 className="font-bold text-xs mb-2 flex items-center gap-1.5 text-amber-700 uppercase">
                    <AlertTriangle size={15} />
                    {t('نقاط الضعف والفجوات المرصودة', 'Identified Weaknesses & Gaps')}
                  </h4>
                  <ul className="list-inside list-disc text-xs text-[#5b5e5a] space-y-1">
                    {[...targetComp.weaknesses, ...targetComp.gaps].map((weak, idx) => (
                      <li key={idx}>{weak}</li>
                    ))}
                    {targetComp.weaknesses.length === 0 && targetComp.gaps.length === 0 && (
                      <li className="text-[#828782] list-none">{t('مستويات الأداء متفوقة بالكامل.', 'Performance is fully superior.')}</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* AI Strategic Recommendation */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
                <h4 className="font-bold text-xs mb-2 flex items-center gap-1.5 text-blue-900 uppercase">
                  <Sparkles size={15} className="text-blue-500 animate-pulse" />
                  {t('توصية الذكاء الاصطناعي الاستراتيجية', 'AI Strategic Recommendation')}
                </h4>
                <p className="text-xs text-blue-800 leading-relaxed font-medium">
                  {targetComp.aiRecommendation}
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#dfe1dd] bg-[#f7f8f5]/50 p-6 text-center text-xs text-[#828782]">
              {t('حدد بطاقة لعرض التحليلات التنافسية والتوصيات الذكية.', 'Select a card to view competitive analysis and smart recommendations.')}
            </div>
          )}
        </div>

      </div>

    </PortalLayout>
  );
}
