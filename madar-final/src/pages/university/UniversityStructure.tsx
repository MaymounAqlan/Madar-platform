import { useState, useMemo } from 'react';
import PortalLayout from '@/components/PortalLayout';
import ContentCard from '@/components/ContentCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { colleges, studyPlans, courses } from '@/data/university';
import type { College } from '@/data/university';
import {
  BookOpen, Library, ChevronDown, Edit, Trash2, Plus, Building2,
  Users, Search, Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function StatusPill({ count, label, bg, color }: { count: number; label: string; bg: string; color: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full px-4 py-2" style={{ background: bg }}>
      <span className="text-lg font-black" style={{ color, fontFamily: 'system-ui' }}>{count}</span>
      <span className="text-sm font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

function CollegeAccordionItem({ college, isOpen, onToggle }: { college: College; isOpen: boolean; onToggle: () => void }) {
  const { t } = useLanguage();

  return (
    <div className="rounded-3xl border transition-all" style={{ background: isOpen ? '#f0f1ee' : '#ffffff', borderColor: '#dfe1dd' }}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-[#f0f1ee] rounded-3xl"
      >
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: `${college.iconColor}15` }}
          >
            <Building2 size={22} style={{ color: college.iconColor }} />
          </div>
          <div>
            <h3 className="text-base font-black" style={{ color: '#0e0f0c' }}>{college.nameEn}</h3>
            <p className="text-xs font-semibold" style={{ color: '#5b5e5a' }}>{college.nameAr} · {t('عميد:', 'Dean:')} {college.dean}</p>
            <p className="mt-0.5 text-xs" style={{ color: '#828782' }}>{college.studentCount.toLocaleString()} {t('طالباً', 'students')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: '#E7FDD8', color: '#1ba442' }}>
            {college.employmentRate}%
          </span>
          <div
            className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-300", isOpen && "rotate-180")}
            style={{ background: '#f0f1ee' }}
          >
            <ChevronDown size={16} style={{ color: '#5b5e5a' }} />
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="px-5 pb-5 pt-1">
          {/* Department Grid */}
          <div className="mb-4">
            <h4 className="mb-3 text-sm font-bold" style={{ color: '#0e0f0c' }}>{t('الأقسام', 'Departments')}</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {college.departments.map((dept) => (
                <div
                  key={dept.id}
                  className="group relative rounded-2xl border p-4 transition-all hover:shadow-sm"
                  style={{ background: '#ffffff', borderColor: '#dfe1dd' }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#0e0f0c' }}>{dept.nameEn}</p>
                      <p className="text-xs" style={{ color: '#828782' }}>{dept.nameAr}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button className="rounded-full p-1.5 transition-colors hover:bg-[#f0f1ee]">
                        <Edit size={14} style={{ color: '#5b5e5a' }} />
                      </button>
                      <button className="rounded-full p-1.5 transition-colors hover:bg-[#f0f1ee]">
                        <Trash2 size={14} style={{ color: '#dc2626' }} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs font-semibold" style={{ color: '#5b5e5a' }}>
                    <span className="flex items-center gap-1"><Users size={12} /> {dept.studentCount}</span>
                    <span className="flex items-center gap-1"><BookOpen size={12} /> {dept.coursesCount} {t('مساق', 'courses')}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: '#dfe1dd' }}>
                      <div className="h-full rounded-full" style={{ width: `${dept.employmentRate}%`, background: dept.employmentRate >= 80 ? '#1ba442' : '#9fe870' }} />
                    </div>
                    <span className="text-xs font-bold" style={{ color: dept.employmentRate >= 80 ? '#1ba442' : '#5b5e5a' }}>{dept.employmentRate}%</span>
                  </div>
                  <p className="mt-2 text-xs font-semibold" style={{ color: '#828782' }}>
                    {t('رئيس القسم:', 'Head:')} {dept.coordinator}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {dept.programs.map((prog) => (
                      <span key={prog} className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: '#E7FDD8', color: '#1ba442' }}>
                        {prog}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* College Metrics */}
          <div className="flex flex-wrap gap-4 rounded-2xl p-4" style={{ background: '#ffffff' }}>
            <div className="text-center">
              <p className="text-lg font-black" style={{ color: '#0e0f0c' }}>{college.graduates}</p>
              <p className="text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t('خريجون', 'Graduates')}</p>
            </div>
            <div className="w-px" style={{ background: '#dfe1dd' }} />
            <div className="text-center">
              <p className="text-lg font-black" style={{ color: '#1ba442' }}>{college.employmentRate}%</p>
              <p className="text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t('توظيف', 'Employment')}</p>
            </div>
            <div className="w-px" style={{ background: '#dfe1dd' }} />
            <div className="text-center">
              <p className="text-lg font-black" style={{ color: '#0e0f0c' }}>{college.avgSalary.toLocaleString()}</p>
              <p className="text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t('متوسط الراتب', 'Avg Salary')}</p>
            </div>
            <div className="w-px" style={{ background: '#dfe1dd' }} />
            <div className="text-center">
              <p className="text-lg font-black" style={{ color: '#0e0f0c' }}>{college.activeCompanies}</p>
              <p className="text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t('شركات', 'Companies')}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all hover:scale-[1.02]" style={{ background: '#9fe870', color: '#0e0f0c' }}>
              <Plus size={14} />
              {t('إضافة قسم', 'Add Department')}
            </button>
            <button className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors hover:bg-[#ebede9]" style={{ color: '#5b5e5a' }}>
              <Edit size={14} />
              {t('تعديل الكلية', 'Edit College')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UniversityStructure() {
  const { t } = useLanguage();
  const [openCollege, setOpenCollege] = useState<string | null>('cs');
  const [planSearch, setPlanSearch] = useState('');
  const [planCollegeFilter, setPlanCollegeFilter] = useState<string>('all');
  const [courseSearch, setCourseSearch] = useState('');
  const [courseCollegeFilter, setCourseCollegeFilter] = useState<string>('all');
  const [courseDeptFilter, setCourseDeptFilter] = useState<string>('all');

  const totalDepartments = colleges.reduce((acc, c) => acc + c.departments.length, 0);
  const totalCourses = courses.length;
  const totalPlans = studyPlans.length;

  const filteredPlans = useMemo(() => {
    return studyPlans.filter((plan) => {
      const matchSearch = planSearch === '' || plan.nameEn.toLowerCase().includes(planSearch.toLowerCase()) || plan.nameAr.includes(planSearch);
      const matchCollege = planCollegeFilter === 'all' || plan.collegeId === planCollegeFilter;
      return matchSearch && matchCollege;
    });
  }, [planSearch, planCollegeFilter]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchSearch = courseSearch === '' || course.nameEn.toLowerCase().includes(courseSearch.toLowerCase()) || course.code.toLowerCase().includes(courseSearch.toLowerCase());
      const matchCollege = courseCollegeFilter === 'all' || course.collegeId === courseCollegeFilter;
      const matchDept = courseDeptFilter === 'all' || course.departmentId === courseDeptFilter;
      return matchSearch && matchCollege && matchDept;
    });
  }, [courseSearch, courseCollegeFilter, courseDeptFilter]);

  const availableDepts = useMemo(() => {
    if (courseCollegeFilter === 'all') return [];
    const college = colleges.find(c => c.id === courseCollegeFilter);
    return college?.departments || [];
  }, [courseCollegeFilter]);

  const degreeBadge = (degree: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      Bachelor: { bg: '#E7FDD8', text: '#1ba442' },
      Master: { bg: '#DBEAFE', text: '#1D4ED8' },
      PhD: { bg: '#F3E8FF', text: '#7C3AED' },
    };
    const c = colorMap[degree] || { bg: '#f0f1ee', text: '#5b5e5a' };
    return <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: c.bg, color: c.text }}>{degree}</span>;
  };

  return (
    <PortalLayout title={t('الهيكل الأكاديمي', 'Academic Structure')} subtitle={t('جامعة الملك سعود — السنة الأكاديمية 2024-2025', 'King Saud University — Academic Year 2024-2025')}>
      {/* Summary Stats */}
      <div className="mb-6 flex flex-wrap gap-3">
        <StatusPill count={colleges.length} label={t('كليات', 'Colleges')} bg="#E7FDD8" color="#1ba442" />
        <StatusPill count={totalDepartments} label={t('أقسام', 'Departments')} bg="#DBEAFE" color="#3b82f6" />
        <StatusPill count={totalPlans} label={t('خطط دراسية', 'Study Plans')} bg="#FEF3C7" color="#B45309" />
        <StatusPill count={totalCourses} label={t('مساقات', 'Courses')} bg="#F3E8FF" color="#7C3AED" />
      </div>

      {/* College Accordion */}
      <div className="mb-6 space-y-3">
        {colleges.map((college) => (
          <CollegeAccordionItem
            key={college.id}
            college={college}
            isOpen={openCollege === college.id}
            onToggle={() => setOpenCollege(openCollege === college.id ? null : college.id)}
          />
        ))}
      </div>

      {/* Study Plans Section */}
      <ContentCard
        className="mb-6"
        title={t('خطط الدراسية', 'Study Plans')}
        icon={<BookOpen size={18} style={{ color: '#5b5e5a' }} />}
        action={
          <button className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all hover:scale-[1.02]" style={{ background: '#9fe870', color: '#0e0f0c' }}>
            <Plus size={14} />
            {t('إضافة خطة', 'Add Plan')}
          </button>
        }
      >
        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#828782' }} />
            <input
              type="text"
              value={planSearch}
              onChange={(e) => setPlanSearch(e.target.value)}
              placeholder={t('ابحث عن خطة...', 'Search plans...')}
              className="h-10 w-full rounded-full border pl-10 pr-4 text-sm font-semibold outline-none transition-all focus:border-[#9fe870] focus:ring-2 focus:ring-[#E7FDD8]"
              style={{ borderColor: '#dfe1dd', color: '#0e0f0c', background: '#ffffff' }}
            />
          </div>
          <select
            value={planCollegeFilter}
            onChange={(e) => setPlanCollegeFilter(e.target.value)}
            className="h-10 rounded-full border px-4 text-sm font-semibold outline-none"
            style={{ borderColor: '#dfe1dd', color: '#0e0f0c', background: '#ffffff' }}
          >
            <option value="all">{t('جميع الكليات', 'All Colleges')}</option>
            {colleges.map(c => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #dfe1dd' }}>
                {[
                  t('الخطة', 'Plan'),
                  t('الكلية', 'College'),
                  t('القسم', 'Department'),
                  t('الدرجة', 'Degree'),
                  t('السنوات', 'Years'),
                  t('الطلاب', 'Students'),
                  t('الخريجون', 'Graduates'),
                  t('التوظيف', 'Employment'),
                  t('الإجراءات', 'Actions'),
                ].map((h) => (
                  <th key={h} className="pb-3 pt-1 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#828782' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPlans.map((plan) => {
                const college = colleges.find(c => c.id === plan.collegeId);
                const dept = college?.departments.find(d => d.id === plan.departmentId);
                const barColor = plan.employmentRate >= 80 ? '#1ba442' : plan.employmentRate >= 60 ? '#9fe870' : '#f59e0b';
                return (
                  <tr key={plan.id} className="transition-colors hover:bg-[#f0f1ee]/50" style={{ borderBottom: '1px solid #dfe1dd' }}>
                    <td className="py-3 text-sm font-bold" style={{ color: '#0e0f0c' }}>{plan.nameEn}</td>
                    <td className="py-3 text-sm font-semibold" style={{ color: '#5b5e5a' }}>{college?.nameEn}</td>
                    <td className="py-3 text-sm" style={{ color: '#828782' }}>{dept?.nameEn}</td>
                    <td className="py-3">{degreeBadge(plan.degreeType)}</td>
                    <td className="py-3 text-sm font-semibold" style={{ color: '#0e0f0c' }}>{plan.duration}</td>
                    <td className="py-3 text-sm" style={{ color: '#5b5e5a' }}>{plan.studentsCount}</td>
                    <td className="py-3 text-sm" style={{ color: '#5b5e5a' }}>{plan.graduatesCount}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-12 overflow-hidden rounded-full" style={{ background: '#dfe1dd' }}>
                          <div className="h-full rounded-full" style={{ width: `${plan.employmentRate}%`, background: barColor }} />
                        </div>
                        <span className="text-xs font-bold" style={{ color: barColor }}>{plan.employmentRate}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <button className="rounded-full p-1.5 transition-colors hover:bg-[#f0f1ee]"><Edit size={14} style={{ color: '#5b5e5a' }} /></button>
                        <button className="rounded-full p-1.5 transition-colors hover:bg-[#f0f1ee]"><Eye size={14} style={{ color: '#3b82f6' }} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ContentCard>

      {/* Course Catalog */}
      <ContentCard
        title={t('دليل المساقات', 'Course Catalog')}
        icon={<Library size={18} style={{ color: '#5b5e5a' }} />}
        action={
          <button className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all hover:scale-[1.02]" style={{ background: '#9fe870', color: '#0e0f0c' }}>
            <Plus size={14} />
            {t('إضافة مساق', 'Add Course')}
          </button>
        }
      >
        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#828782' }} />
            <input
              type="text"
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              placeholder={t('ابحث عن مساق...', 'Search courses...')}
              className="h-10 w-full rounded-full border pl-10 pr-4 text-sm font-semibold outline-none transition-all focus:border-[#9fe870] focus:ring-2 focus:ring-[#E7FDD8]"
              style={{ borderColor: '#dfe1dd', color: '#0e0f0c', background: '#ffffff' }}
            />
          </div>
          <select
            value={courseCollegeFilter}
            onChange={(e) => { setCourseCollegeFilter(e.target.value); setCourseDeptFilter('all'); }}
            className="h-10 rounded-full border px-4 text-sm font-semibold outline-none"
            style={{ borderColor: '#dfe1dd', color: '#0e0f0c', background: '#ffffff' }}
          >
            <option value="all">{t('جميع الكليات', 'All Colleges')}</option>
            {colleges.map(c => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
          </select>
          {availableDepts.length > 0 && (
            <select
              value={courseDeptFilter}
              onChange={(e) => setCourseDeptFilter(e.target.value)}
              className="h-10 rounded-full border px-4 text-sm font-semibold outline-none"
              style={{ borderColor: '#dfe1dd', color: '#0e0f0c', background: '#ffffff' }}
            >
              <option value="all">{t('جميع الأقسام', 'All Depts')}</option>
              {availableDepts.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
            </select>
          )}
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => {
            const relevanceColor = course.marketRelevance > 70 ? '#1ba442' : course.marketRelevance >= 50 ? '#9fe870' : '#f59e0b';
            const college = colleges.find(c => c.id === course.collegeId);
            const dept = college?.departments.find(d => d.id === course.departmentId);
            return (
              <div
                key={course.id}
                className="rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: '#ffffff', borderColor: '#dfe1dd' }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: '#828782' }}>{course.code}</span>
                  <span className="text-xs font-semibold" style={{ color: '#5b5e5a' }}>{course.credits} {t('ساعات', 'credits')}</span>
                </div>
                <h4 className="text-sm font-bold" style={{ color: '#0e0f0c' }}>{course.nameEn}</h4>
                <p className="mt-0.5 text-xs" style={{ color: '#828782' }}>{dept?.nameEn} · {college?.nameEn}</p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {course.skills.map((skill) => (
                    <span key={skill} className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: '#E7FDD8', color: '#1ba442' }}>
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t('الصلة بالسوق', 'Market relevance')}</span>
                    <span className="text-xs font-bold" style={{ color: relevanceColor }}>{course.marketRelevance}%</span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: '#dfe1dd' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${course.marketRelevance}%`, background: relevanceColor }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ContentCard>
    </PortalLayout>
  );
}
