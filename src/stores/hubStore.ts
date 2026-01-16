import { create } from 'zustand';
import type {
  CaseListItem,
  CaseData,
  CaseComment,
  HubStats,
  CaseType,
  CaseStatus,
} from '@shared/types';

type HubPage = 'dashboard' | 'cases' | 'sessions' | 'events' | 'issues' | 'analytics' | 'users';

interface HubFilters {
  caseType: CaseType | 'all';
  status: CaseStatus | 'all' | 'overdue';
  assignee: number | 'all' | 'unassigned';
  dateRange: 'today' | '7d' | '30d' | 'all' | 'custom';
  startDate?: string;
  endDate?: string;
  search: string;
  sortBy: string;
}

interface HubState {
  // Navigation
  currentPage: HubPage;
  sidebarOpen: boolean;

  // Stats
  stats: HubStats | null;
  statsLoading: boolean;

  // Cases
  cases: CaseListItem[];
  casesLoading: boolean;
  casesPage: number;
  casesTotalPages: number;
  casesTotal: number;

  // Filters
  filters: HubFilters;

  // Selected case
  selectedCase: CaseData | null;
  selectedCaseComments: CaseComment[];
  caseModalOpen: boolean;

  // Bulk selection
  selectedCaseIds: Set<string>;

  // Actions
  setPage: (page: HubPage) => void;
  toggleSidebar: () => void;
  setStats: (stats: HubStats) => void;
  setStatsLoading: (loading: boolean) => void;
  setCases: (cases: CaseListItem[], page: number, totalPages: number, total: number) => void;
  setCasesLoading: (loading: boolean) => void;
  setCasesPage: (page: number) => void;
  setFilters: (filters: Partial<HubFilters>) => void;
  resetFilters: () => void;
  setSelectedCase: (caseData: CaseData | null, comments?: CaseComment[]) => void;
  openCaseModal: (caseData: CaseData, comments: CaseComment[]) => void;
  closeCaseModal: () => void;
  toggleCaseSelection: (caseId: string) => void;
  selectAllCases: () => void;
  clearCaseSelection: () => void;
}

const defaultFilters: HubFilters = {
  caseType: 'all',
  status: 'all',
  assignee: 'all',
  dateRange: 'all',
  search: '',
  sortBy: 'created_desc',
};

export const useHubStore = create<HubState>((set, get) => ({
  // Initial state
  currentPage: 'dashboard',
  sidebarOpen: true,
  stats: null,
  statsLoading: false,
  cases: [],
  casesLoading: false,
  casesPage: 1,
  casesTotalPages: 1,
  casesTotal: 0,
  filters: { ...defaultFilters },
  selectedCase: null,
  selectedCaseComments: [],
  caseModalOpen: false,
  selectedCaseIds: new Set(),

  // Actions
  setPage: (page) => set({ currentPage: page }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setStats: (stats) => set({ stats }),

  setStatsLoading: (loading) => set({ statsLoading: loading }),

  setCases: (cases, page, totalPages, total) =>
    set({
      cases,
      casesPage: page,
      casesTotalPages: totalPages,
      casesTotal: total,
    }),

  setCasesLoading: (loading) => set({ casesLoading: loading }),

  setCasesPage: (page) => set({ casesPage: page }),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
      casesPage: 1, // Reset to first page when filters change
    })),

  resetFilters: () => set({ filters: { ...defaultFilters }, casesPage: 1 }),

  setSelectedCase: (caseData, comments = []) =>
    set({
      selectedCase: caseData,
      selectedCaseComments: comments,
    }),

  openCaseModal: (caseData, comments) =>
    set({
      selectedCase: caseData,
      selectedCaseComments: comments,
      caseModalOpen: true,
    }),

  closeCaseModal: () =>
    set({
      caseModalOpen: false,
    }),

  toggleCaseSelection: (caseId) => {
    const { selectedCaseIds } = get();
    const newSet = new Set(selectedCaseIds);
    if (newSet.has(caseId)) {
      newSet.delete(caseId);
    } else {
      newSet.add(caseId);
    }
    set({ selectedCaseIds: newSet });
  },

  selectAllCases: () => {
    const { cases } = get();
    set({ selectedCaseIds: new Set(cases.map((c) => c.caseId)) });
  },

  clearCaseSelection: () => set({ selectedCaseIds: new Set() }),
}));
