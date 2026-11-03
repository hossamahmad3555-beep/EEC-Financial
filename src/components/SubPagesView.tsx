import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Download,
  ArrowLeft,
  ArrowRight,
  Building2,
  FileText,
  CreditCard,
  Sliders,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Moon,
  Sun,
  Globe,
  Database,
  HandCoins,
  Coins,
  Gauge,
  Landmark,
  BarChart3,
  Calculator,
  Printer,
  PlusCircle,
  LayoutGrid,
  X,
  TrendingUp,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/store';
import {
  setActiveTab,
  setSearchQuery,
  updateProjectCompletion,
  updateBudgetAllocation,
  adjustProjectBudgetAndSpend,
  resetDashboardLayouts,
  toggleTheme,
  toggleLanguage,
  resetDefaultData,
  STORAGE_KEY,
} from '../store/financialSlice';
import { translations } from '../i18n/translations';
import { exportFinancialDashboardToCsv } from '../utils/exportCsv';

interface SubPagesViewProps {
  onOpenQuickAction: (
    action:
      | 'createInvoice'
      | 'registerPayment'
      | 'recordReceipt'
      | 'costEntry'
      | 'budgetPlanning'
      | 'financialReport'
  ) => void;
  onTriggerPrintView?: () => void;
}

export const SubPagesView: React.FC<SubPagesViewProps> = ({
  onOpenQuickAction,
  onTriggerPrintView,
}) => {
  const dispatch = useAppDispatch();
  const financialState = useAppSelector((state) => state.financial);
  const {
    activeTab,
    language,
    theme,
    searchQuery,
    totalContracts,
    executedValue,
    totalInvoices,
    totalPayments,
    remainingValue,
    projects,
    invoicesList,
    paymentOrdersList,
    agingPayables,
    agingReceivables,
    budgetVsActual,
    cashFlow,
    lastSavedAt,
  } = financialState;

  const t = translations[language];
  const isAr = language === 'ar';

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [poCategoryFilter, setPoCategoryFilter] = useState<string>('ALL');
  const [journalFilter, setJournalFilter] = useState<'ALL' | 'INVOICE' | 'PAYMENT'>('ALL');

  const formatNumber = (n: number) => n.toLocaleString('en-US');

  const handleExportCsv = (title: string, rows: Record<string, string | number>[]) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      '\uFEFF' + headers.join(','),
      ...rows.map((r) => headers.map((h) => `"${r[h]}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset-utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EEC_${title}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportBackupJson = () => {
    const stateStr = localStorage.getItem(STORAGE_KEY) || JSON.stringify(financialState, null, 2);
    const blob = new Blob([stateStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EEC_Financial_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const translateStatus = (status: string) => {
    if (!isAr) return status.toUpperCase();
    switch (status) {
      case 'approved':
        return 'معتمد';
      case 'paid':
        return 'محصل / مدفوع';
      case 'pending':
        return 'قيد المراجعة';
      case 'overdue':
        return 'متأخر السداد';
      case 'executed':
        return 'تم التنفيذ';
      default:
        return status;
    }
  };

  // Contextual Header Action Button Config per Tab
  const primaryActionConfig = useMemo(() => {
    switch (activeTab) {
      case 'contracts':
        return {
          label: isAr ? '+ تسجيل تكلفة عقد' : '+ Record Contract Cost',
          action: () => onOpenQuickAction('costEntry'),
        };
      case 'invoices':
        return {
          label: `+ ${t.actions.createInvoice}`,
          action: () => onOpenQuickAction('createInvoice'),
        };
      case 'payment_orders':
        return {
          label: `+ ${t.actions.registerPayment}`,
          action: () => onOpenQuickAction('registerPayment'),
        };
      case 'receivables':
        return {
          label: `+ ${t.actions.recordReceipt}`,
          action: () => onOpenQuickAction('recordReceipt'),
        };
      case 'payables':
        return {
          label: `+ ${t.actions.registerPayment}`,
          action: () => onOpenQuickAction('registerPayment'),
        };
      case 'cost_control':
        return {
          label: `+ ${t.actions.costEntry}`,
          action: () => onOpenQuickAction('costEntry'),
        };
      case 'budget':
        return {
          label: `+ ${t.actions.budgetPlanning}`,
          action: () => onOpenQuickAction('budgetPlanning'),
        };
      case 'reports':
        return {
          label: t.actions.exportCsv,
          action: () => exportFinancialDashboardToCsv(financialState),
        };
      case 'accounting':
        return {
          label: `+ ${t.actions.createInvoice}`,
          action: () => onOpenQuickAction('createInvoice'),
        };
      case 'settings':
      default:
        return {
          label: t.actions.resetData,
          action: () => dispatch(resetDefaultData()),
        };
    }
  }, [activeTab, isAr, t, onOpenQuickAction, financialState, dispatch]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  // Filtered projects
  const filteredProjects = useMemo(() => {
    if (!normalizedQuery) return projects;
    return projects.filter(
      (p) =>
        p.id.toLowerCase().includes(normalizedQuery) ||
        p.nameEn.toLowerCase().includes(normalizedQuery) ||
        p.nameAr.toLowerCase().includes(normalizedQuery) ||
        p.managerEn.toLowerCase().includes(normalizedQuery) ||
        p.managerAr.toLowerCase().includes(normalizedQuery)
    );
  }, [projects, normalizedQuery]);

  // Dynamic Double-Entry Journal Entries for Accounting Tab
  const journalEntries = useMemo(() => {
    const entries: Array<{
      id: string;
      date: string;
      refNo: string;
      type: 'INVOICE' | 'PAYMENT';
      accountDrEn: string;
      accountDrAr: string;
      accountCrEn: string;
      accountCrAr: string;
      projectEn: string;
      projectAr: string;
      amount: number;
      status: string;
    }> = [];

    invoicesList.forEach((inv) => {
      const isRec = inv.type === 'receivable';
      entries.push({
        id: `JE-${inv.id}`,
        date: inv.date,
        refNo: inv.invoiceNo,
        type: 'INVOICE',
        accountDrEn: isRec
          ? '1120 · Accounts Receivable (Clients)'
          : '5110 · Project Construction Costs (WIP)',
        accountDrAr: isRec
          ? '1120 · العملاء والمدينون (مستخلصات)'
          : '5110 · تكاليف العمليات والمشروعات تحت التنفيذ',
        accountCrEn: isRec
          ? '4100 · Engineering & Contracting Revenue'
          : '2110 · Subcontractors & Trade Payables',
        accountCrAr: isRec
          ? '4100 · إيرادات العقود والمقاولات المعتمدة'
          : '2110 · الدائنون ومقاولو الباطن والموردون',
        projectEn: inv.projectNameEn,
        projectAr: inv.projectNameAr,
        amount: inv.amount,
        status: inv.status,
      });
    });

    paymentOrdersList.forEach((po) => {
      entries.push({
        id: `JE-${po.id}`,
        date: po.date,
        refNo: po.orderNo,
        type: 'PAYMENT',
        accountDrEn: `2110 · Subcontractors & Suppliers (${po.category})`,
        accountDrAr: `2110 · مقاولو الباطن والموردون (${po.category})`,
        accountCrEn: '1110 · CIB / NBE Corporate Bank Account',
        accountCrAr: '1110 · النقدية بالبنوك (البنك التجاري الدولي / الأهلي)',
        projectEn: po.projectNameEn,
        projectAr: po.projectNameAr,
        amount: po.amount,
        status: po.status,
      });
    });

    return entries
      .filter((e) => (journalFilter === 'ALL' ? true : e.type === journalFilter))
      .filter(
        (e) =>
          !normalizedQuery ||
          e.refNo.toLowerCase().includes(normalizedQuery) ||
          e.projectEn.toLowerCase().includes(normalizedQuery) ||
          e.projectAr.includes(normalizedQuery) ||
          e.accountDrEn.toLowerCase().includes(normalizedQuery) ||
          e.accountDrAr.includes(normalizedQuery)
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [invoicesList, paymentOrdersList, journalFilter, normalizedQuery]);

  const totalReceivablesAging = agingReceivables.reduce((s, r) => s + r.amount, 0);
  const totalPayablesAging = agingPayables.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-4 pb-6">
      {/* Subpage Header Bar with Back to Dashboard, Search & Contextual Primary Action */}
      <div className="no-print print:hidden flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-[#1e1538] rounded-2xl p-4 border border-purple-200/80 dark:border-purple-800/60 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch(setActiveTab('dashboard'))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/60 dark:hover:bg-purple-800 text-[#321b66] dark:text-purple-200 text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{t.nav.dashboard}</span>
          </button>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#1f1240] dark:text-white leading-tight">
              {t.nav[activeTab]}
            </h2>
            <p className="text-xs text-slate-500 dark:text-purple-300/80">
              {isAr
                ? 'بيانات متزامنة لحظياً مع لوحة المعلومات المالية عبر Redux Toolkit'
                : 'Real-time synchronized ledger with Financial Dashboard via Redux Toolkit'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          {activeTab !== 'settings' && (
            <div className="relative flex-1 sm:flex-initial">
              <Search
                className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 pointer-events-none ${
                  isAr ? 'right-3' : 'left-3'
                }`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                placeholder={t.actions.searchPlaceholder}
                className={`w-full sm:w-64 bg-purple-50/60 dark:bg-[#140d29] border border-purple-200 dark:border-purple-800/80 rounded-xl py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  isAr ? 'pr-9 pl-7' : 'pl-9 pr-7'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => dispatch(setSearchQuery(''))}
                  className={`w-4 h-4 rounded-full bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100 flex items-center justify-center absolute top-1/2 -translate-y-1/2 cursor-pointer ${
                    isAr ? 'left-2.5' : 'right-2.5'
                  }`}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          )}

          {onTriggerPrintView && (
            <button
              onClick={onTriggerPrintView}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-purple-200 dark:border-purple-700 text-xs font-bold text-[#2b1954] dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/40 cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.actions.printView}</span>
            </button>
          )}

          <button
            onClick={primaryActionConfig.action}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#4b2d87] to-[#6341a8] hover:brightness-110 text-white text-xs font-bold shadow-xs cursor-pointer whitespace-nowrap"
          >
            <span>{primaryActionConfig.label}</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 1. CONTRACTS VIEW (Dedicated Engineering Contracts Portfolio)         */}
      {/* ===================================================================== */}
      {activeTab === 'contracts' && (
        <div className="space-y-4">
          {/* Contracts Summary KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-[#1e1538] rounded-2xl p-4 border border-purple-200/80 dark:border-purple-800/60 shadow-2xs">
              <div className="text-xs font-bold text-slate-500 dark:text-purple-300">
                {t.kpi.totalContracts}
              </div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums mt-1">
                {t.kpi.egp} {formatNumber(totalContracts)}
              </div>
              <div className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 mt-1 tabular-nums">
                {projects.length} {isAr ? 'عقود رئيسية سارية' : 'Active Master Contracts'}
              </div>
            </div>

            <div className="bg-white dark:bg-[#1e1538] rounded-2xl p-4 border border-purple-200/80 dark:border-purple-800/60 shadow-2xs">
              <div className="text-xs font-bold text-slate-500 dark:text-purple-300">
                {t.kpi.executedValue}
              </div>
              <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                {t.kpi.egp} {formatNumber(executedValue)}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-purple-300/80 mt-1 tabular-nums">
                {((executedValue / totalContracts) * 100).toFixed(1)}%{' '}
                {isAr ? 'نسبة التنفيذ الإجمالية' : 'Overall Execution Rate'}
              </div>
            </div>

            <div className="bg-white dark:bg-[#1e1538] rounded-2xl p-4 border border-purple-200/80 dark:border-purple-800/60 shadow-2xs">
              <div className="text-xs font-bold text-slate-500 dark:text-purple-300">
                {isAr ? 'تأمين ضمان الأعمال المحتجز (5%)' : 'Contract Retention Held (5%)'}
              </div>
              <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400 tabular-nums mt-1">
                {t.kpi.egp} {formatNumber(Math.round(executedValue * 0.05))}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-purple-300/80 mt-1">
                {isAr ? 'يُرد عند الاستلام النهائي' : 'Released upon Final Handover (FAC)'}
              </div>
            </div>

            <div className="bg-white dark:bg-[#1e1538] rounded-2xl p-4 border border-purple-200/80 dark:border-purple-800/60 shadow-2xs">
              <div className="text-xs font-bold text-slate-500 dark:text-purple-300">
                {t.kpi.remainingValue}
              </div>
              <div className="text-lg font-extrabold text-purple-700 dark:text-purple-300 tabular-nums mt-1">
                {t.kpi.egp} {formatNumber(remainingValue)}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-purple-300/80 mt-1 tabular-nums">
                {((remainingValue / totalContracts) * 100).toFixed(1)}%{' '}
                {isAr ? 'أعمال متبقية' : 'Backlog Remaining'}
              </div>
            </div>
          </div>

          {/* Contracts Master Table */}
          <div className="bg-white dark:bg-[#1e1538] rounded-2xl p-5 border border-purple-200/80 dark:border-purple-800/60 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {isAr
                    ? 'سجل العقود الهندسية ونسب الإنجاز التنفيذي'
                    : 'Engineering Contracts Portfolio & Execution Control'}
                </h3>
              </div>
              <button
                onClick={() =>
                  handleExportCsv(
                    'Contracts_Portfolio',
                    filteredProjects.map((p) => ({
                      Contract_ID: p.id,
                      Project: p.nameEn,
                      Manager: p.managerEn,
                      ContractValue_EGP: p.contractValue,
                      ExecutedValue_EGP: p.executedValue,
                      Retention_5Pct_EGP: Math.round(p.executedValue * 0.05),
                      Remaining_EGP: Math.max(0, p.contractValue - p.executedValue),
                      Completion_Pct: p.completionPercentage,
                    }))
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-700 text-xs font-bold text-purple-800 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/40 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.actions.exportCsv}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-start border-collapse">
                <thead>
                  <tr className="bg-[#ede7f8] dark:bg-purple-900/50 text-[#231445] dark:text-purple-100 font-extrabold">
                    <th className="p-3 text-start rounded-s-lg">
                      {isAr ? 'كود العقد' : 'Contract ID'}
                    </th>
                    <th className="p-3 text-start">{isAr ? 'اسم المشروع' : 'Project Name'}</th>
                    <th className="p-3 text-start">
                      {isAr ? 'مدير المشروع' : 'Project Manager'}
                    </th>
                    <th className="p-3 text-end">
                      {isAr ? 'قيمة العقد (ج.م)' : 'Contract Value (EGP)'}
                    </th>
                    <th className="p-3 text-end">
                      {isAr ? 'الأعمال المنفذة (ج.م)' : 'Executed Value (EGP)'}
                    </th>
                    <th className="p-3 text-end">
                      {isAr ? 'المتبقي للتنفيذ (ج.م)' : 'Remaining (EGP)'}
                    </th>
                    <th className="p-3 text-center rounded-e-lg">
                      {isAr ? 'نسبة الإنجاز (تفاعلي)' : 'Completion % (Interactive)'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100 dark:divide-purple-800/40">
                  {filteredProjects.map((p) => {
                    const rem = Math.max(0, p.contractValue - p.executedValue);
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-colors"
                      >
                        <td className="p-3 font-mono font-bold text-purple-700 dark:text-purple-300 tabular-nums">
                          {p.id}
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {isAr ? p.nameAr : p.nameEn}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">
                          {isAr ? p.managerAr : p.managerEn}
                        </td>
                        <td className="p-3 text-end font-bold text-slate-900 dark:text-white tabular-nums">
                          {formatNumber(p.contractValue)}
                        </td>
                        <td className="p-3 text-end font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                          {formatNumber(p.executedValue)}
                        </td>
                        <td className="p-3 text-end font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                          {formatNumber(rem)}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-3">
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={p.completionPercentage}
                              onChange={(e) =>
                                dispatch(
                                  updateProjectCompletion({
                                    projectId: p.id,
                                    percentage: Number(e.target.value),
                                  })
                                )
                              }
                              className="w-28 accent-purple-700 cursor-pointer"
                            />
                            <span className="font-extrabold text-slate-900 dark:text-white tabular-nums w-10 text-end">
                              {p.completionPercentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. INVOICES VIEW (Dedicated Client IPCs & Subcontractor Invoices)     */}
      {/* ===================================================================== */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-[#1e1538] rounded-2xl p-4 border border-purple-200/80 dark:border-purple-800/60 shadow-2xs">
              <div className="text-xs font-bold text-slate-500 dark:text-purple-300">
                {t.kpi.totalInvoices}
              </div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums mt-1">
                {t.kpi.egp} {formatNumber(totalInvoices)}
              </div>
              <div className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 mt-1 tabular-nums">
                {invoicesList.length} {isAr ? 'مستخلصات وفواتير مسجلة' : 'Registered Invoices'}
              </div>
            </div>

            <div className="bg-white dark:bg-[#1e1538] rounded-2xl p-4 border border-purple-200/80 dark:border-purple-800/60 shadow-2xs">
              <div className="text-xs font-bold text-slate-500 dark:text-purple-300">
                {isAr ? 'مستخلصات العملاء (مقبوضات)' : 'Client IPCs (Receivable)'}
              </div>
              <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                {t.kpi.egp}{' '}
                {formatNumber(
                  invoicesList
                    .filter((i) => i.type === 'receivable')
                    .reduce((s, i) => s + i.amount, 0)
                )}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-purple-300/80 mt-1 tabular-nums">
                {invoicesList.filter((i) => i.type === 'receivable').length}{' '}
                {isAr ? 'مستخلصات عملاء' : 'Client IPCs'}
              </div>
            </div>

            <div className="bg-white dark:bg-[#1e1538] rounded-2xl p-4 border border-purple-200/80 dark:border-purple-800/60 shadow-2xs">
              <div className="text-xs font-bold text-slate-500 dark:text-purple-300">
                {isAr ? 'فواتير مقاولي الباطن (مدفوعات)' : 'Subcontractor Claims (Payable)'}
              </div>
              <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400 tabular-nums mt-1">
                {t.kpi.egp}{' '}
                {formatNumber(
                  invoicesList
                    .filter((i) => i.type === 'payable')
                    .reduce((s, i) => s + i.amount, 0)
                )}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-purple-300/80 mt-1 tabular-nums">
                {invoicesList.filter((i) => i.type === 'payable').length}{' '}
                {isAr ? 'فواتير موردين ومقاولين' : 'Vendor Invoices'}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e1538] rounded-2xl p-5 border border-purple-200/80 dark:border-purple-800/60 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {isAr
                    ? 'سجل المستخلصات الجارية والفواتير الضريبية'
                    : 'Progress Invoices (IPCs) & Subcontractor Claims Ledger'}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(['ALL', 'approved', 'paid', 'pending', 'overdue'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                      statusFilter === st
                        ? 'bg-purple-700 text-white'
                        : 'bg-purple-50 dark:bg-purple-900/40 text-slate-700 dark:text-purple-200'
                    }`}
                  >
                    {st === 'ALL' ? (isAr ? 'الكل' : 'ALL') : translateStatus(st)}
                  </button>
                ))}
                <button
                  onClick={() =>
                    handleExportCsv(
                      'Invoices_Ledger',
                      invoicesList.map((inv) => ({
                        InvoiceNo: inv.invoiceNo,
                        Client: inv.clientEn,
                        Project: inv.projectNameEn,
                        Type: inv.type,
                        Amount_EGP: inv.amount,
                        Date: inv.date,
                        DueDate: inv.dueDate,
                        Status: inv.status,
                      }))
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-700 text-xs font-bold text-purple-800 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/40 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.actions.exportCsv}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-start border-collapse">
                <thead>
                  <tr className="bg-[#ede7f8] dark:bg-purple-900/50 text-[#231445] dark:text-purple-100 font-extrabold">
                    <th className="p-3 text-start rounded-s-lg">
                      {isAr ? 'رقم المستخلص' : 'Invoice #'}
                    </th>
                    <th className="p-3 text-start">
                      {isAr ? 'الجهة / العميل / المقاول' : 'Client / Subcontractor'}
                    </th>
                    <th className="p-3 text-start">{isAr ? 'المشروع' : 'Project'}</th>
                    <th className="p-3 text-start">{isAr ? 'النوع' : 'Type'}</th>
                    <th className="p-3 text-end">{isAr ? 'القيمة (ج.م)' : 'Amount (EGP)'}</th>
                    <th className="p-3 text-center">{isAr ? 'تاريخ الاستحقاق' : 'Due Date'}</th>
                    <th className="p-3 text-center rounded-e-lg">{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100 dark:divide-purple-800/40">
                  {invoicesList
                    .filter((inv) =>
                      statusFilter === 'ALL' ? true : inv.status === statusFilter
                    )
                    .filter(
                      (inv) =>
                        !normalizedQuery ||
                        inv.invoiceNo.toLowerCase().includes(normalizedQuery) ||
                        inv.clientEn.toLowerCase().includes(normalizedQuery) ||
                        inv.clientAr.includes(normalizedQuery) ||
                        inv.projectNameEn.toLowerCase().includes(normalizedQuery) ||
                        inv.projectNameAr.includes(normalizedQuery)
                    )
                    .map((inv) => (
                      <tr
                        key={inv.id}
                        className="hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-colors"
                      >
                        <td className="p-3 font-mono font-bold text-purple-700 dark:text-purple-300 tabular-nums">
                          {inv.invoiceNo}
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {isAr ? inv.clientAr : inv.clientEn}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">
                          {isAr ? inv.projectNameAr : inv.projectNameEn}
                        </td>
                        <td className="p-3 font-semibold text-xs text-slate-600 dark:text-purple-200">
                          {inv.type === 'receivable'
                            ? isAr
                              ? 'مستخلص عميل (مقبوضات)'
                              : 'Client IPC (AR)'
                            : isAr
                            ? 'فاتورة مقاول (مدفوعات)'
                            : 'Vendor Claim (AP)'}
                        </td>
                        <td className="p-3 text-end font-extrabold text-slate-900 dark:text-white tabular-nums">
                          {formatNumber(inv.amount)}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                          {inv.dueDate}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                              inv.status === 'paid' || inv.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                                : inv.status === 'pending'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                            }`}
                          >
                            {inv.status === 'paid' || inv.status === 'approved' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : inv.status === 'pending' ? (
                              <Clock className="w-3 h-3" />
                            ) : (
                              <AlertTriangle className="w-3 h-3" />
                            )}
                            <span>{translateStatus(inv.status)}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. PAYMENT ORDERS VIEW (Dedicated Bank Transfers, LCs & Cheques)      */}
      {/* ===================================================================== */}
      {activeTab === 'payment_orders' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-[#1e1538] rounded-2xl p-4 border border-purple-200/80 dark:border-purple-800/60 shadow-2xs">
              <div className="text-xs font-bold text-slate-500 dark:text-purple-300">
                {t.kpi.totalPayments}
              </div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums mt-1">
                {t.kpi.egp} {formatNumber(totalPayments)}
              </div>
              <div className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 mt-1 tabular-nums">
                {((totalPayments / totalInvoices) * 100).toFixed(1)}%{' '}
                {isAr ? 'معدل السداد للفواتير' : 'Invoice Settlement Ratio'}
              </div>
            </div>

            <div className="bg-white dark:bg-[#1e1538] rounded-2xl p-4 border border-purple-200/80 dark:border-purple-800/60 shadow-2xs">
              <div className="text-xs font-bold text-slate-500 dark:text-purple-300">
                {isAr ? 'إجمالي أوامر الدفع الحالية' : 'Active Payment Orders Batch'}
              </div>
              <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400 tabular-nums mt-1">
                {t.kpi.egp}{' '}
                {formatNumber(paymentOrdersList.reduce((s, p) => s + p.amount, 0))}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-purple-300/80 mt-1 tabular-nums">
                {paymentOrdersList.length} {isAr ? 'أوامر دفع مسجلة' : 'Payment Orders'}
              </div>
            </div>

            <div className="bg-white dark:bg-[#1e1538] rounded-2xl p-4 border border-purple-200/80 dark:border-purple-800/60 shadow-2xs">
              <div className="text-xs font-bold text-slate-500 dark:text-purple-300">
                {isAr ? 'طرق السداد المعتمدة' : 'Approved Treasury Channels'}
              </div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-1.5">
                RTGS · Letter of Credit (LC) · Certified Cheque
              </div>
              <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                {isAr ? 'مربوطة مباشرة بحسابات الخزانة' : 'Synced with Corporate Treasury'}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e1538] rounded-2xl p-5 border border-purple-200/80 dark:border-purple-800/60 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {isAr
                    ? 'سجل أوامر الدفع والتحويلات البنكية للموردين'
                    : 'Corporate Payment Orders & Bank Transfers'}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {['ALL', 'Civil', 'Architectural', 'Mechanical', 'Electrical'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setPoCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                      poCategoryFilter === cat
                        ? 'bg-purple-700 text-white'
                        : 'bg-purple-50 dark:bg-purple-900/40 text-slate-700 dark:text-purple-200'
                    }`}
                  >
                    {cat === 'ALL' ? (isAr ? 'جميع التخصصات' : 'All Disciplines') : cat}
                  </button>
                ))}
                <button
                  onClick={() =>
                    handleExportCsv(
                      'Payment_Orders',
                      paymentOrdersList.map((po) => ({
                        OrderNo: po.orderNo,
                        Beneficiary: po.beneficiaryEn,
                        Project: po.projectNameEn,
                        Category: po.category,
                        Method: po.methodEn,
                        Amount_EGP: po.amount,
                        Date: po.date,
                        Status: po.status,
                      }))
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-700 text-xs font-bold text-purple-800 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/40 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.actions.exportCsv}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-start border-collapse">
                <thead>
                  <tr className="bg-[#ede7f8] dark:bg-purple-900/50 text-[#231445] dark:text-purple-100 font-extrabold">
                    <th className="p-3 text-start rounded-s-lg">
                      {isAr ? 'رقم أمر الدفع' : 'Order #'}
                    </th>
                    <th className="p-3 text-start">{isAr ? 'المستفيد' : 'Beneficiary'}</th>
                    <th className="p-3 text-start">{isAr ? 'المشروع' : 'Project'}</th>
                    <th className="p-3 text-start">{isAr ? 'البند' : 'Discipline'}</th>
                    <th className="p-3 text-start">{isAr ? 'طريقة الدفع' : 'Method'}</th>
                    <th className="p-3 text-end">{isAr ? 'المبلغ (ج.م)' : 'Amount (EGP)'}</th>
                    <th className="p-3 text-center rounded-e-lg">{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100 dark:divide-purple-800/40">
                  {paymentOrdersList
                    .filter((po) =>
                      poCategoryFilter === 'ALL' ? true : po.category === poCategoryFilter
                    )
                    .filter(
                      (po) =>
                        !normalizedQuery ||
                        po.orderNo.toLowerCase().includes(normalizedQuery) ||
                        po.beneficiaryEn.toLowerCase().includes(normalizedQuery) ||
                        po.beneficiaryAr.includes(normalizedQuery)
                    )
                    .map((po) => (
                      <tr
                        key={po.id}
                        className="hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-colors"
                      >
                        <td className="p-3 font-mono font-bold text-purple-700 dark:text-purple-300 tabular-nums">
                          {po.orderNo}
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {isAr ? po.beneficiaryAr : po.beneficiaryEn}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">
                          {isAr ? po.projectNameAr : po.projectNameEn}
                        </td>
                        <td className="p-3 font-semibold text-purple-800 dark:text-purple-300">
                          {po.category}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">
                          {isAr ? po.methodAr : po.methodEn}
                        </td>
                        <td className="p-3 text-end font-extrabold text-amber-700 dark:text-amber-400 tabular-nums">
                          {formatNumber(po.amount)}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                            {translateStatus(po.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. RECEIVABLES VIEW (Dedicated Client Receivables & Aging Breakdown)  */}
      {/* ===================================================================== */}
      {activeTab === 'receivables' && (
        <div className="space-y-4">
          {/* Aging of Receivables 4-Bucket Breakdown */}
          <div className="bg-white dark:bg-[#1e1538] rounded-2xl p-5 border border-purple-200/80 dark:border-purple-800/60 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <HandCoins className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {t.widgets.agingReceivables}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-purple-300/80">
                    {isAr
                      ? `إجمالي المستحقات لدى العملاء: ${t.kpi.egp} ${formatNumber(totalReceivablesAging)}`
                      : `Total Outstanding Client Receivables: ${t.kpi.egp} ${formatNumber(totalReceivablesAging)}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onOpenQuickAction('recordReceipt')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t.actions.recordReceipt}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {agingReceivables.map((bucket) => {
                const borderColors: Record<typeof bucket.badgeColor, string> = {
                  green: 'border-emerald-300 dark:border-emerald-800/70',
                  yellow: 'border-amber-300 dark:border-amber-800/70',
                  orange: 'border-orange-300 dark:border-orange-800/70',
                  red: 'border-rose-300 dark:border-rose-800/70',
                };
                return (
                  <div
                    key={bucket.id}
                    className={`p-4 rounded-xl bg-purple-50/40 dark:bg-[#150e2a] border ${borderColors[bucket.badgeColor]} space-y-2`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-purple-200">
                      <span>{isAr ? bucket.periodAr : bucket.periodEn}</span>
                      <span className="font-extrabold tabular-nums">
                        {bucket.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums">
                      {t.kpi.egp} {formatNumber(bucket.amount)}
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-purple-100 dark:bg-purple-950 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#5b34a6] dark:bg-purple-400"
                        style={{ width: `${Math.min(100, bucket.percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Client Receivable Invoices List */}
          <div className="bg-white dark:bg-[#1e1538] rounded-2xl p-5 border border-purple-200/80 dark:border-purple-800/60 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {isAr
                ? 'مستخلصات العملاء المستحقة والتحصيلات النقدية'
                : 'Client Progress Certificates (AR) & Collection Status'}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-start border-collapse">
                <thead>
                  <tr className="bg-[#ede7f8] dark:bg-purple-900/50 text-[#231445] dark:text-purple-100 font-extrabold">
                    <th className="p-3 text-start rounded-s-lg">
                      {isAr ? 'رقم المستخلص' : 'IPC #'}
                    </th>
                    <th className="p-3 text-start">
                      {isAr ? 'الجهة المالكة / العميل' : 'Client / Owner Entity'}
                    </th>
                    <th className="p-3 text-start">{isAr ? 'المشروع' : 'Project'}</th>
                    <th className="p-3 text-end">
                      {isAr ? 'قيمة المستخلص (ج.م)' : 'IPC Amount (EGP)'}
                    </th>
                    <th className="p-3 text-center">
                      {isAr ? 'تاريخ الاستحقاق' : 'Collection Due'}
                    </th>
                    <th className="p-3 text-center rounded-e-lg">{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100 dark:divide-purple-800/40">
                  {invoicesList
                    .filter((inv) => inv.type === 'receivable')
                    .map((inv) => (
                      <tr key={inv.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-900/20">
                        <td className="p-3 font-mono font-bold text-purple-700 dark:text-purple-300 tabular-nums">
                          {inv.invoiceNo}
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {isAr ? inv.clientAr : inv.clientEn}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">
                          {isAr ? inv.projectNameAr : inv.projectNameEn}
                        </td>
                        <td className="p-3 text-end font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
                          {formatNumber(inv.amount)}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-500 tabular-nums">
                          {inv.dueDate}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                            {translateStatus(inv.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. PAYABLES VIEW (Dedicated Subcontractor & Supplier Aging)           */}
      {/* ===================================================================== */}
      {activeTab === 'payables' && (
        <div className="space-y-4">
          {/* Aging of Payables 4-Bucket Breakdown */}
          <div className="bg-white dark:bg-[#1e1538] rounded-2xl p-5 border border-purple-200/80 dark:border-purple-800/60 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {t.widgets.agingPayables}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-purple-300/80">
                    {isAr
                      ? `إجمالي مستحقات الموردين ومقاولي الباطن: ${t.kpi.egp} ${formatNumber(totalPayablesAging)}`
                      : `Total Subcontractor & Supplier Payables: ${t.kpi.egp} ${formatNumber(totalPayablesAging)}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onOpenQuickAction('registerPayment')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t.actions.registerPayment}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {agingPayables.map((bucket) => (
                <div
                  key={bucket.id}
                  className="p-4 rounded-xl bg-purple-50/40 dark:bg-[#150e2a] border border-purple-200/80 dark:border-purple-800/60 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-purple-200">
                    <span>{isAr ? bucket.periodAr : bucket.periodEn}</span>
                    <span className="font-extrabold tabular-nums">
                      {bucket.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {t.kpi.egp} {formatNumber(bucket.amount)}
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-amber-100 dark:bg-amber-950 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${Math.min(100, bucket.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subcontractor Claims & Vendor Invoices Table */}
          <div className="bg-white dark:bg-[#1e1538] rounded-2xl p-5 border border-purple-200/80 dark:border-purple-800/60 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {isAr
                ? 'مطالبات مقاولي الباطن والموردين المستحقة'
                : 'Subcontractor Claims & Supplier Payables Schedule'}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-start border-collapse">
                <thead>
                  <tr className="bg-[#ede7f8] dark:bg-purple-900/50 text-[#231445] dark:text-purple-100 font-extrabold">
                    <th className="p-3 text-start rounded-s-lg">
                      {isAr ? 'رقم المطالبة' : 'Claim #'}
                    </th>
                    <th className="p-3 text-start">
                      {isAr ? 'المورد / مقاول الباطن' : 'Subcontractor / Supplier'}
                    </th>
                    <th className="p-3 text-start">{isAr ? 'المشروع' : 'Project'}</th>
                    <th className="p-3 text-end">
                      {isAr ? 'القيمة المستحقة (ج.م)' : 'Payable Amount (EGP)'}
                    </th>
                    <th className="p-3 text-center">
                      {isAr ? 'تاريخ الاستحقاق' : 'Due Date'}
                    </th>
                    <th className="p-3 text-center rounded-e-lg">{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100 dark:divide-purple-800/40">
                  {invoicesList
                    .filter((inv) => inv.type === 'payable')
                    .map((inv) => (
                      <tr key={inv.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-900/20">
                        <td className="p-3 font-mono font-bold text-purple-700 dark:text-purple-300 tabular-nums">
                          {inv.invoiceNo}
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {isAr ? inv.clientAr : inv.clientEn}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">
                          {isAr ? inv.projectNameAr : inv.projectNameEn}
                        </td>
                        <td className="p-3 text-end font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
                          {formatNumber(inv.amount)}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-500 tabular-nums">
                          {inv.dueDate}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200">
                            {translateStatus(inv.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. COST CONTROL VIEW (Dedicated >90% Budget Threshold & CPI Control)  */}
      {/* ===================================================================== */}
      {activeTab === 'cost_control' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1e1538] rounded-2xl p-5 border border-purple-200/80 dark:border-purple-800/60 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {isAr
                      ? 'مراقبة التكاليف ومصفوفة استهلاك موازنات المشروعات (حد التنبيه 90%)'
                      : 'Project Cost Control & Budget Utilization Matrix (90% Alert Threshold)'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-purple-300/80">
                    {isAr
                      ? 'متابعة الانحرافات المالية ومؤشر أداء التكلفة (CPI) لكل مشروع هندسي'
                      : 'Monitor actual expenditure vs. allocated budget and simulate cost/budget adjustments in real time'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onOpenQuickAction('costEntry')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t.actions.costEntry}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-start border-collapse">
                <thead>
                  <tr className="bg-[#ede7f8] dark:bg-purple-900/50 text-[#231445] dark:text-purple-100 font-extrabold">
                    <th className="p-3 text-start rounded-s-lg">{isAr ? 'الكود' : 'Code'}</th>
                    <th className="p-3 text-start">{isAr ? 'المشروع' : 'Project'}</th>
                    <th className="p-3 text-end">
                      {isAr ? 'الموازنة المخصصة (ج.م)' : 'Allocated Budget (EGP)'}
                    </th>
                    <th className="p-3 text-end">
                      {isAr ? 'الإنفاق الفعلي (ج.م)' : 'Actual Spend (EGP)'}
                    </th>
                    <th className="p-3 text-end">
                      {isAr ? 'الرصيد المتاح (ج.م)' : 'Variance / Available'}
                    </th>
                    <th className="p-3 text-center">
                      {isAr ? 'نسبة الاستهلاك' : 'Utilization %'}
                    </th>
                    <th className="p-3 text-center rounded-e-lg">
                      {isAr ? 'إجراءات سريعة' : 'Quick Adjustments'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100 dark:divide-purple-800/40">
                  {filteredProjects.map((p) => {
                    const alloc = p.allocatedBudget || Math.round(p.contractValue * 0.88);
                    const spent = p.actualSpent ?? p.executedValue;
                    const variance = alloc - spent;
                    const utilPct = alloc > 0 ? Number(((spent / alloc) * 100).toFixed(1)) : 0;
                    const isOver90 = utilPct > 90;

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-colors"
                      >
                        <td className="p-3 font-mono font-bold text-purple-700 dark:text-purple-300 tabular-nums">
                          {p.id}
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{isAr ? p.nameAr : p.nameEn}</span>
                            {isOver90 && (
                              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-end font-bold text-slate-900 dark:text-white tabular-nums">
                          {formatNumber(alloc)}
                        </td>
                        <td className="p-3 text-end font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                          {formatNumber(spent)}
                        </td>
                        <td
                          className={`p-3 text-end font-extrabold tabular-nums ${
                            variance >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {variance >= 0 ? '+' : ''}
                          {formatNumber(variance)}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold tabular-nums ${
                              isOver90
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                            }`}
                          >
                            {utilPct}%
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() =>
                                dispatch(
                                  adjustProjectBudgetAndSpend({
                                    projectId: p.id,
                                    budgetDelta: 15000000,
                                  })
                                )
                              }
                              className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-xs font-bold cursor-pointer whitespace-nowrap"
                            >
                              {isAr ? '+15M دعم موازنة' : '+15M Budget'}
                            </button>
                            <button
                              onClick={() =>
                                dispatch(
                                  adjustProjectBudgetAndSpend({
                                    projectId: p.id,
                                    spendDelta: 10000000,
                                  })
                                )
                              }
                              className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 text-xs font-bold cursor-pointer whitespace-nowrap"
                            >
                              {isAr ? '+10M تكلفة' : '+10M Spend'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 7. BUDGET VIEW (Dedicated Discipline Budget Allocation Editor)        */}
      {/* ===================================================================== */}
      {activeTab === 'budget' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 bg-white dark:bg-[#1e1538] rounded-2xl p-5 border border-purple-200/80 dark:border-purple-800/60 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {isAr
                    ? 'تخطيط الموازنة التقديرية مقابل الإنفاق الفعلي (مليون ج.م)'
                    : 'Discipline Budget Planning vs. Actual Expenditure (M EGP)'}
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              {budgetVsActual.map((cat) => {
                const variance = cat.budget - cat.actual;
                const utilPct = cat.budget > 0 ? Math.round((cat.actual / cat.budget) * 100) : 0;
                return (
                  <div
                    key={cat.id}
                    className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/40 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                      <span className="text-slate-900 dark:text-white">
                        {isAr ? cat.nameAr : cat.nameEn}
                      </span>
                      <span
                        className={`tabular-nums ${
                          variance >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isAr ? 'الوفورات / الفائض:' : 'Variance:'}{' '}
                        {variance >= 0 ? `+${variance}M` : `${variance}M`} ({utilPct}%)
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-purple-200/70 dark:bg-purple-900 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#582da8] to-[#d99b26]"
                        style={{ width: `${Math.min(100, utilPct)}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-500 dark:text-purple-300 mb-1">
                          {t.widgets.budget}: <strong>{cat.budget}M EGP</strong>
                        </label>
                        <input
                          type="range"
                          min={50}
                          max={600}
                          value={cat.budget}
                          onChange={(e) =>
                            dispatch(
                              updateBudgetAllocation({
                                categoryId: cat.id,
                                budget: Number(e.target.value),
                                actual: cat.actual,
                              })
                            )
                          }
                          className="w-full accent-purple-700 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 dark:text-purple-300 mb-1">
                          {t.widgets.actual}: <strong>{cat.actual}M EGP</strong>
                        </label>
                        <input
                          type="range"
                          min={30}
                          max={600}
                          value={cat.actual}
                          onChange={(e) =>
                            dispatch(
                              updateBudgetAllocation({
                                categoryId: cat.id,
                                budget: cat.budget,
                                actual: Number(e.target.value),
                              })
                            )
                          }
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 bg-white dark:bg-[#1e1538] rounded-2xl p-5 border border-purple-200/80 dark:border-purple-800/60 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {isAr
                ? 'ملخص توزيع الموازنة حسب التخصص الهندسي'
                : 'Engineering Discipline Allocation Summary'}
            </h3>
            <table className="w-full text-xs sm:text-sm text-start border-collapse">
              <thead>
                <tr className="bg-[#ede7f8] dark:bg-purple-900/50 text-[#231445] dark:text-purple-100 font-extrabold">
                  <th className="p-2.5 text-start">{isAr ? 'التخصص' : 'Discipline'}</th>
                  <th className="p-2.5 text-end">{t.widgets.budget}</th>
                  <th className="p-2.5 text-end">{t.widgets.actual}</th>
                  <th className="p-2.5 text-end">{isAr ? 'الفرق' : 'Diff'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100 dark:divide-purple-800/40">
                {budgetVsActual.map((c) => (
                  <tr key={c.id}>
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                      {isAr ? c.nameAr : c.nameEn}
                    </td>
                    <td className="p-2.5 text-end font-bold text-purple-700 dark:text-purple-300 tabular-nums">
                      {c.budget}M
                    </td>
                    <td className="p-2.5 text-end font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                      {c.actual}M
                    </td>
                    <td className="p-2.5 text-end font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {c.budget - c.actual >= 0 ? '+' : ''}
                      {c.budget - c.actual}M
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 8. REPORTS VIEW (Dedicated Executive Financial Statements & CashFlow) */}
      {/* ===================================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1e1538] rounded-2xl p-5 border border-purple-200/80 dark:border-purple-800/60 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {isAr
                      ? 'مركز التقارير المالية التنفيذية وقائمة التدفقات النقدية (2026)'
                      : 'Executive Financial Reports & Monthly Cash Flow Statement (2026)'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-purple-300/80">
                    {isAr
                      ? 'تصدير التقارير المعتمدة بصيغة CSV أو طباعة التقرير الرسمي مباشرة'
                      : 'Download comprehensive CSV datasets or trigger Printer-Friendly Executive Report'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleExportCsv(
                      'CashFlow_Statement_2026',
                      cashFlow.map((c) => ({
                        Month: c.labelEn,
                        Inflow_M_EGP: c.inflow,
                        Outflow_M_EGP: c.outflow,
                        Net_Cash_Flow_M_EGP: c.inflow - c.outflow,
                      }))
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-700 text-xs font-bold text-purple-800 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/40 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.actions.exportCsv}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-start border-collapse">
                <thead>
                  <tr className="bg-[#ede7f8] dark:bg-purple-900/50 text-[#231445] dark:text-purple-100 font-extrabold">
                    <th className="p-3 text-start rounded-s-lg">{isAr ? 'الشهر' : 'Month'}</th>
                    <th className="p-3 text-end">{t.widgets.inflow} (M EGP)</th>
                    <th className="p-3 text-end">{t.widgets.outflow} (M EGP)</th>
                    <th className="p-3 text-end">
                      {isAr ? 'صافي التدفق النقدي' : 'Net Cash Flow'}
                    </th>
                    <th className="p-3 text-end rounded-e-lg">
                      {isAr ? 'نسبة السيولة التشغيلية' : 'Operating Coverage'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100 dark:divide-purple-800/40">
                  {cashFlow.map((m) => {
                    const net = m.inflow - m.outflow;
                    const coverage = m.outflow > 0 ? ((m.inflow / m.outflow) * 100).toFixed(0) : '100';
                    return (
                      <tr key={m.monthKey} className="hover:bg-purple-50/40 dark:hover:bg-purple-900/20">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {isAr ? m.labelAr : m.labelEn}
                        </td>
                        <td className="p-3 text-end font-bold text-purple-700 dark:text-purple-300 tabular-nums">
                          {m.inflow}M
                        </td>
                        <td className="p-3 text-end font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                          {m.outflow}M
                        </td>
                        <td className="p-3 text-end font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          +{net}M
                        </td>
                        <td className="p-3 text-end font-mono font-bold text-slate-600 dark:text-purple-200 tabular-nums">
                          {coverage}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 9. ACCOUNTING VIEW (Dedicated General Ledger & Double-Entry Journal)  */}
      {/* ===================================================================== */}
      {activeTab === 'accounting' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1e1538] rounded-2xl p-5 border border-purple-200/80 dark:border-purple-800/60 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {isAr
                      ? 'دفتر اليومية العامة والقيود المحاسبية المزدوجة (General Ledger)'
                      : 'General Accounting Ledger & Automated Double-Entry Journal'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-purple-300/80">
                    {isAr
                      ? 'يتم توليد القيود المحاسبية تلقائياً من المستخلصات وأوامر الدفع المسجلة'
                      : 'Double-entry journal postings automatically generated from IPCs and Payment Orders'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(['ALL', 'INVOICE', 'PAYMENT'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setJournalFilter(tab)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                      journalFilter === tab
                        ? 'bg-purple-700 text-white'
                        : 'bg-purple-50 dark:bg-purple-900/40 text-slate-700 dark:text-purple-200'
                    }`}
                  >
                    {tab === 'ALL'
                      ? isAr
                        ? 'جميع القيود'
                        : 'All Entries'
                      : tab === 'INVOICE'
                      ? isAr
                        ? 'قيود المستخلصات'
                        : 'Invoice Postings'
                      : isAr
                      ? 'قيود السداد'
                      : 'Payment Postings'}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-start border-collapse">
                <thead>
                  <tr className="bg-[#ede7f8] dark:bg-purple-900/50 text-[#231445] dark:text-purple-100 font-extrabold">
                    <th className="p-3 text-start rounded-s-lg">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="p-3 text-start">{isAr ? 'المرجع' : 'Ref #'}</th>
                    <th className="p-3 text-start">
                      {isAr ? 'الحساب المدين (Debit)' : 'Debit Account (Dr)'}
                    </th>
                    <th className="p-3 text-start">
                      {isAr ? 'الحساب الدائن (Credit)' : 'Credit Account (Cr)'}
                    </th>
                    <th className="p-3 text-start">{isAr ? 'المشروع' : 'Cost Center'}</th>
                    <th className="p-3 text-end rounded-e-lg">
                      {isAr ? 'القيمة (ج.م)' : 'Amount (EGP)'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100 dark:divide-purple-800/40">
                  {journalEntries.map((je) => (
                    <tr key={je.id} className="hover:bg-purple-50/40 dark:hover:bg-purple-900/20">
                      <td className="p-3 font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                        {je.date}
                      </td>
                      <td className="p-3 font-mono font-bold text-purple-700 dark:text-purple-300 tabular-nums">
                        {je.refNo}
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {isAr ? je.accountDrAr : je.accountDrEn}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-purple-200">
                        {isAr ? je.accountCrAr : je.accountCrEn}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">
                        {isAr ? je.projectAr : je.projectEn}
                      </td>
                      <td className="p-3 text-end font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {formatNumber(je.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 10. SETTINGS VIEW (Workspace Preferences, Grid Reset & Backup)        */}
      {/* ===================================================================== */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-[#1e1538] rounded-2xl p-6 border border-purple-200/80 dark:border-purple-800/60 shadow-xs max-w-3xl space-y-5">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-purple-700 dark:text-purple-300" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {isAr
                ? 'إعدادات النظام وتخصيص شبكة لوحة المعلومات والتخزين المحلي'
                : 'System Preferences, Workspace Grid Layout & LocalStorage Persistence'}
            </h3>
          </div>

          <div className="space-y-3">
            {/* Theme Switch */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/40">
              <div className="flex items-center gap-3">
                {theme === 'light' ? (
                  <Sun className="w-5 h-5 text-amber-500" />
                ) : (
                  <Moon className="w-5 h-5 text-purple-300" />
                )}
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {isAr ? 'الوضع الليلي / الفاتح' : 'Appearance Theme (Light / Dark)'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-purple-300">
                    {isAr
                      ? `الوضع الحالي: ${theme === 'dark' ? 'داكن' : 'فاتح'}`
                      : `Current mode: ${theme.toUpperCase()}`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => dispatch(toggleTheme())}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold cursor-pointer"
              >
                {isAr ? 'تبديل المظهر' : 'Toggle Theme'}
              </button>
            </div>

            {/* Language Switch */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/40">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {isAr ? 'لغة الواجهة والاتجاه (RTL / LTR)' : 'Interface Language (EN / AR)'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-purple-300">
                    {isAr ? 'العربية (من اليمين لليسار)' : 'English (Left-to-Right)'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => dispatch(toggleLanguage())}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold cursor-pointer"
              >
                {isAr ? 'Switch to English' : 'التبديل للعربية'}
              </button>
            </div>

            {/* Reset Drag & Drop Grid Layout */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/40">
              <div className="flex items-center gap-3">
                <LayoutGrid className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {isAr
                      ? 'إعادة ضبط شبكة السحب والإفلات (React Grid Layout)'
                      : 'Reset Dashboard Drag-and-Drop Grid Layout'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-purple-300">
                    {isAr
                      ? 'استعادة المواضع والأحجام الافتراضية لبطاقات مؤشرات الأداء والرسوم البيانية'
                      : 'Restore default card positions and dimensions across all responsive breakpoints'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => dispatch(resetDashboardLayouts())}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold cursor-pointer"
              >
                {t.actions.resetLayout}
              </button>
            </div>

            {/* Auto-Save Status, JSON Backup & Factory Reset */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/40">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {isAr
                      ? 'الحفظ التلقائي والنسخ الاحتياطي (Auto-Save)'
                      : 'Automatic LocalStorage Sync & State Backup'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-purple-300 tabular-nums">
                    {isAr ? 'آخر مزامنة:' : 'Last synced:'}{' '}
                    {new Date(lastSavedAt).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportBackupJson}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-200 text-xs font-bold hover:bg-purple-100/60 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isAr ? 'نسخة احتياطية JSON' : 'Backup JSON'}</span>
                </button>
                <button
                  onClick={() => dispatch(resetDefaultData())}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.actions.resetData}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
