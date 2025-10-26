// Photo Manager Application
class PhotoManager {
  constructor() {
    this.photos = this.loadPhotos();
    this.currentFilter = 'all';
    this.currentView = 'grid';
    this.currentPhotoId = null;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.renderGallery();
    this.updateStats();
  }

  setupEventListeners() {
    // Upload button
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');

    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

    // Drag and drop
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      this.handleFileSelect(e);
    });

    // Filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.filter;
        this.renderGallery();
      });
    });

    // Search
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
      this.searchPhotos(e.target.value);
    });

    // View toggle
    const viewBtns = document.querySelectorAll('.view-btn');
    viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentView = btn.dataset.view;
        this.toggleView();
      });
    });

    // Modal
    const modal = document.getElementById('photoModal');
    const modalClose = document.getElementById('modalClose');
    const modalOverlay = document.querySelector('.modal-overlay');
    const favoriteBtn = document.getElementById('favoriteBtn');
    const deleteBtn = document.getElementById('deleteBtn');

    modalClose.addEventListener('click', () => this.closeModal());
    modalOverlay.addEventListener('click', () => this.closeModal());
    favoriteBtn.addEventListener('click', () => this.toggleFavorite());
    deleteBtn.addEventListener('click', () => this.deletePhoto());
  }

  handleFileSelect(e) {
    const files = e.dataTransfer ? e.dataTransfer.files : e.target.files;

    if (files.length === 0) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const photo = {
            id: Date.now() + Math.random(),
            name: file.name,
            url: event.target.result,
            date: new Date().toISOString(),
            favorite: false
          };
          this.photos.push(photo);
          this.savePhotos();
          this.renderGallery();
          this.updateStats();
        };
        reader.readAsDataURL(file);
      }
    });

    // Reset file input
    if (e.target.files) {
      e.target.value = '';
    }
  }

  filterPhotos() {
    let filtered = this.photos;

    if (this.currentFilter === 'recent') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = this.photos.filter(photo => new Date(photo.date) >= sevenDaysAgo);
    } else if (this.currentFilter === 'favorites') {
      filtered = this.photos.filter(photo => photo.favorite);
    }

    return filtered;
  }

  searchPhotos(query) {
    const searchTerm = query.toLowerCase();
    const gallery = document.getElementById('photoGallery');
    const photoCards = gallery.querySelectorAll('.photo-card');

    photoCards.forEach(card => {
      const photoId = parseInt(card.dataset.photoId);
      const photo = this.photos.find(p => p.id === photoId);

      if (photo && photo.name.toLowerCase().includes(searchTerm)) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  }

  renderGallery() {
    const gallery = document.getElementById('photoGallery');
    const filtered = this.filterPhotos();

    if (filtered.length === 0) {
      gallery.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <h3>No photos found</h3>
          <p>${this.currentFilter === 'all' ? 'Upload your first photo to get started' : `No ${this.currentFilter} photos`}</p>
        </div>
      `;
      return;
    }

    gallery.innerHTML = filtered.map(photo => `
      <div class="photo-card" data-photo-id="${photo.id}" onclick="photoManager.openModal(${photo.id})">
        <img src="${photo.url}" alt="${photo.name}">
        <div class="photo-favorite ${photo.favorite ? 'active' : ''}" onclick="event.stopPropagation(); photoManager.quickToggleFavorite(${photo.id})">
          <svg viewBox="0 0 24 24" fill="${photo.favorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </div>
        <div class="photo-card-overlay">
          <div class="photo-card-title">${photo.name}</div>
          <div class="photo-card-date">${this.formatDate(photo.date)}</div>
        </div>
      </div>
    `).join('');

    this.toggleView();
  }

  toggleView() {
    const gallery = document.getElementById('photoGallery');
    if (this.currentView === 'list') {
      gallery.classList.add('list-view');
    } else {
      gallery.classList.remove('list-view');
    }
  }

  openModal(photoId) {
    const photo = this.photos.find(p => p.id === photoId);
    if (!photo) return;

    this.currentPhotoId = photoId;
    const modal = document.getElementById('photoModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalDate = document.getElementById('modalDate');
    const favoriteBtn = document.getElementById('favoriteBtn');

    modalImage.src = photo.url;
    modalTitle.textContent = photo.name;
    modalDate.textContent = this.formatDate(photo.date);

    favoriteBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="${photo.favorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
      ${photo.favorite ? 'Remove from Favorites' : 'Add to Favorites'}
    `;

    modal.classList.add('active');
  }

  closeModal() {
    const modal = document.getElementById('photoModal');
    modal.classList.remove('active');
    this.currentPhotoId = null;
  }

  toggleFavorite() {
    if (!this.currentPhotoId) return;

    const photo = this.photos.find(p => p.id === this.currentPhotoId);
    if (photo) {
      photo.favorite = !photo.favorite;
      this.savePhotos();
      this.renderGallery();
      this.updateStats();
      this.openModal(this.currentPhotoId); // Refresh modal
    }
  }

  quickToggleFavorite(photoId) {
    const photo = this.photos.find(p => p.id === photoId);
    if (photo) {
      photo.favorite = !photo.favorite;
      this.savePhotos();
      this.renderGallery();
      this.updateStats();
    }
  }

  deletePhoto() {
    if (!this.currentPhotoId) return;

    if (confirm('Are you sure you want to delete this photo?')) {
      this.photos = this.photos.filter(p => p.id !== this.currentPhotoId);
      this.savePhotos();
      this.closeModal();
      this.renderGallery();
      this.updateStats();
    }
  }

  updateStats() {
    const totalPhotos = document.getElementById('totalPhotos');
    const recentPhotos = document.getElementById('recentPhotos');
    const favoritePhotos = document.getElementById('favoritePhotos');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    totalPhotos.textContent = this.photos.length;
    recentPhotos.textContent = this.photos.filter(p => new Date(p.date) >= sevenDaysAgo).length;
    favoritePhotos.textContent = this.photos.filter(p => p.favorite).length;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }

  savePhotos() {
    localStorage.setItem('photoManagerPhotos', JSON.stringify(this.photos));
  }

  loadPhotos() {
    const stored = localStorage.getItem('photoManagerPhotos');
    return stored ? JSON.parse(stored) : [];
  }
}

// Initialize the photo manager when DOM is loaded
let photoManager;
document.addEventListener('DOMContentLoaded', () => {
  photoManager = new PhotoManager();
});
