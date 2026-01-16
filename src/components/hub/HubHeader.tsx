/**
 * HubHeader - Admin dashboard header
 */

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useHubStore } from '../../stores/hubStore';

const PAGE_TITLES: Record<string, string> = {
  '/hub': 'Dashboard',
  '/hub/cases': 'Cases',
  '/hub/analytics': 'Analytics',
  '/hub/sessions': 'Sessions',
  '/hub/events': 'Event Log',
  '/hub/issues': 'Issue Reports',
  '/hub/users': 'User Management',
};

export function HubHeader() {
  const location = useLocation();
  const { filters, setFilters, toggleSidebar } = useHubStore();
  const [searchValue, setSearchValue] = useState(filters.search);

  // Get page title
  const getTitle = () => {
    for (const [path, title] of Object.entries(PAGE_TITLES)) {
      if (location.pathname === path || location.pathname.startsWith(path + '/')) {
        return title;
      }
    }
    return 'Dashboard';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ search: searchValue });
  };

  const handleClearSearch = () => {
    setSearchValue('');
    setFilters({ search: '' });
  };

  return (
    <header className="glass border-b border-gray-100 px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Menu toggle + Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden btn btn-ghost p-2"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 font-display">{getTitle()}</h1>
        </div>

        {/* Right: Search + Filters */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 min-w-[280px]">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search anything..."
                className="flex-1 border-none outline-none text-sm bg-transparent"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </form>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value as typeof filters.status })}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({ dateRange: e.target.value as typeof filters.dateRange })}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          {/* Sort */}
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({ sortBy: e.target.value })}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700"
          >
            <option value="created_desc">Newest First</option>
            <option value="created_asc">Oldest First</option>
            <option value="due_asc">Due Date (Earliest)</option>
            <option value="customer_asc">Customer (A-Z)</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => window.location.reload()}
            className="btn btn-secondary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>
    </header>
  );
}
