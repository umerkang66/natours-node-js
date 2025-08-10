// Admin Tours Management JavaScript
class AdminTours {
  constructor() {
    this.tours = [];
    this.currentPage = 1;
    this.itemsPerPage = 10;
    this.totalPages = 1;
    this.filters = {
      search: '',
      difficulty: '',
      priceRange: '',
      duration: ''
    };
    this.init();
  }

  async init() {
    try {
      // Since we're already authenticated via cookies in the view routes,
      // we don't need to check authentication here
      await this.loadTours();
      this.setupEventListeners();
      this.setupFilters();
    } catch (error) {
      console.error('Tours management initialization failed:', error);
      this.showMessage('Failed to initialize tours management', 'error');
    }
  }

  async loadTours() {
    try {
      this.showLoading(true);
      
      const queryParams = new URLSearchParams({
        page: this.currentPage,
        limit: this.itemsPerPage,
        ...this.filters
      });

      // Make request without Authorization header - cookies will handle auth
      const response = await fetch(`/api/v1/tours?${queryParams}`);

      if (!response.ok) {
        throw new Error('Failed to fetch tours');
      }

      const data = await response.json();
      this.tours = data.data.tours || [];
      this.totalPages = Math.ceil((data.results || 0) / this.itemsPerPage);
      
      this.renderToursTable();
      this.renderPagination();
      this.showLoading(false);
    } catch (error) {
      console.error('Failed to load tours:', error);
      this.showMessage('Failed to load tours', 'error');
      this.showLoading(false);
    }
  }

  renderToursTable() {
    const tbody = document.getElementById('toursTableBody');
    if (!tbody) return;

    if (this.tours.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="admin-empty">
            <svg class="admin-empty__icon">
              <use(xlink:href='/img/icons.svg#icon-map')></use>
            </svg>
            <h3 class="admin-empty__title">No tours found</h3>
            <p class="admin-empty__message">Create your first tour to get started</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.tours.map(tour => `
      <tr data-tour-id="${tour._id}">
        <td>
          <input type="checkbox" class="admin-table__checkbox tour-checkbox" value="${tour._id}">
        </td>
        <td>
          <div class="admin-tour-info">
            <img src="${tour.imageCover || '/img/tours/default.jpg'}" alt="${tour.name}" class="admin-image-preview">
            <div>
              <strong>${tour.name}</strong>
              <br>
              <small>${tour.startLocation?.description || 'No location'}</small>
            </div>
          </div>
        </td>
        <td>${tour.difficulty}</td>
        <td>${tour.duration} days</td>
        <td>$${tour.price}</td>
        <td>
          <span class="admin-status admin-status--${tour.active ? 'confirmed' : 'cancelled'}">
            ${tour.active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>${new Date(tour.createdAt).toLocaleDateString()}</td>
        <td>
          <div class="admin-actions">
            <button class="admin-action-btn admin-action-btn--view" onclick="adminTours.viewTour('${tour._id}')">
              <svg><use(xlink:href='/img/icons.svg#icon-eye')></use></svg>
            </button>
            <button class="admin-action-btn admin-action-btn--edit" onclick="adminTours.editTour('${tour._id}')">
              <svg><use(xlink:href='/img/icons.svg#icon-edit')></use></svg>
            </button>
            <button class="admin-action-btn admin-action-btn--delete" onclick="adminTours.deleteTour('${tour._id}')">
              <svg><use(xlink:href='/img/icons.svg#icon-trash')></use></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  renderPagination() {
    const pagination = document.getElementById('toursPagination');
    if (!pagination) return;

    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
      <button class="admin-pagination__btn" ${this.currentPage === 1 ? 'disabled' : ''} onclick="adminTours.goToPage(${this.currentPage - 1})">
        Previous
      </button>
    `;

    // Page numbers
    for (let i = 1; i <= this.totalPages; i++) {
      if (
        i === 1 || 
        i === this.totalPages || 
        (i >= this.currentPage - 2 && i <= this.currentPage + 2)
      ) {
        paginationHTML += `
          <button class="admin-pagination__btn ${i === this.currentPage ? 'admin-pagination__btn--active' : ''}" onclick="adminTours.goToPage(${i})">
            ${i}
          </button>
        `;
      } else if (
        i === this.currentPage - 3 || 
        i === this.currentPage + 3
      ) {
        paginationHTML += '<span class="admin-pagination__dots">...</span>';
      }
    }

    // Next button
    paginationHTML += `
      <button class="admin-pagination__btn" ${this.currentPage === this.totalPages ? 'disabled' : ''} onclick="adminTours.goToPage(${this.currentPage + 1})">
        Next
      </button>
    `;

    pagination.innerHTML = paginationHTML;
  }

  async goToPage(page) {
    if (page < 1 || page > this.totalPages) return;
    
    this.currentPage = page;
    await this.loadTours();
    
    // Scroll to top of table
    const table = document.querySelector('.admin-table-container');
    if (table) {
      table.scrollIntoView({ behavior: 'smooth' });
    }
  }

  setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('tourSearch');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.filters.search = e.target.value;
          this.currentPage = 1;
          this.loadTours();
        }, 500);
      });
    }

    // Filter changes
    const difficultyFilter = document.getElementById('difficultyFilter');
    if (difficultyFilter) {
      difficultyFilter.addEventListener('change', (e) => {
        this.filters.difficulty = e.target.value;
        this.currentPage = 1;
        this.loadTours();
      });
    }

    const priceFilter = document.getElementById('priceFilter');
    if (priceFilter) {
      priceFilter.addEventListener('change', (e) => {
        this.filters.priceRange = e.target.value;
        this.currentPage = 1;
        this.loadTours();
      });
    }

    const durationFilter = document.getElementById('durationFilter');
    if (durationFilter) {
      durationFilter.addEventListener('change', (e) => {
        this.filters.duration = e.target.value;
        this.currentPage = 1;
        this.loadTours();
      });
    }

    // Select all checkbox
    const selectAllCheckbox = document.getElementById('selectAllTours');
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', (e) => {
        const tourCheckboxes = document.querySelectorAll('.tour-checkbox');
        tourCheckboxes.forEach(checkbox => {
          checkbox.checked = e.target.checked;
        });
      });
    }

    // Bulk actions
    const bulkActions = document.getElementById('bulkActions');
    if (bulkActions) {
      bulkActions.addEventListener('change', (e) => {
        const selectedTours = this.getSelectedTours();
        if (selectedTours.length === 0) {
          e.target.value = '';
          return;
        }

        const action = e.target.value;
        if (action === 'delete') {
          this.bulkDeleteTours(selectedTours);
        } else if (action === 'activate') {
          this.bulkActivateTours(selectedTours);
        } else if (action === 'deactivate') {
          this.bulkDeactivateTours(selectedTours);
        }

        e.target.value = '';
      });
    }

    // Modal events
    this.setupModalEvents();
  }

  setupFilters() {
    // Populate difficulty filter
    const difficultyFilter = document.getElementById('difficultyFilter');
    if (difficultyFilter) {
      const difficulties = ['easy', 'medium', 'difficult'];
      difficulties.forEach(difficulty => {
        const option = document.createElement('option');
        option.value = difficulty;
        option.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
        difficultyFilter.appendChild(option);
      });
    }

    // Populate price range filter
    const priceFilter = document.getElementById('priceFilter');
    if (priceFilter) {
      const priceRanges = [
        { value: '0-100', label: '$0 - $100' },
        { value: '100-500', label: '$100 - $500' },
        { value: '500-1000', label: '$500 - $1000' },
        { value: '1000+', label: '$1000+' }
      ];
      
      priceRanges.forEach(range => {
        const option = document.createElement('option');
        option.value = range.value;
        option.textContent = range.label;
        priceFilter.appendChild(option);
      });
    }

    // Populate duration filter
    const durationFilter = document.getElementById('durationFilter');
    if (durationFilter) {
      const durations = [
        { value: '1-3', label: '1-3 days' },
        { value: '4-7', label: '4-7 days' },
        { value: '8-14', label: '8-14 days' },
        { value: '15+', label: '15+ days' }
      ];
      
      durations.forEach(duration => {
        const option = document.createElement('option');
        option.value = duration.value;
        option.textContent = duration.label;
        durationFilter.appendChild(option);
      });
    }
  }

  setupModalEvents() {
    // Tour modal
    const tourModal = document.getElementById('tourModal');
    const closeTourModal = document.getElementById('closeTourModal');
    const cancelTour = document.getElementById('cancelTour');
    const tourForm = document.getElementById('tourForm');

    if (closeTourModal) {
      closeTourModal.addEventListener('click', () => this.closeTourModal());
    }

    if (cancelTour) {
      cancelTour.addEventListener('click', () => this.closeTourModal());
    }

    if (tourForm) {
      tourForm.addEventListener('submit', (e) => this.handleTourSubmit(e));
    }

    // Delete modal
    const deleteModal = document.getElementById('deleteTourModal');
    const closeDeleteModal = document.getElementById('closeDeleteTourModal');
    const cancelDelete = document.getElementById('cancelDeleteTour');
    const confirmDelete = document.getElementById('confirmDeleteTour');

    if (closeDeleteModal) {
      closeDeleteModal.addEventListener('click', () => this.closeDeleteModal());
    }

    if (cancelDelete) {
      cancelDelete.addEventListener('click', () => this.closeDeleteModal());
    }

    if (confirmDelete) {
      confirmDelete.addEventListener('click', () => this.confirmDeleteTour());
    }

    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('admin-modal__overlay')) {
        this.closeAllModals();
      }
    });
  }

  openTourModal(tourId = null) {
    const modal = document.getElementById('tourModal');
    const title = document.getElementById('tourModalTitle');
    const form = document.getElementById('tourForm');

    if (tourId) {
      // Edit mode
      title.textContent = 'Edit Tour';
      this.loadTourData(tourId);
      form.dataset.tourId = tourId;
    } else {
      // Add mode
      title.textContent = 'Add New Tour';
      form.reset();
      delete form.dataset.tourId;
    }

    modal.classList.add('admin-modal--active');
  }

  closeTourModal() {
    const modal = document.getElementById('tourModal');
    modal.classList.remove('admin-modal--active');
  }

  openDeleteModal(tourId) {
    const modal = document.getElementById('deleteTourModal');
    modal.dataset.tourId = tourId;
    modal.classList.add('admin-modal--active');
  }

  closeDeleteModal() {
    const modal = document.getElementById('deleteTourModal');
    modal.classList.remove('admin-modal--active');
  }

  closeAllModals() {
    document.querySelectorAll('.admin-modal').forEach(modal => {
      modal.classList.remove('admin-modal--active');
    });
  }

  async loadTourData(tourId) {
    try {
      // Make request without Authorization header - cookies will handle auth
      const response = await fetch(`/api/v1/tours/${tourId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch tour data');
      }

      const tour = await response.json();
      this.populateTourForm(tour.data.tour);
    } catch (error) {
      console.error('Failed to load tour data:', error);
      this.showMessage('Failed to load tour data', 'error');
    }
  }

  populateTourForm(tour) {
    const form = document.getElementById('tourForm');
    if (!form) return;

    // Populate form fields
    const fields = ['name', 'description', 'duration', 'maxGroupSize', 'difficulty', 'price', 'discount'];
    fields.forEach(field => {
      const input = form.querySelector(`[name="${field}"]`);
      if (input) {
        input.value = tour[field] || '';
      }
    });

    // Handle select fields
    const difficultySelect = form.querySelector('[name="difficulty"]');
    if (difficultySelect) {
      difficultySelect.value = tour.difficulty || '';
    }

    // Handle textarea
    const descriptionTextarea = form.querySelector('[name="description"]');
    if (descriptionTextarea) {
      descriptionTextarea.value = tour.description || '';
    }

    // Handle checkbox
    const activeCheckbox = form.querySelector('[name="active"]');
    if (activeCheckbox) {
      activeCheckbox.checked = tour.active || false;
    }
  }

  async handleTourSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const tourId = form.dataset.tourId;
    const formData = new FormData(form);
    
    try {
      this.showLoading(true);
      
      const tourData = Object.fromEntries(formData.entries());
      
      // Convert string values to appropriate types
      tourData.duration = parseInt(tourData.duration);
      tourData.maxGroupSize = parseInt(tourData.maxGroupSize);
      tourData.price = parseFloat(tourData.price);
      tourData.discount = parseFloat(tourData.discount);
      tourData.active = formData.get('active') === 'on';

      const url = tourId ? `/api/v1/tours/${tourId}` : '/api/v1/tours';
      const method = tourId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tourData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save tour');
      }

      this.showMessage(
        tourId ? 'Tour updated successfully' : 'Tour created successfully', 
        'success'
      );
      
      this.closeTourModal();
      await this.loadTours();
      
    } catch (error) {
      console.error('Failed to save tour:', error);
      this.showMessage(error.message || 'Failed to save tour', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  async deleteTour(tourId) {
    this.openDeleteModal(tourId);
  }

  async confirmDeleteTour() {
    const modal = document.getElementById('deleteTourModal');
    const tourId = modal.dataset.tourId;
    
    try {
      this.showLoading(true);
      
      // Make request without Authorization header - cookies will handle auth
      const response = await fetch(`/api/v1/tours/${tourId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete tour');
      }

      this.showMessage('Tour deleted successfully', 'success');
      this.closeDeleteModal();
      await this.loadTours();
      
    } catch (error) {
      console.error('Failed to delete tour:', error);
      this.showMessage('Failed to delete tour', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  async viewTour(tourId) {
    window.location.href = `/admin/tours/${tourId}`;
  }

  async editTour(tourId) {
    this.openTourModal(tourId);
  }

  getSelectedTours() {
    const checkboxes = document.querySelectorAll('.tour-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.value);
  }

  async bulkDeleteTours(tourIds) {
    if (!confirm(`Are you sure you want to delete ${tourIds.length} tours?`)) {
      return;
    }

    try {
      this.showLoading(true);
      
      const promises = tourIds.map(id => 
        // Make request without Authorization header - cookies will handle auth
        fetch(`/api/v1/tours/${id}`, {
          method: 'DELETE'
        })
      );

      await Promise.all(promises);
      
      this.showMessage(`${tourIds.length} tours deleted successfully`, 'success');
      await this.loadTours();
      
    } catch (error) {
      console.error('Bulk delete failed:', error);
      this.showMessage('Failed to delete tours', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  async bulkActivateTours(tourIds) {
    try {
      this.showLoading(true);
      
      const promises = tourIds.map(id => 
        // Make request without Authorization header - cookies will handle auth
        fetch(`/api/v1/tours/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ active: true })
        })
      );

      await Promise.all(promises);
      
      this.showMessage(`${tourIds.length} tours activated successfully`, 'success');
      await this.loadTours();
      
    } catch (error) {
      console.error('Bulk activate failed:', error);
      this.showMessage('Failed to activate tours', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  async bulkDeactivateTours(tourIds) {
    try {
      this.showLoading(true);
      
      const promises = tourIds.map(id => 
        // Make request without Authorization header - cookies will handle auth
        fetch(`/api/v1/tours/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ active: false })
        })
      );

      await Promise.all(promises);
      
      this.showMessage(`${tourIds.length} tours deactivated successfully`, 'success');
      await this.loadTours();
      
    } catch (error) {
      console.error('Bulk deactivate failed:', error);
      this.showMessage('Failed to deactivate tours', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  showLoading(show) {
    const loading = document.getElementById('adminLoading');
    if (loading) {
      if (show) {
        loading.classList.add('admin-loading--active');
      } else {
        loading.classList.remove('admin-loading--active');
      }
    }
  }

  showMessage(message, type = 'info') {
    const messageContainer = document.createElement('div');
    messageContainer.className = `admin-message admin-message--${type}`;
    messageContainer.innerHTML = `
      <svg class="admin-message__icon">
        <use(xlink:href='/img/icons.svg#icon-${this.getMessageIcon(type)}')></use>
      </svg>
      <span class="admin-message__text">${message}</span>
    `;

    // Insert at the top of the content area
    const content = document.querySelector('.admin-content');
    if (content) {
      content.insertBefore(messageContainer, content.firstChild);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        messageContainer.remove();
      }, 5000);
    }
  }

  getMessageIcon(type) {
    switch (type) {
      case 'success': return 'check';
      case 'error': return 'x';
      case 'warning': return 'alert-triangle';
      default: return 'info';
    }
  }
}

// Initialize tours management when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.adminTours = new AdminTours();
});

// Export for potential use in other modules
window.AdminTours = AdminTours;
