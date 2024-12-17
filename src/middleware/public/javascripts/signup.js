document.getElementById('signupForm').addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent form submission and page reload

    // Data validation
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (email === "") {
        window.alert("Invalid email!");
        return;
    }
    if (password === "") {
        window.alert("Invalid password!");
        return;
    }

    // Prepare data for submission
    let txdata = {
        email: email,
        password: password
    };

    // Send AJAX request
    fetch('/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(txdata)
    })
    .then(response => response.json())
    .then(data => {
        // Display response in the console or update the UI
        console.log(data);
        alert('User registered successfully!');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while registering.');
    });
});