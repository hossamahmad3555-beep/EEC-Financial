import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Building2,
  FileBarChart,
  Compass,
  Zap,
  Settings,
  ArrowRight,
  ArrowLeft,
  CornerDownLeft,
  Printer,
  FileDown,
  Sun,
  Moon,
  Globe,
  RotateCcw,
  CheckCheck,
  Download,
  LayoutGrid,
  FileText,
  Receipt,
  CreditCard,
  Wallet,
  Calculator,
  PieChart,
  Landmark,
  Sliders,
  Calendar,
  Clock,
  X,
  Command,
  AlertTriangle,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/store';
import {
  setActiveTab,
  setSelectedProject,
  setFiscalYear,
  setPeriod,
  toggleTheme,
  toggleLanguage,
  resetDashboardLayouts,
  markAllNotificationsRead,
  resetDefaultData,
  STORAGE_KEY,
} from '../store/financialSlice';
import { NavTabId } from '../types/financial';
import { translations } from '../i18n/translations';
import { exportFinancialDashboardToCsv } from '../utils/exportCsv';
import { exportDashboardToPdf } from '../utils/exportPdf';
import { QuickActionType } from './QuickActionModals';

const formatCompactEgp = (val: number): string => {
  if (val >= 1_000_000) {
    return `${(val / 1_000_000).toFixed(1)}M`;
  }
  if (val >= 1_000) {
    return `${(val / 1_000).toFixed(0)}K`;
  }
  return val.toLocaleString();
};

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuickAction: (action: QuickActionType) => void;
  onTriggerPrintView: () => void;
}

type CategoryFilter = 'all' | 'projects' | 'reports' | 'navigation' | 'actions' | 'settings';

interface CommandItem {
  id: string;
  category: Exclude<CategoryFilter, 'all'>;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  keywords: string;
  icon: React.ReactNode;
  badgeText?: string;
  badgeTone?: 'purple' | 'amber' | 'emerald' | 'rose';
  isActive?: boolean;
  onSelect: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onOpenQuickAction,
  onTriggerPrintView,
}) => {
  const dispatch = useAppDispatch();
  const financialState = useAppSelector((state) => state.financial);
  const {
    language,
    theme,
    activeTab,
    selectedProject,
    fiscalYear,
    period,
    projects,
    notifications,
  } = financialState;

  const t = translations[language];
  const isAr = language === 'ar';

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Reset search state and focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setCategoryFilter('all');
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Build comprehensive searchable command list across Projects, Reports, Navigation, Quick Actions, and Settings
  const allCommands = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    // 1. PROJECTS (All Projects + Individual Engineering Sites)
    items.push({
      id: 'prj-all',
      category: 'projects',
      titleEn: 'All Engineering Projects (Consolidated Portfolio)',
      titleAr: 'جميع المشروعات الهندسية (المحفظة المجمعة)',
      subtitleEn: `View aggregated financial KPIs across all ${projects.length} active sites`,
      subtitleAr: `استعراض المؤشرات المالية المجمعة لجميع المواقع النشطة (${projects.length} مشروعات)`,
      keywords: 'all projects portfolio consolidated جميع المشروعات المحفظة الكل',
      icon: <Building2 className="w-4 h-4" />,
      badgeText: 'ALL',
      badgeTone: 'purple',
      isActive: selectedProject === 'ALL' && activeTab === 'dashboard',
      onSelect: () => {
        dispatch(setSelectedProject('ALL'));
        dispatch(setActiveTab('dashboard'));
        onClose();
      },
    });

    projects.forEach((p) => {
      const utilizationPct =
        p.allocatedBudget > 0 ? Math.round((p.actualSpent / p.allocatedBudget) * 100) : 0;
      const isOver90 = utilizationPct >= 90;

      items.push({
        id: `prj-${p.id}`,
        category: 'projects',
        titleEn: `${p.id} — ${p.nameEn}`,
        titleAr: `${p.id} — ${p.nameAr}`,
        subtitleEn: `Manager: ${p.managerEn} · Progress: ${p.completionPercentage}% · Budget: ${formatCompactEgp(
          p.actualSpent
        )} / ${formatCompactEgp(p.allocatedBudget)} EGP (${utilizationPct}%)`,
        subtitleAr: `المدير: ${p.managerAr} · الإنجاز: ${p.completionPercentage}% · الاستهلاك: ${utilizationPct}% من الموازنة`,
        keywords: `${p.id} ${p.nameEn} ${p.nameAr} ${p.managerEn} ${p.managerAr} project site مشروع`,
        icon: isOver90 ? (
          <AlertTriangle className="w-4 h-4 text-rose-500" />
        ) : (
          <Building2 className="w-4 h-4" />
        ),
        badgeText: isOver90 ? `${utilizationPct}% (!)` : `${p.completionPercentage}%`,
        badgeTone: isOver90 ? 'rose' : 'emerald',
        isActive: selectedProject === p.id,
        onSelect: () => {
          dispatch(setSelectedProject(p.id));
          dispatch(setActiveTab('dashboard'));
          onClose();
        },
      });
    });

    // 2. REPORTS & FINANCIAL EXPORTS / FILTERS
    items.push(
      {
        id: 'rep-module',
        category: 'reports',
        titleEn: 'Financial Statements & Executive Reports Center',
        titleAr: 'مركز القوائم والتقارير المالية التنفيذية',
        subtitleEn: 'Open income statement, balance sheet, cash flow & aging reports',
        subtitleAr: 'فتح قائمة الدخل والمركز المالي والتدفقات النقدية وأعمار الديون',
        keywords: 'reports financial statements income balance sheet التقارير المالية القوائم',
        icon: <FileBarChart className="w-4 h-4" />,
        badgeText: isAr ? 'تقارير' : 'Reports',
        badgeTone: 'purple',
        isActive: activeTab === 'reports',
        onSelect: () => {
          dispatch(setActiveTab('reports'));
          onClose();
        },
      },
      {
        id: 'rep-modal',
        category: 'reports',
        titleEn: 'Generate Executive Financial Summary Report',
        titleAr: 'إصدار التقرير المالي التنفيذي المختصر',
        subtitleEn: 'Open interactive executive financial summary modal with variance analysis',
        subtitleAr: 'عرض ملخص الموقف المالي التنفيذي وتحليل الانحرافات',
        keywords: 'executive report modal summary ملخص تقرير مالي تنفيذي',
        icon: <FileText className="w-4 h-4" />,
        badgeText: isAr ? 'فوري' : 'Modal',
        badgeTone: 'amber',
        onSelect: () => {
          onOpenQuickAction('financialReport');
          onClose();
        },
      },
      {
        id: 'rep-print',
        category: 'reports',
        titleEn: 'Print View — Printer-Friendly Financial Report (window.print)',
        titleAr: 'وضع الطباعة — طباعة التقرير المالي الرسمي (window.print)',
        subtitleEn: 'Format current dashboard into clean paper layout and trigger print dialog',
        subtitleAr: 'تنسيق لوحة المعلومات للطباعة الورقية وإخفاء القوائم الجانبية',
        keywords: 'print view pdf paper report طباعة تقرير ورقي',
        icon: <Printer className="w-4 h-4" />,
        badgeText: 'Print',
        badgeTone: 'purple',
        onSelect: () => {
          onClose();
          onTriggerPrintView();
        },
      },
      {
        id: 'rep-pdf',
        category: 'reports',
        titleEn: 'Export Dashboard as Professional PDF Report (jsPDF + html2canvas)',
        titleAr: 'تصدير لوحة المعلومات كتقرير PDF احترافي (jsPDF + html2canvas)',
        subtitleEn: 'Capture high-resolution multi-page A4 landscape PDF with corporate header',
        subtitleAr: 'تحميل تقرير PDF متعدد الصفحات بجودة عالية مع ترويسة الشركة الرسمية',
        keywords: 'export pdf download report jspdf html2canvas تصدير تقرير بي دي اف تحميل',
        icon: <FileText className="w-4 h-4 text-amber-500" />,
        badgeText: 'PDF',
        badgeTone: 'amber',
        onSelect: () => {
          onClose();
          setTimeout(() => {
            exportDashboardToPdf(financialState).catch((err) =>
              console.error('PDF export failed:', err)
            );
          }, 120);
        },
      },
      {
        id: 'rep-csv',
        category: 'reports',
        titleEn: 'Export Financial Dashboard Data to CSV',
        titleAr: 'تصدير بيانات لوحة المعلومات المالية إلى ملف CSV',
        subtitleEn: 'Download spreadsheet with KPIs, projects, cash flow & budget allocations',
        subtitleAr: 'تحميل ملف جدول بيانات يحتوي على المشروعات والتدفقات والموازنات',
        keywords: 'export csv excel download spreadsheet تصدير تحميل اكسيل',
        icon: <FileDown className="w-4 h-4" />,
        badgeText: 'CSV',
        badgeTone: 'emerald',
        onSelect: () => {
          exportFinancialDashboardToCsv(financialState);
          onClose();
        },
      }
    );

    // Fiscal Year Quick Filters under Reports
    (['2026', '2025', '2024'] as const).forEach((yr) => {
      items.push({
        id: `rep-fy-${yr}`,
        category: 'reports',
        titleEn: `Switch Fiscal Year Report Filter to FY ${yr}`,
        titleAr: `تغيير فلتر السنة المالية للتقارير إلى ${yr}`,
        subtitleEn: `Recalculate dashboard telemetry and reports for Fiscal Year ${yr}`,
        subtitleAr: `تحديث كافة المؤشرات والرسوم البيانية للسنة المالية ${yr}`,
        keywords: `fiscal year ${yr} filter سنة مالية فلتر`,
        icon: <Calendar className="w-4 h-4" />,
        badgeText: `FY ${yr}`,
        badgeTone: 'purple',
        isActive: fiscalYear === yr,
        onSelect: () => {
          dispatch(setFiscalYear(yr));
          onClose();
        },
      });
    });

    // Period Quick Filters under Reports
    const periods: { id: 'YTD' | 'Q1' | 'Q2' | 'Q3' | 'Q4'; en: string; ar: string }[] = [
      { id: 'YTD', en: 'Year to Date (YTD)', ar: 'منذ بداية العام (YTD)' },
      { id: 'Q1', en: 'Q1 (Jan - Mar)', ar: 'الربع الأول (يناير - مارس)' },
      { id: 'Q2', en: 'Q2 (Apr - Jun)', ar: 'الربع الثاني (أبريل - يونيو)' },
      { id: 'Q3', en: 'Q3 (Jul - Sep)', ar: 'الربع الثالث (يوليو - سبتمبر)' },
      { id: 'Q4', en: 'Q4 (Oct - Dec)', ar: 'الربع الرابع (أكتوبر - ديسمبر)' },
    ];
    periods.forEach((per) => {
      items.push({
        id: `rep-period-${per.id}`,
        category: 'reports',
        titleEn: `Filter Reporting Period: ${per.en}`,
        titleAr: `تصفية الفترة المالية: ${per.ar}`,
        subtitleEn: `Adjust financial KPIs and charts to ${per.en}`,
        subtitleAr: `ضبط المؤشرات المالية والتدفقات النقدية لفترة ${per.ar}`,
        keywords: `period quarter ${per.id} ${per.en} ${per.ar} فترة ربع`,
        icon: <Clock className="w-4 h-4" />,
        badgeText: per.id,
        badgeTone: 'amber',
        isActive: period === per.id,
        onSelect: () => {
          dispatch(setPeriod(per.id));
          onClose();
        },
      });
    });

    // 3. NAVIGATION MODULES (All 11 Sidebar Tabs)
    const navModules: {
      id: NavTabId;
      titleEn: string;
      titleAr: string;
      subEn: string;
      subAr: string;
      icon: React.ReactNode;
      keywords: string;
    }[] = [
      {
        id: 'dashboard',
        titleEn: 'Financial Dashboard (Main Overview)',
        titleAr: 'لوحة التحكم والمعلومات المالية الرئيسية',
        subEn: 'Executive KPIs, cash flow charts, project milestones & live budget alerts',
        subAr: 'المؤشرات التنفيذية والتدفقات النقدية ومراحل المشروعات وتنبيهات الموازنة',
        icon: <LayoutGrid className="w-4 h-4" />,
        keywords: 'dashboard home overview لوحة التحكم الرئيسية',
      },
      {
        id: 'contracts',
        titleEn: 'Contracts Registry & Variations',
        titleAr: 'إدارة العقود وأوامر التغيير',
        subEn: 'Inspect client engineering contracts, retention rates & execution values',
        subAr: 'استعراض عقود المقاولات ونسب الاستقطاع وقيم الأعمال المنفذة',
        icon: <FileText className="w-4 h-4" />,
        keywords: 'contracts agreements retention العقود المقاولات',
      },
      {
        id: 'invoices',
        titleEn: 'Invoices & Progress Certificates (IPCs)',
        titleAr: 'الفواتير والمستخلصات الهندسية الجارية',
        subEn: 'Manage client billing, certified IPCs, VAT & collection status',
        subAr: 'إدارة فواتير العملاء والمستخلصات المعتمدة وحالات التحصيل',
        icon: <Receipt className="w-4 h-4" />,
        keywords: 'invoices ipc billing الفواتير المستخلصات',
      },
      {
        id: 'payment_orders',
        titleEn: 'Payment Orders & Treasury Authorization',
        titleAr: 'أوامر الدفع واعتمادات الخزانة',
        subEn: 'Approve and track supplier & subcontractor disbursement orders',
        subAr: 'اعتماد ومتابعة أوامر الصرف للموردينومقاولي الباطن',
        icon: <CreditCard className="w-4 h-4" />,
        keywords: 'payment orders disbursement treasury أوامر الدفع الصرف',
      },
      {
        id: 'receivables',
        titleEn: 'Accounts Receivable (Client Aging)',
        titleAr: 'المستحقات والذمم المدينة (أعمار ديون العملاء)',
        subEn: 'Track client collections, retention releases & overdue receivables',
        subAr: 'متابعة تحصيلات العملاء والإفراج عن المحتجزات والمديونيات',
        icon: <Wallet className="w-4 h-4" />,
        keywords: 'receivables collections aging المستحقات الذمم المدينة التحصيلات',
      },
      {
        id: 'payables',
        titleEn: 'Accounts Payable (Vendor & Subcontractor Aging)',
        titleAr: 'المدفوعات والذمم الدائنة (مستحقات الموردين)',
        subEn: 'Monitor supplier balances, due dates & scheduled settlements',
        subAr: 'مراقبة أرصدة الموردين ومقاولي الباطن وتواريخ الاستحقاق',
        icon: <CreditCard className="w-4 h-4" />,
        keywords: 'payables vendors suppliers المدفوعات الذمم الدائنة الموردين',
      },
      {
        id: 'cost_control',
        titleEn: 'Cost Control & Live Budget Threshold Monitor',
        titleAr: 'مراقبة التكاليف ومراقب تجاوز الموازنة (90%)',
        subEn: 'Analyze site burn rates, CPI index &projects exceeding 90% budget',
        subAr: 'تحليل معدلات الصرف ومؤشر أداء التكلفة وتنبيهات تجاوز 90%',
        icon: <Calculator className="w-4 h-4" />,
        keywords: 'cost control burn rate cpi مراقبة التكاليف الموازنة',
      },
      {
        id: 'budget',
        titleEn: 'Budget Planning & Category Allocations',
        titleAr: 'الموازنة التقديرية وتوزيع المخصصات',
        subEn: 'Manage planned vs actual allocations across materials, labor & equipment',
        subAr: 'إدارة المخصصات التقديرية مقابل الفعلي للمواد والعمالة والمعدات',
        icon: <PieChart className="w-4 h-4" />,
        keywords: 'budget planning allocations الموازنة التقديرية المخصصات',
      },
      {
        id: 'accounting',
        titleEn: 'General Accounting & Double-Entry Journal',
        titleAr: 'المحاسبة العامة وقيود اليومية وميزان المراجعة',
        subEn: 'Review chart of accounts, trial balance & general ledger postings',
        subAr: 'مراجعة دليل الحسابات وميزان المراجعة وقيود اليومية العامة',
        icon: <Landmark className="w-4 h-4" />,
        keywords: 'accounting ledger journal trial balance المحاسبة العامة قيود اليومية',
      },
      {
        id: 'settings',
        titleEn: 'System Settings & ERP Governance',
        titleAr: 'إعدادات النظام المالي والصلاحيات والحوكمة',
        subEn: 'Configure fiscal parameters, notifications, language, theme & backups',
        subAr: 'ضبط إعدادات السنة المالية والإشعارات واللغة والمظهر والنسخ الاحتياطي',
        icon: <Sliders className="w-4 h-4" />,
        keywords: 'settings preferences configuration الإعدادات الضبط',
      },
    ];

    navModules.forEach((mod) => {
      items.push({
        id: `nav-${mod.id}`,
        category: 'navigation',
        titleEn: mod.titleEn,
        titleAr: mod.titleAr,
        subtitleEn: mod.subEn,
        subtitleAr: mod.subAr,
        keywords: mod.keywords,
        icon: mod.icon,
        badgeText: isAr ? 'قسم' : 'Module',
        badgeTone: 'purple',
        isActive: activeTab === mod.id,
        onSelect: () => {
          dispatch(setActiveTab(mod.id));
          onClose();
        },
      });
    });

    // 4. QUICK FINANCIAL ACTIONS (Modals)
    const quickActions: {
      id: Exclude<QuickActionType, null | 'portalInfo' | 'financialReport'>;
      titleEn: string;
      titleAr: string;
      subEn: string;
      subAr: string;
      keywords: string;
    }[] = [
      {
        id: 'createInvoice',
        titleEn: 'Create New Client Invoice / IPC Certificate',
        titleAr: 'إنشاء فاتورة جديدة / مستخلص أعمال جاري',
        subEn: 'Issue a new progress billing invoice and update project executed value',
        subAr: 'إصدار فاتورة مستخلص جديدة وتحديث قيمة الأعمال المنفذة للمشروع',
        keywords: 'create invoice new billing فاتورة جديدة مستخلص',
      },
      {
        id: 'registerPayment',
        titleEn: 'Register Supplier / Subcontractor Payment',
        titleAr: 'تسجيل دفعة سداد لمورد أو مقاول باطن',
        subEn: 'Record an outgoing treasury disbursement and update cash outflow',
        subAr: 'تسجيل دفعة صادرة من الخزانة وتحديث التدفقات النقدية الخارجة',
        keywords: 'register payment outflow disbursement تسجيل دفعة سداد صرف',
      },
      {
        id: 'recordReceipt',
        titleEn: 'Record Client Cash Receipt / Collection',
        titleAr: 'تسجيل مقبوضات نقدية / تحصيل مستخلص عميل',
        subEn: 'Log incoming client collection and boost cash inflow',
        subAr: 'إثبات تحصيل نقدي أو بنكي من العميل وزيادة التدفقات الداخلة',
        keywords: 'record receipt collection inflow تسجيل مقبوضات تحصيل',
      },
      {
        id: 'costEntry',
        titleEn: 'Log Project Site Cost Entry',
        titleAr: 'إدخال تكلفة موقع مشروع جديدة',
        subEn: 'Allocate direct site expenditure to materials, labor, or subcontractors',
        subAr: 'تحميل مصروفات مباشرة على المشروع (مواد، عمالة، مقاولي باطن)',
        keywords: 'cost entry expense site spend إدخال تكلفة مصروفات',
      },
      {
        id: 'budgetPlanning',
        titleEn: 'Adjust Project & Category Budget Allocation',
        titleAr: 'تخطيط وتعديل الموازنة المخصصة للمشروعات',
        subEn: 'Top-up or reallocate planned budget across categories and projects',
        subAr: 'تعزيز أو إعادة توزيع الموازنة التقديرية للمشروعات وبنود الإنفاق',
        keywords: 'budget planning allocation top-up تخطيط الموازنة تعزيز',
      },
    ];

    quickActions.forEach((act) => {
      items.push({
        id: `act-${act.id}`,
        category: 'actions',
        titleEn: act.titleEn,
        titleAr: act.titleAr,
        subtitleEn: act.subEn,
        subtitleAr: act.subAr,
        keywords: act.keywords,
        icon: <Zap className="w-4 h-4 text-amber-500" />,
        badgeText: isAr ? 'إجراء سريع' : 'Quick Action',
        badgeTone: 'amber',
        onSelect: () => {
          onOpenQuickAction(act.id);
          onClose();
        },
      });
    });

    // 5. SYSTEM SETTINGS & WORKSPACE CONTROLS
    items.push(
      {
        id: 'set-theme',
        category: 'settings',
        titleEn:
          theme === 'light'
            ? 'Switch to Dark Mode (Royal Night Theme)'
            : 'Switch to Light Mode (Corporate Lavender Theme)',
        titleAr:
          theme === 'light'
            ? 'التبديل إلى الوضع الليلي الداكن (Dark Mode)'
            : 'التبديل إلى الوضع النهاري الفاتح (Light Mode)',
        subtitleEn: `Current theme: ${theme === 'light' ? 'Light Mode' : 'Dark Mode'}`,
        subtitleAr: `المظهر الحالي: ${theme === 'light' ? 'الوضع الفاتح' : 'الوضع الداكن'}`,
        keywords: 'theme dark light mode appearance المظهر الوضع الليلي النهاري',
        icon:
          theme === 'light' ? (
            <Moon className="w-4 h-4 text-purple-600" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          ),
        badgeText: theme === 'light' ? 'Dark' : 'Light',
        badgeTone: 'purple',
        onSelect: () => {
          dispatch(toggleTheme());
          onClose();
        },
      },
      {
        id: 'set-lang',
        category: 'settings',
        titleEn:
          language === 'en'
            ? 'Switch Interface Language to Arabic (العربية - RTL)'
            : 'Switch Interface Language to English (LTR)',
        titleAr:
          language === 'ar'
            ? 'تغيير لغة الواجهة إلى الإنجليزية (English - LTR)'
            : 'تغيير لغة الواجهة إلى العربية (RTL)',
        subtitleEn: 'Toggle bilingual layout direction (RTL / LTR) and translations',
        subtitleAr: 'التبديل الفوري بين اللغة العربية والإنجليزية واتجاه الواجهة',
        keywords: 'language arabic english rtl ltr اللغة عربي انجليزي',
        icon: <Globe className="w-4 h-4" />,
        badgeText: language === 'en' ? 'عربي' : 'EN',
        badgeTone: 'amber',
        onSelect: () => {
          dispatch(toggleLanguage());
          onClose();
        },
      },
      {
        id: 'set-reset-grid',
        category: 'settings',
        titleEn: 'Reset Dashboard Drag-and-Drop Grid Layout',
        titleAr: 'إعادة ضبط تخطيط شبكة لوحة التحكم (Drag & Drop)',
        subtitleEn: 'Restore all KPI cards, charts & milestone widgets to default positions',
        subtitleAr: 'استعادة المواضع والأحجام الافتراضية لجميع بطاقات ورسوم لوحة التحكم',
        keywords: 'reset grid layout drag drop widgets إعادة ضبط التخطيط الشبكة',
        icon: <LayoutGrid className="w-4 h-4" />,
        badgeText: isAr ? 'تخطيط' : 'Grid',
        badgeTone: 'purple',
        onSelect: () => {
          dispatch(resetDashboardLayouts());
          dispatch(setActiveTab('dashboard'));
          onClose();
        },
      },
      {
        id: 'set-mark-read',
        category: 'settings',
        titleEn: `Mark All Notifications as Read (${unreadNotificationsCount} Unread)`,
        titleAr: `تحديد جميع الإشعارات كمقروءة (${unreadNotificationsCount} غير مقروء)`,
        subtitleEn: 'Clear unread badge counter on the header notification bell',
        subtitleAr: 'مسح شارة التنبيهات غير المقروءة في جرس الإشعارات العلوي',
        keywords: 'notifications mark all read alerts إشعارات مقروء تنبيهات',
        icon: <CheckCheck className="w-4 h-4" />,
        badgeText: `${unreadNotificationsCount}`,
        badgeTone: unreadNotificationsCount > 0 ? 'emerald' : 'purple',
        onSelect: () => {
          dispatch(markAllNotificationsRead());
          onClose();
        },
      },
      {
        id: 'set-backup-json',
        category: 'settings',
        titleEn: 'Export Full System State Backup (JSON)',
        titleAr: 'تصدير نسخة احتياطية كاملة لبيانات النظام (JSON)',
        subtitleEn: 'Download local Redux persistence snapshot as a portable JSON file',
        subtitleAr: 'تحميل نسخة احتياطية لكافة الفواتير والمشروعات والموازنات بصيغة JSON',
        keywords: 'backup json export state snapshot نسخة احتياطية تصدير',
        icon: <Download className="w-4 h-4" />,
        badgeText: 'JSON',
        badgeTone: 'emerald',
        onSelect: () => {
          const stateStr =
            localStorage.getItem(STORAGE_KEY) || JSON.stringify(financialState, null, 2);
          const blob = new Blob([stateStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `EEC_Financial_Backup_${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          URL.revokeObjectURL(url);
          onClose();
        },
      },
      {
        id: 'set-reset-data',
        category: 'settings',
        titleEn: 'Reset All Financial Data to Factory Defaults',
        titleAr: 'استعادة البيانات المالية الافتراضية للمصنع',
        subtitleEn: 'Restore initial EEC engineering projects, cash flows & sample comments',
        subtitleAr: 'إعادة تعيين كافة المشروعات والأرصدة والملاحظات إلى القيم الافتراضية',
        keywords: 'reset factory default data restore استعادة البيانات الافتراضية',
        icon: <RotateCcw className="w-4 h-4 text-rose-500" />,
        badgeText: isAr ? 'إعادة ضبط' : 'Reset',
        badgeTone: 'rose',
        onSelect: () => {
          dispatch(resetDefaultData());
          onClose();
        },
      }
    );

    return items;
  }, [
    projects,
    selectedProject,
    activeTab,
    isAr,
    financialState,
    fiscalYear,
    period,
    theme,
    language,
    unreadNotificationsCount,
    dispatch,
    onClose,
    onOpenQuickAction,
    onTriggerPrintView,
  ]);

  // Filter items by selected category tab and search query
  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allCommands.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      const haystack = `${item.titleEn} ${item.titleAr} ${item.subtitleEn} ${item.subtitleAr} ${item.keywords}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [allCommands, categoryFilter, query]);

  // Keep selectedIndex within bounds when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, categoryFilter]);

  // Scroll highlighted item into view smoothly
  useEffect(() => {
    const el = itemRefs.current[selectedIndex];
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Keyboard navigation inside the modal (ArrowDown, ArrowUp, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredCommands.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredCommands.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredCommands[selectedIndex];
      if (target) {
        target.onSelect();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const categoryTabs: {
    id: CategoryFilter;
    label: string;
    icon: React.ReactNode;
    count: number;
  }[] = useMemo(() => {
    const countByCat = (cat: Exclude<CategoryFilter, 'all'>) =>
      allCommands.filter((item) => {
        if (item.category !== cat) return false;
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return `${item.titleEn} ${item.titleAr} ${item.subtitleEn} ${item.subtitleAr} ${item.keywords}`
          .toLowerCase()
          .includes(q);
      }).length;

    const totalMatching = allCommands.filter((item) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return `${item.titleEn} ${item.titleAr} ${item.subtitleEn} ${item.subtitleAr} ${item.keywords}`
        .toLowerCase()
        .includes(q);
    }).length;

    return [
      {
        id: 'all',
        label: t.commandPalette.catAll,
        icon: <Command className="w-3.5 h-3.5" />,
        count: totalMatching,
      },
      {
        id: 'projects',
        label: t.commandPalette.catProjects,
        icon: <Building2 className="w-3.5 h-3.5" />,
        count: countByCat('projects'),
      },
      {
        id: 'reports',
        label: t.commandPalette.catReports,
        icon: <FileBarChart className="w-3.5 h-3.5" />,
        count: countByCat('reports'),
      },
      {
        id: 'navigation',
        label: t.commandPalette.catNavigation,
        icon: <Compass className="w-3.5 h-3.5" />,
        count: countByCat('navigation'),
      },
      {
        id: 'actions',
        label: t.commandPalette.catActions,
        icon: <Zap className="w-3.5 h-3.5" />,
        count: countByCat('actions'),
      },
      {
        id: 'settings',
        label: t.commandPalette.catSettings,
        icon: <Settings className="w-3.5 h-3.5" />,
        count: countByCat('settings'),
      },
    ];
  }, [allCommands, query, t.commandPalette]);

  const getCategoryLabel = (cat: Exclude<CategoryFilter, 'all'>) => {
    switch (cat) {
      case 'projects':
        return t.commandPalette.catProjects;
      case 'reports':
        return t.commandPalette.catReports;
      case 'navigation':
        return t.commandPalette.catNavigation;
      case 'actions':
        return t.commandPalette.catActions;
      case 'settings':
        return t.commandPalette.catSettings;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-16 px-3 sm:px-4 no-print print:hidden"
          onKeyDown={handleKeyDown}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#140a29]/70 dark:bg-black/75 backdrop-blur-xs"
          />

          {/* Command Palette Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-label="Command Palette"
            className="relative z-10 w-full max-w-2xl rounded-2xl bg-gradient-to-b from-white via-[#fcfaff] to-[#f4effc] dark:from-[#1f153a] dark:via-[#191130] dark:to-[#130c24] border border-purple-200/90 dark:border-purple-700/70 shadow-[0_25px_70px_rgba(25,12,56,0.45)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* Top Search Bar */}
            <div className="relative flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-[#281652] via-[#3b256e] to-[#4c2896] dark:from-[#180d33] dark:via-[#25164a] dark:to-[#321d63] text-white border-b border-purple-400/25">
              <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
                <Search className="w-4 h-4 text-amber-300" />
              </div>

              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.commandPalette.placeholder}
                className="w-full bg-transparent text-white placeholder-purple-200/70 text-sm sm:text-[15px] font-semibold focus:outline-none"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  title={t.actions.clearSearch}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-purple-100 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <div className="hidden sm:flex items-center gap-1 shrink-0">
                <kbd className="px-2 py-1 rounded-md bg-white/15 border border-white/25 text-[10px] font-mono font-bold text-amber-200 tracking-wider">
                  ESC
                </kbd>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="px-3.5 py-2.5 bg-[#f4effc] dark:bg-[#160e2c] border-b border-purple-200/70 dark:border-purple-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {categoryTabs.map((tab) => {
                const active = categoryFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setCategoryFilter(tab.id);
                      inputRef.current?.focus();
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#3b256e] dark:bg-purple-600 text-white shadow-xs'
                        : 'bg-white/80 dark:bg-[#1f153a] text-slate-700 dark:text-purple-200/85 hover:bg-purple-100/80 dark:hover:bg-purple-900/40 border border-purple-200/60 dark:border-purple-800/50'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono tabular-nums ${
                        active
                          ? 'bg-white/20 text-amber-200'
                          : 'bg-purple-100 dark:bg-purple-900/60 text-[#4c2896] dark:text-purple-300'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Results List */}
            <div className="max-h-[380px] overflow-y-auto overscroll-contain p-2.5 space-y-1">
              {filteredCommands.length === 0 ? (
                <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-[#4c2896] dark:text-purple-300 flex items-center justify-center shadow-inner">
                    <Search className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-extrabold text-slate-800 dark:text-white">
                    {t.commandPalette.noResults}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-purple-300/70 max-w-md">
                    {t.commandPalette.tryAnother}
                  </p>
                </div>
              ) : (
                filteredCommands.map((item, idx) => {
                  const isHighlighted = idx === selectedIndex;
                  const prevCategory = idx > 0 ? filteredCommands[idx - 1].category : null;
                  const showCategoryHeader =
                    categoryFilter === 'all' && item.category !== prevCategory;

                  return (
                    <React.Fragment key={item.id}>
                      {showCategoryHeader && (
                        <div className="px-3 pt-2.5 pb-1 text-[10.5px] font-extrabold uppercase tracking-wider text-[#4c2896] dark:text-amber-300/90 flex items-center justify-between">
                          <span>{getCategoryLabel(item.category)}</span>
                        </div>
                      )}

                      <button
                        ref={(el) => {
                          itemRefs.current[idx] = el;
                        }}
                        type="button"
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={() => item.onSelect()}
                        className={`w-full text-start p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl transition-all flex items-center justify-between gap-3 cursor-pointer border ${
                          isHighlighted
                            ? 'bg-gradient-to-r from-[#3b256e] to-[#523396] dark:from-purple-700 dark:to-purple-900 text-white border-purple-400/50 shadow-md'
                            : 'bg-white/75 dark:bg-[#1a1131]/70 hover:bg-purple-50/90 dark:hover:bg-purple-900/30 text-slate-800 dark:text-slate-100 border-purple-100/80 dark:border-purple-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                              isHighlighted
                                ? 'bg-white/15 text-amber-300 border-white/25'
                                : 'bg-purple-100/80 dark:bg-purple-950/80 text-[#3b256e] dark:text-purple-300 border-purple-200/70 dark:border-purple-800/60'
                            }`}
                          >
                            {item.icon}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs sm:text-[13.5px] font-extrabold truncate">
                                {isAr ? item.titleAr : item.titleEn}
                              </span>
                              {item.isActive && (
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                                    isHighlighted
                                      ? 'bg-amber-400 text-slate-950'
                                      : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60'
                                  }`}
                                >
                                  {t.commandPalette.activeBadge}
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-[11px] truncate mt-0.5 ${
                                isHighlighted
                                  ? 'text-purple-100/90'
                                  : 'text-slate-500 dark:text-purple-300/70'
                              }`}
                            >
                              {isAr ? item.subtitleAr : item.subtitleEn}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.badgeText && (
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10.5px] font-mono font-bold tabular-nums ${
                                isHighlighted
                                  ? 'bg-white/20 text-white'
                                  : item.badgeTone === 'rose'
                                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                                  : item.badgeTone === 'emerald'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                                  : item.badgeTone === 'amber'
                                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                                  : 'bg-purple-100 dark:bg-purple-900/70 text-[#3b256e] dark:text-purple-200'
                              }`}
                            >
                              {item.badgeText}
                            </span>
                          )}

                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-transform ${
                              isHighlighted
                                ? 'bg-amber-400 text-slate-950 translate-x-0'
                                : 'text-slate-400 dark:text-purple-400/60'
                            }`}
                          >
                            {isHighlighted ? (
                              <CornerDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                            ) : isAr ? (
                              <ArrowLeft className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowRight className="w-3.5 h-3.5" />
                            )}
                          </div>
                        </div>
                      </button>
                    </React.Fragment>
                  );
                })
              )}
            </div>

            {/* Footer Keyboard Hints Bar */}
            <div className="px-4 py-2.5 bg-[#f3eefc] dark:bg-[#140d26] border-t border-purple-200/80 dark:border-purple-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-purple-200/80">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#231742] border border-purple-300/70 dark:border-purple-700 text-[10px] font-mono font-bold text-[#3b256e] dark:text-amber-300 shadow-2xs">
                    ↑↓
                  </kbd>
                  <span className="font-semibold">{t.commandPalette.navigateHint}</span>
                </span>

                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#231742] border border-purple-300/70 dark:border-purple-700 text-[10px] font-mono font-bold text-[#3b256e] dark:text-amber-300 shadow-2xs">
                    ↵
                  </kbd>
                  <span className="font-semibold">{t.commandPalette.selectHint}</span>
                </span>

                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#231742] border border-purple-300/70 dark:border-purple-700 text-[10px] font-mono font-bold text-[#3b256e] dark:text-amber-300 shadow-2xs">
                    ESC
                  </kbd>
                  <span className="font-semibold">{t.commandPalette.closeHint}</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 font-mono text-[10.5px] font-bold text-[#4c2896] dark:text-amber-300">
                <span>{t.commandPalette.shortcutHint}:</span>
                <kbd className="px-1.5 py-0.5 rounded bg-purple-200/70 dark:bg-purple-900/70 text-[#281652] dark:text-white">
                  Ctrl + K
                </kbd>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
