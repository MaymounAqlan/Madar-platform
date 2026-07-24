export interface HealthStatus {
  name: string;
  nameAr: string;
  status: 'healthy' | 'warning' | 'error';
  uptime?: string;
  responseTime?: string;
  connections?: string;
  capacity?: string;
  usage?: string;
  requestsToday?: string;
  avgResponse?: string;
  detail?: string;
  detailAr?: string;
}

export const healthStatuses: HealthStatus[] = [
  {
    name: 'API', nameAr: 'واجهة البرمجة', status: 'healthy',
    uptime: '99.97%', responseTime: '45ms',
  },
  {
    name: 'Database', nameAr: 'قاعدة البيانات', status: 'healthy',
    connections: '23/100', responseTime: '12ms',
  },
  {
    name: 'AI Engine', nameAr: 'محرك الذكاء الاصطناعي', status: 'warning',
    requestsToday: '12,450', avgResponse: '1.2s',
    detail: 'High latency detected', detailAr: 'تم اكتشاف تأخير عالٍ',
  },
  {
    name: 'Storage', nameAr: 'التخزين', status: 'healthy',
    usage: '67%', capacity: '134 GB / 200 GB',
  },
];

export interface PlatformMetric {
  value: string; labelAr: string; labelEn: string;
  trend?: number; trendLabelAr?: string; trendLabelEn?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  iconName: string; iconBg: string;
}

export const platformMetrics: PlatformMetric[] = [
  { value: '50,847', labelAr: 'إجمالي المستخدمين', labelEn: 'Total Users', trend: 12, trendLabelAr: 'هذا الشهر', trendLabelEn: 'this month', trendDirection: 'up', iconName: 'Users', iconBg: '#E7FDD8' },
  { value: '1,245', labelAr: 'وظائف نشطة', labelEn: 'Active Jobs', trend: 8, trendLabelAr: 'هذا الشهر', trendLabelEn: 'this month', trendDirection: 'up', iconName: 'Briefcase', iconBg: '#DBEAFE' },
  { value: '28.4K', labelAr: 'طلبات توظيف', labelEn: 'Applications', trend: 15, trendLabelAr: 'هذا الشهر', trendLabelEn: 'this month', trendDirection: 'up', iconName: 'FileText', iconBg: '#E7FDD8' },
  { value: '800', labelAr: 'جامعات', labelEn: 'Universities', iconName: 'GraduationCap', iconBg: '#F3E8FF' },
  { value: '82%', labelAr: 'متوسط التوافق', labelEn: 'Avg Match Score', iconName: 'BarChart3', iconBg: '#FEF3C7' },
  { value: '99.5%', labelAr: 'وقت تشغيل النظام', labelEn: 'System Uptime', iconName: 'Activity', iconBg: '#E7FDD8' },
];

export type UserType = 'student' | 'company' | 'university' | 'admin';
export type UserStatus = 'active' | 'banned' | 'pending';

export interface UserRecord {
  id: string; name: string; nameAr: string; type: UserType;
  email: string; status: UserStatus;
  joinedDate: string; lastActive: string; lastActiveAr: string;
}

export const users: UserRecord[] = [
  { id: '1', name: 'Ahmad Al-Ali', nameAr: 'أحمد العلي', type: 'student', email: 'ahmad@email.com', status: 'active', joinedDate: '2024-10-15', lastActive: '2 hours ago', lastActiveAr: 'منذ ساعتين' },
  { id: '2', name: 'Sara Al-Qahtani', nameAr: 'سارة القحطاني', type: 'student', email: 'sara.q@email.com', status: 'active', joinedDate: '2024-11-01', lastActive: '5 min ago', lastActiveAr: 'منذ 5 دقائق' },
  { id: '3', name: 'STC Recruitment', nameAr: 'موارد إس تي سي', type: 'company', email: 'hr@stc.com.sa', status: 'active', joinedDate: '2024-09-20', lastActive: '5 hours ago', lastActiveAr: 'منذ 5 ساعات' },
  { id: '4', name: 'SABIC Careers', nameAr: 'سابك', type: 'company', email: 'careers@sabic.com', status: 'active', joinedDate: '2024-08-12', lastActive: '1 day ago', lastActiveAr: 'منذ يوم' },
  { id: '5', name: 'KSU Admin', nameAr: 'إدارة جامعة الملك سعود', type: 'university', email: 'admin@ksu.edu.sa', status: 'active', joinedDate: '2024-08-01', lastActive: '1 day ago', lastActiveAr: 'منذ يوم' },
  { id: '6', name: 'KAUST HR', nameAr: 'كاوست', type: 'university', email: 'hr@kaust.edu.sa', status: 'pending', joinedDate: '2024-11-10', lastActive: '3 days ago', lastActiveAr: 'منذ 3 أيام' },
  { id: '7', name: 'Platform Admin', nameAr: 'مدير المنصة', type: 'admin', email: 'super@madar.sa', status: 'active', joinedDate: '2024-01-15', lastActive: 'Just now', lastActiveAr: 'الآن' },
  { id: '8', name: 'Faisal Al-Otaibi', nameAr: 'فيصل العتيبي', type: 'student', email: 'faisal@email.com', status: 'banned', joinedDate: '2024-07-22', lastActive: '2 weeks ago', lastActiveAr: 'منذ أسبوعين' },
  { id: '9', name: 'Aramco Talent', nameAr: 'أرامكو', type: 'company', email: 'talent@aramco.com', status: 'active', joinedDate: '2024-06-10', lastActive: '3 hours ago', lastActiveAr: 'منذ 3 ساعات' },
  { id: '10', name: 'Imam University', nameAr: 'جامعة الإمام', type: 'university', email: 'admin@imamu.edu.sa', status: 'active', joinedDate: '2024-09-05', lastActive: '4 hours ago', lastActiveAr: 'منذ 4 ساعات' },
  { id: '11', name: 'Noura Al-Rashid', nameAr: 'نورة الراشد', type: 'student', email: 'noura@email.com', status: 'active', joinedDate: '2024-10-28', lastActive: '30 min ago', lastActiveAr: 'منذ 30 دقيقة' },
  { id: '12', name: 'Mobily HR', nameAr: 'موبايلي', type: 'company', email: 'hr@mobily.com.sa', status: 'pending', joinedDate: '2024-11-12', lastActive: '1 day ago', lastActiveAr: 'منذ يوم' },
];

export const typeLabelMap: Record<UserType, { ar: string; en: string; bg: string; text: string }> = {
  student: { ar: 'طالب', en: 'Student', bg: '#E7FDD8', text: '#1ba442' },
  company: { ar: 'شركة', en: 'Company', bg: '#DBEAFE', text: '#1D4ED8' },
  university: { ar: 'جامعة', en: 'University', bg: '#F3E8FF', text: '#7C3AED' },
  admin: { ar: 'مدير', en: 'Admin', bg: '#FEF3C7', text: '#B45309' },
};

export const statusVariantMap: Record<UserStatus, string> = {
  active: 'success', banned: 'error', pending: 'warning',
};

export type ActivityType = 'user' | 'system' | 'alert' | 'error';

export interface ActivityEvent {
  id: string; type: ActivityType;
  description: string; descriptionAr: string;
  timestamp: string; timestampAr: string;
}

export const recentActivity: ActivityEvent[] = [
  { id: '1', type: 'user', description: 'New student registered: Sara Al-Qahtani', descriptionAr: 'طالب جديد مسجل: سارة القحطاني', timestamp: '5 min ago', timestampAr: 'منذ 5 دقائق' },
  { id: '2', type: 'system', description: 'Daily AI matching completed: 2,340 new recommendations', descriptionAr: 'اكتمل المطابقة اليومي: 2,340 توصية جديدة', timestamp: '1 hour ago', timestampAr: 'منذ ساعة' },
  { id: '3', type: 'alert', description: 'AI Engine latency spike detected: 2.1s avg response', descriptionAr: 'تم اكتشاف ارتفاع في تأخير محرك الذكاء الاصطناعي', timestamp: '2 hours ago', timestampAr: 'منذ ساعتين' },
  { id: '4', type: 'user', description: 'STC posted new job: AI Engineer (Riyadh)', descriptionAr: 'نشرت إس تي سي وظيفة: مهندس ذكاء اصطناعي', timestamp: '3 hours ago', timestampAr: 'منذ 3 ساعات' },
  { id: '5', type: 'user', description: 'KSU admin updated college enrollment data', descriptionAr: 'قامت إدارة جامعة الملك سعود بتحديث بيانات الكليات', timestamp: '5 hours ago', timestampAr: 'منذ 5 ساعات' },
  { id: '6', type: 'system', description: 'Weekly analytics report generated and emailed', descriptionAr: 'تم إنشاء تقرير التحليلات الأسبوعي', timestamp: '1 day ago', timestampAr: 'منذ يوم' },
  { id: '7', type: 'user', description: 'New company registered: Saudi Digital Solutions', descriptionAr: 'شركة جديدة مسجلة: الحلول الرقمية السعودية', timestamp: '1 day ago', timestampAr: 'منذ يوم' },
  { id: '8', type: 'alert', description: 'Storage usage crossed 65% threshold', descriptionAr: 'تجاوز استخدام التخزين 65%', timestamp: '2 days ago', timestampAr: 'منذ يومين' },
  { id: '9', type: 'error', description: 'API rate limit exceeded by IP 203.0.113.45', descriptionAr: 'تم تجاوز حد معدل واجهة البرمجة', timestamp: '2 days ago', timestampAr: 'منذ يومين' },
  { id: '10', type: 'user', description: 'Application submitted: Ahmad Al-Ali -> STC', descriptionAr: 'تم تقديم طلب: أحمد العلي -> إس تي سي', timestamp: '3 days ago', timestampAr: 'منذ 3 أيام' },
  { id: '11', type: 'system', description: 'Database backup completed successfully (4.2 GB)', descriptionAr: 'اكتمل النسخ الاحتياطي لقاعدة البيانات', timestamp: '3 days ago', timestampAr: 'منذ 3 أيام' },
  { id: '12', type: 'user', description: 'KAUST updated 15 new course skill mappings', descriptionAr: 'قامت كاوست بتحديث 15 تخطيط مهارات جديد', timestamp: '4 days ago', timestampAr: 'منذ 4 أيام' },
  { id: '13', type: 'alert', description: '3 failed login attempts for user #8921', descriptionAr: '3 محاولات تسجيل دخول فاشلة للمستخدم #8921', timestamp: '4 days ago', timestampAr: 'منذ 4 أيام' },
  { id: '14', type: 'user', description: 'University admin: Imam U approved 23 new accounts', descriptionAr: 'إدارة جامعة الإمام وافقت على 23 حساب جديد', timestamp: '5 days ago', timestampAr: 'منذ 5 أيام' },
  { id: '15', type: 'system', description: 'Platform v2.4.1 deployed to production', descriptionAr: 'تم نشر المنصة v2.4.1 للإنتاج', timestamp: '5 days ago', timestampAr: 'منذ 5 أيام' },
];

export interface ApiRequestDataPoint { time: string; total: number; successful: number; failed: number; }

export const apiRequestsData: ApiRequestDataPoint[] = [
  { time: '00:00', total: 320, successful: 318, failed: 2 }, { time: '01:00', total: 180, successful: 179, failed: 1 },
  { time: '02:00', total: 140, successful: 140, failed: 0 }, { time: '03:00', total: 110, successful: 110, failed: 0 },
  { time: '04:00', total: 95, successful: 94, failed: 1 }, { time: '05:00', total: 120, successful: 119, failed: 1 },
  { time: '06:00', total: 200, successful: 199, failed: 1 }, { time: '07:00', total: 450, successful: 447, failed: 3 },
  { time: '08:00', total: 820, successful: 815, failed: 5 }, { time: '09:00', total: 1250, successful: 1240, failed: 10 },
  { time: '10:00', total: 1480, successful: 1468, failed: 12 }, { time: '11:00', total: 1350, successful: 1340, failed: 10 },
  { time: '12:00', total: 1100, successful: 1092, failed: 8 }, { time: '13:00', total: 980, successful: 974, failed: 6 },
  { time: '14:00', total: 1150, successful: 1141, failed: 9 }, { time: '15:00', total: 1320, successful: 1310, failed: 10 },
  { time: '16:00', total: 1250, successful: 1242, failed: 8 }, { time: '17:00', total: 1050, successful: 1044, failed: 6 },
  { time: '18:00', total: 780, successful: 775, failed: 5 }, { time: '19:00', total: 650, successful: 646, failed: 4 },
  { time: '20:00', total: 720, successful: 716, failed: 4 }, { time: '21:00', total: 850, successful: 844, failed: 6 },
  { time: '22:00', total: 680, successful: 676, failed: 4 }, { time: '23:00', total: 420, successful: 417, failed: 3 },
];

export interface ResponseTimeDataPoint { time: string; responseTime: number; threshold: number; }

export const responseTimeData: ResponseTimeDataPoint[] = [
  { time: '00:00', responseTime: 42, threshold: 300 }, { time: '01:00', responseTime: 38, threshold: 300 },
  { time: '02:00', responseTime: 35, threshold: 300 }, { time: '03:00', responseTime: 33, threshold: 300 },
  { time: '04:00', responseTime: 36, threshold: 300 }, { time: '05:00', responseTime: 40, threshold: 300 },
  { time: '06:00', responseTime: 55, threshold: 300 }, { time: '07:00', responseTime: 120, threshold: 300 },
  { time: '08:00', responseTime: 180, threshold: 300 }, { time: '09:00', responseTime: 245, threshold: 300 },
  { time: '10:00', responseTime: 280, threshold: 300 }, { time: '11:00', responseTime: 265, threshold: 300 },
  { time: '12:00', responseTime: 230, threshold: 300 }, { time: '13:00', responseTime: 195, threshold: 300 },
  { time: '14:00', responseTime: 210, threshold: 300 }, { time: '15:00', responseTime: 250, threshold: 300 },
  { time: '16:00', responseTime: 240, threshold: 300 }, { time: '17:00', responseTime: 200, threshold: 300 },
  { time: '18:00', responseTime: 150, threshold: 300 }, { time: '19:00', responseTime: 120, threshold: 300 },
  { time: '20:00', responseTime: 130, threshold: 300 }, { time: '21:00', responseTime: 145, threshold: 300 },
  { time: '22:00', responseTime: 110, threshold: 300 }, { time: '23:00', responseTime: 65, threshold: 300 },
];

export interface ErrorRateDataPoint { endpoint: string; errorRate: number; }

export const errorRateData: ErrorRateDataPoint[] = [
  { endpoint: '/api/v1/match', errorRate: 0.8 }, { endpoint: '/api/v1/apply', errorRate: 0.6 },
  { endpoint: '/api/v1/auth', errorRate: 0.5 }, { endpoint: '/api/v1/jobs', errorRate: 0.4 },
  { endpoint: '/api/v1/upload', errorRate: 0.35 }, { endpoint: '/api/v1/search', errorRate: 0.3 },
  { endpoint: '/api/v1/users', errorRate: 0.2 }, { endpoint: '/api/v1/skills', errorRate: 0.15 },
  { endpoint: '/api/v1/reports', errorRate: 0.1 }, { endpoint: '/api/v1/health', errorRate: 0.02 },
];

export interface UserGrowthDataPoint {
  month: string; monthAr: string; students: number; companies: number; universities: number; total: number;
}

export const userGrowthData: UserGrowthDataPoint[] = [
  { month: 'Jan', monthAr: 'يناير', students: 28500, companies: 680, universities: 520, total: 29700 },
  { month: 'Feb', monthAr: 'فبراير', students: 30200, companies: 720, universities: 540, total: 31460 },
  { month: 'Mar', monthAr: 'مارس', students: 32100, companies: 780, universities: 580, total: 33460 },
  { month: 'Apr', monthAr: 'أبريل', students: 33800, companies: 830, universities: 620, total: 35250 },
  { month: 'May', monthAr: 'مايو', students: 35200, companies: 890, universities: 650, total: 36740 },
  { month: 'Jun', monthAr: 'يونيو', students: 36800, companies: 950, universities: 680, total: 38430 },
  { month: 'Jul', monthAr: 'يوليو', students: 38200, companies: 1020, universities: 710, total: 39930 },
  { month: 'Aug', monthAr: 'أغسطس', students: 39800, companies: 1080, universities: 740, total: 41620 },
  { month: 'Sep', monthAr: 'سبتمبر', students: 41200, companies: 1120, universities: 760, total: 43080 },
  { month: 'Oct', monthAr: 'أكتوبر', students: 42800, companies: 1160, universities: 780, total: 44740 },
  { month: 'Nov', monthAr: 'نوفمبر', students: 44200, companies: 1200, universities: 790, total: 46190 },
  { month: 'Dec', monthAr: 'ديسمبر', students: 45847, companies: 1245, universities: 800, total: 47892 },
];
