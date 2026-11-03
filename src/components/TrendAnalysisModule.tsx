import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Flame,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Gauge,
} from 'lucide-react';
import { useAppSelector } from '../store/store';
import { translations } from '../i18n/translations';

interface TrendAnalysisModuleProps {
  yearMultiplier: number;
  periodMultiplier: number;
}

type ScenarioMode = 'baseline' | 'accelerated' | 'optimized';
type ChartViewType = 'cumulative' | 'velocity';

export const TrendAnalysisModule: React.FC<TrendAnalysisModuleProps> = ({
  yearMultiplier,
}) => {
  const {
    language,
    theme,
    selectedProject,
    fiscalYear,
    cashFlow,
    projects,
    totalContracts,
  } = useAppSelector((state) => state.financial);

  const t = translations[language];
  const isAr = language === 'ar';

  const [scenario, setScenario] = useState<ScenarioMode>('baseline');
  const [chartView, setChartView] = useState<ChartViewType>('cumulative');

  // Identify selected project or consolidated portfolio
  const activeProjectObj = useMemo(
    () => projects.find((p) => p.id === selectedProject),
    [projects, selectedProject]
  );

  const projectRatio = useMemo(() => {
    if (activeProjectObj && totalContracts > 0) {
      return activeProjectObj.contractValue / totalContracts;
    }
    return 1;
  }, [activeProjectObj, totalContracts]);

  // Calculate allocated budget and current spent in Millions EGP
  const portfolioBudgetStats = useMemo(() => {
    if (activeProjectObj) {
      const allocatedM = Number(
        ((activeProjectObj.allocatedBudget * yearMultiplier) / 1e6).toFixed(1)
      );
      const spentM = Number(
        ((activeProjectObj.actualSpent * yearMultiplier) / 1e6).toFixed(1)
      );
      return { allocatedM, spentM };
    }

    const totalAlloc = projects.reduce((sum, p) => sum + p.allocatedBudget, 0);
    const totalSpent = projects.reduce((sum, p) => sum + p.actualSpent, 0);
    return {
      allocatedM: Number(((totalAlloc * yearMultiplier) / 1e6).toFixed(1)),
      spentM: Number(((totalSpent * yearMultiplier) / 1e6).toFixed(1)),
    };
  }, [activeProjectObj, projects, yearMultiplier]);

  // Scenario multiplier for projected next quarter burn rate
  const scenarioFactor =
    scenario === 'accelerated' ? 1.15 : scenario === 'optimized' ? 0.88 : 1.0;

  // Build historical (last 6 months of current FY) + Projected Next Quarter (3 months: M+1, M+2, M+3) dataset
  const projectionAnalysis = useMemo(() => {
    const totalRawOutflow = cashFlow.reduce((acc, m) => acc + m.outflow, 0) || 1;
    const { allocatedM, spentM } = portfolioBudgetStats;

    // Scale monthly historical outflows so their 12-month sum aligns with actual spentM
    const monthlyHistorical = cashFlow.map((m) => {
      const monthlyBurnM = Number(
        ((m.outflow / totalRawOutflow) * spentM).toFixed(1)
      );
      return {
        monthKey: m.monthKey,
        labelEn: m.labelEn,
        labelAr: m.labelAr,
        monthlyBurnM,
      };
    });

    // Calculate current burn rate from the most recent 3 months (Oct, Nov, Dec)
    const recent3 = monthlyHistorical.slice(-3);
    const currentAvgBurnRateM = Number(
      (
        recent3.reduce((sum, m) => sum + m.monthlyBurnM, 0) /
        Math.max(1, recent3.length)
      ).toFixed(1)
    );

    // Calculate historical month-over-month burn growth velocity
    const prev3 = monthlyHistorical.slice(-6, -3);
    const prevAvgBurnRateM =
      prev3.reduce((sum, m) => sum + m.monthlyBurnM, 0) /
        Math.max(1, prev3.length) || currentAvgBurnRateM;

    const naturalGrowthStep = Math.max(
      0.015,
      Math.min(0.06, (currentAvgBurnRateM - prevAvgBurnRateM) / (prevAvgBurnRateM * 3))
    );

    // Cumulative up to Month 6 (Jun) so we can plot the last 6 months (Jul..Dec) + Next Quarter (Jan..Mar Next FY)
    const first6Sum = monthlyHistorical
      .slice(0, 6)
      .reduce((sum, m) => sum + m.monthlyBurnM, 0);

    let runningCumulative = first6Sum;
    const chartPoints: {
      id: string;
      name: string;
      isProjected: boolean;
      historicalCumulative: number | null;
      projectedCumulative: number | null;
      upperBoundCumulative: number | null;
      monthlyActualBurn: number | null;
      monthlyProjectedBurn: number | null;
      growthRatePct: number;
      utilizationPct: number;
    }[] = [];

    // Add last 6 months of current year (Jul - Dec)
    const last6 = monthlyHistorical.slice(6);
    last6.forEach((m, idx) => {
      runningCumulative = Number((runningCumulative + m.monthlyBurnM).toFixed(1));
      const prevBurn = idx > 0 ? last6[idx - 1].monthlyBurnM : m.monthlyBurnM * 0.95;
      const momGrowth =
        prevBurn > 0 ? Number((((m.monthlyBurnM - prevBurn) / prevBurn) * 100).toFixed(1)) : 0;
      const utilPct =
        allocatedM > 0 ? Number(((runningCumulative / allocatedM) * 100).toFixed(1)) : 0;

      const isBridgePoint = idx === last6.length - 1;

      chartPoints.push({
        id: m.monthKey,
        name: isAr ? m.labelAr : m.labelEn,
        isProjected: false,
        historicalCumulative: runningCumulative,
        // Connect the last historical point to the start of the projection curve for seamless line continuity
        projectedCumulative: isBridgePoint ? runningCumulative : null,
        upperBoundCumulative: isBridgePoint ? runningCumulative : null,
        monthlyActualBurn: m.monthlyBurnM,
        monthlyProjectedBurn: null,
        growthRatePct: momGrowth,
        utilizationPct: utilPct,
      });
    });

    // Next Quarter Months (Q1 Next Quarter: M+1, M+2, M+3)
    const nextQuarterMonths = [
      {
        key: 'NQ-M1',
        en: 'Next Qtr M1 (Jan*)',
        ar: 'شهر 1 قادم (يناير*)',
        step: 1,
      },
      {
        key: 'NQ-M2',
        en: 'Next Qtr M2 (Feb*)',
        ar: 'شهر 2 قادم (فبراير*)',
        step: 2,
      },
      {
        key: 'NQ-M3',
        en: 'Next Qtr M3 (Mar*)',
        ar: 'شهر 3 قادم (مارس*)',
        step: 3,
      },
    ];

    let projectedQuarterSumM = 0;
    let runningUpper = runningCumulative;
    let lastMonthlyBurn = last6[last6.length - 1]?.monthlyBurnM || currentAvgBurnRateM;

    nextQuarterMonths.forEach((nq) => {
      const compoundFactor = Math.pow(1 + naturalGrowthStep, nq.step) * scenarioFactor;
      const projMonthlyM = Number((currentAvgBurnRateM * compoundFactor).toFixed(1));
      projectedQuarterSumM = Number((projectedQuarterSumM + projMonthlyM).toFixed(1));

      runningCumulative = Number((runningCumulative + projMonthlyM).toFixed(1));
      runningUpper = Number((runningUpper + projMonthlyM * 1.08).toFixed(1));

      const momGrowth =
        lastMonthlyBurn > 0
          ? Number((((projMonthlyM - lastMonthlyBurn) / lastMonthlyBurn) * 100).toFixed(1))
          : 0;
      lastMonthlyBurn = projMonthlyM;

      const utilPct =
        allocatedM > 0 ? Number(((runningCumulative / allocatedM) * 100).toFixed(1)) : 0;

      chartPoints.push({
        id: nq.key,
        name: isAr ? nq.ar : nq.en,
        isProjected: true,
        historicalCumulative: null,
        projectedCumulative: runningCumulative,
        upperBoundCumulative: runningUpper,
        monthlyActualBurn: null,
        monthlyProjectedBurn: projMonthlyM,
        growthRatePct: momGrowth,
        utilizationPct: utilPct,
      });
    });

    const forecastedEndCumulativeM = runningCumulative;
    const forecastedEndUtilizationPct =
      allocatedM > 0
        ? Number(((forecastedEndCumulativeM / allocatedM) * 100).toFixed(1))
        : 0;

    const remainingBudgetNowM = Math.max(0, allocatedM - spentM);
    const effectiveBurnM = Math.max(0.1, currentAvgBurnRateM * scenarioFactor);
    const runwayMonths = Number((remainingBudgetNowM / effectiveBurnM).toFixed(1));

    const quarterGrowthPct =
      currentAvgBurnRateM * 3 > 0
        ? Number(
            (
              ((projectedQuarterSumM - currentAvgBurnRateM * 3) /
                (currentAvgBurnRateM * 3)) *
              100
            ).toFixed(1)
          )
        : 0;

    return {
      chartPoints,
      allocatedM,
      threshold90M: Number((allocatedM * 0.9).toFixed(1)),
      currentAvgBurnRateM: Number((currentAvgBurnRateM * scenarioFactor).toFixed(1)),
      projectedQuarterSumM,
      forecastedEndCumulativeM,
      forecastedEndUtilizationPct,
      runwayMonths,
      quarterGrowthPct,
    };
  }, [cashFlow, portfolioBudgetStats, scenarioFactor, isAr]);

  const isExceeding90 = projectionAnalysis.forecastedEndUtilizationPct >= 90;
  const isExceeding100 = projectionAnalysis.forecastedEndUtilizationPct > 100;

  return (
    <div className="bg-gradient-to-br from-white via-[#fcfaff] to-[#f3eefc] dark:from-[#1e1538] dark:via-[#1b1233] dark:to-[#150e28] rounded-2xl p-4 sm:p-5 border border-purple-200/85 dark:border-purple-800/60 shadow-[0_4px_18px_rgba(68,38,133,0.07)] h-full flex flex-col justify-between overflow-hidden">
      {/* Top Header & Scenario / View Switchers */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 mb-3.5">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3b256e] to-[#633bb5] dark:from-purple-700 dark:to-purple-900 text-amber-300 flex items-center justify-center shrink-0 shadow-sm border border-purple-400/30">
            <TrendingUp className="w-5 h-5 stroke-[2.3]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-[16px] font-extrabold text-[#1e123d] dark:text-white tracking-tight">
                {t.widgets.trendAnalysisTitle}
              </h3>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-extrabold tabular-nums ${
                  isExceeding100
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300/60 dark:border-rose-800'
                    : isExceeding90
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800'
                    : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800'
                }`}
              >
                {isExceeding90 ? (
                  <AlertTriangle className="w-3 h-3" />
                ) : (
                  <CheckCircle2 className="w-3 h-3" />
                )}
                <span>
                  {isAr
                    ? `توقع نهاية الربع القادم: ${projectionAnalysis.forecastedEndUtilizationPct}%`
                    : `Forecasted EOQ: ${projectionAnalysis.forecastedEndUtilizationPct}%`}
                </span>
              </span>
            </div>
            <p className="text-[11.5px] text-slate-500 dark:text-purple-200/75 mt-0.5">
              {t.widgets.trendAnalysisSubtitle} ({fiscalYear})
            </p>
          </div>
        </div>

        {/* Right Controls: Scenario Pills + Chart Mode Toggle */}
        <div className="no-print print:hidden flex flex-wrap items-center gap-2">
          {/* Burn Rate Scenario Selector */}
          <div className="inline-flex items-center bg-[#efe9fb] dark:bg-[#140d29] p-1 rounded-xl border border-purple-200/80 dark:border-purple-800/60">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#4c2896] dark:text-amber-300 mx-1.5 shrink-0" />
            {(
              [
                { id: 'baseline', label: t.widgets.scenarioBaseline },
                { id: 'accelerated', label: t.widgets.scenarioAccelerated },
                { id: 'optimized', label: t.widgets.scenarioOptimized },
              ] as const
            ).map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => setScenario(sc.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  scenario === sc.id
                    ? 'bg-[#3b256e] dark:bg-purple-600 text-white shadow-2xs'
                    : 'text-[#2b1d52] dark:text-purple-200 hover:bg-purple-200/50 dark:hover:bg-purple-900/40'
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>

          {/* Chart Type Switcher */}
          <div className="inline-flex items-center bg-[#efe9fb] dark:bg-[#140d29] p-1 rounded-xl border border-purple-200/80 dark:border-purple-800/60">
            <button
              type="button"
              onClick={() => setChartView('cumulative')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                chartView === 'cumulative'
                  ? 'bg-amber-500 text-slate-950 shadow-2xs'
                  : 'text-[#2b1d52] dark:text-purple-200 hover:bg-purple-200/50 dark:hover:bg-purple-900/40'
              }`}
            >
              {t.widgets.cumulativeTrajectoryView}
            </button>
            <button
              type="button"
              onClick={() => setChartView('velocity')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                chartView === 'velocity'
                  ? 'bg-amber-500 text-slate-950 shadow-2xs'
                  : 'text-[#2b1d52] dark:text-purple-200 hover:bg-purple-200/50 dark:hover:bg-purple-900/40'
              }`}
            >
              {t.widgets.monthlyVelocityView}
            </button>
          </div>
        </div>
      </div>

      {/* 4 Telemetry Summary Cards for Burn Rate & Next-Quarter Forecast */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3.5">
        {/* Card 1: Current Burn Rate */}
        <div className="p-2.5 sm:p-3 rounded-xl bg-white/90 dark:bg-[#17102c] border border-purple-200/70 dark:border-purple-800/60 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-slate-500 dark:text-purple-300/80 truncate">
              {t.widgets.currentBurnRate}
            </div>
            <div className="text-sm sm:text-base font-extrabold text-[#1e123d] dark:text-white tabular-nums mt-0.5">
              {t.kpi.egp} {projectionAnalysis.currentAvgBurnRateM}M
              <span className="text-[11px] font-semibold text-slate-500 dark:text-purple-300/70">
                {' '}
                / {isAr ? 'شهر' : 'mo'}
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: Projected Next-Quarter Spend (3 Months) */}
        <div className="p-2.5 sm:p-3 rounded-xl bg-white/90 dark:bg-[#17102c] border border-purple-200/70 dark:border-purple-800/60 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-slate-500 dark:text-purple-300/80 truncate">
              {t.widgets.projectedNextQSpend}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm sm:text-base font-extrabold text-[#4c2896] dark:text-amber-300 tabular-nums">
                +{t.kpi.egp} {projectionAnalysis.projectedQuarterSumM}M
              </span>
              <span
                className={`inline-flex items-center text-[10.5px] font-extrabold tabular-nums ${
                  projectionAnalysis.quarterGrowthPct >= 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {projectionAnalysis.quarterGrowthPct >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {Math.abs(projectionAnalysis.quarterGrowthPct)}%
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/70 text-[#4c2896] dark:text-purple-300 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        {/* Card 3: Forecasted End-of-Quarter Utilization */}
        <div className="p-2.5 sm:p-3 rounded-xl bg-white/90 dark:bg-[#17102c] border border-purple-200/70 dark:border-purple-800/60 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-slate-500 dark:text-purple-300/80 truncate">
              {t.widgets.forecastedUtilization}
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5 tabular-nums">
              <span
                className={`text-sm sm:text-base font-extrabold ${
                  isExceeding100
                    ? 'text-rose-600 dark:text-rose-400'
                    : isExceeding90
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {projectionAnalysis.forecastedEndUtilizationPct}%
              </span>
              <span className="text-[11px] text-slate-400 dark:text-purple-300/60 font-semibold">
                ({projectionAnalysis.forecastedEndCumulativeM}M / {projectionAnalysis.allocatedM}M)
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Gauge className="w-4 h-4" />
          </div>
        </div>

        {/* Card 4: Estimated Budget Runway */}
        <div className="p-2.5 sm:p-3 rounded-xl bg-white/90 dark:bg-[#17102c] border border-purple-200/70 dark:border-purple-800/60 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-slate-500 dark:text-purple-300/80 truncate">
              {t.widgets.budgetRunway}
            </div>
            <div className="text-sm sm:text-base font-extrabold text-[#1e123d] dark:text-white tabular-nums mt-0.5">
              {projectionAnalysis.runwayMonths}{' '}
              <span className="text-xs font-bold text-slate-500 dark:text-purple-300/80">
                {t.widgets.monthsRemaining}
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <CalendarClock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1 text-[11px] font-bold text-[#2b1d52] dark:text-purple-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#5c35a8] inline-block" />
            <span>{t.widgets.historicalActual}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#f59e0b] inline-block" />
            <span>{t.widgets.projectedSpend}</span>
          </div>
          {chartView === 'cumulative' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-0.5 border-t-2 border-dashed border-rose-500 inline-block" />
                <span>{t.widgets.threshold90Line} ({projectionAnalysis.threshold90M}M)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-0.5 bg-emerald-600 inline-block" />
                <span>{t.widgets.allocatedCeiling} ({projectionAnalysis.allocatedM}M)</span>
              </div>
            </>
          )}
        </div>
        <span className="text-[10.5px] font-mono text-slate-500 dark:text-purple-300/70">
          {isAr ? '* أشهر الربع القادم المتوقعة' : '* Projected Next-Quarter Months'}
        </span>
      </div>

      {/* Recharts Canvas */}
      <div className="w-full flex-1 min-h-[210px]" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          {chartView === 'cumulative' ? (
            <AreaChart
              data={projectionAnalysis.chartPoints}
              margin={{ top: 12, right: 20, left: 0, bottom: 4 }}
            >
              <defs>
                <linearGradient id="histCumFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5c35a8" stopOpacity={0.38} />
                  <stop offset="95%" stopColor="#5c35a8" stopOpacity={0.03} />
                </linearGradient>
                <linearGradient id="projCumFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="upperBoundFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={
                  theme === 'dark' ? 'rgba(139, 92, 246, 0.18)' : 'rgba(139, 92, 246, 0.2)'
                }
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
                  boxShadow: '0 10px 25px rgba(0,0,0,0.16)',
                }}
                formatter={(value: any, name: any) => [
                  `${t.kpi.egp} ${value ?? 0}M`,
                  String(name ?? ''),
                ]}
              />
              <ReferenceLine
                y={projectionAnalysis.threshold90M}
                stroke="#f43f5e"
                strokeDasharray="5 4"
                strokeWidth={1.8}
              />
              <ReferenceLine
                y={projectionAnalysis.allocatedM}
                stroke="#10b981"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="upperBoundCumulative"
                name={t.widgets.upperConfidence}
                stroke="#f43f5e"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                fill="url(#upperBoundFill)"
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="historicalCumulative"
                name={t.widgets.historicalActual}
                stroke="#5c35a8"
                strokeWidth={3}
                fill="url(#histCumFill)"
                dot={{ r: 4, fill: '#5c35a8', stroke: '#ffffff', strokeWidth: 1.5 }}
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="projectedCumulative"
                name={t.widgets.projectedSpend}
                stroke="#f59e0b"
                strokeWidth={3}
                strokeDasharray="6 3"
                fill="url(#projCumFill)"
                dot={{ r: 4.5, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 1.5 }}
                connectNulls
              />
            </AreaChart>
          ) : (
            <ComposedChart
              data={projectionAnalysis.chartPoints}
              margin={{ top: 12, right: 20, left: 0, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={
                  theme === 'dark' ? 'rgba(139, 92, 246, 0.18)' : 'rgba(139, 92, 246, 0.2)'
                }
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
                yAxisId="left"
                tickFormatter={(v) => `${v}M`}
                tick={{
                  fill: theme === 'dark' ? '#e9d5ff' : '#231445',
                  fontSize: 11,
                  fontWeight: 700,
                }}
                axisLine={{ stroke: theme === 'dark' ? '#581c87' : '#d8b4fe' }}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(v) => `${v}%`}
                tick={{
                  fill: theme === 'dark' ? '#fcd34d' : '#b45309',
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
                formatter={(value: any, name: any) => {
                  const label = String(name ?? '');
                  if (label.includes('%')) {
                    return [`${value ?? 0}%`, label];
                  }
                  return [`${t.kpi.egp} ${value ?? 0}M`, label];
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="monthlyActualBurn"
                name={t.widgets.historicalActual}
                fill="#5c35a8"
                radius={[5, 5, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                yAxisId="left"
                dataKey="monthlyProjectedBurn"
                name={t.widgets.projectedSpend}
                fill="#f59e0b"
                radius={[5, 5, 0, 0]}
                maxBarSize={32}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="utilizationPct"
                name={isAr ? 'نسبة الاستهلاك التراكمي %' : 'Cumulative Budget Utilization %'}
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#ffffff', stroke: '#10b981', strokeWidth: 2 }}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
