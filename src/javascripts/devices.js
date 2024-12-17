document.addEventListener("DOMContentLoaded", function () {
    const deviceList = document.getElementById('deviceList');

    // Fetch the user's devices
    fetch('/devices/user', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}` // Send the user's token
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch devices');
        }
        return response.json();
    })
    .then(devices => {
        if (devices.length === 0) {
            // Display a message if no devices are found
            const noDevicesMessage = document.createElement('p');
            noDevicesMessage.textContent = 'No devices found. Please add a new device.';
            deviceList.appendChild(noDevicesMessage);
        } else {
            // Populate the list with devices
            devices.forEach(device => addDeviceToList(device));
        }
    })
    .catch(err => {
        console.error('Error fetching devices:', err);
        alert('Could not load devices. Please log in again.');
        window.location.href = '/login.html'; // Redirect to login page only if authentication fails
    });

    // Add a new device
    document.getElementById('btnAddDevice').addEventListener('click', function () {
        const deviceName = document.getElementById('deviceName').value.trim();

        if (!deviceName) {
            alert('Device name cannot be empty.');
            return;
        }

        fetch('/devices/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            },
            body: JSON.stringify({ name: deviceName })
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to add device');
            return response.json();
        })
        .then(device => {
            addDeviceToList(device); // Add the new device to the list
            document.getElementById('deviceName').value = ''; // Clear the input field
        })
        .catch(err => {
            console.error('Error adding device:', err);
            alert('Could not add device. Please try again.');
        });
    });

    // Logout functionality
    document.getElementById('btnLogout').addEventListener('click', function () {
        sessionStorage.removeItem('token');
        alert('You have been logged out.');
        window.location.href = '/login.html';
    });

    // Redirect to the home page
    document.getElementById('btnHome').addEventListener('click', function () {
        window.location.href = '/index.html';
    });

    // Add a device to the UI list
    function addDeviceToList(device) {
    const listItem = document.createElement('li');

    // Device name with a link to details page
    const deviceLink = document.createElement('a');
    deviceLink.textContent = device.name;
    deviceLink.href = `deviceDetails.html?deviceId=${device._id}`; // Redirect with deviceId as a query parameter

    // API Key display
    const deviceApiKey = document.createElement('p');
    deviceApiKey.textContent = `API Key: ${device.apiKey}`;
    deviceApiKey.style.fontSize = '0.9em';
    deviceApiKey.style.color = '#555';

    // Remove Button
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', function () {
        fetch(`/devices/remove/${device._id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to remove device');
            deviceList.removeChild(listItem);
        })
        .catch(err => {
            console.error('Error removing device:', err);
            alert('Could not remove device. Please try again.');
        });
    });

    // Append elements to the list item
    listItem.appendChild(deviceLink); // Add the clickable link
    listItem.appendChild(deviceApiKey);
    listItem.appendChild(removeButton);

    // Add the list item to the device list
    deviceList.appendChild(listItem);
}
});
