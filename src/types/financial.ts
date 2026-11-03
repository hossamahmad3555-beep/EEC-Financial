export type NavTabId =
  | 'dashboard'
  | 'contracts'
  | 'invoices'
  | 'payment_orders'
  | 'receivables'
  | 'payables'
  | 'cost_control'
  | 'budget'
  | 'reports'
  | 'accounting'
  | 'settings';

export type Language = 'en' | 'ar';
export type ThemeMode = 'light' | 'dark';

export interface CashFlowMonth {
  monthKey: string;
  labelEn: string;
  labelAr: string;
  inflow: number; // in Millions EGP
  outflow: number; // in Millions EGP
}

export interface ProjectStatusItem {
  id: string;
  nameEn: string;
  nameAr: string;
  contractValue: number;
  allocatedBudget: number;
  actualSpent: number;
  executedValue: number;
  invoicedValue: number;
  paidValue: number;
  completionPercentage: number;
  colorType: 'green' | 'blue' | 'gold' | 'sky' | 'red';
  managerEn: string;
  managerAr: string;
}

export interface AgingItem {
  id: string;
  periodEn: string;
  periodAr: string;
  amount: number;
  percentage: number;
  badgeColor: 'green' | 'yellow' | 'orange' | 'red';
}

export interface BudgetCategoryItem {
  id: string;
  nameEn: string;
  nameAr: string;
  budget: number; // in Millions EGP
  actual: number; // in Millions EGP
  iconType: 'civil' | 'architectural' | 'mechanical' | 'electrical' | 'others';
}

export interface InvoiceRecord {
  id: string;
  invoiceNo: string;
  projectId: string;
  projectNameEn: string;
  projectNameAr: string;
  clientEn: string;
  clientAr: string;
  amount: number;
  date: string;
  dueDate: string;
  status: 'paid' | 'approved' | 'pending' | 'overdue';
  type: 'receivable' | 'payable';
}

export interface PaymentOrderRecord {
  id: string;
  orderNo: string;
  beneficiaryEn: string;
  beneficiaryAr: string;
  projectId: string;
  projectNameEn: string;
  projectNameAr: string;
  amount: number;
  date: string;
  methodEn: string;
  methodAr: string;
  status: 'executed' | 'approved' | 'pending';
  category: 'Civil' | 'Architectural' | 'Mechanical' | 'Electrical' | 'Others';
}

export interface NotificationItem {
  id: string;
  titleEn: string;
  titleAr: string;
  timeEn: string;
  timeAr: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

export interface ProjectCommentItem {
  id: string;
  projectId: string;
  authorNameEn: string;
  authorNameAr: string;
  authorRoleEn: string;
  authorRoleAr: string;
  commentEn: string;
  commentAr: string;
  createdAt: string;
  progressSnapshot: number;
}

export interface DashboardGridItemLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface FinancialState {
  activeTab: NavTabId;
  theme: ThemeMode;
  language: Language;
  fiscalYear: '2026' | '2025' | '2024';
  selectedProject: string; // 'ALL' or project id
  period: 'YTD' | 'Q1' | 'Q2' | 'Q3' | 'Q4';
  searchQuery: string;
  totalContracts: number;
  executedValue: number;
  totalInvoices: number;
  totalPayments: number;
  remainingValue: number;
  cashFlow: CashFlowMonth[];
  projects: ProjectStatusItem[];
  agingPayables: AgingItem[];
  agingReceivables: AgingItem[];
  budgetVsActual: BudgetCategoryItem[];
  invoicesList: InvoiceRecord[];
  paymentOrdersList: PaymentOrderRecord[];
  projectComments: ProjectCommentItem[];
  dashboardLayouts?: Record<string, DashboardGridItemLayout[]>;
  notifications: NotificationItem[];
  lastSavedAt: string;
  autoSaveEnabled: boolean;
}

