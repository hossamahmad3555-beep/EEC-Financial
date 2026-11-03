import React from 'react';
import {
  Home,
  FileSignature,
  FileText,
  FileCheck2,
  HandCoins,
  Coins,
  Gauge,
  Landmark,
  BarChart3,
  Calculator,
  Settings,
  ArrowLeft,
  ArrowRight,
  X,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { setActiveTab } from '../store/financialSlice';
import { NavTabId } from '../types/financial';
import { translations } from '../i18n/translations';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onBackToPortal: () => void;
}

interface NavItemConfig {
  id: NavTabId;
  icon: React.FC<{ className?: string }>;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'dashboard', icon: Home },
  { id: 'contracts', icon: FileSignature },
  { id: 'invoices', icon: FileText },
  { id: 'payment_orders', icon: FileCheck2 },
  { id: 'receivables', icon: HandCoins },
  { id: 'payables', icon: Coins },
  { id: 'cost_control', icon: Gauge },
  { id: 'budget', icon: Landmark },
  { id: 'reports', icon: BarChart3 },
  { id: 'accounting', icon: Calculator },
  { id: 'settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  onCloseMobile,
  onBackToPortal,
}) => {
  const dispatch = useAppDispatch();
  const { activeTab, language } = useAppSelector((state) => state.financial);
  const t = translations[language];
  const isRtl = language === 'ar';

  const handleSelectTab = (id: NavTabId) => {
    dispatch(setActiveTab(id));
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full w-[215px] xl:w-[225px] bg-gradient-to-b from-[#2c1a54] via-[#251547] to-[#1e103a] dark:from-[#160d2e] dark:via-[#120a26] dark:to-[#0d071c] text-white px-2.5 py-3.5 select-none shrink-0 shadow-xl">
      {/* Top Navigation List */}
      <nav className="space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          const label = t.nav[item.id];

          return (
            <div
              key={item.id}
              className="border-b border-purple-300/10 last:border-b-0 pb-0.5 pt-0.5"
            >
              <button
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-[#f7e2a4] via-[#ecc365] to-[#d89f38] text-[#241445] font-extrabold shadow-md scale-[1.01]'
                    : 'text-purple-100/90 hover:text-white hover:bg-white/10 font-medium'
                }`}
              >
                <IconComponent
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#2b1854] stroke-[2.4]' : 'text-purple-200/85'
                  }`}
                />
                <span className="truncate">{label}</span>
              </button>
            </div>
          );
        })}
      </nav>

      {/* Bottom Back to Portal Button */}
      <div className="pt-4 mt-2">
        <button
          onClick={onBackToPortal}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-full border border-purple-300/30 bg-[#32205f]/60 hover:bg-[#3f2975] text-purple-100 hover:text-white text-xs font-semibold shadow-inner transition-all cursor-pointer whitespace-nowrap"
        >
          {isRtl ? (
            <ArrowRight className="w-4 h-4 text-purple-200" />
          ) : (
            <ArrowLeft className="w-4 h-4 text-purple-200" />
          )}
          <span>{t.backToPortal}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Permanent Sidebar */}
      <aside className="hidden lg:block shrink-0 no-print print:hidden">{sidebarContent}</aside>

      {/* Mobile / Tablet Responsive Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 flex h-full">
            {sidebarContent}
            <button
              onClick={onCloseMobile}
              aria-label="Close Menu"
              className="m-3 w-9 h-9 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
