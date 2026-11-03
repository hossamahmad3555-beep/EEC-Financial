/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, X, Building2 } from 'lucide-react';
import { store, useAppSelector } from './store/store';
import { HeaderBanner } from './components/HeaderBanner';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { SubPagesView } from './components/SubPagesView';
import { QuickActionModals, QuickActionType } from './components/QuickActionModals';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { translations } from './i18n/translations';

const MainWorkspace: React.FC = () => {
  const { activeTab, theme, language, fiscalYear, selectedProject, period, projects } =
    useAppSelector((state) => state.financial);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<QuickActionType>(null);
  const [isPrintView, setIsPrintView] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const t = translations[language];
  const isAr = language === 'ar';

  // Sync dark mode class (forced light during Print View for crisp ink-friendly output) and RTL/LTR direction on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark' && !isPrintView) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.dir = language === 'ar' ? 'rtl' : 'ltr';
    root.lang = language;
  }, [theme, language, isPrintView]);

  // Ensure native browser print (Ctrl+P / Cmd+P) also removes dark class temporarily
  useEffect(() => {
    const handleBeforePrint = () => {
      document.documentElement.classList.remove('dark');
    };
    const handleAfterPrint = () => {
      if (theme === 'dark' && !isPrintView) {
        document.documentElement.classList.add('dark');
      }
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [theme, isPrintView]);

  const handleTriggerPrintView = () => {
    setIsPrintView(true);
    document.documentElement.classList.remove('dark');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Global Keyboard Shortcut Listener: Ctrl+K / Cmd+K to toggle Command Palette
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'k' || e.code === 'KeyK')) {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const selectedProjectLabel =
    selectedProject === 'ALL'
      ? t.allProjects
      : (() => {
          const found = projects.find((p) => p.id === selectedProject);
          return found ? `${found.id} — ${isAr ? found.nameAr : found.nameEn}` : selectedProject;
        })();

  const periodLabel =
    period === 'YTD'
      ? t.yearToDate
      : period === 'Q1'
      ? t.q1
      : period === 'Q2'
      ? t.q2
      : period === 'Q3'
      ? t.q3
      : t.q4;

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        isPrintView
          ? 'bg-white text-slate-900'
          : 'bg-[#25154a] dark:bg-[#0d071c] text-slate-900 dark:text-slate-100'
      }`}
    >
      {/* On-Screen Print View Mode Control Strip (Hidden on paper via no-print) */}
      {isPrintView && (
        <div className="no-print print:hidden sticky top-0 z-50 bg-[#25154a] text-white px-4 py-2.5 shadow-md flex flex-wrap items-center justify-between gap-3 border-b border-purple-400/30">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
            <Printer className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {isAr
                ? 'وضع معاينة الطباعة نشط — تم إخفاء القوائم والعناصر الزخرفية لتنسيق التقرير'
                : 'Printer-Friendly Layout Active — Navigation and decorative elements are hidden'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isAr ? 'طباعة الآن (window.print)' : 'Print Now (window.print)'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPrintView(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>{isAr ? 'إنهاء وضع الطباعة' : 'Exit Print View'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Corporate Banner (Hidden when in Print View or @media print) */}
      {!isPrintView && (
        <HeaderBanner
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenQuickAction={(action) => setActiveModal(action as QuickActionType)}
          onTriggerPrintView={handleTriggerPrintView}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />
      )}

      {/* Main Body Container: Left Purple Sidebar + Rounded Lavender/Dark Main Content Area */}
      <div className="flex-1 flex overflow-hidden print:overflow-visible">
        {!isPrintView && (
          <Sidebar
            mobileOpen={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
            onBackToPortal={() => setActiveModal('portalInfo')}
          />
        )}

        {/* Main Viewport Canvas */}
        <main
          className={`flex-1 overflow-y-auto print-expand ${
            isPrintView
              ? 'bg-white p-4 sm:p-8'
              : `bg-gradient-to-br from-[#f2effa] via-[#eae4f7] to-[#e4ddf5] dark:from-[#150e2b] dark:via-[#120b24] dark:to-[#0f091f] p-3.5 sm:p-5 shadow-inner ${
                  language === 'ar' ? 'lg:rounded-tr-3xl' : 'lg:rounded-tl-3xl'
                }`
          }`}
        >
          <div id="dashboard-export-container" className="max-w-[1600px] mx-auto">
            {/* Official Printer-Friendly Report Header (Visible in Print View and during window.print()) */}
            <div
              className={`${
                isPrintView ? 'block' : 'hidden print:block'
              } mb-5 pb-4 border-b-2 border-slate-800`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl border-2 border-slate-800 flex items-center justify-center font-extrabold text-sm text-slate-900 shrink-0">
                    EEC
                  </div>
                  <div>
                    <h1 className="text-lg font-extrabold text-slate-900 leading-tight">
                      {t.companyAr} — {t.companyEn}
                    </h1>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">
                      {t.deptAr} · {t.deptEn} · {t.actions.printReportTitle}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-700 sm:text-end space-y-0.5 tabular-nums">
                  <div className="font-bold text-slate-900">
                    {t.fiscalYear}: {fiscalYear} · {t.period}: {periodLabel}
                  </div>
                  <div>
                    {t.project}: <span className="font-semibold">{selectedProjectLabel}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {t.actions.printedOn}: {new Date().toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                {activeTab === 'dashboard' ? (
                  <DashboardView
                    onOpenQuickAction={(action) => setActiveModal(action)}
                    onTriggerPrintView={handleTriggerPrintView}
                  />
                ) : (
                  <SubPagesView
                    onOpenQuickAction={(action) => setActiveModal(action)}
                    onTriggerPrintView={handleTriggerPrintView}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Interactive Modals for Quick Actions & Command Palette (Hidden in print) */}
      {!isPrintView && (
        <div className="no-print print:hidden">
          <QuickActionModals
            activeModal={activeModal}
            onClose={() => setActiveModal(null)}
          />
          <CommandPaletteModal
            isOpen={commandPaletteOpen}
            onClose={() => setCommandPaletteOpen(false)}
            onOpenQuickAction={(action) => setActiveModal(action)}
            onTriggerPrintView={handleTriggerPrintView}
          />
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <MainWorkspace />
    </Provider>
  );
}
