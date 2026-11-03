import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  HelpCircle,
  ChevronDown,
  User,
  Sun,
  Moon,
  Globe,
  Menu,
  CheckCheck,
  RotateCcw,
  Download,
  ShieldCheck,
  FileDown,
  Check,
  Printer,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  X,
  BellOff,
  ArrowUpRight,
  Search,
  FileText,
  Loader2,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/store';
import {
  toggleTheme,
  toggleLanguage,
  markAllNotificationsRead,
  toggleNotificationRead,
  deleteNotification,
  setActiveTab,
  resetDefaultData,
  STORAGE_KEY,
} from '../store/financialSlice';
import { translations } from '../i18n/translations';
import { exportFinancialDashboardToCsv } from '../utils/exportCsv';
import { exportDashboardToPdf } from '../utils/exportPdf';

interface HeaderBannerProps {
  onOpenMobileMenu: () => void;
  onOpenQuickAction: (action: string) => void;
  onTriggerPrintView: () => void;
  onOpenCommandPalette?: () => void;
}

export const HeaderBanner: React.FC<HeaderBannerProps> = ({
  onOpenMobileMenu,
  onOpenQuickAction,
  onTriggerPrintView,
  onOpenCommandPalette,
}) => {
  const dispatch = useAppDispatch();
  const financialState = useAppSelector((state) => state.financial);
  const { theme, language, notifications, lastSavedAt } = financialState;
  const t = translations[language];
  const isRtl = language === 'ar';

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'warning'>('all');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [csvExported, setCsvExported] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfExported, setPdfExported] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const warningCount = notifications.filter((n) => n.type === 'warning').length;

  const filteredNotifications = useMemo(() => {
    if (notifFilter === 'unread') return notifications.filter((n) => !n.read);
    if (notifFilter === 'warning') return notifications.filter((n) => n.type === 'warning');
    return notifications;
  }, [notifications, notifFilter]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setShowHelpModal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportDashboardCsv = () => {
    exportFinancialDashboardToCsv(financialState);
    setCsvExported(true);
    setShowProfileMenu(false);
    setTimeout(() => setCsvExported(false), 2000);
  };

  const handleExportDashboardPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    setShowProfileMenu(false);
    try {
      await exportDashboardToPdf(financialState);
      setPdfExported(true);
      setTimeout(() => setPdfExported(false), 2500);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportStateJson = () => {
    const stateStr =
      localStorage.getItem(STORAGE_KEY) || JSON.stringify(financialState, null, 2);
    const blob = new Blob([stateStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EEC_Financial_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowProfileMenu(false);
  };

  return (
    <header className="relative w-full select-none z-30 no-print print:hidden">
      <div className="relative min-h-[82px] lg:h-[88px] w-full bg-gradient-to-r from-[#281652] via-[#3d2673] to-[#e9e4f5] dark:from-[#150c2e] dark:via-[#221547] dark:to-[#1a1333] border-b border-purple-300/40 dark:border-purple-900/50 shadow-md flex flex-col lg:flex-row items-stretch justify-between">
        {/* Panoramic Architectural & Construction Cranes Background Artwork */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg
            viewBox="0 0 1440 100"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            <defs>
              <linearGradient id="skyGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#26154d" stopOpacity="1" />
                <stop offset="30%" stopColor="#2e1b5c" stopOpacity="0.98" />
                <stop offset="36%" stopColor="#f59e0b" stopOpacity="0.35" />
                <stop offset="52%" stopColor="#f6d38c" stopOpacity="0.45" />
                <stop offset="72%" stopColor="#dcd4f0" stopOpacity="0.88" />
                <stop offset="100%" stopColor="#eee9f9" stopOpacity="0.96" />
              </linearGradient>
              <linearGradient id="skyGlowDark" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#130a29" stopOpacity="1" />
                <stop offset="32%" stopColor="#1e113d" stopOpacity="0.96" />
                <stop offset="45%" stopColor="#78450f" stopOpacity="0.35" />
                <stop offset="72%" stopColor="#231742" stopOpacity="0.92" />
                <stop offset="100%" stopColor="#181030" stopOpacity="0.98" />
              </linearGradient>
              <linearGradient id="goldWave" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#c28e38" />
                <stop offset="50%" stopColor="#f7cf6d" />
                <stop offset="100%" stopColor="#b87e28" />
              </linearGradient>
            </defs>

            {/* Base Sky Gradient */}
            <rect
              width="1440"
              height="100"
              fill={theme === 'dark' ? 'url(#skyGlowDark)' : 'url(#skyGlow)'}
            />

            {/* Construction Skyline Silhouette & High-Rise Grid (x: 430 to 940) */}
            <g opacity={theme === 'dark' ? '0.45' : '0.68'}>
              {/* Sun burst glow behind cranes */}
              <circle cx="620" cy="68" r="55" fill="#fbbf24" opacity="0.28" />
              <circle cx="540" cy="52" r="35" fill="#f59e0b" opacity="0.2" />

              {/* Distant City Towers */}
              <rect x="680" y="38" width="28" height="62" fill="#8b73b5" opacity="0.4" />
              <rect x="715" y="48" width="24" height="52" fill="#9c86c4" opacity="0.35" />
              <rect x="748" y="32" width="32" height="68" fill="#8b73b5" opacity="0.3" />
              <rect x="790" y="50" width="45" height="50" fill="#a894cc" opacity="0.25" />
              <rect x="845" y="42" width="30" height="58" fill="#a894cc" opacity="0.2" />

              {/* Left High-Rise Building Under Construction (3D perspective grid) */}
              <g transform="translate(505, 22)">
                <polygon points="0,78 0,18 42,6 42,78" fill="#4a2c6b" />
                <polygon points="42,6 76,20 76,78 42,78" fill="#7c4a58" />
                {/* Horizontal floor slabs */}
                {[16, 26, 36, 46, 56, 66].map((y) => (
                  <g key={y}>
                    <line x1="2" y1={y} x2="40" y2={y - 8} stroke="#fbbf24" strokeWidth="1.2" opacity="0.7" />
                    <line x1="42" y1={y - 8} x2="74" y2={y + 2} stroke="#fcd34d" strokeWidth="1.2" opacity="0.6" />
                  </g>
                ))}
              </g>

              {/* Center High-Rise Building Under Construction */}
              <g transform="translate(615, 28)">
                <polygon points="0,72 0,15 36,4 36,72" fill="#543375" />
                <polygon points="36,4 66,16 66,72 36,72" fill="#8a545c" />
                {[18, 28, 38, 48, 58].map((y) => (
                  <g key={y}>
                    <line x1="2" y1={y} x2="35" y2={y - 7} stroke="#fde68a" strokeWidth="1.1" opacity="0.65" />
                    <line x1="36" y1={y - 7} x2="64" y2={y + 2} stroke="#fbbf24" strokeWidth="1.1" opacity="0.55" />
                  </g>
                ))}
              </g>

              {/* Tower Crane 1 (Left) */}
              <g stroke="#d97706" strokeWidth="1.6" fill="none">
                <line x1="560" y1="95" x2="560" y2="6" strokeWidth="2.2" />
                <line x1="485" y1="14" x2="635" y2="10" strokeWidth="2" />
                <line x1="560" y1="2" x2="515" y2="13" strokeWidth="1" />
                <line x1="560" y1="2" x2="615" y2="10" strokeWidth="1" />
                <line x1="505" y1="14" x2="505" y2="38" strokeWidth="1" />
              </g>

              {/* Tower Crane 2 (Center-Right) */}
              <g stroke="#b45309" strokeWidth="1.4" fill="none">
                <line x1="695" y1="95" x2="695" y2="8" strokeWidth="2" />
                <line x1="635" y1="16" x2="765" y2="12" strokeWidth="1.8" />
                <line x1="695" y1="3" x2="655" y2="15" strokeWidth="0.9" />
                <line x1="695" y1="3" x2="745" y2="12" strokeWidth="0.9" />
                <line x1="740" y1="12" x2="740" y2="36" strokeWidth="0.9" />
              </g>

              {/* Tower Crane 3 (Far Right distant) */}
              <g stroke="#92400e" strokeWidth="1" fill="none" opacity="0.6">
                <line x1="785" y1="95" x2="785" y2="24" />
                <line x1="745" y1="28" x2="835" y2="25" />
                <line x1="785" y1="18" x2="760" y2="28" />
                <line x1="785" y1="18" x2="820" y2="25" />
              </g>
            </g>

            {/* Left Royal Purple Brand Shape + Golden Ribbon Divider */}
            <path
              d="M 0,0 L 495,0 C 460,35 445,88 380,96 L 0,96 Z"
              fill={theme === 'dark' ? '#1c103b' : '#311d61'}
            />
            <path
              d="M 0,94 L 375,94 C 438,94 458,38 502,0 L 512,0 C 466,42 444,98 378,98 L 0,98 Z"
              fill="url(#goldWave)"
            />
          </svg>
        </div>

        {/* Left Zone: EEC Seal Emblem & Bilingual Company Name */}
        <div className="relative z-10 flex items-center justify-between lg:justify-start gap-3.5 px-4 py-2.5 lg:py-0 lg:px-6 shrink-0">
          <div className="flex items-center gap-3.5">
            {/* Mobile Drawer Trigger */}
            <button
              onClick={onOpenMobileMenu}
              aria-label="Open Navigation Menu"
              className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Circular EEC Engineering Emblem SVG */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white p-0.5 shadow-lg border-2 border-amber-300/80 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="48" fill="#f8fafc" stroke="#281652" strokeWidth="2.5" />
                <circle cx="50" cy="50" r="36" fill="none" stroke="#281652" strokeWidth="1.5" strokeDasharray="3 1.5" />
                {/* Inner Building & Crane Graphic */}
                <path d="M32 64 L32 40 L44 35 L44 64 Z" fill="#281652" />
                <path d="M46 64 L46 32 L58 36 L58 64 Z" fill="#3d2673" />
                <path d="M60 64 L60 44 L68 47 L68 64 Z" fill="#4c328a" />
                {/* Crane above buildings */}
                <path d="M38 35 L38 23 L65 23 M38 26 L56 23" stroke="#d97706" strokeWidth="2" fill="none" />
                {/* EEC Text inside seal */}
                <rect x="28" y="63" width="44" height="11" rx="2" fill="#281652" />
                <text
                  x="50"
                  y="71"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="8.5"
                  fontWeight="800"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                  letterSpacing="1"
                >
                  EEC
                </text>
                {/* Top & Bottom Arc Labels */}
                <text
                  x="50"
                  y="13"
                  textAnchor="middle"
                  fill="#281652"
                  fontSize="5.5"
                  fontWeight="700"
                >
                  الشركة المصرية الهندسية للمقاولات
                </text>
                <text
                  x="50"
                  y="91"
                  textAnchor="middle"
                  fill="#281652"
                  fontSize="5.2"
                  fontWeight="700"
                >
                  Egyptian Engineering Co.
                </text>
              </svg>
            </div>

            {/* Company Name Stack */}
            <div className="flex flex-col">
              <h1
                className="text-base sm:text-xl lg:text-[22px] font-extrabold text-white tracking-tight leading-snug drop-shadow-sm whitespace-nowrap"
                style={{ fontFamily: "'Cairo', sans-serif" }}
              >
                {t.companyAr}
              </h1>
              <p className="text-xs sm:text-sm lg:text-[15px] font-medium text-purple-100/95 tracking-tight whitespace-nowrap">
                {t.companyEn}
              </p>
            </div>
          </div>
        </div>

        {/* Right Zone: Department Title & Interactive Utility Controls */}
        <div className="relative z-10 flex items-center justify-between lg:justify-end gap-3 sm:gap-5 px-4 py-2 lg:py-0 lg:px-6 bg-white/60 lg:bg-transparent dark:bg-slate-900/50 lg:dark:bg-transparent backdrop-blur-sm lg:backdrop-blur-none border-t lg:border-t-0 border-purple-200/40 dark:border-purple-800/40">
          {/* Department Title (Bilingual just like screenshot) */}
          <div className={`flex flex-col ${isRtl ? 'items-start' : 'items-end'} mr-1`}>
            <span
              className="text-lg sm:text-2xl lg:text-[26px] font-extrabold text-[#25154a] dark:text-white leading-tight whitespace-nowrap"
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              {t.deptAr}
            </span>
            <span className="text-xs sm:text-sm lg:text-[15px] font-bold text-[#25154a] dark:text-purple-200 tracking-tight whitespace-nowrap">
              {t.deptEn}
            </span>
          </div>

          {/* Action Icons & Profile Dropdown */}
          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2.5">
            {/* Command Palette (Ctrl+K) Trigger Button */}
            {onOpenCommandPalette && (
              <button
                type="button"
                onClick={onOpenCommandPalette}
                title={
                  language === 'ar'
                    ? 'فتح لوحة الأوامر والبحث السريع (Ctrl+K)'
                    : 'Open Command Palette & Quick Search (Ctrl+K)'
                }
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#3b256e]/12 hover:bg-[#3b256e]/22 dark:bg-purple-500/20 dark:hover:bg-purple-500/35 text-[#2b1954] dark:text-purple-100 border border-[#3b256e]/20 dark:border-purple-400/30 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
              >
                <Search className="w-3.5 h-3.5 text-[#3b256e] dark:text-amber-300" />
                <span className="hidden md:inline">{t.actions.commandPaletteBtn}</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[#3b256e]/15 dark:bg-purple-950/80 text-[10px] font-mono font-extrabold text-[#2b1954] dark:text-amber-300 border border-[#3b256e]/20 dark:border-purple-700/60">
                  Ctrl+K
                </kbd>
              </button>
            )}

            {/* Export CSV Button */}
            <button
              onClick={handleExportDashboardCsv}
              title={
                language === 'ar'
                  ? 'تحميل بيانات لوحة المعلومات المالية بصيغة CSV'
                  : 'Download Financial Dashboard Data as CSV'
              }
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
                csvExported
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#3b256e]/12 hover:bg-[#3b256e]/22 dark:bg-purple-500/20 dark:hover:bg-purple-500/35 text-[#2b1954] dark:text-purple-100 border border-[#3b256e]/20 dark:border-purple-400/30'
              }`}
            >
              {csvExported ? (
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {csvExported
                  ? language === 'ar'
                    ? 'تم التحميل'
                    : 'Downloaded'
                  : t.actions.exportCsv}
              </span>
            </button>

            {/* Export PDF Report Button (jspdf + html2canvas) */}
            <button
              type="button"
              onClick={handleExportDashboardPdf}
              disabled={isExportingPdf}
              title={
                language === 'ar'
                  ? 'تصدير لوحة المعلومات كتقرير PDF احترافي (jsPDF + html2canvas)'
                  : 'Download Dashboard as a Professional PDF Report (jsPDF + html2canvas)'
              }
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
                pdfExported
                  ? 'bg-emerald-600 text-white'
                  : isExportingPdf
                  ? 'bg-amber-500 text-slate-950 opacity-90 cursor-wait'
                  : 'bg-gradient-to-r from-[#d99b26] to-[#b87e28] hover:from-[#e5a832] hover:to-[#c98c32] text-white border border-amber-300/40'
              }`}
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : pdfExported ? (
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {isExportingPdf
                  ? t.actions.exportingPdf
                  : pdfExported
                  ? t.actions.pdfExported
                  : t.actions.exportPdf}
              </span>
            </button>

            {/* Print View Button (window.print() trigger) */}
            <button
              onClick={onTriggerPrintView}
              title={
                language === 'ar'
                  ? 'طباعة لوحة المعلومات المالية بتنسيق ملائم للطباعة'
                  : 'Format dashboard for printing and trigger window.print()'
              }
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#3b256e] hover:bg-[#2a1854] dark:bg-purple-600 dark:hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.actions.printView}</span>
            </button>

            {/* Language Switcher (AR / EN) */}
            <button
              onClick={() => dispatch(toggleLanguage())}
              title={language === 'en' ? 'التبديل إلى اللغة العربية' : 'Switch to English'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#3b256e]/10 hover:bg-[#3b256e]/20 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 text-[#2b1954] dark:text-purple-100 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'عربي' : 'EN'}</span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={() => dispatch(toggleTheme())}
              aria-label="Toggle Dark/Light Mode"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              className="w-8 h-8 rounded-full bg-[#3b256e]/10 hover:bg-[#3b256e]/20 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 text-[#2b1954] dark:text-amber-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-[#3b256e]" />
              ) : (
                <Sun className="w-4 h-4 text-amber-300" />
              )}
            </button>

            {/* Notification Bell with Redesigned Popover Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications((prev) => !prev)}
                aria-label="Notifications"
                aria-expanded={showNotifications}
                className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  showNotifications
                    ? 'bg-[#3b256e] text-white ring-4 ring-purple-400/30 dark:bg-purple-600 dark:ring-purple-500/30 shadow-md'
                    : 'bg-[#3b256e]/10 hover:bg-[#3b256e]/20 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 text-[#3b256e] dark:text-purple-100'
                }`}
              >
                <Bell
                  className={`w-4 h-4 transition-transform ${
                    showNotifications
                      ? 'fill-amber-300 text-amber-300 scale-105'
                      : 'fill-[#3b256e] dark:fill-purple-200'
                  }`}
                />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white dark:ring-[#1a1333] tabular-nums shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className={`absolute mt-3 w-[340px] sm:w-[410px] rounded-2xl bg-gradient-to-b from-white via-[#fcfaff] to-[#f4effc] dark:from-[#1f153a] dark:via-[#1b1233] dark:to-[#140d28] shadow-[0_20px_50px_rgba(37,21,74,0.28)] dark:shadow-[0_20px_55px_rgba(0,0,0,0.65)] border border-purple-200/90 dark:border-purple-700/70 overflow-hidden z-50 ${
                      isRtl ? 'left-0' : 'right-0'
                    }`}
                  >
                    {/* Top Pointer Caret */}
                    <div
                      className={`w-3 h-3 rotate-45 bg-[#311d61] dark:bg-[#26174d] border-t border-l border-purple-400/30 absolute -top-1.5 ${
                        isRtl ? 'left-3.5' : 'right-3.5'
                      }`}
                    />

                    {/* Popover Royal Purple Header */}
                    <div className="relative bg-gradient-to-r from-[#281652] via-[#3b256e] to-[#4c2896] dark:from-[#180d33] dark:via-[#26174d] dark:to-[#341f69] px-4 py-3 text-white flex items-center justify-between gap-2 border-b border-purple-400/20">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 shrink-0">
                          <Bell className="w-4 h-4 text-amber-300 fill-amber-300/20" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-sm tracking-tight truncate">
                              {language === 'ar'
                                ? 'الإشعارات والتنبيهات المالية'
                                : 'Financial Notifications'}
                            </h4>
                            <span className="text-[11px] font-mono font-extrabold text-amber-300 tabular-nums">
                              · {unreadCount} {language === 'ar' ? 'جديد' : ' new'}
                            </span>
                          </div>
                          <p className="text-[11px] text-purple-200/85 truncate">
                            {language === 'ar'
                              ? 'متابعة فورية للمستخلصات والموازنات وأوامر الدفع'
                              : 'Real-time IPC, budget threshold & payment alerts'}
                          </p>
                        </div>
                      </div>

                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => dispatch(markAllNotificationsRead())}
                          className="px-2.5 py-1 rounded-lg bg-white/12 hover:bg-white/22 text-[11px] font-bold text-amber-200 hover:text-white transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 border border-white/15"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>
                            {language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Interactive Filter Bar (All / Unread / Alerts) */}
                    <div className="px-3.5 py-2 bg-[#f5f0fd]/90 dark:bg-[#160e2c]/90 border-b border-purple-200/70 dark:border-purple-800/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        {(
                          [
                            {
                              id: 'all',
                              labelEn: `All (${notifications.length})`,
                              labelAr: `الكل (${notifications.length})`,
                            },
                            {
                              id: 'unread',
                              labelEn: `Unread (${unreadCount})`,
                              labelAr: `غير مقروء (${unreadCount})`,
                            },
                            {
                              id: 'warning',
                              labelEn: `Alerts (${warningCount})`,
                              labelAr: `تحذيرات (${warningCount})`,
                            },
                          ] as const
                        ).map((tab) => {
                          const active = notifFilter === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setNotifFilter(tab.id)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer tabular-nums ${
                                active
                                  ? 'bg-[#3b256e] dark:bg-purple-600 text-white shadow-2xs'
                                  : 'text-slate-600 dark:text-purple-200/80 hover:bg-purple-200/50 dark:hover:bg-purple-900/40'
                              }`}
                            >
                              {language === 'ar' ? tab.labelAr : tab.labelEn}
                            </button>
                          );
                        })}
                      </div>

                      <span className="text-[10.5px] font-semibold text-slate-400 dark:text-purple-300/60 hidden sm:inline">
                        {language === 'ar' ? 'انقر لتبديل القراءة' : 'Click item to toggle read'}
                      </span>
                    </div>

                    {/* Elegant Scrollable Notifications Area */}
                    <div className="max-h-[310px] overflow-y-auto overscroll-contain divide-y divide-purple-100/90 dark:divide-purple-800/40 px-2.5 py-2 space-y-1.5">
                      {filteredNotifications.length === 0 ? (
                        <div className="py-10 px-4 text-center flex flex-col items-center justify-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 text-[#4c2896] dark:text-purple-300 flex items-center justify-center">
                            <BellOff className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-bold text-slate-600 dark:text-purple-200">
                            {language === 'ar'
                              ? 'لا توجد إشعارات مطابقة لهذا التصنيف'
                              : 'No notifications in this category'}
                          </p>
                        </div>
                      ) : (
                        filteredNotifications.map((n) => {
                          const isWarning = n.type === 'warning';
                          const isSuccess = n.type === 'success';

                          return (
                            <div
                              key={n.id}
                              onClick={() => dispatch(toggleNotificationRead(n.id))}
                              className={`group relative p-3 rounded-xl text-xs transition-all cursor-pointer flex items-start gap-3 border ${
                                n.read
                                  ? 'bg-white/60 dark:bg-[#17102c]/50 text-slate-600 dark:text-slate-300 border-transparent hover:bg-purple-50/50 dark:hover:bg-purple-900/20'
                                  : isWarning
                                  ? 'bg-gradient-to-r from-rose-50/90 via-amber-50/60 to-white dark:from-rose-950/40 dark:via-amber-950/25 dark:to-[#1d1436] text-slate-900 dark:text-white font-semibold border-rose-200/80 dark:border-rose-800/60 shadow-2xs'
                                  : 'bg-gradient-to-r from-purple-50/95 to-white dark:from-purple-900/45 dark:to-[#1d1436] text-slate-900 dark:text-white font-semibold border-purple-200/80 dark:border-purple-700/60 shadow-2xs'
                              }`}
                            >
                              {/* Semantic Icon Box */}
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                                  isWarning
                                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/70'
                                    : isSuccess
                                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/70'
                                    : 'bg-purple-100 dark:bg-purple-900/70 text-[#4c2896] dark:text-purple-300 border-purple-200 dark:border-purple-700/70'
                                }`}
                              >
                                {isWarning ? (
                                  <AlertTriangle className="w-4 h-4" />
                                ) : isSuccess ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  <Info className="w-4 h-4" />
                                )}
                              </div>

                              {/* Content Body */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="leading-snug break-words text-[12px]">
                                    {language === 'ar' ? n.titleAr : n.titleEn}
                                  </p>
                                  {!n.read && (
                                    <span
                                      className={`w-2 h-2 rounded-full shrink-0 mt-1 ${
                                        isWarning ? 'bg-rose-500' : 'bg-[#582da8] dark:bg-amber-400'
                                      }`}
                                    />
                                  )}
                                </div>

                                <div className="flex items-center justify-between gap-2 mt-1.5">
                                  <span className="inline-flex items-center gap-1 text-[10.5px] text-slate-400 dark:text-purple-300/70 font-mono tabular-nums">
                                    <Clock className="w-3 h-3" />
                                    {language === 'ar' ? n.timeAr : n.timeEn}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      dispatch(deleteNotification(n.id));
                                    }}
                                    title={language === 'ar' ? 'حذف الإشعار' : 'Dismiss notification'}
                                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Popover Footer Bar */}
                    <div className="px-4 py-2.5 bg-[#f3eefc] dark:bg-[#140d26] border-t border-purple-200/80 dark:border-purple-800/60 flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-semibold text-slate-600 dark:text-purple-200/85 tabular-nums">
                        {language === 'ar'
                          ? `${warningCount} تنبيهات موازنة واستحقاق نشطة`
                          : `${warningCount} active budget & aging alerts`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          dispatch(setActiveTab('cost_control'));
                          setShowNotifications(false);
                        }}
                        className="inline-flex items-center gap-1 font-extrabold text-[#4c2896] dark:text-amber-300 hover:underline cursor-pointer"
                      >
                        <span>
                          {language === 'ar' ? 'مراقبة التكاليف' : 'View Cost Control'}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Help Icon (?) */}
            <div className="relative" ref={helpRef}>
              <button
                onClick={() => setShowHelpModal((prev) => !prev)}
                aria-label="Help & System Info"
                className="w-7 h-7 rounded-full bg-[#3b256e] hover:bg-[#2a1854] dark:bg-purple-600 dark:hover:bg-purple-500 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-sm"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {showHelpModal && (
                <div
                  className={`absolute mt-2 w-80 rounded-2xl bg-white dark:bg-[#1e1538] shadow-2xl border border-purple-200 dark:border-purple-800/80 p-4 z-50 text-xs ${
                    isRtl ? 'left-0' : 'right-0'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm mb-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-amber-400" />
                    <span>
                      {language === 'ar'
                        ? 'دليل نظام الإدارة المالية EEC'
                        : 'EEC Financial System Guide'}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                    {language === 'ar'
                      ? 'جميع التعديلات والفواتير والمدفوعات يتم مزامنتها فورياً عبر Redux Toolkit وحفظها تلقائياً في التخزين المحلي للمتصفح.'
                      : 'All invoices, payments, receipts, and budget updates are synchronized via Redux Toolkit and automatically persisted to localStorage.'}
                  </p>
                  <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 space-y-1">
                    <div className="font-semibold">
                      {language === 'ar' ? 'آخر حفظ تلقائي:' : 'Last Auto-Save:'}
                    </div>
                    <div className="font-mono text-[11px] tabular-nums">
                      {new Date(lastSavedAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Manager Profile Pill (Matches Screenshot) */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileMenu((prev) => !prev)}
                className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-gradient-to-r from-[#533a85] to-[#412b6e] hover:from-[#473075] hover:to-[#35215e] text-white shadow-md border border-white/25 transition-all cursor-pointer shrink-0"
              >
                <span className="w-6 h-6 rounded-full bg-white text-[#3b256e] flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5 stroke-[2.5]" />
                </span>
                <span className="text-xs sm:text-[13px] font-semibold whitespace-nowrap">
                  {t.roleTitle}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-85" />
              </button>

              {showProfileMenu && (
                <div
                  className={`absolute mt-2 w-60 rounded-2xl bg-white dark:bg-[#1e1538] shadow-2xl border border-purple-200 dark:border-purple-800/80 py-2 z-50 text-xs ${
                    isRtl ? 'left-0' : 'right-0'
                  }`}
                >
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-purple-800/50">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {language === 'ar' ? 'أحمد حسام الدين' : 'Ahmed Hossam El-Din'}
                    </div>
                    <div className="text-slate-500 dark:text-purple-300/70 text-[11px]">
                      cfo@eec-egypt.com
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenQuickAction('createInvoice');
                    }}
                    className="w-full text-start px-4 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/40 text-slate-700 dark:text-slate-200 font-medium transition-colors cursor-pointer"
                  >
                    + {t.actions.createInvoice}
                  </button>
                  <button
                    onClick={handleExportDashboardCsv}
                    className="w-full text-start px-4 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/40 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{t.actions.exportCsv}</span>
                  </button>
                  <button
                    onClick={handleExportDashboardPdf}
                    disabled={isExportingPdf}
                    className="w-full text-start px-4 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/40 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>
                      {isExportingPdf ? t.actions.exportingPdf : t.actions.exportPdf}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onTriggerPrintView();
                    }}
                    className="w-full text-start px-4 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/40 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#4c2896] dark:text-purple-300" />
                    <span>{t.actions.printView}</span>
                  </button>
                  <button
                    onClick={handleExportStateJson}
                    className="w-full text-start px-4 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/40 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-purple-600 dark:text-purple-300" />
                    <span>
                      {language === 'ar' ? 'تصدير نسخة احتياطية (JSON)' : 'Export State Backup (JSON)'}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      dispatch(resetDefaultData());
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-start px-4 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t.actions.resetData}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
