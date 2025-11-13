// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.init();
        this.checkAuthentication();
        this.loadContent();
    }

    init() {
        this.bindEvents();
        this.initializeFormValidation();
    }

    bindEvents() {
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', this.logout.bind(this));

        // Form submission
        document.getElementById('uploadForm').addEventListener('submit', this.handleFormSubmit.bind(this));

        // Content type change handler
        document.getElementById('contentType').addEventListener('change', this.handleTypeChange.bind(this));

        // File input handlers
        document.getElementById('videoFile').addEventListener('change', this.handleVideoSelect.bind(this));
        document.getElementById('thumbnailFile').addEventListener('change', this.handleThumbnailSelect.bind(this));

        // Content management
        document.getElementById('refreshContentBtn').addEventListener('click', this.loadContent.bind(this));
        document.getElementById('searchContent').addEventListener('input', this.handleSearch.bind(this));

        // Tab change handler
        document.getElementById('v-pills-manage-tab').addEventListener('click', () => {
            setTimeout(() => this.loadContent(), 100);
        });
    }

    initializeFormValidation() {
        // Real-time validation
        const inputs = document.querySelectorAll('#uploadForm input, #uploadForm select, #uploadForm textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearValidationError(input));
        });
    }

    async checkAuthentication() {
        try {
            const response = await fetch('/api/auth/me');
            const data = await response.json();

            if (!response.ok || !data.user?.isAdmin) {
                this.redirectToLogin();
                return;
            }

            // Update UI with admin info
            this.updateAdminInfo(data.user);
        } catch (error) {
            console.error('Authentication check failed:', error);
            this.redirectToLogin();
        }
    }

    updateAdminInfo(user) {
        // You can add admin info display here if needed
        console.log('Admin authenticated:', user.username);
    }

    redirectToLogin() {
        window.location.href = '/login.html';
    }

    async logout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            this.redirectToLogin();
        } catch (error) {
            console.error('Logout failed:', error);
            this.redirectToLogin();
        }
    }

    handleTypeChange(event) {
        const type = event.target.value;
        const movieFields = document.getElementById('movieFields');
        const seriesFields = document.getElementById('seriesFields');

        if (type === 'movie') {
            movieFields.style.display = 'block';
            seriesFields.style.display = 'none';
            this.clearSeriesFields();
        } else if (type === 'series') {
            movieFields.style.display = 'none';
            seriesFields.style.display = 'block';
            this.clearMovieFields();
        } else {
            movieFields.style.display = 'none';
            seriesFields.style.display = 'none';
            this.clearMovieFields();
            this.clearSeriesFields();
        }
    }

    clearMovieFields() {
        document.getElementById('contentDuration').value = '';
    }

    clearSeriesFields() {
        document.getElementById('contentSeasons').value = '';
        document.getElementById('contentEpisodes').value = '';
    }

    handleVideoSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.validateVideoFile(file);
        }
    }

    handleThumbnailSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.validateImageFile(file);
            this.showThumbnailPreview(file);
        }
    }

    validateVideoFile(file) {
        const maxSize = 500 * 1024 * 1024; // 500MB
        const input = document.getElementById('videoFile');

        if (file.size > maxSize) {
            this.showFieldError(input, 'Video file size must be less than 500MB');
            return false;
        }

        if (!file.type.startsWith('video/')) {
            this.showFieldError(input, 'Please select a valid video file');
            return false;
        }

        this.clearValidationError(input);
        return true;
    }

    validateImageFile(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const input = document.getElementById('thumbnailFile');

        if (file.size > maxSize) {
            this.showFieldError(input, 'Image file size must be less than 10MB');
            return false;
        }

        if (!file.type.startsWith('image/')) {
            this.showFieldError(input, 'Please select a valid image file');
            return false;
        }

        this.clearValidationError(input);
        return true;
    }

    showThumbnailPreview(file) {
        const preview = document.getElementById('thumbnailPreview');
        const uploadPreview = document.getElementById('uploadPreview');

        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Thumbnail Preview" style="max-width: 200px; max-height: 150px; border-radius: 4px;">`;
            uploadPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            this.showFieldError(field, 'This field is required');
            isValid = false;
        }

        // Type-specific validation
        switch (field.id) {
            case 'contentName':
                if (value && (value.length < 1 || value.length > 200)) {
                    this.showFieldError(field, 'Content name must be between 1 and 200 characters');
                    isValid = false;
                }
                break;

            case 'contentYear':
                const year = parseInt(value);
                const currentYear = new Date().getFullYear();
                if (value && (year < 1900 || year > currentYear + 5)) {
                    this.showFieldError(field, `Year must be between 1900 and ${currentYear + 5}`);
                    isValid = false;
                }
                break;

            case 'contentDescription':
                if (value && (value.length < 1 || value.length > 1000)) {
                    this.showFieldError(field, 'Description must be between 1 and 1000 characters');
                    isValid = false;
                }
                break;

            case 'contentSeasons':
            case 'contentEpisodes':
                if (value && parseInt(value) < 1) {
                    this.showFieldError(field, 'Must be a positive number');
                    isValid = false;
                }
                break;
        }

        if (isValid) {
            this.clearValidationError(field);
        }

        return isValid;
    }

    showFieldError(field, message) {
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');

        const feedback = field.parentNode.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.textContent = message;
        }
    }

    clearValidationError(field) {
        field.classList.remove('is-invalid');
        if (field.value.trim()) {
            field.classList.add('is-valid');
        } else {
            field.classList.remove('is-valid');
        }

        const feedback = field.parentNode.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.textContent = '';
        }
    }

    async handleFormSubmit(event) {
        event.preventDefault();

        // Validate all fields
        const form = event.target;
        const inputs = form.querySelectorAll('input, select, textarea');
        let isFormValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isFormValid = false;
            }
        });

        // Additional type-specific validation
        const type = document.getElementById('contentType').value;
        if (type === 'movie') {
            const duration = document.getElementById('contentDuration').value.trim();
            if (!duration) {
                this.showFieldError(document.getElementById('contentDuration'), 'Duration is required for movies');
                isFormValid = false;
            }
        } else if (type === 'series') {
            const seasons = document.getElementById('contentSeasons').value;
            const episodes = document.getElementById('contentEpisodes').value;

            if (!seasons) {
                this.showFieldError(document.getElementById('contentSeasons'), 'Seasons is required for series');
                isFormValid = false;
            }
            if (!episodes) {
                this.showFieldError(document.getElementById('contentEpisodes'), 'Episodes is required for series');
                isFormValid = false;
            }
        }

        if (!isFormValid) {
            this.showAlert('Please fix all validation errors before submitting', 'danger');
            return;
        }

        // Show progress modal
        this.showProgressModal();

        try {
            const formData = new FormData(form);

            const response = await fetch('/api/admin/content', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                this.showAlert('Content uploaded successfully!', 'success');
                form.reset();
                this.handleTypeChange({ target: { value: '' } }); // Reset type-specific fields
                document.getElementById('uploadPreview').style.display = 'none';

                // Refresh content list if on manage tab
                const manageTab = document.getElementById('v-pills-manage');
                if (manageTab.classList.contains('show')) {
                    this.loadContent();
                }
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showAlert(error.message || 'Failed to upload content', 'danger');
        } finally {
            this.hideProgressModal();
        }
    }

    showProgressModal() {
        const modal = new bootstrap.Modal(document.getElementById('progressModal'));
        modal.show();

        // Simulate progress
        let progress = 0;
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');

        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;

            progressBar.style.width = progress + '%';

            if (progress < 30) {
                progressText.textContent = 'Validating files...';
            } else if (progress < 60) {
                progressText.textContent = 'Uploading files...';
            } else if (progress < 90) {
                progressText.textContent = 'Processing content...';
            }
        }, 200);

        // Store interval ID for cleanup
        this.progressInterval = interval;
    }

    hideProgressModal() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }

        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');

        progressBar.style.width = '100%';
        progressText.textContent = 'Complete!';

        setTimeout(() => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('progressModal'));
            if (modal) {
                modal.hide();
            }

            // Reset progress
            progressBar.style.width = '0%';
            progressText.textContent = 'Preparing upload...';
        }, 1000);
    }

    async loadContent() {
        try {
            const response = await fetch('/api/admin/content');
            const result = await response.json();

            if (response.ok) {
                this.displayContent(result.data || []);
            } else {
                throw new Error(result.error || 'Failed to load content');
            }
        } catch (error) {
            console.error('Load content error:', error);
            this.showAlert('Failed to load content', 'danger');
        }
    }

    displayContent(contentList) {
        const tbody = document.getElementById('contentTableBody');
        const noContent = document.getElementById('noContent');

        if (!contentList || contentList.length === 0) {
            tbody.innerHTML = '';
            noContent.style.display = 'block';
            return;
        }

        noContent.style.display = 'none';

        tbody.innerHTML = contentList.map(content => `
            <tr>
                <td>${content.id}</td>
                <td>
                    <div class="d-flex align-items-center">
                        ${content.image ? `<img src="${content.image}" alt="${content.name}" style="width: 40px; height: 25px; object-fit: cover; border-radius: 2px; margin-right: 8px;">` : ''}
                        <span title="${content.name}">${content.name.length > 30 ? content.name.substring(0, 30) + '...' : content.name}</span>
                    </div>
                </td>
                <td>${content.year}</td>
                <td>
                    <span class="badge ${content.type === 'movie' ? 'bg-primary' : 'bg-success'}">${content.type}</span>
                </td>
                <td title="${content.genre}">${content.genre.length > 20 ? content.genre.substring(0, 20) + '...' : content.genre}</td>
                <td>${content.rating || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger action-btn" onclick="adminPanel.deleteContent(${content.id})" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Store content for search
        this.allContent = contentList;
    }

    handleSearch(event) {
        const query = event.target.value.toLowerCase().trim();

        if (!this.allContent) return;

        const filteredContent = this.allContent.filter(content =>
            content.name.toLowerCase().includes(query) ||
            content.genre.toLowerCase().includes(query) ||
            content.type.toLowerCase().includes(query) ||
            content.year.toString().includes(query)
        );

        this.displayContent(filteredContent);
    }

    async deleteContent(contentId) {
        if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/content/${contentId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (response.ok) {
                this.showAlert('Content deleted successfully', 'success');
                this.loadContent(); // Refresh the list
            } else {
                throw new Error(result.error || 'Delete failed');
            }
        } catch (error) {
            console.error('Delete error:', error);
            this.showAlert(error.message || 'Failed to delete content', 'danger');
        }
    }

    showAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        // Create new alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Insert at the top of the main content
        const mainContent = document.querySelector('.col-md-9.col-lg-10');
        mainContent.insertBefore(alert, mainContent.firstChild);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});

// Handle drag and drop for file uploads
document.addEventListener('DOMContentLoaded', function() {
    const fileInputs = ['videoFile', 'thumbnailFile'];

    fileInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        const container = input.closest('.mb-3');

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            container.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            container.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            container.addEventListener(eventName, unhighlight, false);
        });

        container.addEventListener('drop', function(e) {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                input.files = files;
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        e.currentTarget.classList.add('dragover');
    }

    function unhighlight(e) {
        e.currentTarget.classList.remove('dragover');
    }
});