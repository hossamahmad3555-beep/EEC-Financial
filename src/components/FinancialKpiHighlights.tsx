import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  FolderKanban,
  Gauge,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { setActiveTab, setSelectedProject } from '../store/financialSlice';
import { translations } from '../i18n/translations';

interface FinancialKpiHighlightsProps {
  yearMultiplier: number;
  periodMultiplier: number;
}

export const FinancialKpiHighlights: React.FC<FinancialKpiHighlightsProps> = ({
  yearMultiplier,
  periodMultiplier,
}) => {
  const dispatch = useAppDispatch();
  const { language, projects, selectedProject, searchQuery, budgetVsActual } =
    useAppSelector((state) => state.financial);
  const t = translations[language];
  const isAr = language === 'ar';

  const metrics = useMemo(() => {
    const scale = yearMultiplier * periodMultiplier;
    const q = searchQuery.trim().toLowerCase();
    const filteredProjects = projects.filter((p) => {
      const matchesSelect = selectedProject === 'ALL' || p.id === selectedProject;
      const matchesSearch =
        !q ||
        p.id.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.nameAr.toLowerCase().includes(q) ||
        p.managerEn.toLowerCase().includes(q) ||
        p.managerAr.toLowerCase().includes(q);
      return matchesSelect && matchesSearch;
    });

    const totalAllocatedBudget = filteredProjects.reduce(
      (sum, p) => sum + (p.allocatedBudget || Math.round(p.contractValue * 0.88)),
      0
    );
    const totalActualSpent = filteredProjects.reduce(
      (sum, p) => sum + (p.actualSpent ?? p.executedValue),
      0
    );

    const scaledAllocated = Math.round(totalAllocatedBudget * scale);
    const scaledExpenditure = Math.round(totalActualSpent * scale);
    const scaledRemainingBudget = Math.max(0, scaledAllocated - scaledExpenditure);

    const utilizationPct =
      scaledAllocated > 0
        ? Number(((scaledExpenditure / scaledAllocated) * 100).toFixed(1))
        : 0;
    const remainingBudgetPct =
      scaledAllocated > 0
        ? Number(((scaledRemainingBudget / scaledAllocated) * 100).toFixed(1))
        : 0;

    const avgCompletion =
      filteredProjects.length > 0
        ? Math.round(
            filteredProjects.reduce((sum, p) => sum + p.completionPercentage, 0) /
              filteredProjects.length
          )
        : 0;

    const totalCatBudget = budgetVsActual.reduce((s, c) => s + c.budget, 0);
    const totalCatActual = budgetVsActual.reduce((s, c) => s + c.actual, 0);
    const savingsRatePct =
      totalCatBudget > 0
        ? Number((((totalCatBudget - totalCatActual) / totalCatBudget) * 100).toFixed(1))
        : 7.4;

    return {
      totalExpenditure: scaledExpenditure,
      remainingBudget: scaledRemainingBudget,
      allocatedBudget: scaledAllocated,
      projectCount: filteredProjects.length,
      totalPortfolioCount: projects.length,
      utilizationPct,
      remainingBudgetPct,
      avgCompletion,
      savingsRatePct,
    };
  }, [projects, selectedProject, yearMultiplier, periodMultiplier, budgetVsActual]);

  const formatEgp = (val: number) => val.toLocaleString('en-US');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 h-full">
      {/* Card 1: Total Expenditure */}
      <motion.div
        whileHover={{ y: -2 }}
        onClick={() => dispatch(setActiveTab('cost_control'))}
        className="bg-gradient-to-br from-white via-[#fcfaff] to-[#f4effc] dark:from-[#1e1538] dark:via-[#1a1230] dark:to-[#160e2a] rounded-2xl p-4 border border-purple-200/80 dark:border-purple-800/60 shadow-[0_4px_14px_rgba(68,38,133,0.07)] flex flex-col justify-between gap-2.5 cursor-pointer"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-500 dark:text-purple-300/80 block truncate">
              {t.kpi.totalExpenditure}
            </span>
            <div className="text-base xl:text-lg font-extrabold text-[#170e2e] dark:text-white tabular-nums tracking-tight mt-0.5 whitespace-nowrap">
              {t.kpi.egp} {formatEgp(metrics.totalExpenditure)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-[#582da8] dark:text-purple-300 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="w-full h-1.5 rounded-full bg-purple-100 dark:bg-purple-950 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#582da8] to-[#8b5cf6]"
              style={{ width: `${Math.min(100, metrics.utilizationPct)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] tabular-nums">
            <span className="inline-flex items-center gap-1 font-extrabold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+4.2%</span>
            </span>
            <span className="text-slate-500 dark:text-purple-300/75 truncate">
              {metrics.utilizationPct}% {isAr ? 'من الموازنة' : 'of budget'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Card 2: Remaining Budget */}
      <motion.div
        whileHover={{ y: -2 }}
        onClick={() => dispatch(setActiveTab('budget'))}
        className="bg-gradient-to-br from-white via-[#fcfaff] to-[#f4effc] dark:from-[#1e1538] dark:via-[#1a1230] dark:to-[#160e2a] rounded-2xl p-4 border border-purple-200/80 dark:border-purple-800/60 shadow-[0_4px_14px_rgba(68,38,133,0.07)] flex flex-col justify-between gap-2.5 cursor-pointer"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-500 dark:text-purple-300/80 block truncate">
              {t.kpi.remainingBudget}
            </span>
            <div className="text-base xl:text-lg font-extrabold text-[#170e2e] dark:text-white tabular-nums tracking-tight mt-0.5 whitespace-nowrap">
              {t.kpi.egp} {formatEgp(metrics.remainingBudget)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-[#c7851e] dark:text-amber-300 flex items-center justify-center shrink-0">
            <PiggyBank className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="w-full h-1.5 rounded-full bg-amber-100 dark:bg-amber-950 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#d99b26] to-[#fbbf24]"
              style={{ width: `${Math.min(100, metrics.remainingBudgetPct)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] tabular-nums">
            <span className="inline-flex items-center gap-1 font-extrabold text-amber-600 dark:text-amber-400">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>{metrics.remainingBudgetPct}%</span>
            </span>
            <span className="text-slate-500 dark:text-purple-300/75 truncate">
              {t.kpi.availableAllocation}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Card 3: Project Count */}
      <motion.div
        whileHover={{ y: -2 }}
        onClick={() =>
          dispatch(setSelectedProject(selectedProject === 'ALL' ? 'PRJ-01' : 'ALL'))
        }
        className="bg-gradient-to-br from-white via-[#fcfaff] to-[#f4effc] dark:from-[#1e1538] dark:via-[#1a1230] dark:to-[#160e2a] rounded-2xl p-4 border border-purple-200/80 dark:border-purple-800/60 shadow-[0_4px_14px_rgba(68,38,133,0.07)] flex flex-col justify-between gap-2.5 cursor-pointer"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-500 dark:text-purple-300/80 block truncate">
              {t.kpi.projectCount}
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base xl:text-lg font-extrabold text-[#170e2e] dark:text-white tabular-nums tracking-tight">
                {metrics.projectCount}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-purple-300 tabular-nums">
                / {metrics.totalPortfolioCount}{' '}
                {isAr ? 'مشروعات' : 'Projects'}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-[#1d76e2] dark:text-blue-300 flex items-center justify-center shrink-0">
            <FolderKanban className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="w-full h-1.5 rounded-full bg-blue-100 dark:bg-blue-950 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#1d76e2] to-[#38bdf8]"
              style={{ width: `${metrics.avgCompletion}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] tabular-nums">
            <span className="inline-flex items-center gap-1 font-extrabold text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>
                {metrics.avgCompletion}% {isAr ? 'متوسط الإنجاز' : 'Avg. Progress'}
              </span>
            </span>
            <span className="text-slate-500 dark:text-purple-300/75 truncate">
              {t.kpi.activePortfolio}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Card 4: Budget Utilization & Cost Efficiency */}
      <motion.div
        whileHover={{ y: -2 }}
        onClick={() => dispatch(setActiveTab('reports'))}
        className="bg-gradient-to-br from-white via-[#fcfaff] to-[#f4effc] dark:from-[#1e1538] dark:via-[#1a1230] dark:to-[#160e2a] rounded-2xl p-4 border border-purple-200/80 dark:border-purple-800/60 shadow-[0_4px_14px_rgba(68,38,133,0.07)] flex flex-col justify-between gap-2.5 cursor-pointer"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-500 dark:text-purple-300/80 block truncate">
              {t.kpi.budgetUtilization}
            </span>
            <div className="text-base xl:text-lg font-extrabold text-[#170e2e] dark:text-white tabular-nums tracking-tight mt-0.5 whitespace-nowrap">
              {metrics.utilizationPct}%
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-[#16a34a] dark:text-emerald-300 flex items-center justify-center shrink-0">
            <Gauge className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="w-full h-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#16a34a] to-[#34d399]"
              style={{ width: `${Math.min(100, metrics.utilizationPct)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] tabular-nums">
            <span className="inline-flex items-center gap-1 font-extrabold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{metrics.savingsRatePct}%</span>
            </span>
            <span className="text-slate-500 dark:text-purple-300/75 truncate">
              {t.kpi.withinTarget}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
