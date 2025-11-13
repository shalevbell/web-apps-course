// Settings page functionality
let profiles = [];
let dailyViewsChart = null;
let genrePopularityChart = null;

function getCurrentUserId() {
    return window.currentUser?.id || null;
}

// Load user email and profiles on page load
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkAuth();
    if (!user) return;

    loadUserInfo(user);
    await loadProfiles(user.id);
    setupEventListeners();
    await loadStatistics(user.id);
    // Initial form state will be set after profiles load
});

function loadUserInfo(user) {
    const userEmail = user?.email;
    const profileImage = document.getElementById('profileImage');
    const selectedProfileAvatar = localStorage.getItem('selectedProfileAvatar');

    if (userEmail) {
        document.getElementById('userEmail').textContent = userEmail;
    }

    if (selectedProfileAvatar) {
        profileImage.src = `./_images/profile/${selectedProfileAvatar}`;
    } else {
        // Default avatar if no profile selected yet
        profileImage.src = `./_images/profile/profile_pic_default.png`;
    }
}

async function loadProfiles(userId) {
    const profilesGrid = document.getElementById('profilesGrid');
    
    if (!userId) {
        console.error('No user ID found');
        window.location.href = 'login.html';
        return;
    }
    
    // Show loading state
    profilesGrid.innerHTML = `
        <div class="loading-spinner">
            <i class="bi bi-arrow-clockwise"></i>
            <span>Loading profiles...</span>
        </div>
    `;
    
    try {
        const response = await fetch(`/api/users/${userId}/profiles`, {
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        
        if (response.ok) {
            profiles = data.data;
            renderProfiles();
            updateAddProfileFormState();
        } else {
            console.error('Failed to load profiles:', data.error);
            showError('Failed to load profiles. Please try again.');
        }
    } catch (error) {
        console.error('Error loading profiles:', error);
        showError('Connection failed. Please check your internet connection and try again.');
    }
}

async function refreshProfiles() {
    let userId = getCurrentUserId();
    if (!userId) {
        const user = await checkAuth(false);
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        userId = user.id;
    }

    await loadProfiles(userId);
}

function renderProfiles() {
    const profilesGrid = document.getElementById('profilesGrid');
    const profilesCard = profilesGrid.closest('.settings-card');
    const cardTitle = profilesCard ? profilesCard.querySelector('.card-title') : null;
    
    // Update card title with profile count
    if (cardTitle) {
        cardTitle.innerHTML = `Your Profiles <span class="profile-count">(${profiles.length}/5)</span>`;
    }
    
    if (profiles.length === 0) {
        profilesGrid.innerHTML = `
            <div class="empty-state">
                <h3>No profiles yet</h3>
                <p>Create your first profile below to get started.</p>
            </div>
        `;
        return;
    }
    
    profilesGrid.innerHTML = profiles.map(profile => `
        <div class="profile-card" data-profile-id="${profile.id}">
            <div class="profile-card-actions">
                <button class="btn-action btn-edit" onclick="openEditModal('${profile.id}')" title="Edit profile">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn-action btn-delete" onclick="handleDeleteProfile('${profile.id}')" title="Delete profile">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
            <img src="./_images/profile/${profile.avatar}" alt="${profile.name}">
            <h4>${profile.name}</h4>
            <p>${profile.likes.length} likes</p>
        </div>
    `).join('');
}

function setupEventListeners() {
    // Add profile form submission
    document.getElementById('addProfileForm').addEventListener('submit', handleAddProfile);
    
    // Edit profile form submission
    document.getElementById('saveProfileBtn').addEventListener('click', handleEditProfile);
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });
}

async function handleAddProfile(event) {
    event.preventDefault();
    
    const profileName = document.getElementById('profileName');
    const avatarInputs = document.querySelectorAll('input[name="avatar"]');
    const submitBtn = document.getElementById('addProfileBtn');
    
    // Reset errors
    clearErrors();
    
    // Check profile limit (max 5 profiles)
    if (profiles.length >= 5) {
        showGeneralError('Maximum of 5 profiles allowed. Please delete a profile before creating a new one.');
        return;
    }
    
    // Validation
    let isValid = true;
    
    if (!profileName.value.trim()) {
        showFieldError('profileName', 'Profile name is required');
        isValid = false;
    } else if (profileName.value.trim().length > 20) {
        showFieldError('profileName', 'Profile name must be 20 characters or less');
        isValid = false;
    }
    
    const selectedAvatar = Array.from(avatarInputs).find(input => input.checked);
    if (!selectedAvatar) {
        showFieldError('avatar', 'Please select an avatar');
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Show loading state
    setLoadingState(submitBtn, true);
    
    try {
        let userId = getCurrentUserId();
        if (!userId) {
            const user = await checkAuth(false);
            if (!user) {
                showGeneralError('You have been logged out. Please sign in again.');
                window.location.href = 'login.html';
                return;
            }
            userId = user.id;
        }

        const response = await fetch(`/api/users/${userId}/profiles`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: profileName.value.trim(),
                avatar: selectedAvatar.value
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Success - show message and refresh profiles
            showSuccessMessage('Profile created successfully!');

            // If this is the first profile, automatically select it
            if (profiles.length === 0) {
                const newProfile = data.data;
                localStorage.setItem('selectedProfileId', newProfile.id);
                localStorage.setItem('selectedProfileName', newProfile.name);
                localStorage.setItem('selectedProfileAvatar', newProfile.avatar);

                // Update profile image in header
                const profileImage = document.getElementById('profileImage');
                profileImage.src = `./_images/profile/${newProfile.avatar}`;
            }

            profileName.value = '';
            selectedAvatar.checked = false;

            // Refresh profiles list
            await refreshProfiles();
        } else {
            // Handle server errors
            if (data.details && Array.isArray(data.details)) {
                data.details.forEach(error => {
                    if (error.field === 'name') {
                        showFieldError('profileName', error.message);
                    } else if (error.field === 'avatar') {
                        showFieldError('avatar', error.message);
                    }
                });
            } else {
                // Check if it's a profile limit error
                if (data.error && data.error.includes('Maximum of 5 profiles')) {
                    showGeneralError('Maximum of 5 profiles allowed. Please delete a profile before creating a new one.');
                    updateAddProfileFormState();
                } else {
                    showGeneralError(data.error || 'Failed to create profile. Please try again.');
                }
            }
        }
    } catch (error) {
        console.error('Add profile error:', error);
        showGeneralError('Connection failed. Please check your internet connection and try again.');
    } finally {
        setLoadingState(submitBtn, false);
    }
}

function clearErrors() {
    const errorFields = ['profileName', 'avatar'];
    errorFields.forEach(field => {
        const errorElement = document.getElementById(field + 'Error');
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.textContent = '';
        }
    });
    
    // Clear general error
    const generalError = document.getElementById('generalError');
    if (generalError) {
        generalError.remove();
    }
}

function showFieldError(fieldName, message) {
    const errorElement = document.getElementById(fieldName + 'Error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    const inputElement = document.getElementById(fieldName);
    if (inputElement) {
        inputElement.classList.add('is-invalid');
    }
}

function showGeneralError(message) {
    const form = document.getElementById('addProfileForm');
    let errorDiv = document.getElementById('generalError');
    
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'generalError';
        errorDiv.className = 'error-message';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.marginBottom = '20px';
        form.insertBefore(errorDiv, form.firstChild);
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function showSuccessMessage(message) {
    const form = document.getElementById('addProfileForm');
    let successDiv = document.getElementById('successMessage');
    
    if (!successDiv) {
        successDiv = document.createElement('div');
        successDiv.id = 'successMessage';
        successDiv.className = 'success-message';
        form.insertBefore(successDiv, form.firstChild);
    }
    
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 3000);
}

function setLoadingState(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = '<i class="bi bi-arrow-clockwise me-2"></i>Creating...';
        button.classList.add('loading');
    } else {
        button.disabled = false;
        button.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Add Profile';
        button.classList.remove('loading');
    }
}

function showError(message) {
    const profilesGrid = document.getElementById('profilesGrid');
    profilesGrid.innerHTML = `
        <div class="error-state">
            <h3>Error</h3>
            <p>${message}</p>
            <button onclick="refreshProfiles()" class="btn btn-primary">Retry</button>
        </div>
    `;
}

function openEditModal(profileId) {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) {
        console.error('Profile not found:', profileId);
        return;
    }

    // Set profile ID
    document.getElementById('editProfileId').value = profileId;
    
    // Set profile name
    document.getElementById('editProfileName').value = profile.name;
    
    // Set avatar selection
    const avatarInputs = document.querySelectorAll('input[name="editAvatar"]');
    avatarInputs.forEach(input => {
        input.checked = input.value === profile.avatar;
    });

    // Clear errors
    clearEditErrors();

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
    modal.show();
}

async function handleEditProfile() {
    const profileId = document.getElementById('editProfileId').value;
    const profileName = document.getElementById('editProfileName');
    const avatarInputs = document.querySelectorAll('input[name="editAvatar"]');
    const submitBtn = document.getElementById('saveProfileBtn');
    
    // Reset errors
    clearEditErrors();
    
    // Validation
    let isValid = true;
    
    if (!profileName.value.trim()) {
        showEditFieldError('editProfileName', 'Profile name is required');
        isValid = false;
    } else if (profileName.value.trim().length > 20) {
        showEditFieldError('editProfileName', 'Profile name must be 20 characters or less');
        isValid = false;
    }
    
    const selectedAvatar = Array.from(avatarInputs).find(input => input.checked);
    if (!selectedAvatar) {
        showEditFieldError('editAvatar', 'Please select an avatar');
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Show loading state
    setEditLoadingState(submitBtn, true);
    
    try {
        let userId = getCurrentUserId();
        if (!userId) {
            const user = await checkAuth(false);
            if (!user) {
                showEditGeneralError('Your session has expired. Please sign in again.');
                window.location.href = 'login.html';
                return;
            }
            userId = user.id;
        }
        const response = await fetch(`/api/profiles/${profileId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId,
                name: profileName.value.trim(),
                avatar: selectedAvatar.value
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Success - close modal and refresh profiles
            const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
            modal.hide();
            
            showSuccessMessage('Profile updated successfully!');

            // Update localStorage if this is the selected profile
            const selectedProfileId = localStorage.getItem('selectedProfileId');
            if (selectedProfileId === profileId) {
                localStorage.setItem('selectedProfileName', data.data.name);
                localStorage.setItem('selectedProfileAvatar', data.data.avatar);
                
                // Update profile image in header
                const profileImage = document.getElementById('profileImage');
                profileImage.src = `./_images/profile/${data.data.avatar}`;
            }

            // Refresh profiles list
            await refreshProfiles();
        } else {
            // Handle server errors
            if (data.details && Array.isArray(data.details)) {
                data.details.forEach(error => {
                    if (error.field === 'name') {
                        showEditFieldError('editProfileName', error.message);
                    } else if (error.field === 'avatar') {
                        showEditFieldError('editAvatar', error.message);
                    }
                });
            } else {
                showEditGeneralError(data.error || 'Failed to update profile. Please try again.');
            }
        }
    } catch (error) {
        console.error('Edit profile error:', error);
        showEditGeneralError('Connection failed. Please check your internet connection and try again.');
    } finally {
        setEditLoadingState(submitBtn, false);
    }
}

async function handleDeleteProfile(profileId) {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) {
        console.error('Profile not found:', profileId);
        return;
    }

    // Show confirmation dialog
    const confirmed = confirm(`Are you sure you want to delete the profile "${profile.name}"? This action cannot be undone.`);
    if (!confirmed) {
        return;
    }

    try {
        let userId = getCurrentUserId();
        if (!userId) {
            const user = await checkAuth(false);
            if (!user) {
                alert('Your session has expired. Please sign in again.');
                window.location.href = 'login.html';
                return;
            }
            userId = user.id;
        }
        const response = await fetch(`/api/profiles/${profileId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Success - show message and refresh profiles
            showSuccessMessage('Profile deleted successfully!');

            // Clear localStorage if deleted profile was selected
            const selectedProfileId = localStorage.getItem('selectedProfileId');
            if (selectedProfileId === profileId) {
                localStorage.removeItem('selectedProfileId');
                localStorage.removeItem('selectedProfileName');
                localStorage.removeItem('selectedProfileAvatar');
                
                // Update profile image in header to default
                const profileImage = document.getElementById('profileImage');
                profileImage.src = `./_images/profile/profile_pic_default.png`;
            }

            // Refresh profiles list
            await refreshProfiles();
        } else {
            // Handle server errors
            alert(data.error || 'Failed to delete profile. Please try again.');
        }
    } catch (error) {
        console.error('Delete profile error:', error);
        alert('Connection failed. Please check your internet connection and try again.');
    }
}

function clearEditErrors() {
    const errorFields = ['editProfileName', 'editAvatar'];
    errorFields.forEach(field => {
        const errorElement = document.getElementById(field + 'Error');
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.textContent = '';
        }
    });
    
    // Clear general error
    const generalError = document.getElementById('editGeneralError');
    if (generalError) {
        generalError.remove();
    }
    
    // Remove invalid class from inputs
    const nameInput = document.getElementById('editProfileName');
    if (nameInput) {
        nameInput.classList.remove('is-invalid');
    }
}

function showEditFieldError(fieldName, message) {
    const errorElement = document.getElementById(fieldName + 'Error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    const inputElement = document.getElementById(fieldName);
    if (inputElement) {
        inputElement.classList.add('is-invalid');
    }
}

function showEditGeneralError(message) {
    const form = document.getElementById('editProfileForm');
    let errorDiv = document.getElementById('editGeneralError');
    
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'editGeneralError';
        errorDiv.className = 'error-message';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.marginBottom = '20px';
        form.insertBefore(errorDiv, form.firstChild);
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function setEditLoadingState(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = '<i class="bi bi-arrow-clockwise me-2"></i>Saving...';
        button.classList.add('loading');
    } else {
        button.disabled = false;
        button.innerHTML = '<i class="bi bi-check-circle me-2"></i>Save Changes';
        button.classList.remove('loading');
    }
}

function updateAddProfileFormState() {
    const addProfileForm = document.getElementById('addProfileForm');
    const profileNameInput = document.getElementById('profileName');
    const avatarInputs = document.querySelectorAll('input[name="avatar"]');
    const addProfileBtn = document.getElementById('addProfileBtn');
    const addProfileCard = addProfileForm.closest('.settings-card');
    
    // Remove existing limit message if any
    const existingLimitMsg = addProfileCard.querySelector('.profile-limit-message');
    if (existingLimitMsg) {
        existingLimitMsg.remove();
    }
    
    if (profiles.length >= 5) {
        // Disable form inputs
        profileNameInput.disabled = true;
        avatarInputs.forEach(input => input.disabled = true);
        addProfileBtn.disabled = true;
        addProfileBtn.classList.add('disabled');
        
        // Add limit message
        const limitMsg = document.createElement('div');
        limitMsg.className = 'profile-limit-message';
        limitMsg.innerHTML = `
            <div class="alert alert-warning mt-3 mb-0" style="background: #ffc107; color: #000; border: none; border-radius: 4px; padding: 12px;">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                <strong>Profile Limit Reached:</strong> You have reached the maximum of 5 profiles. Please delete a profile to create a new one.
            </div>
        `;
        addProfileForm.appendChild(limitMsg);
    } else {
        // Enable form inputs
        profileNameInput.disabled = false;
        avatarInputs.forEach(input => input.disabled = false);
        addProfileBtn.disabled = false;
        addProfileBtn.classList.remove('disabled');
    }
}

// Statistics functions
async function loadStatistics(userId) {
    const statisticsLoading = document.getElementById('statisticsLoading');
    const statisticsContent = document.getElementById('statisticsContent');
    const statisticsEmpty = document.getElementById('statisticsEmpty');
    const statisticsError = document.getElementById('statisticsError');

    // Show loading state
    statisticsLoading.style.display = 'flex';
    statisticsContent.style.display = 'none';
    statisticsEmpty.style.display = 'none';
    statisticsError.style.display = 'none';

    if (!userId) {
        userId = getCurrentUserId();
        if (!userId) {
            const user = await checkAuth(false);
            if (!user) {
                statisticsLoading.style.display = 'none';
                statisticsError.style.display = 'block';
                return;
            }
            userId = user.id;
        }
    }

    try {
        const response = await fetch(`/api/users/${userId}/statistics`, {
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            statisticsLoading.style.display = 'none';

            // Check if we have data
            const hasDailyViews = data.data?.dailyViews?.length > 0;
            const hasGenreData = data.data?.genrePopularity?.length > 0;

            if (!hasDailyViews && !hasGenreData) {
                statisticsEmpty.style.display = 'block';
                return;
            }

            // Render charts
            if (hasDailyViews) {
                renderBarChart(data.data.dailyViews);
            }
            if (hasGenreData) {
                renderPieChart(data.data.genrePopularity);
            }

            statisticsContent.style.display = 'block';
        } else {
            statisticsLoading.style.display = 'none';
            statisticsError.style.display = 'block';
            console.error('Failed to load statistics:', data.error);
        }
    } catch (error) {
        statisticsLoading.style.display = 'none';
        statisticsError.style.display = 'block';
        console.error('Error loading statistics:', error);
    }
}

function renderBarChart(dailyViewsData) {
    // Destroy existing chart if it exists
    if (dailyViewsChart) {
        dailyViewsChart.destroy();
    }

    // Generate last 30 days date labels (format as MM/DD)
    const today = new Date();
    const dateLabels = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        dateLabels.push(`${month}/${day}`);
    }

    // Create datasets for each profile
    const datasets = dailyViewsData.map((profileData, index) => {
        // Extract counts for each date in order
        const counts = profileData.dates.map(d => d.count);

        // Diverse color palette for easy differentiation
        const colors = [
            '#e50914', // ed
            '#2196f3', // Blue
            '#4caf50', // Green
            '#ff9800', // Orange
            '#9c27b0'  // Purple
        ];

        return {
            label: profileData.profileName,
            data: counts,
            backgroundColor: colors[index % colors.length],
            borderColor: colors[index % colors.length],
            borderWidth: 1
        };
    });

    const ctx = document.getElementById('dailyViewsChart');
    dailyViewsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dateLabels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        title: function(context) {
                            return `Date: ${context[0].label}`;
                        },
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y} views`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#8c8c8c',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        color: '#333'
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#8c8c8c',
                        stepSize: 1
                    },
                    grid: {
                        color: '#333'
                    }
                }
            }
        }
    });
}

function renderPieChart(genreData) {
    // Destroy existing chart if it exists
    if (genrePopularityChart) {
        genrePopularityChart.destroy();
    }

    // Extract labels and data
    const labels = genreData.map(item => item.genre);
    const counts = genreData.map(item => item.count);

    // Diverse color palette optimized for dark backgrounds and easy differentiation
    const colorPalette = [
        '#e50914', // Netflix red
        '#2196f3', // Blue
        '#4caf50', // Green
        '#ff9800', // Orange
        '#9c27b0', // Purple
        '#00bcd4', // Cyan
        '#ffeb3b', // Yellow
        '#e91e63', // Pink
        '#009688', // Teal
        '#ff5722', // Deep orange
        '#3f51b5', // Indigo
        '#8bc34a', // Light green
        '#ffc107', // Amber
        '#673ab7', // Deep purple
        '#03a9f4', // Light blue
        '#795548', // Brown
        '#607d8b', // Blue gray
        '#cddc39', // Lime
        '#ff4081', // Pink accent
        '#00e676', // Green accent
        '#ff6f00', // Deep orange
        '#651fff', // Deep purple accent
        '#ff1744', // Red accent
        '#3d5afe', // Indigo accent
        '#1de9b6', // Teal accent
        '#f50057'  // Pink accent 2
    ];
    
    // Assign colors to genres, cycling through palette if needed
    const colors = labels.map((_, index) => colorPalette[index % colorPalette.length]);

    const ctx = document.getElementById('genrePopularityChart');
    genrePopularityChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: colors,
                borderColor: '#1a1a1a',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 12
                        },
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} views (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}
