// On form submit will run the function below. 
// Password and email requirement is handled by the input 'required' attribute
document.getElementById('loginForm').addEventListener('submit', function(validation) {
    validation.preventDefault();
            
    const email = document.getElementById('emailInput');
    const password = document.getElementById('passwordInput');
    const passwordError = document.getElementById('passwordError');
    const emailError = document.getElementById('emailError');
            
    let isValid = true;
            
    // Reset previous errors
    password.classList.remove('is-invalid');
    email.classList.remove('is-invalid');
    passwordError.style.display = 'none';
    emailError.style.display = 'none';
            
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
        emailError.textContent = 'Please enter a valid email address';
        emailError.style.display = 'block';
        email.classList.add('is-invalid');
        isValid = false;
    }
            
    // Password validation
    if (password.value.length < 6) {
        passwordError.textContent = 'Password must be at least 6 characters long';
        passwordError.style.display = 'block';
        password.classList.add('is-invalid');
        isValid = false;
    }
            
    // Form is valid, save connection state and redirect
    if (isValid) {
        const rememberMe = document.getElementById('rememberMe').checked;
        
        // Save user data to localStorage
        localStorage.setItem('userEmail', email.value);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('rememberMe', String(rememberMe));
        
        // Redirect to profiles page
        window.location.href = 'profiles.html';
    }
});
