//Check if the user is logged in and redirect to login page if not
function checkAuth(redirectIfNotLoggedIn = true) {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn && redirectIfNotLoggedIn) {
        console.log('User not logged in, redirecting to login page');
        window.location.href = 'login.html';
        return false;
    }
    
    // Get user email from localStorage if logged in
    if (isLoggedIn) {
        const userEmail = localStorage.getItem('userEmail');
        console.log('User logged in:', userEmail);
    }
    
    return isLoggedIn;
}

// Logout function to clear user data and redirect to login page
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('selectedProfileId');
    localStorage.removeItem('selectedProfileName');
    localStorage.removeItem('selectedProfileAvatar');
    localStorage.removeItem('rememberMe');

    // Redirect to login page
    window.location.href = 'login.html';
}

// Run auth check when the page loads
document.addEventListener('DOMContentLoaded', function() {
    if (!window.location.href.includes('login.html')) {
        checkAuth();
    }
});
