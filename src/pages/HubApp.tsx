/**
 * HubApp - Admin dashboard application
 */

import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useHubStore } from '../stores/hubStore';
import { api } from '../services/api';
import { HubSidebar } from '../components/hub/HubSidebar';
import { HubHeader } from '../components/hub/HubHeader';
import { Dashboard } from '../components/hub/Dashboard';
import { CasesView } from '../components/hub/CasesView';
import { AnalyticsView } from '../components/hub/AnalyticsView';
import { CaseModal } from '../components/hub/CaseModal';

export function HubApp() {
  const { sidebarOpen, caseModalOpen, setStats, setStatsLoading } = useHubStore();

  // Load initial stats
  useEffect(() => {
    const loadStats = async () => {
      setStatsLoading(true);
      try {
        const response = await api.getHubStats();
        if (response.success) {
          setStats(response);
        }
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();

    // Refresh stats periodically
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [setStats, setStatsLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-rose-50/30 to-blue-50/50">
      {/* Sidebar */}
      <HubSidebar />

      {/* Main content */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? 'ml-60' : 'ml-0'
        }`}
      >
        {/* Header */}
        <HubHeader />

        {/* Page content */}
        <main className="p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cases" element={<CasesView />} />
            <Route path="/cases/:filter" element={<CasesView />} />
            <Route path="/analytics" element={<AnalyticsView />} />
            <Route path="/sessions" element={<ComingSoon title="Sessions" />} />
            <Route path="/events" element={<ComingSoon title="Event Log" />} />
            <Route path="/issues" element={<ComingSoon title="Issue Reports" />} />
            <Route path="/users" element={<ComingSoon title="User Management" />} />
            <Route path="*" element={<Navigate to="/hub" replace />} />
          </Routes>
        </main>
      </div>

      {/* Case Modal */}
      {caseModalOpen && <CaseModal />}
    </div>
  );
}

// Placeholder component for unimplemented pages
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <h2 className="text-2xl font-bold text-gray-900 font-display mb-2">{title}</h2>
      <p className="text-gray-500">This feature is coming soon.</p>
    </div>
  );
}
