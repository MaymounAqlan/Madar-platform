import { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import PortalLayout from '@/components/PortalLayout';
import ContentCard from '@/components/ContentCard';
import MetricCard from '@/components/MetricCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { students, colleges, employmentStatusDistribution, topSkillsDistribution, employmentTimeline } from '@/data/university';
import type { EmploymentStatus } from '@/data/university';
import { getStatusLabel } from '@/data/university';
import {
  Search, SlidersHorizontal, Download, Upload, Plus,
  Users, PieChart as PieIcon, BarChart3, Calendar, Eye, Edit,
} from 'lucide-react';
const statusBgMap: Record<EmploymentStatus, string> = {
  employed: '#E7FDD8',
  seeking: '#E7FDD8',
  interviewing: '#FEF3C7',
  'not-interested': '#f0f1ee',
  'further-studies': '#DBEAFE',
  unknown: '#f0f1ee',
};

const statusTextMap: Record<EmploymentStatus, string> = {
  employed: '#1ba442',
  seeking: '#1ba442',
  interviewing: '#B45309',
  'not-interested': '#5b5e5a',
  'further-studies': '#1D4ED8',
  unknown: '#828782',
};

export default function UniversityStudents() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gpaFilter, setGpaFilter] = useState<string>('all');

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch = search === '' || s.nameEn.toLowerCase().includes(search.toLowerCase()) || s.id.includes(search);
      const matchCollege = collegeFilter === 'all' || s.collegeId === collegeFilter;
      const matchDept = deptFilter === 'all' || s.departmentId === deptFilter;
      const matchYear = yearFilter === 'all' || s.graduationYear.toString() === yearFilter;
      const matchStatus = statusFilter === 'all' || s.employmentStatus === statusFilter;
      const matchGpa = gpaFilter === 'all'
        ? true
        : gpaFilter === '3.5+' ? s.gpa >= 3.5
        : gpaFilter === '3.0-3.5' ? s.gpa >= 3.0 && s.gpa < 3.5
        : gpaFilter === '2.5-3.0' ? s.gpa >= 2.5 && s.gpa < 3.0
        : s.gpa < 2.5;
      return matchSearch && matchCollege && matchDept && matchYear && matchStatus && matchGpa;
    });
  }, [search, collegeFilter, deptFilter, yearFilter, statusFilter, gpaFilter]);

  const availableDepts = useMemo(() => {
    if (collegeFilter === 'all') return [];
    const college = colleges.find(c => c.id === collegeFilter);
    return college?.departments || [];
  }, [collegeFilter]);

  const totalStudents = students.length;
  const employedCount = students.filter(s => s.employmentStatus === 'employed').length;
  const seekingCount = students.filter(s => s.employmentStatus === 'seeking').length;
  const notSeekingCount = students.filter(s => s.employmentStatus === 'further-studies' || s.employmentStatus === 'not-interested').length;

  const gradYears = useMemo(() => {
    const years = new Set(students.map(s => s.graduationYear.toString()));
    return Array.from(years).sort();
  }, []);

  const pieData = employmentStatusDistribution.map(d => ({
    name: d.name,
    value: d.value,
    color: d.color,
  }));

  const skillData = topSkillsDistribution.map(s => ({
    name: s.skill,
    count: s.count,
  }));

  const timelineData = employmentTimeline;

  return (
    <PortalLayout title={t('دليل الطلاب', 'Student Directory')} subtitle={`${totalStudents.toLocaleString()} ${t('طالب', 'students')}`}>
      {/* Actions Row */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#828782' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('ابحث عن طالب...', 'Search students...')}
            className="h-11 w-full rounded-full border pl-10 pr-4 text-sm font-semibold outline-none transition-all focus:border-[#9fe870] focus:ring-2 focus:ring-[#E7FDD8]"
            style={{ borderColor: '#dfe1dd', color: '#0e0f0c', background: '#ffffff' }}
          />
        </div>
        <button className="flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors hover:bg-[#f0f1ee]" style={{ borderColor: '#dfe1dd', color: '#5b5e5a' }}>
          <SlidersHorizontal size={16} />
          {t('تصفية', 'Filters')}
        </button>
        <button className="hidden h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors hover:bg-[#f0f1ee] sm:inline-flex" style={{ borderColor: '#dfe1dd', color: '#5b5e5a' }}>
          <Download size={16} />
          {t('تصدير', 'Export')}
        </button>
        <button className="hidden h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors hover:bg-[#f0f1ee] sm:inline-flex" style={{ borderColor: '#dfe1dd', color: '#5b5e5a' }}>
          <Upload size={16} />
          {t('استيراد', 'Import')}
        </button>
        <button className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-all hover:scale-[1.02]" style={{ background: '#9fe870', color: '#0e0f0c' }}>
          <Plus size={16} />
          {t('إضافة طالب', 'Add Student')}
        </button>
      </div>

      {/* Metrics */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          icon={<Users size={20} style={{ color: '#3b82f6' }} />}
          iconBg="#DBEAFE"
          value={totalStudents.toLocaleString()}
          label={t('إجمالي الطلاب', 'Total Students')}
          valueColor="#3b82f6"
        />
        <MetricCard
          icon={<Users size={20} style={{ color: '#1ba442' }} />}
          iconBg="#E7FDD8"
          value={employedCount.toLocaleString()}
          label={t('موظفون', 'Employed')}
          trend={320}
          valueColor="#1ba442"
        />
        <MetricCard
          icon={<Users size={20} style={{ color: '#f59e0b' }} />}
          iconBg="#FEF3C7"
          value={seekingCount.toLocaleString()}
          label={t('يبحثون عن عمل', 'Seeking')}
          trend={180}
          valueColor="#f59e0b"
        />
        <MetricCard
          icon={<Users size={20} style={{ color: '#828782' }} />}
          iconBg="#f0f1ee"
          value={notSeekingCount.toLocaleString()}
          label={t('لا يبحثون', 'Not Seeking')}
          valueColor="#5b5e5a"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Left Column - Student Directory */}
        <div className="xl:col-span-3">
          <ContentCard
            title={t('دليل الطلاب', 'Student Directory')}
            subtitle={`${filteredStudents.length} ${t('طالب', 'students')} ${t('مطابق', 'matching')}`}
            icon={<Users size={18} style={{ color: '#5b5e5a' }} />}
            noPadding
          >
            {/* Filter Bar */}
            <div className="flex flex-wrap gap-2 border-b px-6 pt-4 pb-4" style={{ borderColor: '#dfe1dd' }}>
              <select
                value={collegeFilter}
                onChange={(e) => { setCollegeFilter(e.target.value); setDeptFilter('all'); }}
                className="h-9 rounded-full border px-3 text-xs font-semibold outline-none"
                style={{ borderColor: '#dfe1dd', background: '#ffffff', color: '#0e0f0c' }}
              >
                <option value="all">{t('الكلية', 'College')}</option>
                {colleges.map(c => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
              </select>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="h-9 rounded-full border px-3 text-xs font-semibold outline-none"
                style={{ borderColor: '#dfe1dd', background: '#ffffff', color: '#0e0f0c' }}
              >
                <option value="all">{t('القسم', 'Department')}</option>
                {(collegeFilter === 'all' ? colleges.flatMap(c => c.departments) : availableDepts).map(d => (
                  <option key={d.id} value={d.id}>{d.nameEn}</option>
                ))}
              </select>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="h-9 rounded-full border px-3 text-xs font-semibold outline-none"
                style={{ borderColor: '#dfe1dd', background: '#ffffff', color: '#0e0f0c' }}
              >
                <option value="all">{t('السنة', 'Year')}</option>
                {gradYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-full border px-3 text-xs font-semibold outline-none"
                style={{ borderColor: '#dfe1dd', background: '#ffffff', color: '#0e0f0c' }}
              >
                <option value="all">{t('الحالة', 'Status')}</option>
                {(['employed', 'seeking', 'interviewing', 'not-interested', 'further-studies', 'unknown'] as EmploymentStatus[]).map(s => (
                  <option key={s} value={s}>{getStatusLabel(s)}</option>
                ))}
              </select>
              <select
                value={gpaFilter}
                onChange={(e) => setGpaFilter(e.target.value)}
                className="h-9 rounded-full border px-3 text-xs font-semibold outline-none"
                style={{ borderColor: '#dfe1dd', background: '#ffffff', color: '#0e0f0c' }}
              >
                <option value="all">{t('المعدل', 'GPA')}</option>
                <option value="3.5+">3.5+</option>
                <option value="3.0-3.5">3.0 - 3.5</option>
                <option value="2.5-3.0">2.5 - 3.0</option>
                <option value="&lt;2.5">&lt; 2.5</option>
              </select>
              {(collegeFilter !== 'all' || deptFilter !== 'all' || yearFilter !== 'all' || statusFilter !== 'all' || gpaFilter !== 'all') && (
                <button
                  onClick={() => { setCollegeFilter('all'); setDeptFilter('all'); setYearFilter('all'); setStatusFilter('all'); setGpaFilter('all'); }}
                  className="h-9 rounded-full px-3 text-xs font-semibold transition-colors hover:bg-[#f0f1ee]"
                  style={{ color: '#dc2626' }}
                >
                  {t('مسح', 'Clear')}
                </button>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#f0f1ee' }}>
                    {[
                      t('الرقم', 'ID'),
                      t('الاسم', 'Name'),
                      t('الكلية', 'College'),
                      t('القسم', 'Department'),
                      t('المعدل', 'GPA'),
                      t('سنة التخرج', 'Grad Year'),
                      t('حالة التوظيف', 'Status'),
                      t('المهارات', 'Skills'),
                      t('إجراءات', 'Actions'),
                    ].map((h) => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#5b5e5a' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.slice(0, 20).map((student) => {
                    const college = colleges.find(c => c.id === student.collegeId);
                    const dept = college?.departments.find(d => d.id === student.departmentId);
                    const statusBg = statusBgMap[student.employmentStatus];
                    const statusText = statusTextMap[student.employmentStatus];
                    return (
                      <tr key={student.id} className="transition-colors hover:bg-[#f0f1ee]/50" style={{ borderBottom: '1px solid #dfe1dd' }}>
                        <td className="whitespace-nowrap px-3 py-2.5 text-xs font-bold" style={{ color: '#828782' }}>{student.id}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-sm font-bold" style={{ color: '#0e0f0c' }}>{student.nameEn}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold" style={{ color: '#5b5e5a' }}>{college?.nameEn}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-xs" style={{ color: '#828782' }}>{dept?.nameEn}</td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <span className="text-sm font-black" style={{ color: student.gpa >= 3.5 ? '#1ba442' : student.gpa >= 3.0 ? '#f59e0b' : '#dc2626' }}>
                            {student.gpa.toFixed(2)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold" style={{ color: '#5b5e5a' }}>{student.graduationYear}</td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: statusBg, color: statusText }}>
                            {getStatusLabel(student.employmentStatus)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {student.skills.slice(0, 3).map((skill) => (
                              <span key={skill} className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: '#E7FDD8', color: '#1ba442' }}>
                                {skill}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <div className="flex gap-1">
                            <button className="rounded-full p-1.5 transition-colors hover:bg-[#f0f1ee]"><Eye size={14} style={{ color: '#3b82f6' }} /></button>
                            <button className="rounded-full p-1.5 transition-colors hover:bg-[#f0f1ee]"><Edit size={14} style={{ color: '#5b5e5a' }} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredStudents.length > 20 && (
              <div className="border-t px-6 py-3 text-center text-xs font-semibold" style={{ borderColor: '#dfe1dd', color: '#828782' }}>
                {t(`عرض 20 من ${filteredStudents.length} طالب`, `Showing 20 of ${filteredStudents.length} students`)}
              </div>
            )}
          </ContentCard>
        </div>

        {/* Right Column - Charts */}
        <div className="space-y-6 xl:col-span-2">
          {/* Employment Status Pie Chart */}
          <ContentCard
            title={t('توزيع حالات التوظيف', 'Employment Status Distribution')}
            icon={<PieIcon size={18} style={{ color: '#5b5e5a' }} />}
          >
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="45%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value}%`]}
                    contentStyle={{ borderRadius: 12, border: '1px solid #dfe1dd', fontSize: 12 }}
                  />
                  <Legend
                    verticalAlign="middle"
                    align="right"
                    layout="vertical"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ContentCard>

          {/* Skills Distribution Horizontal Bar Chart */}
          <ContentCard
            title={t('توزيع المهارات', 'Skill Distribution')}
            icon={<BarChart3 size={18} style={{ color: '#5b5e5a' }} />}
          >
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dfe1dd" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#828782' }} axisLine={{ stroke: '#dfe1dd' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#5b5e5a' }} width={100} axisLine={{ stroke: '#dfe1dd' }} />
                  <Tooltip
                    formatter={(value: number) => [value, 'Students']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #dfe1dd', fontSize: 12 }}
                  />
                  <Bar dataKey="count" fill="#9fe870" radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ContentCard>

          {/* Employment Timeline Bar Chart */}
          <ContentCard
            title={t('خط زمني للتوظيف', 'Employment Timeline')}
            icon={<Calendar size={18} style={{ color: '#5b5e5a' }} />}
          >
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dfe1dd" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#828782' }} axisLine={{ stroke: '#dfe1dd' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#828782' }} axisLine={{ stroke: '#dfe1dd' }} />
                  <Tooltip
                    formatter={(value: number, name: string) => [value, name === 'currentYear' ? '2024-2025' : '2023-2024']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #dfe1dd', fontSize: 12 }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="currentYear" name="2024-2025" fill="#9fe870" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="previousYear" name="2023-2024" fill="#dfe1dd" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ContentCard>
        </div>
      </div>
    </PortalLayout>
  );
}
