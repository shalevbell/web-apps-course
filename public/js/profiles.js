// Load and render profiles from server API
let profiles = [];

// Function to load profiles from server
async function loadProfiles() {
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
        console.error('No user ID found');
        window.location.href = 'login.html';
        return;
    }
    
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

// Function to render profiles
function renderProfiles() {
    const profilesList = document.getElementById('profilesList');
    profilesList.innerHTML = '';
    
    if (profiles.length === 0) {
        // Show empty state
        profilesList.innerHTML = `
            <div class="empty-state">
                <h3>No profiles yet</h3>
                <p>Create your first profile in Settings to get started.</p>
                <a href="settings.html" class="btn btn-primary">Go to Settings</a>
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
    localStorage.setItem('selectedProfileId', profileId);
    localStorage.setItem('selectedProfileName', profileName);
            
    // Redirect to feed page
    window.location.href = 'feed.html';
}

function showError(message) {
    const profilesList = document.getElementById('profilesList');
    profilesList.innerHTML = `
        <div class="error-state">
            <h3>Error</h3>
            <p>${message}</p>
            <button onclick="loadProfiles()" class="btn btn-primary">Retry</button>
        </div>
    `;
}
        
// Load profiles when the DOM loads
document.addEventListener('DOMContentLoaded', function() {
    loadProfiles();
});
        