// Check if the user is logged in via session and redirect as needed
async function checkAuth(redirectIfNotLoggedIn = true) {
    try {
        const response = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            if (redirectIfNotLoggedIn) {
                console.log('User not authenticated, redirecting to login page');
                window.location.href = 'login.html';
            }
            return null;
        }

        const data = await response.json();
        window.currentUser = data.data;
        return data.data;
    } catch (error) {
        console.error('Error checking authentication status:', error);
        if (redirectIfNotLoggedIn) {
            window.location.href = 'login.html';
        }
        return null;
    }
}

// Logout function to clear user data and redirect to login page
async function logout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            console.warn('Logout request failed. Redirecting to login page.');
        }
    } catch (error) {
        console.error('Error during logout:', error);
    } finally {
        localStorage.removeItem('selectedProfileId');
        localStorage.removeItem('selectedProfileName');
        localStorage.removeItem('selectedProfileAvatar');
        localStorage.removeItem('rememberMe');
        window.currentUser = null;
        window.location.href = 'login.html';
    }
}

// Run auth check when the page loads
document.addEventListener('DOMContentLoaded', function() {
    if (!window.location.href.includes('login.html')) {
        checkAuth();
    }
});
