import React, { useRef, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Flag,
  CheckCircle2,
  Clock,
  CircleDot,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { setSelectedProject } from '../store/financialSlice';
import { translations } from '../i18n/translations';

export interface MilestoneNode {
  id: string;
  phaseCode: string;
  projectId: string;
  projectNameEn: string;
  projectNameAr: string;
  titleEn: string;
  titleAr: string;
  dateEn: string;
  dateAr: string;
  progressPct: number;
  ipcAmountM: number;
  status: 'completed' | 'in_progress' | 'upcoming';
}

const INITIAL_MILESTONES: MilestoneNode[] = [
  {
    id: 'MS-01',
    phaseCode: 'M1 · PRJ-01',
    projectId: 'PRJ-01',
    projectNameEn: 'Administrative Building',
    projectNameAr: 'المبنى الإداري الرئيسي',
    titleEn: 'Deep Foundations & Structural Core',
    titleAr: 'الأساسات العميقة والهيكل الخرساني',
    dateEn: 'Feb 2026',
    dateAr: 'فبراير 2026',
    progressPct: 100,
    ipcAmountM: 120,
    status: 'completed',
  },
  {
    id: 'MS-02',
    phaseCode: 'M2 · PRJ-02',
    projectId: 'PRJ-02',
    projectNameEn: 'Main Workshop',
    projectNameAr: 'الورشة الهندسية الرئيسية',
    titleEn: 'Steel Superstructure & Overhead Cranes',
    titleAr: 'الهياكل المعدنية والأوناش العلوية',
    dateEn: 'Apr 2026',
    dateAr: 'أبريل 2026',
    progressPct: 100,
    ipcAmountM: 95,
    status: 'completed',
  },
  {
    id: 'MS-03',
    phaseCode: 'M3 · PRJ-03',
    projectId: 'PRJ-03',
    projectNameEn: 'Utilities & Infrastructure',
    projectNameAr: 'المرافق والبنية التحتية',
    titleEn: 'HV Substation & Primary Piping Network',
    titleAr: 'محطة الجهد العالي وشبكات المرافق',
    dateEn: 'Jun 2026',
    dateAr: 'يونيو 2026',
    progressPct: 100,
    ipcAmountM: 88,
    status: 'completed',
  },
  {
    id: 'MS-04',
    phaseCode: 'M4 · PRJ-01',
    projectId: 'PRJ-01',
    projectNameEn: 'Administrative Building',
    projectNameAr: 'المبنى الإداري الرئيسي',
    titleEn: 'Curtain Wall Facade & MEP Rough-In',
    titleAr: 'الواجهات الزجاجية وتمديدات الكهروميكانيك',
    dateEn: 'Aug 2026',
    dateAr: 'أغسطس 2026',
    progressPct: 85,
    ipcAmountM: 110,
    status: 'in_progress',
  },
  {
    id: 'MS-05',
    phaseCode: 'M5 · PRJ-04',
    projectId: 'PRJ-04',
    projectNameEn: 'Warehouse',
    projectNameAr: 'المستودعات والمخازن الاستراتيجية',
    titleEn: 'Automated Racking & Industrial Flooring',
    titleAr: 'الأرضيات الصناعية وأنظمة التخزين الآلي',
    dateEn: 'Oct 2026',
    dateAr: 'أكتوبر 2026',
    progressPct: 68,
    ipcAmountM: 64,
    status: 'in_progress',
  },
  {
    id: 'MS-06',
    phaseCode: 'M6 · PRJ-02',
    projectId: 'PRJ-02',
    projectNameEn: 'Main Workshop',
    projectNameAr: 'الورشة الهندسية الرئيسية',
    titleEn: 'Heavy Machinery Commissioning & Testing',
    titleAr: 'تركيب واختبار المعدات الهندسية الثقيلة',
    dateEn: 'Nov 2026',
    dateAr: 'نوفمبر 2026',
    progressPct: 45,
    ipcAmountM: 78,
    status: 'in_progress',
  },
  {
    id: 'MS-07',
    phaseCode: 'M7 · PRJ-05',
    projectId: 'PRJ-05',
    projectNameEn: 'Site Facilities',
    projectNameAr: 'تجهيزات الموقع والخدمات',
    titleEn: 'Perimeter Security, Gates & Landscaping',
    titleAr: 'البوابات الأمنية وتنسيق الموقع العام',
    dateEn: 'Dec 2026',
    dateAr: 'ديسمبر 2026',
    progressPct: 20,
    ipcAmountM: 42,
    status: 'upcoming',
  },
  {
    id: 'MS-08',
    phaseCode: 'M8 · ALL',
    projectId: 'PRJ-01',
    projectNameEn: 'Administrative Building',
    projectNameAr: 'المبنى الإداري الرئيسي',
    titleEn: 'Final Handover & PAC Certificate Issuance',
    titleAr: 'التسليم الابتدائي وإصدار شهادة الاستلام',
    dateEn: 'Jan 2027',
    dateAr: 'يناير 2027',
    progressPct: 0,
    ipcAmountM: 145,
    status: 'upcoming',
  },
];

export const ProjectMilestonesTimeline: React.FC = () => {
  const dispatch = useAppDispatch();
  const { language, selectedProject, searchQuery } = useAppSelector(
    (state) => state.financial
  );
  const t = translations[language];
  const isAr = language === 'ar';

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [milestones, setMilestones] = useState<MilestoneNode[]>(INITIAL_MILESTONES);
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'completed' | 'in_progress' | 'upcoming'
  >('ALL');

  const filteredMilestones = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return milestones.filter((m) => {
      const matchesProject =
        selectedProject === 'ALL' || m.projectId === selectedProject;
      const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
      const matchesSearch =
        !q ||
        m.projectId.toLowerCase().includes(q) ||
        m.phaseCode.toLowerCase().includes(q) ||
        m.projectNameEn.toLowerCase().includes(q) ||
        m.projectNameAr.toLowerCase().includes(q) ||
        m.titleEn.toLowerCase().includes(q) ||
        m.titleAr.toLowerCase().includes(q);
      return matchesProject && matchesStatus && matchesSearch;
    });
  }, [milestones, selectedProject, statusFilter, searchQuery]);

  const overallProgressPct = useMemo(() => {
    if (filteredMilestones.length === 0) return 0;
    const sum = filteredMilestones.reduce((acc, m) => acc + m.progressPct, 0);
    return Math.round(sum / filteredMilestones.length);
  }, [filteredMilestones]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const offset = direction === 'left' ? -340 : 340;
    scrollContainerRef.current.scrollBy({
      left: isAr ? -offset : offset,
      behavior: 'smooth',
    });
  };

  const handleCycleMilestoneProgress = (id: string) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        if (m.status === 'upcoming') {
          return { ...m, status: 'in_progress', progressPct: 55 };
        }
        if (m.status === 'in_progress') {
          return { ...m, status: 'completed', progressPct: 100 };
        }
        return { ...m, status: 'upcoming', progressPct: 0 };
      })
    );
  };

  return (
    <div className="print-card h-full flex flex-col justify-between bg-gradient-to-b from-white to-[#f9f6ff] dark:from-[#1e1538] dark:to-[#17102b] rounded-2xl p-4 sm:p-5 border border-purple-200/80 dark:border-purple-800/60 shadow-[0_4px_16px_rgba(68,38,133,0.07)] space-y-3.5 overflow-auto">
      {/* Header Row: Title, Overall Progress Summary, Status Filter Tabs & Scroll Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-[#4c2896] dark:text-purple-300 shrink-0">
            <Flag className="w-4 h-4 stroke-[2.3]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[16px] font-extrabold text-[#1e123d] dark:text-white leading-tight">
                {t.widgets.milestonesTitle}
              </h3>
              <span className="text-xs font-extrabold text-purple-700 dark:text-purple-300 tabular-nums">
                · {t.widgets.overallTimelineProgress}: {overallProgressPct}%
              </span>
            </div>
            <p className="text-[11.5px] text-slate-500 dark:text-purple-300/80">
              {t.widgets.milestonesSubtitle}
            </p>
          </div>
        </div>

        {/* Right Controls: Segmented Status Filter + Scroll Left/Right Buttons */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-purple-100/80 dark:bg-purple-950/80 border border-purple-200/60 dark:border-purple-800/50">
            {(
              [
                { id: 'ALL', label: t.allProjects },
                { id: 'completed', label: t.widgets.completedStatus },
                { id: 'in_progress', label: t.widgets.inProgressStatus },
                { id: 'upcoming', label: t.widgets.upcomingStatus },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-white dark:bg-purple-700 text-[#231445] dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-purple-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Horizontal Scroll Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleScroll('left')}
              aria-label="Scroll Timeline Left"
              className="w-8 h-8 rounded-xl bg-white dark:bg-[#261a47] hover:bg-purple-50 dark:hover:bg-purple-800/60 border border-purple-200 dark:border-purple-700 text-[#3b256e] dark:text-purple-200 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            >
              {isAr ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => handleScroll('right')}
              aria-label="Scroll Timeline Right"
              className="w-8 h-8 rounded-xl bg-white dark:bg-[#261a47] hover:bg-purple-50 dark:hover:bg-purple-800/60 border border-purple-200 dark:border-purple-700 text-[#3b256e] dark:text-purple-200 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            >
              {isAr ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Master Overall Progress Bar Track */}
      <div className="w-full h-2.5 rounded-full bg-[#e5dff5] dark:bg-purple-950/90 p-0.5 shadow-inner overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${overallProgressPct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-[#582da8] via-[#d99b26] to-[#28b852]"
        />
      </div>

      {/* Horizontal Scrollable Timeline Track & Milestone Cards */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto pb-2 pt-1 scroll-smooth"
      >
        <div className="relative flex items-stretch gap-4 min-w-max px-1">
          {filteredMilestones.map((ms, idx) => {
            const isCompleted = ms.status === 'completed';
            const isInProgress = ms.status === 'in_progress';
            const isProjectActive = selectedProject === ms.projectId;

            return (
              <div
                key={ms.id}
                className="relative flex flex-col w-72 sm:w-76 shrink-0 group"
              >
                {/* Horizontal Connector Line + Node Indicator */}
                <div className="flex items-center mb-2.5">
                  <button
                    onClick={() => handleCycleMilestoneProgress(ms.id)}
                    title={
                      isAr
                        ? 'انقر لتحديث حالة المرحلة'
                        : 'Click to cycle milestone completion state'
                    }
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 cursor-pointer shadow-xs ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isInProgress
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 border border-purple-300 dark:border-purple-700'
                    }`}
                  >
                    {isCompleted && <CheckCircle2 className="w-4 h-4 stroke-[2.4]" />}
                    {isInProgress && <Clock className="w-4 h-4 stroke-[2.4]" />}
                    {!isCompleted && !isInProgress && (
                      <CircleDot className="w-4 h-4 stroke-[2.2]" />
                    )}
                  </button>

                  {/* Connector Progress Segment to next milestone */}
                  {idx < filteredMilestones.length - 1 && (
                    <div className="flex-1 h-1.5 mx-2 rounded-full bg-purple-200/70 dark:bg-purple-900/70 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCompleted
                            ? 'bg-emerald-500'
                            : isInProgress
                            ? 'bg-amber-500'
                            : 'bg-transparent'
                        }`}
                        style={{ width: `${ms.progressPct}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Milestone Card */}
                <div
                  onClick={() =>
                    dispatch(
                      setSelectedProject(
                        selectedProject === ms.projectId ? 'ALL' : ms.projectId
                      )
                    )
                  }
                  className={`flex-1 flex flex-col justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isProjectActive
                      ? 'bg-purple-50/90 dark:bg-purple-900/40 border-purple-400 dark:border-purple-500 shadow-sm'
                      : 'bg-white/95 dark:bg-[#160f2b] border-purple-200/70 dark:border-purple-800/60 hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                >
                  <div>
                    {/* Top Metadata Line (Unboxed clean text with separator) */}
                    <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-slate-500 dark:text-purple-300/80 tabular-nums">
                      <span className="font-mono text-purple-700 dark:text-purple-300">
                        {ms.phaseCode}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{isAr ? ms.dateAr : ms.dateEn}</span>
                      </span>
                    </div>

                    {/* Milestone Title */}
                    <h4 className="text-xs sm:text-[13.5px] font-extrabold text-[#1f1240] dark:text-white mt-1 leading-snug">
                      {isAr ? ms.titleAr : ms.titleEn}
                    </h4>

                    {/* Project Name */}
                    <p className="text-[11.5px] font-semibold text-slate-500 dark:text-purple-300/80 mt-0.5 truncate">
                      {isAr ? ms.projectNameAr : ms.projectNameEn}
                    </p>
                  </div>

                  {/* Individual Milestone Scrollable Progress Bar & Financial Release */}
                  <div className="mt-3 pt-2.5 border-t border-purple-100 dark:border-purple-800/50 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold tabular-nums">
                      <span className="text-slate-600 dark:text-purple-200">
                        {t.widgets.paymentReleaseLabel}:{' '}
                        <strong className="text-[#1f1240] dark:text-white">
                          {t.kpi.egp} {ms.ipcAmountM}M
                        </strong>
                      </span>
                      <span
                        className={`font-extrabold ${
                          isCompleted
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isInProgress
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-400 dark:text-purple-400'
                        }`}
                      >
                        {ms.progressPct}%
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-purple-100 dark:bg-purple-950 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCompleted
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                            : isInProgress
                            ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                            : 'bg-purple-300 dark:bg-purple-800'
                        }`}
                        style={{ width: `${ms.progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
