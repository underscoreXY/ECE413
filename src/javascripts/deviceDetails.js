// Get the deviceId from the URL query parameters
const urlParams = new URLSearchParams(window.location.search);
const deviceId = urlParams.get('deviceId');

// Fetch and display weekly summary
function fetchWeeklySummary() {
    fetch(`/devices/summary/${deviceId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('average').textContent = `Average: ${data.average}`;
        document.getElementById('min').textContent = `Min: ${data.min}`;
        document.getElementById('max').textContent = `Max: ${data.max}`;
    })
    .catch(err => console.error('Error fetching weekly summary:', err));
}

// Fetch and display daily detailed data
function fetchDailyDetails(date) {
    fetch(`/devices/details/${deviceId}?date=${date}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        plotChart('Heart Rate', data.heartRates, 'heartRateChart');
        plotChart('Oxygen Saturation', data.oxygenSaturation, 'oxygenChart');
    })
    .catch(err => console.error('Error fetching daily details:', err));
}


// Plot charts (using Chart.js or similar library)
function plotChart(title, data, chartId) {
    const ctx = document.getElementById(chartId).getContext('2d');
    const labels = data.map(d => new Date(d.time).toLocaleTimeString());
    const values = data.map(d => d.value);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: title,
                data: values,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time of Day'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: title
                    }
                }
            }
        }
    });
}

// Fetch weekly summary on load
fetchWeeklySummary();
