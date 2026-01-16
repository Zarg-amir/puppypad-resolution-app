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
  ITEMS_PER_PAGE: 50
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
  casesPage: 1,  // Renamed from currentPage to avoid conflict with navigation
  totalPages: 1,

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

  updateUI() {
    const count = HubState.selectedCaseIds.size;
    const toolbar = document.getElementById('bulkActionsToolbar');

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

  showAssignModal(caseIds) {
    this.load().then(() => {
      const html = `
        <div class="modal-overlay active" id="assignModal">
          <div class="modal" style="max-width: 400px;">
            <div class="modal-header" style="padding: 20px 24px;">
              <div class="modal-header-content">
                <div class="modal-title" style="font-size: 18px;">Assign ${caseIds.length} Case(s)</div>
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

  async confirmAssign() {
    const userId = document.getElementById('assignToUser').value;
    document.getElementById('assignModal').remove();
    await HubBulkActions.assign(userId ? parseInt(userId) : null);
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
      if (HubState.currentSearch) {
        url += `&search=${encodeURIComponent(HubState.currentSearch)}`;
      }

      const result = await HubAPI.get(url);
      HubState.cases = result.cases || [];
      HubState.casesPage = page;
      HubState.totalPages = result.totalPages || 1;

      // Update navigation counts if provided
      if (result.counts) {
        this.updateNavigationCounts(result.counts);
      }

      this.renderCasesList();
    } catch (e) {
      console.error('Failed to load cases:', e);
      HubUI.showToast('Failed to load cases', 'error');
    } finally {
      HubUI.hideLoading();
    }
  },

  renderCasesList() {
    const container = document.getElementById('casesTableBody');
    if (!container) return;

    if (HubState.cases.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="8" class="empty-state">No cases found</td>
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
      
      // Format resolution text
      const resolutionText = this.formatResolution(c.resolution) || 'Pending Review';
      
      return `
      <tr onclick="HubCases.openCase('${c.case_id}')" class="${idx === 0 ? 'keyboard-selected' : ''}">
        <td>
          <input type="checkbox" class="case-checkbox" data-case-id="${c.case_id}"
                 onclick="event.stopPropagation(); HubBulkActions.toggleSelect('${c.case_id}')"
                 ${HubState.selectedCaseIds.has(c.case_id) ? 'checked' : ''}>
        </td>
        <td>
          <div class="customer-info">
            <span class="customer-name">${this.escapeHtml(c.customer_name || 'Unknown')}</span>
            <span class="customer-email">${this.escapeHtml(c.customer_email || '-')}</span>
          </div>
        </td>
        <td><span class="type-badge ${c.case_type}">${c.case_type}</span></td>
        <td><span class="status-badge ${c.status.replace('_', '-')}">${this.formatStatus(c.status)}</span></td>
        <td>
          ${isOverdue ? '<span class="status-badge overdue">Overdue</span>' : '<span class="due-date">' + this.formatDueDate(dueDate) + '</span>'}
        </td>
        <td class="resolution-text">${this.escapeHtml(resolutionText)}</td>
        <td>${c.assigned_to || 'Unassigned'}</td>
        <td class="time-ago">${this.timeAgo(c.created_at)}</td>
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

    let html = '';

    if (HubState.casesPage > 1) {
      html += `<button onclick="HubCases.loadCases(${HubState.casesPage - 1})">Previous</button>`;
    }

    html += `<span>Page ${HubState.casesPage} of ${HubState.totalPages}</span>`;

    if (HubState.casesPage < HubState.totalPages) {
      html += `<button onclick="HubCases.loadCases(${HubState.casesPage + 1})">Next</button>`;
    }

    container.innerHTML = html;
  },

  async openCase(caseId) {
    try {
      const result = await HubAPI.get(`/hub/api/case/${caseId}`);
      if (result.case) {
        HubState.currentCase = result.case;
        HubState.currentCaseIndex = HubState.cases.findIndex(c => c.case_id === caseId);
        HubUI.showCaseModal(result.case);
      }
    } catch (e) {
      HubUI.showToast('Failed to load case', 'error');
    }
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

    // Update URL with slug
    this.updateURL(page, filter);

    // Show/hide views
    ['dashboard', 'cases', 'sessions', 'events', 'issues', 'analytics', 'audit', 'users'].forEach(v => {
      const el = document.getElementById(v + 'View');
      if (el) el.style.display = v === page ? 'block' : 'none';
    });

    // Load data
    if (page === 'cases') {
      HubState.currentFilter = filter || 'all';
      HubCases.loadCases();
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
      users: 'User Management'
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
      const result = await HubAPI.get(`/hub/api/issues?limit=50&offset=${(page - 1) * 50}`);
      this.renderIssues(result.issues || []);
      this.renderPagination(page, result.issues?.length || 0);
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
      this.renderAnalytics(result);
    } catch (e) {
      console.error('Failed to load analytics:', e);
      HubUI.showToast('Failed to load analytics', 'error');
    } finally {
      HubUI.hideLoading();
    }
  },

  renderAnalytics(data) {
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
  },

  renderTrendChart(data) {
    const container = document.getElementById('analyticsTrendChart');
    if (!container) return;

    const casesByDay = data.casesByDay || [];
    const sessionsByDay = data.sessionsByDay || [];

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

    const chartHeight = 200;
    const chartWidth = 600;
    const padding = 40;
    const barWidth = (chartWidth - padding * 2) / Math.max(sortedDates.length, 1);

    let svg = `<svg width="100%" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}" style="overflow: visible;">`;
    
    // Draw grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight - padding * 2) * (i / 5);
      svg += `<line x1="${padding}" y1="${y}" x2="${chartWidth - padding}" y2="${y}" stroke="var(--gray-200)" stroke-width="1"/>`;
    }

    // Draw cases line
    if (casesByDay.length > 0) {
      const points = sortedDates.map((date, idx) => {
        const caseData = casesByDay.find(c => c.date === date);
        const x = padding + idx * barWidth + barWidth / 2;
        const y = chartHeight - padding - ((caseData?.count || 0) / maxValue) * (chartHeight - padding * 2);
        return `${x},${y}`;
      }).join(' ');
      svg += `<polyline points="${points}" fill="none" stroke="#3B82F6" stroke-width="2"/>`;
    }

    // Draw sessions line
    if (sessionsByDay.length > 0) {
      const points = sortedDates.map((date, idx) => {
        const sessionData = sessionsByDay.find(s => s.date === date);
        const x = padding + idx * barWidth + barWidth / 2;
        const y = chartHeight - padding - ((sessionData?.count || 0) / maxValue) * (chartHeight - padding * 2);
        return `${x},${y}`;
      }).join(' ');
      svg += `<polyline points="${points}" fill="none" stroke="#10B981" stroke-width="2"/>`;
    }

    // Draw date labels
    sortedDates.forEach((date, idx) => {
      const x = padding + idx * barWidth + barWidth / 2;
      const dateStr = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      svg += `<text x="${x}" y="${chartHeight - 10}" text-anchor="middle" font-size="10" fill="var(--gray-600)">${dateStr}</text>`;
    });

    svg += '</svg>';

    container.innerHTML = svg;
  },

  renderDonutChart(data) {
    const container = document.getElementById('analyticsCasesByTypeChart');
    if (!container) return;

    const casesByType = data.casesByType || [];
    if (casesByType.length === 0) {
      container.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 40px;">No data available</p>';
      return;
    }

    const total = casesByType.reduce((sum, item) => sum + (item.count || 0), 0);
    if (total === 0) {
      container.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 40px;">No data available</p>';
      return;
    }

    const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
    const size = 150;
    const radius = size / 2 - 10;
    const center = size / 2;

    let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display: block; margin: 0 auto;">`;
    
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
      
      svg += `<path d="M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${colors[idx % colors.length]}" stroke="white" stroke-width="2"/>`;
      
      currentAngle += angle;
    });

    // Center text
    svg += `<text x="${center}" y="${center - 5}" text-anchor="middle" font-size="20" font-weight="700" fill="var(--gray-900)">${total}</text>`;
    svg += `<text x="${center}" y="${center + 15}" text-anchor="middle" font-size="12" fill="var(--gray-600)">Total</text>`;

    svg += '</svg>';

    // Add legend
    const legend = casesByType.map((item, idx) => `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <div style="width: 12px; height: 12px; background: ${colors[idx % colors.length]}; border-radius: 2px;"></div>
        <span style="font-size: 13px; color: var(--gray-700);">${this.escapeHtml(item.case_type || 'Unknown')}</span>
        <span style="font-size: 13px; font-weight: 600; color: var(--gray-900); margin-left: auto;">${item.count || 0}</span>
      </div>
    `).join('');

    container.innerHTML = `<div style="text-align: center;">${svg}</div><div style="margin-top: 16px;">${legend}</div>`;
  },

  renderResolutionTypes(data) {
    const container = document.getElementById('analyticsResolutionTypes');
    if (!container) return;

    const types = (data.resolutionTypes || []).slice(0, 10);
    if (types.length === 0) {
      container.innerHTML = '<p style="color: var(--gray-500);">No data available</p>';
      return;
    }

    container.innerHTML = types.map(r => `
      <div style="padding: 12px 0; border-bottom: 1px solid var(--gray-100);">
        <div style="font-size: 13px; color: var(--gray-700); margin-bottom: 4px;">${this.escapeHtml(r.resolution || 'Unknown')}</div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 16px; font-weight: 600; color: var(--gray-900);">${r.count || 0}</span>
          ${r.total_refund ? `<span style="font-size: 12px; color: var(--gray-500);">${this.formatCurrency(r.total_refund)}</span>` : ''}
        </div>
      </div>
    `).join('');
  },

  renderStatusDistribution(data) {
    const container = document.getElementById('analyticsStatusDistribution');
    if (!container) return;

    const statuses = data.casesByStatus || [];
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
      
      return `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 13px; color: var(--gray-700);">${this.escapeHtml(status)}</span>
            <span style="font-size: 13px; font-weight: 600; color: var(--gray-900);">${count}</span>
          </div>
          <div style="width: 100%; height: 8px; background: var(--gray-100); border-radius: 4px; overflow: hidden;">
            <div style="width: ${width}%; height: 100%; background: ${color}; transition: width 0.3s ease;"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderFlowTypes(data) {
    const container = document.getElementById('analyticsFlowTypes');
    if (!container) return;

    const flows = data.flowTypes || [];
    if (flows.length === 0) {
      container.innerHTML = '<p style="color: var(--gray-500);">No data available</p>';
      return;
    }

    container.innerHTML = flows.map(f => `
      <div style="padding: 12px 0; border-bottom: 1px solid var(--gray-100); display: flex; justify-content: space-between;">
        <span style="font-size: 13px; color: var(--gray-700);">${this.escapeHtml(f.flow_type || 'Unknown')}</span>
        <span style="font-size: 13px; font-weight: 600; color: var(--gray-900);">${f.count || 0}</span>
      </div>
    `).join('');
  },

  renderTeamLeaderboard(data) {
    const container = document.getElementById('analyticsTeamLeaderboard');
    if (!container) return;

    const team = data.teamPerformance || [];
    if (team.length === 0) {
      container.innerHTML = '<p style="color: var(--gray-500);">No data available</p>';
      return;
    }

    container.innerHTML = team.map(t => `
      <div style="padding: 12px 0; border-bottom: 1px solid var(--gray-100);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span style="font-size: 13px; font-weight: 600; color: var(--gray-900);">${this.escapeHtml(t.user_name || 'Unassigned')}</span>
          <span style="font-size: 13px; font-weight: 600; color: var(--gray-900);">${t.cases_completed || 0}</span>
        </div>
        <div style="font-size: 11px; color: var(--gray-500);">
          ${this.formatHours(t.avg_resolution_hours || 0)} avg, ${this.formatCurrency(t.total_refunds || 0)} refunds
        </div>
      </div>
    `).join('');
  },

  renderRootCauseAnalysis(data) {
    const container = document.getElementById('analyticsRootCauseAnalysis');
    if (!container) return;

    const causes = data.rootCauses || [];
    if (causes.length === 0) {
      container.innerHTML = '<p style="color: var(--gray-500);">No data</p>';
      return;
    }

    container.innerHTML = causes.slice(0, 10).map(c => `
      <div style="padding: 12px 0; border-bottom: 1px solid var(--gray-100); display: flex; justify-content: space-between;">
        <span style="font-size: 13px; color: var(--gray-700);">${this.escapeHtml(c.reason || 'Unknown')}</span>
        <span style="font-size: 13px; font-weight: 600; color: var(--gray-900);">${c.count || 0}</span>
      </div>
    `).join('');
  },

  renderResolutionTimeDistribution(data) {
    const container = document.getElementById('analyticsResolutionTimeDist');
    if (!container) return;

    const dist = data.resolutionDistribution || [];
    if (dist.length === 0) {
      container.innerHTML = '<p style="color: var(--gray-500);">No data available</p>';
      return;
    }

    container.innerHTML = dist.map(d => `
      <div style="padding: 12px 0; border-bottom: 1px solid var(--gray-100); display: flex; justify-content: space-between;">
        <span style="font-size: 13px; color: var(--gray-700);">${this.escapeHtml(d.time_bucket || 'Unknown')}</span>
        <span style="font-size: 13px; font-weight: 600; color: var(--gray-900);">${d.count || 0}</span>
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

      // Update sidebar counts
      ['all', 'shipping', 'refund', 'subscription', 'manual'].forEach(type => {
        const el = document.getElementById((type === 'all' ? 'allCases' : type) + 'Count');
        if (el) el.textContent = result[type] || 0;
      });

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

  async loadRecentCases() {
    const container = document.getElementById('recentCasesBody');
    if (!container) return;

    // Show loading spinner
    container.innerHTML = '<tr><td colspan="5" class="loading-spinner"><div class="spinner"></div></td></tr>';

    try {
      const result = await HubAPI.get('/hub/api/cases?page=1&limit=10');
      this.renderRecentCases(result.cases || []);
    } catch (e) {
      console.error('Failed to load recent cases:', e);
      container.innerHTML = '<tr><td colspan="5" class="empty-state">Failed to load recent cases</td></tr>';
    }
  },

  renderRecentCases(cases) {
    const container = document.getElementById('recentCasesBody');
    if (!container) return;

    if (cases.length === 0) {
      container.innerHTML = '<tr><td colspan="5" class="empty-state">No recent cases</td></tr>';
      return;
    }

    container.innerHTML = cases.map(c => {
      const statusClass = c.status ? c.status.replace('_', '-') : 'pending';
      return `
        <tr onclick="HubNavigation.goto('cases', 'all'); HubCases.openCase('${c.case_id}')" style="cursor: pointer;">
          <td class="case-id">${this.escapeHtml(c.case_id || '-')}</td>
          <td>
            <div class="customer-info">
              <span class="customer-name">${this.escapeHtml(c.customer_name || 'Unknown')}</span>
              <span class="customer-email">${this.escapeHtml(c.customer_email || '-')}</span>
            </div>
          </td>
          <td><span class="type-badge ${c.case_type || ''}">${this.escapeHtml(c.case_type || '-')}</span></td>
          <td><span class="status-badge ${statusClass}">${this.formatStatus(c.status || 'pending')}</span></td>
          <td class="time-ago">${this.timeAgo(c.created_at)}</td>
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
