import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  FinancialState,
  NavTabId,
  ThemeMode,
  Language,
  InvoiceRecord,
  PaymentOrderRecord,
  ProjectCommentItem,
  DashboardGridItemLayout,
} from '../types/financial';

export const STORAGE_KEY = 'eec_financial_dashboard_state_v2';

export const DEFAULT_DASHBOARD_LAYOUTS: Record<string, DashboardGridItemLayout[]> = {
  lg: [
    { i: 'kpi_highlights', x: 0, y: 0, w: 12, h: 3, minW: 6, minH: 3 },
    { i: 'summary_kpis', x: 0, y: 3, w: 12, h: 2, minW: 6, minH: 2 },
    { i: 'cash_flow', x: 0, y: 5, w: 5, h: 7, minW: 4, minH: 5 },
    { i: 'project_status', x: 5, y: 5, w: 4, h: 7, minW: 3, minH: 5 },
    { i: 'financial_position', x: 9, y: 5, w: 3, h: 7, minW: 3, minH: 5 },
    { i: 'aging_payables', x: 0, y: 12, w: 4, h: 7, minW: 3, minH: 5 },
    { i: 'aging_receivables', x: 4, y: 12, w: 4, h: 7, minW: 3, minH: 5 },
    { i: 'budget_vs_actual', x: 8, y: 12, w: 4, h: 7, minW: 3, minH: 5 },
    { i: 'monthly_recharts', x: 0, y: 19, w: 12, h: 8, minW: 6, minH: 6 },
    { i: 'trend_analysis', x: 0, y: 27, w: 12, h: 9, minW: 6, minH: 7 },
    { i: 'milestones_timeline', x: 0, y: 36, w: 12, h: 8, minW: 6, minH: 6 },
    { i: 'project_comments', x: 0, y: 44, w: 12, h: 12, minW: 6, minH: 8 },
  ],
  md: [
    { i: 'kpi_highlights', x: 0, y: 0, w: 12, h: 3, minW: 6, minH: 3 },
    { i: 'summary_kpis', x: 0, y: 3, w: 12, h: 3, minW: 6, minH: 2 },
    { i: 'cash_flow', x: 0, y: 6, w: 6, h: 7, minW: 4, minH: 5 },
    { i: 'project_status', x: 6, y: 6, w: 6, h: 7, minW: 4, minH: 5 },
    { i: 'financial_position', x: 0, y: 13, w: 4, h: 7, minW: 3, minH: 5 },
    { i: 'aging_payables', x: 4, y: 13, w: 4, h: 7, minW: 3, minH: 5 },
    { i: 'aging_receivables', x: 8, y: 13, w: 4, h: 7, minW: 3, minH: 5 },
    { i: 'budget_vs_actual', x: 0, y: 20, w: 12, h: 7, minW: 4, minH: 5 },
    { i: 'monthly_recharts', x: 0, y: 27, w: 12, h: 8, minW: 6, minH: 6 },
    { i: 'trend_analysis', x: 0, y: 35, w: 12, h: 9, minW: 6, minH: 7 },
    { i: 'milestones_timeline', x: 0, y: 44, w: 12, h: 8, minW: 6, minH: 6 },
    { i: 'project_comments', x: 0, y: 52, w: 12, h: 13, minW: 6, minH: 8 },
  ],
  sm: [
    { i: 'kpi_highlights', x: 0, y: 0, w: 6, h: 5, minW: 4, minH: 4 },
    { i: 'summary_kpis', x: 0, y: 5, w: 6, h: 5, minW: 4, minH: 4 },
    { i: 'cash_flow', x: 0, y: 10, w: 6, h: 7, minW: 4, minH: 5 },
    { i: 'project_status', x: 0, y: 17, w: 6, h: 7, minW: 4, minH: 5 },
    { i: 'financial_position', x: 0, y: 24, w: 6, h: 7, minW: 4, minH: 5 },
    { i: 'aging_payables', x: 0, y: 31, w: 6, h: 7, minW: 4, minH: 5 },
    { i: 'aging_receivables', x: 0, y: 38, w: 6, h: 7, minW: 4, minH: 5 },
    { i: 'budget_vs_actual', x: 0, y: 45, w: 6, h: 7, minW: 4, minH: 5 },
    { i: 'monthly_recharts', x: 0, y: 52, w: 6, h: 9, minW: 4, minH: 6 },
    { i: 'trend_analysis', x: 0, y: 61, w: 6, h: 10, minW: 4, minH: 7 },
    { i: 'milestones_timeline', x: 0, y: 71, w: 6, h: 9, minW: 4, minH: 6 },
    { i: 'project_comments', x: 0, y: 80, w: 6, h: 16, minW: 4, minH: 8 },
  ],
  xs: [
    { i: 'kpi_highlights', x: 0, y: 0, w: 4, h: 9, minW: 4, minH: 6 },
    { i: 'summary_kpis', x: 0, y: 9, w: 4, h: 8, minW: 4, minH: 6 },
    { i: 'cash_flow', x: 0, y: 17, w: 4, h: 7, minW: 4, minH: 5 },
    { i: 'project_status', x: 0, y: 24, w: 4, h: 7, minW: 4, minH: 5 },
    { i: 'financial_position', x: 0, y: 31, w: 4, h: 7, minW: 4, minH: 5 },
    { i: 'aging_payables', x: 0, y: 38, w: 4, h: 7, minW: 4, minH: 5 },
    { i: 'aging_receivables', x: 0, y: 45, w: 4, h: 7, minW: 4, minH: 5 },
    { i: 'budget_vs_actual', x: 0, y: 52, w: 4, h: 7, minW: 4, minH: 5 },
    { i: 'monthly_recharts', x: 0, y: 59, w: 4, h: 9, minW: 4, minH: 6 },
    { i: 'trend_analysis', x: 0, y: 68, w: 4, h: 11, minW: 4, minH: 7 },
    { i: 'milestones_timeline', x: 0, y: 79, w: 4, h: 9, minW: 4, minH: 6 },
    { i: 'project_comments', x: 0, y: 88, w: 4, h: 17, minW: 4, minH: 8 },
  ],
  xxs: [
    { i: 'kpi_highlights', x: 0, y: 0, w: 2, h: 9, minW: 2, minH: 6 },
    { i: 'summary_kpis', x: 0, y: 9, w: 2, h: 8, minW: 2, minH: 6 },
    { i: 'cash_flow', x: 0, y: 17, w: 2, h: 7, minW: 2, minH: 5 },
    { i: 'project_status', x: 0, y: 24, w: 2, h: 7, minW: 2, minH: 5 },
    { i: 'financial_position', x: 0, y: 31, w: 2, h: 7, minW: 2, minH: 5 },
    { i: 'aging_payables', x: 0, y: 38, w: 2, h: 7, minW: 2, minH: 5 },
    { i: 'aging_receivables', x: 0, y: 45, w: 2, h: 7, minW: 2, minH: 5 },
    { i: 'budget_vs_actual', x: 0, y: 52, w: 2, h: 7, minW: 2, minH: 5 },
    { i: 'monthly_recharts', x: 0, y: 59, w: 2, h: 9, minW: 2, minH: 6 },
    { i: 'trend_analysis', x: 0, y: 68, w: 2, h: 11, minW: 2, minH: 7 },
    { i: 'milestones_timeline', x: 0, y: 79, w: 2, h: 9, minW: 2, minH: 6 },
    { i: 'project_comments', x: 0, y: 88, w: 2, h: 17, minW: 2, minH: 8 },
  ],
};

export const getDefaultState = (): FinancialState => ({
  activeTab: 'dashboard',
  theme: 'light',
  language: 'en',
  fiscalYear: '2026',
  selectedProject: 'ALL',
  period: 'YTD',
  searchQuery: '',
  totalContracts: 1250000000,
  executedValue: 870000000,
  totalInvoices: 560000000,
  totalPayments: 520000000,
  remainingValue: 380000000,
  cashFlow: [
    { monthKey: 'Jan', labelEn: 'Jan', labelAr: 'يناير', inflow: 32, outflow: 19 },
    { monthKey: 'Feb', labelEn: 'Feb', labelAr: 'فبراير', inflow: 43, outflow: 26 },
    { monthKey: 'Mar', labelEn: 'Mar', labelAr: 'مارس', inflow: 56, outflow: 33 },
    { monthKey: 'Apr', labelEn: 'Apr', labelAr: 'أبريل', inflow: 47, outflow: 24 },
    { monthKey: 'May', labelEn: 'May', labelAr: 'مايو', inflow: 63, outflow: 36 },
    { monthKey: 'Jun', labelEn: 'Jun', labelAr: 'يونيو', inflow: 76, outflow: 43 },
    { monthKey: 'Jul', labelEn: 'Jul', labelAr: 'يوليو', inflow: 69, outflow: 50 },
    { monthKey: 'Aug', labelEn: 'Aug', labelAr: 'أغسطس', inflow: 73, outflow: 44 },
    { monthKey: 'Sep', labelEn: 'Sep', labelAr: 'سبتمبر', inflow: 85, outflow: 59 },
    { monthKey: 'Oct', labelEn: 'Oct', labelAr: 'أكتوبر', inflow: 91, outflow: 59 },
    { monthKey: 'Nov', labelEn: 'Nov', labelAr: 'نوفمبر', inflow: 99, outflow: 76 },
    { monthKey: 'Dec', labelEn: 'Dec', labelAr: 'ديسمبر', inflow: 102, outflow: 74 },
  ],
  projects: [
    {
      id: 'PRJ-01',
      nameEn: 'Administrative Building',
      nameAr: 'المبنى الإداري الرئيسي',
      contractValue: 420000000,
      allocatedBudget: 375000000,
      actualSpent: 357000000,
      executedValue: 357000000,
      invoicedValue: 230000000,
      paidValue: 215000000,
      completionPercentage: 85,
      colorType: 'green',
      managerEn: 'Eng. Tarek El-Masry',
      managerAr: 'م. طارق المصري',
    },
    {
      id: 'PRJ-02',
      nameEn: 'Main Workshop',
      nameAr: 'الورشة الهندسية الرئيسية',
      contractValue: 310000000,
      allocatedBudget: 242000000,
      actualSpent: 223200000,
      executedValue: 223200000,
      invoicedValue: 145000000,
      paidValue: 135000000,
      completionPercentage: 72,
      colorType: 'blue',
      managerEn: 'Eng. Khaled Mansour',
      managerAr: 'م. خالد منصور',
    },
    {
      id: 'PRJ-03',
      nameEn: 'Utilities & Infrastructure',
      nameAr: 'المرافق والبنية التحتية',
      contractValue: 250000000,
      allocatedBudget: 195000000,
      actualSpent: 162500000,
      executedValue: 162500000,
      invoicedValue: 105000000,
      paidValue: 95000000,
      completionPercentage: 65,
      colorType: 'gold',
      managerEn: 'Eng. Hany Abdel-Aziz',
      managerAr: 'م. هاني عبد العزيز',
    },
    {
      id: 'PRJ-04',
      nameEn: 'Warehouse',
      nameAr: 'المستودعات والمخازن الاستراتيجية',
      contractValue: 160000000,
      allocatedBudget: 120000000,
      actualSpent: 83200000,
      executedValue: 83200000,
      invoicedValue: 52000000,
      paidValue: 49000000,
      completionPercentage: 58,
      colorType: 'sky',
      managerEn: 'Eng. Amr Soliman',
      managerAr: 'م. عمرو سليمان',
    },
    {
      id: 'PRJ-05',
      nameEn: 'Site Facilities',
      nameAr: 'تجهيزات الموقع والخدمات',
      contractValue: 110000000,
      allocatedBudget: 85000000,
      actualSpent: 44100000,
      executedValue: 44100000,
      invoicedValue: 28000000,
      paidValue: 26000000,
      completionPercentage: 40,
      colorType: 'red',
      managerEn: 'Eng. Mahmoud Farouk',
      managerAr: 'م. محمود فاروق',
    },
  ],
  agingPayables: [
    {
      id: 'AP-1',
      periodEn: 'Current (0 – 30 Days)',
      periodAr: 'حالي (0 – 30 يوم)',
      amount: 210000000,
      percentage: 40.4,
      badgeColor: 'green',
    },
    {
      id: 'AP-2',
      periodEn: '31 – 60 Days',
      periodAr: '31 – 60 يوم',
      amount: 150000000,
      percentage: 28.8,
      badgeColor: 'yellow',
    },
    {
      id: 'AP-3',
      periodEn: '61 – 90 Days',
      periodAr: '61 – 90 يوم',
      amount: 100000000,
      percentage: 19.2,
      badgeColor: 'orange',
    },
    {
      id: 'AP-4',
      periodEn: '> 90 Days',
      periodAr: 'أكثر من 90 يوم',
      amount: 60000000,
      percentage: 11.6,
      badgeColor: 'red',
    },
  ],
  agingReceivables: [
    {
      id: 'AR-1',
      periodEn: 'Current (0 – 30 Days)',
      periodAr: 'حالي (0 – 30 يوم)',
      amount: 180000000,
      percentage: 42.9,
      badgeColor: 'green',
    },
    {
      id: 'AR-2',
      periodEn: '31 – 60 Days',
      periodAr: '31 – 60 يوم',
      amount: 120000000,
      percentage: 28.8,
      badgeColor: 'yellow',
    },
    {
      id: 'AR-3',
      periodEn: '61 – 90 Days',
      periodAr: '61 – 90 يوم',
      amount: 80000000,
      percentage: 19.0,
      badgeColor: 'orange',
    },
    {
      id: 'AR-4',
      periodEn: '> 90 Days',
      periodAr: 'أكثر من 90 يوم',
      amount: 40000000,
      percentage: 9.5,
      badgeColor: 'red',
    },
  ],
  budgetVsActual: [
    {
      id: 'CAT-1',
      nameEn: 'Civil',
      nameAr: 'مدني',
      budget: 420,
      actual: 390,
      iconType: 'civil',
    },
    {
      id: 'CAT-2',
      nameEn: 'Architectural',
      nameAr: 'معماري',
      budget: 180,
      actual: 165,
      iconType: 'architectural',
    },
    {
      id: 'CAT-3',
      nameEn: 'Mechanical',
      nameAr: 'ميكانيكا',
      budget: 240,
      actual: 210,
      iconType: 'mechanical',
    },
    {
      id: 'CAT-4',
      nameEn: 'Electrical',
      nameAr: 'كهرباء',
      budget: 170,
      actual: 145,
      iconType: 'electrical',
    },
    {
      id: 'CAT-5',
      nameEn: 'Others',
      nameAr: 'أخرى',
      budget: 70,
      actual: 60,
      iconType: 'others',
    },
  ],
  invoicesList: [
    {
      id: 'INV-101',
      invoiceNo: 'EEC-INV-2026-084',
      projectId: 'PRJ-01',
      projectNameEn: 'Administrative Building',
      projectNameAr: 'المبنى الإداري الرئيسي',
      clientEn: 'New Urban Communities Authority',
      clientAr: 'هيئة المجتمعات العمرانية الجديدة',
      amount: 48500000,
      date: '2026-10-18',
      dueDate: '2026-11-18',
      status: 'approved',
      type: 'receivable',
    },
    {
      id: 'INV-102',
      invoiceNo: 'EEC-INV-2026-085',
      projectId: 'PRJ-02',
      projectNameEn: 'Main Workshop',
      projectNameAr: 'الورشة الهندسية الرئيسية',
      clientEn: 'Industrial Development Group',
      clientAr: 'مجموعة التنمية الصناعية',
      amount: 34200000,
      date: '2026-10-22',
      dueDate: '2026-11-22',
      status: 'paid',
      type: 'receivable',
    },
    {
      id: 'INV-103',
      invoiceNo: 'EEC-INV-2026-086',
      projectId: 'PRJ-03',
      projectNameEn: 'Utilities & Infrastructure',
      projectNameAr: 'المرافق والبنية التحتية',
      clientEn: 'National Grid & Utilities Co.',
      clientAr: 'الشركة القومية للمرافق والشبكات',
      amount: 29800000,
      date: '2026-10-25',
      dueDate: '2026-11-25',
      status: 'pending',
      type: 'receivable',
    },
    {
      id: 'INV-104',
      invoiceNo: 'EEC-SUB-2026-412',
      projectId: 'PRJ-04',
      projectNameEn: 'Warehouse',
      projectNameAr: 'المستودعات والمخازن الاستراتيجية',
      clientEn: 'Delta Steel Structures Ltd.',
      clientAr: 'شركة الدلتا للهياكل المعدنية',
      amount: 18400000,
      date: '2026-09-12',
      dueDate: '2026-10-12',
      status: 'overdue',
      type: 'payable',
    },
    {
      id: 'INV-105',
      invoiceNo: 'EEC-SUB-2026-419',
      projectId: 'PRJ-05',
      projectNameEn: 'Site Facilities',
      projectNameAr: 'تجهيزات الموقع والخدمات',
      clientEn: 'Al-Ahram Ready Mix Concrete',
      clientAr: 'الأهرام للخرسانة الجاهزة',
      amount: 12600000,
      date: '2026-10-28',
      dueDate: '2026-11-28',
      status: 'approved',
      type: 'payable',
    },
  ],
  paymentOrdersList: [
    {
      id: 'PO-201',
      orderNo: 'PO-2026-9012',
      beneficiaryEn: 'Al-Ezz Steel Rebars Co.',
      beneficiaryAr: 'شركة حديد عز للتسليح',
      projectId: 'PRJ-01',
      projectNameEn: 'Administrative Building',
      projectNameAr: 'المبنى الإداري الرئيسي',
      amount: 24500000,
      date: '2026-10-29',
      methodEn: 'Bank Transfer (RTGS)',
      methodAr: 'تحويل بنكي فوري',
      status: 'executed',
      category: 'Civil',
    },
    {
      id: 'PO-202',
      orderNo: 'PO-2026-9013',
      beneficiaryEn: 'Elsewedy Electric Cables',
      beneficiaryAr: 'السويدي للكابلات والأنظمة الكهربائية',
      projectId: 'PRJ-03',
      projectNameEn: 'Utilities & Infrastructure',
      projectNameAr: 'المرافق والبنية التحتية',
      amount: 16800000,
      date: '2026-10-30',
      methodEn: 'Letter of Credit (LC)',
      methodAr: 'اعتماد مستندي',
      status: 'approved',
      category: 'Electrical',
    },
    {
      id: 'PO-203',
      orderNo: 'PO-2026-9014',
      beneficiaryEn: 'Orascom HVAC & Mechanical Systems',
      beneficiaryAr: 'أوراسكوم للأنظمة الميكانيكية والتكييف',
      projectId: 'PRJ-02',
      projectNameEn: 'Main Workshop',
      projectNameAr: 'الورشة الهندسية الرئيسية',
      amount: 19200000,
      date: '2026-11-01',
      methodEn: 'Certified Cheque',
      methodAr: 'شيك مصرفي مصدق',
      status: 'pending',
      category: 'Mechanical',
    },
  ],
  notifications: [
    {
      id: 'NOTIF-1',
      titleEn: 'BUDGET ALERT: Administrative Building reached 95.8% of allocated budget (EGP 345M / 360M)',
      titleAr: 'تنبيه موازنة: المبنى الإداري الرئيسي وصل إلى 95.8% من الموازنة المخصصة (345 / 360 مليون ج.م)',
      timeEn: '5 mins ago',
      timeAr: 'منذ 5 دقائق',
      read: false,
      type: 'warning',
    },
    {
      id: 'NOTIF-2',
      titleEn: 'IPC #14 for Administrative Building approved (EGP 48.5M)',
      titleAr: 'تم اعتماد المستخلص الجاري رقم 14 للمبنى الإداري بقيمة 48.5 مليون ج.م',
      timeEn: '15 mins ago',
      timeAr: 'منذ 15 دقيقة',
      read: false,
      type: 'success',
    },
    {
      id: 'NOTIF-3',
      titleEn: 'BUDGET ALERT: Utilities & Infrastructure exceeded 90% threshold (94.0% utilized)',
      titleAr: 'تنبيه موازنة: مشروع المرافق والبنية التحتية تجاوز حد 90% (استهلاك 94.0%)',
      timeEn: '42 mins ago',
      timeAr: 'منذ 42 دقيقة',
      read: false,
      type: 'warning',
    },
    {
      id: 'NOTIF-4',
      titleEn: 'Payment Order PO-2026-9012 executed via Bank Transfer (EGP 24.5M)',
      titleAr: 'تم تنفيذ أمر الدفع PO-2026-9012 عبر التحويل البنكي الفوري بقيمة 24.5 مليون ج.م',
      timeEn: '2 hours ago',
      timeAr: 'منذ ساعتين',
      read: false,
      type: 'info',
    },
    {
      id: 'NOTIF-5',
      titleEn: 'Letter of Credit LC-9013 settled for Elsewedy Electric Cables (EGP 16.8M)',
      titleAr: 'تمت تسوية الاعتماد المستندي LC-9013 لشركة السويدي للكابلات بقيمة 16.8 مليون ج.م',
      timeEn: '5 hours ago',
      timeAr: 'منذ 5 ساعات',
      read: true,
      type: 'success',
    },
    {
      id: 'NOTIF-6',
      titleEn: 'Subcontractor payable aging > 90 days review scheduled with Cost Control',
      titleAr: 'موعد مراجعة مستحقات مقاولي الباطن المتجاوزة 90 يوماً مع قسم مراقبة التكاليف',
      timeEn: 'Yesterday',
      timeAr: 'أمس',
      read: true,
      type: 'warning',
    },
  ],
  projectComments: [
    {
      id: 'CMT-101',
      projectId: 'PRJ-01',
      authorNameEn: 'Eng. Tarek El-Masry',
      authorNameAr: 'م. طارق المصري',
      authorRoleEn: 'Project Director',
      authorRoleAr: 'مدير المشروع',
      commentEn:
        'Structural curtain wall installation and MEP rough-in on floors 4–6 completed ahead of schedule. IPC #14 submitted and verified with cost control.',
      commentAr:
        'تم الانتهاء من تركيب الواجهات الزجاجية وتمديدات الكهروميكانيك للأدوار 4-6 قبل الجدول الزمني. تم تقديم المستخلص رقم 14 ومراجعته مع مراقبة التكاليف.',
      createdAt: '2026-10-29 14:30',
      progressSnapshot: 85,
    },
    {
      id: 'CMT-102',
      projectId: 'PRJ-01',
      authorNameEn: 'Ahmed Hossam',
      authorNameAr: 'أحمد حسام',
      authorRoleEn: 'Financial Manager',
      authorRoleAr: 'المدير المالي',
      commentEn:
        'Budget utilization is at 95.8% due to accelerated facade material delivery. Remaining contingency reserve is sufficient to cover final interior commissioning.',
      commentAr:
        'وصلت نسبة استهلاك الموازنة إلى 95.8% نتيجة تسريع توريد مواد الواجهات. الاحتياطي المتبقي يغطي بالكامل أعمال التشغيل والاختبارات النهائية.',
      createdAt: '2026-10-31 11:15',
      progressSnapshot: 85,
    },
    {
      id: 'CMT-103',
      projectId: 'PRJ-02',
      authorNameEn: 'Sara Kamel',
      authorNameAr: 'سارة كامل',
      authorRoleEn: 'Cost Control Lead',
      authorRoleAr: 'رئيس قسم مراقبة التكاليف',
      commentEn:
        'Overhead crane steel girders and heavy concrete flooring passed third-party inspection. Cost variance remains within 2.5% of baseline estimate.',
      commentAr:
        'اجتازت كمر الأوناش العلوية والأرضيات الخرسانية عالية التحمل فحص الاستشاري. انحراف التكلفة لا يزال ضمن حدود 2.5% من المقايسة التقديرية.',
      createdAt: '2026-10-28 16:05',
      progressSnapshot: 72,
    },
    {
      id: 'CMT-104',
      projectId: 'PRJ-03',
      authorNameEn: 'Eng. Mahmoud Reda',
      authorNameAr: 'م. محمود رضا',
      authorRoleEn: 'Electromechanical Lead',
      authorRoleAr: 'مدير الأعمال الكهروميكانيكية',
      commentEn:
        'Medium-voltage switchgear and 11kV underground ring main cables delivered to site. Letter of Credit LC-9013 settled with Elsewedy Electric.',
      commentAr:
        'تم توريد لوحات الجهد المتوسط وكابلات الشبكة الحلقية الأرضية 11 ك.ف للموقع، وتسوية الاعتماد المستندي مع شركة السويدي للكابلات.',
      createdAt: '2026-10-30 09:45',
      progressSnapshot: 65,
    },
    {
      id: 'CMT-105',
      projectId: 'PRJ-04',
      authorNameEn: 'Eng. Karim Adel',
      authorNameAr: 'م. كريم عادل',
      authorRoleEn: 'Site Operations Manager',
      authorRoleAr: 'مدير العمليات الميدانية',
      commentEn:
        'High-bay racking foundations and fire-fighting sprinkler mains completed in Zone B. Scheduling next interim payment certificate next week.',
      commentAr:
        'اكتملت قواعد أرفف التخزين العالية وشبكة إطفاء الحريق الرئيسية في المنطقة (ب). جاري تجهيز المستخلص الدوري القادم الأسبوع المقبل.',
      createdAt: '2026-10-27 13:20',
      progressSnapshot: 58,
    },
    {
      id: 'CMT-106',
      projectId: 'PRJ-05',
      authorNameEn: 'Heba El-wan',
      authorNameAr: 'هبة علوان',
      authorRoleEn: 'Senior Financial Analyst',
      authorRoleAr: 'محلل مالي أول',
      commentEn:
        'Perimeter security gates and staff modular offices are at 40% completion. Reviewed subcontractor mobilization advances against bank guarantees.',
      commentAr:
        'وصلت بوابات الأمن المحيطية والمكاتب الجاهزة إلى نسبة إنجاز 40%. تمت مطابقة الدفعات المقدمة لمقاولي الباطن مع خطابات الضمان البنكية.',
      createdAt: '2026-10-25 10:10',
      progressSnapshot: 40,
    },
  ],
  dashboardLayouts: DEFAULT_DASHBOARD_LAYOUTS,
  lastSavedAt: new Date().toISOString(),
  autoSaveEnabled: true,
});

const loadInitialState = (): FinancialState => {
  const defaults = getDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const mergedProjects = Array.isArray(parsed.projects)
        ? parsed.projects.map((p: any, idx: number) => ({
            ...defaults.projects[idx],
            ...p,
            allocatedBudget:
              typeof p.allocatedBudget === 'number'
                ? p.allocatedBudget
                : defaults.projects[idx]?.allocatedBudget ?? Math.round(p.contractValue * 0.88),
            actualSpent:
              typeof p.actualSpent === 'number'
                ? p.actualSpent
                : defaults.projects[idx]?.actualSpent ?? p.executedValue,
          }))
        : defaults.projects;
      return {
        ...defaults,
        ...parsed,
        projects: mergedProjects,
        projectComments: Array.isArray(parsed.projectComments)
          ? parsed.projectComments
          : defaults.projectComments,
        dashboardLayouts:
          parsed.dashboardLayouts &&
          typeof parsed.dashboardLayouts === 'object' &&
          Array.isArray(parsed.dashboardLayouts.lg)
            ? parsed.dashboardLayouts
            : defaults.dashboardLayouts,
      };
    }
  } catch (e) {
    console.warn('Failed to load state from localStorage:', e);
  }
  return defaults;
};

const recalculateAgingPercentages = (items: { amount: number; percentage: number }[]) => {
  const total = items.reduce((acc, item) => acc + item.amount, 0);
  if (total <= 0) return;
  items.forEach((item) => {
    item.percentage = Number(((item.amount / total) * 100).toFixed(1));
  });
};

const financialSlice = createSlice({
  name: 'financial',
  initialState: loadInitialState(),
  reducers: {
    setActiveTab(state, action: PayloadAction<NavTabId>) {
      state.activeTab = action.payload;
      state.lastSavedAt = new Date().toISOString();
    },
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.theme = action.payload;
      state.lastSavedAt = new Date().toISOString();
    },
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      state.lastSavedAt = new Date().toISOString();
    },
    setLanguage(state, action: PayloadAction<Language>) {
      state.language = action.payload;
      state.lastSavedAt = new Date().toISOString();
    },
    toggleLanguage(state) {
      state.language = state.language === 'en' ? 'ar' : 'en';
      state.lastSavedAt = new Date().toISOString();
    },
    setFiscalYear(state, action: PayloadAction<'2026' | '2025' | '2024'>) {
      state.fiscalYear = action.payload;
      state.lastSavedAt = new Date().toISOString();
    },
    setSelectedProject(state, action: PayloadAction<string>) {
      state.selectedProject = action.payload;
      state.lastSavedAt = new Date().toISOString();
    },
    setPeriod(state, action: PayloadAction<'YTD' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>) {
      state.period = action.payload;
      state.lastSavedAt = new Date().toISOString();
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    createNewInvoice(
      state,
      action: PayloadAction<{
        projectId: string;
        clientEn: string;
        clientAr: string;
        amount: number;
        dueDate: string;
        type: 'receivable' | 'payable';
      }>
    ) {
      const { projectId, clientEn, clientAr, amount, dueDate, type } = action.payload;
      const project = state.projects.find((p) => p.id === projectId) || state.projects[0];
      const newInv: InvoiceRecord = {
        id: `INV-${Date.now()}`,
        invoiceNo: `EEC-INV-2026-${Math.floor(100 + Math.random() * 899)}`,
        projectId: project.id,
        projectNameEn: project.nameEn,
        projectNameAr: project.nameAr,
        clientEn,
        clientAr,
        amount,
        date: new Date().toISOString().split('T')[0],
        dueDate,
        status: 'approved',
        type,
      };
      state.invoicesList.unshift(newInv);
      state.totalInvoices += amount;
      project.invoicedValue += amount;

      if (type === 'receivable') {
        state.agingReceivables[0].amount += amount;
        recalculateAgingPercentages(state.agingReceivables);
      } else {
        state.agingPayables[0].amount += amount;
        recalculateAgingPercentages(state.agingPayables);
      }

      state.notifications.unshift({
        id: `NOTIF-${Date.now()}`,
        titleEn: `New Invoice ${newInv.invoiceNo} created for EGP ${(amount / 1e6).toFixed(1)}M`,
        titleAr: `تم إنشاء فاتورة جديدة ${newInv.invoiceNo} بقيمة ${(amount / 1e6).toFixed(1)} مليون ج.م`,
        timeEn: 'Just now',
        timeAr: 'الآن',
        read: false,
        type: 'success',
      });
      state.lastSavedAt = new Date().toISOString();
    },
    registerNewPayment(
      state,
      action: PayloadAction<{
        projectId: string;
        beneficiaryEn: string;
        beneficiaryAr: string;
        amount: number;
        category: 'Civil' | 'Architectural' | 'Mechanical' | 'Electrical' | 'Others';
        methodEn: string;
        methodAr: string;
      }>
    ) {
      const { projectId, beneficiaryEn, beneficiaryAr, amount, category, methodEn, methodAr } =
        action.payload;
      const project = state.projects.find((p) => p.id === projectId) || state.projects[0];
      const newPo: PaymentOrderRecord = {
        id: `PO-${Date.now()}`,
        orderNo: `PO-2026-${Math.floor(9020 + Math.random() * 900)}`,
        beneficiaryEn,
        beneficiaryAr,
        projectId: project.id,
        projectNameEn: project.nameEn,
        projectNameAr: project.nameAr,
        amount,
        date: new Date().toISOString().split('T')[0],
        methodEn,
        methodAr,
        status: 'executed',
        category,
      };
      state.paymentOrdersList.unshift(newPo);
      state.totalPayments += amount;
      project.paidValue += amount;
      project.actualSpent = (project.actualSpent || project.executedValue) + amount;

      // Update Dec outflow in millions
      const millionVal = Math.round(amount / 1000000);
      state.cashFlow[11].outflow += millionVal;

      // Update Budget actual
      const catItem = state.budgetVsActual.find(
        (c) => c.nameEn.toLowerCase() === category.toLowerCase()
      );
      if (catItem) {
        catItem.actual += millionVal;
      }

      const newUtilizationPct =
        project.allocatedBudget > 0
          ? ((project.actualSpent / project.allocatedBudget) * 100).toFixed(1)
          : '0.0';

      if (project.allocatedBudget > 0 && project.actualSpent / project.allocatedBudget > 0.9) {
        state.notifications.unshift({
          id: `NOTIF-ALERT-${Date.now()}`,
          titleEn: `ALERT: ${project.nameEn} exceeded 90% budget (${newUtilizationPct}% utilized)`,
          titleAr: `تنبيه عاجل: مشروع ${project.nameAr} تجاوز 90% من الموازنة (${newUtilizationPct}%)`,
          timeEn: 'Just now',
          timeAr: 'الآن',
          read: false,
          type: 'warning',
        });
      } else {
        state.notifications.unshift({
          id: `NOTIF-${Date.now()}`,
          titleEn: `Payment ${newPo.orderNo} registered (EGP ${(amount / 1e6).toFixed(1)}M)`,
          titleAr: `تم تسجيل دفعة سداد ${newPo.orderNo} بقيمة ${(amount / 1e6).toFixed(1)} مليون ج.م`,
          timeEn: 'Just now',
          timeAr: 'الآن',
          read: false,
          type: 'info',
        });
      }
      state.lastSavedAt = new Date().toISOString();
    },
    recordCashReceipt(
      state,
      action: PayloadAction<{
        projectId: string;
        amount: number;
        monthIndex: number;
      }>
    ) {
      const { projectId, amount, monthIndex } = action.payload;
      const project = state.projects.find((p) => p.id === projectId) || state.projects[0];
      const millionVal = Math.round(amount / 1000000);
      if (state.cashFlow[monthIndex]) {
        state.cashFlow[monthIndex].inflow += millionVal;
      }
      state.executedValue = Math.min(state.totalContracts, state.executedValue + amount);
      state.remainingValue = Math.max(0, state.totalContracts - state.executedValue);
      project.executedValue = Math.min(project.contractValue, project.executedValue + amount);
      project.completionPercentage = Math.min(
        100,
        Math.round((project.executedValue / project.contractValue) * 100)
      );

      state.notifications.unshift({
        id: `NOTIF-${Date.now()}`,
        titleEn: `Receipt of EGP ${(amount / 1e6).toFixed(1)}M recorded for ${project.nameEn}`,
        titleAr: `تم تحصيل مقبوضات بقيمة ${(amount / 1e6).toFixed(1)} مليون ج.م لمشروع ${project.nameAr}`,
        timeEn: 'Just now',
        timeAr: 'الآن',
        read: false,
        type: 'success',
      });
      state.lastSavedAt = new Date().toISOString();
    },
    updateBudgetAllocation(
      state,
      action: PayloadAction<{ categoryId: string; budget: number; actual: number }>
    ) {
      const item = state.budgetVsActual.find((b) => b.id === action.payload.categoryId);
      if (item) {
        item.budget = action.payload.budget;
        item.actual = action.payload.actual;
      }
      state.lastSavedAt = new Date().toISOString();
    },
    updateProjectCompletion(
      state,
      action: PayloadAction<{ projectId: string; percentage: number }>
    ) {
      const proj = state.projects.find((p) => p.id === action.payload.projectId);
      if (proj) {
        proj.completionPercentage = Math.max(0, Math.min(100, action.payload.percentage));
        proj.executedValue = Math.round((proj.contractValue * proj.completionPercentage) / 100);
        proj.actualSpent = proj.executedValue;
      }
      state.lastSavedAt = new Date().toISOString();
    },
    adjustProjectBudgetAndSpend(
      state,
      action: PayloadAction<{
        projectId: string;
        budgetDelta?: number;
        spendDelta?: number;
      }>
    ) {
      const proj = state.projects.find((p) => p.id === action.payload.projectId);
      if (proj) {
        const wasOver90 =
          proj.allocatedBudget > 0 && proj.actualSpent / proj.allocatedBudget > 0.9;
        if (typeof action.payload.budgetDelta === 'number') {
          proj.allocatedBudget = Math.max(10000000, proj.allocatedBudget + action.payload.budgetDelta);
        }
        if (typeof action.payload.spendDelta === 'number') {
          proj.actualSpent = Math.max(0, proj.actualSpent + action.payload.spendDelta);
          proj.executedValue = proj.actualSpent;
          proj.completionPercentage = Math.min(
            100,
            Math.round((proj.executedValue / proj.contractValue) * 100)
          );
        }
        const isNowOver90 =
          proj.allocatedBudget > 0 && proj.actualSpent / proj.allocatedBudget > 0.9;
        const pct = ((proj.actualSpent / proj.allocatedBudget) * 100).toFixed(1);

        if (!wasOver90 && isNowOver90) {
          state.notifications.unshift({
            id: `NOTIF-THRESHOLD-${Date.now()}`,
            titleEn: `THRESHOLD EXCEEDED: ${proj.nameEn} reached ${pct}% of allocated budget`,
            titleAr: `تجاوز الحد (90%): مشروع ${proj.nameAr} وصل إلى ${pct}% من الموازنة المخصصة`,
            timeEn: 'Just now',
            timeAr: 'الآن',
            read: false,
            type: 'warning',
          });
        }
      }
      state.lastSavedAt = new Date().toISOString();
    },
    markAllNotificationsRead(state) {
      state.notifications.forEach((n) => {
        n.read = true;
      });
      state.lastSavedAt = new Date().toISOString();
    },
    toggleNotificationRead(state, action: PayloadAction<string>) {
      const target = state.notifications.find((n) => n.id === action.payload);
      if (target) {
        target.read = !target.read;
      }
      state.lastSavedAt = new Date().toISOString();
    },
    deleteNotification(state, action: PayloadAction<string>) {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
      state.lastSavedAt = new Date().toISOString();
    },
    addProjectComment(
      state,
      action: PayloadAction<{
        projectId: string;
        authorNameEn: string;
        authorNameAr: string;
        authorRoleEn: string;
        authorRoleAr: string;
        commentEn: string;
        commentAr: string;
      }>
    ) {
      const {
        projectId,
        authorNameEn,
        authorNameAr,
        authorRoleEn,
        authorRoleAr,
        commentEn,
        commentAr,
      } = action.payload;
      const proj = state.projects.find((p) => p.id === projectId) || state.projects[0];
      const now = new Date();
      const formattedTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
        2,
        '0'
      )}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(
        2,
        '0'
      )}:${String(now.getMinutes()).padStart(2, '0')}`;

      const newComment: ProjectCommentItem = {
        id: `CMT-${Date.now()}`,
        projectId: proj.id,
        authorNameEn,
        authorNameAr,
        authorRoleEn,
        authorRoleAr,
        commentEn,
        commentAr,
        createdAt: formattedTime,
        progressSnapshot: proj.completionPercentage,
      };

      if (!Array.isArray(state.projectComments)) {
        state.projectComments = [];
      }
      state.projectComments.unshift(newComment);
      state.lastSavedAt = now.toISOString();
    },
    deleteProjectComment(state, action: PayloadAction<string>) {
      if (Array.isArray(state.projectComments)) {
        state.projectComments = state.projectComments.filter((c) => c.id !== action.payload);
      }
      state.lastSavedAt = new Date().toISOString();
    },
    updateDashboardLayouts(
      state,
      action: PayloadAction<Record<string, DashboardGridItemLayout[]>>
    ) {
      state.dashboardLayouts = action.payload;
      state.lastSavedAt = new Date().toISOString();
    },
    resetDashboardLayouts(state) {
      state.dashboardLayouts = DEFAULT_DASHBOARD_LAYOUTS;
      state.lastSavedAt = new Date().toISOString();
    },
    resetDefaultData() {
      const fresh = getDefaultState();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      } catch (e) {
        console.warn(e);
      }
      return fresh;
    },
  },
});

export const {
  setActiveTab,
  setTheme,
  toggleTheme,
  setLanguage,
  toggleLanguage,
  setFiscalYear,
  setSelectedProject,
  setPeriod,
  setSearchQuery,
  createNewInvoice,
  registerNewPayment,
  recordCashReceipt,
  updateBudgetAllocation,
  updateProjectCompletion,
  adjustProjectBudgetAndSpend,
  markAllNotificationsRead,
  toggleNotificationRead,
  deleteNotification,
  addProjectComment,
  deleteProjectComment,
  updateDashboardLayouts,
  resetDashboardLayouts,
  resetDefaultData,
} = financialSlice.actions;

export default financialSlice.reducer;
