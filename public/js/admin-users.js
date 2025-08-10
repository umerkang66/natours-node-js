// Admin Users Management JavaScript
class AdminUsers {
  constructor() {
    this.users = [];
    this.currentPage = 1;
    this.itemsPerPage = 10;
    this.totalPages = 1;
    this.filters = {
      search: '',
      role: '',
      active: ''
    };
    this.init();
  }

  async init() {
    try {
      await this.loadUsers();
      this.setupEventListeners();
      this.setupFilters();
    } catch (error) {
      console.error('Users management initialization failed:', error);
      this.showMessage('Failed to initialize users management', 'error');
    }
  }

  async loadUsers() {
    try {
      this.showLoading(true);
      
      const queryParams = new URLSearchParams({
        page: this.currentPage,
        limit: this.itemsPerPage,
        ...this.filters
      });

      const response = await fetch(`/api/v1/users?${queryParams}`);

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      this.users = data.data.users || [];
      this.totalPages = Math.ceil((data.results || 0) / this.itemsPerPage);
      
      this.renderUsersTable();
      this.renderPagination();
      this.showLoading(false);
    } catch (error) {
      console.error('Failed to load users:', error);
      this.showMessage('Failed to load users', 'error');
      this.showLoading(false);
    }
  }

  renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (this.users.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="admin-empty">
            <svg class="admin-empty__icon">
              <use(xlink:href='/img/icons.svg#icon-user')></use>
            </svg>
            <h3 class="admin-empty__title">No users found</h3>
            <p class="admin-empty__message">Create your first user to get started</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.users.map(user => `
      <tr data-user-id="${user._id}">
        <td>
          <input type="checkbox" class="admin-table__checkbox user-checkbox" value="${user._id}">
        </td>
        <td>
          <div class="admin-user-info">
            <img src="${user.photo || '/img/users/default.jpeg'}" alt="${user.name}" class="admin-image-preview">
            <div>
              <strong>${user.name}</strong>
              <br>
              <small>${user.email}</small>
            </div>
          </div>
        </td>
        <td>
          <span class="admin-role admin-role--${user.role}">
            ${user.role}
          </span>
        </td>
        <td>
          <span class="admin-status admin-status--${user.active ? 'confirmed' : 'cancelled'}">
            ${user.active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>${new Date(user.createdAt).toLocaleDateString()}</td>
        <td>
          <div class="admin-actions">
            <button class="btn btn--small btn--white" onclick="adminUsers.viewUser('${user._id}')">
              <svg class="admin-action-icon">
                <use(xlink:href='/img/icons.svg#icon-eye')></use>
              </svg>
            </button>
            <button class="btn btn--small btn--green" onclick="adminUsers.editUser('${user._id}')">
              <svg class="admin-action-icon">
                <use(xlink:href='/img/icons.svg#icon-edit')></use>
              </svg>
            </button>
            <button class="btn btn--small btn--red" onclick="adminUsers.deleteUser('${user._id}')">
              <svg class="admin-action-icon">
                <use(xlink:href='/img/icons.svg#icon-trash')></use>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  renderPagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    if (this.totalPages <= 1) {
      pagination.innerHTML = '';
      return;
    }

    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
      <button class="btn btn--small btn--white" 
              ${this.currentPage === 1 ? 'disabled' : ''} 
              onclick="adminUsers.goToPage(${this.currentPage - 1})">
        Previous
      </button>
    `;

    // Page numbers
    for (let i = 1; i <= this.totalPages; i++) {
      if (i === 1 || i === this.totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
        paginationHTML += `
          <button class="btn btn--small ${i === this.currentPage ? 'btn--green' : 'btn--white'}" 
                  onclick="adminUsers.goToPage(${i})">
            ${i}
          </button>
        `;
      } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
        paginationHTML += '<span class="pagination-ellipsis">...</span>';
      }
    }

    // Next button
    paginationHTML += `
      <button class="btn btn--small btn--white" 
              ${this.currentPage === this.totalPages ? 'disabled' : ''} 
              onclick="adminUsers.goToPage(${this.currentPage + 1})">
        Next
      </button>
    `;

    pagination.innerHTML = paginationHTML;
  }

  async goToPage(page) {
    if (page < 1 || page > this.totalPages) return;
    
    this.currentPage = page;
    await this.loadUsers();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', this.debounce(() => {
        this.filters.search = searchInput.value;
        this.currentPage = 1;
        this.loadUsers();
      }, 300));
    }

    // Filter selects
    const roleFilter = document.getElementById('roleFilter');
    if (roleFilter) {
      roleFilter.addEventListener('change', () => {
        this.filters.role = roleFilter.value;
        this.currentPage = 1;
        this.loadUsers();
      });
    }

    const activeFilter = document.getElementById('activeFilter');
    if (activeFilter) {
      activeFilter.addEventListener('change', () => {
        this.filters.active = activeFilter.value;
        this.currentPage = 1;
        this.loadUsers();
      });
    }

    // Bulk actions
    const selectAllCheckbox = document.getElementById('selectAllUsers');
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.user-checkbox');
        checkboxes.forEach(checkbox => {
          checkbox.checked = e.target.checked;
        });
      });
    }

    // Bulk action buttons
    const bulkDeleteBtn = document.getElementById('bulkDeleteUsers');
    if (bulkDeleteBtn) {
      bulkDeleteBtn.addEventListener('click', () => {
        const selectedUsers = this.getSelectedUsers();
        if (selectedUsers.length > 0) {
          this.bulkDeleteUsers(selectedUsers);
        }
      });
    }

    const bulkActivateBtn = document.getElementById('bulkActivateUsers');
    if (bulkActivateBtn) {
      bulkActivateBtn.addEventListener('click', () => {
        const selectedUsers = this.getSelectedUsers();
        if (selectedUsers.length > 0) {
          this.bulkActivateUsers(selectedUsers);
        }
      });
    }

    const bulkDeactivateBtn = document.getElementById('bulkDeactivateUsers');
    if (bulkDeactivateBtn) {
      bulkDeactivateBtn.addEventListener('click', () => {
        const selectedUsers = this.getSelectedUsers();
        if (selectedUsers.length > 0) {
          this.bulkDeactivateUsers(selectedUsers);
        }
      });
    }
  }

  setupFilters() {
    // Initialize filter values from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const searchInput = document.getElementById('searchInput');
    const roleFilter = document.getElementById('roleFilter');
    const activeFilter = document.getElementById('activeFilter');

    if (searchInput && urlParams.get('search')) {
      searchInput.value = urlParams.get('search');
      this.filters.search = urlParams.get('search');
    }

    if (roleFilter && urlParams.get('role')) {
      roleFilter.value = urlParams.get('role');
      this.filters.role = urlParams.get('role');
    }

    if (activeFilter && urlParams.get('active')) {
      activeFilter.value = urlParams.get('active');
      this.filters.active = urlParams.get('active');
    }
  }

  async viewUser(userId) {
    try {
      const response = await fetch(`/api/v1/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      
      const user = await response.json();
      
      // For now, just redirect to edit form
      // In a real app, you might want to show a modal with user details
      window.location.href = `/admin/users/${userId}`;
    } catch (error) {
      console.error('Failed to view user:', error);
      this.showMessage('Failed to view user', 'error');
    }
  }

  async editUser(userId) {
    window.location.href = `/admin/users/${userId}`;
  }

  async deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/v1/users/${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete user');

      this.showMessage('User deleted successfully', 'success');
      await this.loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      this.showMessage('Failed to delete user', 'error');
    }
  }

  getSelectedUsers() {
    const checkboxes = document.querySelectorAll('.user-checkbox:checked');
    return Array.from(checkboxes).map(checkbox => checkbox.value);
  }

  async bulkDeleteUsers(userIds) {
    if (!confirm(`Are you sure you want to delete ${userIds.length} users?`)) return;

    try {
      this.showLoading(true);
      
      const deletePromises = userIds.map(userId => 
        fetch(`/api/v1/users/${userId}`, { method: 'DELETE' })
      );

      await Promise.all(deletePromises);
      
      this.showMessage(`${userIds.length} users deleted successfully`, 'success');
      await this.loadUsers();
      this.showLoading(false);
    } catch (error) {
      console.error('Failed to bulk delete users:', error);
      this.showMessage('Failed to delete some users', 'error');
      this.showLoading(false);
    }
  }

  async bulkActivateUsers(userIds) {
    try {
      this.showLoading(true);
      
      const updatePromises = userIds.map(userId => 
        fetch(`/api/v1/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: true })
        })
      );

      await Promise.all(updatePromises);
      
      this.showMessage(`${userIds.length} users activated successfully`, 'success');
      await this.loadUsers();
      this.showLoading(false);
    } catch (error) {
      console.error('Failed to bulk activate users:', error);
      this.showMessage('Failed to activate some users', 'error');
      this.showLoading(false);
    }
  }

  async bulkDeactivateUsers(userIds) {
    try {
      this.showLoading(true);
      
      const updatePromises = userIds.map(userId => 
        fetch(`/api/v1/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: false })
        })
      );

      await Promise.all(updatePromises);
      
      this.showMessage(`${userIds.length} users deactivated successfully`, 'success');
      await this.loadUsers();
      this.showLoading(false);
    } catch (error) {
      console.error('Failed to bulk deactivate users:', error);
      this.showMessage('Failed to deactivate some users', 'error');
      this.showLoading(false);
    }
  }

  showLoading(show) {
    const loading = document.getElementById('adminLoading');
    if (loading) {
      loading.style.display = show ? 'flex' : 'none';
    }
  }

  showMessage(message, type = 'info') {
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `admin-message admin-message--${type}`;
    messageEl.innerHTML = `
      <svg class="admin-message__icon">
        <use(xlink:href='/img/icons.svg#icon-${this.getMessageIcon(type)}')></use>
      </svg>
      <span class="admin-message__text">${message}</span>
      <button class="admin-message__close" onclick="this.parentElement.remove()">
        <svg>
          <use(xlink:href='/img/icons.svg#icon-x')></use>
        </svg>
      </button>
    `;

    // Add to page
    const container = document.querySelector('.admin-content') || document.body;
    container.appendChild(messageEl);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageEl.parentElement) {
        messageEl.remove();
      }
    }, 5000);
  }

  getMessageIcon(type) {
    switch (type) {
      case 'success': return 'check';
      case 'error': return 'alert-triangle';
      case 'warning': return 'alert-circle';
      default: return 'info';
    }
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.adminUsers = new AdminUsers();
});
