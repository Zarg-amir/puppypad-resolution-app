/**
 * Dashboard - Hub dashboard with stats and recent cases
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHubStore } from '../../stores/hubStore';
import { api } from '../../services/api';
import { formatDate, timeAgo, toTitleCase } from '../../utils/formatters';
import type { CaseListItem } from '@shared/types';

export function Dashboard() {
  const navigate = useNavigate();
  const { stats, statsLoading, cases, casesLoading, setCases, setCasesLoading } = useHubStore();

  // Load recent cases
  useEffect(() => {
    const loadCases = async () => {
      setCasesLoading(true);
      try {
        const response = await api.getCases({ limit: 10, sortBy: 'created_desc' });
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
  }, [setCases, setCasesLoading]);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Pending Cases"
          value={stats?.pending ?? '-'}
          highlight
          sublabel="Needs attention"
          loading={statsLoading}
        />
        <StatCard
          label="In Progress"
          value={stats?.inProgress ?? '-'}
          loading={statsLoading}
        />
        <StatCard
          label="Completed Today"
          value={stats?.completedToday ?? '-'}
          loading={statsLoading}
        />
        <StatCard
          label="Avg. Resolution Time"
          value={stats?.avgTime ?? '-'}
          loading={statsLoading}
        />
      </div>

      {/* Recent Cases */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 font-display">Recent Cases</h2>
          <button
            onClick={() => navigate('/hub/cases')}
            className="btn btn-secondary text-sm"
          >
            View All
          </button>
        </div>

        {casesLoading ? (
          <div className="p-8 flex justify-center">
            <div className="spinner"></div>
          </div>
        ) : cases.length === 0 ? (
          <div className="empty-state">
            <p>No cases yet</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((caseItem) => (
                <CaseRow key={caseItem.caseId} caseItem={caseItem} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  highlight?: boolean;
  sublabel?: string;
  loading?: boolean;
}

function StatCard({ label, value, highlight, sublabel, loading }: StatCardProps) {
  return (
    <div
      className={`glass rounded-2xl p-6 ${
        highlight
          ? 'bg-gradient-to-br from-brand-navy to-brand-navy-light text-white'
          : ''
      }`}
    >
      <p className={`text-sm ${highlight ? 'text-white/80' : 'text-gray-500'}`}>{label}</p>
      {loading ? (
        <div className="h-10 w-20 bg-gray-200 animate-pulse rounded mt-2"></div>
      ) : (
        <p className="text-3xl font-bold font-display mt-1">{value}</p>
      )}
      {sublabel && (
        <p className={`text-xs mt-2 ${highlight ? 'text-white/70' : 'text-gray-400'}`}>
          {sublabel}
        </p>
      )}
    </div>
  );
}

function CaseRow({ caseItem }: { caseItem: CaseListItem }) {
  const { openCaseModal } = useHubStore();

  const handleClick = async () => {
    try {
      const response = await api.getCase(caseItem.caseId);
      if (response.success) {
        openCaseModal(response.case, response.comments);
      }
    } catch (error) {
      console.error('Failed to load case:', error);
    }
  };

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
    <tr onClick={handleClick}>
      <td>
        <span className="font-mono text-sm text-brand-navy font-medium">{caseItem.caseId}</span>
      </td>
      <td>
        <div>
          <p className="font-medium text-gray-900">{caseItem.customerName}</p>
          <p className="text-xs text-gray-500">{caseItem.customerEmail}</p>
        </div>
      </td>
      <td>
        <span className={`badge ${typeClasses[caseItem.caseType] || 'badge-manual'}`}>
          {toTitleCase(caseItem.caseType)}
        </span>
      </td>
      <td>
        <span className={`badge ${statusClasses[caseItem.status] || 'badge-pending'}`}>
          {toTitleCase(caseItem.status)}
        </span>
      </td>
      <td>
        <span className="text-sm text-gray-500" title={formatDate(caseItem.createdAt)}>
          {timeAgo(caseItem.createdAt)}
        </span>
      </td>
    </tr>
  );
}
