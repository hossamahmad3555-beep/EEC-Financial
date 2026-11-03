import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  AreaChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Building2,
  Coins,
  CalendarClock,
  HandCoins,
  BarChart3,
  Zap,
  FilePlus2,
  CreditCard,
  Download,
  FileSpreadsheet,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Cog,
  Activity,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  BellRing,
  PlusCircle,
  Search,
  X,
  Printer,
  GripVertical,
  Lock,
  Unlock,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveGridLayout,
  useContainerWidth,
  type Layout,
  type ResponsiveLayouts,
} from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { useAppDispatch, useAppSelector } from '../store/store';
import {
  setFiscalYear,
  setSelectedProject,
  setPeriod,
  setActiveTab,
  setSearchQuery,
  adjustProjectBudgetAndSpend,
  DEFAULT_DASHBOARD_LAYOUTS,
  updateDashboardLayouts,
  resetDashboardLayouts,
} from '../store/financialSlice';
import { DashboardGridItemLayout } from '../types/financial';
import { translations } from '../i18n/translations';
import { FinancialKpiHighlights } from './FinancialKpiHighlights';
import { ProjectMilestonesTimeline } from './ProjectMilestonesTimeline';
import { ProjectDetailCommentsSection } from './ProjectDetailCommentsSection';
import { TrendAnalysisModule } from './TrendAnalysisModule';

interface DashboardViewProps {
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

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenQuickAction,
  onTriggerPrintView,
}) => {
  const dispatch = useAppDispatch();
  const {
    language,
    theme,
    fiscalYear,
    selectedProject,
    period,
    searchQuery,
    totalContracts,
    executedValue,
    totalInvoices,
    totalPayments,
    remainingValue,
    cashFlow,
    projects,
    agingPayables,
    agingReceivables,
    budgetVsActual,
    dashboardLayouts,
  } = useAppSelector((state) => state.financial);

  const t = translations[language];
  const isAr = language === 'ar';

  const { width: gridWidth, containerRef: gridContainerRef } = useContainerWidth({
    initialWidth: 1280,
  });
  const [isGridUnlocked, setIsGridUnlocked] = useState<boolean>(true);
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);
  const [rechartMode, setRechartMode] = useState<'composed' | 'bar' | 'area'>('composed');
  const [showThresholdDrawer, setShowThresholdDrawer] = useState<boolean>(false);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);

  const activeLayouts = useMemo<ResponsiveLayouts>(() => {
    if (
      dashboardLayouts &&
      typeof dashboardLayouts === 'object' &&
      Array.isArray(dashboardLayouts.lg)
    ) {
      const merged: ResponsiveLayouts = {};
      Object.keys(DEFAULT_DASHBOARD_LAYOUTS).forEach((bp) => {
        const defaultList = DEFAULT_DASHBOARD_LAYOUTS[bp] || [];
        const savedList = dashboardLayouts[bp];
        if (Array.isArray(savedList) && savedList.length > 0) {
          const existingIds = new Set(savedList.map((item) => item.i));
          const missingDefaults = defaultList.filter((item) => !existingIds.has(item.i));
          merged[bp] = [...savedList, ...missingDefaults];
        } else {
          merged[bp] = defaultList;
        }
      });
      return merged;
    }
    return DEFAULT_DASHBOARD_LAYOUTS;
  }, [dashboardLayouts]);

  const handleGridLayoutChange = (_currentLayout: Layout, allLayouts: ResponsiveLayouts) => {
    const serialized: Record<string, DashboardGridItemLayout[]> = {};
    Object.entries(allLayouts).forEach(([bp, list]) => {
      if (Array.isArray(list)) {
        serialized[bp] = list.map((item) => ({
          i: item.i,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
          minW: item.minW,
          minH: item.minH,
          maxW: item.maxW,
          maxH: item.maxH,
        }));
      }
    });
    dispatch(updateDashboardLayouts(serialized));
  };

  // Calculate filtered / scaled metrics when user changes Fiscal Year, Project, or Period
  const yearMultiplier = fiscalYear === '2026' ? 1 : fiscalYear === '2025' ? 0.88 : 0.76;
  const periodMultiplier =
    period === 'YTD' ? 1 : period === 'Q1' ? 0.24 : period === 'Q2' ? 0.26 : period === 'Q3' ? 0.25 : 0.25;

  // Real-time computation of budget utilization per project & >90% threshold detection
  const projectsBudgetAnalysis = useMemo(() => {
    return projects.map((p) => {
      const alloc = p.allocatedBudget || Math.round(p.contractValue * 0.88);
      const spent = p.actualSpent ?? p.executedValue;
      const utilizationPct = alloc > 0 ? Number(((spent / alloc) * 100).toFixed(1)) : 0;
      const isOver90 = utilizationPct > 90;
      return {
        ...p,
        allocatedBudget: alloc,
        actualSpent: spent,
        utilizationPct,
        isOver90,
      };
    });
  }, [projects]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredProjectsAnalysis = useMemo(() => {
    if (!normalizedQuery) return projectsBudgetAnalysis;
    return projectsBudgetAnalysis.filter(
      (p) =>
        p.id.toLowerCase().includes(normalizedQuery) ||
        p.nameEn.toLowerCase().includes(normalizedQuery) ||
        p.nameAr.toLowerCase().includes(normalizedQuery) ||
        p.managerEn.toLowerCase().includes(normalizedQuery) ||
        p.managerAr.toLowerCase().includes(normalizedQuery)
    );
  }, [projectsBudgetAnalysis, normalizedQuery]);

  const flaggedOver90Projects = useMemo(
    () =>
      filteredProjectsAnalysis.filter(
        (p) => p.isOver90 && !dismissedAlertIds.includes(p.id)
      ),
    [filteredProjectsAnalysis, dismissedAlertIds]
  );

  const totalOver90Count = useMemo(
    () => filteredProjectsAnalysis.filter((p) => p.isOver90).length,
    [filteredProjectsAnalysis]
  );

  const activeProjectObj = useMemo(
    () => projects.find((p) => p.id === selectedProject),
    [projects, selectedProject]
  );

  const displayMetrics = useMemo(() => {
    const scale = yearMultiplier * periodMultiplier;
    if (activeProjectObj) {
      const cVal = Math.round(activeProjectObj.contractValue * scale);
      const eVal = Math.round(activeProjectObj.executedValue * scale);
      const iVal = Math.round(activeProjectObj.invoicedValue * scale);
      const pVal = Math.round(activeProjectObj.paidValue * scale);
      const rVal = Math.max(0, cVal - eVal);
      const execPct = cVal > 0 ? ((eVal / cVal) * 100).toFixed(1) : '0.0';
      const payPct = iVal > 0 ? ((pVal / iVal) * 100).toFixed(1) : '0.0';
      const remPct = cVal > 0 ? ((rVal / cVal) * 100).toFixed(1) : '0.0';
      return {
        contracts: cVal,
        executed: eVal,
        invoices: iVal,
        payments: pVal,
        remaining: rVal,
        execPct,
        payPct,
        remPct,
      };
    }

    const cVal = Math.round(totalContracts * scale);
    const eVal = Math.round(executedValue * scale);
    const iVal = Math.round(totalInvoices * scale);
    const pVal = Math.round(totalPayments * scale);
    const rVal = Math.round(remainingValue * scale);
    const execPct = cVal > 0 ? ((eVal / cVal) * 100).toFixed(1) : '69.6';
    const payPct = iVal > 0 ? ((pVal / iVal) * 100).toFixed(1) : '92.9';
    const remPct = cVal > 0 ? ((rVal / cVal) * 100).toFixed(1) : '30.4';

    return {
      contracts: cVal,
      executed: eVal,
      invoices: iVal,
      payments: pVal,
      remaining: rVal,
      execPct,
      payPct,
      remPct,
    };
  }, [
    activeProjectObj,
    totalContracts,
    executedValue,
    totalInvoices,
    totalPayments,
    remainingValue,
    yearMultiplier,
    periodMultiplier,
  ]);

  const formatNumber = (num: number) => num.toLocaleString('en-US');

  // Cash flow chart coordinates (SVG viewBox: 0 0 540 195)
  const chartLeft = 44;
  const chartRight = 522;
  const chartTop = 16;
  const chartBottom = 164;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;
  const maxCashFlowY = 120;

  const projectRatio = activeProjectObj
    ? activeProjectObj.contractValue / totalContracts
    : 1;

  const scaledCashFlow = useMemo(() => {
    return cashFlow.map((item) => ({
      ...item,
      inflowVal: Math.round(item.inflow * yearMultiplier * projectRatio),
      outflowVal: Math.round(item.outflow * yearMultiplier * projectRatio),
    }));
  }, [cashFlow, yearMultiplier, projectRatio]);

  // Monthly Project Expenses vs. Budget dataset for Recharts
  const monthlyBudgetWeights = [0.055, 0.062, 0.072, 0.065, 0.078, 0.085, 0.088, 0.084, 0.095, 0.098, 0.108, 0.11];
  const totalCategoryBudgetM = useMemo(
    () => budgetVsActual.reduce((acc, c) => acc + c.budget, 0),
    [budgetVsActual]
  );
  const totalCategoryActualM = useMemo(
    () => budgetVsActual.reduce((acc, c) => acc + c.actual, 0),
    [budgetVsActual]
  );

  const monthlyExpensesChartData = useMemo(() => {
    const totalOutflowRaw = cashFlow.reduce((acc, m) => acc + m.outflow, 0) || 1;
    let cumBudget = 0;
    let cumExpenses = 0;

    const allMonths = cashFlow.map((item, idx) => {
      const plannedBudget = Math.round(
        totalCategoryBudgetM * monthlyBudgetWeights[idx] * yearMultiplier * projectRatio
      );
      const actualExpenses = Math.round(
        (item.outflow / totalOutflowRaw) *
          totalCategoryActualM *
          yearMultiplier *
          projectRatio
      );
      cumBudget += plannedBudget;
      cumExpenses += actualExpenses;
      const variance = plannedBudget - actualExpenses;

      return {
        monthKey: item.monthKey,
        name: isAr ? item.labelAr : item.labelEn,
        plannedBudget,
        actualExpenses,
        variance,
        cumBudget,
        cumExpenses,
      };
    });

    if (period === 'Q1') return allMonths.slice(0, 3);
    if (period === 'Q2') return allMonths.slice(3, 6);
    if (period === 'Q3') return allMonths.slice(6, 9);
    if (period === 'Q4') return allMonths.slice(9, 12);
    return allMonths;
  }, [
    cashFlow,
    totalCategoryBudgetM,
    totalCategoryActualM,
    yearMultiplier,
    projectRatio,
    isAr,
    period,
  ]);

  const monthlyTotalsSummary = useMemo(() => {
    const budgetSum = monthlyExpensesChartData.reduce((acc, m) => acc + m.plannedBudget, 0);
    const expensesSum = monthlyExpensesChartData.reduce((acc, m) => acc + m.actualExpenses, 0);
    const varianceSum = budgetSum - expensesSum;
    const variancePct = budgetSum > 0 ? ((varianceSum / budgetSum) * 100).toFixed(1) : '0.0';
    return { budgetSum, expensesSum, varianceSum, variancePct };
  }, [monthlyExpensesChartData]);

  const getPointCoords = (index: number, val: number) => {
    const x = chartLeft + (index / (scaledCashFlow.length - 1)) * chartWidth;
    const clamped = Math.min(maxCashFlowY, Math.max(0, val));
    const y = chartBottom - (clamped / maxCashFlowY) * chartHeight;
    return { x, y };
  };

  const inflowPoints = scaledCashFlow.map((d, idx) => getPointCoords(idx, d.inflowVal));
  const outflowPoints = scaledCashFlow.map((d, idx) => getPointCoords(idx, d.outflowVal));

  const inflowPolyline = inflowPoints.map((p) => `${p.x},${p.y}`).join(' ');
  const outflowPolyline = outflowPoints.map((p) => `${p.x},${p.y}`).join(' ');

  const inflowAreaPath = `M ${inflowPoints[0].x},${chartBottom} L ${inflowPoints
    .map((p) => `${p.x},${p.y}`)
    .join(' L ')} L ${inflowPoints[inflowPoints.length - 1].x},${chartBottom} Z`;

  const outflowAreaPath = `M ${outflowPoints[0].x},${chartBottom} L ${outflowPoints
    .map((p) => `${p.x},${p.y}`)
    .join(' L ')} L ${outflowPoints[outflowPoints.length - 1].x},${chartBottom} Z`;

  // Totals for Aging tables
  const totalPayablesAging = agingPayables.reduce((acc, i) => acc + i.amount, 0);
  const totalReceivablesAging = agingReceivables.reduce((acc, i) => acc + i.amount, 0);

  // Donut Chart Calculations
  const execPercentageNum = parseFloat(displayMetrics.execPct);
  const remPercentageNum = parseFloat(displayMetrics.remPct);
  const donutRadius = 64;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const purpleStrokeDash = (execPercentageNum / 100) * donutCircumference;
  const goldStrokeDash = (remPercentageNum / 100) * donutCircumference;

  return (
    <div className="space-y-3.5 pb-4">
      {/* Top Title & Filter Controls Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1">
        {/* Left Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-[#4a2694] dark:text-purple-300 shadow-2xs">
            <TrendingUp className="w-5 h-5 stroke-[2.4]" />
          </div>
          <h2 className="text-xl sm:text-[23px] font-extrabold text-[#1f1240] dark:text-white tracking-tight">
            {t.dashboardTitle}
          </h2>
        </div>

        {/* Right Search Bar & Filter Dropdowns (Hidden in Print View) */}
        <div className="no-print print:hidden flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Quick Project Search Bar by Name or Code */}
          <div className="relative min-w-[230px] sm:min-w-[265px] flex-1 sm:flex-initial">
            <Search
              className={`w-3.5 h-3.5 text-[#4c2896] dark:text-purple-300 absolute top-1/2 -translate-y-1/2 pointer-events-none ${
                isAr ? 'right-3' : 'left-3'
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              placeholder={t.actions.projectSearchPlaceholder}
              aria-label={t.actions.projectSearchPlaceholder}
              className={`w-full bg-white dark:bg-[#1e1438] border border-purple-200/90 dark:border-purple-700/70 text-[#231445] dark:text-white placeholder:text-slate-400 dark:placeholder:text-purple-300/50 text-xs sm:text-[13px] font-semibold rounded-full py-1.5 shadow-2xs focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                isAr ? 'pr-8 pl-7' : 'pl-8 pr-7'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => dispatch(setSearchQuery(''))}
                aria-label={t.actions.clearSearch}
                className={`w-4 h-4 rounded-full bg-purple-100 hover:bg-purple-200 dark:bg-purple-800 dark:hover:bg-purple-700 text-[#3b256e] dark:text-purple-200 flex items-center justify-center absolute top-1/2 -translate-y-1/2 cursor-pointer ${
                  isAr ? 'left-2.5' : 'right-2.5'
                }`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {/* Fiscal Year */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="fiscal-year-select"
              className="text-xs sm:text-[13px] font-bold text-[#231445] dark:text-purple-200 whitespace-nowrap"
            >
              {t.fiscalYear}
            </label>
            <div className="relative">
              <select
                id="fiscal-year-select"
                value={fiscalYear}
                onChange={(e) =>
                  dispatch(setFiscalYear(e.target.value as '2026' | '2025' | '2024'))
                }
                className="appearance-none bg-white dark:bg-[#1e1438] border border-purple-200/90 dark:border-purple-700/70 text-[#231445] dark:text-white text-xs sm:text-[13px] font-semibold rounded-full pl-3.5 pr-8 py-1.5 shadow-2xs focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer tabular-nums"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#3b256e] dark:text-purple-300 absolute top-1/2 -translate-y-1/2 pointer-events-none ${
                  isAr ? 'left-2.5' : 'right-2.5'
                }`}
              />
            </div>
          </div>

          {/* Project Filter */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="project-select"
              className="text-xs sm:text-[13px] font-bold text-[#231445] dark:text-purple-200 whitespace-nowrap"
            >
              {t.project}
            </label>
            <div className="relative">
              <select
                id="project-select"
                value={selectedProject}
                onChange={(e) => dispatch(setSelectedProject(e.target.value))}
                className="appearance-none bg-white dark:bg-[#1e1438] border border-purple-200/90 dark:border-purple-700/70 text-[#231445] dark:text-white text-xs sm:text-[13px] font-semibold rounded-full pl-3.5 pr-8 py-1.5 shadow-2xs focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="ALL">{t.allProjects}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {isAr ? p.nameAr : p.nameEn}
                  </option>
                ))}
              </select>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#3b256e] dark:text-purple-300 absolute top-1/2 -translate-y-1/2 pointer-events-none ${
                  isAr ? 'left-2.5' : 'right-2.5'
                }`}
              />
            </div>
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="period-select"
              className="text-xs sm:text-[13px] font-bold text-[#231445] dark:text-purple-200 whitespace-nowrap"
            >
              {t.period}
            </label>
            <div className="relative">
              <select
                id="period-select"
                value={period}
                onChange={(e) =>
                  dispatch(setPeriod(e.target.value as 'YTD' | 'Q1' | 'Q2' | 'Q3' | 'Q4'))
                }
                className="appearance-none bg-white dark:bg-[#1e1438] border border-purple-200/90 dark:border-purple-700/70 text-[#231445] dark:text-white text-xs sm:text-[13px] font-semibold rounded-full pl-3.5 pr-8 py-1.5 shadow-2xs focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="YTD">{t.yearToDate}</option>
                <option value="Q1">{t.q1}</option>
                <option value="Q2">{t.q2}</option>
                <option value="Q3">{t.q3}</option>
                <option value="Q4">{t.q4}</option>
              </select>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#3b256e] dark:text-purple-300 absolute top-1/2 -translate-y-1/2 pointer-events-none ${
                  isAr ? 'left-2.5' : 'right-2.5'
                }`}
              />
            </div>
          </div>

          {/* Grid Lock / Customize Toggle Button */}
          <button
            type="button"
            onClick={() => setIsGridUnlocked((prev) => !prev)}
            title={t.actions.dragHint}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-[13px] font-bold shadow-2xs transition-colors cursor-pointer whitespace-nowrap border ${
              isGridUnlocked
                ? 'bg-[#3b256e] dark:bg-purple-600 text-white border-[#3b256e] dark:border-purple-500'
                : 'bg-white dark:bg-[#1e1438] text-[#231445] dark:text-white border-purple-200/90 dark:border-purple-700/70 hover:bg-purple-50 dark:hover:bg-purple-900/40'
            }`}
          >
            {isGridUnlocked ? (
              <Unlock className="w-3.5 h-3.5 text-amber-300" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-[#4c2896] dark:text-purple-300" />
            )}
            <span>{isGridUnlocked ? t.actions.lockLayout : t.actions.unlockLayout}</span>
          </button>

          {/* Reset Grid Layout Button */}
          <button
            type="button"
            onClick={() => dispatch(resetDashboardLayouts())}
            title={t.actions.resetLayout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#1e1438] hover:bg-purple-50 dark:hover:bg-purple-900/40 text-[#231445] dark:text-white border border-purple-200/90 dark:border-purple-700/70 text-xs sm:text-[13px] font-bold shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#4c2896] dark:text-purple-300" />
            <span className="hidden xl:inline">{t.actions.resetLayout}</span>
          </button>

          {/* Print View Button */}
          <button
            type="button"
            onClick={() => (onTriggerPrintView ? onTriggerPrintView() : window.print())}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1e1438] hover:bg-purple-50 dark:hover:bg-purple-900/40 text-[#231445] dark:text-white border border-purple-200/90 dark:border-purple-700/70 text-xs sm:text-[13px] font-bold shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5 text-[#4c2896] dark:text-purple-300" />
            <span>{t.actions.printView}</span>
          </button>
        </div>
      </div>

      {/* Real-Time Budget Threshold Notification System (> 90% Allocated Budget) */}
      <div className="rounded-2xl border border-amber-300/90 dark:border-amber-700/70 bg-gradient-to-r from-amber-50/95 via-white to-rose-50/90 dark:from-[#26152b] dark:via-[#1e1436] dark:to-[#291326] p-3.5 shadow-xs transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left Alert Status Header */}
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                totalOver90Count > 0
                  ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300'
                  : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300'
              }`}
            >
              {totalOver90Count > 0 ? (
                <ShieldAlert className="w-5 h-5 stroke-[2.3]" />
              ) : (
                <CheckCircle2 className="w-5 h-5 stroke-[2.3]" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xs sm:text-sm font-extrabold text-[#1f1240] dark:text-white">
                  {t.widgets.budgetAlertTitle}
                </h3>
                <span className="text-xs font-extrabold text-rose-700 dark:text-rose-300 tabular-nums">
                  · {totalOver90Count}{' '}
                  {isAr ? 'مشروعات متجاوزة للحد' : 'Flagged Projects'}
                </span>
              </div>
              <p className="text-[11.5px] text-slate-600 dark:text-purple-200/80">
                {totalOver90Count > 0
                  ? t.widgets.budgetAlertSubtitle
                  : t.widgets.allWithinBudget}
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="no-print print:hidden flex flex-wrap items-center gap-2">
            {dismissedAlertIds.length > 0 && (
              <button
                onClick={() => setDismissedAlertIds([])}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-purple-800 dark:text-purple-200 hover:bg-purple-100/70 dark:hover:bg-purple-900/40 transition-colors cursor-pointer whitespace-nowrap"
              >
                {isAr ? 'إظهار التنبيهات المخفية' : 'Restore Dismissed Alerts'}
              </button>
            )}
            <button
              onClick={() => setShowThresholdDrawer((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3b256e] hover:bg-[#2c1a54] dark:bg-purple-700 dark:hover:bg-purple-600 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>{t.widgets.manageThresholdsBtn}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  showThresholdDrawer ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Real-Time Flagged Project Cards (> 90%) */}
        {flaggedOver90Projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-amber-200/70 dark:border-purple-800/60">
            {flaggedOver90Projects.map((proj) => (
              <motion.div
                key={proj.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col justify-between gap-2 p-3 rounded-xl bg-white/95 dark:bg-[#160f2b] border border-rose-200 dark:border-rose-800/70 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span className="text-xs sm:text-[13px] font-extrabold text-[#1f1240] dark:text-white truncate">
                        {isAr ? proj.nameAr : proj.nameEn}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-purple-300/80 mt-0.5 tabular-nums">
                      {t.widgets.spentLabel}:{' '}
                      <strong className="text-rose-600 dark:text-rose-400">
                        {t.kpi.egp} {(proj.actualSpent / 1e6).toFixed(1)}M
                      </strong>{' '}
                      / {t.widgets.allocatedLabel}:{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {t.kpi.egp} {(proj.allocatedBudget / 1e6).toFixed(1)}M
                      </strong>
                    </div>
                  </div>

                  <span className="text-xs font-extrabold text-rose-700 dark:text-rose-300 tabular-nums shrink-0">
                    {proj.utilizationPct}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-rose-100 dark:bg-rose-950 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-600"
                    style={{ width: `${Math.min(100, proj.utilizationPct)}%` }}
                  />
                </div>

                {/* Card Quick Actions */}
                <div className="no-print print:hidden flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        dispatch(
                          adjustProjectBudgetAndSpend({
                            projectId: proj.id,
                            budgetDelta: 15000000,
                          })
                        );
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <PlusCircle className="w-3 h-3" />
                      <span>{t.widgets.topUpBudgetBtn}</span>
                    </button>

                    <button
                      onClick={() =>
                        dispatch(
                          setSelectedProject(
                            selectedProject === proj.id ? 'ALL' : proj.id
                          )
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/40 dark:hover:bg-purple-900/70 text-purple-800 dark:text-purple-200 text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {selectedProject === proj.id
                        ? isAr
                          ? 'عرض الكل'
                          : 'Show All'
                        : isAr
                        ? 'تصفية المشروع'
                        : 'Filter Project'}
                    </button>
                  </div>

                  <button
                    onClick={() =>
                      setDismissedAlertIds((prev) => [...prev, proj.id])
                    }
                    className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {isAr ? 'إخفاء' : 'Dismiss'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Expandable Real-Time Threshold Simulator & Monitor Drawer */}
        {showThresholdDrawer && (
          <div className="no-print print:hidden mt-3 pt-3 border-t border-amber-200/70 dark:border-purple-800/60">
            <div className="text-xs font-bold text-[#231445] dark:text-purple-200 mb-2">
              {isAr
                ? 'مراقبة استهلاك الموازنة لجميع المشروعات في الوقت الفعلي (الحد التحذيري: 90%):'
                : 'Real-Time Project Budget Utilization Matrix (90% Alert Threshold):'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {projectsBudgetAnalysis.map((proj) => (
                <div
                  key={proj.id}
                  className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between gap-2 ${
                    proj.isOver90
                      ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                      : 'bg-white/80 dark:bg-[#160f2b] border-purple-200/70 dark:border-purple-800/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 font-extrabold text-[#1f1240] dark:text-white">
                      <span className="truncate">
                        {isAr ? proj.nameAr : proj.nameEn}
                      </span>
                      <span
                        className={`tabular-nums ${
                          proj.isOver90
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {proj.utilizationPct}%
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-purple-300/80 tabular-nums mt-0.5">
                      {(proj.actualSpent / 1e6).toFixed(1)}M /{' '}
                      {(proj.allocatedBudget / 1e6).toFixed(1)}M EGP
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setDismissedAlertIds((prev) =>
                          prev.filter((id) => id !== proj.id)
                        );
                        dispatch(
                          adjustProjectBudgetAndSpend({
                            projectId: proj.id,
                            spendDelta: 20000000,
                          })
                        );
                      }}
                      className="flex-1 py-1 px-2 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-800/70 text-amber-900 dark:text-amber-200 text-[10.5px] font-bold transition-colors cursor-pointer text-center whitespace-nowrap"
                    >
                      {t.widgets.simulateSpendBtn}
                    </button>
                    <button
                      onClick={() =>
                        dispatch(
                          adjustProjectBudgetAndSpend({
                            projectId: proj.id,
                            budgetDelta: 15000000,
                          })
                        )
                      }
                      className="py-1 px-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:hover:bg-emerald-800/70 text-emerald-900 dark:text-emerald-200 text-[10.5px] font-bold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      +15M
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Drag-and-Drop & Resizable Workspace Grid (react-grid-layout) */}
      <div ref={gridContainerRef} className="w-full" dir="ltr">
        <ResponsiveGridLayout
          width={gridWidth}
          layouts={activeLayouts}
          breakpoints={{ lg: 940, md: 700, sm: 480, xs: 340, xxs: 0 }}
          cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={40}
          margin={[14, 14]}
          containerPadding={[0, 0]}
          dragConfig={{
            enabled: isGridUnlocked,
            handle: '.rgl-drag-handle',
            cancel: 'button, input, select, textarea, a, .no-drag',
            threshold: 3,
          }}
          resizeConfig={{
            enabled: isGridUnlocked,
            handles: ['se', 's', 'e'],
          }}
          onLayoutChange={handleGridLayoutChange}
        >
          {/* GRID ITEM 1: Key Financial KPI Highlights */}
          <div
            key="kpi_highlights"
            dir={isAr ? 'rtl' : 'ltr'}
            className="h-full w-full relative group/rgl"
          >
            {isGridUnlocked && (
              <div
                title={t.actions.dragHint}
                className="rgl-drag-handle no-print print:hidden absolute -top-2.5 right-3 z-20 flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#3b256e] dark:bg-purple-700 text-white text-[10px] font-bold shadow-xs cursor-grab active:cursor-grabbing opacity-80 group-hover/rgl:opacity-100 transition-opacity select-none"
              >
                <GripVertical className="w-3 h-3 text-amber-300" />
                <span>{isAr ? 'سحب' : 'Drag'}</span>
              </div>
            )}
            <FinancialKpiHighlights
              yearMultiplier={yearMultiplier}
              periodMultiplier={periodMultiplier}
            />
          </div>

          {/* GRID ITEM 2: 5 Executive KPI Summary Cards */}
          <div
            key="summary_kpis"
            dir={isAr ? 'rtl' : 'ltr'}
            className="h-full w-full relative group/rgl"
          >
            {isGridUnlocked && (
              <div
                title={t.actions.dragHint}
                className="rgl-drag-handle no-print print:hidden absolute -top-2.5 right-3 z-20 flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#3b256e] dark:bg-purple-700 text-white text-[10px] font-bold shadow-xs cursor-grab active:cursor-grabbing opacity-80 group-hover/rgl:opacity-100 transition-opacity select-none"
              >
                <GripVertical className="w-3 h-3 text-amber-300" />
                <span>{isAr ? 'سحب' : 'Drag'}</span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 h-full">
              {/* KPI 1: Total Contracts */}
              <motion.div
                whileHover={{ y: -2 }}
                onClick={() => dispatch(setActiveTab('contracts'))}
                className="bg-gradient-to-br from-white via-[#fbf9ff] to-[#f3eefc] dark:from-[#1e1538] dark:via-[#1b1233] dark:to-[#170f2c] rounded-2xl p-3.5 border border-purple-200/80 dark:border-purple-800/60 shadow-[0_4px_14px_rgba(68,38,133,0.08)] flex items-center gap-3 cursor-pointer h-full"
              >
                <div className="w-12 h-12 rounded-full bg-[#e5d9fb] dark:bg-purple-900/60 flex items-center justify-center shrink-0 shadow-inner">
                  <svg viewBox="0 0 36 36" className="w-7 h-7 text-[#582da8] dark:text-purple-300">
                    <ellipse cx="14" cy="14" rx="8" ry="3.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
                    <path d="M6 14v4c0 1.9 3.6 3.5 8 3.5s8-1.6 8-3.5v-4" fill="none" stroke="currentColor" strokeWidth="2.2" />
                    <path d="M6 18v4c0 1.9 3.6 3.5 8 3.5s8-1.6 8-3.5v-4" fill="none" stroke="currentColor" strokeWidth="2.2" />
                    <path d="M6 22v4c0 1.9 3.6 3.5 8 3.5s8-1.6 8-3.5v-4" fill="none" stroke="currentColor" strokeWidth="2.2" />
                    <ellipse cx="24" cy="11" rx="6" ry="2.6" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M22 16.5c4.2 0 6-1.2 6-2.6v-3" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M22 20c4.2 0 6-1.2 6-2.6v-3" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#2b1d52] dark:text-purple-200 truncate">
                    {t.kpi.totalContracts}
                  </div>
                  <div className="text-sm xl:text-[15.5px] font-extrabold text-[#170e2e] dark:text-white tabular-nums tracking-tight leading-tight mt-0.5 whitespace-nowrap">
                    {t.kpi.egp} {formatNumber(displayMetrics.contracts)}
                  </div>
                </div>
              </motion.div>

              {/* KPI 2: Executed Value */}
              <motion.div
                whileHover={{ y: -2 }}
                onClick={() => dispatch(setActiveTab('cost_control'))}
                className="bg-gradient-to-br from-white via-[#fbf9ff] to-[#f3eefc] dark:from-[#1e1538] dark:via-[#1b1233] dark:to-[#170f2c] rounded-2xl p-3.5 border border-purple-200/80 dark:border-purple-800/60 shadow-[0_4px_14px_rgba(68,38,133,0.08)] flex items-center gap-3 cursor-pointer h-full"
              >
                <div className="w-12 h-12 rounded-full bg-[#dcfce7] dark:bg-emerald-900/50 flex items-center justify-center shrink-0 shadow-inner">
                  <svg viewBox="0 0 36 36" className="w-7 h-7 text-[#22a849] dark:text-emerald-400">
                    <path d="M18 6a12 12 0 1 0 12 12H18V6z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
                    <path d="M21 5.5A11.5 11.5 0 0 1 30.5 15H21V5.5z" fill="currentColor" opacity="0.25" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#2b1d52] dark:text-purple-200 truncate">
                    {t.kpi.executedValue}
                  </div>
                  <div className="text-sm xl:text-[15.5px] font-extrabold text-[#170e2e] dark:text-white tabular-nums tracking-tight leading-tight mt-0.5 whitespace-nowrap">
                    {t.kpi.egp} {formatNumber(displayMetrics.executed)}
                  </div>
                  <div className="text-xs font-extrabold text-[#2b1d52] dark:text-emerald-400 tabular-nums">
                    ({displayMetrics.execPct}%)
                  </div>
                </div>
              </motion.div>

              {/* KPI 3: Total Invoices */}
              <motion.div
                whileHover={{ y: -2 }}
                onClick={() => dispatch(setActiveTab('invoices'))}
                className="bg-gradient-to-br from-white via-[#fbf9ff] to-[#f3eefc] dark:from-[#1e1538] dark:via-[#1b1233] dark:to-[#170f2c] rounded-2xl p-3.5 border border-purple-200/80 dark:border-purple-800/60 shadow-[0_4px_14px_rgba(68,38,133,0.08)] flex items-center gap-3 cursor-pointer h-full"
              >
                <div className="w-12 h-12 rounded-full bg-[#dbeafe] dark:bg-blue-900/50 flex items-center justify-center shrink-0 shadow-inner">
                  <svg viewBox="0 0 36 36" className="w-7 h-7 text-[#1d76e2] dark:text-blue-400">
                    <path d="M9 6h18v24l-3-2-3 2-3-2-3 2-3-2-3 2V6z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
                    <line x1="13" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                    <line x1="13" y1="17" x2="23" y2="17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                    <line x1="13" y1="22" x2="19" y2="22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#2b1d52] dark:text-purple-200 truncate">
                    {t.kpi.totalInvoices}
                  </div>
                  <div className="text-sm xl:text-[15.5px] font-extrabold text-[#170e2e] dark:text-white tabular-nums tracking-tight leading-tight mt-0.5 whitespace-nowrap">
                    {t.kpi.egp} {formatNumber(displayMetrics.invoices)}
                  </div>
                </div>
              </motion.div>

              {/* KPI 4: Total Payments */}
              <motion.div
                whileHover={{ y: -2 }}
                onClick={() => dispatch(setActiveTab('payment_orders'))}
                className="bg-gradient-to-br from-white via-[#fbf9ff] to-[#f3eefc] dark:from-[#1e1538] dark:via-[#1b1233] dark:to-[#170f2c] rounded-2xl p-3.5 border border-purple-200/80 dark:border-purple-800/60 shadow-[0_4px_14px_rgba(68,38,133,0.08)] flex items-center gap-3 cursor-pointer h-full"
              >
                <div className="w-12 h-12 rounded-full bg-[#faeacc] dark:bg-amber-900/50 flex items-center justify-center shrink-0 shadow-inner">
                  <svg viewBox="0 0 36 36" className="w-7 h-7 text-[#c7851e] dark:text-amber-400">
                    <rect x="6" y="9" width="24" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="2.2" />
                    <line x1="6" y1="15" x2="30" y2="15" stroke="currentColor" strokeWidth="2.4" />
                    <rect x="10" y="20" width="6" height="3" rx="0.8" fill="currentColor" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#2b1d52] dark:text-purple-200 truncate">
                    {t.kpi.totalPayments}
                  </div>
                  <div className="text-sm xl:text-[15.5px] font-extrabold text-[#170e2e] dark:text-white tabular-nums tracking-tight leading-tight mt-0.5 whitespace-nowrap">
                    {t.kpi.egp} {formatNumber(displayMetrics.payments)}
                  </div>
                  <div className="text-xs font-extrabold text-[#2b1d52] dark:text-amber-400 tabular-nums">
                    ({displayMetrics.payPct}%)
                  </div>
                </div>
              </motion.div>

              {/* KPI 5: Remaining Value */}
              <motion.div
                whileHover={{ y: -2 }}
                onClick={() => dispatch(setActiveTab('receivables'))}
                className="bg-gradient-to-br from-white via-[#fbf9ff] to-[#f3eefc] dark:from-[#1e1538] dark:via-[#1b1233] dark:to-[#170f2c] rounded-2xl p-3.5 border border-purple-200/80 dark:border-purple-800/60 shadow-[0_4px_14px_rgba(68,38,133,0.08)] flex items-center gap-3 cursor-pointer h-full"
              >
                <div className="w-12 h-12 rounded-full bg-[#fde2e2] dark:bg-rose-900/50 flex items-center justify-center shrink-0 shadow-inner">
                  <svg viewBox="0 0 36 36" className="w-7 h-7 text-[#e04848] dark:text-rose-400">
                    <path d="M10 6h11l6 6v18a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" strokeWidth="2.2" />
                    <path d="M21 6v6h6" fill="none" stroke="currentColor" strokeWidth="2.2" />
                    <line x1="12" y1="15" x2="17" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="19" x2="16" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="19" y1="25" x2="24" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="19.5" cy="19.5" r="1.2" fill="currentColor" />
                    <circle cx="23.5" cy="23.5" r="1.2" fill="currentColor" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#2b1d52] dark:text-purple-200 truncate">
                    {t.kpi.remainingValue}
                  </div>
                  <div className="text-sm xl:text-[15.5px] font-extrabold text-[#170e2e] dark:text-white tabular-nums tracking-tight leading-tight mt-0.5 whitespace-nowrap">
                    {t.kpi.egp} {formatNumber(displayMetrics.remaining)}
                  </div>
                  <div className="text-xs font-extrabold text-[#2b1d52] dark:text-rose-400 tabular-nums">
                    ({displayMetrics.remPct}%)
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* GRID ITEM 3: Cash Flow (EGP) */}
          <div
            key="cash_flow"
            dir={isAr ? 'rtl' : 'ltr'}
            className="print-card h-full w-full relative group/rgl bg-gradient-to-b from-white to-[#f9f6ff] dark:from-[#1e1538] dark:to-[#17102b] rounded-2xl p-4 border border-purple-200/80 dark:border-purple-800/60 shadow-[0_4px_16px_rgba(68,38,133,0.07)] flex flex-col justify-between overflow-auto"
          >
            <div>
              {/* Card Header */}
              <div className="rgl-drag-handle cursor-grab active:cursor-grabbing flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  {isGridUnlocked && (
                    <GripVertical className="w-4 h-4 text-purple-400 dark:text-purple-500 shrink-0 no-print print:hidden" />
                  )}
                  <TrendingUp className="w-5 h-5 text-[#4c2896] dark:text-purple-300 stroke-[2.3]" />
                  <h3 className="text-[16px] font-extrabold text-[#1e123d] dark:text-white">
                    {t.widgets.cashFlow}
                  </h3>
                </div>
              {hoveredMonthIndex !== null && (
                <div className="text-[11px] font-semibold bg-purple-100 dark:bg-purple-900/70 text-[#321b66] dark:text-purple-100 px-2.5 py-0.5 rounded-full tabular-nums">
                  {isAr
                    ? scaledCashFlow[hoveredMonthIndex].labelAr
                    : scaledCashFlow[hoveredMonthIndex].labelEn}
                  : +{scaledCashFlow[hoveredMonthIndex].inflowVal}M / -
                  {scaledCashFlow[hoveredMonthIndex].outflowVal}M
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 my-1.5 text-xs font-bold text-[#2b1d52] dark:text-purple-200">
              <div className="flex items-center gap-2">
                <span className="relative flex items-center w-5 h-1.5 rounded-full bg-[#5a32a8]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#5a32a8] mx-auto" />
                </span>
                <span>{t.widgets.inflow}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex items-center w-5 h-1.5 rounded-full bg-[#d48c1c]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#d48c1c] mx-auto" />
                </span>
                <span>{t.widgets.outflow}</span>
              </div>
            </div>
          </div>

          {/* SVG Line & Shaded Area Chart */}
          <div className="w-full pt-1">
            <svg viewBox="0 0 540 192" className="w-full h-auto overflow-visible select-none">
              <defs>
                <linearGradient id="inflowFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6d40c4" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#6d40c4" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="outflowFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d99126" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#d99126" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Lines & Y-Axis Labels (0 to 120M) */}
              {[0, 20, 40, 60, 80, 100, 120].map((val) => {
                const y = chartBottom - (val / maxCashFlowY) * chartHeight;
                return (
                  <g key={val}>
                    <line
                      x1={chartLeft}
                      y1={y}
                      x2={chartRight}
                      y2={y}
                      stroke="currentColor"
                      className="text-purple-200/70 dark:text-purple-800/50"
                      strokeWidth="1"
                    />
                    <text
                      x={chartLeft - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-[#2b1d52] dark:fill-purple-200 text-[11px] font-bold tabular-nums"
                    >
                      {val === 0 ? '0' : `${val}M`}
                    </text>
                  </g>
                );
              })}

              {/* Left & Bottom Axis Lines */}
              <line
                x1={chartLeft}
                y1={chartTop}
                x2={chartLeft}
                y2={chartBottom}
                stroke="currentColor"
                className="text-purple-300 dark:text-purple-700"
                strokeWidth="1.2"
              />
              <line
                x1={chartLeft}
                y1={chartBottom}
                x2={chartRight}
                y2={chartBottom}
                stroke="currentColor"
                className="text-purple-300 dark:text-purple-700"
                strokeWidth="1.2"
              />

              {/* Area Fills */}
              <path d={inflowAreaPath} fill="url(#inflowFill)" />
              <path d={outflowAreaPath} fill="url(#outflowFill)" />

              {/* Lines */}
              <polyline
                fill="none"
                stroke="#582da8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={inflowPolyline}
              />
              <polyline
                fill="none"
                stroke="#d68b1c"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={outflowPolyline}
              />

              {/* Data Points & X-Axis Month Labels */}
              {scaledCashFlow.map((item, idx) => {
                const inPt = inflowPoints[idx];
                const outPt = outflowPoints[idx];
                const isHovered = hoveredMonthIndex === idx;
                return (
                  <g
                    key={item.monthKey}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredMonthIndex(idx)}
                    onMouseLeave={() => setHoveredMonthIndex(null)}
                  >
                    {/* Hover guide line */}
                    {isHovered && (
                      <line
                        x1={inPt.x}
                        y1={chartTop}
                        x2={inPt.x}
                        y2={chartBottom}
                        stroke="#7c3aed"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* Inflow Node */}
                    <circle
                      cx={inPt.x}
                      cy={inPt.y}
                      r={isHovered ? 5.5 : 4}
                      fill="#ffffff"
                      stroke="#582da8"
                      strokeWidth="2.5"
                    />

                    {/* Outflow Node */}
                    <circle
                      cx={outPt.x}
                      cy={outPt.y}
                      r={isHovered ? 5.5 : 4}
                      fill="#ffffff"
                      stroke="#d68b1c"
                      strokeWidth="2.5"
                    />

                    {/* Month Label */}
                    <text
                      x={inPt.x}
                      y={chartBottom + 18}
                      textAnchor="middle"
                      className="fill-[#231445] dark:fill-purple-200 text-[11px] font-bold"
                    >
                      {isAr ? item.labelAr : item.labelEn}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

          {/* GRID ITEM 4: Project Financial Status */}
          <div
            key="project_status"
            dir={isAr ? 'rtl' : 'ltr'}
            className="print-card h-full w-full relative group/rgl bg-gradient-to-b from-white to-[#f9f6ff] dark:from-[#1e1538] dark:to-[#17102b] rounded-2xl p-4 border border-purple-200/80 dark:border-purple-800/60 shadow-[0_4px_16px_rgba(68,38,133,0.07)] flex flex-col justify-between overflow-auto"
          >
            <div className="rgl-drag-handle cursor-grab active:cursor-grabbing flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                {isGridUnlocked && (
                  <GripVertical className="w-4 h-4 text-purple-400 dark:text-purple-500 shrink-0 no-print print:hidden" />
                )}
                <Building2 className="w-5 h-5 text-[#4c2896] dark:text-purple-300 stroke-[2.2]" />
                <h3 className="text-[16px] font-extrabold text-[#1e123d] dark:text-white">
                  {t.widgets.projectStatus}
                </h3>
              </div>
            {searchQuery && (
              <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 tabular-nums">
                {filteredProjectsAnalysis.length} / {projects.length}
              </span>
            )}
          </div>

          {filteredProjectsAnalysis.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6 gap-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-purple-300/80">
                {t.actions.noMatchingProjects}
              </p>
              <button
                onClick={() => dispatch(setSearchQuery(''))}
                className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/60 dark:hover:bg-purple-800 text-[#321b66] dark:text-purple-200 text-xs font-bold transition-colors cursor-pointer"
              >
                {t.actions.clearSearch}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-purple-200/60 dark:divide-purple-800/40 flex-1 flex flex-col justify-around">
              {filteredProjectsAnalysis.map((proj) => {
                const barGradients: Record<typeof proj.colorType, string> = {
                  green: 'from-[#28b852] via-[#34c759] to-[#229e45]',
                  blue: 'from-[#1e88e5] via-[#2998fa] to-[#1976d2]',
                  gold: 'from-[#d99b26] via-[#ebb038] to-[#c48718]',
                  sky: 'from-[#1e88e5] via-[#2998fa] to-[#1976d2]',
                  red: 'from-[#e54d58] via-[#eb656e] to-[#d13b46]',
                };
                const isSelected = selectedProject === proj.id;

                return (
                  <div
                    key={proj.id}
                    onClick={() =>
                      dispatch(
                        setSelectedProject(selectedProject === proj.id ? 'ALL' : proj.id)
                      )
                    }
                    title={
                      isAr
                        ? `[${proj.id}] نسبة استهلاك الموازنة: ${proj.utilizationPct}% (${(proj.actualSpent / 1e6).toFixed(1)}M / ${(proj.allocatedBudget / 1e6).toFixed(1)}M)`
                        : `[${proj.id}] Budget Utilization: ${proj.utilizationPct}% (${(proj.actualSpent / 1e6).toFixed(1)}M / ${(proj.allocatedBudget / 1e6).toFixed(1)}M EGP)`
                    }
                    className={`py-2.5 flex items-center justify-between gap-3 cursor-pointer rounded-lg px-1.5 transition-colors ${
                      isSelected
                        ? 'bg-purple-100/80 dark:bg-purple-900/40'
                        : 'hover:bg-purple-50/60 dark:hover:bg-purple-900/20'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 w-48 shrink-0 min-w-0">
                      <span className="text-[10.5px] font-mono font-bold text-purple-700 dark:text-purple-300 tabular-nums shrink-0">
                        {proj.id}
                      </span>
                      <span className="text-xs sm:text-[13.5px] font-bold text-[#1f1240] dark:text-slate-100 truncate">
                        {isAr ? proj.nameAr : proj.nameEn}
                      </span>
                      {proj.isOver90 && (
                        <AlertTriangle
                          className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0"
                          aria-label={t.widgets.exceededBadge}
                        />
                      )}
                    </div>

                    {/* Progress Track */}
                    <div className="flex-1 h-3.5 rounded-full bg-[#e5dff5] dark:bg-purple-950/90 p-0.5 shadow-inner overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${proj.completionPercentage}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={`h-full rounded-full bg-gradient-to-r ${
                          barGradients[proj.colorType]
                        } shadow-2xs`}
                      />
                    </div>

                    {/* Percentage */}
                    <span className="text-xs sm:text-[14px] font-extrabold text-[#1f1240] dark:text-white tabular-nums w-10 text-end shrink-0">
                      {proj.completionPercentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

          {/* GRID ITEM 5: Financial Position Donut Chart */}
          <div
            key="financial_position"
            dir={isAr ? 'rtl' : 'ltr'}
            className="print-card h-full w-full relative group/rgl bg-gradient-to-b from-white to-[#f9f6ff] dark:from-[#1e1538] dark:to-[#17102b] rounded-2xl p-4 border border-purple-200/80 dark:border-purple-800/60 shadow-[0_4px_16px_rgba(68,38,133,0.07)] flex flex-col justify-between overflow-auto"
          >
            <div className="rgl-drag-handle cursor-grab active:cursor-grabbing flex items-center gap-2 mb-2">
              {isGridUnlocked && (
                <GripVertical className="w-4 h-4 text-purple-400 dark:text-purple-500 shrink-0 no-print print:hidden" />
              )}
              <Coins className="w-5 h-5 text-[#4c2896] dark:text-purple-300 stroke-[2.2]" />
              <h3 className="text-[16px] font-extrabold text-[#1e123d] dark:text-white">
                {t.widgets.financialPosition}
              </h3>
            </div>

          <div className="flex flex-col xl:flex-row items-center justify-between gap-3 my-auto">
            {/* SVG Donut Chart */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
                {/* Background Track */}
                <circle
                  cx="80"
                  cy="80"
                  r={donutRadius}
                  fill="none"
                  stroke="#ede9fe"
                  strokeWidth="26"
                />
                {/* Purple Executed Value Segment (69.6%) */}
                <circle
                  cx="80"
                  cy="80"
                  r={donutRadius}
                  fill="none"
                  stroke="#5b34a6"
                  strokeWidth="26"
                  strokeDasharray={`${purpleStrokeDash} ${donutCircumference}`}
                  strokeDashoffset="0"
                />
                {/* Gold Remaining Value Segment (30.4%) */}
                <circle
                  cx="80"
                  cy="80"
                  r={donutRadius}
                  fill="none"
                  stroke="#db9b27"
                  strokeWidth="26"
                  strokeDasharray={`${goldStrokeDash} ${donutCircumference}`}
                  strokeDashoffset={-purpleStrokeDash}
                />
              </svg>

              {/* Percentage Callouts on Ring */}
              <span className="absolute top-6 left-5 text-[11px] font-extrabold text-white drop-shadow-xs tabular-nums pointer-events-none">
                {displayMetrics.remPct}%
              </span>
              <span className="absolute bottom-3.5 right-9 text-[11px] font-extrabold text-white drop-shadow-xs tabular-nums pointer-events-none">
                {displayMetrics.execPct}%
              </span>

              {/* Center White Circle Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[11px] font-bold text-[#2b1d52] dark:text-purple-200 leading-none">
                  {t.kpi.egp}
                </span>
                <span className="text-lg font-extrabold text-[#170e2e] dark:text-white tabular-nums leading-tight my-0.5">
                  {Math.round(displayMetrics.contracts / 1e6).toLocaleString('en-US')}M
                </span>
                <span className="text-[11px] font-bold text-[#2b1d52] dark:text-purple-200 leading-none">
                  {t.widgets.contractsCenter}
                </span>
              </div>
            </div>

            {/* Legend Breakdown */}
            <div className="space-y-3.5 w-full xl:w-auto">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#231445] dark:text-purple-200">
                  <span className="w-3 h-3 rounded-xs bg-[#5b34a6] shrink-0" />
                  <span className="truncate">{t.kpi.executedValue}</span>
                </div>
                <div className="text-sm font-extrabold text-[#170e2e] dark:text-white tabular-nums mt-0.5 pl-5">
                  {Math.round(displayMetrics.executed / 1e6)}M{' '}
                  <span className="font-bold text-xs text-slate-600 dark:text-purple-300">
                    ({displayMetrics.execPct}%)
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#231445] dark:text-purple-200">
                  <span className="w-3 h-3 rounded-xs bg-[#db9b27] shrink-0" />
                  <span className="truncate">{t.kpi.remainingValue}</span>
                </div>
                <div className="text-sm font-extrabold text-[#170e2e] dark:text-white tabular-nums mt-0.5 pl-5">
                  {Math.round(displayMetrics.remaining / 1e6)}M{' '}
                  <span className="font-bold text-xs text-slate-600 dark:text-purple-300">
                    ({displayMetrics.remPct}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* GRID ITEM 6: Aging of Payables */}
          <div
            key="aging_payables"
            dir={isAr ? 'rtl' : 'ltr'}
            className="print-card h-full w-full relative group/rgl bg-gradient-to-b from-white to-[#f9f6ff] dark:from-[#1e1538] dark:to-[#17102b] rounded-2xl p-4 border border-purple-200/80 dark:border-purple-800/60 shadow-[0_4px_16px_rgba(68,38,133,0.07)] flex flex-col justify-between overflow-auto"
          >
            <div>
              <div className="rgl-drag-handle cursor-grab active:cursor-grabbing flex items-center gap-2 mb-3">
                {isGridUnlocked && (
                  <GripVertical className="w-4 h-4 text-purple-400 dark:text-purple-500 shrink-0 no-print print:hidden" />
                )}
                <CalendarClock className="w-5 h-5 text-[#4c2896] dark:text-purple-300 stroke-[2.2]" />
                <h3 className="text-[16px] font-extrabold text-[#1e123d] dark:text-white">
                  {t.widgets.agingPayables}
                </h3>
              </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 items-center bg-[#ede7f8] dark:bg-purple-900/50 rounded-lg px-3 py-2 text-xs font-extrabold text-[#231445] dark:text-purple-100">
              <div className="col-span-5">{t.widgets.duePeriod}</div>
              <div className="col-span-4 text-end">{t.widgets.amountEgp}</div>
              <div className="col-span-3 text-center">{t.widgets.percent}</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-purple-200/60 dark:divide-purple-800/40 mt-1">
              {agingPayables.map((row) => {
                const badgeStyles: Record<typeof row.badgeColor, string> = {
                  green:
                    'bg-[#c2f0cf] text-[#145c2a] dark:bg-emerald-900/70 dark:text-emerald-200',
                  yellow:
                    'bg-[#faebaf] text-[#6b4f06] dark:bg-amber-900/70 dark:text-amber-200',
                  orange:
                    'bg-[#fcd8b8] text-[#783509] dark:bg-orange-900/70 dark:text-orange-200',
                  red: 'bg-[#fcc5c9] text-[#7a1621] dark:bg-rose-900/70 dark:text-rose-200',
                };
                return (
                  <div
                    key={row.id}
                    className="grid grid-cols-12 items-center px-3 py-2 text-xs sm:text-[13px]"
                  >
                    <div className="col-span-5 font-bold text-[#1f1240] dark:text-slate-100 truncate">
                      {isAr ? row.periodAr : row.periodEn}
                    </div>
                    <div className="col-span-4 text-end font-bold text-[#1f1240] dark:text-white tabular-nums">
                      {formatNumber(row.amount)}
                    </div>
                    <div className="col-span-3 flex justify-end">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold tabular-nums min-w-[54px] text-center ${
                          badgeStyles[row.badgeColor]
                        }`}
                      >
                        {row.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Purple Total Footer Pill */}
          <div className="mt-2 grid grid-cols-12 items-center bg-gradient-to-r from-[#4b2d87] via-[#59389c] to-[#6341a8] text-white rounded-xl px-3.5 py-2 text-xs sm:text-[13.5px] font-extrabold shadow-sm">
            <div className="col-span-5">{t.widgets.total}</div>
            <div className="col-span-4 text-end tabular-nums border-r border-white/25 pr-3">
              {formatNumber(totalPayablesAging)}
            </div>
            <div className="col-span-3 text-center tabular-nums">100%</div>
          </div>
        </div>

          {/* GRID ITEM 7: Aging of Receivables */}
          <div
            key="aging_receivables"
            dir={isAr ? 'rtl' : 'ltr'}
            className="print-card h-full w-full relative group/rgl bg-gradient-to-b from-white to-[#f9f6ff] dark:from-[#1e1538] dark:to-[#17102b] rounded-2xl p-4 border border-purple-200/80 dark:border-purple-800/60 shadow-[0_4px_16px_rgba(68,38,133,0.07)] flex flex-col justify-between overflow-auto"
          >
            <div>
              <div className="rgl-drag-handle cursor-grab active:cursor-grabbing flex items-center gap-2 mb-3">
                {isGridUnlocked && (
                  <GripVertical className="w-4 h-4 text-purple-400 dark:text-purple-500 shrink-0 no-print print:hidden" />
                )}
                <HandCoins className="w-5 h-5 text-[#4c2896] dark:text-purple-300 stroke-[2.2]" />
                <h3 className="text-[16px] font-extrabold text-[#1e123d] dark:text-white">
                  {t.widgets.agingReceivables}
                </h3>
              </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 items-center bg-[#ede7f8] dark:bg-purple-900/50 rounded-lg px-3 py-2 text-xs font-extrabold text-[#231445] dark:text-purple-100">
              <div className="col-span-5">{t.widgets.duePeriod}</div>
              <div className="col-span-4 text-end">{t.widgets.amountEgp}</div>
              <div className="col-span-3 text-center">{t.widgets.percent}</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-purple-200/60 dark:divide-purple-800/40 mt-1">
              {agingReceivables.map((row) => {
                const badgeStyles: Record<typeof row.badgeColor, string> = {
                  green:
                    'bg-[#c2f0cf] text-[#145c2a] dark:bg-emerald-900/70 dark:text-emerald-200',
                  yellow:
                    'bg-[#faebaf] text-[#6b4f06] dark:bg-amber-900/70 dark:text-amber-200',
                  orange:
                    'bg-[#fcd8b8] text-[#783509] dark:bg-orange-900/70 dark:text-orange-200',
                  red: 'bg-[#fcc5c9] text-[#7a1621] dark:bg-rose-900/70 dark:text-rose-200',
                };
                return (
                  <div
                    key={row.id}
                    className="grid grid-cols-12 items-center px-3 py-2 text-xs sm:text-[13px]"
                  >
                    <div className="col-span-5 font-bold text-[#1f1240] dark:text-slate-100 truncate">
                      {isAr ? row.periodAr : row.periodEn}
                    </div>
                    <div className="col-span-4 text-end font-bold text-[#1f1240] dark:text-white tabular-nums">
                      {formatNumber(row.amount)}
                    </div>
                    <div className="col-span-3 flex justify-end">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold tabular-nums min-w-[54px] text-center ${
                          badgeStyles[row.badgeColor]
                        }`}
                      >
                        {row.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Purple Total Footer Pill */}
          <div className="mt-2 grid grid-cols-12 items-center bg-gradient-to-r from-[#4b2d87] via-[#59389c] to-[#6341a8] text-white rounded-xl px-3.5 py-2 text-xs sm:text-[13.5px] font-extrabold shadow-sm">
            <div className="col-span-5">{t.widgets.total}</div>
            <div className="col-span-4 text-end tabular-nums border-r border-white/25 pr-3">
              {formatNumber(totalReceivablesAging)}
            </div>
            <div className="col-span-3 text-center tabular-nums">100%</div>
          </div>
        </div>

          {/* GRID ITEM 8: Budget vs. Actual Bar Chart */}
          <div
            key="budget_vs_actual"
            dir={isAr ? 'rtl' : 'ltr'}
            className="print-card h-full w-full relative group/rgl bg-gradient-to-b from-white to-[#f9f6ff] dark:from-[#1e1538] dark:to-[#17102b] rounded-2xl p-4 border border-purple-200/80 dark:border-purple-800/60 shadow-[0_4px_16px_rgba(68,38,133,0.07)] flex flex-col justify-between overflow-auto"
          >
            {/* Header + Legend */}
            <div className="rgl-drag-handle cursor-grab active:cursor-grabbing flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {isGridUnlocked && (
                  <GripVertical className="w-4 h-4 text-purple-400 dark:text-purple-500 shrink-0 no-print print:hidden" />
                )}
                <BarChart3 className="w-5 h-5 text-[#4c2896] dark:text-purple-300 stroke-[2.2]" />
                <h3 className="text-[16px] font-extrabold text-[#1e123d] dark:text-white">
                  {t.widgets.budgetVsActual}
                </h3>
              </div>
            <div className="flex items-center gap-3 text-xs font-bold text-[#231445] dark:text-purple-200">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#5c35a8]" />
                <span>{t.widgets.budget}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#d99b26]" />
                <span>{t.widgets.actual}</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="relative pt-4 pb-1 flex-1 flex flex-col justify-end">
            <div className="flex items-end gap-2 h-40">
              {/* Y-Axis Labels (0 to 500M) */}
              <div className="flex flex-col justify-between h-full text-[11px] font-bold text-[#2b1d52] dark:text-purple-200 tabular-nums pr-1 pb-6 select-none">
                <span>500M</span>
                <span>400M</span>
                <span>300M</span>
                <span>200M</span>
                <span>100M</span>
                <span className="text-end">0</span>
              </div>

              {/* Plot Area */}
              <div className="relative flex-1 h-full flex flex-col justify-end">
                {/* Horizontal Grid Lines */}
                <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none">
                  {[0, 1, 2, 3, 4, 5].map((line) => (
                    <div
                      key={line}
                      className="w-full border-b border-purple-200/70 dark:border-purple-800/50"
                    />
                  ))}
                </div>

                {/* Columns Row */}
                <div className="relative z-10 grid grid-cols-5 gap-2 items-end h-[calc(100%-24px)] px-1 border-l border-b border-purple-300 dark:border-purple-700">
                  {budgetVsActual.map((cat) => {
                    const maxVal = 500;
                    const budgetHeightPct = Math.min(100, (cat.budget / maxVal) * 100);
                    const actualHeightPct = Math.min(100, (cat.actual / maxVal) * 100);

                    return (
                      <div
                        key={cat.id}
                        onClick={() => onOpenQuickAction('budgetPlanning')}
                        className="h-full flex flex-col justify-end items-center group cursor-pointer"
                      >
                        <div className="w-full flex items-end justify-center gap-1 h-full">
                          {/* Budget Bar (Purple) */}
                          <div className="flex flex-col items-center justify-end h-full flex-1 max-w-[20px]">
                            <span className="text-[10px] font-extrabold text-[#1f1240] dark:text-purple-200 tabular-nums mb-0.5 whitespace-nowrap">
                              {cat.budget}M
                            </span>
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${budgetHeightPct}%` }}
                              transition={{ duration: 0.5 }}
                              className="w-full rounded-t-sm bg-gradient-to-t from-[#49278f] via-[#633bb5] to-[#7c52cf] shadow-xs group-hover:brightness-110"
                            />
                          </div>

                          {/* Actual Bar (Gold) */}
                          <div className="flex flex-col items-center justify-end h-full flex-1 max-w-[20px]">
                            <span className="text-[10px] font-extrabold text-[#1f1240] dark:text-amber-300 tabular-nums mb-0.5 whitespace-nowrap">
                              {cat.actual}M
                            </span>
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${actualHeightPct}%` }}
                              transition={{ duration: 0.5, delay: 0.08 }}
                              className="w-full rounded-t-sm bg-gradient-to-t from-[#b87b14] via-[#d99b26] to-[#f0b849] shadow-xs group-hover:brightness-110"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Category Icons & Labels Below Axis */}
                <div className="grid grid-cols-5 gap-1 pt-1.5 text-center">
                  {budgetVsActual.map((cat) => (
                    <div key={cat.id} className="flex flex-col items-center">
                      <div className="text-[#4c2896] dark:text-purple-300 mb-0.5">
                        {cat.iconType === 'civil' && <Building2 className="w-3.5 h-3.5" />}
                        {cat.iconType === 'architectural' && <Layers className="w-3.5 h-3.5" />}
                        {cat.iconType === 'mechanical' && <Cog className="w-3.5 h-3.5" />}
                        {cat.iconType === 'electrical' && <Zap className="w-3.5 h-3.5" />}
                        {cat.iconType === 'others' && <Layers className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-[10.5px] font-bold text-[#1f1240] dark:text-slate-200 truncate w-full">
                        {isAr ? cat.nameAr : cat.nameEn}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* GRID ITEM 9: Recharts Summary Section — Monthly Project Expenses vs. Budget */}
          <div
            key="monthly_recharts"
            dir={isAr ? 'rtl' : 'ltr'}
            className="print-card h-full w-full relative group/rgl bg-gradient-to-b from-white to-[#f9f6ff] dark:from-[#1e1538] dark:to-[#17102b] rounded-2xl p-4 sm:p-5 border border-purple-200/80 dark:border-purple-800/60 shadow-[0_4px_16px_rgba(68,38,133,0.07)] flex flex-col justify-between overflow-auto"
          >
            {/* Section Header + Summary Metrics + Mode Switcher */}
            <div className="rgl-drag-handle cursor-grab active:cursor-grabbing flex flex-col xl:flex-row xl:items-center justify-between gap-3 mb-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  {isGridUnlocked && (
                    <GripVertical className="w-4 h-4 text-purple-400 dark:text-purple-500 shrink-0 no-print print:hidden" />
                  )}
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-[#4c2896] dark:text-purple-300">
                    <Activity className="w-4 h-4 stroke-[2.3]" />
                  </div>
                  <div>
                    <h3 className="text-[16px] sm:text-[17px] font-extrabold text-[#1e123d] dark:text-white leading-tight">
                      {t.widgets.monthlyExpensesVsBudget}
                    </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-purple-300/80 mt-0.5 tabular-nums">
                  <span>
                    {t.widgets.monthlyBudget}:{' '}
                    <strong className="text-[#4c2896] dark:text-purple-200">
                      {t.kpi.egp} {monthlyTotalsSummary.budgetSum}M
                    </strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {t.widgets.monthlyExpenses}:{' '}
                    <strong className="text-[#d48c1c] dark:text-amber-300">
                      {t.kpi.egp} {monthlyTotalsSummary.expensesSum}M
                    </strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {t.widgets.varianceLabel}:{' '}
                    <strong
                      className={
                        monthlyTotalsSummary.varianceSum >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }
                    >
                      {monthlyTotalsSummary.varianceSum >= 0 ? '+' : ''}
                      {monthlyTotalsSummary.varianceSum}M ({monthlyTotalsSummary.variancePct}%)
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Legend & Chart View Switcher */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-4">
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-bold text-[#231445] dark:text-purple-200">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#5c35a8]" />
                <span>{t.widgets.monthlyBudget}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#d99b26]" />
                <span>{t.widgets.monthlyExpenses}</span>
              </div>
              {rechartMode === 'composed' && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 rounded-full bg-emerald-500" />
                  <span>{t.widgets.varianceLabel}</span>
                </div>
              )}
            </div>

            {/* Segmented Mode Control */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-purple-100/80 dark:bg-purple-950/80 border border-purple-200/60 dark:border-purple-800/50">
              {(
                [
                  { id: 'composed', label: t.widgets.composedView },
                  { id: 'bar', label: t.widgets.barView },
                  { id: 'area', label: t.widgets.areaView },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setRechartMode(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    rechartMode === tab.id
                      ? 'bg-white dark:bg-purple-700 text-[#231445] dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-purple-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

            {/* Recharts Responsive Viewport */}
            <div className="w-full flex-1 min-h-[210px] tabular-nums" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
            {rechartMode === 'composed' ? (
              <ComposedChart
                data={monthlyExpensesChartData}
                margin={{ top: 10, right: 16, left: 0, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="rechartBudgetBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c52cf" />
                    <stop offset="100%" stopColor="#49278f" />
                  </linearGradient>
                  <linearGradient id="rechartExpenseBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f0b849" />
                    <stop offset="100%" stopColor="#c48216" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={theme === 'dark' ? 'rgba(139, 92, 246, 0.18)' : 'rgba(139, 92, 246, 0.2)'}
                />
                <XAxis
                  dataKey="name"
                  tick={{
                    fill: theme === 'dark' ? '#e9d5ff' : '#231445',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                  axisLine={{ stroke: theme === 'dark' ? '#581c87' : '#d8b4fe' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `${v}M`}
                  tick={{
                    fill: theme === 'dark' ? '#e9d5ff' : '#231445',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                  axisLine={{ stroke: theme === 'dark' ? '#581c87' : '#d8b4fe' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1e1538' : '#ffffff',
                    borderColor: theme === 'dark' ? '#581c87' : '#d8b4fe',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: theme === 'dark' ? '#ffffff' : '#1e123d',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                  }}
                  formatter={(value: any, name: any) => [`${t.kpi.egp} ${value ?? 0}M`, String(name ?? '')]}
                />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <Bar
                  dataKey="plannedBudget"
                  name={t.widgets.monthlyBudget}
                  fill="url(#rechartBudgetBar)"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="actualExpenses"
                  name={t.widgets.monthlyExpenses}
                  fill="url(#rechartExpenseBar)"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={28}
                />
                <Line
                  type="monotone"
                  dataKey="variance"
                  name={t.widgets.varianceLabel}
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#ffffff', stroke: '#10b981', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            ) : rechartMode === 'bar' ? (
              <BarChart
                data={monthlyExpensesChartData}
                margin={{ top: 10, right: 16, left: 0, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={theme === 'dark' ? 'rgba(139, 92, 246, 0.18)' : 'rgba(139, 92, 246, 0.2)'}
                />
                <XAxis
                  dataKey="name"
                  tick={{
                    fill: theme === 'dark' ? '#e9d5ff' : '#231445',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                  axisLine={{ stroke: theme === 'dark' ? '#581c87' : '#d8b4fe' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `${v}M`}
                  tick={{
                    fill: theme === 'dark' ? '#e9d5ff' : '#231445',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                  axisLine={{ stroke: theme === 'dark' ? '#581c87' : '#d8b4fe' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1e1538' : '#ffffff',
                    borderColor: theme === 'dark' ? '#581c87' : '#d8b4fe',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: theme === 'dark' ? '#ffffff' : '#1e123d',
                  }}
                  formatter={(value: any, name: any) => [`${t.kpi.egp} ${value ?? 0}M`, String(name ?? '')]}
                />
                <Bar
                  dataKey="plannedBudget"
                  name={t.widgets.monthlyBudget}
                  fill="#5c35a8"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={30}
                />
                <Bar
                  dataKey="actualExpenses"
                  name={t.widgets.monthlyExpenses}
                  fill="#d99b26"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={30}
                />
              </BarChart>
            ) : (
              <AreaChart
                data={monthlyExpensesChartData}
                margin={{ top: 10, right: 16, left: 0, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="cumBudgetFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#633bb5" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#633bb5" stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="cumExpenseFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d99b26" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#d99b26" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={theme === 'dark' ? 'rgba(139, 92, 246, 0.18)' : 'rgba(139, 92, 246, 0.2)'}
                />
                <XAxis
                  dataKey="name"
                  tick={{
                    fill: theme === 'dark' ? '#e9d5ff' : '#231445',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                  axisLine={{ stroke: theme === 'dark' ? '#581c87' : '#d8b4fe' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `${v}M`}
                  tick={{
                    fill: theme === 'dark' ? '#e9d5ff' : '#231445',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                  axisLine={{ stroke: theme === 'dark' ? '#581c87' : '#d8b4fe' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1e1538' : '#ffffff',
                    borderColor: theme === 'dark' ? '#581c87' : '#d8b4fe',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: theme === 'dark' ? '#ffffff' : '#1e123d',
                  }}
                  formatter={(value: any, name: any) => [`${t.kpi.egp} ${value ?? 0}M`, String(name ?? '')]}
                />
                <Area
                  type="monotone"
                  dataKey="cumBudget"
                  name={t.widgets.monthlyBudget}
                  stroke="#5c35a8"
                  strokeWidth={2.5}
                  fill="url(#cumBudgetFill)"
                />
                <Area
                  type="monotone"
                  dataKey="cumExpenses"
                  name={t.widgets.monthlyExpenses}
                  stroke="#d99b26"
                  strokeWidth={2.5}
                  fill="url(#cumExpenseFill)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
          </div>

          {/* GRID ITEM 10: Trend Analysis Module (Next-Quarter Expenditure Growth Projection) */}
          <div
            key="trend_analysis"
            dir={isAr ? 'rtl' : 'ltr'}
            className="h-full w-full relative group/rgl"
          >
            {isGridUnlocked && (
              <div
                title={t.actions.dragHint}
                className="rgl-drag-handle no-print print:hidden absolute -top-2.5 right-3 z-20 flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#3b256e] dark:bg-purple-700 text-white text-[10px] font-bold shadow-xs cursor-grab active:cursor-grabbing opacity-80 group-hover/rgl:opacity-100 transition-opacity select-none"
              >
                <GripVertical className="w-3 h-3 text-amber-300" />
                <span>{isAr ? 'سحب' : 'Drag'}</span>
              </div>
            )}
            <TrendAnalysisModule
              yearMultiplier={yearMultiplier}
              periodMultiplier={periodMultiplier}
            />
          </div>

          {/* GRID ITEM 11: Horizontal Scrollable Project Milestones Timeline */}
          <div
            key="milestones_timeline"
            dir={isAr ? 'rtl' : 'ltr'}
            className="h-full w-full relative group/rgl"
          >
            {isGridUnlocked && (
              <div
                title={t.actions.dragHint}
                className="rgl-drag-handle no-print print:hidden absolute -top-2.5 right-3 z-20 flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#3b256e] dark:bg-purple-700 text-white text-[10px] font-bold shadow-xs cursor-grab active:cursor-grabbing opacity-80 group-hover/rgl:opacity-100 transition-opacity select-none"
              >
                <GripVertical className="w-3 h-3 text-amber-300" />
                <span>{isAr ? 'سحب' : 'Drag'}</span>
              </div>
            )}
            <ProjectMilestonesTimeline />
          </div>

          {/* GRID ITEM 11: Individual Project Detail View & Team Progress Notes / Comments */}
          <div
            key="project_comments"
            dir={isAr ? 'rtl' : 'ltr'}
            className="h-full w-full relative group/rgl"
          >
            {isGridUnlocked && (
              <div
                title={t.actions.dragHint}
                className="rgl-drag-handle no-print print:hidden absolute -top-2.5 right-3 z-20 flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#3b256e] dark:bg-purple-700 text-white text-[10px] font-bold shadow-xs cursor-grab active:cursor-grabbing opacity-80 group-hover/rgl:opacity-100 transition-opacity select-none"
              >
                <GripVertical className="w-3 h-3 text-amber-300" />
                <span>{isAr ? 'سحب' : 'Drag'}</span>
              </div>
            )}
            <ProjectDetailCommentsSection />
          </div>
        </ResponsiveGridLayout>
      </div>

      {/* ROW 4: Quick Actions Footer Bar (Hidden in Print View) */}
      <div className="no-print print:hidden bg-gradient-to-r from-white via-[#faf8ff] to-white dark:from-[#1e1538] dark:via-[#1a1230] dark:to-[#1e1538] rounded-2xl px-4 py-3 border border-purple-200/80 dark:border-purple-800/60 shadow-[0_4px_16px_rgba(68,38,133,0.07)] flex flex-col xl:flex-row items-center justify-between gap-3">
        {/* Quick Actions Title */}
        <div className="flex items-center gap-2 shrink-0">
          <Zap className="w-5 h-5 text-[#e59a1a] fill-[#e59a1a]" />
          <span className="text-[17px] font-extrabold text-[#1e123d] dark:text-white whitespace-nowrap">
            {t.widgets.quickActions}
          </span>
        </div>

        {/* 6 Interactive Action Pill Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 w-full xl:w-auto flex-1 xl:max-w-5xl">
          <button
            onClick={() => onOpenQuickAction('createInvoice')}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-b from-white to-[#f2edfc] hover:from-[#f7f4ff] hover:to-[#e6dcf9] dark:from-[#281c4a] dark:to-[#1f153b] dark:hover:from-[#32235c] dark:hover:to-[#261a47] border border-purple-200/90 dark:border-purple-700/70 shadow-xs text-xs sm:text-[13px] font-bold text-[#211342] dark:text-white transition-all cursor-pointer whitespace-nowrap"
          >
            <FilePlus2 className="w-4 h-4 text-[#4c2896] dark:text-purple-300 shrink-0" />
            <span>{t.actions.createInvoice}</span>
          </button>

          <button
            onClick={() => onOpenQuickAction('registerPayment')}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-b from-white to-[#f2edfc] hover:from-[#f7f4ff] hover:to-[#e6dcf9] dark:from-[#281c4a] dark:to-[#1f153b] dark:hover:from-[#32235c] dark:hover:to-[#261a47] border border-purple-200/90 dark:border-purple-700/70 shadow-xs text-xs sm:text-[13px] font-bold text-[#211342] dark:text-white transition-all cursor-pointer whitespace-nowrap"
          >
            <CreditCard className="w-4 h-4 text-[#4c2896] dark:text-purple-300 shrink-0" />
            <span>{t.actions.registerPayment}</span>
          </button>

          <button
            onClick={() => onOpenQuickAction('recordReceipt')}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-b from-white to-[#f2edfc] hover:from-[#f7f4ff] hover:to-[#e6dcf9] dark:from-[#281c4a] dark:to-[#1f153b] dark:hover:from-[#32235c] dark:hover:to-[#261a47] border border-purple-200/90 dark:border-purple-700/70 shadow-xs text-xs sm:text-[13px] font-bold text-[#211342] dark:text-white transition-all cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-[#4c2896] dark:text-purple-300 shrink-0" />
            <span>{t.actions.recordReceipt}</span>
          </button>

          <button
            onClick={() => onOpenQuickAction('costEntry')}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-b from-white to-[#f2edfc] hover:from-[#f7f4ff] hover:to-[#e6dcf9] dark:from-[#281c4a] dark:to-[#1f153b] dark:hover:from-[#32235c] dark:hover:to-[#261a47] border border-purple-200/90 dark:border-purple-700/70 shadow-xs text-xs sm:text-[13px] font-bold text-[#211342] dark:text-white transition-all cursor-pointer whitespace-nowrap"
          >
            <Coins className="w-4 h-4 text-[#4c2896] dark:text-purple-300 shrink-0" />
            <span>{t.actions.costEntry}</span>
          </button>

          <button
            onClick={() => onOpenQuickAction('budgetPlanning')}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-b from-white to-[#f2edfc] hover:from-[#f7f4ff] hover:to-[#e6dcf9] dark:from-[#281c4a] dark:to-[#1f153b] dark:hover:from-[#32235c] dark:hover:to-[#261a47] border border-purple-200/90 dark:border-purple-700/70 shadow-xs text-xs sm:text-[13px] font-bold text-[#211342] dark:text-white transition-all cursor-pointer whitespace-nowrap"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#4c2896] dark:text-purple-300 shrink-0" />
            <span>{t.actions.budgetPlanning}</span>
          </button>

          <button
            onClick={() => onOpenQuickAction('financialReport')}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-b from-white to-[#f2edfc] hover:from-[#f7f4ff] hover:to-[#e6dcf9] dark:from-[#281c4a] dark:to-[#1f153b] dark:hover:from-[#32235c] dark:hover:to-[#261a47] border border-purple-200/90 dark:border-purple-700/70 shadow-xs text-xs sm:text-[13px] font-bold text-[#211342] dark:text-white transition-all cursor-pointer whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#4c2896] dark:text-purple-300 shrink-0" />
            <span>{t.actions.financialReport}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
