// Login form validation and server authentication
document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const email = document.getElementById('emailInput');
    const password = document.getElementById('passwordInput');
    const passwordError = document.getElementById('passwordError');
    const emailError = document.getElementById('emailError');
    const submitBtn = document.querySelector('.btn-sign-in');
    
    // Reset previous errors
    clearErrors();
    
    let isValid = true;
    
    // Email validation - matches MongoDB validation pattern
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.value)) {
        showError(email, emailError, 'Please enter a valid email address');
        isValid = false;
    }
    
    // Password validation
    if (password.value.length < 5) {
        showError(password, passwordError, 'Password must be at least 5 characters long');
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Show loading state
    setLoadingState(submitBtn, true);
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email.value,
                password: password.value
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Login successful
            const rememberMe = document.getElementById('rememberMe').checked;
            
            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
            } else {
                localStorage.removeItem('rememberMe');
            }
            
            // Redirect to profiles page
            window.location.href = 'profiles.html';
        } else {
            // Handle server errors
            if (response.status === 404) {
                showError(email, emailError, 'User not found');
            } else if (response.status === 401) {
                showError(password, passwordError, 'Incorrect password');
            } else {
                showGeneralError(data.error || 'Login failed. Please try again.');
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        showGeneralError('Connection failed. Please check your internet connection and try again.');
    } finally {
        setLoadingState(submitBtn, false);
    }
});

function clearErrors() {
    const inputs = ['emailInput', 'passwordInput'];
    const errors = ['emailError', 'passwordError'];
    
    inputs.forEach(id => {
        const input = document.getElementById(id);
        input.classList.remove('is-invalid');
    });
    
    errors.forEach(id => {
        const error = document.getElementById(id);
        error.style.display = 'none';
        error.textContent = '';
    });
}

function showError(input, errorElement, message) {
    input.classList.add('is-invalid');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function showGeneralError(message) {
    // Create or update general error message
    let errorDiv = document.getElementById('generalError');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'generalError';
        errorDiv.className = 'error-message';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.marginBottom = '20px';
        document.querySelector('.login-box').insertBefore(errorDiv, document.getElementById('loginForm'));
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function setLoadingState(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.classList.add('loading');
    } else {
        button.disabled = false;
        button.classList.remove('loading');
    }
}

// Check if redirected from registration with success message
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('registered') === 'true') {
        showGeneralError('Registration successful! Please sign in with your new account.');
    }
});
