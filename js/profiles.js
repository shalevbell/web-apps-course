// Renders the profile fropm the profile list when the DOM is loaded, saves the selected user in local storage.
const profiles = [
            {
                id: 1,
                profileName: "Adi",
                pic: "./_images/profile/profile_pic_1.png"
            },
            {
                id: 2,
                profileName: "Shalev",
                pic: "./_images/profile/profile_pic_2.png"
            },
            {
                id: 3,
                profileName: "Paul",
                pic: "./_images/profile/profile_pic_3.png"
            }
        ];

// Function to render profiles
function renderProfiles() {
    const profilesList = document.getElementById('profilesList');
            
     profiles.forEach(profile => {
        const profileDiv = document.createElement('div');
        profileDiv.className = 'profile';
        profileDiv.innerHTML = `
            <img src="${profile.pic}" alt="${profile.profileName}" class="profile-pic">
            <div class="profile-name">${profile.profileName}</div>`;
                
        profileDiv.addEventListener('click', function() {
            selectProfile(profile.id, profile.profileName);
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
        
// Render profiles when the DOM loads
document.addEventListener('DOMContentLoaded', function() {
    renderProfiles();
});
        