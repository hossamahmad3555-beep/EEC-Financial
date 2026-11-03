import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquareText,
  Building2,
  Send,
  Trash2,
  Clock,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  UserCheck,
  Filter,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/store';
import {
  addProjectComment,
  deleteProjectComment,
  updateProjectCompletion,
  setSelectedProject,
} from '../store/financialSlice';
import { translations } from '../i18n/translations';

interface TeamMemberPreset {
  id: string;
  nameEn: string;
  nameAr: string;
  roleEn: string;
  roleAr: string;
  initials: string;
}

const TEAM_PRESETS: TeamMemberPreset[] = [
  {
    id: 'member-1',
    nameEn: 'Ahmed Hossam',
    nameAr: 'أحمد حسام',
    roleEn: 'Financial Manager',
    roleAr: 'المدير المالي',
    initials: 'AH',
  },
  {
    id: 'member-2',
    nameEn: 'Eng. Tarek El-Masry',
    nameAr: 'م. طارق المصري',
    roleEn: 'Project Director',
    roleAr: 'مدير المشروع',
    initials: 'TE',
  },
  {
    id: 'member-3',
    nameEn: 'Sara Kamel',
    nameAr: 'سارة كامل',
    roleEn: 'Cost Control Lead',
    roleAr: 'رئيس قسم مراقبة التكاليف',
    initials: 'SK',
  },
  {
    id: 'member-4',
    nameEn: 'Eng. Mahmoud Reda',
    nameAr: 'م. محمود رضا',
    roleEn: 'Electromechanical Lead',
    roleAr: 'مدير الأعمال الكهروميكانيكية',
    initials: 'MR',
  },
  {
    id: 'member-5',
    nameEn: 'Heba El-wan',
    nameAr: 'هبة علوان',
    roleEn: 'Senior Financial Analyst',
    roleAr: 'محلل مالي أول',
    initials: 'HE',
  },
];

export const ProjectDetailCommentsSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const { language, projects, selectedProject, searchQuery, projectComments } = useAppSelector(
    (state) => state.financial
  );
  const t = translations[language];
  const isAr = language === 'ar';

  // Local active project ID for the detail view, synced with global selectedProject or search results
  const [activeDetailProjectId, setActiveDetailProjectId] = useState<string>('PRJ-01');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(TEAM_PRESETS[0].id);
  const [commentText, setCommentText] = useState<string>('');

  // Sync when global selectedProject changes to a specific project
  useEffect(() => {
    if (selectedProject !== 'ALL') {
      setActiveDetailProjectId(selectedProject);
    }
  }, [selectedProject]);

  // Also sync if searchQuery narrows down to a matching project not currently active
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    const matched = projects.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.nameAr.toLowerCase().includes(q)
    );
    if (matched.length > 0 && !matched.some((m) => m.id === activeDetailProjectId)) {
      setActiveDetailProjectId(matched[0].id);
    }
  }, [searchQuery, projects, activeDetailProjectId]);

  const currentProject = useMemo(
    () => projects.find((p) => p.id === activeDetailProjectId) || projects[0],
    [projects, activeDetailProjectId]
  );

  const currentProjectComments = useMemo(
    () => (projectComments || []).filter((c) => c.projectId === currentProject.id),
    [projectComments, currentProject.id]
  );

  // Count comments per project for tab indicators
  const commentCountsByProject = useMemo(() => {
    const map: Record<string, number> = {};
    projects.forEach((p) => {
      map[p.id] = 0;
    });
    (projectComments || []).forEach((c) => {
      map[c.projectId] = (map[c.projectId] || 0) + 1;
    });
    return map;
  }, [projects, projectComments]);

  const utilizationRatio =
    currentProject.allocatedBudget > 0
      ? currentProject.actualSpent / currentProject.allocatedBudget
      : 0;
  const utilizationPct = (utilizationRatio * 100).toFixed(1);
  const isOver90 = utilizationRatio > 0.9;
  const remainingProjectBudget = Math.max(
    0,
    currentProject.allocatedBudget - currentProject.actualSpent
  );

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) return;

    const member =
      TEAM_PRESETS.find((m) => m.id === selectedMemberId) || TEAM_PRESETS[0];

    dispatch(
      addProjectComment({
        projectId: currentProject.id,
        authorNameEn: member.nameEn,
        authorNameAr: member.nameAr,
        authorRoleEn: member.roleEn,
        authorRoleAr: member.roleAr,
        commentEn: trimmed,
        commentAr: trimmed,
      })
    );
    setCommentText('');
  };

  const quickTemplates = isAr
    ? [
        'تمت مطابقة المستخلص الجاري مع نسب الإنجاز الفعلي في الموقع.',
        'مراجعة انحرافات تكلفة مقاولي الباطن — ضمن الموازنة المعتمدة.',
        'تم اعتماد دفعة التوريدات الكهروميكانيكية وتحديث الجدول الزمني.',
      ]
    : [
        'Interim payment certificate reconciled against verified site progress.',
        'Subcontractor cost variance reviewed — tracking within allocated baseline.',
        'MEP procurement milestone approved and schedule updated.',
      ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="print-card h-full overflow-auto bg-white/95 dark:bg-[#1b1333]/95 rounded-2xl p-4 sm:p-5 border border-purple-200/80 dark:border-purple-800/50 shadow-[0_6px_22px_rgba(59,37,110,0.06)] flex flex-col gap-4"
    >
      {/* Top Section Header + Project Selector Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-purple-100 dark:border-purple-800/50">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center border border-purple-200 dark:border-purple-700/60 shrink-0">
            <MessageSquareText className="w-5 h-5 text-[#4c2896] dark:text-purple-300" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[15px] sm:text-base font-extrabold text-[#1e123d] dark:text-white">
                {t.widgets.projectDetailTitle}
              </h3>
              <span className="text-xs font-bold text-[#4c2896] dark:text-purple-300 font-mono tabular-nums">
                · {currentProject.id} · {currentProjectComments.length}{' '}
                {isAr ? 'ملاحظات مسجلة' : 'Notes'}
              </span>
            </div>
            <p className="text-[11.5px] text-slate-500 dark:text-purple-300/75">
              {t.widgets.projectDetailSubtitle}
            </p>
          </div>
        </div>

        {/* Interactive Project Selector Tabs */}
        <div className="no-print print:hidden flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
          {projects.map((proj) => {
            const isSelected = proj.id === currentProject.id;
            const noteCount = commentCountsByProject[proj.id] || 0;
            return (
              <button
                key={proj.id}
                type="button"
                onClick={() => setActiveDetailProjectId(proj.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                  isSelected
                    ? 'bg-[#3b256e] dark:bg-purple-600 text-white border-[#3b256e] dark:border-purple-500 shadow-xs'
                    : 'bg-[#f8f5ff] dark:bg-[#140d26] text-slate-700 dark:text-purple-200 border-purple-200/80 dark:border-purple-800/60 hover:bg-purple-100/70 dark:hover:bg-purple-900/40'
                }`}
              >
                <span className="font-mono text-[11px] opacity-85">{proj.id}</span>
                <span>{isAr ? proj.nameAr : proj.nameEn}</span>
                <span
                  className={`text-[10.5px] font-mono tabular-nums ${
                    isSelected
                      ? 'text-amber-300 font-extrabold'
                      : 'text-slate-400 dark:text-purple-400'
                  }`}
                >
                  ({noteCount})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Layout: Left = Individual Project Detail Breakdown, Right = Team Progress Notes & Comment Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT COLUMN (5 cols): Individual Project Detail Card */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#faf8ff] to-[#f3effc] dark:from-[#150e28] dark:to-[#120b22] rounded-xl p-4 border border-purple-200/70 dark:border-purple-800/60 flex flex-col gap-3.5">
          {/* Project Identity & Status */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#4c2896] dark:text-purple-300 shrink-0" />
                <span className="text-xs font-mono font-extrabold text-[#4c2896] dark:text-purple-300">
                  {currentProject.id}
                </span>
                <span className="text-xs text-slate-400 dark:text-purple-400">·</span>
                <span
                  className={`text-xs font-bold flex items-center gap-1 ${
                    isOver90
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {isOver90 ? (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {isAr ? 'يتطلب مراجعة الموازنة' : 'Budget Review Flagged'}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isAr ? 'ضمن المسار المالي' : 'On Financial Track'}
                    </>
                  )}
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-extrabold text-[#1e123d] dark:text-white mt-0.5 truncate">
                {isAr ? currentProject.nameAr : currentProject.nameEn}
              </h4>
            </div>

            {/* Filter Dashboard by this Project toggle */}
            <button
              type="button"
              onClick={() =>
                dispatch(
                  setSelectedProject(
                    selectedProject === currentProject.id ? 'ALL' : currentProject.id
                  )
                )
              }
              className={`no-print print:hidden flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 border ${
                selectedProject === currentProject.id
                  ? 'bg-amber-500 text-slate-950 border-amber-500'
                  : 'bg-white dark:bg-[#1f1538] text-[#3b256e] dark:text-purple-200 border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/40'
              }`}
              title={
                isAr
                  ? 'تصفية لوحة التحكم بالكامل حسب هذا المشروع'
                  : 'Filter entire dashboard by this project'
              }
            >
              <Filter className="w-3 h-3" />
              <span>
                {selectedProject === currentProject.id
                  ? isAr
                    ? 'إلغاء التصفية'
                    : 'Filtered'
                  : isAr
                  ? 'تركيز اللوحة'
                  : 'Focus Project'}
              </span>
            </button>
          </div>

          {/* Interactive Physical Completion Progress Bar & Slider */}
          <div className="bg-white/90 dark:bg-[#1c1333] rounded-xl p-3 border border-purple-200/60 dark:border-purple-800/50">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-slate-600 dark:text-purple-200 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#4c2896] dark:text-purple-300" />
                {isAr ? 'نسبة الإنجاز الهندسي الحالي' : 'Physical Completion Progress'}
              </span>
              <span className="text-sm font-extrabold text-[#1e123d] dark:text-white tabular-nums">
                {currentProject.completionPercentage}%
              </span>
            </div>

            <div className="relative h-3 w-full rounded-full bg-[#e6e1f2] dark:bg-[#120c24] overflow-hidden shadow-inner mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${currentProject.completionPercentage}%` }}
                transition={{ duration: 0.4 }}
                className="h-full rounded-full"
                style={{
                  background:
                    currentProject.colorType === 'green'
                      ? 'linear-gradient(90deg, #52d159 0%, #249e38 100%)'
                      : currentProject.colorType === 'blue' || currentProject.colorType === 'sky'
                      ? 'linear-gradient(90deg, #3da2ff 0%, #1c74e8 100%)'
                      : currentProject.colorType === 'gold'
                      ? 'linear-gradient(90deg, #f5b942 0%, #d4891c 100%)'
                      : 'linear-gradient(90deg, #f27474 0%, #d13b3b 100%)',
                }}
              />
            </div>

            <div className="no-print print:hidden flex items-center gap-2">
              <span className="text-[10.5px] font-semibold text-slate-400 dark:text-purple-400">
                {isAr ? 'تحديث الإنجاز:' : 'Adjust progress:'}
              </span>
              <input
                type="range"
                min={5}
                max={100}
                value={currentProject.completionPercentage}
                onChange={(e) =>
                  dispatch(
                    updateProjectCompletion({
                      projectId: currentProject.id,
                      percentage: Number(e.target.value),
                    })
                  )
                }
                aria-label={`${currentProject.nameEn} completion percentage`}
                className="flex-1 h-1.5 accent-[#4c2896] dark:accent-purple-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Key Project Financial Metrics Grid (2x3) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white/90 dark:bg-[#1c1333] rounded-xl p-2.5 border border-purple-100 dark:border-purple-800/40">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-purple-300/75">
                {isAr ? 'قيمة العقد الإجمالية' : 'Contract Value'}
              </div>
              <div className="text-sm font-extrabold text-[#1e123d] dark:text-white tabular-nums mt-0.5">
                {t.kpi.egp} {(currentProject.contractValue / 1e6).toFixed(1)}M
              </div>
            </div>

            <div className="bg-white/90 dark:bg-[#1c1333] rounded-xl p-2.5 border border-purple-100 dark:border-purple-800/40">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-purple-300/75">
                {isAr ? 'الأعمال المنفذة' : 'Executed Value'}
              </div>
              <div className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">
                {t.kpi.egp} {(currentProject.executedValue / 1e6).toFixed(1)}M
              </div>
            </div>

            <div className="bg-white/90 dark:bg-[#1c1333] rounded-xl p-2.5 border border-purple-100 dark:border-purple-800/40">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-purple-300/75">
                {isAr ? 'الموازنة المعتمدة' : 'Allocated Budget'}
              </div>
              <div className="text-sm font-extrabold text-[#3b256e] dark:text-purple-300 tabular-nums mt-0.5">
                {t.kpi.egp} {(currentProject.allocatedBudget / 1e6).toFixed(1)}M
              </div>
            </div>

            <div className="bg-white/90 dark:bg-[#1c1333] rounded-xl p-2.5 border border-purple-100 dark:border-purple-800/40">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-purple-300/75">
                {isAr ? 'الإنفاق الفعلي (استهلاك)' : 'Actual Spent'}
              </div>
              <div
                className={`text-sm font-extrabold tabular-nums mt-0.5 ${
                  isOver90
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {t.kpi.egp} {(currentProject.actualSpent / 1e6).toFixed(1)}M ({utilizationPct}%)
              </div>
            </div>

            <div className="bg-white/90 dark:bg-[#1c1333] rounded-xl p-2.5 border border-purple-100 dark:border-purple-800/40">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-purple-300/75">
                {isAr ? 'إجمالي الفواتير' : 'Invoiced Value'}
              </div>
              <div className="text-sm font-extrabold text-sky-700 dark:text-sky-400 tabular-nums mt-0.5">
                {t.kpi.egp} {(currentProject.invoicedValue / 1e6).toFixed(1)}M
              </div>
            </div>

            <div className="bg-white/90 dark:bg-[#1c1333] rounded-xl p-2.5 border border-purple-100 dark:border-purple-800/40">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-purple-300/75">
                {isAr ? 'المتبقي من الموازنة' : 'Remaining Budget'}
              </div>
              <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200 tabular-nums mt-0.5">
                {t.kpi.egp} {(remainingProjectBudget / 1e6).toFixed(1)}M
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (7 cols): Team Progress Notes Form & Comment Stream */}
        <div className="lg:col-span-7 flex flex-col gap-3.5">
          {/* Add Progress Note Form (Hidden when printing) */}
          <form
            onSubmit={handlePostComment}
            className="no-print print:hidden bg-[#faf8ff] dark:bg-[#150e28] rounded-xl p-3.5 border border-purple-200/70 dark:border-purple-800/60 flex flex-col gap-2.5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-extrabold text-[#1e123d] dark:text-white flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#4c2896] dark:text-purple-300" />
                <span>{t.widgets.teamCommentsHeader}</span>
              </label>

              {/* Team Member Role Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-purple-300/80 whitespace-nowrap">
                  {t.widgets.authorRoleLabel}:
                </span>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  aria-label={t.widgets.authorRoleLabel}
                  className="bg-white dark:bg-[#1f1538] text-xs font-bold text-[#211342] dark:text-white rounded-lg px-2.5 py-1 border border-purple-200 dark:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  {TEAM_PRESETS.map((member) => (
                    <option key={member.id} value={member.id}>
                      {isAr
                        ? `${member.nameAr} — ${member.roleAr}`
                        : `${member.nameEn} — ${member.roleEn}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comment Textarea */}
            <div className="relative">
              <textarea
                rows={2}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={t.widgets.commentPlaceholder}
                className="w-full rounded-xl bg-white dark:bg-[#1c1333] border border-purple-200/90 dark:border-purple-700/70 px-3 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-purple-300/50 focus:outline-none focus:ring-2 focus:ring-[#4c2896] dark:focus:ring-purple-500 transition-all resize-none"
              />
            </div>

            {/* Quick Template Chips + Post Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {quickTemplates.map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCommentText(tpl)}
                    className="text-[10.5px] font-semibold text-[#4c2896] dark:text-purple-300 bg-purple-100/70 dark:bg-purple-900/40 hover:bg-purple-200/70 dark:hover:bg-purple-800/50 px-2 py-0.5 rounded-lg transition-colors cursor-pointer truncate max-w-[210px]"
                    title={tpl}
                  >
                    + {tpl}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={!commentText.trim()}
                className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#3b256e] hover:bg-[#2c1a54] disabled:opacity-45 dark:bg-purple-600 dark:hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer shrink-0 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{t.widgets.postCommentBtn}</span>
              </button>
            </div>
          </form>

          {/* Comments Feed List */}
          <div className="print-expand flex flex-col gap-2.5 max-h-[300px] print:max-h-none overflow-y-auto pr-1">
            <AnimatePresence mode="popLayout">
              {currentProjectComments.length === 0 ? (
                <motion.div
                  key="empty-comments"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-[#faf8ff] dark:bg-[#150e28] rounded-xl p-6 border border-dashed border-purple-200 dark:border-purple-800/60 text-center text-xs text-slate-500 dark:text-purple-300/70"
                >
                  {t.widgets.noCommentsYet}
                </motion.div>
              ) : (
                currentProjectComments.map((item) => {
                  const authorName = isAr ? item.authorNameAr : item.authorNameEn;
                  const authorRole = isAr ? item.authorRoleAr : item.authorRoleEn;
                  const commentBody = isAr ? item.commentAr : item.commentEn;
                  const initials = item.authorNameEn
                    .replace('Eng. ', '')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="bg-white dark:bg-[#17102c] rounded-xl p-3 border border-purple-100 dark:border-purple-800/60 shadow-2xs flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        {/* Avatar Initials */}
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4c2896] to-[#2b1659] text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                          {initials}
                        </div>

                        <div className="min-w-0 flex-1">
                          {/* Author Metadata Line (No pill enclosure — clean typographic hierarchy with middot separators) */}
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="font-extrabold text-[#1e123d] dark:text-white">
                              {authorName}
                            </span>
                            <span className="text-slate-400 dark:text-purple-400">·</span>
                            <span className="font-semibold text-[#4c2896] dark:text-purple-300">
                              {authorRole}
                            </span>
                            <span className="text-slate-400 dark:text-purple-400">·</span>
                            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 tabular-nums">
                              <TrendingUp className="w-3 h-3" />
                              {t.widgets.progressAtNote}: {item.progressSnapshot}%
                            </span>
                            <span className="text-slate-400 dark:text-purple-400">·</span>
                            <span className="text-[11px] text-slate-400 dark:text-purple-300/70 flex items-center gap-1 font-mono tabular-nums">
                              <Clock className="w-3 h-3" />
                              {item.createdAt}
                            </span>
                          </div>

                          {/* Note Content */}
                          <p className="text-xs sm:text-[13px] text-slate-700 dark:text-purple-100/90 mt-1 leading-relaxed break-words">
                            {commentBody}
                          </p>
                        </div>
                      </div>

                      {/* Delete Note Button */}
                      <button
                        type="button"
                        onClick={() => dispatch(deleteProjectComment(item.id))}
                        title={t.widgets.deleteComment}
                        aria-label={t.widgets.deleteComment}
                        className="no-print print:hidden p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:text-purple-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
