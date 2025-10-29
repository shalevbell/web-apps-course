// Settings page functionality
let profiles = [];

// Load user email and profiles on page load
document.addEventListener('DOMContentLoaded', function() {
    loadUserInfo();
    loadProfiles();
    setupEventListeners();
});

function loadUserInfo() {
    const userEmail = localStorage.getItem('userEmail');
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

async function loadProfiles() {
    const userId = localStorage.getItem('userId');
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
        const response = await fetch(`/api/users/${userId}/profiles`);
        const data = await response.json();
        
        if (response.ok) {
            profiles = data.data;
            renderProfiles();
        } else {
            console.error('Failed to load profiles:', data.error);
            showError('Failed to load profiles. Please try again.');
        }
    } catch (error) {
        console.error('Error loading profiles:', error);
        showError('Connection failed. Please check your internet connection and try again.');
    }
}

function renderProfiles() {
    const profilesGrid = document.getElementById('profilesGrid');
    
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
        <div class="profile-card">
            <img src="./_images/profile/${profile.avatar}" alt="${profile.name}">
            <h4>${profile.name}</h4>
            <p>${profile.likes.length} likes</p>
        </div>
    `).join('');
}

function setupEventListeners() {
    // Add profile form submission
    document.getElementById('addProfileForm').addEventListener('submit', handleAddProfile);
    
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
        const userId = localStorage.getItem('userId');
        const response = await fetch(`/api/users/${userId}/profiles`, {
            method: 'POST',
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
            await loadProfiles();
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
                showGeneralError(data.error || 'Failed to create profile. Please try again.');
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
            <button onclick="loadProfiles()" class="btn btn-primary">Retry</button>
        </div>
    `;
}
