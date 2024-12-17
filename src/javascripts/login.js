document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent default form submission
    console.log("Login form submitted"); // Debug log

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    console.log("Email:", email); // Debug log
    console.log("Password:", password); // Debug log

    // Validate input fields
    if (!email || !password) {
        alert("Email and password are required!");
        return;
    }

    let txdata = { email, password };
    console.log("Payload being sent:", txdata); // Debug log

    fetch('/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(txdata)
    })
    .then(response => {
        console.log("Server response:", response); // Debug log
        if (!response.ok) {
            throw new Error("Login failed");
        }
        return response.json();
    })
    .then(data => {
        console.log("Response data:", data); // Debug log
        if (!data.token) {
            alert("Login failed. No token received.");
            return;
        }
        sessionStorage.setItem("token", data.token); // Store the token
        alert("Login successful!");
        window.location.replace("devices.html"); // Redirect to account page
    })
    .catch(error => {
        console.error("Login error:", error); // Debug log
        alert("Login failed. Please check your credentials.");
    });
});
