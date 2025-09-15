// Set up logout functionality
const logoutButton = document.getElementById('logoutBtn');
logoutButton.addEventListener('click', function(e) {
    e.preventDefault();
    logout();
});