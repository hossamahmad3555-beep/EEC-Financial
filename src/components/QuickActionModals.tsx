import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Download, Building2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/store';
import {
  createNewInvoice,
  registerNewPayment,
  recordCashReceipt,
  updateBudgetAllocation,
} from '../store/financialSlice';
import { translations } from '../i18n/translations';
import { exportFinancialDashboardToCsv } from '../utils/exportCsv';

export type QuickActionType =
  | 'createInvoice'
  | 'registerPayment'
  | 'recordReceipt'
  | 'costEntry'
  | 'budgetPlanning'
  | 'financialReport'
  | 'portalInfo'
  | null;

interface QuickActionModalsProps {
  activeModal: QuickActionType;
  onClose: () => void;
}

export const QuickActionModals: React.FC<QuickActionModalsProps> = ({
  activeModal,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const financialState = useAppSelector((state) => state.financial);
  const {
    language,
    projects,
    budgetVsActual,
    cashFlow,
    totalContracts,
    executedValue,
    totalInvoices,
    totalPayments,
  } = financialState;
  const t = translations[language];
  const isAr = language === 'ar';

  // Form states
  const [projectId, setProjectId] = useState(projects[0]?.id || 'PRJ-01');
  const [clientName, setClientName] = useState('New Urban Communities Authority');
  const [amountMillions, setAmountMillions] = useState('15');
  const [dueDate, setDueDate] = useState('2026-12-15');
  const [invoiceType, setInvoiceType] = useState<'receivable' | 'payable'>('receivable');
  const [category, setCategory] = useState<
    'Civil' | 'Architectural' | 'Mechanical' | 'Electrical' | 'Others'
  >('Civil');
  const [monthIndex, setMonthIndex] = useState(11);

  if (!activeModal) return null;

  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Math.max(1, Number(amountMillions)) * 1000000;
    dispatch(
      createNewInvoice({
        projectId,
        clientEn: clientName,
        clientAr: clientName,
        amount: numericAmount,
        dueDate,
        type: invoiceType,
      })
    );
    onClose();
  };

  const handleRegisterPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Math.max(1, Number(amountMillions)) * 1000000;
    dispatch(
      registerNewPayment({
        projectId,
        beneficiaryEn: clientName || 'Engineering Contractor Co.',
        beneficiaryAr: clientName || 'شركة المقاولات الهندسية',
        amount: numericAmount,
        category,
        methodEn: 'Bank Transfer (RTGS)',
        methodAr: 'تحويل بنكي فوري',
      })
    );
    onClose();
  };

  const handleRecordReceiptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Math.max(1, Number(amountMillions)) * 1000000;
    dispatch(
      recordCashReceipt({
        projectId,
        amount: numericAmount,
        monthIndex,
      })
    );
    onClose();
  };

  const handleDownloadExecutiveCsv = () => {
    exportFinancialDashboardToCsv(financialState);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-[#1e1538] border border-purple-200 dark:border-purple-800 shadow-2xl overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#2c1a54] to-[#462b82] text-white">
            <h3 className="text-base font-extrabold">
              {activeModal === 'createInvoice' && t.actions.createInvoice}
              {(activeModal === 'registerPayment' || activeModal === 'costEntry') &&
                (activeModal === 'costEntry' ? t.actions.costEntry : t.actions.registerPayment)}
              {activeModal === 'recordReceipt' && t.actions.recordReceipt}
              {activeModal === 'budgetPlanning' && t.actions.budgetPlanning}
              {activeModal === 'financialReport' && t.actions.financialReport}
              {activeModal === 'portalInfo' && t.backToPortal}
            </h3>
            <button
              onClick={onClose}
              aria-label="Close Modal"
              className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 text-xs sm:text-sm">
            {/* CREATE INVOICE FORM */}
            {activeModal === 'createInvoice' && (
              <form onSubmit={handleCreateInvoiceSubmit} className="space-y-3.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-purple-200 mb-1">
                    {t.project}
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full rounded-xl bg-purple-50/70 dark:bg-[#140d29] border border-purple-200 dark:border-purple-700 px-3 py-2 font-semibold text-slate-900 dark:text-white"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {isAr ? p.nameAr : p.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-purple-200 mb-1">
                      {isAr ? 'نوع الفاتورة' : 'Invoice Type'}
                    </label>
                    <select
                      value={invoiceType}
                      onChange={(e) =>
                        setInvoiceType(e.target.value as 'receivable' | 'payable')
                      }
                      className="w-full rounded-xl bg-purple-50/70 dark:bg-[#140d29] border border-purple-200 dark:border-purple-700 px-3 py-2 font-semibold text-slate-900 dark:text-white"
                    >
                      <option value="receivable">
                        {isAr ? 'مستخلص عميل (مستحقات)' : 'Client IPC (Receivable)'}
                      </option>
                      <option value="payable">
                        {isAr ? 'فاتورة مورد (مدفوعات)' : 'Subcontractor (Payable)'}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-purple-200 mb-1">
                      {isAr ? 'القيمة (بالمليون ج.م)' : 'Amount (Millions EGP)'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      required
                      value={amountMillions}
                      onChange={(e) => setAmountMillions(e.target.value)}
                      className="w-full rounded-xl bg-purple-50/70 dark:bg-[#140d29] border border-purple-200 dark:border-purple-700 px-3 py-2 font-extrabold text-slate-900 dark:text-white tabular-nums"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-purple-200 mb-1">
                      {isAr ? 'الجهة / العميل' : 'Client / Entity'}
                    </label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full rounded-xl bg-purple-50/70 dark:bg-[#140d29] border border-purple-200 dark:border-purple-700 px-3 py-2 font-semibold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-purple-200 mb-1">
                      {isAr ? 'تاريخ الاستحقاق' : 'Due Date'}
                    </label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full rounded-xl bg-purple-50/70 dark:bg-[#140d29] border border-purple-200 dark:border-purple-700 px-3 py-2 font-semibold text-slate-900 dark:text-white tabular-nums"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-purple-700 text-slate-700 dark:text-purple-200 font-bold cursor-pointer"
                  >
                    {t.actions.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#4b2d87] to-[#6341a8] text-white font-bold shadow-md cursor-pointer"
                  >
                    {t.actions.save}
                  </button>
                </div>
              </form>
            )}

            {/* REGISTER PAYMENT / COST ENTRY FORM */}
            {(activeModal === 'registerPayment' || activeModal === 'costEntry') && (
              <form onSubmit={handleRegisterPaymentSubmit} className="space-y-3.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-purple-200 mb-1">
                    {t.project}
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full rounded-xl bg-purple-50/70 dark:bg-[#140d29] border border-purple-200 dark:border-purple-700 px-3 py-2 font-semibold text-slate-900 dark:text-white"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {isAr ? p.nameAr : p.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-purple-200 mb-1">
                      {isAr ? 'بند التكلفة / الموازنة' : 'Cost Category'}
                    </label>
                    <select
                      value={category}
                      onChange={(e) =>
                        setCategory(
                          e.target.value as
                            | 'Civil'
                            | 'Architectural'
                            | 'Mechanical'
                            | 'Electrical'
                            | 'Others'
                        )
                      }
                      className="w-full rounded-xl bg-purple-50/70 dark:bg-[#140d29] border border-purple-200 dark:border-purple-700 px-3 py-2 font-semibold text-slate-900 dark:text-white"
                    >
                      <option value="Civil">Civil (مدني)</option>
                      <option value="Architectural">Architectural (معماري)</option>
                      <option value="Mechanical">Mechanical (ميكانيكا)</option>
                      <option value="Electrical">Electrical (كهرباء)</option>
                      <option value="Others">Others (أخرى)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-purple-200 mb-1">
                      {isAr ? 'المبلغ (مليون ج.م)' : 'Amount (Millions EGP)'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="300"
                      required
                      value={amountMillions}
                      onChange={(e) => setAmountMillions(e.target.value)}
                      className="w-full rounded-xl bg-purple-50/70 dark:bg-[#140d29] border border-purple-200 dark:border-purple-700 px-3 py-2 font-extrabold text-slate-900 dark:text-white tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-purple-200 mb-1">
                    {isAr ? 'المستفيد / المقاول' : 'Beneficiary / Supplier'}
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full rounded-xl bg-purple-50/70 dark:bg-[#140d29] border border-purple-200 dark:border-purple-700 px-3 py-2 font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-purple-700 text-slate-700 dark:text-purple-200 font-bold cursor-pointer"
                  >
                    {t.actions.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#d68b1c] to-[#b87310] text-white font-bold shadow-md cursor-pointer"
                  >
                    {t.actions.save}
                  </button>
                </div>
              </form>
            )}

            {/* RECORD RECEIPT FORM */}
            {activeModal === 'recordReceipt' && (
              <form onSubmit={handleRecordReceiptSubmit} className="space-y-3.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-purple-200 mb-1">
                    {t.project}
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full rounded-xl bg-purple-50/70 dark:bg-[#140d29] border border-purple-200 dark:border-purple-700 px-3 py-2 font-semibold text-slate-900 dark:text-white"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {isAr ? p.nameAr : p.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-purple-200 mb-1">
                      {isAr ? 'الشهر' : 'Cash Flow Month'}
                    </label>
                    <select
                      value={monthIndex}
                      onChange={(e) => setMonthIndex(Number(e.target.value))}
                      className="w-full rounded-xl bg-purple-50/70 dark:bg-[#140d29] border border-purple-200 dark:border-purple-700 px-3 py-2 font-semibold text-slate-900 dark:text-white"
                    >
                      {cashFlow.map((m, idx) => (
                        <option key={m.monthKey} value={idx}>
                          {isAr ? m.labelAr : m.labelEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-purple-200 mb-1">
                      {isAr ? 'قيمة المقبوضات (مليون ج.م)' : 'Receipt (Millions EGP)'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      required
                      value={amountMillions}
                      onChange={(e) => setAmountMillions(e.target.value)}
                      className="w-full rounded-xl bg-purple-50/70 dark:bg-[#140d29] border border-purple-200 dark:border-purple-700 px-3 py-2 font-extrabold text-slate-900 dark:text-white tabular-nums"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-purple-700 text-slate-700 dark:text-purple-200 font-bold cursor-pointer"
                  >
                    {t.actions.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md cursor-pointer"
                  >
                    {t.actions.save}
                  </button>
                </div>
              </form>
            )}

            {/* BUDGET PLANNING MODAL */}
            {activeModal === 'budgetPlanning' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-purple-200">
                  {isAr
                    ? 'عدّل قيم الموازنة التقديرية أو التكلفة الفعلية (بالمليون ج.م) لتحديث الرسم البياني فوراً:'
                    : 'Adjust Budget or Actual figures (in Millions EGP) to update the chart live:'}
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {budgetVsActual.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/60 dark:bg-[#140d29] border border-purple-200/70 dark:border-purple-800/60"
                    >
                      <span className="font-bold text-slate-900 dark:text-white">
                        {isAr ? cat.nameAr : cat.nameEn}
                      </span>
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-slate-500">
                          {t.widgets.budget}:
                        </label>
                        <input
                          type="number"
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
                          className="w-16 px-2 py-1 rounded-lg bg-white dark:bg-[#1e1538] border border-purple-300 dark:border-purple-700 font-bold text-center tabular-nums"
                        />
                        <label className="text-[11px] text-slate-500">
                          {t.widgets.actual}:
                        </label>
                        <input
                          type="number"
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
                          className="w-16 px-2 py-1 rounded-lg bg-white dark:bg-[#1e1538] border border-amber-400 dark:border-amber-700 font-bold text-center tabular-nums"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={onClose}
                    className="px-5 py-2 rounded-xl bg-purple-700 text-white font-bold cursor-pointer"
                  >
                    {isAr ? 'تم' : 'Done'}
                  </button>
                </div>
              </div>
            )}

            {/* FINANCIAL REPORT MODAL */}
            {activeModal === 'financialReport' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-purple-50 dark:bg-[#140d29] border border-purple-200 dark:border-purple-800 space-y-2">
                  <div className="flex items-center gap-2 font-extrabold text-purple-900 dark:text-purple-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      {isAr
                        ? 'ملخص المركز المالي التنفيذي - EEC 2026'
                        : 'EEC 2026 Executive Financial Summary'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2 rounded-lg bg-white dark:bg-[#1e1538]">
                      <div className="text-slate-500">{t.kpi.totalContracts}</div>
                      <div className="font-extrabold text-slate-900 dark:text-white tabular-nums">
                        EGP {totalContracts.toLocaleString('en-US')}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#1e1538]">
                      <div className="text-slate-500">{t.kpi.executedValue}</div>
                      <div className="font-extrabold text-emerald-600 tabular-nums">
                        EGP {executedValue.toLocaleString('en-US')}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#1e1538]">
                      <div className="text-slate-500">{t.kpi.totalInvoices}</div>
                      <div className="font-extrabold text-blue-600 tabular-nums">
                        EGP {totalInvoices.toLocaleString('en-US')}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#1e1538]">
                      <div className="text-slate-500">{t.kpi.totalPayments}</div>
                      <div className="font-extrabold text-amber-600 tabular-nums">
                        EGP {totalPayments.toLocaleString('en-US')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-purple-700 font-bold cursor-pointer"
                  >
                    {t.actions.cancel}
                  </button>
                  <button
                    onClick={handleDownloadExecutiveCsv}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#4b2d87] to-[#6341a8] text-white font-bold shadow-md cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t.actions.exportCsv}</span>
                  </button>
                </div>
              </div>
            )}

            {/* PORTAL INFO MODAL */}
            {activeModal === 'portalInfo' && (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center mx-auto">
                  <Building2 className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {t.companyAr} — {t.companyEn}
                </h4>
                <p className="text-xs text-slate-600 dark:text-purple-200 max-w-md mx-auto leading-relaxed">
                  {isAr
                    ? 'أنت الآن في وحدة الإدارة المالية المركزية (ERP). يمكنك التنقل بين وحدات العقود، المستخلصات، أوامر الدفع، والموازنة التقديرية من القائمة الجانبية.'
                    : 'You are currently in the Financial Management ERP Module. Use the sidebar to switch between Contracts, Invoices, Payment Orders, Cost Control, and Budgeting.'}
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl bg-purple-700 text-white font-bold cursor-pointer"
                >
                  {isAr ? 'العودة للوحة التحكم' : 'Return to Dashboard'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
