document.addEventListener('DOMContentLoaded', function () {
    const otpInputs = Array.from(document.querySelectorAll('.otp-digit'));
    const resendBtn = document.getElementById('resend-btn');
    const errorMessageDiv = document.getElementById('error-message');
    const timerDiv = document.getElementById('timer');

    let countdown;
    let remainingTime = 120; // Countdown timer (120 seconds)

    // Initially hide the error message
    errorMessageDiv.style.display = 'none';

    // Function to update the timer display
    function updateTimer() {
        if (remainingTime > 0) {
            timerDiv.textContent = `${remainingTime} seconds`;
            remainingTime--;
        } else {
            clearInterval(countdown);
            resendBtn.disabled = false; // Enable resend button after timer ends
            timerDiv.textContent = '';
        }
    }

    // Start the countdown timer
    countdown = setInterval(updateTimer, 1000);

    // Reset input borders to default
    function resetInputBorders() {
        otpInputs.forEach(input => {
            input.style.border = '1px solid #ccc'; // Default border color
        });
    }

    // Focus next input automatically on each key entry

    // OR (alternative way)
    // const otpInputs = [...document.querySelectorAll('.otp-digit')];

    // Rest of the code remains unchanged
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', function () {
            // If the input is a single character, move to the next input
            if (input.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus(); // Focus next input field
            }

            // Check if all fields are filled, then trigger OTP verification
            if (otpInputs.every(inp => inp.value.length === 1)) {
                verifyOtp(); // Verify OTP as soon as all fields are filled
            }
        });
    
        // Handle backspace to navigate to the previous input
        input.addEventListener('keydown', function (event) {
            if (event.key === 'Backspace' && input.value === '' && index > 0) {
                otpInputs[index - 1].focus(); // Move focus to previous input
            }
        });
    });        

    // Handle pasting of the OTP
    otpInputs.forEach(input => {
        input.addEventListener('paste', function (event) {
            event.preventDefault();
            const pastedData = event.clipboardData.getData('text').trim();
            const digits = pastedData.split('');

            if (digits.length === otpInputs.length) {
                otpInputs.forEach((otpInput, i) => {
                    otpInput.value = digits[i] || ''; // Populate each input field
                });
                otpInputs[otpInputs.length - 1].focus(); // Focus on the last input after pasting
                verifyOtp(); // Automatically verify when pasted
            }
        });
    });

    // Function to verify OTP
    async function verifyOtp() {
        let otpCode = '';
        otpInputs.forEach(input => {
            otpCode += input.value; // Collecting OTP code from input fields
        });
    
        // If OTP code is not 6 digits, show an error
        if (otpCode.length !== 6) {
            errorMessageDiv.textContent = 'Please fill out all the digits.';
            errorMessageDiv.style.display = 'block';
            return;
        }
    
        // Call the backend to verify the OTP
        try {
            const response = await fetch('/admin/verify_code', {
                method: 'POST',
                body: JSON.stringify({ verification_code: otpCode }),
                headers: {
                    'Content-Type': 'application/json',
                }
            });
    
            const result = await response.json();
    
            if (response.ok && result.success) {
                otpInputs.forEach(input => {
                    errorMessageDiv.textContent = 'Verified successfully';
                    errorMessageDiv.style.display = 'block';
                    input.style.border = '1px solid green'; // Highlight in green for success
                });
                window.location.href = result.redirect_url; // Redirect to the admin dashboard
            } else {
                errorMessageDiv.textContent = 'Invalid verification code. Please try again.';
                errorMessageDiv.style.display = 'block';
                otpInputs.forEach(input => {
                    input.style.border = '1px solid red'; // Highlight in red for error
                });
            }
        } catch (error) {
            errorMessageDiv.textContent = 'An error occurred. Please try again later.';
            errorMessageDiv.style.display = 'block';
        }
    }            

    // Handle resend button click
        resendBtn.addEventListener('click', async function (event) {
        event.preventDefault();
        resendBtn.disabled = true; // Disable the button until a new code is requested
        
        try {
            const email = document.querySelector('#email').value; // Assuming email is in a hidden input field
        
            const response = await fetch('/admin/resend_code', {
                method: 'POST',
                body: JSON.stringify({ email }),
                headers: {
                    'Content-Type': 'application/json',
                }
            });
        
            const result = await response.json();
            if (response.ok) {
                errorMessageDiv.textContent = 'New verification code sent. Check your email.';
                errorMessageDiv.style.display = 'block';
            
                // Reset the timer
                remainingTime = 120;
                timerDiv.textContent = `${remainingTime} seconds`;
                countdown = setInterval(updateTimer, 1000); // Restart the countdown
            } else {
                errorMessageDiv.textContent = result.error || 'Error sending code. Please try again.';
                errorMessageDiv.style.display = 'block';
            }
        } catch (error) {
            errorMessageDiv.textContent = 'An error occurred. Please try again later.';
            errorMessageDiv.style.display = 'block';
        } finally {
            resendBtn.disabled = false; // Re-enable the button (after cooldown period)
        }
    });
});