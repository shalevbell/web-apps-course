// Set profile image in header based on the selected profile
let selectedProfileId = localStorage.getItem('selectedProfileId') || '1';
    
const profileImage = document.getElementById('profileImage');
profileImage.src = `../_images/profile/profile_pic_${selectedProfileId}.png`;
// Set up logout functionality
const logoutButton = document.getElementById('logoutBtn');
logoutButton.addEventListener('click', function(e) {
    e.preventDefault();
    logout();
});
