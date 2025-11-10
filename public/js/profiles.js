// Load and render profiles from server API
let profiles = [];

function getCurrentUserId() {
    return window.currentUser?.id || null;
}

// Function to load profiles from server
async function loadProfiles(userId) {
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

// Function to render profiles
function renderProfiles() {
    const profilesList = document.getElementById('profilesList');
    profilesList.innerHTML = '';

    if (profiles.length === 0) {
        // Show empty state
        profilesList.innerHTML = `
            <div class="empty-state">
                <h3>No profiles yet</h3>
                <p>Select MANAGE PROFILES to get started.</p>
            </div>
        `;
        return;
    }

    profiles.forEach(profile => {
        const profileDiv = document.createElement('div');
        profileDiv.className = 'profile';
        profileDiv.innerHTML = `
            <img src="./_images/profile/${profile.avatar}" alt="${profile.name}" class="profile-pic">
            <div class="profile-name">${profile.name}</div>`;

        profileDiv.addEventListener('click', function() {
            selectProfile(profile.id, profile.name);
        });

        profilesList.appendChild(profileDiv);
    });
}
        
function selectProfile(profileId, profileName) {
    // Find the full profile object to get the avatar
    const profile = profiles.find(p => p.id === profileId);

    localStorage.setItem('selectedProfileId', profileId);
    localStorage.setItem('selectedProfileName', profileName);
    localStorage.setItem('selectedProfileAvatar', profile ? profile.avatar : 'profile_pic_1.png');

    // Redirect to feed page
    window.location.href = 'feed.html';
}

function showError(message) {
    const profilesList = document.getElementById('profilesList');
    profilesList.innerHTML = `
        <div class="error-state">
            <h3>Error</h3>
            <p>${message}</p>
            <button onclick="refreshProfiles()" class="btn btn-primary">Retry</button>
        </div>
    `;
}
        
// Load profiles when the DOM loads
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkAuth();
    if (!user) return;

    await loadProfiles(user.id);

    // Add event listener for Manage Profiles button
    const manageProfilesBtn = document.querySelector('.btn-manage-profiles');
    if (manageProfilesBtn) {
        manageProfilesBtn.addEventListener('click', function() {
            window.location.href = 'settings.html';
        });
    }
});
        