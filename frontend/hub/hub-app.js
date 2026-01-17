/**
 * Resolution Hub Application
 * Modular, maintainable hub for PuppyPad Resolution cases
 */

// ============================================
// CONFIGURATION
// ============================================
// Auto-detect API base URL based on environment
// If on Pages domain, use Worker domain for API calls
// If on Worker domain or localhost, use same origin
const getApiBase = () => {
  const hostname = window.location.hostname;
  
  // If we're on Pages domain, use Worker domain for API
  if (hostname.includes('pages.dev') || hostname.includes('pages.cloudflare.com')) {
    return 'https://puppypad-resolution-worker.gulfam.workers.dev';
  }
  
  // If on Worker domain or localhost, use same origin
  return '';
};

const HubConfig = {
  API_BASE: getApiBase(),
  REFRESH_INTERVAL: 30000, // 30 seconds
  MAX_BULK_SELECT: 100,
  ITEMS_PER_PAGE: 15 // Changed from 50 to 15 for better pagination
};

// ============================================
// GLOBAL HELPERS
// ============================================
const HubHelpers = {
  // Format name with proper capitalization (First Last)
  formatName(name) {
    if (!name) return 'Unknown';
    return name.split(' ')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  },
  
  // Escape HTML
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// ============================================
// STATE MANAGEMENT
// ============================================
const HubState = {
  // User - Initialize from localStorage immediately so bulk actions work
  currentUser: (() => {
    try { return JSON.parse(localStorage.getItem('hub_user')); } catch { return null; }
  })(),
  token: localStorage.getItem('hub_token'),

  // Cases
  cases: [],
  currentCase: null,
  currentCaseIndex: -1,
  selectedCaseIds: new Set(),

  // Filters
  currentFilter: 'all',
  currentStatus: null,
  currentSearch: '',
  currentAssignee: '',
  currentDateRange: '',
  currentSortBy: 'created_desc',
  casesPage: 1,  // Renamed from currentPage to avoid conflict with navigation
  totalPages: 1,

  // Issue Reports filters
  issuesStatus: '',
  issuesSearch: '',
  issuesDateRange: '',
  issuesSortBy: 'created_desc',
  issuesPage: 1,
  issuesTotalPages: 1,

  // Views
  savedViews: [],
  currentView: null,

  // Assignment
  assignmentQueue: [],

  // UI
  currentPage: 'dashboard',
  isLoading: false,
  keySequence: '', // For combo shortcuts like 'g' then 'd'
  keySequenceTimeout: null
};

// ============================================
// API CLIENT
// ============================================
const HubAPI = {
  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (HubState.token) {
      headers['Authorization'] = `Bearer ${HubState.token}`;
    }

    const response = await fetch(`${HubConfig.API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      HubAuth.logout();
      throw new Error('Session expired');
    }

    return response;
  },

  async get(endpoint) {
    const response = await this.request(endpoint);
    return response.json();
  },

  async post(endpoint, data) {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async put(endpoint, data) {
    const response = await this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async delete(endpoint) {
    const response = await this.request(endpoint, { method: 'DELETE' });
    return response.json();
  }
};

// ============================================
// AUTHENTICATION
// ============================================
const HubAuth = {
  init() {
    const token = localStorage.getItem('hub_token');
    const user = localStorage.getItem('hub_user');

    if (token && user) {
      HubState.token = token;
      HubState.currentUser = JSON.parse(user);

      // Check if password change required
      if (HubState.currentUser.mustChangePassword) {
        this.showChangePasswordModal(true);
      }

      return true;
    }
    return false;
  },

  async login(username, password) {
    try {
      const response = await fetch(`${HubConfig.API_BASE}/admin/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        HubState.token = data.token;
        HubState.currentUser = data.user;
        localStorage.setItem('hub_token', data.token);
        localStorage.setItem('hub_user', JSON.stringify(data.user));

        if (data.user.mustChangePassword) {
          this.showChangePasswordModal(true);
        }

        return { success: true };
      }

      return { success: false, error: data.error || 'Login failed' };
    } catch (e) {
      return { success: false, error: 'Network error' };
    }
  },

  logout() {
    HubState.token = null;
    HubState.currentUser = null;
    localStorage.removeItem('hub_token');
    localStorage.removeItem('hub_user');
    HubUI.showLoginScreen();
  },

  isAdmin() {
    return HubState.currentUser?.role === 'admin';
  },

  showChangePasswordModal(required = false) {
    const html = `
      <div class="modal-overlay active" id="changePasswordModal">
        <div class="modal" style="max-width: 400px;">
          <div class="modal-header" style="padding: 20px 24px;">
            <div class="modal-header-content">
              <div class="modal-title" style="font-size: 18px;">
                ${required ? 'Password Change Required' : 'Change Password'}
              </div>
            </div>
            ${!required ? '<button class="modal-close" onclick="HubAuth.closeChangePasswordModal()">&times;</button>' : ''}
          </div>
          <div class="modal-body" style="padding: 24px;">
            ${required ? '<p style="margin-bottom: 16px; color: var(--gray-600);">You must change your password before continuing.</p>' : ''}
            ${!required ? `
              <div class="form-group">
                <label>Current Password</label>
                <input type="password" id="currentPassword" class="form-input">
              </div>
            ` : ''}
            <div class="form-group">
              <label>New Password</label>
              <input type="password" id="newPassword" class="form-input" placeholder="Minimum 6 characters">
            </div>
            <div class="form-group">
              <label>Confirm New Password</label>
              <input type="password" id="confirmPassword" class="form-input">
            </div>
            <div id="passwordError" class="error-message" style="display: none;"></div>
            <button class="btn btn-primary" style="width: 100%; margin-top: 16px;" onclick="HubAuth.changePassword(${required})">
              Change Password
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  async changePassword(required) {
    const currentPassword = document.getElementById('currentPassword')?.value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorEl = document.getElementById('passwordError');

    if (newPassword !== confirmPassword) {
      errorEl.textContent = 'Passwords do not match';
      errorEl.style.display = 'block';
      return;
    }

    if (newPassword.length < 6) {
      errorEl.textContent = 'Password must be at least 6 characters';
      errorEl.style.display = 'block';
      return;
    }

    try {
      const result = await HubAPI.post('/hub/api/change-password', {
        currentPassword,
        newPassword
      });

      if (result.success) {
        HubState.currentUser.mustChangePassword = false;
        localStorage.setItem('hub_user', JSON.stringify(HubState.currentUser));
        this.closeChangePasswordModal();
        HubUI.showToast('Password changed successfully', 'success');
      } else {
        errorEl.textContent = result.error || 'Failed to change password';
        errorEl.style.display = 'block';
      }
    } catch (e) {
      errorEl.textContent = 'Network error';
      errorEl.style.display = 'block';
    }
  },

  closeChangePasswordModal() {
    document.getElementById('changePasswordModal')?.remove();
  }
};

// ============================================
// BULK ACTIONS
// ============================================
const HubBulkActions = {
  toggleSelect(caseId) {
    if (HubState.selectedCaseIds.has(caseId)) {
      HubState.selectedCaseIds.delete(caseId);
    } else {
      if (HubState.selectedCaseIds.size >= HubConfig.MAX_BULK_SELECT) {
        HubUI.showToast(`Maximum ${HubConfig.MAX_BULK_SELECT} cases can be selected`, 'warning');
        return;
      }
      HubState.selectedCaseIds.add(caseId);
    }
    this.updateUI();
  },

  selectAll() {
    // Use HubState.cases first, fallback to window.allCases or window.casesList (inline script sources)
    const cases = HubState.cases.length > 0 ? HubState.cases : (window.allCases || window.casesList || []);
    const visibleIds = cases.slice(0, HubConfig.MAX_BULK_SELECT).map(c => c.case_id);
    visibleIds.forEach(id => HubState.selectedCaseIds.add(id));
    this.updateUI();
  },

  deselectAll() {
    HubState.selectedCaseIds.clear();
    this.updateUI();
  },

  updateBulkActionBar() {
    const count = HubState.selectedCaseIds.size;
    let bar = document.getElementById('casesBulkBar');
    
    if (count === 0) {
      if (bar) bar.remove();
      return;
    }

    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'casesBulkBar';
      bar.className = 'bulk-action-bar';
      document.body.appendChild(bar);
    }

    bar.innerHTML = `
      <div class="bulk-action-count">${count} case${count > 1 ? 's' : ''} selected</div>
      <div class="bulk-action-buttons">
        <button onclick="HubBulkActions.showAssignModal()" class="bulk-btn">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          Assign
        </button>
        <button onclick="HubBulkActions.showStatusModal()" class="bulk-btn">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Change Status
        </button>
        <button onclick="HubBulkActions.exportCSV()" class="bulk-btn">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          Export
        </button>
        <button onclick="HubBulkActions.deselectAll()" class="bulk-btn bulk-btn-cancel">Cancel</button>
      </div>
    `;
  },

  // Stores caseIds passed to modal for later use
  pendingBulkCaseIds: null,

  showStatusModal(caseIds = null) {
    // Use passed caseIds or fall back to HubState.selectedCaseIds
    const ids = caseIds || Array.from(HubState.selectedCaseIds);
    const count = ids.length;
    if (count === 0) return;
    
    // Store for later use in applyBulkStatus
    this.pendingBulkCaseIds = ids;

    const html = `
      <div class="modal-overlay active" id="bulkStatusModal">
        <div class="modal" style="max-width: 400px;">
          <div class="modal-header">
            <h3>Change Status (${count} case${count > 1 ? 's' : ''})</h3>
            <button class="modal-close" onclick="document.getElementById('bulkStatusModal').remove()">×</button>
          </div>
          <div class="modal-body" style="padding: 24px;">
            <div class="status-radio-group" id="bulkStatusRadioGroup">
              <label class="status-radio-item" data-status="pending" onclick="HubBulkActions.selectStatusRadio(this, 'pending')">
                <input type="radio" name="bulkStatus" value="pending">
                <span class="status-radio-check"></span>
                <span class="status-radio-label">Pending</span>
              </label>
              <label class="status-radio-item" data-status="in_progress" onclick="HubBulkActions.selectStatusRadio(this, 'in_progress')">
                <input type="radio" name="bulkStatus" value="in_progress">
                <span class="status-radio-check"></span>
                <span class="status-radio-label">In Progress</span>
              </label>
              <label class="status-radio-item" data-status="completed" onclick="HubBulkActions.selectStatusRadio(this, 'completed')">
                <input type="radio" name="bulkStatus" value="completed">
                <span class="status-radio-check"></span>
                <span class="status-radio-label">Completed</span>
              </label>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
              <button class="btn btn-secondary" onclick="document.getElementById('bulkStatusModal').remove()">Cancel</button>
              <button class="btn btn-primary" onclick="HubBulkActions.applyBulkStatus()">Apply</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  selectStatusRadio(element, status) {
    // Remove selected class from all items
    document.querySelectorAll('#bulkStatusRadioGroup .status-radio-item').forEach(item => {
      item.classList.remove('selected');
    });
    // Add selected class to clicked item
    element.classList.add('selected');
    // Check the radio input
    element.querySelector('input[type="radio"]').checked = true;
  },

  applyBulkStatus() {
    const selected = document.querySelector('#bulkStatusModal input[name="bulkStatus"]:checked');
    if (!selected) {
      HubUI.showToast('Please select a status', 'warning');
      return;
    }
    document.getElementById('bulkStatusModal')?.remove();
    
    // Use pendingBulkCaseIds if set, otherwise use HubState.selectedCaseIds
    const caseIds = this.pendingBulkCaseIds || Array.from(HubState.selectedCaseIds);
    this.pendingBulkCaseIds = null; // Clear after use
    this.updateStatusWithIds(selected.value, caseIds);
  },

  async updateStatusWithIds(status, caseIds) {
    if (!caseIds || caseIds.length === 0) {
      HubUI.showToast('No cases selected', 'warning');
      return;
    }

    try {
      HubUI.showLoading();
      const result = await HubAPI.post('/hub/api/bulk/status', {
        caseIds: caseIds,
        status,
        actor: HubState.currentUser?.name || 'team_member',
        actor_email: HubState.currentUser?.email || ''
      });

      if (result.success) {
        HubUI.showToast(result.message || `Updated ${caseIds.length} cases to ${status}`, 'success');
        this.deselectAll();
        // Clear dashboard selection too
        if (HubDashboard.selectedDashboardCases) {
          HubDashboard.selectedDashboardCases.clear();
          HubDashboard.updateBulkActionBar();
        }
        // Refresh current view and stats
        if (HubState.currentPage === 'dashboard') {
          HubDashboard.load();
        } else if (HubState.currentPage === 'cases') {
          HubCases.loadCases(HubState.casesPage);
          // Also refresh dashboard stats for the progress bar
          HubDashboard.loadStats();
        }
      } else {
        HubUI.showToast(result.error || 'Update failed', 'error');
      }
    } catch (e) {
      console.error('Bulk status update error:', e);
      HubUI.showToast('Failed to update cases', 'error');
    } finally {
      HubUI.hideLoading();
    }
  },

  exportCSV() {
    const cases = HubState.cases.filter(c => HubState.selectedCaseIds.has(c.case_id));
    if (cases.length === 0) {
      HubUI.showToast('No cases selected', 'warning');
      return;
    }
    
    const headers = ['Case ID', 'Customer Name', 'Customer Email', 'Type', 'Status', 'Resolution', 'Created'];
    const rows = cases.map(c => [
      c.case_id,
      c.customer_name || '',
      c.customer_email || '',
      c.case_type || '',
      c.status || '',
      c.resolution || '',
      c.created_at || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cases-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    HubUI.showToast(`Exported ${cases.length} cases`, 'success');
  },

  updateUI() {
    const count = HubState.selectedCaseIds.size;
    const toolbar = document.getElementById('bulkActionsToolbar');
    
    // Update floating bulk action bar
    this.updateBulkActionBar();
    
    // Update checkboxes
    document.querySelectorAll('.case-checkbox').forEach(cb => {
      cb.checked = HubState.selectedCaseIds.has(cb.dataset.caseId);
    });
    
    // Update select all checkbox
    const selectAll = document.getElementById('selectAllCases');
    if (selectAll) {
      const allChecked = HubState.cases.length > 0 && HubState.cases.every(c => HubState.selectedCaseIds.has(c.case_id));
      selectAll.checked = allChecked;
    }

    // Add null check for toolbar
    if (toolbar) {
      if (count > 0) {
        toolbar.style.display = 'flex';
        const countEl = document.getElementById('selectedCount');
        if (countEl) countEl.textContent = `${count} selected`;
      } else {
        toolbar.style.display = 'none';
      }
    }

    // Update checkboxes
    document.querySelectorAll('.case-checkbox').forEach(cb => {
      cb.checked = HubState.selectedCaseIds.has(cb.dataset.caseId);
    });

    // Update select all checkbox
    const selectAllCb = document.getElementById('selectAllCases');
    if (selectAllCb) {
      const allCases = window.allCases || window.casesList || HubState.cases || [];
      selectAllCb.checked = count > 0 && count >= allCases.length;
    }
  },

  async updateStatus(status) {
    if (HubState.selectedCaseIds.size === 0) return;

    // If completing, show checklist first
    if (status === 'completed') {
      this.showBulkChecklistModal();
      return;
    }

    try {
      HubUI.showLoading();
      const result = await HubAPI.post('/hub/api/bulk/status', {
        caseIds: Array.from(HubState.selectedCaseIds),
        status,
        actor: HubState.currentUser?.name || 'team_member',
        actor_email: HubState.currentUser?.email || ''
      });

      if (result.success) {
        HubUI.showToast(result.message, 'success');
        this.deselectAll();
        // Use inline script's loadCasesView if available, otherwise HubCases.loadCases
        if (typeof loadCasesView === 'function') {
          loadCasesView();
        } else if (typeof HubCases !== 'undefined') {
          HubCases.loadCases();
        }
      } else {
        HubUI.showToast(result.error || 'Update failed', 'error');
      }
    } catch (e) {
      console.error('Bulk update error:', e);
      HubUI.showToast('Failed to update cases: ' + (e.message || 'Unknown error'), 'error');
    } finally {
      HubUI.hideLoading();
    }
  },

  async assign(userId) {
    if (!HubAuth.isAdmin()) {
      HubUI.showToast('Admin access required', 'error');
      return;
    }

    try {
      HubUI.showLoading();
      const result = await HubAPI.post('/hub/api/bulk/assign', {
        caseIds: Array.from(HubState.selectedCaseIds),
        assignToUserId: userId
      });

      if (result.success) {
        HubUI.showToast(result.message, 'success');
        this.deselectAll();
        // Use inline script's loadCasesView if available
        if (typeof loadCasesView === 'function') {
          loadCasesView();
        } else if (typeof HubCases !== 'undefined') {
          HubCases.loadCases();
        }
      } else {
        HubUI.showToast(result.error || 'Assign failed', 'error');
      }
    } catch (e) {
      HubUI.showToast('Failed to assign cases: ' + (e.message || 'Unknown error'), 'error');
    } finally {
      HubUI.hideLoading();
    }
  },

  async assignWithIds(userId, caseIds) {
    if (!caseIds || caseIds.length === 0) {
      HubUI.showToast('No cases selected', 'warning');
      return;
    }

    try {
      HubUI.showLoading();
      const result = await HubAPI.post('/hub/api/bulk/assign', {
        caseIds: caseIds,
        assignToUserId: userId
      });

      if (result.success) {
        HubUI.showToast(result.message || `Assigned ${caseIds.length} cases`, 'success');
        this.deselectAll();
        // Clear dashboard selection too
        if (HubDashboard.selectedDashboardCases) {
          HubDashboard.selectedDashboardCases.clear();
          HubDashboard.updateBulkActionBar();
        }
        // Refresh current view
        if (HubState.currentPage === 'dashboard') {
          HubDashboard.load();
        } else if (HubState.currentPage === 'cases') {
          HubCases.loadCases(HubState.casesPage);
        }
      } else {
        HubUI.showToast(result.error || 'Assign failed', 'error');
      }
    } catch (e) {
      HubUI.showToast('Failed to assign cases: ' + (e.message || 'Unknown error'), 'error');
    } finally {
      HubUI.hideLoading();
    }
  },

  showAssignModal() {
    // Will be populated with users list
    HubUsers.showAssignModal(Array.from(HubState.selectedCaseIds));
  },

  async addComment() {
    const comment = prompt('Enter comment to add to all selected cases:');
    if (!comment) return;

    try {
      HubUI.showLoading();
      const result = await HubAPI.post('/hub/api/bulk/comment', {
        caseIds: Array.from(HubState.selectedCaseIds),
        comment
      });

      if (result.success) {
        HubUI.showToast(result.message, 'success');
      } else {
        HubUI.showToast(result.error, 'error');
      }
    } catch (e) {
      HubUI.showToast('Failed to add comments', 'error');
    } finally {
      HubUI.hideLoading();
    }
  },

  async exportCSV() {
    try {
      const response = await HubAPI.request('/hub/api/bulk/export', {
        method: 'POST',
        body: JSON.stringify({
          caseIds: HubState.selectedCaseIds.size > 0 ? Array.from(HubState.selectedCaseIds) : null
        })
      });

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cases-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      HubUI.showToast('Export downloaded', 'success');
    } catch (e) {
      HubUI.showToast('Failed to export', 'error');
    }
  },

  showBulkChecklistModal() {
    // For bulk completion, show a simple confirmation
    const html = `
      <div class="modal-overlay active" id="bulkChecklistModal">
        <div class="modal" style="max-width: 500px;">
          <div class="modal-header" style="padding: 20px 24px;">
            <div class="modal-header-content">
              <div class="modal-title" style="font-size: 18px;">Complete ${HubState.selectedCaseIds.size} Cases</div>
            </div>
            <button class="modal-close" onclick="document.getElementById('bulkChecklistModal').remove()">&times;</button>
          </div>
          <div class="modal-body" style="padding: 24px;">
            <p style="margin-bottom: 16px;">Are you sure you want to mark ${HubState.selectedCaseIds.size} cases as completed?</p>
            <p style="margin-bottom: 24px; color: var(--gray-500); font-size: 14px;">
              Make sure you have actioned all resolutions before completing.
            </p>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
              <button class="btn btn-secondary" onclick="document.getElementById('bulkChecklistModal').remove()">Cancel</button>
              <button class="btn btn-primary" onclick="HubBulkActions.confirmBulkComplete()">Complete All</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  async confirmBulkComplete() {
    document.getElementById('bulkChecklistModal')?.remove();

    try {
      HubUI.showLoading();
      const result = await HubAPI.post('/hub/api/bulk/status', {
        caseIds: Array.from(HubState.selectedCaseIds),
        status: 'completed',
        actor: HubState.currentUser?.name || 'team_member',
        actor_email: HubState.currentUser?.email || ''
      });

      if (result.success) {
        HubUI.showToast(result.message, 'success');
        this.deselectAll();
        // Use inline script's loadCasesView if available
        if (typeof loadCasesView === 'function') {
          loadCasesView();
        } else if (typeof HubCases !== 'undefined') {
          HubCases.loadCases();
        }
      } else {
        HubUI.showToast(result.error || 'Complete failed', 'error');
      }
    } catch (e) {
      HubUI.showToast('Failed to complete cases: ' + (e.message || 'Unknown error'), 'error');
    } finally {
      HubUI.hideLoading();
    }
  }
};

// ============================================
// SAVED VIEWS
// ============================================
const HubViews = {
  async load() {
    try {
      const result = await HubAPI.get('/hub/api/views');
      if (result.success) {
        HubState.savedViews = result.views;
        this.renderSidebar();
      }
    } catch (e) {
      console.error('Failed to load views:', e);
    }
  },

  renderSidebar() {
    const container = document.getElementById('savedViewsContainer') || document.getElementById('savedViewsList');
    if (!container) return;

    if (HubState.savedViews.length === 0) {
      container.innerHTML = '<div class="empty-views">No saved views</div>';
      return;
    }

    container.innerHTML = HubState.savedViews.map(view => `
      <div class="saved-view-item ${HubState.currentView?.id === view.id ? 'active' : ''}"
           onclick="HubViews.apply(${view.id})" data-view-id="${view.id}">
        <span class="view-name">${this.escapeHtml(view.name)}</span>
        ${view.is_default ? '<span class="view-default">Default</span>' : ''}
        <button class="view-delete" onclick="event.stopPropagation(); HubViews.delete(${view.id})" title="Delete view">
          &times;
        </button>
      </div>
    `).join('');
  },

  async save() {
    const name = prompt('Enter a name for this view:');
    if (!name) return;

    const filters = {
      status: HubState.currentStatus,
      caseType: HubState.currentFilter,
      search: HubState.currentSearch
    };

    try {
      const result = await HubAPI.post('/hub/api/views', {
        name,
        filters,
        isDefault: false
      });

      if (result.success) {
        HubUI.showToast('View saved', 'success');
        this.load();
      } else {
        HubUI.showToast(result.error, 'error');
      }
    } catch (e) {
      HubUI.showToast('Failed to save view', 'error');
    }
  },

  async apply(viewId) {
    const view = HubState.savedViews.find(v => v.id === viewId);
    if (!view) return;

    const filters = JSON.parse(view.filters);
    HubState.currentView = view;
    HubState.currentStatus = filters.status;
    HubState.currentFilter = filters.caseType || 'all';
    HubState.currentSearch = filters.search || '';

    // Update UI
    document.getElementById('searchInput').value = HubState.currentSearch;
    this.renderSidebar();
    HubCases.loadCases();
  },

  async delete(viewId) {
    if (!confirm('Delete this saved view?')) return;

    try {
      const result = await HubAPI.delete(`/hub/api/views/${viewId}`);
      if (result.success) {
        HubUI.showToast('View deleted', 'success');
        if (HubState.currentView?.id === viewId) {
          HubState.currentView = null;
        }
        this.load();
      } else {
        HubUI.showToast(result.error, 'error');
      }
    } catch (e) {
      HubUI.showToast('Failed to delete view', 'error');
    }
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// ============================================
// COMPLETION CHECKLIST
// ============================================
const HubChecklist = {
  async showForCase(caseId) {
    try {
      const result = await HubAPI.get(`/hub/api/case/${caseId}/checklist`);

      if (!result.success || !result.checklist || result.checklist.length === 0) {
        // No checklist items, just complete
        return { canComplete: true, items: [] };
      }

      return new Promise((resolve) => {
        this.showModal(caseId, result.checklist, resolve);
      });
    } catch (e) {
      console.error('Failed to get checklist:', e);
      return { canComplete: true, items: [] };
    }
  },

  showModal(caseId, items, resolve) {
    const html = `
      <div class="modal-overlay active" id="checklistModal">
        <div class="modal" style="max-width: 500px;">
          <div class="modal-header" style="padding: 20px 24px; background: linear-gradient(135deg, #059669 0%, #10b981 100%);">
            <div class="modal-header-content">
              <div class="modal-title" style="font-size: 18px;">Completion Checklist</div>
              <div style="font-size: 13px; opacity: 0.9; margin-top: 4px;">Verify all items before completing</div>
            </div>
            <button class="modal-close" onclick="HubChecklist.cancel()">&times;</button>
          </div>
          <div class="modal-body" style="padding: 24px;">
            <div class="checklist-items">
              ${items.map((item, idx) => `
                <label class="checklist-item ${item.is_required ? 'required' : ''}">
                  <input type="checkbox"
                         class="checklist-checkbox"
                         data-item-id="${item.id}"
                         ${item.isCompleted ? 'checked' : ''}>
                  <span class="checklist-text">
                    ${this.escapeHtml(item.checklist_item)}
                    ${item.is_required ? '<span class="required-badge">Required</span>' : ''}
                  </span>
                  ${item.completedBy ? `<span class="completed-by">by ${this.escapeHtml(item.completedBy)}</span>` : ''}
                </label>
              `).join('')}
            </div>
            <div id="checklistError" class="error-message" style="display: none; margin-top: 16px;"></div>
            <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
              <button class="btn btn-secondary" onclick="HubChecklist.cancel()">Cancel</button>
              <button class="btn btn-primary" onclick="HubChecklist.confirm('${caseId}')" style="background: #059669;">
                Complete Case
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    // Store resolve function
    this._resolve = resolve;
    this._caseId = caseId;
  },

  async confirm(caseId) {
    const checkboxes = document.querySelectorAll('.checklist-checkbox');
    const requiredItems = document.querySelectorAll('.checklist-item.required .checklist-checkbox');
    const uncheckedRequired = Array.from(requiredItems).filter(cb => !cb.checked);

    if (uncheckedRequired.length > 0) {
      const errorEl = document.getElementById('checklistError');
      errorEl.textContent = 'Please complete all required items';
      errorEl.style.display = 'block';
      return;
    }

    // Save checklist completions
    for (const cb of checkboxes) {
      await HubAPI.post('/hub/api/checklist/complete', {
        caseId,
        checklistItemId: parseInt(cb.dataset.itemId),
        completed: cb.checked
      });
    }

    document.getElementById('checklistModal')?.remove();

    if (this._resolve) {
      this._resolve({ canComplete: true });
      this._resolve = null;
    }
  },

  cancel() {
    document.getElementById('checklistModal')?.remove();
    if (this._resolve) {
      this._resolve({ canComplete: false });
      this._resolve = null;
    }
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
const HubKeyboard = {
  init() {
    document.addEventListener('keydown', this.handleKeydown.bind(this));
  },

  handleKeydown(e) {
    // Ignore if typing in input
    if (e.target.matches('input, textarea, select')) {
      if (e.key === 'Escape') {
        e.target.blur();
      }
      return;
    }

    const key = e.key.toLowerCase();

    // Handle key sequences (g+d, g+c, etc.)
    if (HubState.keySequence) {
      this.handleSequence(HubState.keySequence + key, e);
      HubState.keySequence = '';
      clearTimeout(HubState.keySequenceTimeout);
      return;
    }

    // Start sequence for 'g', 'f', 'b'
    if (['g', 'f', 'b'].includes(key) && !e.ctrlKey && !e.metaKey) {
      HubState.keySequence = key;
      HubState.keySequenceTimeout = setTimeout(() => {
        HubState.keySequence = '';
      }, 1000);
      return;
    }

    // Single key shortcuts
    this.handleSingleKey(key, e);
  },

  handleSequence(seq, e) {
    const actions = {
      // Navigation: g + key
      'gd': () => HubNavigation.goto('dashboard'),
      'gc': () => HubNavigation.goto('cases'),
      'ga': () => HubNavigation.goto('analytics'),
      'gs': () => HubNavigation.goto('sessions'),
      'gu': () => HubAuth.isAdmin() && HubUsers.showManagement(),
      'gl': () => HubAuth.isAdmin() && HubEnhancedAuditLog.show(),
      'gq': () => HubAuth.isAdmin() && HubAssignment.showQueue(),

      // Filters: f + key
      'fp': () => HubCases.setStatusFilter('pending'),
      'fi': () => HubCases.setStatusFilter('in_progress'),
      'fc': () => HubCases.setStatusFilter('completed'),
      'fa': () => HubCases.setStatusFilter(null),

      // Bulk: b + key
      'bs': () => HubState.selectedCaseIds.size > 0 && this.showBulkStatusMenu(),
      'ba': () => HubState.selectedCaseIds.size > 0 && HubBulkActions.showAssignModal(),
      'bc': () => HubState.selectedCaseIds.size > 0 && HubBulkActions.addComment(),
      'be': () => HubBulkActions.exportCSV()
    };

    if (actions[seq]) {
      e.preventDefault();
      actions[seq]();
    }
  },

  handleSingleKey(key, e) {
    const modalOpen = document.querySelector('.modal-overlay.active');

    // Global shortcuts
    if (key === '?') {
      e.preventDefault();
      this.showHelp();
      return;
    }

    if (key === '/' && !modalOpen) {
      e.preventDefault();
      document.getElementById('searchInput')?.focus();
      return;
    }

    if (key === 'escape') {
      if (modalOpen) {
        HubUI.closeModal();
      }
      return;
    }

    if (key === 'r' && !modalOpen) {
      e.preventDefault();
      HubUI.refresh();
      return;
    }

    // Case list shortcuts
    if (!modalOpen && HubState.currentPage === 'cases') {
      if (key === 'j') {
        e.preventDefault();
        this.selectNextCase();
        return;
      }
      if (key === 'k') {
        e.preventDefault();
        this.selectPrevCase();
        return;
      }
      if (key === 'enter') {
        e.preventDefault();
        this.openSelectedCase();
        return;
      }
      if (key === 'x') {
        e.preventDefault();
        if (e.shiftKey) {
          HubBulkActions.selectAll();
        } else {
          this.toggleSelectedCase();
        }
        return;
      }
    }

    // Case modal shortcuts
    if (modalOpen && HubState.currentCase) {
      if (key === '1') {
        e.preventDefault();
        HubCases.updateStatus('pending');
        return;
      }
      if (key === '2') {
        e.preventDefault();
        HubCases.updateStatus('in_progress');
        return;
      }
      if (key === '3') {
        e.preventDefault();
        HubCases.updateStatus('completed');
        return;
      }
      if (key === '[') {
        e.preventDefault();
        HubCases.navigateCase('prev');
        return;
      }
      if (key === ']') {
        e.preventDefault();
        HubCases.navigateCase('next');
        return;
      }
      if (key === 'c') {
        e.preventDefault();
        document.getElementById('commentInput')?.focus();
        return;
      }
      if (key === 'e') {
        e.preventDefault();
        this.copyEmail();
        return;
      }
      if (key === 'o') {
        e.preventDefault();
        HubCases.openShopifyOrder();
        return;
      }
    }
  },

  selectNextCase() {
    const rows = document.querySelectorAll('.cases-table tbody tr');
    const currentIdx = Array.from(rows).findIndex(r => r.classList.contains('keyboard-selected'));
    const nextIdx = Math.min(currentIdx + 1, rows.length - 1);

    rows.forEach(r => r.classList.remove('keyboard-selected'));
    rows[nextIdx]?.classList.add('keyboard-selected');
    rows[nextIdx]?.scrollIntoView({ block: 'nearest' });
  },

  selectPrevCase() {
    const rows = document.querySelectorAll('.cases-table tbody tr');
    const currentIdx = Array.from(rows).findIndex(r => r.classList.contains('keyboard-selected'));
    const prevIdx = Math.max(currentIdx - 1, 0);

    rows.forEach(r => r.classList.remove('keyboard-selected'));
    rows[prevIdx]?.classList.add('keyboard-selected');
    rows[prevIdx]?.scrollIntoView({ block: 'nearest' });
  },

  openSelectedCase() {
    const selected = document.querySelector('.cases-table tbody tr.keyboard-selected');
    if (selected) {
      selected.click();
    }
  },

  toggleSelectedCase() {
    const selected = document.querySelector('.cases-table tbody tr.keyboard-selected');
    if (selected) {
      const checkbox = selected.querySelector('.case-checkbox');
      if (checkbox) {
        HubBulkActions.toggleSelect(checkbox.dataset.caseId);
      }
    }
  },

  copyEmail() {
    const email = HubState.currentCase?.customer_email;
    if (email) {
      navigator.clipboard.writeText(email);
      HubUI.showToast('Email copied', 'success');
    }
  },

  showHelp() {
    const html = `
      <div class="modal-overlay active" id="helpModal">
        <div class="modal" style="max-width: 600px;">
          <div class="modal-header" style="padding: 20px 24px;">
            <div class="modal-header-content">
              <div class="modal-title" style="font-size: 18px;">Keyboard Shortcuts</div>
            </div>
            <button class="modal-close" onclick="document.getElementById('helpModal').remove()">&times;</button>
          </div>
          <div class="modal-body" style="padding: 24px; max-height: 60vh; overflow-y: auto;">
            <div class="shortcuts-section">
              <h4>Global</h4>
              <div class="shortcut"><kbd>?</kbd> Show help</div>
              <div class="shortcut"><kbd>/</kbd> Focus search</div>
              <div class="shortcut"><kbd>R</kbd> Refresh</div>
              <div class="shortcut"><kbd>Esc</kbd> Close modal</div>
            </div>
            <div class="shortcuts-section">
              <h4>Navigation</h4>
              <div class="shortcut"><kbd>G</kbd> then <kbd>D</kbd> Dashboard</div>
              <div class="shortcut"><kbd>G</kbd> then <kbd>C</kbd> Cases</div>
              <div class="shortcut"><kbd>G</kbd> then <kbd>A</kbd> Analytics</div>
            </div>
            <div class="shortcuts-section">
              <h4>Case List</h4>
              <div class="shortcut"><kbd>J</kbd> / <kbd>K</kbd> Navigate up/down</div>
              <div class="shortcut"><kbd>Enter</kbd> Open case</div>
              <div class="shortcut"><kbd>X</kbd> Toggle select</div>
              <div class="shortcut"><kbd>Shift+X</kbd> Select all</div>
            </div>
            <div class="shortcuts-section">
              <h4>Case Modal</h4>
              <div class="shortcut"><kbd>1</kbd> Set Pending</div>
              <div class="shortcut"><kbd>2</kbd> Set In Progress</div>
              <div class="shortcut"><kbd>3</kbd> Set Completed</div>
              <div class="shortcut"><kbd>[</kbd> / <kbd>]</kbd> Prev/Next case</div>
              <div class="shortcut"><kbd>C</kbd> Add comment</div>
              <div class="shortcut"><kbd>E</kbd> Copy email</div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  showBulkStatusMenu() {
    // Simple prompt for now
    const status = prompt('Enter status (pending, in_progress, completed):');
    if (status && ['pending', 'in_progress', 'completed'].includes(status)) {
      HubBulkActions.updateStatus(status);
    }
  }
};

// ============================================
// USER MANAGEMENT (Admin)
// ============================================
const HubUsers = {
  users: [],

  async load() {
    if (!HubAuth.isAdmin()) return;

    try {
      const result = await HubAPI.get('/hub/api/users');
      if (result.success) {
        this.users = result.users;
      }
    } catch (e) {
      console.error('Failed to load users:', e);
    }
  },

  // Render user management into usersView container (for navigation)
  async show() {
    const view = document.getElementById('usersView');
    if (!view) return;

    if (!HubAuth.isAdmin()) {
      view.innerHTML = '<div class="empty-state"><p>Admin access required to view this page.</p></div>';
      return;
    }

    view.innerHTML = '<div class="spinner" style="margin: 40px auto;"></div>';
    await this.load();

    view.innerHTML = `
      <div class="cases-card" style="margin-bottom: 24px;">
        <div class="cases-header">
          <h2 class="cases-title">Team Members</h2>
          <button class="btn btn-primary" onclick="HubUsers.showCreateForm()">Add User</button>
        </div>
        <div style="padding: 24px;">
          <div class="users-list">
            ${this.users.length ? this.users.map(u => `
              <div class="user-row">
                <div class="user-row-info">
                  <div class="user-row-name">${this.escapeHtml(u.name)}</div>
                  <div class="user-row-meta">${u.username} &bull; ${u.role}</div>
                </div>
                <div class="user-row-status ${u.is_active ? 'active' : 'inactive'}">
                  ${u.is_active ? 'Active' : 'Inactive'}
                </div>
                <div class="user-row-actions">
                  <button class="btn-icon" onclick="HubUsers.edit(${u.id})" title="Edit">Edit</button>
                  <button class="btn-icon" onclick="HubUsers.showResetPasswordModal(${u.id}, '${this.escapeHtml(u.name)}')" title="Reset Password">Reset Pwd</button>
                  ${HubState.currentUser && u.id !== HubState.currentUser.id ? `
                    <button class="btn-icon danger" onclick="HubUsers.confirmDelete(${u.id}, '${this.escapeHtml(u.name)}')" title="Delete">Delete</button>
                  ` : ''}
                </div>
              </div>
            `).join('') : '<p class="empty-state">No users found.</p>'}
          </div>
        </div>
      </div>
    `;
  },

  showManagement() {
    if (!HubAuth.isAdmin()) {
      HubUI.showToast('Admin access required', 'error');
      return;
    }

    this.load().then(() => {
      const html = `
        <div class="modal-overlay active" id="userManagementModal">
          <div class="modal" style="max-width: 700px;">
            <div class="modal-header" style="padding: 20px 24px;">
              <div class="modal-header-content">
                <div class="modal-title" style="font-size: 18px;">User Management</div>
              </div>
              <button class="modal-close" onclick="document.getElementById('userManagementModal').remove()">&times;</button>
            </div>
            <div class="modal-body" style="padding: 24px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                <h4>Team Members</h4>
                <button class="btn btn-primary" onclick="HubUsers.showCreateForm()">Add User</button>
              </div>
              <div class="users-list">
                ${this.users.map(u => `
                  <div class="user-row">
                    <div class="user-row-info">
                      <div class="user-row-name">${this.escapeHtml(u.name)}</div>
                      <div class="user-row-meta">${u.username} &bull; ${u.role}</div>
                    </div>
                    <div class="user-row-status ${u.is_active ? 'active' : 'inactive'}">
                      ${u.is_active ? 'Active' : 'Inactive'}
                    </div>
                    <div class="user-row-actions">
                      <button class="btn-icon" onclick="HubUsers.edit(${u.id})" title="Edit">Edit</button>
                      ${u.id !== HubState.currentUser.id ? `
                        <button class="btn-icon danger" onclick="HubUsers.delete(${u.id})" title="Delete">Delete</button>
                      ` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', html);
    });
  },

  showCreateForm() {
    const html = `
      <div class="modal-overlay active" id="createUserModal" style="z-index: 210;">
        <div class="modal" style="max-width: 400px;">
          <div class="modal-header" style="padding: 20px 24px;">
            <div class="modal-header-content">
              <div class="modal-title" style="font-size: 18px;">Create User</div>
            </div>
            <button class="modal-close" onclick="document.getElementById('createUserModal').remove()">&times;</button>
          </div>
          <div class="modal-body" style="padding: 24px;">
            <div class="form-group">
              <label>Username (email)</label>
              <input type="text" id="newUsername" class="form-input" placeholder="user@example.com">
            </div>
            <div class="form-group">
              <label>Display Name</label>
              <input type="text" id="newUserName" class="form-input" placeholder="John Doe">
            </div>
            <div class="form-group">
              <label>Role</label>
              <select id="newUserRole" class="form-input">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div class="form-group">
              <label>Initial Password</label>
              <input type="password" id="newUserPassword" class="form-input" placeholder="Minimum 6 characters">
            </div>
            <div id="createUserError" class="error-message" style="display: none;"></div>
            <button class="btn btn-primary" style="width: 100%; margin-top: 16px;" onclick="HubUsers.create()">
              Create User
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  async create() {
    const username = document.getElementById('newUsername').value;
    const name = document.getElementById('newUserName').value;
    const role = document.getElementById('newUserRole').value;
    const password = document.getElementById('newUserPassword').value;
    const errorEl = document.getElementById('createUserError');

    if (!username || !name || !password) {
      errorEl.textContent = 'All fields are required';
      errorEl.style.display = 'block';
      return;
    }

    try {
      const result = await HubAPI.post('/hub/api/users', { username, name, role, password });

      if (result.success) {
        document.getElementById('createUserModal').remove();
        HubUI.showToast(result.message, 'success');
        // Refresh user list
        document.getElementById('userManagementModal').remove();
        this.showManagement();
      } else {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
      }
    } catch (e) {
      errorEl.textContent = 'Failed to create user';
      errorEl.style.display = 'block';
    }
  },

  async delete(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const result = await HubAPI.delete(`/hub/api/users/${userId}`);
      if (result.success) {
        HubUI.showToast('User deleted', 'success');
        const modal = document.getElementById('userManagementModal');
        if (modal) modal.remove();
        this.show(); // Refresh the users view
      } else {
        HubUI.showToast(result.error, 'error');
      }
    } catch (e) {
      HubUI.showToast('Failed to delete user', 'error');
    }
  },

  confirmDelete(userId, userName) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'confirmDeleteModal';
    modal.innerHTML = `
      <div class="modal" style="max-width: 400px;">
        <div class="modal-header" style="padding: 20px 24px;">
          <div class="modal-title" style="font-size: 18px;">Delete User</div>
          <button class="modal-close" onclick="document.getElementById('confirmDeleteModal').remove()">&times;</button>
        </div>
        <div class="modal-body" style="padding: 24px;">
          <p style="margin-bottom: 20px;">Are you sure you want to delete <strong>${userName}</strong>? This action cannot be undone.</p>
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn btn-secondary" onclick="document.getElementById('confirmDeleteModal').remove()">Cancel</button>
            <button class="btn btn-danger" onclick="HubUsers.executeDelete(${userId})">Delete User</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async executeDelete(userId) {
    try {
      const result = await HubAPI.delete(`/hub/api/users/${userId}`);
      if (result.success) {
        HubUI.showToast('User deleted', 'success');
        document.getElementById('confirmDeleteModal').remove();
        this.show(); // Refresh the users view
      } else {
        HubUI.showToast(result.error, 'error');
      }
    } catch (e) {
      HubUI.showToast('Failed to delete user', 'error');
    }
  },

  showResetPasswordModal(userId, userName) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'resetPasswordModal';
    modal.innerHTML = `
      <div class="modal" style="max-width: 400px;">
        <div class="modal-header" style="padding: 20px 24px;">
          <div class="modal-title" style="font-size: 18px;">Reset Password</div>
          <button class="modal-close" onclick="document.getElementById('resetPasswordModal').remove()">&times;</button>
        </div>
        <div class="modal-body" style="padding: 24px;">
          <p style="margin-bottom: 16px;">Reset password for <strong>${userName}</strong></p>
          <div class="form-group">
            <label>New Password</label>
            <input type="password" id="resetNewPassword" class="form-input" placeholder="Enter new password (min 6 chars)">
          </div>
          <div class="form-group">
            <label>Confirm Password</label>
            <input type="password" id="resetConfirmPassword" class="form-input" placeholder="Confirm new password">
          </div>
          <div id="resetPasswordError" class="error-message" style="display: none;"></div>
          <p style="font-size: 12px; color: var(--gray-500); margin-top: 12px;">User will be required to change their password on next login.</p>
          <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px;">
            <button class="btn btn-secondary" onclick="document.getElementById('resetPasswordModal').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="HubUsers.executeResetPassword(${userId})">Reset Password</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async executeResetPassword(userId) {
    const newPassword = document.getElementById('resetNewPassword').value;
    const confirmPassword = document.getElementById('resetConfirmPassword').value;
    const errorEl = document.getElementById('resetPasswordError');

    errorEl.style.display = 'none';

    if (!newPassword || newPassword.length < 6) {
      errorEl.textContent = 'Password must be at least 6 characters';
      errorEl.style.display = 'block';
      return;
    }

    if (newPassword !== confirmPassword) {
      errorEl.textContent = 'Passwords do not match';
      errorEl.style.display = 'block';
      return;
    }

    try {
      const result = await HubAPI.post(`/hub/api/users/${userId}/reset-password`, { newPassword });
      if (result.success) {
        HubUI.showToast('Password reset successfully', 'success');
        document.getElementById('resetPasswordModal').remove();
      } else {
        errorEl.textContent = result.error || 'Failed to reset password';
        errorEl.style.display = 'block';
      }
    } catch (e) {
      errorEl.textContent = 'Network error. Please try again.';
      errorEl.style.display = 'block';
    }
  },

  pendingAssignCaseIds: null,
  activeDropdown: null,

  showAssignModal(caseIds) {
    // For bulk actions, still use modal since there's no click position
    this.pendingAssignCaseIds = caseIds;
    
    this.load().then(() => {
      const html = `
        <div class="modal-overlay active" id="assignModal">
          <div class="modal" style="max-width: 400px;">
            <div class="modal-header" style="padding: 20px 24px;">
              <div class="modal-header-content">
                <div class="modal-title" style="font-size: 18px;">Assign ${caseIds.length} Case${caseIds.length > 1 ? 's' : ''}</div>
              </div>
              <button class="modal-close" onclick="document.getElementById('assignModal').remove()">&times;</button>
            </div>
            <div class="modal-body" style="padding: 24px;">
              <div class="form-group">
                <label>Assign to</label>
                <select id="assignToUser" class="form-input">
                  <option value="">Unassign</option>
                  ${this.users.filter(u => u.is_active).map(u => `
                    <option value="${u.id}">${this.escapeHtml(u.name)}</option>
                  `).join('')}
                </select>
              </div>
              <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
                <button class="btn btn-secondary" onclick="document.getElementById('assignModal').remove()">Cancel</button>
                <button class="btn btn-primary" onclick="HubUsers.confirmAssign()">Assign</button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', html);
    });
  },

  showAssignDropdown(event, caseIds, currentAssignee) {
    event.stopPropagation();
    
    // Close any existing dropdown
    this.closeDropdown();
    
    // Store caseIds for later use
    this.pendingAssignCaseIds = caseIds;
    
    // Get click position
    const rect = event.currentTarget.getBoundingClientRect();
    
    this.load().then(() => {
      const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      };

      const html = `
        <div class="assignee-dropdown" id="assigneeDropdown" style="top: ${rect.bottom + 4}px; left: ${Math.min(rect.left, window.innerWidth - 280)}px;">
          <div class="assignee-dropdown-search">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" id="assigneeSearchInput" placeholder="Search team members..." oninput="HubUsers.filterAssigneeDropdown(this.value)" onclick="event.stopPropagation()">
          </div>
          <div class="assignee-dropdown-list" id="assigneeDropdownList">
            <div class="assignee-dropdown-item assignee-dropdown-unassign ${!currentAssignee ? 'selected' : ''}" data-name="unassigned" onclick="HubUsers.selectAssignee(null)">
              <div class="assignee-avatar unassigned">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
              </div>
              <div class="assignee-dropdown-item-info">
                <div class="assignee-dropdown-item-name">Unassigned</div>
                <div class="assignee-dropdown-item-role">Remove assignment</div>
              </div>
              <svg class="assignee-dropdown-item-check" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            </div>
            <div class="assignee-dropdown-divider"></div>
            ${this.users.filter(u => u.is_active).map(u => `
              <div class="assignee-dropdown-item ${currentAssignee === u.name ? 'selected' : ''}" data-name="${this.escapeHtml(u.name.toLowerCase())}" onclick="HubUsers.selectAssignee(${u.id}, '${this.escapeHtml(u.name)}')">
                <div class="assignee-avatar">${getInitials(u.name)}</div>
                <div class="assignee-dropdown-item-info">
                  <div class="assignee-dropdown-item-name">${this.escapeHtml(u.name)}</div>
                  <div class="assignee-dropdown-item-role">${this.escapeHtml(u.role || 'Team Member')}</div>
                </div>
                <svg class="assignee-dropdown-item-check" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', html);
      this.activeDropdown = document.getElementById('assigneeDropdown');
      
      // Focus search input
      setTimeout(() => {
        const searchInput = document.getElementById('assigneeSearchInput');
        if (searchInput) searchInput.focus();
      }, 50);
      
      // Close dropdown when clicking outside
      setTimeout(() => {
        document.addEventListener('click', this.handleOutsideClick);
      }, 10);
    });
  },

  filterAssigneeDropdown(query) {
    const list = document.getElementById('assigneeDropdownList');
    if (!list) return;
    
    const items = list.querySelectorAll('.assignee-dropdown-item');
    const divider = list.querySelector('.assignee-dropdown-divider');
    const lowerQuery = query.toLowerCase().trim();
    
    let visibleUserCount = 0;
    
    items.forEach(item => {
      const name = item.dataset.name || '';
      if (name === 'unassigned') {
        // Always show unassigned option when query is empty
        item.style.display = lowerQuery === '' ? 'flex' : 'none';
      } else {
        const matches = name.includes(lowerQuery);
        item.style.display = matches ? 'flex' : 'none';
        if (matches) visibleUserCount++;
      }
    });
    
    // Hide divider if searching
    if (divider) {
      divider.style.display = lowerQuery === '' ? 'block' : 'none';
    }
  },

  handleOutsideClick(e) {
    const dropdown = document.getElementById('assigneeDropdown');
    if (dropdown && !dropdown.contains(e.target)) {
      HubUsers.closeDropdown();
    }
  },

  closeDropdown() {
    const dropdown = document.getElementById('assigneeDropdown');
    if (dropdown) {
      dropdown.remove();
    }
    this.activeDropdown = null;
    document.removeEventListener('click', this.handleOutsideClick);
  },

  async selectAssignee(userId, userName) {
    this.closeDropdown();
    const caseIds = this.pendingAssignCaseIds || Array.from(HubState.selectedCaseIds);
    this.pendingAssignCaseIds = null;
    
    await HubBulkActions.assignWithIds(userId, caseIds);
  },

  async confirmAssign() {
    const userId = document.getElementById('assignToUser').value;
    const caseIds = this.pendingAssignCaseIds || Array.from(HubState.selectedCaseIds);
    this.pendingAssignCaseIds = null; // Clear after use
    
    document.getElementById('assignModal').remove();
    await HubBulkActions.assignWithIds(userId ? parseInt(userId) : null, caseIds);
  },

  // Helper to render the assignee cell with the new design
  renderAssigneeCell(caseId, assignedTo) {
    const getInitials = (name) => {
      if (!name) return '?';
      return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };
    
    const isUnassigned = !assignedTo;
    const displayName = assignedTo || 'Unassigned';
    const initials = isUnassigned ? '?' : getInitials(assignedTo);
    
    return `
      <div class="assignee-cell" onclick="event.stopPropagation(); HubUsers.showAssignDropdown(event, ['${caseId}'], ${assignedTo ? "'" + this.escapeHtml(assignedTo) + "'" : 'null'})">
        <div class="assignee-avatar ${isUnassigned ? 'unassigned' : ''}">${isUnassigned ? '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>' : initials}</div>
        <span class="assignee-name ${isUnassigned ? 'unassigned' : ''}">${this.escapeHtml(displayName)}</span>
        <svg class="assignee-edit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
      </div>
    `;
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// ============================================
// ASSIGNMENT QUEUE (Admin)
// ============================================
const HubAssignment = {
  async showQueue() {
    if (!HubAuth.isAdmin()) {
      HubUI.showToast('Admin access required', 'error');
      return;
    }

    try {
      const result = await HubAPI.get('/hub/api/assignment-queue');
      const queue = result.queue || [];

      const html = `
        <div class="modal-overlay active" id="assignmentQueueModal">
          <div class="modal" style="max-width: 600px;">
            <div class="modal-header" style="padding: 20px 24px;">
              <div class="modal-header-content">
                <div class="modal-title" style="font-size: 18px;">Assignment Queue (Round Robin)</div>
              </div>
              <button class="modal-close" onclick="document.getElementById('assignmentQueueModal').remove()">&times;</button>
            </div>
            <div class="modal-body" style="padding: 24px;">
              <p style="margin-bottom: 16px; color: var(--gray-500);">
                Configure which team members receive auto-assigned cases.
              </p>
              ${queue.length > 0 ? `
                <table class="queue-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Case Type</th>
                      <th>Load</th>
                      <th>Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${queue.map(q => `
                      <tr>
                        <td>${q.user_name}</td>
                        <td>${q.case_type || 'All'}</td>
                        <td>${q.current_load} / ${q.max_load}</td>
                        <td>
                          <input type="checkbox" ${q.is_active ? 'checked' : ''}
                                 onchange="HubAssignment.toggleActive(${q.id}, this.checked)">
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : '<p>No users in assignment queue. Add users to enable auto-assignment.</p>'}
              <button class="btn btn-secondary" style="margin-top: 16px;" onclick="HubAssignment.recalculate()">
                Recalculate Loads
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', html);
    } catch (e) {
      HubUI.showToast('Failed to load assignment queue', 'error');
    }
  },

  async toggleActive(queueId, isActive) {
    // Implementation would update the queue entry
  },

  async recalculate() {
    try {
      const result = await HubAPI.post('/hub/api/assignment/recalculate', {});
      if (result.success) {
        HubUI.showToast('Loads recalculated', 'success');
        document.getElementById('assignmentQueueModal').remove();
        this.showQueue();
      }
    } catch (e) {
      HubUI.showToast('Failed to recalculate', 'error');
    }
  }
};

// ============================================
// CASES
// ============================================
// ============================================
// ENHANCED SEARCH WITH DROPDOWN
// ============================================
const HubSearch = {
  searchTimeout: null,
  searchResults: [],
  selectedIndex: -1,

  init() {
    const searchInput = document.getElementById('searchInput');
    const searchDropdown = document.getElementById('searchDropdown');
    const clearBtn = document.getElementById('clearSearchBtn');

    if (!searchInput) return;

    // Update placeholder based on current page
    this.updatePlaceholder();

    // Debounced search
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      
      if (query.length === 0) {
        this.hideDropdown();
        clearBtn.style.display = 'none';
        const currentPage = HubState.currentPage;
        if (currentPage === 'issues') {
          HubState.issuesSearch = '';
          HubIssues.load(1);
        } else {
          HubState.currentSearch = '';
          HubFilters.applyFilters();
        }
        return;
      }

      clearBtn.style.display = 'block';
      
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.performSearch(query);
      }, 300);
    });

    // Keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.searchResults.length - 1);
        this.highlightSelected();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        this.highlightSelected();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (this.selectedIndex >= 0 && this.searchResults[this.selectedIndex]) {
          const context = HubState.currentPage === 'issues' ? 'issues' : 'cases';
          this.selectResult(this.searchResults[this.selectedIndex], context);
        } else {
          // Apply search directly
          const currentPage = HubState.currentPage;
          if (currentPage === 'issues') {
            HubState.issuesSearch = searchInput.value.trim();
            HubIssues.load(1);
          } else {
            HubState.currentSearch = searchInput.value.trim();
            HubFilters.applyFilters();
          }
          this.hideDropdown();
        }
      } else if (e.key === 'Escape') {
        this.hideDropdown();
      }
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchDropdown?.contains(e.target)) {
        this.hideDropdown();
      }
    });
  },

  async performSearch(query) {
    if (query.length < 2) {
      this.hideDropdown();
      return;
    }

    const dropdown = document.getElementById('searchDropdown');
    if (!dropdown) return;

    dropdown.innerHTML = '<div class="search-dropdown-loading">Searching...</div>';
    dropdown.style.display = 'block';
    this.selectedIndex = -1;

    try {
      // Use unified search API for grouped results
      const result = await HubAPI.get(`/hub/api/search?q=${encodeURIComponent(query)}&limit=5`);
      this.unifiedResults = {
        cases: result.cases || [],
        sessions: result.sessions || [],
        issues: result.issues || []
      };
      // Flatten results for keyboard navigation
      this.searchResults = [
        ...this.unifiedResults.cases.map(c => ({ ...c, _type: 'case' })),
        ...this.unifiedResults.sessions.map(s => ({ ...s, _type: 'session' })),
        ...this.unifiedResults.issues.map(i => ({ ...i, _type: 'issue' }))
      ];
      this.renderUnifiedDropdown(query);
    } catch (e) {
      console.error('Search error:', e);
      dropdown.innerHTML = '<div class="search-dropdown-empty">Search failed. Try again.</div>';
    }
  },

  renderUnifiedDropdown(query) {
    const dropdown = document.getElementById('searchDropdown');
    if (!dropdown) return;

    const { cases, sessions, issues } = this.unifiedResults;
    const hasResults = cases.length > 0 || sessions.length > 0 || issues.length > 0;

    if (!hasResults) {
      dropdown.innerHTML = '<div class="search-dropdown-empty">No results found for "' + this.escapeHtml(query) + '"</div>';
      return;
    }

    const highlightText = (text) => {
      if (!text || !query) return this.escapeHtml(text || '');
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp('(' + escaped + ')', 'gi');
      return this.escapeHtml(text).replace(regex, '<mark>$1</mark>');
    };

    let html = '';
    let flatIndex = 0;

    // Cases section
    if (cases.length > 0) {
      html += `<div class="search-section-header">Cases <span class="search-count">${cases.length}</span></div>`;
      html += cases.map((c) => {
        const idx = flatIndex++;
        return `
          <div class="search-result-item ${idx === this.selectedIndex ? 'selected' : ''}" 
               onclick="HubSearch.selectUnifiedResult('case', '${c.case_id}')"
               data-index="${idx}">
            <div class="search-result-main">
              <span class="search-result-name">${highlightText(c.customer_name || 'Unknown')}</span>
              <span class="search-result-badge ${c.case_type}">${c.case_type}</span>
              <span class="search-result-status ${c.status}">${c.status || 'pending'}</span>
            </div>
            <div class="search-result-details">
              ${highlightText(c.customer_email || '')} ${c.order_number ? '• ' + c.order_number : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    // Sessions section
    if (sessions.length > 0) {
      html += `<div class="search-section-header">Sessions <span class="search-count">${sessions.length}</span></div>`;
      html += sessions.map((s) => {
        const idx = flatIndex++;
        const timeAgo = this.timeAgo(s.started_at);
        return `
          <div class="search-result-item ${idx === this.selectedIndex ? 'selected' : ''}" 
               onclick="HubSearch.selectUnifiedResult('session', '${s.session_id}')"
               data-index="${idx}">
            <div class="search-result-main">
              <span class="search-result-name">${highlightText(s.customer_name || s.customer_email || 'Unknown')}</span>
              <span class="search-result-badge session">${s.flow_type || 'Session'}</span>
            </div>
            <div class="search-result-details">
              ${highlightText(s.customer_email || '')} • ${s.outcome || ''} • ${timeAgo}
            </div>
          </div>
        `;
      }).join('');
    }

    // Issues section
    if (issues.length > 0) {
      html += `<div class="search-section-header">Issues <span class="search-count">${issues.length}</span></div>`;
      html += issues.map((i) => {
        const idx = flatIndex++;
        return `
          <div class="search-result-item ${idx === this.selectedIndex ? 'selected' : ''}" 
               onclick="HubSearch.selectUnifiedResult('issue', '${i.report_id}')"
               data-index="${idx}">
            <div class="search-result-main">
              <span class="search-result-name">${highlightText(i.customer_email || 'Unknown')}</span>
              <span class="search-result-badge issue">${i.issue_type || 'Issue'}</span>
              <span class="search-result-status ${i.status}">${i.status || 'pending'}</span>
            </div>
            <div class="search-result-details">
              ${i.description ? highlightText(i.description.substring(0, 60) + '...') : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    dropdown.innerHTML = html;
  },

  selectUnifiedResult(type, id) {
    this.hideDropdown();
    document.getElementById('searchInput').value = '';
    
    if (type === 'case') {
      HubNavigation.goto('case-detail', id);
    } else if (type === 'session') {
      // Find session and open replay URL if available
      const session = this.unifiedResults?.sessions?.find(s => s.session_id === id);
      if (session?.session_replay_url) {
        window.open(session.session_replay_url, '_blank');
      } else {
        HubNavigation.goto('sessions');
      }
    } else if (type === 'issue') {
      HubNavigation.goto('issues');
      // Could implement issue detail view later
    }
  },

  timeAgo(timestamp) {
    if (!timestamp) return '';
    const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
  },

  renderDropdown(context = 'cases') {
    const dropdown = document.getElementById('searchDropdown');
    if (!dropdown) return;

    if (this.searchResults.length === 0) {
      dropdown.innerHTML = '<div class="search-dropdown-empty">No results found</div>';
      return;
    }

    const query = document.getElementById('searchInput')?.value.trim().toLowerCase() || '';
    
    if (context === 'issues') {
      // Render issues search results
      dropdown.innerHTML = this.searchResults.map((item, idx) => {
        const highlightText = (text) => {
          if (!text || !query) return this.escapeHtml(text || '');
          const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
          return this.escapeHtml(text).replace(regex, '<span class="search-dropdown-item-highlight">$1</span>');
        };

        return `
          <div class="search-dropdown-item ${idx === this.selectedIndex ? 'selected' : ''}" 
               onclick="HubSearch.selectResult(${JSON.stringify(item).replace(/"/g, '&quot;')}, 'issues')"
               data-index="${idx}">
            <div class="search-dropdown-item-header">
              ${highlightText(item.customer_email || 'Unknown')}
              <span style="font-size: 11px; color: var(--gray-500);">${item.report_id?.substring(0, 8) || ''}</span>
            </div>
            <div class="search-dropdown-item-meta">
              <span>${highlightText(item.issue_type || '')}</span>
              <span>${item.status || ''}</span>
              ${item.name ? `<span>${highlightText(item.name)}</span>` : ''}
            </div>
          </div>
        `;
      }).join('');
    } else {
      // Render cases search results (default)
      dropdown.innerHTML = this.searchResults.map((item, idx) => {
        const highlightText = (text) => {
          if (!text || !query) return this.escapeHtml(text || '');
          const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
          return this.escapeHtml(text).replace(regex, '<span class="search-dropdown-item-highlight">$1</span>');
        };

        return `
          <div class="search-dropdown-item ${idx === this.selectedIndex ? 'selected' : ''}" 
               onclick="HubSearch.selectResult(${JSON.stringify(item).replace(/"/g, '&quot;')}, 'cases')"
               data-index="${idx}">
            <div class="search-dropdown-item-header">
              ${highlightText(item.customer_name || 'Unknown Customer')}
              <span style="font-size: 11px; color: var(--gray-500);">${item.case_id?.substring(0, 8)}</span>
            </div>
            <div class="search-dropdown-item-meta">
              <span>${highlightText(item.customer_email || '')}</span>
              <span>${item.case_type || ''}</span>
              <span>${item.status || ''}</span>
              ${item.order_number ? `<span>Order: ${highlightText(item.order_number)}</span>` : ''}
              ${item.resolution ? `<span>${highlightText(item.resolution.substring(0, 50))}...</span>` : ''}
            </div>
          </div>
        `;
      }).join('');
    }
  },

  highlightSelected() {
    const items = document.querySelectorAll('.search-dropdown-item');
    items.forEach((item, idx) => {
      if (idx === this.selectedIndex) {
        item.classList.add('selected');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
      }
    });
  },

  selectResult(result, context = 'cases') {
    const searchInput = document.getElementById('searchInput');
    if (context === 'issues') {
      searchInput.value = result.customer_email || result.name || '';
      HubState.issuesSearch = result.customer_email || result.name || '';
      this.hideDropdown();
      HubIssues.load(1);
      
      // Optionally open the issue
      if (result.report_id) {
        setTimeout(() => HubIssues.openIssue(result.report_id), 100);
      }
    } else {
      searchInput.value = result.customer_name || result.customer_email || '';
      HubState.currentSearch = result.customer_name || result.customer_email || '';
      this.hideDropdown();
      HubFilters.applyFilters();
      
      // Optionally open the case
      if (result.case_id) {
        setTimeout(() => HubCases.openCase(result.case_id), 100);
      }
    }
  },

  hideDropdown() {
    const dropdown = document.getElementById('searchDropdown');
    if (dropdown) dropdown.style.display = 'none';
    this.selectedIndex = -1;
    this.searchResults = [];
  },

  clear() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    if (searchInput) {
      searchInput.value = '';
      const currentPage = HubState.currentPage;
      if (currentPage === 'issues') {
        HubState.issuesSearch = '';
        HubIssues.load(1);
      } else {
        HubState.currentSearch = '';
        HubFilters.applyFilters();
      }
      clearBtn.style.display = 'none';
      this.hideDropdown();
    }
  },

  updatePlaceholder() {
    const searchInput = document.getElementById('searchInput');
    const assigneeFilter = document.getElementById('assigneeFilter');
    const statusFilter = document.getElementById('statusFilter');
    const sortBy = document.getElementById('sortBy');
    
    if (!searchInput) return;

    const currentPage = HubState.currentPage;
    if (currentPage === 'issues') {
      searchInput.placeholder = 'Search issues: email, name, report ID, description...';
      // Hide assignee filter for issues
      if (assigneeFilter) assigneeFilter.style.display = 'none';
      // Update status filter options for issues
      if (statusFilter) {
        statusFilter.innerHTML = `
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        `;
      }
      // Update sort options for issues
      if (sortBy) {
        sortBy.innerHTML = `
          <option value="created_desc">Newest First</option>
          <option value="created_asc">Oldest First</option>
          <option value="status_asc">Status (A-Z)</option>
          <option value="status_desc">Status (Z-A)</option>
          <option value="customer_email_asc">Email (A-Z)</option>
          <option value="customer_email_desc">Email (Z-A)</option>
          <option value="issue_type_asc">Issue Type (A-Z)</option>
          <option value="issue_type_desc">Issue Type (Z-A)</option>
        `;
      }
    } else {
      searchInput.placeholder = 'Search anything: name, email, case ID, order, resolution...';
      // Show assignee filter for cases
      if (assigneeFilter) assigneeFilter.style.display = 'block';
      // Update status filter options for cases
      if (statusFilter) {
        statusFilter.innerHTML = `
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        `;
      }
      // Update sort options for cases
      if (sortBy) {
        sortBy.innerHTML = `
          <option value="created_desc">Newest First</option>
          <option value="created_asc">Oldest First</option>
          <option value="due_asc">Due Date (Earliest)</option>
          <option value="due_desc">Due Date (Latest)</option>
          <option value="customer_name_asc">Customer (A-Z)</option>
          <option value="customer_name_desc">Customer (Z-A)</option>
          <option value="status_asc">Status (A-Z)</option>
          <option value="status_desc">Status (Z-A)</option>
          <option value="case_type_asc">Type (A-Z)</option>
          <option value="case_type_desc">Type (Z-A)</option>
          <option value="assigned_to_asc">Assignee (A-Z)</option>
          <option value="assigned_to_desc">Assignee (Z-A)</option>
        `;
      }
    }
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// ============================================
// FILTERS & SORTING
// ============================================
const HubFilters = {
  init() {
    // Load saved filter state from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const savedFilters = localStorage.getItem('hub_filters');
    
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters);
        if (filters.status) document.getElementById('statusFilter').value = filters.status;
        if (filters.assignee) document.getElementById('assigneeFilter').value = filters.assignee;
        if (filters.dateRange) document.getElementById('dateRangeFilter').value = filters.dateRange;
        if (filters.sortBy) document.getElementById('sortBy').value = filters.sortBy;
      } catch (e) {
        console.error('Failed to load saved filters:', e);
      }
    }
  },

  applyFilters() {
    const currentPage = HubState.currentPage;
    
    if (currentPage === 'issues') {
      // Apply issue filters
      const status = document.getElementById('statusFilter')?.value || '';
      const dateRange = document.getElementById('dateRangeFilter')?.value || '';
      const sortBy = document.getElementById('sortBy')?.value || 'created_desc';

      // Save filters
      localStorage.setItem('hub_issues_filters', JSON.stringify({
        status, dateRange, sortBy
      }));

      // Update state
      HubState.issuesStatus = status;
      HubState.issuesDateRange = dateRange;
      HubState.issuesSortBy = sortBy;

      // Reload issues
      HubIssues.load(1);
    } else {
      // Apply case filters (default) - check both inline and header filters
      const status = document.getElementById('casesStatusFilter')?.value || document.getElementById('statusFilter')?.value || '';
      const assignee = document.getElementById('casesAssigneeFilter')?.value || document.getElementById('assigneeFilter')?.value || '';
      const dateRange = document.getElementById('casesDateFilter')?.value || document.getElementById('dateRangeFilter')?.value || '';
      const sortBy = document.getElementById('casesSortFilter')?.value || document.getElementById('sortBy')?.value || 'created_desc';
      const search = HubState.currentSearch || '';

      // Save filters
      localStorage.setItem('hub_filters', JSON.stringify({
        status, assignee, dateRange, sortBy
      }));

      // Update state
      HubState.currentStatus = status;
      HubState.currentAssignee = assignee;
      HubState.currentDateRange = dateRange;
      HubState.currentSortBy = sortBy;

      // Sync inline filters with header filters
      this.syncFilters();

      // Reload cases
      HubCases.loadCases(1);
    }
  },

  syncFilters() {
    // Sync inline filters with header filters
    const headerStatus = document.getElementById('statusFilter');
    const inlineStatus = document.getElementById('casesStatusFilter');
    if (headerStatus && inlineStatus && headerStatus.value !== inlineStatus.value) {
      if (document.activeElement === headerStatus) {
        inlineStatus.value = headerStatus.value;
      } else if (document.activeElement === inlineStatus) {
        headerStatus.value = inlineStatus.value;
      }
    }

    const headerAssignee = document.getElementById('assigneeFilter');
    const inlineAssignee = document.getElementById('casesAssigneeFilter');
    if (headerAssignee && inlineAssignee && headerAssignee.value !== inlineAssignee.value) {
      if (document.activeElement === headerAssignee) {
        inlineAssignee.value = headerAssignee.value;
      } else if (document.activeElement === inlineAssignee) {
        headerAssignee.value = inlineAssignee.value;
      }
    }
  },

  getFilterParams() {
    return {
      status: HubState.currentStatus || '',
      assignee: HubState.currentAssignee || '',
      dateRange: HubState.currentDateRange || '',
      sortBy: HubState.currentSortBy || 'created_desc',
      search: HubState.currentSearch || ''
    };
  }
};

const HubCases = {
  async loadCases(page = 1) {
    HubUI.showLoading();

    try {
      let url = `/hub/api/cases?page=${page}&limit=${HubConfig.ITEMS_PER_PAGE}`;

      if (HubState.currentFilter && HubState.currentFilter !== 'all') {
        url += `&type=${HubState.currentFilter}`;
      }
      if (HubState.currentStatus) {
        url += `&status=${HubState.currentStatus}`;
      }
      if (HubState.currentAssignee) {
        url += `&assignee=${encodeURIComponent(HubState.currentAssignee)}`;
      }
      if (HubState.currentDateRange) {
        url += `&dateRange=${HubState.currentDateRange}`;
      }
      if (HubState.currentSortBy) {
        const [field, order] = HubState.currentSortBy.split('_');
        url += `&sortBy=${field}&sortOrder=${order}`;
      }
      if (HubState.currentSearch) {
        url += `&search=${encodeURIComponent(HubState.currentSearch)}`;
      }

      const result = await HubAPI.get(url);
      HubState.cases = result.cases || [];
      HubState.casesPage = page;
      HubState.totalPages = result.totalPages || 1;
      HubState.totalCases = result.total || HubState.cases.length; // Store total for result count

      // Update navigation counts if provided
      if (result.counts) {
        this.updateNavigationCounts(result.counts);
      }

      // Load assignees for filter dropdown
      if (result.assignees) {
        this.updateAssigneeFilter(result.assignees);
      }

      this.renderCasesList();
    } catch (e) {
      console.error('Failed to load cases:', e);
      HubUI.showToast('Failed to load cases', 'error');
    } finally {
      HubUI.hideLoading();
    }
  },

  updateAssigneeFilter(assignees) {
    // Update both header and inline assignee filters
    const filters = [
      document.getElementById('assigneeFilter'),
      document.getElementById('casesAssigneeFilter')
    ].filter(Boolean);

    const uniqueAssignees = [...new Set(assignees.filter(a => a && a !== 'Unassigned'))];

    filters.forEach(assigneeFilter => {
      // Keep "All Assignees" and "Unassigned" options
      const currentValue = assigneeFilter.value;
      assigneeFilter.innerHTML = '<option value="">All Assignees</option><option value="unassigned">Unassigned</option>';
      
      // Add unique assignees
      uniqueAssignees.forEach(assignee => {
        const option = document.createElement('option');
        option.value = assignee;
        option.textContent = assignee;
        assigneeFilter.appendChild(option);
      });

      // Restore selection
      if (currentValue) {
        assigneeFilter.value = currentValue;
      }
    });
  },

  renderCasesList() {
    const container = document.getElementById('casesTableBody');
    if (!container) return;

    // Update result count
    const resultCount = document.getElementById('casesResultCount');
    if (resultCount) {
      const total = HubState.totalCases || HubState.cases.length;
      resultCount.textContent = `${total} case${total !== 1 ? 's' : ''} found`;
    }

    if (HubState.cases.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="8" class="empty-state">
            <div style="padding: 40px; text-align: center;">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="48" height="48" style="color: var(--gray-300); margin-bottom: 16px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
              <h3 style="color: var(--gray-700); margin-bottom: 8px;">No cases found</h3>
              <p style="color: var(--gray-500); font-size: 14px;">Try adjusting your filters or search query</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = HubState.cases.map((c, idx) => {
      // Calculate due date (24 hours from creation)
      const createdDate = new Date(c.created_at);
      const dueDate = new Date(createdDate.getTime() + (24 * 60 * 60 * 1000));
      const now = new Date();
      const isOverdue = now > dueDate && c.status !== 'completed';
      const hoursLeft = Math.max(0, Math.round((dueDate - now) / (1000 * 60 * 60)));
      const dueClass = isOverdue ? 'overdue' : hoursLeft < 8 ? 'warning' : 'ok';
      
      // Format resolution text
      const resolutionText = this.formatResolution(c.resolution) || 'Pending Review';
      const statusClass = c.status ? c.status.replace('_', '-') : 'pending';
      
      return `
      <tr onclick="HubCases.openCase('${c.case_id}')" data-case-id="${c.case_id}">
        <td>
          <input type="checkbox" class="case-checkbox" data-case-id="${c.case_id}"
                 onclick="event.stopPropagation(); HubBulkActions.toggleSelect('${c.case_id}')"
                 ${HubState.selectedCaseIds.has(c.case_id) ? 'checked' : ''}>
        </td>
        <td class="td-customer">
          <div class="td-customer-name">${HubHelpers.formatName(c.customer_name)}</div>
          <div class="td-customer-email">${this.escapeHtml(c.customer_email || '-')}</div>
        </td>
        <td><span class="type-badge ${c.case_type}">${c.case_type}</span></td>
        <td><span class="status-badge ${statusClass}">${this.formatStatus(c.status)}</span></td>
        <td class="td-due ${dueClass}">
          ${isOverdue ? 'Overdue' : hoursLeft + 'h left'}
        </td>
        <td class="td-resolution">${this.escapeHtml(resolutionText)}</td>
        <td class="td-assignee">${HubUsers.renderAssigneeCell(c.case_id, c.assigned_to)}</td>
        <td class="td-created">${this.timeAgo(c.created_at)}</td>
      </tr>
    `;
    }).join('');

    this.renderPagination();
  },

  updateNavigationCounts(counts) {
    const badgeMap = {
      'all': 'allCasesCount',
      'shipping': 'shippingCount',
      'refund': 'refundsCount',
      'return': 'returnsCount',
      'subscription': 'subscriptionsCount',
      'manual': 'manualCount'
    };

    Object.keys(badgeMap).forEach(key => {
      const badgeId = badgeMap[key];
      const badge = document.getElementById(badgeId);
      if (badge) {
        badge.textContent = counts[key] || 0;
      }
    });
  },

  renderPagination() {
    const container = document.getElementById('casesPagination');
    if (!container) return;

    const totalPages = HubState.totalPages;
    const currentPage = HubState.casesPage;
    
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = '<div class="pagination">';
    
    // Previous button
    html += `<button class="pagination-btn" onclick="HubCases.loadCases(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
    </button>`;
    
    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      html += `<button class="pagination-btn" onclick="HubCases.loadCases(1)">1</button>`;
      if (startPage > 2) html += `<span class="pagination-info">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
      html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="HubCases.loadCases(${i})">${i}</button>`;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) html += `<span class="pagination-info">...</span>`;
      html += `<button class="pagination-btn" onclick="HubCases.loadCases(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    html += `<button class="pagination-btn" onclick="HubCases.loadCases(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
    </button>`;
    
    html += '</div>';

    container.innerHTML = html;
  },

  async openCase(caseId) {
    // Navigate to full-page case detail view
    HubState.currentCaseIndex = HubState.cases.findIndex(c => c.case_id === caseId);
    HubNavigation.goto('case-detail', caseId);
  },

  async updateStatus(status) {
    if (!HubState.currentCase) return;

    // If completing, show checklist first
    if (status === 'completed') {
      const result = await HubChecklist.showForCase(HubState.currentCase.case_id);
      if (!result.canComplete) return;
    }

    try {
      const result = await HubAPI.put(`/hub/api/case/${HubState.currentCase.case_id}/status`, { status });

      if (result.success) {
        HubState.currentCase.status = status;
        HubUI.updateCaseModalStatus(status);
        HubUI.showToast(`Status updated to ${status}`, 'success');

        // Refresh cases list
        this.loadCases(HubState.casesPage);
      } else {
        HubUI.showToast(result.error, 'error');
      }
    } catch (e) {
      HubUI.showToast('Failed to update status', 'error');
    }
  },

  navigateCase(direction) {
    const newIndex = direction === 'prev'
      ? HubState.currentCaseIndex - 1
      : HubState.currentCaseIndex + 1;

    if (newIndex >= 0 && newIndex < HubState.cases.length) {
      this.openCase(HubState.cases[newIndex].case_id);
    }
  },

  setStatusFilter(status) {
    HubState.currentStatus = status;
    this.loadCases(1);
  },

  openShopifyOrder() {
    if (HubState.currentCase?.order_url) {
      window.open(HubState.currentCase.order_url, '_blank');
    }
  },

  formatStatus(status) {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  },

  timeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return new Date(timestamp).toLocaleDateString();
  },

  formatDueDate(dueDate) {
    const now = new Date();
    const diffMs = dueDate - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 0) return 'Overdue';
    if (diffHours < 24) return `${diffHours}h left`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d left`;
  },

  formatResolution(resolution) {
    if (!resolution) return null;
    
    // Format common resolution codes to readable text
    const resolutionMap = {
      'full_refund': 'Process full refund',
      'partial_20': 'Process 20% partial refund',
      'partial_30': 'Process 30% partial refund',
      'partial_50': 'Process 50% partial refund',
      'reship_missing_item': 'Reship missing item',
      'reship_missing_item_bonus': 'Reship missing item with bonus',
      'subscription_paused': 'Subscription paused',
      'subscription_cancelled': 'Subscription cancelled',
      'subscription_updated': 'Subscription updated',
      'discount_applied': 'Discount applied',
      'manual_assistance': 'Manual assistance required'
    };
    
    // Check for partial refund patterns
    const partialMatch = resolution.match(/^partial_(\d+)$/);
    if (partialMatch) {
      return `Process ${partialMatch[1]}% partial refund`;
    }
    
    // Check for partial refund + reship
    const partialReshipMatch = resolution.match(/^partial_(\d+)_reship$/);
    if (partialReshipMatch) {
      return `Process ${partialReshipMatch[1]}% refund + reship`;
    }
    
    return resolutionMap[resolution] || resolution.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// ============================================
// NAVIGATION
// ============================================
const HubNavigation = {
  goto(page, filter = null) {
    HubState.currentPage = page;
    HubState.currentFilter = filter || null;

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const selector = filter
      ? `.nav-item[data-page="${page}"][data-filter="${filter}"]`
      : `.nav-item[data-page="${page}"]`;
    document.querySelector(selector)?.classList.add('active');

    // Update page title dynamically based on page and filter
    const pageTitle = this.getPageTitle(page, filter);
    const pageTitleEl = document.getElementById('pageTitle');
    if (pageTitleEl) {
      pageTitleEl.textContent = pageTitle;
    }

    // Update search placeholder and filter UI based on current page
    if (HubSearch.updatePlaceholder) {
      HubSearch.updatePlaceholder();
    }

    // Update URL with slug
    this.updateURL(page, filter);

    // Show/hide views - map page names to view IDs
    const viewMap = {
      'dashboard': 'dashboardView',
      'cases': 'casesView',
      'sessions': 'sessionsView',
      'events': 'eventsView',
      'issues': 'issuesView',
      'analytics': 'analyticsView',
      'audit': 'auditView',
      'users': 'usersView',
      'sop': 'sopView',
      'email-templates': 'emailTemplatesView',
      'case-detail': 'caseDetailView'
    };
    
    Object.entries(viewMap).forEach(([pageName, viewId]) => {
      const el = document.getElementById(viewId);
      if (el) el.style.display = pageName === page ? 'block' : 'none';
    });

    // Hide header filters on pages that have their own filters or don't need them
    const headerFilters = document.getElementById('headerFilters');
    if (headerFilters) {
      // Show header filters only on dashboard, hide on cases (uses inline filters) and other pages
      const pagesWithHeaderFilters = ['dashboard'];
      headerFilters.style.display = pagesWithHeaderFilters.includes(page) ? 'flex' : 'none';
    }

    // Load data
    if (page === 'cases') {
      HubState.currentFilter = filter || 'all';
      HubCases.loadCases();
      // Also load stats to update sidebar progress
      HubDashboard.loadStats();
    } else if (page === 'dashboard') {
      HubDashboard.load();
    } else if (page === 'sessions') {
      HubSessions.load();
    } else if (page === 'events') {
      HubEvents.load();
    } else if (page === 'issues') {
      HubIssues.load();
    } else if (page === 'analytics') {
      HubAnalytics.load();
    } else if (page === 'audit') {
      HubEnhancedAuditLog.show();
    } else if (page === 'users') {
      HubUsers.show();
    } else if (page === 'sop') {
      HubSOP.load();
    } else if (page === 'email-templates') {
      HubEmailTemplates.load();
    } else if (page === 'case-detail') {
      // filter here is actually the caseId
      HubCaseDetail.load(filter);
    }
  },

  getPageTitle(page, filter) {
    // Base titles
    const baseTitles = {
      dashboard: 'Dashboard',
      cases: 'Cases',
      sessions: 'Sessions',
      events: 'Event Log',
      issues: 'Issue Reports',
      analytics: 'Performance',
      audit: 'Audit Log',
      users: 'User Management',
      sop: 'SOP Links',
      'email-templates': 'Email Templates',
      'case-detail': 'Case Details'
    };

    // If cases page with filter, show filter name
    if (page === 'cases' && filter && filter !== 'all') {
      const filterTitles = {
        shipping: 'Shipping',
        refund: 'Refunds',
        return: 'Returns',
        subscription: 'Subscriptions',
        manual: 'Manual Review'
      };
      return filterTitles[filter] || baseTitles[page];
    }

    return baseTitles[page] || 'Dashboard';
  },

  // Simple URL update - just update the browser URL without complex state management
  updateURL(page, filter) {
    let path = '/hub';
    
    if (page === 'dashboard') {
      path = '/hub';
    } else if (page === 'cases') {
      path = filter && filter !== 'all' ? `/hub/cases/${filter}` : '/hub/cases';
    } else if (page === 'sessions') {
      path = '/hub/sessions';
    } else if (page === 'events') {
      path = '/hub/events';
    } else if (page === 'issues') {
      path = '/hub/issues';
    } else if (page === 'analytics') {
      path = '/hub/analytics';
    } else if (page === 'audit') {
      path = '/hub/audit';
    } else if (page === 'users') {
      path = '/hub/users';
    } else if (page === 'sop') {
      path = '/hub/sop';
    } else if (page === 'email-templates') {
      path = '/hub/email-templates';
    } else if (page === 'case-detail') {
      path = `/hub/case/${filter}`;
    }

    // Update URL without reload
    if (window.history && window.history.pushState) {
      window.history.pushState({ page, filter }, '', path);
    }
  }
};

// ============================================
// SESSIONS
// ============================================
const HubSessions = {
  async load(page = 1) {
    HubUI.showLoading();
    try {
      const result = await HubAPI.get(`/hub/api/sessions?page=${page}&limit=${HubConfig.ITEMS_PER_PAGE}`);
      this.renderSessionsList(result.sessions || []);
      this.renderPagination(result.total || 0, result.sessions?.length || 0, page, HubConfig.ITEMS_PER_PAGE);
    } catch (e) {
      console.error('Failed to load sessions:', e);
      HubUI.showToast('Failed to load sessions', 'error');
    } finally {
      HubUI.hideLoading();
    }
  },

  renderSessionsList(sessions) {
    const container = document.getElementById('sessionsTableBody');
    if (!container) return;

    if (sessions.length === 0) {
      container.innerHTML = `<tr><td colspan="6" class="empty-state">No sessions found</td></tr>`;
      return;
    }

    container.innerHTML = sessions.map(s => {
      const startedAt = s.started_at || s.created_at;
      const customerName = s.customer_name || s.customer_email || 'Anonymous';
      const orderNumber = s.order_number || 'N/A';
      const flowType = s.flow_type || 'N/A';
      const completed = s.ended_at ? true : false;
      const recordingUrl = s.session_replay_url || null;

      return `
        <tr>
          <td>${this.formatDate(startedAt)}</td>
          <td>
            <div class="customer-info">
              <span class="customer-name">${this.escapeHtml(customerName)}</span>
              ${s.customer_email ? `<span class="customer-email">${this.escapeHtml(s.customer_email)}</span>` : ''}
            </div>
          </td>
          <td>${this.escapeHtml(orderNumber)}</td>
          <td><span class="type-badge">${this.escapeHtml(flowType)}</span></td>
          <td><span class="status-badge ${completed ? 'completed' : 'in-progress'}">${completed ? 'Completed' : 'In Progress'}</span></td>
          <td>${recordingUrl ? `<a href="${recordingUrl}" target="_blank" class="btn-icon" style="color: var(--primary-600);">Watch</a>` : 'N/A'}</td>
        </tr>
      `;
    }).join('');
  },

  renderPagination(total, currentCount, currentPage, limit) {
    const container = document.getElementById('sessionsPagination');
    if (!container) return;

    const totalPages = Math.ceil(total / limit);
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = '';
    if (currentPage > 1) {
      html += `<button onclick="HubSessions.load(${currentPage - 1})">Previous</button>`;
    }
    html += `<span>Page ${currentPage} of ${totalPages}</span>`;
    if (currentPage < totalPages) {
      html += `<button onclick="HubSessions.load(${currentPage + 1})">Next</button>`;
    }
    container.innerHTML = html;
  },

  formatDate(timestamp) {
    if (!timestamp) return '-';
    try {
      return new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// ============================================
// EVENTS
// ============================================
const HubEvents = {
  async load(page = 1) {
    HubUI.showLoading();
    try {
      const result = await HubAPI.get(`/hub/api/events?page=${page}&limit=${HubConfig.ITEMS_PER_PAGE}&offset=${(page - 1) * HubConfig.ITEMS_PER_PAGE}`);
      this.renderEventsList(result.events || []);
      this.renderPagination(result.total || 0, result.events?.length || 0, page, HubConfig.ITEMS_PER_PAGE);
    } catch (e) {
      console.error('Failed to load events:', e);
      HubUI.showToast('Failed to load events', 'error');
    } finally {
      HubUI.hideLoading();
    }
  },

  renderEventsList(events) {
    const container = document.getElementById('eventsTableBody');
    if (!container) return;

    if (events.length === 0) {
      container.innerHTML = `<tr><td colspan="5" class="empty-state">No events found</td></tr>`;
      return;
    }

    container.innerHTML = events.map(e => {
      const eventData = e.event_data ? (typeof e.event_data === 'string' ? e.event_data : JSON.stringify(e.event_data)) : '{}';
      const truncatedData = eventData.length > 50 ? eventData.substring(0, 50) + '...' : eventData;
      
      return `
        <tr>
          <td><code style="font-size: 12px; color: var(--gray-600);">${this.escapeHtml((e.session_id || '').substring(0, 12))}...</code></td>
          <td><span class="type-badge">${this.escapeHtml(e.event_type || 'N/A')}</span></td>
          <td>${this.escapeHtml(e.event_name || 'N/A')}</td>
          <td><code style="font-size: 11px; color: var(--gray-500); max-width: 200px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(truncatedData)}</code></td>
          <td class="time-ago">${this.formatDate(e.created_at)}</td>
        </tr>
      `;
    }).join('');
  },

  renderPagination(total, currentCount, currentPage, limit) {
    const container = document.getElementById('eventsPagination');
    if (!container) return;

    const totalPages = Math.ceil(total / limit);
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = '';
    if (currentPage > 1) {
      html += `<button onclick="HubEvents.load(${currentPage - 1})">Previous</button>`;
    }
    html += `<span>Page ${currentPage} of ${totalPages}</span>`;
    if (currentPage < totalPages) {
      html += `<button onclick="HubEvents.load(${currentPage + 1})">Next</button>`;
    }
    container.innerHTML = html;
  },

  formatDate(timestamp) {
    if (!timestamp) return '-';
    try {
      return new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// ============================================
// ISSUES (ISSUE REPORTS - renamed from trouble_reports)
// ============================================
const HubIssues = {
  async load(page = 1) {
    HubUI.showLoading();
    try {
      let url = `/hub/api/issues?page=${page}&limit=50`;

      // Add filters
      if (HubState.issuesStatus) {
        url += `&status=${encodeURIComponent(HubState.issuesStatus)}`;
      }
      if (HubState.issuesDateRange) {
        url += `&dateRange=${encodeURIComponent(HubState.issuesDateRange)}`;
      }
      if (HubState.issuesSortBy) {
        const [field, order] = HubState.issuesSortBy.split('_');
        url += `&sortBy=${field}&sortOrder=${order}`;
      }
      if (HubState.issuesSearch) {
        url += `&search=${encodeURIComponent(HubState.issuesSearch)}`;
      }

      const result = await HubAPI.get(url);
      this.renderIssues(result.issues || []);
      this.renderPagination(result.total || 0, result.issues?.length || 0, page, 50);
      HubState.issuesPage = page;
      HubState.issuesTotalPages = result.totalPages || 1;
    } catch (e) {
      console.error('Failed to load issues:', e);
      HubUI.showToast('Failed to load issues', 'error');
    } finally {
      HubUI.hideLoading();
    }
  },

  renderIssues(issues) {
    const container = document.getElementById('issuesTableBody');
    if (!container) return;

    if (issues.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">No issues found</td>
        </tr>
      `;
      return;
    }

    container.innerHTML = issues.map(issue => {
      const statusClass = issue.status === 'resolved' ? 'completed' : issue.status === 'in_progress' ? 'in-progress' : 'pending';
      return `
        <tr onclick="HubIssues.openIssue('${issue.report_id}')">
          <td class="case-id">${this.escapeHtml(issue.report_id || '-')}</td>
          <td>${this.escapeHtml(issue.customer_email || '-')}</td>
          <td>${this.escapeHtml(issue.issue_type || '-')}</td>
          <td><span class="status-badge ${statusClass}">${this.formatStatus(issue.status || 'pending')}</span></td>
          <td class="time-ago">${this.timeAgo(issue.created_at)}</td>
          <td>
            <button class="btn-icon" onclick="event.stopPropagation(); HubIssues.openIssue('${issue.report_id}')" title="View Details">View</button>
          </td>
        </tr>
      `;
    }).join('');
  },

  renderPagination(total, currentCount, currentPage, limit) {
    const container = document.getElementById('issuesPagination');
    if (!container) return;

    const totalPages = Math.ceil(total / limit);
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = '';
    if (currentPage > 1) {
      html += `<button onclick="HubIssues.load(${currentPage - 1})">Previous</button>`;
    }
    html += `<span>Page ${currentPage} of ${totalPages}</span>`;
    if (currentPage < totalPages) {
      html += `<button onclick="HubIssues.load(${currentPage + 1})">Next</button>`;
    }
    container.innerHTML = html;
  },

  applyFilters() {
    // Get filter values from UI
    const statusFilter = document.getElementById('issuesStatusFilter');
    const dateRangeFilter = document.getElementById('issuesDateRangeFilter');
    const sortByFilter = document.getElementById('issuesSortBy');

    if (statusFilter) HubState.issuesStatus = statusFilter.value || '';
    if (dateRangeFilter) HubState.issuesDateRange = dateRangeFilter.value || '';
    if (sortByFilter) HubState.issuesSortBy = sortByFilter.value || 'created_desc';

    // Reload issues
    this.load(1);
  },

  async openIssue(reportId) {
    try {
      const result = await HubAPI.get(`/hub/api/issues/${reportId}`);
      if (result.report_id) {
        // Show issue in a modal or detail view
        HubUI.showToast('Issue details loaded', 'info');
        // TODO: Implement issue detail modal
      }
    } catch (e) {
      HubUI.showToast('Failed to load issue', 'error');
    }
  },

  formatStatus(status) {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  },

  timeAgo(timestamp) {
    if (!timestamp) return '-';
    const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return new Date(timestamp).toLocaleDateString();
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// ============================================
// ANALYTICS / PERFORMANCE
// ============================================
const HubAnalytics = {
  async load() {
    HubUI.showLoading();
    try {
      const result = await HubAPI.get('/hub/api/analytics');
      
      // Update Row 1: Cases Metrics
      if (document.getElementById('analyticsTotalCases')) {
        document.getElementById('analyticsTotalCases').textContent = result.totalCases || 0;
        document.getElementById('analyticsTotalCasesSub').textContent = `${result.casesToday || 0} today`;
      }
      if (document.getElementById('analyticsPendingCases')) {
        const pending = result.pendingCases || 0;
        const stale = result.staleCases || 0;
        document.getElementById('analyticsPendingCases').textContent = pending;
        document.getElementById('analyticsPendingCasesSub').textContent = `${stale} overdue (24h+)`;
      }
      if (document.getElementById('analyticsInProgress')) {
        document.getElementById('analyticsInProgress').textContent = result.inProgressCases || 0;
      }
      if (document.getElementById('analyticsCompletedCases')) {
        const completed = result.completedCases || 0;
        const total = result.totalCases || 0;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
        document.getElementById('analyticsCompletedCases').textContent = completed;
        document.getElementById('analyticsCompletedSub').textContent = `${rate}% resolution rate`;
      }

      // Update Row 2: Refunds & Sessions
      if (document.getElementById('analyticsTotalRefunds')) {
        document.getElementById('analyticsTotalRefunds').textContent = this.formatCurrency(result.totalRefunds || 0);
      }
      if (document.getElementById('analyticsRefunds30d')) {
        document.getElementById('analyticsRefunds30d').textContent = this.formatCurrency(result.refundsThisMonth || 0);
      }
      if (document.getElementById('analyticsAvgRefund')) {
        document.getElementById('analyticsAvgRefund').textContent = this.formatCurrency(result.avgRefund || 0);
      }
      if (document.getElementById('analyticsTotalSessions')) {
        const sessions = result.totalSessions || 0;
        const completed = result.completedSessions || 0;
        const rate = sessions > 0 ? Math.round((completed / sessions) * 100) : 0;
        document.getElementById('analyticsTotalSessions').textContent = sessions;
        document.getElementById('analyticsSessionsSub').textContent = `${rate}% completion`;
      }

      // Update Row 3: Performance Metrics
      if (document.getElementById('analyticsAvgResolution')) {
        const avg = result.avgResolutionHours || 0;
        const min = result.minResolutionHours || 0;
        const max = result.maxResolutionHours || 0;
        document.getElementById('analyticsAvgResolution').textContent = this.formatHours(avg);
        document.getElementById('analyticsResolutionSub').textContent = `Min: ${this.formatHours(min)} Max: ${this.formatHours(max)}`;
      }
      if (document.getElementById('analyticsSLACompliance')) {
        const rate = result.slaComplianceRate || 0;
        const compliant = result.slaCompliant || 0;
        const breached = result.slaBreached || 0;
        document.getElementById('analyticsSLACompliance').textContent = `${rate}%`;
        document.getElementById('analyticsSLASub').textContent = `${compliant} met ${breached} breached (24h)`;
      }
      if (document.getElementById('analyticsTeamMembers')) {
        const teamCount = new Set((result.teamPerformance || []).map(t => t.user_name)).size;
        document.getElementById('analyticsTeamMembers').textContent = teamCount;
      }
      if (document.getElementById('analyticsRootCauses')) {
        document.getElementById('analyticsRootCauses').textContent = (result.rootCauses || []).length;
      }

      // Render detailed analytics
      console.log('Analytics data received:', result);
      this.renderAnalytics(result);
    } catch (e) {
      console.error('Failed to load analytics:', e);
      HubUI.showToast('Failed to load analytics', 'error');
    } finally {
      HubUI.hideLoading();
    }
  },

  renderAnalytics(data) {
    console.log('Rendering analytics with data:', data);
    
    try {
      // Render Cases & Sessions Trend Chart
      this.renderTrendChart(data);
      
      // Render Cases by Type Donut Chart
      this.renderDonutChart(data);
      
      // Render Resolution Types List
      this.renderResolutionTypes(data);
      
      // Render Status Distribution
      this.renderStatusDistribution(data);
      
      // Render Flow Types
      this.renderFlowTypes(data);
      
      // Render Team Leaderboard
      this.renderTeamLeaderboard(data);
      
      // Render Root Cause Analysis
      this.renderRootCauseAnalysis(data);
      
      // Render Resolution Time Distribution
      this.renderResolutionTimeDistribution(data);
      
      // Apply dark text colors to colored stat cards for better readability
      this.applyStatCardTextColors();
    } catch (e) {
      console.error('Error rendering analytics:', e);
      HubUI.showToast('Error rendering analytics data', 'error');
    }
  },

  applyStatCardTextColors() {
    // Yellow card - Pending Cases
    const pendingCard = document.querySelector('.stat-card.highlight[style*="FEF3C7"]');
    if (pendingCard) {
      const label = pendingCard.querySelector('.stat-label');
      const value = pendingCard.querySelector('.stat-value');
      const change = pendingCard.querySelector('.stat-change');
      if (label) label.style.color = '#78350F';
      if (value) value.style.color = '#92400E';
      if (change) change.style.color = '#B45309';
    }

    // Green card - Completed, SLA Compliance
    const completedCards = document.querySelectorAll('.stat-card.highlight[style*="D1FAE5"]');
    completedCards.forEach(card => {
      const label = card.querySelector('.stat-label');
      const value = card.querySelector('.stat-value');
      const change = card.querySelector('.stat-change');
      if (label) label.style.color = '#065F46';
      if (value) value.style.color = '#047857';
      if (change) change.style.color = '#059669';
    });

    // Pink card - Refunds (30d)
    const refundsCard = document.querySelector('.stat-card.highlight[style*="FCE7F3"]');
    if (refundsCard) {
      const label = refundsCard.querySelector('.stat-label');
      const value = refundsCard.querySelector('.stat-value');
      const change = refundsCard.querySelector('.stat-change');
      if (label) label.style.color = '#831843';
      if (value) value.style.color = '#9F1239';
      if (change) change.style.color = '#BE185D';
    }

    // Red card - Root Cause Categories
    const rootCauseCard = document.querySelector('.stat-card.highlight[style*="FEE2E2"]');
    if (rootCauseCard) {
      const label = rootCauseCard.querySelector('.stat-label');
      const value = rootCauseCard.querySelector('.stat-value');
      const change = rootCauseCard.querySelector('.stat-change');
      if (label) label.style.color = '#991B1B';
      if (value) value.style.color = '#B91C1C';
      if (change) change.style.color = '#DC2626';
    }
  },

  renderTrendChart(data) {
    const container = document.getElementById('analyticsTrendChart');
    if (!container) {
      console.error('analyticsTrendChart container not found');
      return;
    }

    const casesByDay = data.casesByDay || [];
    const sessionsByDay = data.sessionsByDay || [];
    console.log('Rendering trend chart - casesByDay:', casesByDay, 'sessionsByDay:', sessionsByDay);

    if (casesByDay.length === 0 && sessionsByDay.length === 0) {
      container.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 40px;">No data available</p>';
      return;
    }

    // Combine and sort by date
    const allDates = new Set([...casesByDay.map(c => c.date), ...sessionsByDay.map(s => s.date)]);
    const sortedDates = Array.from(allDates).sort();

    const maxValue = Math.max(
      ...casesByDay.map(c => c.count || 0),
      ...sessionsByDay.map(s => s.count || 0),
      1
    );

    const chartHeight = 300;
    const chartWidth = 800;
    const padding = 50;
    const barWidth = (chartWidth - padding * 2) / Math.max(sortedDates.length, 1);

    let svg = `<svg width="100%" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}" style="overflow: visible;">`;
    
    // Draw grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight - padding * 2) * (i / 5);
      svg += `<line x1="${padding}" y1="${y}" x2="${chartWidth - padding}" y2="${y}" stroke="var(--gray-200)" stroke-width="1"/>`;
    }

    // Helper function to create smooth curve using cubic bezier (Catmull-Rom spline approximation)
    const createSmoothPath = (points) => {
      if (points.length < 2) return '';
      if (points.length === 2) {
        return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
      }
      
      let path = `M ${points[0].x} ${points[0].y}`;
      
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(points.length - 1, i + 2)];
        
        // Calculate control points for smooth curve
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
      
      return path;
    };

    // Draw cases line with smooth curve
    if (casesByDay.length > 0) {
      const casePoints = sortedDates.map((date, idx) => {
        const caseData = casesByDay.find(c => c.date === date);
        const x = padding + idx * barWidth + barWidth / 2;
        const y = chartHeight - padding - ((caseData?.count || 0) / maxValue) * (chartHeight - padding * 2);
        return { x, y, value: caseData?.count || 0 };
      });

      // Create smooth path
      const smoothPath = createSmoothPath(casePoints);
      
      // Add area fill under line
      const areaPath = smoothPath + ` L ${chartWidth - padding},${chartHeight - padding} L ${padding},${chartHeight - padding} Z`;
      
      svg += `<defs>
        <linearGradient id="casesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#1a365d;stop-opacity:0.25" />
          <stop offset="100%" style="stop-color:#1a365d;stop-opacity:0.03" />
        </linearGradient>
      </defs>`;
      svg += `<path d="${areaPath}" fill="url(#casesGradient)"/>`;
      svg += `<path d="${smoothPath}" fill="none" stroke="#1a365d" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
      
      // Add dots on line
      casePoints.forEach((point) => {
        svg += `<circle cx="${point.x}" cy="${point.y}" r="5" fill="#1a365d" stroke="white" stroke-width="2.5" opacity="0.9"/>`;
      });
    }

    // Draw sessions line with smooth curve
    if (sessionsByDay.length > 0) {
      const sessionPoints = sortedDates.map((date, idx) => {
        const sessionData = sessionsByDay.find(s => s.date === date);
        const x = padding + idx * barWidth + barWidth / 2;
        const y = chartHeight - padding - ((sessionData?.count || 0) / maxValue) * (chartHeight - padding * 2);
        return { x, y, value: sessionData?.count || 0 };
      });

      // Create smooth path
      const smoothPath = createSmoothPath(sessionPoints);
      
      // Add area fill under line
      const areaPath = smoothPath + ` L ${chartWidth - padding},${chartHeight - padding} L ${padding},${chartHeight - padding} Z`;
      
      svg += `<defs>
        <linearGradient id="sessionsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#10B981;stop-opacity:0.25" />
          <stop offset="100%" style="stop-color:#10B981;stop-opacity:0.03" />
        </linearGradient>
      </defs>`;
      svg += `<path d="${areaPath}" fill="url(#sessionsGradient)"/>`;
      svg += `<path d="${smoothPath}" fill="none" stroke="#10B981" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
      
      // Add dots on line
      sessionPoints.forEach((point) => {
        svg += `<circle cx="${point.x}" cy="${point.y}" r="5" fill="#10B981" stroke="white" stroke-width="2.5" opacity="0.9"/>`;
      });
    }

    // Draw Y-axis labels
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight - padding * 2) * (i / 5);
      const value = Math.round(maxValue * (1 - i / 5));
      svg += `<text x="${padding - 10}" y="${y + 4}" text-anchor="end" font-size="11" font-weight="500" fill="var(--gray-500)">${value}</text>`;
    }

    // Draw date labels
    sortedDates.forEach((date, idx) => {
      const x = padding + idx * barWidth + barWidth / 2;
      try {
        // Handle both date strings and Date objects
        const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        svg += `<text x="${x}" y="${chartHeight - 15}" text-anchor="middle" font-size="11" font-weight="500" fill="var(--gray-600)">${dateStr}</text>`;
      } catch (e) {
        console.error('Error formatting date:', date, e);
        svg += `<text x="${x}" y="${chartHeight - 15}" text-anchor="middle" font-size="11" font-weight="500" fill="var(--gray-600)">${date}</text>`;
      }
    });

    svg += '</svg>';

    container.innerHTML = svg;
  },

  renderDonutChart(data) {
    const container = document.getElementById('analyticsCasesByTypeChart');
    if (!container) {
      console.error('analyticsCasesByTypeChart container not found');
      return;
    }

    const casesByType = data.casesByType || [];
    console.log('Rendering donut chart - casesByType:', casesByType);
    if (casesByType.length === 0) {
      container.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 40px;">No data available</p>';
      return;
    }

    const total = casesByType.reduce((sum, item) => sum + (item.count || 0), 0);
    if (total === 0) {
      container.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 40px;">No data available</p>';
      return;
    }

    // Use brand colors with gradients
    const colors = [
      'url(#donutGradient1)', // Red gradient
      'url(#donutGradient2)', // Blue gradient  
      'url(#donutGradient3)', // Green gradient
      'url(#donutGradient4)', // Amber gradient
      'url(#donutGradient5)'  // Purple gradient
    ];
    const colorStops = [
      { start: '#EF4444', end: '#F87171' },
      { start: '#1a365d', end: '#2c5282' },
      { start: '#10B981', end: '#34D399' },
      { start: '#F59E0B', end: '#FBBF24' },
      { start: '#8B5CF6', end: '#A78BFA' }
    ];
    const size = 180;
    const radius = size / 2 - 12;
    const center = size / 2;

    let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display: block; margin: 0 auto; filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));">`;
    
    // Add gradient definitions
    svg += '<defs>';
    colorStops.forEach((stop, idx) => {
      svg += `<linearGradient id="donutGradient${idx + 1}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${stop.start};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${stop.end};stop-opacity:1" />
      </linearGradient>`;
    });
    svg += '</defs>';
    
    let currentAngle = -90;
    casesByType.forEach((item, idx) => {
      const value = item.count || 0;
      const percentage = (value / total) * 100;
      const angle = (percentage / 100) * 360;
      
      const x1 = center + radius * Math.cos((currentAngle * Math.PI) / 180);
      const y1 = center + radius * Math.sin((currentAngle * Math.PI) / 180);
      const x2 = center + radius * Math.cos(((currentAngle + angle) * Math.PI) / 180);
      const y2 = center + radius * Math.sin(((currentAngle + angle) * Math.PI) / 180);
      
      const largeArc = angle > 180 ? 1 : 0;
      
      svg += `<path d="M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${colors[idx % colors.length]}" stroke="white" stroke-width="3" opacity="0.95"/>`;
      
      currentAngle += angle;
    });

    // Center circle with gradient background
    svg += `<circle cx="${center}" cy="${center}" r="${radius - 20}" fill="white" opacity="0.9"/>`;
    
    // Center text with better styling
    svg += `<text x="${center}" y="${center - 8}" text-anchor="middle" font-size="28" font-weight="700" font-family="Space Grotesk, sans-serif" fill="#1a365d">${total}</text>`;
    svg += `<text x="${center}" y="${center + 12}" text-anchor="middle" font-size="13" font-weight="600" fill="#6b7280">Total Cases</text>`;

    svg += '</svg>';

    // Add enhanced legend
    const legend = casesByType.map((item, idx) => `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; padding: 8px 12px; border-radius: 8px; transition: all 0.2s ease; cursor: pointer;" 
           onmouseover="this.style.background='rgba(249, 250, 251, 0.8)'" 
           onmouseout="this.style.background='transparent'">
        <div style="width: 16px; height: 16px; background: linear-gradient(135deg, ${colorStops[idx % colorStops.length].start} 0%, ${colorStops[idx % colorStops.length].end} 100%); border-radius: 4px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);"></div>
        <span style="font-size: 13px; font-weight: 500; color: var(--gray-700); flex: 1;">${this.escapeHtml(item.case_type || 'Unknown')}</span>
        <span style="font-size: 14px; font-weight: 700; color: var(--gray-900); font-family: 'Space Grotesk', sans-serif;">${item.count || 0}</span>
      </div>
    `).join('');

    container.innerHTML = `<div style="text-align: center; margin-bottom: 24px;">${svg}</div><div style="margin-top: 24px; padding: 0 8px;">${legend}</div>`;
  },

  renderResolutionTypes(data) {
    const container = document.getElementById('analyticsResolutionTypes');
    if (!container) return;

    const types = (data.resolutionTypes || []).slice(0, 10);
    if (types.length === 0) {
      container.innerHTML = '<p style="color: var(--gray-500);">No data available</p>';
      return;
    }

    container.innerHTML = types.map((r, idx) => `
      <div style="padding: 14px 16px; border-bottom: 1px solid rgba(229, 231, 235, 0.5); border-radius: 12px; margin-bottom: 8px; background: ${idx % 2 === 0 ? 'rgba(249, 250, 251, 0.5)' : 'transparent'}; transition: all 0.2s ease;">
        <div style="font-size: 13px; font-weight: 500; color: var(--gray-700); margin-bottom: 8px; line-height: 1.4;">${this.escapeHtml(r.resolution || 'Unknown')}</div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 20px; font-weight: 700; font-family: 'Space Grotesk', sans-serif; color: var(--brand-navy);">${r.count || 0}</span>
          ${r.total_refund ? `<span style="font-size: 13px; font-weight: 600; color: var(--success-600); padding: 4px 10px; background: rgba(16, 185, 129, 0.1); border-radius: 6px;">${this.formatCurrency(r.total_refund)}</span>` : ''}
        </div>
      </div>
    `).join('');
  },

  renderStatusDistribution(data) {
    const container = document.getElementById('analyticsStatusDistribution');
    if (!container) {
      console.error('analyticsStatusDistribution container not found');
      return;
    }

    const statuses = data.casesByStatus || [];
    console.log('Rendering status distribution - statuses:', statuses);
    if (statuses.length === 0) {
      container.innerHTML = '<p style="color: var(--gray-500);">No data available</p>';
      return;
    }

    const maxCount = Math.max(...statuses.map(s => s.count || 0));
    const colors = { 'completed': '#D1FAE5', 'in_progress': '#DBEAFE', 'pending': '#FEF3C7' };

    container.innerHTML = statuses.map(s => {
      const status = s.status || 'unknown';
      const count = s.count || 0;
      const width = maxCount > 0 ? (count / maxCount) * 100 : 0;
      const color = colors[status] || 'var(--gray-100)';
      const statusColors = {
        'completed': { bg: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)', text: '#059669', bar: '#10B981' },
        'in_progress': { bg: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)', text: '#2563EB', bar: '#3B82F6' },
        'pending': { bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', text: '#D97706', bar: '#F59E0B' }
      };
      const statusStyle = statusColors[status] || { bg: 'var(--gray-100)', text: 'var(--gray-700)', bar: 'var(--gray-400)' };
      
      return `
        <div style="margin-bottom: 16px; padding: 14px 16px; background: ${statusStyle.bg}; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.5);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 13px; font-weight: 600; color: ${statusStyle.text}; text-transform: capitalize;">${this.escapeHtml(status.replace('_', ' '))}</span>
            <span style="font-size: 18px; font-weight: 700; font-family: 'Space Grotesk', sans-serif; color: ${statusStyle.text};">${count}</span>
          </div>
          <div style="width: 100%; height: 10px; background: rgba(255, 255, 255, 0.6); border-radius: 6px; overflow: hidden; box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);">
            <div style="width: ${width}%; height: 100%; background: ${statusStyle.bar}; border-radius: 6px; transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderFlowTypes(data) {
    const container = document.getElementById('analyticsFlowTypes');
    if (!container) {
      console.error('analyticsFlowTypes container not found');
      return;
    }

    const flows = data.flowTypes || [];
    console.log('Rendering flow types - flows:', flows);
    if (flows.length === 0) {
      container.innerHTML = '<p style="color: var(--gray-500);">No data available</p>';
      return;
    }

    container.innerHTML = flows.map((f, idx) => `
      <div style="padding: 14px 16px; border-bottom: 1px solid rgba(229, 231, 235, 0.5); border-radius: 12px; margin-bottom: 8px; background: ${idx % 2 === 0 ? 'rgba(249, 250, 251, 0.5)' : 'transparent'}; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease;">
        <span style="font-size: 13px; font-weight: 500; color: var(--gray-700);">${this.escapeHtml(f.flow_type || 'Unknown')}</span>
        <span style="font-size: 16px; font-weight: 700; font-family: 'Space Grotesk', sans-serif; color: var(--brand-navy); padding: 4px 12px; background: rgba(26, 54, 93, 0.1); border-radius: 8px;">${f.count || 0}</span>
      </div>
    `).join('');
  },

  renderTeamLeaderboard(data) {
    const container = document.getElementById('analyticsTeamLeaderboard');
    if (!container) {
      console.error('analyticsTeamLeaderboard container not found');
      return;
    }

    const team = data.teamPerformance || [];
    console.log('Rendering team leaderboard - team:', team);
    if (team.length === 0) {
      container.innerHTML = '<p style="color: var(--gray-500);">No data available</p>';
      return;
    }

    container.innerHTML = team.map((t, idx) => `
      <div style="padding: 16px; border-bottom: 1px solid rgba(229, 231, 235, 0.5); border-radius: 12px; margin-bottom: 12px; background: ${idx % 2 === 0 ? 'rgba(249, 250, 251, 0.5)' : 'transparent'}; transition: all 0.2s ease;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 14px; font-weight: 600; color: var(--gray-900); font-family: 'Space Grotesk', sans-serif;">${this.escapeHtml(t.user_name || 'Unassigned')}</span>
          <span style="font-size: 18px; font-weight: 700; color: var(--brand-navy); padding: 4px 12px; background: rgba(26, 54, 93, 0.1); border-radius: 8px;">${t.cases_completed || 0}</span>
        </div>
        <div style="display: flex; gap: 16px; font-size: 12px; color: var(--gray-600);">
          <span style="display: flex; align-items: center; gap: 4px;">
            <span style="font-weight: 600;">⏱</span>
            ${this.formatHours(t.avg_resolution_hours || 0)} avg
          </span>
          <span style="display: flex; align-items: center; gap: 4px; color: var(--success-600);">
            <span style="font-weight: 600; width: 18px; height: 18px; display: inline-flex;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8"/><path d="M12 18V6"/></svg></span>
            ${this.formatCurrency(t.total_refunds || 0)}
          </span>
        </div>
      </div>
    `).join('');
  },

  renderRootCauseAnalysis(data) {
    const container = document.getElementById('analyticsRootCauseAnalysis');
    if (!container) {
      console.error('analyticsRootCauseAnalysis container not found');
      return;
    }

    const causes = data.rootCauses || [];
    console.log('Rendering root cause analysis - causes:', causes);
    if (causes.length === 0) {
      container.innerHTML = '<p style="color: var(--gray-500);">No data</p>';
      return;
    }

    container.innerHTML = causes.slice(0, 10).map((c, idx) => `
      <div style="padding: 14px 16px; border-bottom: 1px solid rgba(229, 231, 235, 0.5); border-radius: 12px; margin-bottom: 8px; background: ${idx % 2 === 0 ? 'rgba(254, 242, 242, 0.5)' : 'transparent'}; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease;">
        <span style="font-size: 13px; font-weight: 500; color: var(--gray-700); flex: 1; margin-right: 12px;">${this.escapeHtml(c.reason || 'Unknown')}</span>
        <span style="font-size: 16px; font-weight: 700; font-family: 'Space Grotesk', sans-serif; color: var(--error-600); padding: 4px 12px; background: rgba(239, 68, 68, 0.1); border-radius: 8px; white-space: nowrap;">${c.count || 0}</span>
      </div>
    `).join('');
  },

  renderResolutionTimeDistribution(data) {
    const container = document.getElementById('analyticsResolutionTimeDist');
    if (!container) {
      console.error('analyticsResolutionTimeDist container not found');
      return;
    }

    const dist = data.resolutionDistribution || [];
    console.log('Rendering resolution time distribution - dist:', dist);
    if (dist.length === 0) {
      container.innerHTML = '<p style="color: var(--gray-500);">No data available</p>';
      return;
    }

    container.innerHTML = dist.map((d, idx) => `
      <div style="padding: 14px 16px; border-bottom: 1px solid rgba(229, 231, 235, 0.5); border-radius: 12px; margin-bottom: 8px; background: ${idx % 2 === 0 ? 'rgba(249, 250, 251, 0.5)' : 'transparent'}; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease;">
        <span style="font-size: 13px; font-weight: 500; color: var(--gray-700);">${this.escapeHtml(d.time_bucket || 'Unknown')}</span>
        <span style="font-size: 16px; font-weight: 700; font-family: 'Space Grotesk', sans-serif; color: var(--brand-navy); padding: 4px 12px; background: rgba(26, 54, 93, 0.1); border-radius: 8px;">${d.count || 0}</span>
      </div>
    `).join('');
  },

  formatCurrency(amount) {
    if (!amount || amount === 0) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  },

  formatHours(hours) {
    if (!hours || hours === 0) return '-';
    if (hours < 24) return `${Math.round(hours * 10) / 10}h`;
    return `${Math.round((hours / 24) * 10) / 10}d`;
  },

  formatDate(timestamp) {
    if (!timestamp) return '-';
    try {
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '-';
    }
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// ============================================
// SOP LINKS PAGE
// ============================================
const HubSOP = {
  sops: [],
  currentCategory: '',

  async load() {
    HubUI.showLoading();
    try {
      const url = this.currentCategory 
        ? `/hub/api/sop?category=${this.currentCategory}` 
        : '/hub/api/sop';
      const result = await HubAPI.get(url);
      this.sops = result.sops || [];
      this.render();
      
      // Show add button for admins
      const addBtn = document.getElementById('addSopBtn');
      if (addBtn) {
        addBtn.style.display = HubAuth.isAdmin() ? 'inline-flex' : 'none';
      }
    } catch (e) {
      console.error('Failed to load SOPs:', e);
      HubUI.showToast('Failed to load SOP links', 'error');
    } finally {
      HubUI.hideLoading();
    }
  },

  getPlaceholderSOPs() {
    return [
      // Refund SOPs
      { id: 'p1', scenario_name: 'Full Refund Process', case_type: 'refund', sop_url: '#', description: 'Step-by-step guide for processing full refunds for dissatisfied customers' },
      { id: 'p2', scenario_name: 'Partial Refund - Product Quality Issue', case_type: 'refund', sop_url: '#', description: 'How to process partial refunds when customer reports quality issues' },
      { id: 'p3', scenario_name: 'Partial Refund - Dog Not Using Product', case_type: 'refund', sop_url: '#', description: 'Handling refunds when the dog is not using the PuppyPad' },
      { id: 'p4', scenario_name: 'Refund - Changed Mind', case_type: 'refund', sop_url: '#', description: 'Process for customers who simply changed their mind' },
      
      // Shipping SOPs
      { id: 'p5', scenario_name: 'Missing Package - Reship Process', case_type: 'shipping', sop_url: '#', description: 'How to handle and reship missing packages' },
      { id: 'p6', scenario_name: 'Wrong Item Received', case_type: 'shipping', sop_url: '#', description: 'Steps for when customer receives incorrect items' },
      { id: 'p7', scenario_name: 'Damaged In Transit', case_type: 'shipping', sop_url: '#', description: 'Handling products damaged during shipping' },
      { id: 'p8', scenario_name: 'Address Update / Redirect', case_type: 'shipping', sop_url: '#', description: 'How to update shipping address for in-transit orders' },
      
      // Subscription SOPs
      { id: 'p9', scenario_name: 'Pause Subscription', case_type: 'subscription', sop_url: '#', description: 'How to pause a subscription in Checkout Champ' },
      { id: 'p10', scenario_name: 'Cancel Subscription', case_type: 'subscription', sop_url: '#', description: 'Complete cancellation process for subscriptions' },
      { id: 'p11', scenario_name: 'Change Delivery Frequency', case_type: 'subscription', sop_url: '#', description: 'Modifying subscription frequency (weekly, monthly, etc.)' },
      { id: 'p12', scenario_name: 'Too Much Product - Reduce Shipment', case_type: 'subscription', sop_url: '#', description: 'Adjusting subscription for customers with excess product' },
      
      // Return SOPs
      { id: 'p13', scenario_name: 'Return for Refund', case_type: 'return', sop_url: '#', description: 'Full return process with refund' },
      { id: 'p14', scenario_name: 'Return for Exchange', case_type: 'return', sop_url: '#', description: 'Processing exchanges for different products/sizes' }
    ];
  },

  render() {
    const container = document.getElementById('sopList');
    if (!container) return;

    // Use placeholder SOPs if none exist
    const sopsToRender = this.sops.length > 0 ? this.sops : this.getPlaceholderSOPs();
    const isPlaceholder = this.sops.length === 0;
    
    // Filter by category if set
    const filteredSOPs = this.currentCategory 
      ? sopsToRender.filter(s => s.case_type === this.currentCategory)
      : sopsToRender;

    if (filteredSOPs.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <h3>No SOP Links Found</h3>
          <p>Add SOP links to help your team access procedures quickly.</p>
          ${HubAuth.isAdmin() ? '<button class="btn btn-primary" onclick="HubSOP.showAddModal()">Add First SOP</button>' : ''}
        </div>
      `;
      return;
    }

    // Group SOPs by case type
    const grouped = {};
    filteredSOPs.forEach(sop => {
      if (!grouped[sop.case_type]) grouped[sop.case_type] = [];
      grouped[sop.case_type].push(sop);
    });

    const categoryLabels = {
      'refund': { label: 'Refund Procedures', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8"/><path d="M12 18V6"/></svg>', color: '#ef4444' },
      'shipping': { label: 'Shipping & Delivery', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27,6.96 12,12.01 20.73,6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>', color: '#3b82f6' },
      'subscription': { label: 'Subscription Management', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>', color: '#8b5cf6' },
      'return': { label: 'Returns & Exchanges', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>', color: '#f59e0b' }
    };

    let html = '';
    
    if (isPlaceholder) {
      html += `
        <div class="sop-placeholder-banner">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span>These are placeholder SOPs. Click Edit to add your actual SOP links.</span>
        </div>
      `;
    }

    Object.entries(grouped).forEach(([caseType, sops]) => {
      const cat = categoryLabels[caseType] || { label: caseType, icon: '📋', color: '#6b7280' };
      html += `
        <div class="sop-category-section">
          <div class="sop-category-header">
            <span class="sop-category-icon">${cat.icon}</span>
            <span class="sop-category-title">${cat.label}</span>
            <span class="sop-category-count">${sops.length} SOPs</span>
          </div>
          <div class="sop-cards-grid">
            ${sops.map(sop => `
              <div class="sop-card ${isPlaceholder && sop.sop_url === '#' ? 'placeholder' : ''}">
                <div class="sop-card-header">
                  <h3 class="sop-card-title">${this.escapeHtml(sop.scenario_name)}</h3>
                </div>
                ${sop.description ? `<p class="sop-card-description">${this.escapeHtml(sop.description)}</p>` : ''}
                <div class="sop-card-actions">
                  ${sop.sop_url !== '#' ? `
                    <a href="${sop.sop_url}" target="_blank" class="sop-card-link" onclick="HubSOP.logClick('${sop.id}', '${this.escapeHtml(sop.scenario_name)}')">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                      Open SOP
                    </a>
                  ` : `
                    <span class="sop-card-link disabled">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                      Link Not Set
                    </span>
                  `}
                  ${HubAuth.isAdmin() && !isPlaceholder ? `
                    <button class="btn btn-secondary btn-sm" onclick="HubSOP.showEditModal(${sop.id})">Edit</button>
                    <button class="btn btn-secondary btn-sm" style="color: var(--error-600);" onclick="HubSOP.delete(${sop.id})">Delete</button>
                  ` : ''}
                  ${HubAuth.isAdmin() && isPlaceholder ? `
                    <button class="btn btn-primary btn-sm" onclick="HubSOP.createFromPlaceholder('${sop.scenario_name}', '${sop.case_type}', '${this.escapeHtml(sop.description || '')}')">
                      Add Link
                    </button>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  createFromPlaceholder(name, caseType, description) {
    // Pre-fill the add modal with placeholder data
    this.showAddModal();
    setTimeout(() => {
      document.getElementById('sopName').value = name;
      document.getElementById('sopCaseType').value = caseType;
      document.getElementById('sopDescription').value = description;
      document.getElementById('sopUrl').focus();
    }, 100);
  },

  filterByCategory(category) {
    this.currentCategory = category;
    
    // Update tab states
    document.querySelectorAll('.sop-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.category === category);
    });
    
    this.load();
  },

  async logClick(sopId, sopName) {
    // Log activity if there's a current case
    if (HubState.currentCase) {
      try {
        await HubAPI.post('/hub/api/activity', {
          case_id: HubState.currentCase.case_id,
          activity_type: 'clicked_sop',
          details: { sop_id: sopId, sop_name: sopName }
        });
      } catch (e) {
        // Silent fail for activity logging
      }
    }
  },

  showAddModal() {
    const html = `
      <div class="modal-overlay active" id="sopModal">
        <div class="modal" style="max-width: 500px;">
          <div class="modal-header">
            <h2 class="modal-title">Add SOP Link</h2>
            <button class="modal-close" onclick="document.getElementById('sopModal').remove()">&times;</button>
          </div>
          <div class="modal-body" style="padding: 24px;">
            <div class="form-group">
              <label>Scenario Key *</label>
              <input type="text" id="sopKey" placeholder="e.g., refund_partial_20">
            </div>
            <div class="form-group">
              <label>Scenario Name *</label>
              <input type="text" id="sopName" placeholder="e.g., Partial Refund 20%">
            </div>
            <div class="form-group">
              <label>Category *</label>
              <select id="sopCategory">
                <option value="refund">Refund</option>
                <option value="return">Return</option>
                <option value="shipping">Shipping</option>
                <option value="subscription">Subscription</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div class="form-group">
              <label>SOP URL *</label>
              <input type="url" id="sopUrl" placeholder="https://...">
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea id="sopDescription" rows="3" placeholder="Brief description..."></textarea>
            </div>
          </div>
          <div class="modal-footer" style="padding: 16px 24px; border-top: 1px solid var(--gray-200); display: flex; justify-content: flex-end; gap: 12px;">
            <button class="btn btn-secondary" onclick="document.getElementById('sopModal').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="HubSOP.save()">Save</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  async showEditModal(sopId) {
    const sop = this.sops.find(s => s.id === sopId);
    if (!sop) return;

    const html = `
      <div class="modal-overlay active" id="sopModal">
        <div class="modal" style="max-width: 500px;">
          <div class="modal-header">
            <h2 class="modal-title">Edit SOP Link</h2>
            <button class="modal-close" onclick="document.getElementById('sopModal').remove()">&times;</button>
          </div>
          <div class="modal-body" style="padding: 24px;">
            <input type="hidden" id="sopEditId" value="${sop.id}">
            <div class="form-group">
              <label>Scenario Name *</label>
              <input type="text" id="sopName" value="${this.escapeHtml(sop.scenario_name)}">
            </div>
            <div class="form-group">
              <label>Category *</label>
              <select id="sopCategory">
                ${['refund', 'return', 'shipping', 'subscription', 'manual'].map(c =>
                  `<option value="${c}" ${sop.case_type === c ? 'selected' : ''}>${c.charAt(0).toUpperCase() + c.slice(1)}</option>`
                ).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>SOP URL *</label>
              <input type="url" id="sopUrl" value="${this.escapeHtml(sop.sop_url)}">
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea id="sopDescription" rows="3">${this.escapeHtml(sop.description || '')}</textarea>
            </div>
          </div>
          <div class="modal-footer" style="padding: 16px 24px; border-top: 1px solid var(--gray-200); display: flex; justify-content: flex-end; gap: 12px;">
            <button class="btn btn-secondary" onclick="document.getElementById('sopModal').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="HubSOP.update()">Save Changes</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  async save() {
    const data = {
      scenario_key: document.getElementById('sopKey')?.value.trim(),
      scenario_name: document.getElementById('sopName')?.value.trim(),
      case_type: document.getElementById('sopCategory')?.value,
      sop_url: document.getElementById('sopUrl')?.value.trim(),
      description: document.getElementById('sopDescription')?.value.trim()
    };

    if (!data.scenario_key || !data.scenario_name || !data.sop_url) {
      HubUI.showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      const result = await HubAPI.post('/hub/api/sop', data);
      if (result.success) {
        HubUI.showToast('SOP link added successfully', 'success');
        document.getElementById('sopModal')?.remove();
        this.load();
      } else {
        HubUI.showToast(result.error || 'Failed to add SOP', 'error');
      }
    } catch (e) {
      HubUI.showToast('Failed to add SOP', 'error');
    }
  },

  async update() {
    const sopId = document.getElementById('sopEditId')?.value;
    const data = {
      scenario_name: document.getElementById('sopName')?.value.trim(),
      case_type: document.getElementById('sopCategory')?.value,
      sop_url: document.getElementById('sopUrl')?.value.trim(),
      description: document.getElementById('sopDescription')?.value.trim()
    };

    if (!data.scenario_name || !data.sop_url) {
      HubUI.showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      const result = await HubAPI.put(`/hub/api/sop/${sopId}`, data);
      if (result.success) {
        HubUI.showToast('SOP link updated successfully', 'success');
        document.getElementById('sopModal')?.remove();
        this.load();
      } else {
        HubUI.showToast(result.error || 'Failed to update SOP', 'error');
      }
    } catch (e) {
      HubUI.showToast('Failed to update SOP', 'error');
    }
  },

  async delete(sopId) {
    if (!confirm('Are you sure you want to delete this SOP link?')) return;

    try {
      const result = await HubAPI.delete(`/hub/api/sop/${sopId}`);
      if (result.success) {
        HubUI.showToast('SOP link deleted', 'success');
        this.load();
      } else {
        HubUI.showToast(result.error || 'Failed to delete SOP', 'error');
      }
    } catch (e) {
      HubUI.showToast('Failed to delete SOP', 'error');
    }
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// ============================================
// EMAIL TEMPLATES PAGE
// ============================================
const HubEmailTemplates = {
  templates: [],
  currentCategory: '',

  async load() {
    HubUI.showLoading();
    try {
      const url = this.currentCategory 
        ? `/hub/api/email-templates?category=${this.currentCategory}` 
        : '/hub/api/email-templates';
      const result = await HubAPI.get(url);
      this.templates = result.templates || [];
      this.render();
      
      // Show add button for admins
      const addBtn = document.getElementById('addTemplateBtn');
      if (addBtn) {
        addBtn.style.display = HubAuth.isAdmin() ? 'inline-flex' : 'none';
      }
    } catch (e) {
      console.error('Failed to load email templates:', e);
      HubUI.showToast('Failed to load email templates', 'error');
    } finally {
      HubUI.hideLoading();
    }
  },

  getPlaceholderTemplates() {
    return [
      // Refund Templates
      {
        id: 'pt1',
        template_name: 'Full Refund Confirmation',
        category: 'refund',
        subject: 'Your Refund Has Been Processed - Order {{order_number}}',
        body: `Hi {{customer_name}},

Great news! Your refund of {{refund_amount}} has been processed for order {{order_number}}.

Please allow 5-10 business days for the refund to appear in your account, depending on your bank.

If you have any questions, feel free to reply to this email.

Thank you for your patience!

Best regards,
The PuppyPad Team`,
        variables: ['customer_name', 'order_number', 'refund_amount']
      },
      {
        id: 'pt2',
        template_name: 'Partial Refund - Quality Issue',
        category: 'refund',
        subject: 'Partial Refund Processed - Order {{order_number}}',
        body: `Hi {{customer_name}},

We're sorry to hear about the quality issue you experienced with your order.

We've processed a partial refund of {{refund_amount}} for order {{order_number}} as a gesture of goodwill.

The refund should appear in your account within 5-10 business days.

We truly appreciate your feedback as it helps us improve our products!

Best regards,
The PuppyPad Team`,
        variables: ['customer_name', 'order_number', 'refund_amount']
      },
      {
        id: 'pt3',
        template_name: 'Partial Refund - Dog Not Using',
        category: 'refund',
        subject: 'We Understand - Partial Refund for Order {{order_number}}',
        body: `Hi {{customer_name}},

We understand that every pup is different, and sometimes it takes time for them to adjust to new products.

As discussed, we've processed a partial refund of {{refund_amount}} for your order {{order_number}}.

Here are some tips that might help:
- Place the PuppyPad in a familiar spot
- Use positive reinforcement when your dog shows interest
- Give it a few more days for them to get comfortable

If you have any questions, we're here to help!

Best regards,
The PuppyPad Team`,
        variables: ['customer_name', 'order_number', 'refund_amount']
      },
      
      // Shipping Templates
      {
        id: 'pt4',
        template_name: 'Reship Confirmation',
        category: 'shipping',
        subject: 'Your Replacement Order is On the Way! - Order {{order_number}}',
        body: `Hi {{customer_name}},

Good news! We've shipped a replacement for your order {{order_number}}.

You should receive tracking information within 24-48 hours once the shipment is processed by our carrier.

We sincerely apologize for any inconvenience and appreciate your patience!

Best regards,
The PuppyPad Team`,
        variables: ['customer_name', 'order_number']
      },
      {
        id: 'pt5',
        template_name: 'Missing Item - Investigation',
        category: 'shipping',
        subject: 'Update on Your Missing Item - Order {{order_number}}',
        body: `Hi {{customer_name}},

We're currently investigating the missing item from your order {{order_number}}.

Our team is working with the carrier to locate your package. We'll provide an update within 48 hours with either tracking information or a replacement shipment.

Thank you for your patience!

Best regards,
The PuppyPad Team`,
        variables: ['customer_name', 'order_number']
      },
      
      // Subscription Templates
      {
        id: 'pt6',
        template_name: 'Subscription Paused',
        category: 'subscription',
        subject: 'Your PuppyPad Subscription Has Been Paused',
        body: `Hi {{customer_name}},

As requested, we've paused your PuppyPad subscription.

Your subscription will remain paused until you're ready to resume. You can reactivate it anytime by:
- Logging into your account at puppypad.com
- Replying to this email
- Contacting our support team

We'll be here when you're ready to continue!

Best regards,
The PuppyPad Team`,
        variables: ['customer_name']
      },
      {
        id: 'pt7',
        template_name: 'Subscription Cancelled',
        category: 'subscription',
        subject: 'Your PuppyPad Subscription Has Been Cancelled',
        body: `Hi {{customer_name}},

Your PuppyPad subscription has been cancelled as requested.

We're sorry to see you go! If there's anything we could have done better, we'd love to hear your feedback.

You're always welcome back - just visit puppypad.com to restart your subscription anytime.

Thank you for being a PuppyPad customer!

Best regards,
The PuppyPad Team`,
        variables: ['customer_name']
      },
      {
        id: 'pt8',
        template_name: 'Subscription Frequency Changed',
        category: 'subscription',
        subject: 'Your Subscription Has Been Updated',
        body: `Hi {{customer_name}},

We've updated your subscription delivery frequency as requested.

Your new delivery schedule: {{resolution}}

Your next shipment will be scheduled according to this new frequency.

If you need any further adjustments, just let us know!

Best regards,
The PuppyPad Team`,
        variables: ['customer_name', 'resolution']
      },
      
      // Return Templates
      {
        id: 'pt9',
        template_name: 'Return Instructions',
        category: 'return',
        subject: 'Return Instructions - Order {{order_number}}',
        body: `Hi {{customer_name}},

Your return request for order {{order_number}} has been approved!

Please ship the items back to:
PuppyPad Returns
[Your Return Address Here]

Important notes:
- Please include your order number inside the package
- Use a trackable shipping method
- Items must be returned within 14 days

Once we receive and process your return, your refund of {{refund_amount}} will be issued within 5-7 business days.

Thank you!

Best regards,
The PuppyPad Team`,
        variables: ['customer_name', 'order_number', 'refund_amount']
      }
    ];
  },

  render() {
    const container = document.getElementById('emailTemplatesList');
    if (!container) return;

    // Use placeholder templates if none exist
    const templatesToRender = this.templates.length > 0 ? this.templates : this.getPlaceholderTemplates();
    const isPlaceholder = this.templates.length === 0;

    // Filter by category if set
    const filteredTemplates = this.currentCategory 
      ? templatesToRender.filter(t => t.category === this.currentCategory)
      : templatesToRender;

    if (filteredTemplates.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          <h3>No Email Templates Found</h3>
          <p>Add email templates to help your team respond quickly.</p>
          ${HubAuth.isAdmin() ? '<button class="btn btn-primary" onclick="HubEmailTemplates.showAddModal()">Add First Template</button>' : ''}
        </div>
      `;
      return;
    }

    // Group templates by category
    const grouped = {};
    filteredTemplates.forEach(template => {
      if (!grouped[template.category]) grouped[template.category] = [];
      grouped[template.category].push(template);
    });

    const categoryLabels = {
      'refund': { label: 'Refund Confirmations', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8"/><path d="M12 18V6"/></svg>', color: '#ef4444' },
      'shipping': { label: 'Shipping & Delivery', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27,6.96 12,12.01 20.73,6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>', color: '#3b82f6' },
      'subscription': { label: 'Subscription Updates', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>', color: '#8b5cf6' },
      'return': { label: 'Returns & Exchanges', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>', color: '#f59e0b' }
    };

    let html = '';
    
    if (isPlaceholder) {
      html += `
        <div class="sop-placeholder-banner">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span>These are placeholder templates with dynamic variables. Edit to customize for your brand.</span>
        </div>
      `;
    }

    Object.entries(grouped).forEach(([category, templates]) => {
      const cat = categoryLabels[category] || { label: category, icon: '📋', color: '#6b7280' };
      html += `
        <div class="template-category-section">
          <div class="sop-category-header">
            <span class="sop-category-icon">${cat.icon}</span>
            <span class="sop-category-title">${cat.label}</span>
            <span class="sop-category-count">${templates.length} templates</span>
          </div>
          <div class="template-cards-grid">
            ${templates.map(template => `
              <div class="template-card ${isPlaceholder ? 'placeholder' : ''}">
                <div class="template-card-header">
                  <h3 class="template-card-title">${this.escapeHtml(template.template_name)}</h3>
                </div>
                <div class="template-card-preview">${this.escapeHtml(template.body.substring(0, 150))}...</div>
                <div class="template-card-variables">
                  <span class="variables-label">Variables:</span>
                  ${(template.variables || []).map(v => `<span class="template-variable">{{${v}}}</span>`).join('')}
                </div>
                <div class="template-card-actions">
                  <button class="btn btn-primary btn-sm" onclick="HubEmailTemplates.${isPlaceholder ? 'copyPlaceholder' : 'copyToClipboard'}('${template.id}')">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                    Copy
                  </button>
                  <button class="btn btn-secondary btn-sm" onclick="HubEmailTemplates.${isPlaceholder ? 'previewPlaceholder' : 'preview'}('${template.id}')">Preview</button>
                  ${HubAuth.isAdmin() && !isPlaceholder ? `
                    <button class="btn btn-secondary btn-sm" onclick="HubEmailTemplates.showEditModal(${template.id})">Edit</button>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  copyPlaceholder(templateId) {
    const templates = this.getPlaceholderTemplates();
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    navigator.clipboard.writeText(template.body).then(() => {
      HubUI.showToast('Template copied! Variables will need to be replaced manually.', 'success');
    }).catch(() => {
      HubUI.showToast('Failed to copy template', 'error');
    });
  },

  async previewPlaceholder(templateId) {
    const templates = this.getPlaceholderTemplates();
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    // Fetch cases for this template's category
    let relatedCases = [];
    try {
      const response = await HubAPI.get('/hub/api/cases/by-category?category=' + encodeURIComponent(template.category) + '&limit=15');
      relatedCases = response.cases || [];
    } catch (e) {
      console.warn('Could not load related cases:', e);
    }

    const casesDropdownOptions = relatedCases.length > 0 
      ? relatedCases.map(c => `<option value="${c.case_id}">${c.customer_name || 'Unknown'} - ${c.order_number || 'N/A'} (${c.status})</option>`).join('')
      : '<option value="">No cases available for this category</option>';

    const html = `
      <div class="modal-overlay active" id="templatePreviewModal">
        <div class="modal email-template-modal" style="max-width: 700px;">
          <div class="modal-header">
            <h2 class="modal-title">${this.escapeHtml(template.template_name)}</h2>
            <button class="modal-close" onclick="document.getElementById('templatePreviewModal').remove()">&times;</button>
          </div>
          <div class="modal-body" style="padding: 24px;">
            <!-- Template Preview Section -->
            <div class="template-preview-section">
              <div id="previewBody" class="template-preview-content" style="padding: 20px; background: var(--gray-50); border-radius: 8px; white-space: pre-wrap; font-size: 14px; line-height: 1.7; max-height: 350px; overflow-y: auto;">
${this.escapeHtml(template.body)}
              </div>
            </div>
            
            <!-- Variables Info -->
            <div style="margin-top: 16px; padding: 12px; background: var(--primary-50); border-radius: 8px; border: 1px solid var(--primary-200);">
              <strong style="color: var(--primary-700); font-size: 13px;">Dynamic Variables:</strong>
              <div class="template-variables-list" style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
                ${(template.variables || []).map(v => `<span class="template-variable-badge">{{${v}}}</span>`).join('')}
              </div>
            </div>

            <!-- Live Preview Section -->
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--gray-200);">
              <strong style="color: var(--gray-700); font-size: 14px;">📋 Live Preview with Real Case Data</strong>
              <p style="font-size: 12px; color: var(--gray-500); margin-top: 4px; margin-bottom: 12px;">
                Select a case below to see how the email would look with actual customer data.
              </p>
              <select id="livePreviewCaseSelect" class="case-selector-dropdown" onchange="HubEmailTemplates.updateLivePreview('${template.id}', this.value)" style="width: 100%; padding: 10px 12px; border: 1px solid var(--gray-300); border-radius: 8px; font-size: 14px; background: white;">
                <option value="">-- Select a case for live preview --</option>
                ${casesDropdownOptions}
              </select>
            </div>
          </div>
          <div class="modal-footer" style="padding: 16px 24px; border-top: 1px solid var(--gray-200); display: flex; justify-content: space-between; align-items: center;">
            <span id="previewStatus" style="font-size: 12px; color: var(--gray-500);">Showing template with variables</span>
            <button class="btn btn-primary" onclick="HubEmailTemplates.copyTemplateBody('${template.id}'); document.getElementById('templatePreviewModal').remove();">Copy Template</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    
    // Store selected case data for copy function
    this.currentPreviewCaseData = null;
  },

  copyTemplateBody(templateId) {
    const templates = this.getPlaceholderTemplates();
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    let textToCopy = template.body;
    
    // If we have case data loaded, use the rendered version
    if (this.currentPreviewCaseData) {
      textToCopy = this.renderTemplateWithCase(template.body, this.currentPreviewCaseData);
    }
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      HubUI.showToast('Email template copied!', 'success');
    }).catch(() => {
      HubUI.showToast('Failed to copy template', 'error');
    });
  },

  renderTemplateWithCase(body, caseData) {
    // Use first name only for more personal greeting
    const firstName = (caseData.customer_name || 'Valued Customer').split(' ')[0];
    const replacements = {
      'customer_name': firstName,
      'customer_first_name': firstName,
      'order_number': caseData.order_number || 'N/A',
      'refund_amount': caseData.refund_amount ? '$' + parseFloat(caseData.refund_amount).toFixed(2) : '$0.00',
      'resolution': caseData.resolution || 'your request',
      'case_id': caseData.case_id || '',
      'case_type': caseData.case_type || '',
      'tracking_number': caseData.tracking_number || 'N/A',
      'new_tracking_number': caseData.new_tracking_number || 'N/A',
      'discount_code': caseData.discount_code || 'PUPPYPAD10',
      'discount_amount': caseData.discount_amount || '10%',
      'pause_date': caseData.pause_date || 'your requested date',
      'resume_date': caseData.resume_date || 'when you\'re ready'
    };

    let rendered = body;
    Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp('\\{\\{' + key + '\\}\\}', 'g');
      rendered = rendered.replace(regex, value);
    });
    return rendered;
  },

  async updateLivePreview(templateId, caseId) {
    const templates = this.getPlaceholderTemplates();
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const previewBody = document.getElementById('previewBody');
    const previewStatus = document.getElementById('previewStatus');

    if (!caseId) {
      // Reset to template with variables
      previewBody.innerHTML = this.escapeHtml(template.body);
      previewStatus.textContent = 'Showing template with variables';
      previewStatus.style.color = 'var(--gray-500)';
      this.currentPreviewCaseData = null;
      return;
    }

    previewStatus.textContent = 'Loading case data...';
    previewStatus.style.color = 'var(--primary-600)';

    try {
      // Fetch case data
      const response = await HubAPI.get('/hub/api/case/' + caseId);
      
      // Handle both direct response and nested response
      const caseData = response.case || response;
      
      // Store for copy function
      this.currentPreviewCaseData = caseData;
      
      // Render the template
      const renderedBody = this.renderTemplateWithCase(template.body, caseData);

      previewBody.innerHTML = this.escapeHtml(renderedBody);
      previewStatus.innerHTML = '✓ Showing live preview for <strong>' + this.escapeHtml(caseData.customer_name || 'Unknown') + '</strong>';
      previewStatus.style.color = 'var(--success-600)';
    } catch (e) {
      console.error('Failed to load case data:', e);
      previewStatus.textContent = 'Failed to load case data';
      previewStatus.style.color = 'var(--error-600)';
      this.currentPreviewCaseData = null;
    }
  },

  filterByCategory(category) {
    this.currentCategory = category;
    
    // Update tab states
    document.querySelectorAll('.template-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.category === category);
    });
    
    this.load();
  },

  async copyToClipboard(templateId) {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) return;

    const textToCopy = `Subject: ${template.subject}\n\n${template.body}`;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      HubUI.showToast('Template copied to clipboard', 'success');
    } catch (e) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      HubUI.showToast('Template copied to clipboard', 'success');
    }
  },

  preview(templateId) {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) return;

    const html = `
      <div class="modal-overlay active" id="templatePreviewModal">
        <div class="modal" style="max-width: 600px;">
          <div class="modal-header">
            <h2 class="modal-title">${this.escapeHtml(template.template_name)}</h2>
            <button class="modal-close" onclick="document.getElementById('templatePreviewModal').remove()">&times;</button>
          </div>
          <div class="modal-body" style="padding: 24px;">
            <div style="margin-bottom: 16px;">
              <strong style="color: var(--gray-600);">Subject:</strong>
              <div style="padding: 12px; background: var(--gray-50); border-radius: 8px; margin-top: 8px;">
                ${this.escapeHtml(template.subject)}
              </div>
            </div>
            <div>
              <strong style="color: var(--gray-600);">Body:</strong>
              <div style="padding: 16px; background: var(--gray-50); border-radius: 8px; margin-top: 8px; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">
${this.escapeHtml(template.body)}
              </div>
            </div>
            <div style="margin-top: 16px;">
              <strong style="color: var(--gray-600);">Variables:</strong>
              <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
                ${(template.variables || []).map(v => `<span class="template-variable">{{${v}}}</span>`).join('')}
              </div>
            </div>
          </div>
          <div class="modal-footer" style="padding: 16px 24px; border-top: 1px solid var(--gray-200); display: flex; justify-content: flex-end;">
            <button class="btn btn-primary" onclick="HubEmailTemplates.copyToClipboard(${template.id}); document.getElementById('templatePreviewModal').remove();">Copy Template</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  showAddModal() {
    const html = `
      <div class="modal-overlay active" id="templateModal">
        <div class="modal" style="max-width: 600px;">
          <div class="modal-header">
            <h2 class="modal-title">Add Email Template</h2>
            <button class="modal-close" onclick="document.getElementById('templateModal').remove()">&times;</button>
          </div>
          <div class="modal-body" style="padding: 24px; max-height: 70vh; overflow-y: auto;">
            <div class="form-group">
              <label>Template Key *</label>
              <input type="text" id="templateKey" placeholder="e.g., refund_confirmation">
            </div>
            <div class="form-group">
              <label>Template Name *</label>
              <input type="text" id="templateName" placeholder="e.g., Refund Confirmation">
            </div>
            <div class="form-group">
              <label>Category *</label>
              <select id="templateCategory">
                <option value="refund">Refund</option>
                <option value="return">Return</option>
                <option value="shipping">Shipping</option>
                <option value="subscription">Subscription</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div class="form-group">
              <label>Subject *</label>
              <input type="text" id="templateSubject" placeholder="Use {{variables}} for dynamic content">
            </div>
            <div class="form-group">
              <label>Body *</label>
              <textarea id="templateBody" rows="10" placeholder="Use {{variables}} like {{first_name}}, {{order_number}}, {{refund_amount}}"></textarea>
            </div>
            <div class="form-group">
              <label>Description</label>
              <input type="text" id="templateDescription" placeholder="When to use this template">
            </div>
          </div>
          <div class="modal-footer" style="padding: 16px 24px; border-top: 1px solid var(--gray-200); display: flex; justify-content: flex-end; gap: 12px;">
            <button class="btn btn-secondary" onclick="document.getElementById('templateModal').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="HubEmailTemplates.save()">Save</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  async showEditModal(templateId) {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) return;

    const html = `
      <div class="modal-overlay active" id="templateModal">
        <div class="modal" style="max-width: 600px;">
          <div class="modal-header">
            <h2 class="modal-title">Edit Email Template</h2>
            <button class="modal-close" onclick="document.getElementById('templateModal').remove()">&times;</button>
          </div>
          <div class="modal-body" style="padding: 24px; max-height: 70vh; overflow-y: auto;">
            <input type="hidden" id="templateEditId" value="${template.id}">
            <div class="form-group">
              <label>Template Name *</label>
              <input type="text" id="templateName" value="${this.escapeHtml(template.template_name)}">
            </div>
            <div class="form-group">
              <label>Category *</label>
              <select id="templateCategory">
                ${['refund', 'return', 'shipping', 'subscription', 'manual'].map(c =>
                  `<option value="${c}" ${template.category === c ? 'selected' : ''}>${c.charAt(0).toUpperCase() + c.slice(1)}</option>`
                ).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Subject *</label>
              <input type="text" id="templateSubject" value="${this.escapeHtml(template.subject)}">
            </div>
            <div class="form-group">
              <label>Body *</label>
              <textarea id="templateBody" rows="10">${this.escapeHtml(template.body)}</textarea>
            </div>
            <div class="form-group">
              <label>Description</label>
              <input type="text" id="templateDescription" value="${this.escapeHtml(template.description || '')}">
            </div>
          </div>
          <div class="modal-footer" style="padding: 16px 24px; border-top: 1px solid var(--gray-200); display: flex; justify-content: flex-end; gap: 12px;">
            <button class="btn btn-secondary" onclick="document.getElementById('templateModal').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="HubEmailTemplates.update()">Save Changes</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  extractVariables(text) {
    const matches = text.match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
  },

  async save() {
    const body = document.getElementById('templateBody')?.value.trim() || '';
    const subject = document.getElementById('templateSubject')?.value.trim() || '';
    const variables = [...new Set([...this.extractVariables(subject), ...this.extractVariables(body)])];

    const data = {
      template_key: document.getElementById('templateKey')?.value.trim(),
      template_name: document.getElementById('templateName')?.value.trim(),
      category: document.getElementById('templateCategory')?.value,
      subject,
      body,
      variables,
      description: document.getElementById('templateDescription')?.value.trim()
    };

    if (!data.template_key || !data.template_name || !data.subject || !data.body) {
      HubUI.showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      const result = await HubAPI.post('/hub/api/email-templates', data);
      if (result.success) {
        HubUI.showToast('Email template added successfully', 'success');
        document.getElementById('templateModal')?.remove();
        this.load();
      } else {
        HubUI.showToast(result.error || 'Failed to add template', 'error');
      }
    } catch (e) {
      HubUI.showToast('Failed to add template', 'error');
    }
  },

  async update() {
    const templateId = document.getElementById('templateEditId')?.value;
    const body = document.getElementById('templateBody')?.value.trim() || '';
    const subject = document.getElementById('templateSubject')?.value.trim() || '';
    const variables = [...new Set([...this.extractVariables(subject), ...this.extractVariables(body)])];

    const data = {
      template_name: document.getElementById('templateName')?.value.trim(),
      category: document.getElementById('templateCategory')?.value,
      subject,
      body,
      variables,
      description: document.getElementById('templateDescription')?.value.trim()
    };

    if (!data.template_name || !data.subject || !data.body) {
      HubUI.showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      const result = await HubAPI.put(`/hub/api/email-templates/${templateId}`, data);
      if (result.success) {
        HubUI.showToast('Email template updated successfully', 'success');
        document.getElementById('templateModal')?.remove();
        this.load();
      } else {
        HubUI.showToast(result.error || 'Failed to update template', 'error');
      }
    } catch (e) {
      HubUI.showToast('Failed to update template', 'error');
    }
  },

  async delete(templateId) {
    if (!confirm('Are you sure you want to delete this email template?')) return;

    try {
      const result = await HubAPI.delete(`/hub/api/email-templates/${templateId}`);
      if (result.success) {
        HubUI.showToast('Email template deleted', 'success');
        this.load();
      } else {
        HubUI.showToast(result.error || 'Failed to delete template', 'error');
      }
    } catch (e) {
      HubUI.showToast('Failed to delete template', 'error');
    }
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// ============================================
// CASE DETAIL PAGE (Full Page View)
// ============================================
const HubCaseDetail = {
  caseData: null,
  activities: [],
  comments: [],
  sopLink: null,
  emailTemplates: [],
  shopifyOrder: null,

  async load(caseId) {
    if (!caseId) {
      HubNavigation.goto('cases');
      return;
    }

    HubUI.showLoading();
    try {
      const result = await HubAPI.get(`/hub/api/case/${caseId}`);
      if (!result.case) {
        HubUI.showToast('Case not found', 'error');
        HubNavigation.goto('cases');
        return;
      }

      this.caseData = result.case;
      this.activities = result.activities || [];
      this.comments = result.comments || [];
      this.sopLink = result.sop_link;
      this.emailTemplates = result.email_templates || [];
      this.shopifyOrder = result.shopify_order;

      // Store in HubState for keyboard shortcuts etc
      HubState.currentCase = this.caseData;

      this.render();
    } catch (e) {
      console.error('Failed to load case:', e);
      HubUI.showToast('Failed to load case details', 'error');
    } finally {
      HubUI.hideLoading();
    }
  },

  render() {
    const container = document.getElementById('caseDetailContent');
    if (!container || !this.caseData) return;

    const c = this.caseData;
    const dueDate = c.due_date ? new Date(c.due_date) : null;
    const isOverdue = c.is_overdue;
    const hoursLeft = dueDate ? Math.max(0, Math.round((dueDate - new Date()) / (1000 * 60 * 60))) : null;

    // Get prev/next case info
    const currentIndex = HubState.currentCaseIndex;
    const prevCase = currentIndex > 0 ? HubState.cases[currentIndex - 1] : null;
    const nextCase = currentIndex < HubState.cases.length - 1 ? HubState.cases[currentIndex + 1] : null;

    container.innerHTML = `
      <!-- Case Navigation -->
      <div class="case-nav-buttons">
        <button class="case-nav-btn" onclick="HubNavigation.goto('cases')">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Cases
        </button>
        <span class="case-nav-divider"></span>
        <button class="case-nav-btn" onclick="HubCases.navigateCase('prev')" ${!prevCase ? 'disabled' : ''}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
          Previous
        </button>
        <button class="case-nav-btn" onclick="HubCases.navigateCase('next')" ${!nextCase ? 'disabled' : ''}>
          Next
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>

      <!-- Case Header - Customer Name as Title -->
      <div class="case-detail-header">
        <div class="case-detail-title">
          <div class="case-detail-customer-name">
            ${HubHelpers.formatName(c.customer_name)}
            <span class="status-badge ${(c.status || 'pending').replace('_', '-')}">${this.formatStatus(c.status)}</span>
            <span class="type-badge ${c.case_type}">${c.case_type}</span>
          </div>
          <div class="case-detail-email-row">
            <a href="mailto:${c.customer_email}">${this.escapeHtml(c.customer_email || '-')}</a>
            <button class="copy-btn" onclick="HubCaseDetail.copyToClipboard('${this.escapeHtml(c.customer_email || '')}', this)" title="Copy email">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </button>
          </div>
          <div class="case-detail-id-row">
            <span>Case ID: ${this.escapeHtml(c.case_id)}</span>
            <button class="copy-btn" onclick="HubCaseDetail.copyToClipboard('${this.escapeHtml(c.case_id)}', this)" title="Copy case ID">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </button>
          </div>
        </div>
        <div class="case-detail-due ${isOverdue ? 'overdue' : hoursLeft < 8 ? 'warning' : 'ok'}">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          ${isOverdue ? 'Overdue' : hoursLeft !== null ? hoursLeft + 'h left' : 'No due date'}
        </div>
      </div>

      <!-- Main Grid -->
      <div class="case-detail-grid">
        <!-- Left Column - Main Info -->
        <div class="case-detail-main">
          <!-- Order Details -->
          <div class="case-detail-section">
            <div class="case-detail-section-header">Order Details</div>
            <div class="case-detail-section-content">
              <div class="case-info-row">
                <div class="case-info-label">Order Number</div>
                <div class="case-info-value">
                  ${c.order_url ? `<a href="${c.order_url}" target="_blank">${this.escapeHtml(c.order_number || '-')}</a>` : this.escapeHtml(c.order_number || '-')}
                </div>
              </div>
              <div class="case-info-row">
                <div class="case-info-label">Order Date</div>
                <div class="case-info-value">${c.order_date ? this.formatDate(c.order_date) : '-'}</div>
              </div>
              ${this.shopifyOrder ? `
              <div class="case-info-row">
                <div class="case-info-label">Financial Status</div>
                <div class="case-info-value">${this.escapeHtml(this.shopifyOrder.financial_status || '-')}</div>
              </div>
              <div class="case-info-row">
                <div class="case-info-label">Fulfillment</div>
                <div class="case-info-value">${this.escapeHtml(this.shopifyOrder.fulfillment_status || 'Unfulfilled')}</div>
              </div>
              ` : ''}
              ${c.tracking_number ? `
              <div class="case-info-row">
                <div class="case-info-label">Tracking</div>
                <div class="case-info-value">${this.escapeHtml(c.tracking_number)}</div>
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Issue & Resolution -->
          <div class="case-detail-section">
            <div class="case-detail-section-header">Issue & Resolution</div>
            <div class="case-detail-section-content">
              <div class="case-info-row">
                <div class="case-info-label">Issue Reason</div>
                <div class="case-info-value">${this.formatIssueReason(c)}</div>
              </div>
              <div class="case-info-row">
                <div class="case-info-label">Case Type</div>
                <div class="case-info-value"><span class="type-badge ${c.case_type}">${c.case_type}</span></div>
              </div>
              <div class="case-info-row">
                <div class="case-info-label">Resolution</div>
                <div class="case-info-value">${this.formatResolution(c.resolution)}</div>
              </div>
              ${c.refund_amount ? `
              <div class="case-info-row">
                <div class="case-info-label">Refund Amount</div>
                <div class="case-info-value" style="font-weight: 600; color: var(--success-600);">$${parseFloat(c.refund_amount).toFixed(2)}</div>
              </div>
              ` : ''}
              ${c.selected_items && c.selected_items.length > 0 ? `
              <div style="margin-top: 16px;">
                <div class="case-info-label" style="margin-bottom: 8px;">Selected Items</div>
                <div class="selected-items-list">
                  ${c.selected_items.map(item => `
                    <div class="selected-item">
                      <span class="selected-item-name">${this.escapeHtml(item.title || item.name || 'Unknown Item')}</span>
                      <span class="selected-item-qty">x${item.quantity || 1}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Activity & Comments -->
          <div class="case-detail-section activity-section">
            <div class="case-detail-section-header">
              <span>Activity & Comments</span>
              <span class="activity-count">${(this.activities.length + this.comments.length)} items</span>
            </div>
            <div class="case-detail-section-content">
              <div class="activity-feed-redesigned">
                ${this.renderActivitiesRedesigned()}
              </div>
              <form class="comment-form-redesigned" onsubmit="HubCaseDetail.addComment(event)">
                <div class="comment-input-container">
                  <div class="comment-avatar">
                    <span>${(HubState.currentUser?.name || 'T').charAt(0).toUpperCase()}</span>
                  </div>
                  <textarea id="newCommentText" placeholder="Write a comment..." rows="2"></textarea>
                </div>
                <div class="comment-form-actions">
                  <button type="submit" class="btn btn-primary">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                    Post Comment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Right Column - Quick Actions -->
        <div class="case-detail-sidebar">
          <!-- Status Update -->
          <div class="case-detail-section">
            <div class="case-detail-section-header">Status</div>
            <div class="case-detail-section-content">
              <div class="status-radio-group">
                <label class="status-radio-item ${c.status === 'pending' ? 'selected' : ''}" data-status="pending" onclick="HubCaseDetail.selectStatus('pending', this)">
                  <input type="radio" name="caseStatus" value="pending" ${c.status === 'pending' ? 'checked' : ''}>
                  <span class="status-radio-check"></span>
                  <span class="status-radio-label">Pending</span>
                </label>
                <label class="status-radio-item ${c.status === 'in_progress' ? 'selected' : ''}" data-status="in_progress" onclick="HubCaseDetail.selectStatus('in_progress', this)">
                  <input type="radio" name="caseStatus" value="in_progress" ${c.status === 'in_progress' ? 'checked' : ''}>
                  <span class="status-radio-check"></span>
                  <span class="status-radio-label">In Progress</span>
                </label>
                <label class="status-radio-item ${c.status === 'completed' ? 'selected' : ''}" data-status="completed" onclick="HubCaseDetail.selectStatus('completed', this)">
                  <input type="radio" name="caseStatus" value="completed" ${c.status === 'completed' ? 'checked' : ''}>
                  <span class="status-radio-check"></span>
                  <span class="status-radio-label">Completed</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="case-detail-section">
            <div class="case-detail-section-header">Quick Actions</div>
            <div class="case-detail-section-content">
              <div class="quick-actions-grid">
                ${c.order_url ? `
                <a href="${c.order_url}" target="_blank" class="quick-action-btn" onclick="HubCaseDetail.logActivity('viewed_shopify_order')">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                  View Shopify Order
                </a>
                ` : ''}
                
                ${c.session_replay_url ? `
                <a href="${c.session_replay_url}" target="_blank" class="quick-action-btn" onclick="HubCaseDetail.logActivity('viewed_session_recording')">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  View Session Recording
                </a>
                ` : ''}
                
                ${c.checkout_champ_url ? `
                <a href="${c.checkout_champ_url}" target="_blank" class="quick-action-btn" onclick="HubCaseDetail.logActivity('viewed_subscription')">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  View Subscription
                </a>
                ` : ''}
                
                <!-- SOP Link -->
                <a href="${this.sopLink?.sop_url || '/hub/sop'}" target="_blank" class="quick-action-btn sop-link" onclick="HubCaseDetail.logActivity('clicked_sop', {sop_name: '${this.escapeHtml(this.sopLink?.scenario_name || c.case_type)}'})">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  ${this.sopLink ? `View SOP: ${this.escapeHtml(this.sopLink.scenario_name)}` : `View ${c.case_type} SOPs`}
                </a>

                <!-- Copy Email Template -->
                <button class="quick-action-btn email-btn" onclick="HubCaseDetail.showEmailTemplateModal()">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  Copy Email Template
                </button>
              </div>
            </div>
          </div>

          <!-- Case Meta -->
          <div class="case-detail-section">
            <div class="case-detail-section-header">Case Information</div>
            <div class="case-detail-section-content">
              <div class="case-info-row">
                <div class="case-info-label">Case ID</div>
                <div class="case-info-value" style="font-family: var(--font-mono); font-size: 12px;">${this.escapeHtml(c.case_id)}</div>
              </div>
              <div class="case-info-row">
                <div class="case-info-label">Created</div>
                <div class="case-info-value">${this.formatDate(c.created_at)}</div>
              </div>
              <div class="case-info-row">
                <div class="case-info-label">Assigned To</div>
                <div class="case-info-value">${HubUsers.renderAssigneeCell(c.case_id, c.assigned_to)}</div>
              </div>
              ${c.clickup_task_url ? `
              <div class="case-info-row">
                <div class="case-info-label">ClickUp</div>
                <div class="case-info-value"><a href="${c.clickup_task_url}" target="_blank">View Task</a></div>
              </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  formatIssueReason(c) {
    // Map category/case_type to human-readable issue reasons
    const issueReasonMap = {
      // Refund reasons
      'quality_issue': 'Product quality issue',
      'not_as_described': 'Product not as described',
      'dog_not_using': 'My dog is not using the product',
      'not_working': 'Product not working as expected',
      'changed_mind': 'Changed my mind',
      'found_cheaper': 'Found cheaper alternative',
      'duplicate_order': 'Duplicate order',
      // Shipping reasons
      'not_received': "Haven't received my order",
      'tracking_issue': 'Tracking not updating',
      'wrong_address': 'Shipped to wrong address',
      'damaged_shipping': 'Damaged during shipping',
      'missing_item': 'Missing item from order',
      'wrong_item': 'Received wrong item',
      // Subscription reasons
      'pause_subscription': 'Want to pause my subscription',
      'cancel_subscription': 'Want to cancel subscription',
      'change_frequency': 'Change delivery frequency',
      'update_address': 'Update shipping address',
      'too_much_product': 'Receiving too much product',
      // Return reasons
      'return_exchange': 'Want to return for exchange',
      'return_refund': 'Want to return for refund'
    };
    
    const category = c.category || '';
    const caseType = c.case_type || '';
    const resolution = c.resolution || '';
    
    // Try to find a matching reason
    if (issueReasonMap[category]) {
      return issueReasonMap[category];
    }
    
    // Try to infer from resolution text
    if (resolution.toLowerCase().includes('quality')) return 'Product quality issue';
    if (resolution.toLowerCase().includes('not using')) return 'My dog is not using it';
    if (resolution.toLowerCase().includes('pause')) return 'Want to pause subscription';
    if (resolution.toLowerCase().includes('cancel')) return 'Want to cancel subscription';
    if (resolution.toLowerCase().includes('missing')) return 'Missing item from order';
    if (resolution.toLowerCase().includes('reship')) return "Haven't received my order";
    
    // Default based on case type
    const defaultReasons = {
      'refund': 'Requesting a refund',
      'return': 'Want to return product',
      'shipping': 'Issue with shipping/delivery',
      'subscription': 'Subscription management request',
      'manual': 'Requires manual review'
    };
    
    return defaultReasons[caseType] || category || 'General inquiry';
  },

  renderActivities() {
    // Keep old method for backwards compatibility
    return this.renderActivitiesRedesigned();
  },

  renderActivitiesRedesigned() {
    // Combine activities and comments, sorted by date
    const allActivities = [
      ...this.activities.map(a => ({ ...a, _type: 'activity' })),
      ...this.comments.map(c => ({ ...c, _type: 'comment', created_at: c.created_at }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (allActivities.length === 0) {
      return `
        <div class="activity-empty-state">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="48" height="48">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
          </svg>
          <p>No activity yet</p>
          <span>Comments and actions will appear here</span>
        </div>
      `;
    }

    return allActivities.slice(0, 20).map(item => {
      if (item._type === 'comment') {
        // Comments have a distinct card-like appearance
        const initials = (item.author_name || 'TM').split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
        return `
          <div class="activity-item comment-item">
            <div class="comment-avatar">
              <span>${initials}</span>
            </div>
            <div class="comment-bubble">
              <div class="comment-header">
                <span class="comment-author">${this.escapeHtml(item.author_name || 'Team Member')}</span>
                <span class="comment-time">${this.timeAgo(item.created_at)}</span>
              </div>
              <div class="comment-content">${this.escapeHtml(item.content)}</div>
            </div>
          </div>
        `;
      } else {
        // Activities are subtle, inline items
        return `
          <div class="activity-item system-activity">
            <div class="activity-icon-small ${this.getActivityIconClass(item.activity_type)}">
              ${this.getActivityIcon(item.activity_type)}
            </div>
            <div class="activity-text-inline">
              ${this.formatActivityText(item)}
              <span class="activity-time-inline">· ${this.timeAgo(item.created_at)}</span>
            </div>
          </div>
        `;
      }
    }).join('');
  },

  getActivityIconClass(type) {
    const classes = {
      'status_changed': 'status-change',
      'assigned': 'assigned',
      'viewed_shopify_order': 'view-action',
      'viewed_session_recording': 'view-action',
      'clicked_sop': 'view-action',
      'copied_email_template': 'copy-action'
    };
    return classes[type] || '';
  },

  getActivityIcon(type) {
    const icons = {
      'status_changed': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
      'assigned': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>',
      'viewed_shopify_order': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>',
      'viewed_session_recording': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
      'clicked_sop': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>',
      'copied_email_template': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>'
    };
    return icons[type] || '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="12" height="12"><circle cx="12" cy="12" r="3"></circle></svg>';
  },

  showEmailTemplateModal() {
    const c = this.caseData;
    if (!c) return;

    // Get the SINGLE matching template based on resolution
    const template = this.getEmailTemplateForResolution(c);
    
    // Pre-fill the template with actual case data
    const filledBody = this.fillTemplateVariables(template.body, c);
    
    const html = `
      <div class="modal-overlay active" id="emailTemplateModal" onclick="if(event.target.id==='emailTemplateModal')this.remove()">
        <div class="modal" style="max-width: 650px;">
          <div class="modal-header">
            <h3>${this.escapeHtml(template.name)}</h3>
            <button class="modal-close" onclick="document.getElementById('emailTemplateModal').remove()">×</button>
          </div>
          <div class="modal-body" style="padding: 24px; max-height: 400px; overflow-y: auto;">
            <div style="font-size: 14px; line-height: 1.7; color: var(--gray-800); white-space: pre-line;">${this.escapeHtml(filledBody)}</div>
          </div>
          <div style="padding: 16px 24px; background: var(--gray-50); border-top: 1px solid var(--gray-200); display: flex; justify-content: flex-end;">
            <button class="btn btn-primary" onclick="HubCaseDetail.copyFilledTemplate()" style="display: flex; align-items: center; gap: 8px;">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
              Copy to Clipboard
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  fillTemplateVariables(text, c) {
    // Use first name only for more personal greeting
    const firstName = (c.customer_name || 'Valued Customer').split(' ')[0];
    return text
      .replace(/\{\{customer_name\}\}/g, firstName)
      .replace(/\{\{order_number\}\}/g, c.order_number || '')
      .replace(/\{\{refund_amount\}\}/g, c.refund_amount ? '$' + parseFloat(c.refund_amount).toFixed(2) : '')
      .replace(/\{\{resolution\}\}/g, c.resolution || '')
      .replace(/\{\{customer_email\}\}/g, c.customer_email || '');
  },

  getEmailTemplateForResolution(c) {
    const resolution = (c.resolution || '').toLowerCase().replace(/_/g, ' ');
    const caseType = c.case_type || 'refund';
    
    // Determine the single best template based on resolution
    if (caseType === 'refund') {
      if (resolution.includes('full refund') || resolution.includes('full') && !resolution.includes('partial')) {
        return {
          id: 'refund_full',
          name: 'Full Refund Confirmation',
          subject: 'Your Refund Has Been Processed - Order {{order_number}}',
          body: `Hi {{customer_name}},

Great news! Your refund of {{refund_amount}} has been processed for order {{order_number}}.

Please allow 5-10 business days for the refund to appear in your account, depending on your bank.

If you have any questions, feel free to reply to this email.

Thank you for your patience!

Best regards,
The PuppyPad Team`
        };
      } else {
        // Default to partial refund for any other refund scenario
        return {
          id: 'refund_partial',
          name: 'Partial Refund Confirmation',
          subject: 'Partial Refund Processed - Order {{order_number}}',
          body: `Hi {{customer_name}},

We've processed a partial refund of {{refund_amount}} for your order {{order_number}}.

Please allow 5-10 business days for the refund to appear in your account.

Thank you for your understanding!

Best regards,
The PuppyPad Team`
        };
      }
    } else if (caseType === 'shipping') {
      if (resolution.includes('reship')) {
        return {
          id: 'reship_confirmation',
          name: 'Reship Confirmation',
          subject: 'Your Replacement Order is On the Way! - Order {{order_number}}',
          body: `Hi {{customer_name}},

Good news! We've shipped a replacement for your order {{order_number}}.

You'll receive tracking information shortly once the shipment is processed.

We apologize for any inconvenience and appreciate your patience!

Best regards,
The PuppyPad Team`
        };
      } else {
        return {
          id: 'tracking_update',
          name: 'Shipping Update',
          subject: 'Update on Your Order {{order_number}}',
          body: `Hi {{customer_name}},

We wanted to give you an update on your order {{order_number}}.

If you need any assistance, please don't hesitate to reach out.

Best regards,
The PuppyPad Team`
        };
      }
    } else if (caseType === 'subscription') {
      if (resolution.includes('pause')) {
        return {
          id: 'sub_paused',
          name: 'Subscription Paused Confirmation',
          subject: 'Your PuppyPad Subscription Has Been Paused',
          body: `Hi {{customer_name}},

As requested, we've paused your PuppyPad subscription.

Your subscription will remain paused until you're ready to resume. You can reactivate it anytime from your account or by contacting us.

We'll be here when you're ready to continue!

Best regards,
The PuppyPad Team`
        };
      } else {
        return {
          id: 'sub_cancelled',
          name: 'Subscription Cancelled Confirmation',
          subject: 'Your PuppyPad Subscription Has Been Cancelled',
          body: `Hi {{customer_name}},

Your PuppyPad subscription has been cancelled as requested.

We're sorry to see you go! If there's anything we could have done better, we'd love to hear your feedback.

You're always welcome back anytime.

Best regards,
The PuppyPad Team`
        };
      }
    } else if (caseType === 'return') {
      return {
        id: 'return_approved',
        name: 'Return Approved',
        subject: 'Your Return Has Been Approved - Order {{order_number}}',
        body: `Hi {{customer_name}},

Your return request for order {{order_number}} has been approved!

Please ship the items back to:
PuppyPad Returns
[Return Address]

Once we receive and process your return, your refund will be issued within 5-7 business days.

Thank you!

Best regards,
The PuppyPad Team`
      };
    }
    
    // Default generic template
    return {
      id: 'generic',
      name: 'Resolution Confirmation',
      subject: 'Update on Your Request - Order {{order_number}}',
      body: `Hi {{customer_name}},

We've resolved your request regarding order {{order_number}}.

If you have any questions, feel free to reach out.

Best regards,
The PuppyPad Team`
    };
  },

  copyFilledTemplate() {
    const c = this.caseData;
    const template = this.getEmailTemplateForResolution(c);
    
    const filledBody = this.fillTemplateVariables(template.body, c);
    
    navigator.clipboard.writeText(filledBody).then(() => {
      HubUI.showToast('Email copied to clipboard!', 'success');
      document.getElementById('emailTemplateModal')?.remove();
      this.logActivity('copied_email_template', { template_name: template.name });
    }).catch(() => {
      HubUI.showToast('Failed to copy template', 'error');
    });
  },

  formatActivityText(activity) {
    const actorName = activity.actor || activity.actor_email || 'System';
    switch (activity.activity_type) {
      case 'status_changed':
        return `<strong>${this.escapeHtml(actorName)}</strong> changed status to <strong>${activity.new_value}</strong>`;
      case 'clicked_sop':
        return `<strong>${this.escapeHtml(actorName)}</strong> viewed SOP`;
      case 'copied_email_template':
        return `<strong>${this.escapeHtml(actorName)}</strong> copied email template`;
      case 'viewed_session_recording':
        return `<strong>${this.escapeHtml(actorName)}</strong> viewed session recording`;
      case 'viewed_shopify_order':
        return `<strong>${this.escapeHtml(actorName)}</strong> viewed Shopify order`;
      case 'assigned':
        return `<strong>${this.escapeHtml(actorName)}</strong> assigned to ${activity.new_value}`;
      default:
        return `<strong>${this.escapeHtml(actorName)}</strong>: ${activity.activity_type}`;
    }
  },

  async updateStatus(newStatus) {
    try {
      const result = await HubAPI.put(`/hub/api/case/${this.caseData.case_id}/status`, {
        status: newStatus,
        actor: HubState.currentUser?.name,
        actor_email: HubState.currentUser?.email
      });

      if (result.success) {
        this.caseData.status = newStatus;
        HubUI.showToast(`Status updated to ${newStatus}`, 'success');
        // Refresh to get updated activities
        this.load(this.caseData.case_id);
      } else {
        HubUI.showToast(result.error || 'Failed to update status', 'error');
      }
    } catch (e) {
      HubUI.showToast('Failed to update status', 'error');
    }
  },

  selectStatus(status, element) {
    // Update visual selection
    const group = element.closest('.status-radio-group');
    if (group) {
      group.querySelectorAll('.status-radio-item').forEach(item => {
        item.classList.remove('selected');
      });
    }
    element.classList.add('selected');
    
    // Trigger status update
    this.updateStatus(status);
  },

  async copyToClipboard(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      
      // Visual feedback
      button.classList.add('copied');
      const originalHTML = button.innerHTML;
      button.innerHTML = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
      
      HubUI.showToast('Copied to clipboard!', 'success');
      
      // Reset after delay
      setTimeout(() => {
        button.classList.remove('copied');
        button.innerHTML = originalHTML;
      }, 2000);
    } catch (e) {
      HubUI.showToast('Failed to copy', 'error');
    }
  },

  async addComment(event) {
    event.preventDefault();
    const textarea = document.getElementById('newCommentText');
    const content = textarea?.value.trim();

    if (!content) return;

    try {
      const result = await HubAPI.post(`/hub/api/case/${this.caseData.case_id}/comments`, {
        content,
        author_name: HubState.currentUser?.name || 'Team Member',
        author_email: HubState.currentUser?.email || ''
      });

      if (result.success) {
        textarea.value = '';
        HubUI.showToast('Comment added', 'success');
        this.load(this.caseData.case_id);
      } else {
        HubUI.showToast(result.error || 'Failed to add comment', 'error');
      }
    } catch (e) {
      HubUI.showToast('Failed to add comment', 'error');
    }
  },

  async logActivity(activityType, details = {}) {
    try {
      await HubAPI.post('/hub/api/activity', {
        case_id: this.caseData.case_id,
        activity_type: activityType,
        details
      });
    } catch (e) {
      // Silent fail for activity logging
    }
  },

  async copyEmailTemplate(templateId, templateName) {
    try {
      const result = await HubAPI.post(`/hub/api/email-templates/${templateId}/render`, {
        case_id: this.caseData.case_id
      });

      if (result.subject && result.body) {
        const textToCopy = `Subject: ${result.subject}\n\n${result.body}`;
        await navigator.clipboard.writeText(textToCopy);
        HubUI.showToast('Email template copied with case data', 'success');
        this.logActivity('copied_email_template', { template_name: templateName });
      } else {
        HubUI.showToast('Failed to render template', 'error');
      }
    } catch (e) {
      HubUI.showToast('Failed to copy template', 'error');
    }
  },

  formatStatus(status) {
    if (!status) return 'Pending';
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  },

  formatResolution(resolution) {
    if (!resolution) return 'Pending Review';
    
    const resolutionMap = {
      'full_refund': 'Process Full Refund',
      'partial_20': 'Process 20% Partial Refund',
      'partial_30': 'Process 30% Partial Refund',
      'partial_50': 'Process 50% Partial Refund',
      'reship_missing_item': 'Reship Missing Item',
      'subscription_paused': 'Subscription Paused',
      'subscription_cancelled': 'Subscription Cancelled',
      'manual_assistance': 'Manual Assistance Required'
    };

    return resolutionMap[resolution] || resolution.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  },

  formatDate(timestamp) {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  timeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// ============================================
// DASHBOARD
// ============================================
const HubDashboard = {
  async load() {
    HubUI.showLoading();
    try {
      // Load stats
      const result = await HubAPI.get('/hub/api/stats');

      document.getElementById('statPending').textContent = result.pending || 0;
      document.getElementById('statInProgress').textContent = result.inProgress || 0;
      document.getElementById('statCompletedToday').textContent = result.completedToday || 0;
      document.getElementById('statAvgTime').textContent = result.avgTime || '-';

      // Update sidebar progress bar
      this.updateSidebarProgress(result);

      // Update sidebar counts
      ['all', 'shipping', 'refund', 'subscription', 'manual'].forEach(type => {
        const el = document.getElementById((type === 'all' ? 'allCases' : type) + 'Count');
        if (el) el.textContent = result[type] || 0;
      });

      // Load issue reports count for the badge
      this.loadIssuesCount();

      // Load recent cases
      await this.loadRecentCases();
    } catch (e) {
      console.error('Failed to load dashboard:', e);
      HubUI.showToast('Failed to load dashboard stats', 'error');
      // Still try to load recent cases even if stats fail
      await this.loadRecentCases();
    } finally {
      HubUI.hideLoading();
    }
  },

  updateSidebarProgress(stats) {
    const pending = stats.pending || 0;
    const completed = stats.completedToday || 0;
    const inProgress = stats.inProgress || 0;
    const total = pending + completed + inProgress;

    // Update stats text
    const progressCompleted = document.getElementById('progressCompleted');
    const progressTotal = document.getElementById('progressTotal');
    const progressPending = document.getElementById('progressPending');
    const progressCompletedLabel = document.getElementById('progressCompletedLabel');
    const progressBarFill = document.getElementById('progressBarFill');

    if (progressCompleted) progressCompleted.textContent = completed;
    if (progressTotal) progressTotal.textContent = total;
    if (progressPending) progressPending.textContent = pending;
    if (progressCompletedLabel) progressCompletedLabel.textContent = completed;

    // Calculate and animate progress bar
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    if (progressBarFill) {
      progressBarFill.style.width = `${percentage}%`;
    }
  },

  // Separate function to load stats and update sidebar progress
  async loadStats() {
    try {
      const result = await HubAPI.get('/hub/api/stats');
      this.updateSidebarProgress(result);
      
      // Update sidebar counts
      ['all', 'shipping', 'refund', 'subscription', 'manual'].forEach(type => {
        const el = document.getElementById((type === 'all' ? 'allCases' : type) + 'Count');
        if (el) el.textContent = result[type] || 0;
      });
      
      return result;
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  },

  async loadIssuesCount() {
    try {
      const result = await HubAPI.get('/hub/api/issues?page=1&limit=1&status=pending');
      const badge = document.getElementById('issuesCount');
      if (badge) {
        const count = result.total || 0;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-flex' : 'none';
      }
    } catch (e) {
      console.error('Failed to load issues count:', e);
    }
  },

  recentCases: [],
  selectedDashboardCases: new Set(),
  
  async loadRecentCases() {
    const container = document.getElementById('recentCasesBody');
    if (!container) return;

    // Show loading spinner
    container.innerHTML = '<tr><td colspan="7" class="loading-spinner"><div class="spinner"></div></td></tr>';

    try {
      const result = await HubAPI.get('/hub/api/cases?page=1&limit=15');
      this.recentCases = result.cases || [];
      this.renderRecentCases(this.recentCases);
    } catch (e) {
      console.error('Failed to load recent cases:', e);
      container.innerHTML = '<tr><td colspan="7" class="empty-state">Failed to load recent cases</td></tr>';
    }
  },

  filterRecentCases() {
    const statusFilter = document.getElementById('dashboardStatusFilter')?.value || '';
    const typeFilter = document.getElementById('dashboardTypeFilter')?.value || '';
    const sortFilter = document.getElementById('dashboardSortFilter')?.value || 'newest';

    let filtered = [...this.recentCases];

    if (statusFilter) {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    if (typeFilter) {
      filtered = filtered.filter(c => c.case_type === typeFilter);
    }
    
    if (sortFilter === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    this.renderRecentCases(filtered);
  },

  toggleSelectAll(checkbox) {
    const checkboxes = document.querySelectorAll('#recentCasesBody input[type="checkbox"]');
    checkboxes.forEach(cb => {
      cb.checked = checkbox.checked;
      const caseId = cb.dataset.caseId;
      if (caseId) {
        if (checkbox.checked) {
          this.selectedDashboardCases.add(caseId);
        } else {
          this.selectedDashboardCases.delete(caseId);
        }
      }
    });
    this.updateBulkActionBar();
  },

  toggleDashboardSelect(caseId) {
    if (this.selectedDashboardCases.has(caseId)) {
      this.selectedDashboardCases.delete(caseId);
    } else {
      this.selectedDashboardCases.add(caseId);
    }
    this.updateBulkActionBar();
  },

  updateBulkActionBar() {
    const count = this.selectedDashboardCases.size;
    let bar = document.getElementById('dashboardBulkBar');
    
    if (count === 0) {
      if (bar) bar.remove();
      return;
    }

    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'dashboardBulkBar';
      bar.className = 'bulk-action-bar';
      document.body.appendChild(bar);
    }

    bar.innerHTML = `
      <div class="bulk-action-count">${count} case${count > 1 ? 's' : ''} selected</div>
      <div class="bulk-action-buttons">
        <button onclick="HubDashboard.bulkAssign()" class="bulk-btn">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          Assign
        </button>
        <button onclick="HubDashboard.bulkStatus()" class="bulk-btn">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Change Status
        </button>
        <button onclick="HubDashboard.bulkExport()" class="bulk-btn">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          Export
        </button>
        <button onclick="HubDashboard.clearSelection()" class="bulk-btn bulk-btn-cancel">Cancel</button>
      </div>
    `;
  },

  clearSelection() {
    this.selectedDashboardCases.clear();
    document.querySelectorAll('#recentCasesBody input[type="checkbox"]').forEach(cb => cb.checked = false);
    const selectAll = document.getElementById('dashboardSelectAll');
    if (selectAll) selectAll.checked = false;
    this.updateBulkActionBar();
  },

  async bulkAssign() {
    HubBulkActions.showAssignModal(Array.from(this.selectedDashboardCases));
  },

  async bulkStatus() {
    HubBulkActions.showStatusModal(Array.from(this.selectedDashboardCases));
  },

  async bulkExport() {
    const cases = this.recentCases.filter(c => this.selectedDashboardCases.has(c.case_id));
    const csv = this.exportToCSV(cases);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cases-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    HubUI.showToast(`Exported ${cases.length} cases`, 'success');
  },

  exportToCSV(cases) {
    const headers = ['Case ID', 'Customer Name', 'Customer Email', 'Type', 'Status', 'Resolution', 'Created'];
    const rows = cases.map(c => [
      c.case_id,
      c.customer_name || '',
      c.customer_email || '',
      c.case_type || '',
      c.status || '',
      c.resolution || '',
      c.created_at || ''
    ]);
    return [headers, ...rows].map(r => r.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
  },

  renderRecentCases(cases) {
    const container = document.getElementById('recentCasesBody');
    if (!container) return;

    if (cases.length === 0) {
      container.innerHTML = '<tr><td colspan="8" class="empty-state">No recent cases</td></tr>';
      return;
    }

    container.innerHTML = cases.map(c => {
      const statusClass = c.status ? c.status.replace('_', '-') : 'pending';
      
      // Calculate due date (24 hours from creation) - same as All Cases
      const createdDate = new Date(c.created_at);
      const dueDate = new Date(createdDate.getTime() + (24 * 60 * 60 * 1000));
      const now = new Date();
      const isOverdue = now > dueDate && c.status !== 'completed';
      const hoursLeft = Math.max(0, Math.round((dueDate - now) / (1000 * 60 * 60)));
      const dueClass = isOverdue ? 'overdue' : hoursLeft < 8 ? 'warning' : 'ok';
      
      // Format resolution to match All Cases
      const resolutionText = HubCases.formatResolution ? HubCases.formatResolution(c.resolution) : (c.resolution || 'Pending Review');
      
      return `
        <tr onclick="HubCases.openCase('${c.case_id}')" style="cursor: pointer;">
          <td onclick="event.stopPropagation();">
            <input type="checkbox" data-case-id="${c.case_id}" 
                   onclick="HubDashboard.toggleDashboardSelect('${c.case_id}')"
                   ${this.selectedDashboardCases.has(c.case_id) ? 'checked' : ''}>
          </td>
          <td class="td-customer">
            <div class="td-customer-name">${HubHelpers.formatName(c.customer_name)}</div>
            <div class="td-customer-email">${this.escapeHtml(c.customer_email || '-')}</div>
          </td>
          <td><span class="type-badge ${c.case_type || ''}">${this.escapeHtml(c.case_type || '-')}</span></td>
          <td><span class="status-badge ${statusClass}">${this.formatStatus(c.status || 'pending')}</span></td>
          <td class="td-due ${dueClass}">${isOverdue ? 'Overdue' : hoursLeft + 'h left'}</td>
          <td class="td-resolution">${this.escapeHtml(resolutionText)}</td>
          <td class="td-assignee">${HubUsers.renderAssigneeCell(c.case_id, c.assigned_to)}</td>
          <td class="td-created">${this.timeAgo(c.created_at)}</td>
        </tr>
      `;
    }).join('');
  },

  formatStatus(status) {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  },

  timeAgo(timestamp) {
    if (!timestamp) return '-';
    const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return new Date(timestamp).toLocaleDateString();
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// ============================================
// UI UTILITIES
// ============================================
const HubUI = {
  init() {
    // NOTE: Nav item event listeners are handled by inline script's navigateTo
    // Do NOT add duplicate listeners here - it causes race conditions where
    // both handlers fire and HubCases.renderCasesList overwrites the correct table

    // NOTE: Search is handled by inline script's caseSearchInput and debounceSearch
    // The inline script has a different search input (caseSearchInput) that works
    // with the correct table structure

    // Modal close on overlay click
    document.getElementById('caseModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'caseModal') this.closeModal();
    });
  },

  showLoginScreen() {
    const loginScreen = document.getElementById('loginScreen');
    const appContainer = document.getElementById('appContainer');
    if (loginScreen) loginScreen.style.display = 'flex';
    if (appContainer) appContainer.style.display = 'none';
  },

  showApp() {
    const loginScreen = document.getElementById('loginScreen');
    const appContainer = document.getElementById('appContainer');
    if (loginScreen) loginScreen.style.display = 'none';
    if (appContainer) appContainer.style.display = 'flex';

    // Update user info in sidebar
    const userName = HubState.currentUser?.name || 'User';
    const userRole = HubState.currentUser?.role || 'user';

    const userNameEl = document.querySelector('.user-name');
    const userRoleEl = document.querySelector('.user-role');
    const userAvatarEl = document.querySelector('.user-avatar');

    if (userNameEl) userNameEl.textContent = userName;
    if (userRoleEl) userRoleEl.textContent = userRole === 'admin' ? 'Administrator' : 'Team Member';
    if (userAvatarEl) userAvatarEl.textContent = userName.charAt(0).toUpperCase();

    // Show/hide admin nav items
    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.display = HubAuth.isAdmin() ? 'block' : 'none';
    });
  },

  showCaseModal(caseData) {
    // Implementation would render the full case modal
    // This is a simplified version
    const modal = document.getElementById('caseModal');
    if (modal) {
      modal.classList.add('active');
      // Populate modal with case data...
    }
  },

  closeModal() {
    document.querySelectorAll('.modal-overlay.active').forEach(m => {
      m.classList.remove('active');
    });
    HubState.currentCase = null;
  },

  updateCaseModalStatus(status) {
    document.querySelectorAll('.status-card').forEach(card => {
      card.classList.remove('active');
      if (card.classList.contains(status.replace('_', '-'))) {
        card.classList.add('active');
      }
    });
  },

  showLoading() {
    HubState.isLoading = true;
    // Show loading indicator
  },

  hideLoading() {
    HubState.isLoading = false;
    // Hide loading indicator
  },

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    const container = document.getElementById('toastContainer') || document.body;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  refresh() {
    if (HubState.currentPage === 'dashboard') {
      HubDashboard.load();
    } else if (HubState.currentPage === 'cases') {
      HubCases.loadCases(HubState.casesPage);
    }
    HubUI.showToast('Refreshed', 'success');
  },

  copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('Copied to clipboard', 'success');
    });
  }
};

// ============================================
// INITIALIZATION
// ============================================
const HubApp = {
  async init() {
    // Check authentication
    if (HubAuth.init()) {
      HubUI.showApp();
      HubUI.init();
      HubKeyboard.init();
      HubViews.load();
      HubSearch.init();
      HubFilters.init();

      // Check URL for case deep link
      this.handleDeepLink();
    } else {
      HubUI.showLoginScreen();
    }
  },

  handleDeepLink() {
    const params = new URLSearchParams(window.location.search);
    const caseId = params.get('case');

    if (caseId) {
      HubNavigation.goto('cases', 'all');
      setTimeout(() => HubCases.openCase(caseId), 500);
    }
    // URL parsing is now handled by inline script in hub.html
  }
};

// ============================================
// PHASE 2: SOP LINK MANAGEMENT (Admin)
// ============================================
const HubSOPLinks = {
  links: [],

  async show() {
    if (!HubAuth.isAdmin()) {
      HubUI.showToast('Admin access required', 'error');
      return;
    }

    await this.load();

    const caseTypes = [...new Set(this.links.map(l => l.case_type))];

    const html = `
      <div class="modal-overlay active" id="sopManagementModal">
        <div class="modal" style="max-width: 900px;">
          <div class="modal-header" style="padding: 20px 24px;">
            <div class="modal-header-content">
              <div class="modal-title" style="font-size: 18px;">SOP Link Management</div>
              <div style="font-size: 13px; color: var(--gray-500); margin-top: 4px;">
                Configure Standard Operating Procedure links for each case scenario
              </div>
            </div>
            <button class="modal-close" onclick="document.getElementById('sopManagementModal').remove()">&times;</button>
          </div>
          <div class="modal-body" style="padding: 0; max-height: 70vh; overflow-y: auto;">
            <div style="padding: 16px 24px; border-bottom: 1px solid var(--gray-200); display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; gap: 12px;">
                <select id="sopCaseTypeFilter" class="form-input" style="width: 150px;" onchange="HubSOPLinks.filterByType(this.value)">
                  <option value="">All Types</option>
                  ${['refund', 'return', 'shipping', 'subscription', 'manual'].map(t =>
                    `<option value="${t}">${t.charAt(0).toUpperCase() + t.slice(1)}</option>`
                  ).join('')}
                </select>
              </div>
              <button class="btn btn-primary" onclick="HubSOPLinks.showCreateForm()">Add SOP Link</button>
            </div>
            <table class="sop-table" style="width: 100%;">
              <thead>
                <tr>
                  <th style="padding: 12px 24px;">Scenario</th>
                  <th>Case Type</th>
                  <th>URL</th>
                  <th>Status</th>
                  <th style="width: 100px;">Actions</th>
                </tr>
              </thead>
              <tbody id="sopLinksTableBody">
                ${this.renderRows(this.links)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  renderRows(links) {
    if (links.length === 0) {
      return '<tr><td colspan="5" class="empty-state">No SOP links configured</td></tr>';
    }

    return links.map(link => `
      <tr data-case-type="${link.case_type}">
        <td style="padding: 12px 24px;">
          <div style="font-weight: 500;">${this.escapeHtml(link.scenario_name)}</div>
          <div style="font-size: 12px; color: var(--gray-500);">${link.scenario_key}</div>
        </td>
        <td><span class="type-badge ${link.case_type}">${link.case_type}</span></td>
        <td>
          <a href="${link.sop_url}" target="_blank" style="color: var(--primary-600); text-decoration: none; max-width: 250px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${this.escapeHtml(link.sop_url)}
          </a>
        </td>
        <td>
          <span class="status-badge ${link.is_active ? 'completed' : 'pending'}">
            ${link.is_active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>
          <button class="btn-icon" onclick="HubSOPLinks.edit(${link.id})">Edit</button>
          <button class="btn-icon danger" onclick="HubSOPLinks.delete(${link.id})">Delete</button>
        </td>
      </tr>
    `).join('');
  },

  async load() {
    try {
      const result = await HubAPI.get('/hub/api/admin/sop-links');
      if (result.success) {
        this.links = result.links;
      }
    } catch (e) {
      console.error('Failed to load SOP links:', e);
    }
  },

  filterByType(caseType) {
    const rows = document.querySelectorAll('#sopLinksTableBody tr[data-case-type]');
    rows.forEach(row => {
      if (!caseType || row.dataset.caseType === caseType) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  },

  showCreateForm() {
    const html = `
      <div class="modal-overlay active" id="sopFormModal" style="z-index: 210;">
        <div class="modal" style="max-width: 500px;">
          <div class="modal-header" style="padding: 20px 24px;">
            <div class="modal-header-content">
              <div class="modal-title">Add SOP Link</div>
            </div>
            <button class="modal-close" onclick="document.getElementById('sopFormModal').remove()">&times;</button>
          </div>
          <div class="modal-body" style="padding: 24px;">
            <div class="form-group">
              <label>Scenario Key</label>
              <input type="text" id="sopScenarioKey" class="form-input" placeholder="e.g., refund_partial, shipping_lost">
              <div style="font-size: 12px; color: var(--gray-500); margin-top: 4px;">Unique identifier (lowercase, underscores)</div>
            </div>
            <div class="form-group">
              <label>Scenario Name</label>
              <input type="text" id="sopScenarioName" class="form-input" placeholder="e.g., Partial Refund">
            </div>
            <div class="form-group">
              <label>Case Type</label>
              <select id="sopCaseType" class="form-input">
                <option value="refund">Refund</option>
                <option value="return">Return</option>
                <option value="shipping">Shipping</option>
                <option value="subscription">Subscription</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div class="form-group">
              <label>SOP URL</label>
              <input type="url" id="sopUrl" class="form-input" placeholder="https://docs.example.com/sop/...">
            </div>
            <div class="form-group">
              <label>Description (optional)</label>
              <textarea id="sopDescription" class="form-input" rows="2" placeholder="Brief description of this SOP"></textarea>
            </div>
            <div id="sopFormError" class="error-message" style="display: none;"></div>
            <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
              <button class="btn btn-secondary" onclick="document.getElementById('sopFormModal').remove()">Cancel</button>
              <button class="btn btn-primary" onclick="HubSOPLinks.create()">Create</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  async create() {
    const scenarioKey = document.getElementById('sopScenarioKey').value.trim();
    const scenarioName = document.getElementById('sopScenarioName').value.trim();
    const caseType = document.getElementById('sopCaseType').value;
    const sopUrl = document.getElementById('sopUrl').value.trim();
    const description = document.getElementById('sopDescription').value.trim();
    const errorEl = document.getElementById('sopFormError');

    if (!scenarioKey || !scenarioName || !sopUrl) {
      errorEl.textContent = 'Please fill in all required fields';
      errorEl.style.display = 'block';
      return;
    }

    try {
      const result = await HubAPI.post('/hub/api/admin/sop-links', {
        scenarioKey,
        scenarioName,
        caseType,
        sopUrl,
        description
      });

      if (result.success) {
        document.getElementById('sopFormModal').remove();
        HubUI.showToast('SOP link created', 'success');
        // Refresh the list
        document.getElementById('sopManagementModal').remove();
        this.show();
      } else {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
      }
    } catch (e) {
      errorEl.textContent = 'Failed to create SOP link';
      errorEl.style.display = 'block';
    }
  },

  edit(id) {
    const link = this.links.find(l => l.id === id);
    if (!link) return;

    const html = `
      <div class="modal-overlay active" id="sopFormModal" style="z-index: 210;">
        <div class="modal" style="max-width: 500px;">
          <div class="modal-header" style="padding: 20px 24px;">
            <div class="modal-header-content">
              <div class="modal-title">Edit SOP Link</div>
            </div>
            <button class="modal-close" onclick="document.getElementById('sopFormModal').remove()">&times;</button>
          </div>
          <div class="modal-body" style="padding: 24px;">
            <div class="form-group">
              <label>Scenario Key</label>
              <input type="text" class="form-input" value="${this.escapeHtml(link.scenario_key)}" disabled style="background: var(--gray-100);">
            </div>
            <div class="form-group">
              <label>Scenario Name</label>
              <input type="text" id="sopScenarioName" class="form-input" value="${this.escapeHtml(link.scenario_name)}">
            </div>
            <div class="form-group">
              <label>SOP URL</label>
              <input type="url" id="sopUrl" class="form-input" value="${this.escapeHtml(link.sop_url)}">
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea id="sopDescription" class="form-input" rows="2">${this.escapeHtml(link.description || '')}</textarea>
            </div>
            <div class="form-group">
              <label style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" id="sopIsActive" ${link.is_active ? 'checked' : ''}>
                Active
              </label>
            </div>
            <div id="sopFormError" class="error-message" style="display: none;"></div>
            <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
              <button class="btn btn-secondary" onclick="document.getElementById('sopFormModal').remove()">Cancel</button>
              <button class="btn btn-primary" onclick="HubSOPLinks.update(${id})">Save</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  async update(id) {
    const scenarioName = document.getElementById('sopScenarioName').value.trim();
    const sopUrl = document.getElementById('sopUrl').value.trim();
    const description = document.getElementById('sopDescription').value.trim();
    const isActive = document.getElementById('sopIsActive').checked;
    const errorEl = document.getElementById('sopFormError');

    try {
      const result = await HubAPI.put(`/hub/api/admin/sop-links/${id}`, {
        scenarioName,
        sopUrl,
        description,
        isActive
      });

      if (result.success) {
        document.getElementById('sopFormModal').remove();
        HubUI.showToast('SOP link updated', 'success');
        document.getElementById('sopManagementModal').remove();
        this.show();
      } else {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
      }
    } catch (e) {
      errorEl.textContent = 'Failed to update SOP link';
      errorEl.style.display = 'block';
    }
  },

  async delete(id) {
    if (!confirm('Are you sure you want to delete this SOP link?')) return;

    try {
      const result = await HubAPI.delete(`/hub/api/admin/sop-links/${id}`);
      if (result.success) {
        HubUI.showToast('SOP link deleted', 'success');
        document.getElementById('sopManagementModal').remove();
        this.show();
      } else {
        HubUI.showToast(result.error, 'error');
      }
    } catch (e) {
      HubUI.showToast('Failed to delete SOP link', 'error');
    }
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// ============================================
// PHASE 2: ENHANCED AUDIT LOG (Admin)
// ============================================
const HubEnhancedAuditLog = {
  currentPage: 1,
  filters: {},
  availableFilters: { categories: [], actionTypes: [] },

  async show() {
    const view = document.getElementById('auditView');
    if (!view) return;

    if (!HubAuth.isAdmin()) {
      view.innerHTML = '<div class="empty-state"><p>Admin access required to view this page.</p></div>';
      return;
    }

    view.innerHTML = '<div class="spinner" style="margin: 40px auto;"></div>';
    const result = await this.load(1);

    view.innerHTML = `
      <div class="cases-card">
        <div class="cases-header">
          <h2 class="cases-title">Audit Log</h2>
          <button class="btn btn-secondary" onclick="HubEnhancedAuditLog.export()">Export CSV</button>
        </div>
        <!-- Filters -->
        <div style="padding: 16px 24px; border-bottom: 1px solid var(--gray-200); display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
          <select id="auditCategoryFilter" class="form-input" style="width: 140px;" onchange="HubEnhancedAuditLog.applyFilters()">
            <option value="">All Categories</option>
            ${this.availableFilters.categories.map(c =>
              `<option value="${c}">${c}</option>`
            ).join('')}
          </select>
          <select id="auditActionFilter" class="form-input" style="width: 180px;" onchange="HubEnhancedAuditLog.applyFilters()">
            <option value="">All Actions</option>
            ${this.availableFilters.actionTypes.map(a =>
              `<option value="${a}">${a.replace(/_/g, ' ')}</option>`
            ).join('')}
          </select>
          <input type="date" id="auditStartDate" class="form-input" style="width: 140px;" onchange="HubEnhancedAuditLog.applyFilters()">
          <input type="date" id="auditEndDate" class="form-input" style="width: 140px;" onchange="HubEnhancedAuditLog.applyFilters()">
          <input type="text" id="auditSearch" class="form-input" style="width: 180px;" placeholder="Search..." onkeyup="HubEnhancedAuditLog.debounceSearch(this.value)">
        </div>
        <!-- Table -->
        <div style="max-height: 60vh; overflow-y: auto;">
          <table class="audit-table">
            <thead>
              <tr>
                <th style="padding: 12px 24px; position: sticky; top: 0; background: var(--gray-50);">Time</th>
                <th style="position: sticky; top: 0; background: var(--gray-50);">User</th>
                <th style="position: sticky; top: 0; background: var(--gray-50);">Action</th>
                <th style="position: sticky; top: 0; background: var(--gray-50);">Resource</th>
                <th style="position: sticky; top: 0; background: var(--gray-50);">Details</th>
              </tr>
            </thead>
            <tbody id="auditLogTableBody">
              ${this.renderRows(result.logs)}
            </tbody>
          </table>
        </div>
        <!-- Pagination -->
        <div id="auditPagination" style="padding: 16px 24px; border-top: 1px solid var(--gray-200); display: flex; justify-content: center; align-items: center; gap: 16px;">
          ${this.renderPagination(result.pagination)}
        </div>
      </div>
    `;
  },

  renderRows(logs) {
    if (!logs || logs.length === 0) {
      return '<tr><td colspan="5" class="empty-state">No audit entries found</td></tr>';
    }

    return logs.map(log => `
      <tr>
        <td style="padding: 10px 24px; white-space: nowrap;">${this.formatTime(log.created_at)}</td>
        <td>
          <div style="font-weight: 500;">${log.user_name || 'System'}</div>
          <div style="font-size: 12px; color: var(--gray-500);">${log.user_email || ''}</div>
        </td>
        <td>
          <span class="action-badge ${log.action_category}">${log.action_type.replace(/_/g, ' ')}</span>
        </td>
        <td>
          ${log.resource_type ? `<span style="font-size: 12px; color: var(--gray-600);">${log.resource_type}</span>` : '-'}
          ${log.resource_id ? `<br><span style="font-size: 11px; font-family: monospace; color: var(--gray-500);">${log.resource_id}</span>` : ''}
        </td>
        <td style="max-width: 200px;">
          ${log.old_value || log.new_value ? `
            <button class="btn-icon" onclick="HubEnhancedAuditLog.showDetails(${JSON.stringify(log).replace(/"/g, '&quot;')})">
              View
            </button>
          ` : '-'}
        </td>
      </tr>
    `).join('');
  },

  renderPagination(pagination) {
    if (!pagination) return '';

    let html = '';
    if (pagination.page > 1) {
      html += `<button class="btn btn-secondary" onclick="HubEnhancedAuditLog.goToPage(${pagination.page - 1})">Previous</button>`;
    }
    html += `<span>Page ${pagination.page} of ${pagination.totalPages} (${pagination.total} entries)</span>`;
    if (pagination.page < pagination.totalPages) {
      html += `<button class="btn btn-secondary" onclick="HubEnhancedAuditLog.goToPage(${pagination.page + 1})">Next</button>`;
    }
    return html;
  },

  async load(page = 1) {
    try {
      let url = `/hub/api/admin/audit-log?page=${page}&limit=50`;

      if (this.filters.category) url += `&category=${this.filters.category}`;
      if (this.filters.actionType) url += `&actionType=${this.filters.actionType}`;
      if (this.filters.startDate) url += `&startDate=${this.filters.startDate}`;
      if (this.filters.endDate) url += `&endDate=${this.filters.endDate}`;
      if (this.filters.search) url += `&search=${encodeURIComponent(this.filters.search)}`;

      const result = await HubAPI.get(url);

      if (result.success) {
        this.currentPage = page;
        this.availableFilters = result.filters;
        return result;
      }
      return { logs: [], pagination: { page: 1, total: 0, totalPages: 1 } };
    } catch (e) {
      console.error('Failed to load audit log:', e);
      return { logs: [], pagination: { page: 1, total: 0, totalPages: 1 } };
    }
  },

  async applyFilters() {
    this.filters = {
      category: document.getElementById('auditCategoryFilter').value,
      actionType: document.getElementById('auditActionFilter').value,
      startDate: document.getElementById('auditStartDate').value,
      endDate: document.getElementById('auditEndDate').value,
      search: document.getElementById('auditSearch').value
    };

    const result = await this.load(1);
    document.getElementById('auditLogTableBody').innerHTML = this.renderRows(result.logs);
    document.getElementById('auditPagination').innerHTML = this.renderPagination(result.pagination);
  },

  debounceSearch: (function() {
    let timeout;
    return function(value) {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        HubEnhancedAuditLog.filters.search = value;
        HubEnhancedAuditLog.applyFilters();
      }, 300);
    };
  })(),

  async goToPage(page) {
    const result = await this.load(page);
    document.getElementById('auditLogTableBody').innerHTML = this.renderRows(result.logs);
    document.getElementById('auditPagination').innerHTML = this.renderPagination(result.pagination);
  },

  showDetails(log) {
    const html = `
      <div class="modal-overlay active" id="auditDetailModal" style="z-index: 210;">
        <div class="modal" style="max-width: 600px;">
          <div class="modal-header" style="padding: 20px 24px;">
            <div class="modal-title">Audit Details</div>
            <button class="modal-close" onclick="document.getElementById('auditDetailModal').remove()">&times;</button>
          </div>
          <div class="modal-body" style="padding: 24px;">
            <div style="display: grid; gap: 16px;">
              <div>
                <div style="font-size: 12px; color: var(--gray-500); margin-bottom: 4px;">Action</div>
                <div style="font-weight: 500;">${log.action_type.replace(/_/g, ' ')}</div>
              </div>
              <div>
                <div style="font-size: 12px; color: var(--gray-500); margin-bottom: 4px;">User</div>
                <div>${log.user_name || 'System'} ${log.user_email ? `(${log.user_email})` : ''}</div>
              </div>
              <div>
                <div style="font-size: 12px; color: var(--gray-500); margin-bottom: 4px;">Time</div>
                <div>${new Date(log.created_at).toLocaleString()}</div>
              </div>
              ${log.old_value ? `
                <div>
                  <div style="font-size: 12px; color: var(--gray-500); margin-bottom: 4px;">Previous Value</div>
                  <pre style="background: var(--gray-50); padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 12px;">${this.formatJSON(log.old_value)}</pre>
                </div>
              ` : ''}
              ${log.new_value ? `
                <div>
                  <div style="font-size: 12px; color: var(--gray-500); margin-bottom: 4px;">New Value</div>
                  <pre style="background: var(--gray-50); padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 12px;">${this.formatJSON(log.new_value)}</pre>
                </div>
              ` : ''}
              ${log.ip_address ? `
                <div>
                  <div style="font-size: 12px; color: var(--gray-500); margin-bottom: 4px;">IP Address</div>
                  <div style="font-family: monospace;">${log.ip_address}</div>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  formatJSON(str) {
    try {
      return JSON.stringify(JSON.parse(str), null, 2);
    } catch {
      return str;
    }
  },

  async export() {
    try {
      const startDate = document.getElementById('auditStartDate').value ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = document.getElementById('auditEndDate').value ||
        new Date().toISOString().split('T')[0];

      const response = await HubAPI.request(`/hub/api/admin/audit-log/export?startDate=${startDate}&endDate=${endDate}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${startDate}-to-${endDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      HubUI.showToast('Audit log exported', 'success');
    } catch (e) {
      HubUI.showToast('Failed to export audit log', 'error');
    }
  },

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
};

// ============================================
// PHASE 2: RESOLUTION VALIDATION
// ============================================
const HubValidation = {
  async validateBeforeComplete(caseData) {
    try {
      const result = await HubAPI.post('/hub/api/validate-resolution', {
        caseId: caseData.case_id,
        caseType: caseData.case_type,
        resolution: caseData.resolution,
        refundAmount: caseData.refund_amount,
        orderTotal: caseData.order_total
      });

      if (!result.valid) {
        this.showValidationModal(result);
        return false;
      }

      if (result.warnings && result.warnings.length > 0) {
        return await this.showWarningsModal(result.warnings);
      }

      return true;
    } catch (e) {
      console.error('Validation error:', e);
      // Allow to proceed if validation fails
      return true;
    }
  },

  showValidationModal(result) {
    const html = `
      <div class="modal-overlay active" id="validationModal">
        <div class="modal" style="max-width: 500px;">
          <div class="modal-header" style="padding: 20px 24px; background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white;">
            <div class="modal-header-content">
              <div class="modal-title" style="font-size: 18px; color: white;">Cannot Complete Case</div>
            </div>
            <button class="modal-close" style="color: white;" onclick="document.getElementById('validationModal').remove()">&times;</button>
          </div>
          <div class="modal-body" style="padding: 24px;">
            <p style="margin-bottom: 16px;">Please resolve the following issues before completing this case:</p>
            <ul style="margin: 0; padding-left: 20px;">
              ${result.errors.map(e => `<li style="margin-bottom: 8px; color: var(--error-600);">${e}</li>`).join('')}
            </ul>
            ${result.warnings && result.warnings.length > 0 ? `
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--gray-200);">
                <p style="font-weight: 500; margin-bottom: 8px;">Warnings:</p>
                <ul style="margin: 0; padding-left: 20px;">
                  ${result.warnings.map(w => `<li style="margin-bottom: 8px; color: var(--warning-600);">${w}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            <button class="btn btn-primary" style="width: 100%; margin-top: 24px;" onclick="document.getElementById('validationModal').remove()">
              Understood
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  showWarningsModal(warnings) {
    return new Promise((resolve) => {
      const html = `
        <div class="modal-overlay active" id="warningsModal">
          <div class="modal" style="max-width: 500px;">
            <div class="modal-header" style="padding: 20px 24px; background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); color: white;">
              <div class="modal-header-content">
                <div class="modal-title" style="font-size: 18px; color: white;">Review Warnings</div>
              </div>
              <button class="modal-close" style="color: white;" onclick="HubValidation.resolveWarnings(false)">&times;</button>
            </div>
            <div class="modal-body" style="padding: 24px;">
              <p style="margin-bottom: 16px;">Please review these warnings before proceeding:</p>
              <ul style="margin: 0; padding-left: 20px;">
                ${warnings.map(w => `<li style="margin-bottom: 8px; color: var(--warning-700);">${w}</li>`).join('')}
              </ul>
              <div style="display: flex; gap: 12px; margin-top: 24px;">
                <button class="btn btn-secondary" style="flex: 1;" onclick="HubValidation.resolveWarnings(false)">
                  Cancel
                </button>
                <button class="btn btn-primary" style="flex: 1;" onclick="HubValidation.resolveWarnings(true)">
                  Proceed Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', html);

      this._warningsResolve = resolve;
    });
  },

  resolveWarnings(proceed) {
    document.getElementById('warningsModal')?.remove();
    if (this._warningsResolve) {
      this._warningsResolve(proceed);
      this._warningsResolve = null;
    }
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => HubApp.init());
} else {
  HubApp.init();
}

// Export for global access
window.HubApp = HubApp;
window.HubAuth = HubAuth;
window.HubCases = HubCases;
window.HubBulkActions = HubBulkActions;
window.HubViews = HubViews;
window.HubChecklist = HubChecklist;
window.HubUsers = HubUsers;
window.HubAssignment = HubAssignment;
window.HubUI = HubUI;
window.HubNavigation = HubNavigation;
window.HubKeyboard = HubKeyboard;
window.HubSessions = HubSessions;
window.HubEvents = HubEvents;
window.HubIssues = HubIssues;
window.HubAnalytics = HubAnalytics;
// Phase 2 exports
window.HubSOPLinks = HubSOPLinks;
window.HubEnhancedAuditLog = HubEnhancedAuditLog;
window.HubValidation = HubValidation;

// ============================================
// GLOBAL WRAPPER FUNCTIONS
// These provide backwards compatibility with HTML onclick handlers
// ============================================

// Navigation - Don't override inline script's navigateTo which handles view structure
// window.showPage = (page, filter) => HubNavigation.goto(page, filter);
// window.navigateTo = (page, filter) => HubNavigation.goto(page, filter);

// Cases - Don't override inline script functions
// The inline script's openCase shows full-page detail view (not modal)
// The inline script's loadCasesView creates correct table structure with 8 columns
// HubCases functions have different column structure (includes case_id, missing Due/Resolution)
// window.openCase = (caseId) => HubCases.openCase(caseId);  // Inline uses full-page view
// window.closeCase = () => HubCases.closeDetail();
// window.loadCasesView = () => HubCases.loadCases();
window.updateCaseStatus = (status) => HubCases.updateStatus(status);
window.navigateCase = (direction) => HubCases.navigateCase(direction);

// Bulk Actions
window.toggleCaseSelect = (caseId) => HubBulkActions.toggleSelect(caseId);
window.selectAllCases = () => HubBulkActions.selectAll();
window.deselectAllCases = () => HubBulkActions.deselectAll();
window.bulkUpdateStatus = (status) => HubBulkActions.updateStatus(status);

// Auth
window.handleLogin = (event) => {
  event.preventDefault();
  const username = document.getElementById('loginUsername')?.value;
  const password = document.getElementById('loginPassword')?.value;
  HubAuth.login(username, password).then(result => {
    if (result.success) {
      HubApp.init();
    } else {
      const errorEl = document.getElementById('loginError');
      if (errorEl) {
        errorEl.textContent = result.error || 'Login failed';
        errorEl.style.display = 'block';
      }
    }
  });
};
window.logout = () => HubAuth.logout();

// UI
window.showToast = (message, type) => HubUI.showToast(message, type);
window.refresh = () => HubUI.refresh();
window.closeModal = () => HubUI.closeModal();

// Users
window.showUserManagement = () => HubUsers.showManagement();
window.assignCase = (userId, userName) => HubUsers.assignToUser(userId, userName);

// Views
window.saveView = () => HubViews.save();
window.applyView = (viewId) => HubViews.apply(viewId);
window.deleteView = (viewId) => HubViews.delete(viewId);

// Assignment
window.showAssignmentQueue = () => HubAssignment.showQueue();

// Audit Log
window.showAuditLog = () => HubEnhancedAuditLog.show();

// Profile modal wrapper
window.showProfileModal = () => {
  const user = HubState.currentUser || {};
  HubUI.showModal(`
    <div class="modal-header" style="padding:20px 24px;">
      <div class="modal-title" style="font-size:18px;">Edit Profile</div>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="modal-body" style="padding:24px;">
      <div class="form-group">
        <label>Display Name</label>
        <input type="text" id="profileName" class="form-input" value="${user.name || ''}" placeholder="Your name">
      </div>
      <div class="form-group">
        <label>Email Address</label>
        <input type="email" id="profileEmail" class="form-input" value="${user.username || ''}" readonly>
      </div>
      <button class="btn btn-primary" style="width:100%;margin-top:16px;" onclick="updateProfile()">Save Changes</button>
    </div>
  `);
};

window.updateProfile = async () => {
  const name = document.getElementById('profileName')?.value;
  if (name && HubState.currentUser) {
    HubState.currentUser.name = name;
    localStorage.setItem('hub_user', JSON.stringify(HubState.currentUser));
    HubUI.showToast('Profile updated', 'success');
    HubUI.closeModal();
    // Update sidebar display
    const userNameEl = document.querySelector('.user-name');
    const avatarEl = document.querySelector('.user-avatar');
    if (userNameEl) userNameEl.textContent = name;
    if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();
  }
};

// Filter helpers
window.filterSessions = (filter) => {
  window.currentSessionFilter = filter;
  // Update tab buttons
  document.querySelectorAll('[id^="tab"]').forEach(btn => {
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
  });
  const activeTab = document.getElementById('tab' + filter.charAt(0).toUpperCase() + filter.slice(1));
  if (activeTab) {
    activeTab.classList.remove('btn-secondary');
    activeTab.classList.add('btn-primary');
  }
  // Re-render sessions with filter
  if (typeof renderFilteredSessions === 'function') {
    renderFilteredSessions(filter);
  }
};

// Utility functions
window.formatDate = (d) => {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('en-US', {year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
  } catch { return '-'; }
};

window.timeAgo = (timestamp) => {
  if (!timestamp) return '-';
  const now = Date.now();
  const date = new Date(timestamp).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return minutes + 'm ago';
  if (hours < 24) return hours + 'h ago';
  if (days < 7) return days + 'd ago';
  return formatDate(timestamp);
};

window.escapeHtml = (text) => {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};
