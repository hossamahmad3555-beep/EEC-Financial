import { FinancialState } from '../types/financial';

const escapeCsvCell = (value: string | number): string => {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportFinancialDashboardToCsv = (state: FinancialState): void => {
  const isAr = state.language === 'ar';
  const lines: (string | number)[][] = [];

  // 1. Header & Metadata Section
  lines.push([
    isAr
      ? 'الشركة المصرية الهندسية للمقاولات (EEC) - التقرير المالي الشامل'
      : 'Egyptian Engineering Company (EEC) - Financial Dashboard Export',
  ]);
  lines.push([
    isAr ? 'السنة المالية' : 'Fiscal Year',
    state.fiscalYear,
    isAr ? 'المشروع المحدد' : 'Project Filter',
    state.selectedProject,
    isAr ? 'الفترة' : 'Period',
    state.period,
    isAr ? 'تاريخ التصدير' : 'Exported At',
    new Date().toISOString(),
  ]);
  lines.push([]);

  // 2. KPI Summary Metrics
  const executedPct =
    state.totalContracts > 0
      ? ((state.executedValue / state.totalContracts) * 100).toFixed(1)
      : '0.0';
  const paymentsPct =
    state.totalInvoices > 0
      ? ((state.totalPayments / state.totalInvoices) * 100).toFixed(1)
      : '0.0';
  const remainingPct =
    state.totalContracts > 0
      ? ((state.remainingValue / state.totalContracts) * 100).toFixed(1)
      : '0.0';

  lines.push([
    isAr ? '=== مؤشرات الأداء الرئيسية (KPIs) ===' : '=== KEY PERFORMANCE INDICATORS (KPIs) ===',
  ]);
  lines.push([
    isAr ? 'المؤشر' : 'Metric',
    isAr ? 'القيمة (ج.م)' : 'Amount (EGP)',
    isAr ? 'النسبة %' : 'Percentage (%)',
  ]);
  lines.push([
    isAr ? 'إجمالي العقود' : 'Total Contracts',
    state.totalContracts,
    '100.0%',
  ]);
  lines.push([
    isAr ? 'قيمة الأعمال المنفذة' : 'Executed Value',
    state.executedValue,
    `${executedPct}%`,
  ]);
  lines.push([
    isAr ? 'إجمالي الفواتير والمستخلصات' : 'Total Invoices',
    state.totalInvoices,
    '-',
  ]);
  lines.push([
    isAr ? 'إجمالي المدفوعات' : 'Total Payments',
    state.totalPayments,
    `${paymentsPct}%`,
  ]);
  lines.push([
    isAr ? 'القيمة المتبقية' : 'Remaining Value',
    state.remainingValue,
    `${remainingPct}%`,
  ]);
  lines.push([]);

  // 3. Monthly Cash Flow (EGP Millions)
  lines.push([
    isAr
      ? '=== التدفقات النقدية الشهرية (مليون ج.م) ==='
      : '=== MONTHLY CASH FLOW (MILLIONS EGP) ===',
  ]);
  lines.push([
    isAr ? 'الشهر' : 'Month',
    isAr ? 'التدفقات الداخلة (المقبوضات)' : 'Inflow (Receipts) [M EGP]',
    isAr ? 'التدفقات الخارجة (المدفوعات)' : 'Outflow (Payments) [M EGP]',
    isAr ? 'صافي التدفق النقدي' : 'Net Cash Flow [M EGP]',
  ]);
  state.cashFlow.forEach((m) => {
    lines.push([
      isAr ? m.labelAr : m.labelEn,
      m.inflow,
      m.outflow,
      m.inflow - m.outflow,
    ]);
  });
  lines.push([]);

  // 4. Project Financial Status
  lines.push([
    isAr
      ? '=== الموقف المالي للمشروعات واستهلاك الموازنة ==='
      : '=== PROJECT FINANCIAL STATUS & BUDGET UTILIZATION ===',
  ]);
  lines.push([
    isAr ? 'كود المشروع' : 'Project ID',
    isAr ? 'اسم المشروع' : 'Project Name',
    isAr ? 'مدير المشروع' : 'Project Manager',
    isAr ? 'قيمة العقد (ج.م)' : 'Contract Value (EGP)',
    isAr ? 'الموازنة المخصصة (ج.م)' : 'Allocated Budget (EGP)',
    isAr ? 'المنصرف الفعلي (ج.م)' : 'Actual Spent (EGP)',
    isAr ? 'استهلاك الموازنة %' : 'Budget Utilization (%)',
    isAr ? 'حالة التنبيه (>90%)' : 'Threshold Status (>90%)',
    isAr ? 'نسبة الإنجاز %' : 'Completion (%)',
  ]);
  state.projects.forEach((p) => {
    const alloc = p.allocatedBudget || Math.round(p.contractValue * 0.88);
    const spent = p.actualSpent ?? p.executedValue;
    const utilPct = alloc > 0 ? ((spent / alloc) * 100).toFixed(1) : '0.0';
    const isOver90 = Number(utilPct) > 90;
    lines.push([
      p.id,
      isAr ? p.nameAr : p.nameEn,
      isAr ? p.managerAr : p.managerEn,
      p.contractValue,
      alloc,
      spent,
      `${utilPct}%`,
      isOver90 ? (isAr ? 'تجاوز 90%' : 'ALERT > 90%') : isAr ? 'ضمن الموازنة' : 'Within Limit',
      `${p.completionPercentage}%`,
    ]);
  });
  lines.push([]);

  // 5. Budget vs. Actual
  lines.push([
    isAr
      ? '=== الموازنة مقابل الفعلي (مليون ج.م) ==='
      : '=== BUDGET VS. ACTUAL (MILLIONS EGP) ===',
  ]);
  lines.push([
    isAr ? 'التخصص الهندسي' : 'Category',
    isAr ? 'الموازنة التقديرية (مليون ج.م)' : 'Planned Budget (M EGP)',
    isAr ? 'التكلفة الفعلية (مليون ج.م)' : 'Actual Cost (M EGP)',
    isAr ? 'الوفر / الانحراف (مليون ج.م)' : 'Variance (M EGP)',
  ]);
  state.budgetVsActual.forEach((b) => {
    lines.push([
      isAr ? b.nameAr : b.nameEn,
      b.budget,
      b.actual,
      b.budget - b.actual,
    ]);
  });
  lines.push([]);

  // 6. Aging of Payables
  lines.push([
    isAr
      ? '=== أعمار الديون الدائنة (المدفوعات) ==='
      : '=== AGING OF PAYABLES ===',
  ]);
  lines.push([
    isAr ? 'فترة الاستحقاق' : 'Due Period',
    isAr ? 'المبلغ (ج.م)' : 'Amount (EGP)',
    isAr ? 'النسبة %' : 'Percentage (%)',
  ]);
  state.agingPayables.forEach((ap) => {
    lines.push([
      isAr ? ap.periodAr : ap.periodEn,
      ap.amount,
      `${ap.percentage.toFixed(1)}%`,
    ]);
  });
  lines.push([]);

  // 7. Aging of Receivables
  lines.push([
    isAr
      ? '=== أعمار الديون المدينة (المستحقات) ==='
      : '=== AGING OF RECEIVABLES ===',
  ]);
  lines.push([
    isAr ? 'فترة الاستحقاق' : 'Due Period',
    isAr ? 'المبلغ (ج.م)' : 'Amount (EGP)',
    isAr ? 'النسبة %' : 'Percentage (%)',
  ]);
  state.agingReceivables.forEach((ar) => {
    lines.push([
      isAr ? ar.periodAr : ar.periodEn,
      ar.amount,
      `${ar.percentage.toFixed(1)}%`,
    ]);
  });

  const csvString =
    '\uFEFF' + lines.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');

  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `EEC_Financial_Dashboard_${state.fiscalYear}_${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
