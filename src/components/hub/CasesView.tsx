/**
 * CasesView - Cases list with filtering and pagination
 */

import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useHubStore } from '../../stores/hubStore';
import { api } from '../../services/api';
import { formatDate, timeAgo, toTitleCase, formatResolutionType } from '../../utils/formatters';
import type { CaseListItem, CaseType } from '@shared/types';

export function CasesView() {
  const { filter } = useParams<{ filter?: string }>();
  const {
    cases,
    casesLoading,
    casesPage,
    casesTotalPages,
    casesTotal,
    filters,
    selectedCaseIds,
    setCases,
    setCasesLoading,
    setCasesPage,
    setFilters,
    toggleCaseSelection,
    selectAllCases,
    clearCaseSelection,
    openCaseModal,
  } = useHubStore();

  // Update filter when URL changes
  useEffect(() => {
    if (filter && filter !== 'all') {
      setFilters({ caseType: filter as CaseType });
    } else {
      setFilters({ caseType: 'all' });
    }
  }, [filter, setFilters]);

  // Load cases
  useEffect(() => {
    const loadCases = async () => {
      setCasesLoading(true);
      try {
        const response = await api.getCases({
          page: casesPage,
          limit: 50,
          type: filters.caseType !== 'all' ? filters.caseType : undefined,
          status: filters.status !== 'all' ? filters.status : undefined,
          search: filters.search || undefined,
          sortBy: filters.sortBy,
          dateRange: filters.dateRange !== 'all' ? filters.dateRange : undefined,
        });

        if (response.success) {
          setCases(
            response.cases,
            response.pagination.page,
            response.pagination.totalPages,
            response.pagination.total
          );
        }
      } catch (error) {
        console.error('Failed to load cases:', error);
      } finally {
        setCasesLoading(false);
      }
    };

    loadCases();
  }, [casesPage, filters, setCases, setCasesLoading]);

  const handleCaseClick = async (caseItem: CaseListItem) => {
    try {
      const response = await api.getCase(caseItem.caseId);
      if (response.success) {
        openCaseModal(response.case, response.comments);
      }
    } catch (error) {
      console.error('Failed to load case:', error);
    }
  };

  const allSelected = cases.length > 0 && selectedCaseIds.size === cases.length;

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-900 font-display">
            {filter && filter !== 'all' ? `${toTitleCase(filter)} Cases` : 'All Cases'}
          </h2>
          <p className="text-sm text-gray-500">{casesTotal} total</p>
        </div>
        {selectedCaseIds.size > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {selectedCaseIds.size} selected
            </span>
            <button
              onClick={clearCaseSelection}
              className="btn btn-ghost text-sm"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      {casesLoading ? (
        <div className="p-8 flex justify-center">
          <div className="spinner"></div>
        </div>
      ) : cases.length === 0 ? (
        <div className="empty-state">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="font-medium text-gray-700">No cases found</h3>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th className="w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => allSelected ? clearCaseSelection() : selectAllCases()}
                  className="w-4 h-4 rounded border-gray-300 text-brand-navy focus:ring-brand-navy"
                />
              </th>
              <th>Customer</th>
              <th>Type</th>
              <th>Status</th>
              <th>Due</th>
              <th>Resolution</th>
              <th>Assignee</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((caseItem) => (
              <CaseTableRow
                key={caseItem.caseId}
                caseItem={caseItem}
                isSelected={selectedCaseIds.has(caseItem.caseId)}
                onToggle={() => toggleCaseSelection(caseItem.caseId)}
                onClick={() => handleCaseClick(caseItem)}
              />
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      {casesTotalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 flex justify-center gap-2">
          <button
            onClick={() => setCasesPage(casesPage - 1)}
            disabled={casesPage <= 1}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          {Array.from({ length: Math.min(5, casesTotalPages) }, (_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => setCasesPage(page)}
                className={`px-3 py-1.5 text-sm border rounded-lg ${
                  casesPage === page
                    ? 'bg-brand-navy text-white border-brand-navy'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            );
          })}
          <button
            onClick={() => setCasesPage(casesPage + 1)}
            disabled={casesPage >= casesTotalPages}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

interface CaseTableRowProps {
  caseItem: CaseListItem;
  isSelected: boolean;
  onToggle: () => void;
  onClick: () => void;
}

function CaseTableRow({ caseItem, isSelected, onToggle, onClick }: CaseTableRowProps) {
  const statusClasses: Record<string, string> = {
    pending: 'badge-pending',
    in_progress: 'badge-in-progress',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
  };

  const typeClasses: Record<string, string> = {
    refund: 'badge-refund',
    shipping: 'badge-shipping',
    subscription: 'badge-subscription',
    return: 'badge-return',
    manual: 'badge-manual',
  };

  return (
    <tr className={isSelected ? 'bg-brand-navy/5' : ''}>
      <td onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="w-4 h-4 rounded border-gray-300 text-brand-navy focus:ring-brand-navy"
        />
      </td>
      <td onClick={onClick}>
        <div>
          <p className="font-medium text-gray-900">{caseItem.customerName}</p>
          <p className="text-xs text-gray-500">{caseItem.customerEmail}</p>
        </div>
      </td>
      <td onClick={onClick}>
        <span className={`badge ${typeClasses[caseItem.caseType] || 'badge-manual'}`}>
          {toTitleCase(caseItem.caseType)}
        </span>
      </td>
      <td onClick={onClick}>
        <span className={`badge ${statusClasses[caseItem.status] || 'badge-pending'}`}>
          {toTitleCase(caseItem.status)}
        </span>
      </td>
      <td onClick={onClick}>
        {caseItem.dueDate ? (
          <span className="text-sm text-gray-600">{formatDate(caseItem.dueDate)}</span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>
      <td onClick={onClick}>
        {caseItem.resolutionType ? (
          <span className="text-sm text-gray-700">
            {formatResolutionType(caseItem.resolutionType)}
          </span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>
      <td onClick={onClick}>
        {caseItem.assignedToName ? (
          <span className="text-sm text-gray-700">{caseItem.assignedToName}</span>
        ) : (
          <span className="text-sm text-gray-400">Unassigned</span>
        )}
      </td>
      <td onClick={onClick}>
        <span className="text-sm text-gray-500" title={formatDate(caseItem.createdAt)}>
          {timeAgo(caseItem.createdAt)}
        </span>
      </td>
    </tr>
  );
}
