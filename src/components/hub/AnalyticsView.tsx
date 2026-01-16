/**
 * AnalyticsView - Analytics dashboard
 */

import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import type { AnalyticsData } from '@shared/types';

export function AnalyticsView() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        const response = await api.getAnalytics(dateRange);
        if (response.success && response.data) {
          setData(response.data as AnalyticsData);
        }
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [dateRange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <p className="text-gray-500">Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex justify-end">
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* Cases Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Total Cases" value={data.totalCases} />
        <StatCard label="Pending Cases" value={data.pendingCases} highlight="warning" />
        <StatCard label="In Progress" value={data.inProgressCases} />
        <StatCard label="Completed" value={data.completedCases} highlight="success" />
      </div>

      {/* Refunds & Sessions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Total Refunds"
          value={formatCurrency(data.totalRefunds)}
          highlight="primary"
        />
        <StatCard label="Refunds (30d)" value={formatCurrency(data.refunds30d)} />
        <StatCard label="Avg. Refund" value={formatCurrency(data.avgRefund)} />
        <StatCard label="Total Sessions" value={data.totalSessions} />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Avg Resolution Time" value={data.avgResolutionTime} />
        <StatCard
          label="SLA Compliance"
          value={formatPercentage(data.slaCompliance)}
          highlight="success"
        />
        <StatCard label="Active Team Members" value={data.teamMembers} />
        <StatCard label="Root Cause Categories" value={data.rootCauses} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases by Type */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 font-display mb-4">Cases by Type</h3>
          <div className="space-y-3">
            {data.casesByType.map((item) => (
              <div key={item.type} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{item.type}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cases by Status */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 font-display mb-4">Status Distribution</h3>
          <div className="space-y-3">
            {data.casesByStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">
                  {item.status.replace('_', ' ')}
                </span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Resolution Types */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 font-display mb-4">Resolution Types</h3>
          <div className="space-y-3">
            {data.resolutionTypes.slice(0, 6).map((item) => (
              <div key={item.type} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">
                  {item.type.replace(/_/g, ' ')}
                </span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Leaderboard & Root Causes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Leaderboard */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 font-display mb-4">Team Leaderboard</h3>
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="pb-3">Name</th>
                <th className="pb-3 text-right">Completed</th>
                <th className="pb-3 text-right">Avg Time</th>
              </tr>
            </thead>
            <tbody>
              {data.teamLeaderboard.map((member, index) => (
                <tr key={member.name} className="border-t border-gray-100">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : index === 1
                            ? 'bg-gray-100 text-gray-600'
                            : index === 2
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-50 text-gray-500'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="font-medium">{member.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-right font-semibold">{member.completed}</td>
                  <td className="py-3 text-right text-gray-600">{member.avgTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Root Cause Analysis */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 font-display mb-4">Root Cause Analysis</h3>
          <div className="space-y-4">
            {data.rootCauseAnalysis.map((item) => (
              <div key={item.cause}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-700">{item.cause}</span>
                  <span className="text-sm font-medium">
                    {item.count} ({formatPercentage(item.percentage)})
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-brand-navy rounded-full h-2"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  highlight?: 'primary' | 'success' | 'warning' | 'error';
}

function StatCard({ label, value, highlight }: StatCardProps) {
  const highlightClasses = {
    primary: 'bg-brand-navy text-white',
    success: 'bg-emerald-500 text-white',
    warning: 'bg-amber-400 text-amber-900',
    error: 'bg-red-500 text-white',
  };

  return (
    <div className={`glass rounded-2xl p-6 ${highlight ? highlightClasses[highlight] : ''}`}>
      <p className={`text-sm ${highlight ? 'opacity-80' : 'text-gray-500'}`}>{label}</p>
      <p className="text-3xl font-bold font-display mt-1">{value}</p>
    </div>
  );
}
