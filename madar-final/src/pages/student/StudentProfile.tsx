import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import PortalLayout from '@/components/PortalLayout';
import ContentCard from '@/components/ContentCard';
import { studentProfile, skills, projects, certifications } from '@/data/student';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  User, GraduationCap, BookOpen, FolderOpen, Award, FileText,
  MapPin, Mail, Phone, Calendar, Edit3, Plus, ExternalLink, Github,
  Upload, CheckCircle2, Sparkles, TrendingUp, Globe,
} from 'lucide-react';

const levelColors: Record<string, string> = {
  expert: '#1ba442',
  advanced: '#3b82f6',
  intermediate: '#f59e0b',
  beginner: '#828782',
};

const levelLabels = {
  expert: { ar: 'خبير', en: 'Expert' },
  advanced: { ar: 'متقدم', en: 'Advanced' },
  intermediate: { ar: 'متوسط', en: 'Intermediate' },
  beginner: { ar: 'مبتدئ', en: 'Beginner' },
};

const levelWidths: Record<string, string> = {
  expert: '100%',
  advanced: '75%',
  intermediate: '50%',
  beginner: '25%',
};

const suggestedSkills = ['Docker', 'Kubernetes', 'AWS', 'GraphQL', 'Redis', 'Next.js'];

export default function StudentProfile() {
  const { t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState('personal');
  const [editing, setEditing] = useState(false);
  const [cvUploaded, setCvUploaded] = useState(true);

  const profileCompletion = 75;

  const tabItems = [
    { key: 'personal', labelAr: 'المعلومات الشخصية', labelEn: 'Personal Info', icon: <User size={16} /> },
    { key: 'academic', labelAr: 'الأكاديمي', labelEn: 'Academic', icon: <GraduationCap size={16} /> },
    { key: 'skills', labelAr: 'المهارات', labelEn: 'Skills', icon: <BookOpen size={16} /> },
    { key: 'projects', labelAr: 'المشاريع', labelEn: 'Projects', icon: <FolderOpen size={16} /> },
    { key: 'certifications', labelAr: 'الشهادات', labelEn: 'Certifications', icon: <Award size={16} /> },
    { key: 'cv', labelAr: 'السيرة الذاتية', labelEn: 'CV', icon: <FileText size={16} /> },
  ];

  const groupedSkills = skills.reduce<Record<string, typeof skills>>((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {});

  return (
    <PortalLayout title={t('الملف الشخصي', 'Profile')}>
      <div className={cn("space-y-6", isRTL ? "rtl" : "ltr")}>

        {/* Profile Header */}
        <div className="relative overflow-hidden rounded-[24px] border border-[#dfe1dd] bg-white shadow-sm">
          {/* Banner */}
          <div className="h-32 sm:h-40" style={{ background: 'linear-gradient(135deg, #9fe870 0%, #7dd455 50%, #3b82f6 100%)' }} />
          {/* Avatar & Info */}
          <div className="relative px-6 pb-6">
            <div className="-mt-12 mb-3 flex justify-center sm:justify-start">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-[#f0f1ee] shadow-md">
                <User size={40} style={{ color: '#828782' }} />
              </div>
            </div>
            <div className="text-center sm:text-start">
              <h2 className="text-xl font-black text-[#0e0f0c]">
                {isRTL ? studentProfile.nameAr : studentProfile.nameEn}
              </h2>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E7FDD8] px-3 py-0.5 text-xs font-semibold" style={{ color: '#1ba442' }}>
                  <GraduationCap size={12} />
                  {isRTL ? studentProfile.universityAr : studentProfile.universityEn}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#DBEAFE] px-3 py-0.5 text-xs font-semibold" style={{ color: '#1D4ED8' }}>
                  <BookOpen size={12} />
                  {isRTL ? studentProfile.collegeAr : studentProfile.collegeEn}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F3E8FF] px-3 py-0.5 text-xs font-semibold" style={{ color: '#7C3AED' }}>
                  <Calendar size={12} />
                  {isRTL ? studentProfile.yearLabelAr : studentProfile.yearLabelEn}
                </span>
              </div>
              {/* Profile Completion */}
              <div className="mx-auto mt-4 max-w-xs sm:mx-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold text-[#5b5e5a]">{t('اكتمال الملف', 'Profile Completion')}</span>
                  <span className="text-[10px] font-bold" style={{ color: '#9fe870' }}>{profileCompletion}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#f0f1ee]">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${profileCompletion}%`, background: 'linear-gradient(90deg, #9fe870, #7dd455)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex h-auto w-full flex-wrap gap-1 rounded-2xl bg-[#f0f1ee] p-1.5">
            {tabItems.map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                  activeTab === tab.key ? "bg-white text-[#0e0f0c] shadow-sm" : "text-[#5b5e5a] hover:text-[#0e0f0c]"
                )}
              >
                {tab.icon}
                <span className="hidden sm:inline">{isRTL ? tab.labelAr : tab.labelEn}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="personal" className="mt-4">
            <ContentCard
              title={t('المعلومات الشخصية', 'Personal Information')}
              action={
                <button onClick={() => setEditing(!editing)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all hover:scale-[1.02]" style={{ background: '#9fe870', color: '#0e0f0c' }}>
                  <Edit3 size={12} />
                  {editing ? t('حفظ', 'Save') : t('تعديل', 'Edit')}
                </button>
              }
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  { labelAr: 'الاسم الأول', labelEn: 'First Name', value: 'Ahmed' },
                  { labelAr: 'الاسم الأخير', labelEn: 'Last Name', value: 'Mohammed' },
                  { labelAr: 'البريد الإلكتروني', labelEn: 'Email', value: studentProfile.email, icon: <Mail size={14} /> },
                  { labelAr: 'رقم الهاتف', labelEn: 'Phone', value: studentProfile.phone, icon: <Phone size={14} /> },
                  { labelAr: 'الموقع', labelEn: 'Location', value: isRTL ? studentProfile.locationAr : studentProfile.locationEn, icon: <MapPin size={14} /> },
                ].map((field) => (
                  <div key={field.labelEn} className="rounded-xl bg-[#f0f1ee] p-3">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-[#828782]">{isRTL ? field.labelAr : field.labelEn}</label>
                    <p className="mt-1 text-sm font-bold text-[#0e0f0c]">{field.value}</p>
                  </div>
                ))}
                <div className="rounded-xl bg-[#f0f1ee] p-3 sm:col-span-2">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#828782]">{t('نبذة', 'Bio')}</label>
                  <p className="mt-1 text-sm font-semibold text-[#5b5e5a]">{isRTL ? studentProfile.bioAr : studentProfile.bioEn}</p>
                </div>
              </div>
            </ContentCard>
          </TabsContent>

          {/* Academic Tab */}
          <TabsContent value="academic" className="mt-4">
            <ContentCard title={t('السجل الأكاديمي', 'Education History')} icon={<GraduationCap size={20} />}>
              <div className="relative ms-4 mt-2 border-s-2 border-[#dfe1dd] ps-6">
                {[
                  {
                    titleAr: studentProfile.universityAr,
                    titleEn: studentProfile.universityEn,
                    subtitleAr: `${studentProfile.collegeAr} - ${studentProfile.departmentAr}`,
                    subtitleEn: `${studentProfile.collegeEn} - ${studentProfile.departmentEn}`,
                    detail: `GPA: ${studentProfile.gpa} / 5.0`,
                    date: isRTL ? studentProfile.expectedGraduation : 'Expected: Jun 2026',
                    icon: <GraduationCap size={18} />,
                    iconBg: '#E7FDD8',
                    iconColor: '#1ba442',
                  },
                  {
                    titleAr: 'الثانوية العامة',
                    titleEn: 'High School',
                    subtitleAr: 'ثانوية الرائد - الرياض',
                    subtitleEn: 'Al-Ra'ed High School - Riyadh',
                    detail: t('معدل: 98%', 'Grade: 98%'),
                    date: '2021',
                    icon: <Award size={18} />,
                    iconBg: '#DBEAFE',
                    iconColor: '#1D4ED8',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="relative mb-6 last:mb-0">
                    <div className="absolute -start-[31px] flex h-6 w-6 items-center justify-center rounded-full" style={{ background: item.iconBg }}>
                      <span style={{ color: item.iconColor }}>{item.icon}</span>
                    </div>
                    <h4 className="text-sm font-bold text-[#0e0f0c]">{isRTL ? item.titleAr : item.titleEn}</h4>
                    <p className="text-xs font-semibold text-[#5b5e5a]">{isRTL ? item.subtitleAr : item.subtitleEn}</p>
                    <div className="mt-1 flex items-center gap-3">
                      <span className="text-xs font-bold" style={{ color: '#9fe870' }}>{item.detail}</span>
                      <span className="text-[10px] font-semibold text-[#828782]">{item.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ContentCard>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="mt-4">
            <div className="flex flex-col gap-4">
              {Object.entries(groupedSkills).map(([category, catSkills]) => (
                <ContentCard key={category} title={category}>
                  <div className="flex flex-col gap-3">
                    {catSkills.map((skill) => (
                      <div key={skill.name} className="flex items-center gap-3">
                        <span className="w-24 text-xs font-semibold text-[#0e0f0c] sm:w-32">{skill.name}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#f0f1ee]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: levelWidths[skill.level], background: levelColors[skill.level] }}
                          />
                        </div>
                        <span className="w-20 text-end text-[10px] font-semibold" style={{ color: levelColors[skill.level] }}>
                          {isRTL ? levelLabels[skill.level].ar : levelLabels[skill.level].en}
                        </span>
                      </div>
                    ))}
                  </div>
                </ContentCard>
              ))}

              {/* AI Suggested Skills */}
              <ContentCard
                title={t('مهارات مقترحة بالذكاء الاصطناعي', 'AI-Suggested Skills')}
                icon={<Sparkles size={20} style={{ color: '#7C3AED' }} />}
              >
                <div className="mt-1 flex flex-wrap gap-2">
                  {suggestedSkills.map((skill) => (
                    <button
                      key={skill}
                      className="flex items-center gap-1.5 rounded-full border border-[#9fe870] bg-[#F4FCF0] px-3 py-1.5 text-xs font-semibold text-[#0e0f0c] transition-all hover:bg-[#9fe870]"
                    >
                      <Plus size={12} />
                      {skill}
                    </button>
                  ))}
                </div>
              </ContentCard>
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="mt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {projects.map((project) => (
                <ContentCard key={project.id} noPadding className="overflow-hidden">
                  <div className="p-5">
                    <h4 className="text-sm font-bold text-[#0e0f0c]">{isRTL ? project.titleAr : project.titleEn}</h4>
                    <p className="mt-1 text-xs font-semibold text-[#5b5e5a]">{isRTL ? project.descriptionAr : project.descriptionEn}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.technologies.map((tech) => (
                        <span key={tech} className="rounded-full bg-[#f0f1ee] px-2 py-0.5 text-[10px] font-semibold text-[#5b5e5a]">{tech}</span>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <a href={project.link} className="inline-flex items-center gap-1 rounded-full bg-[#9fe870] px-3 py-1.5 text-[10px] font-semibold text-[#0e0f0c] transition-all hover:scale-[1.02]">
                        <ExternalLink size={10} /> {t('عرض', 'View')}
                      </a>
                      <a href={project.github} className="inline-flex items-center gap-1 rounded-full border border-[#dfe1dd] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#5b5e5a] transition-all hover:bg-[#f0f1ee]">
                        <Github size={10} /> GitHub
                      </a>
                    </div>
                  </div>
                </ContentCard>
              ))}
            </div>
          </TabsContent>

          {/* Certifications Tab */}
          <TabsContent value="certifications" className="mt-4">
            <ContentCard title={t('الشهادات والاعتمادات', 'Certifications & Credentials')} icon={<Award size={20} />}>
              <div className="mt-2 flex flex-col gap-3">
                {certifications.map((cert) => (
                  <div key={cert.id} className="flex items-start gap-4 rounded-2xl bg-[#f0f1ee] p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#FEF3C7]">
                      <Award size={18} style={{ color: '#B45309' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-[#0e0f0c]">{isRTL ? cert.nameAr : cert.nameEn}</h4>
                      <p className="text-xs font-semibold text-[#5b5e5a]">{isRTL ? cert.issuerAr : cert.issuerEn}</p>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-[10px] font-semibold text-[#828782]">{cert.date}</span>
                        <span className="text-[10px] font-semibold" style={{ color: '#828782' }}>ID: {cert.credentialId}</span>
                      </div>
                    </div>
                    <a href={cert.url} className="flex-shrink-0 rounded-full p-2 text-[#828782] hover:bg-white hover:text-[#0e0f0c] transition-colors">
                      <ExternalLink size={14} />
                    </a>
                  </div>
                ))}
              </div>
            </ContentCard>
          </TabsContent>

          {/* CV Tab */}
          <TabsContent value="cv" className="mt-4">
            <div className="flex flex-col gap-4">
              {/* Upload Area */}
              <ContentCard title={t('السيرة الذاتية', 'Curriculum Vitae')} icon={<FileText size={20} />}>
                <div
                  className={cn(
                    "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-colors",
                    cvUploaded ? "border-[#9fe870] bg-[#F4FCF0]" : "border-[#dfe1dd] bg-[#f0f1ee] hover:border-[#9fe870]"
                  )}
                >
                  {cvUploaded ? (
                    <>
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E7FDD8]">
                        <CheckCircle2 size={28} style={{ color: '#1ba442' }} />
                      </div>
                      <p className="mt-3 text-sm font-bold text-[#0e0f0c]">Ahmed_Mohammed_CV.pdf</p>
                      <p className="text-xs font-semibold text-[#5b5e5a]">PDF · 2.4 MB · {t('تم الرفع في', 'Uploaded on')} 2026-01-10</p>
                      <div className="mt-4 flex gap-2">
                        <button className="inline-flex items-center gap-1.5 rounded-full bg-[#9fe870] px-4 py-2 text-xs font-semibold text-[#0e0f0c]">
                          <FileText size={12} /> {t('عرض', 'View')}
                        </button>
                        <button className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe1dd] bg-white px-4 py-2 text-xs font-semibold text-[#5b5e5a]">
                          <Upload size={12} /> {t('إعادة رفع', 'Re-upload')}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f0f1ee]">
                        <Upload size={28} style={{ color: '#828782' }} />
                      </div>
                      <p className="mt-3 text-sm font-bold text-[#0e0f0c]">{t('اسحب الملف هنا أو انقر للرفع', 'Drag file here or click to upload')}</p>
                      <p className="text-xs font-semibold text-[#828782]">PDF, DOC, DOCX · Max 5MB</p>
                    </>
                  )}
                </div>
              </ContentCard>

              {/* AI Analysis Preview */}
              {cvUploaded && (
                <ContentCard
                  title={t('تحليل الذكاء الاصطناعي', 'AI Analysis Preview')}
                  icon={<Sparkles size={20} style={{ color: '#7C3AED' }} />}
                >
                  <div className="rounded-2xl border border-[#9fe870] bg-[#F4FCF0] p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white">
                        <Sparkles size={16} style={{ color: '#7C3AED' }} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#0e0f0c]">{t('ملخص الذكاء الاصطناعي', 'AI Summary')}</p>
                        <p className="mt-1 text-xs font-semibold text-[#5b5e5a]">
                          {t(
                            'تم استخراج 15 مهارة من سيرتك الذاتية. أبرز المهارات: React, TypeScript, Node.js. يُنصح بإضافة Docker وAWS لزيادة فرص التوظيف.',
                            '15 skills extracted from your CV. Top skills: React, TypeScript, Node.js. Consider adding Docker and AWS to increase hiring chances.'
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {['React', 'TypeScript', 'Node.js', 'JavaScript', 'HTML/CSS', 'Git'].map((skill) => (
                        <span key={skill} className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold text-[#1ba442]">{skill}</span>
                      ))}
                    </div>
                  </div>
                </ContentCard>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PortalLayout>
  );
}
