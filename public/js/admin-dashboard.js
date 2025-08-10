// Admin Dashboard JavaScript
class AdminDashboard {
  constructor() {
    this.currentUser = null;
    this.stats = {};
    this.charts = {};
    this.init();
  }

  async init() {
    try {
      await this.checkAuth();
      await this.loadDashboardData();
      this.setupEventListeners();
      this.setupCharts();
      this.updateActiveNav();
    } catch (error) {
      console.error('Dashboard initialization failed:', error);
      this.showMessage('Failed to initialize dashboard', 'error');
    }
  }

  async checkAuth() {
    try {
      const response = await fetch('/api/v1/users/me', {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const user = await response.json();
      if (user.data.user.role !== 'admin') {
        window.location.href = '/';
        return;
      }

      this.currentUser = user.data.user;
      this.updateUserInfo();
    } catch (error) {
      console.error('Auth check failed:', error);
      window.location.href = '/login';
    }
  }

  getToken() {
    return localStorage.getItem('jwt') || sessionStorage.getItem('jwt');
  }

  updateUserInfo() {
    const userInfoElement = document.getElementById('userInfo');
    if (userInfoElement && this.currentUser) {
      userInfoElement.innerHTML = `
        <div class="admin-user-info">
          <img src="${this.currentUser.photo || '/img/users/default.jpeg'}" alt="${this.currentUser.name}" class="admin-user-avatar">
          <div class="admin-user-details">
            <span class="admin-user-name">${this.currentUser.name}</span>
            <span class="admin-user-role">${this.currentUser.role}</span>
          </div>
        </div>
      `;
    }
  }

  async loadDashboardData() {
    try {
      this.showLoading(true);
      
      // Load stats
      await this.loadStats();
      
      // Load recent data
      await this.loadRecentData();
      
      this.showLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      this.showMessage('Failed to load dashboard data', 'error');
      this.showLoading(false);
    }
  }

  async loadStats() {
    try {
      const [toursResponse, usersResponse, bookingsResponse, reviewsResponse] = await Promise.all([
        fetch('/api/v1/tours', { headers: { 'Authorization': `Bearer ${this.getToken()}` } }),
        fetch('/api/v1/users', { headers: { 'Authorization': `Bearer ${this.getToken()}` } }),
        fetch('/api/v1/bookings', { headers: { 'Authorization': `Bearer ${this.getToken()}` } }),
        fetch('/api/v1/reviews', { headers: { 'Authorization': `Bearer ${this.getToken()}` } })
      ]);

      const tours = await toursResponse.json();
      const users = await usersResponse.json();
      const bookings = await bookingsResponse.json();
      const reviews = await reviewsResponse.json();

      this.stats = {
        totalTours: tours.results || 0,
        totalUsers: users.results || 0,
        totalBookings: bookings.results || 0,
        totalReviews: reviews.results || 0
      };

      this.updateStatsDisplay();
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  async loadRecentData() {
    try {
      const [recentTours, recentBookings, recentReviews] = await Promise.all([
        fetch('/api/v1/tours?limit=5&sort=-createdAt', { headers: { 'Authorization': `Bearer ${this.getToken()}` } }),
        fetch('/api/v1/bookings?limit=5&sort=-createdAt', { headers: { 'Authorization': `Bearer ${this.getToken()}` } }),
        fetch('/api/v1/reviews?limit=5&sort=-createdAt', { headers: { 'Authorization': `Bearer ${this.getToken()}` } })
      ]);

      const tours = await recentTours.json();
      const bookings = await recentBookings.json();
      const reviews = await recentReviews.json();

      this.updateRecentTours(tours.data?.tours || []);
      this.updateRecentBookings(bookings.data?.bookings || []);
      this.updateRecentReviews(reviews.data?.reviews || []);
    } catch (error) {
      console.error('Failed to load recent data:', error);
    }
  }

  updateStatsDisplay() {
    const statsContainer = document.getElementById('adminStats');
    if (!statsContainer) return;

    statsContainer.innerHTML = `
      <div class="admin-stat-card">
        <div class="admin-stat-card__header">
          <span class="admin-stat-card__title">Total Tours</span>
          <svg class="admin-stat-card__icon">
            <use(xlink:href='/img/icons.svg#icon-map')></use>
          </svg>
        </div>
        <p class="admin-stat-card__value">${this.stats.totalTours}</p>
        <p class="admin-stat-card__change">+12% from last month</p>
      </div>
      
      <div class="admin-stat-card">
        <div class="admin-stat-card__header">
          <span class="admin-stat-card__title">Total Users</span>
          <svg class="admin-stat-card__icon">
            <use(xlink:href='/img/icons.svg#icon-users')></use>
          </svg>
        </div>
        <p class="admin-stat-card__value">${this.stats.totalUsers}</p>
        <p class="admin-stat-card__change">+8% from last month</p>
      </div>
      
      <div class="admin-stat-card">
        <div class="admin-stat-card__header">
          <span class="admin-stat-card__title">Total Bookings</span>
          <svg class="admin-stat-card__icon">
            <use(xlink:href='/img/icons.svg#icon-credit-card')></use>
          </svg>
        </div>
        <p class="admin-stat-card__value">${this.stats.totalBookings}</p>
        <p class="admin-stat-card__change">+15% from last month</p>
      </div>
      
      <div class="admin-stat-card">
        <div class="admin-stat-card__header">
          <span class="admin-stat-card__title">Total Reviews</span>
          <svg class="admin-stat-card__icon">
            <use(xlink:href='/img/icons.svg#icon-star')></use>
          </svg>
        </div>
        <p class="admin-stat-card__value">${this.stats.totalReviews}</p>
        <p class="admin-stat-card__change">+22% from last month</p>
      </div>
    `;
  }

  updateRecentTours(tours) {
    const container = document.getElementById('recentTours');
    if (!container) return;

    if (tours.length === 0) {
      container.innerHTML = `
        <div class="admin-empty">
          <svg class="admin-empty__icon">
            <use(xlink:href='/img/icons.svg#icon-map')></use>
          </svg>
          <h3 class="admin-empty__title">No tours yet</h3>
          <p class="admin-empty__message">Create your first tour to get started</p>
        </div>
      `;
      return;
    }

    container.innerHTML = tours.map(tour => `
      <div class="admin-recent-item">
        <img src="${tour.imageCover || '/img/tours/default.jpg'}" alt="${tour.name}" class="admin-recent-item__image">
        <div class="admin-recent-item__content">
          <h4 class="admin-recent-item__title">${tour.name}</h4>
          <p class="admin-recent-item__subtitle">${tour.difficulty} • ${tour.duration} days</p>
          <p class="admin-recent-item__price">$${tour.price}</p>
        </div>
        <div class="admin-recent-item__actions">
          <a href="/admin/tours/${tour._id}" class="admin-action-btn admin-action-btn--view">
            <svg><use(xlink:href='/img/icons.svg#icon-eye')></use></svg>
          </a>
        </div>
      </div>
    `).join('');
  }

  updateRecentBookings(bookings) {
    const container = document.getElementById('recentBookings');
    if (!container) return;

    if (bookings.length === 0) {
      container.innerHTML = `
        <div class="admin-empty">
          <svg class="admin-empty__icon">
            <use(xlink:href='/img/icons.svg#icon-credit-card')></use>
          </svg>
          <h3 class="admin-empty__title">No bookings yet</h3>
          <p class="admin-empty__message">Bookings will appear here once users start booking tours</p>
        </div>
      `;
      return;
    }

    container.innerHTML = bookings.map(booking => `
      <div class="admin-recent-item">
        <div class="admin-recent-item__content">
          <h4 class="admin-recent-item__title">${booking.tour?.name || 'Tour'}</h4>
          <p class="admin-recent-item__subtitle">${booking.user?.name || 'User'}</p>
          <p class="admin-recent-item__price">$${booking.price}</p>
          <span class="admin-status admin-status--${booking.status}">${booking.status}</span>
        </div>
        <div class="admin-recent-item__actions">
          <a href="/admin/bookings/${booking._id}" class="admin-action-btn admin-action-btn--view">
            <svg><use(xlink:href='/img/icons.svg#icon-eye')></use></svg>
          </a>
        </div>
      </div>
    `).join('');
  }

  updateRecentReviews(reviews) {
    const container = document.getElementById('recentReviews');
    if (!container) return;

    if (reviews.length === 0) {
      container.innerHTML = `
        <div class="admin-empty">
          <svg class="admin-empty__icon">
            <use(xlink:href='/img/icons.svg#icon-star')></use>
          </svg>
          <h3 class="admin-empty__title">No reviews yet</h3>
          <p class="admin-empty__message">Reviews will appear here once users start reviewing tours</p>
        </div>
      `;
      return;
    }

    container.innerHTML = reviews.map(review => `
      <div class="admin-recent-item">
        <div class="admin-recent-item__content">
          <h4 class="admin-recent-item__title">${review.tour?.name || 'Tour'}</h4>
          <p class="admin-recent-item__subtitle">${review.user?.name || 'User'}</p>
          <div class="admin-review-rating">
            ${this.generateStarRating(review.rating)}
          </div>
          <p class="admin-recent-item__text">${review.review.substring(0, 100)}${review.review.length > 100 ? '...' : ''}</p>
        </div>
        <div class="admin-recent-item__actions">
          <a href="/admin/reviews/${review._id}" class="admin-action-btn admin-action-btn--view">
            <svg><use(xlink:href='/img/icons.svg#icon-eye')></use></svg>
          </a>
        </div>
      </div>
    `).join('');
  }

  generateStarRating(rating) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(`
        <svg class="admin-star ${i <= rating ? 'admin-star--filled' : 'admin-star--empty'}">
          <use(xlink:href='/img/icons.svg#icon-star')></use>
        </svg>
      `);
    }
    return stars.join('');
  }

  setupCharts() {
    // This would integrate with a charting library like Chart.js
    // For now, we'll create placeholder charts
    this.createRevenueChart();
    this.createBookingsChart();
  }

  createRevenueChart() {
    const chartContainer = document.getElementById('revenueChart');
    if (!chartContainer) return;

    // Placeholder for revenue chart
    chartContainer.innerHTML = `
      <div class="admin-chart-placeholder">
        <h4>Revenue Chart</h4>
        <p>Monthly revenue visualization would go here</p>
        <div class="admin-chart-bars">
          <div class="admin-chart-bar" style="height: 60%"></div>
          <div class="admin-chart-bar" style="height: 80%"></div>
          <div class="admin-chart-bar" style="height: 45%"></div>
          <div class="admin-chart-bar" style="height: 90%"></div>
          <div class="admin-chart-bar" style="height: 70%"></div>
          <div class="admin-chart-bar" style="height: 85%"></div>
        </div>
      </div>
    `;
  }

  createBookingsChart() {
    const chartContainer = document.getElementById('bookingsChart');
    if (!chartContainer) return;

    // Placeholder for bookings chart
    chartContainer.innerHTML = `
      <div class="admin-chart-placeholder">
        <h4>Bookings Overview</h4>
        <p>Recent booking trends would go here</p>
        <div class="admin-chart-pie">
          <div class="admin-chart-slice" style="--slice: 0deg 120deg"></div>
          <div class="admin-chart-slice" style="--slice: 120deg 240deg"></div>
          <div class="admin-chart-slice" style="--slice: 240deg 360deg"></div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Mobile menu toggle
    const mobileToggle = document.getElementById('adminMobileToggle');
    const sidebar = document.querySelector('.admin-sidebar');
    
    if (mobileToggle && sidebar) {
      mobileToggle.addEventListener('click', () => {
        sidebar.classList.toggle('admin-sidebar--open');
      });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 1024 && 
          !e.target.closest('.admin-sidebar') && 
          !e.target.closest('#adminMobileToggle')) {
        sidebar?.classList.remove('admin-sidebar--open');
      }
    });

    // Logout functionality
    const logoutBtn = document.getElementById('adminLogout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }

    // Quick action buttons
    this.setupQuickActions();
  }

  setupQuickActions() {
    const quickActions = document.querySelectorAll('[data-quick-action]');
    quickActions.forEach(action => {
      action.addEventListener('click', (e) => {
        e.preventDefault();
        const actionType = action.dataset.quickAction;
        this.handleQuickAction(actionType);
      });
    });
  }

  handleQuickAction(actionType) {
    switch (actionType) {
      case 'add-tour':
        window.location.href = '/admin/tours/new';
        break;
      case 'add-user':
        window.location.href = '/admin/users/new';
        break;
      case 'view-bookings':
        window.location.href = '/admin/bookings';
        break;
      case 'view-reviews':
        window.location.href = '/admin/reviews';
        break;
      default:
        console.log('Unknown quick action:', actionType);
    }
  }

  updateActiveNav() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.admin-sidebar__link');
    
    navLinks.forEach(link => {
      link.classList.remove('admin-sidebar__link--active');
      if (link.getAttribute('href') === currentPath) {
        link.classList.add('admin-sidebar__link--active');
      }
    });
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

  async logout() {
    try {
      // Clear local storage
      localStorage.removeItem('jwt');
      sessionStorage.removeItem('jwt');
      
      // Redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/login';
    }
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AdminDashboard();
});

// Export for potential use in other modules
window.AdminDashboard = AdminDashboard;
