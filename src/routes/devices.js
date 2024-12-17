const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const Device = require('../models/Device');
const crypto = require('crypto'); // For generating random API keys


// Fetch all devices for the authenticated user
router.get('/user', authenticateToken, async (req, res) => {
    try {
        const devices = await Device.find({ userId: req.user.userId });
        res.status(200).json(devices);
    } catch (err) {
        console.error('Error fetching devices:', err);
        res.status(500).json({ error: 'Failed to fetch devices.' });
    }
});

// Add a new device for the authenticated user
router.post('/add', authenticateToken, async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Device name is required.' });
    }

    try {
        // Generate a random API key
        const apiKey = crypto.randomBytes(16).toString('hex');
	console.log(apiKey);
        const device = new Device({
            name,
            userId: req.user.userId,
            apiKey // Assign the generated API key
        });
		console.log(device.apiKey);

        await device.save();
        res.status(201).json(device); // Return the newly created device, including the API key
    } catch (err) {
        console.error('Error adding device:', err);
        res.status(500).json({ error: 'Failed to add device.' });
    }
});
// Remove a device for the authenticated user
router.delete('/remove/:id', authenticateToken, async (req, res) => {
    try {
        const result = await Device.deleteOne({ _id: req.params.id, userId: req.user.userId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Device not found or unauthorized.' });
        }

        res.status(200).json({ message: 'Device removed successfully.' });
    } catch (err) {
        console.error('Error removing device:', err);
        res.status(500).json({ error: 'Failed to remove device.' });
    }
});


router.get('/summary/:id', authenticateToken, async (req, res) => {
    try {
        const deviceId = req.params.id;
        const device = await Device.findOne({ _id: deviceId, userId: req.user.userId });

        if (!device) {
            return res.status(404).json({ error: 'Device not found or unauthorized.' });
        }

        // Get the past 7 days of readings
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const readings = device.readings.filter(r => new Date(r.timestamp) >= sevenDaysAgo);

        if (readings.length === 0) {
            return res.status(200).json({ average: 0, min: 0, max: 0 });
        }

        const heartRates = readings.map(r => r.heartRate);
        const average = heartRates.reduce((a, b) => a + b, 0) / heartRates.length;
        const min = Math.min(...heartRates);
        const max = Math.max(...heartRates);

        res.status(200).json({ average, min, max });
    } catch (err) {
        console.error('Error fetching weekly summary:', err);
        res.status(500).json({ error: 'Failed to fetch weekly summary.' });
    }
});


// Endpoint to fetch device readings
router.get('/details/:deviceId', async (req, res) => {
    const { deviceId } = req.params;

    try {
        const device = await Device.findById(deviceId).select('readings name');
        if (!device) {
            return res.status(404).json({ error: "Device not found." });
        }

        res.status(200).json({
            deviceName: device.name,
            readings: device.readings
        });
    } catch (err) {
        console.error("Error fetching device readings:", err);
        res.status(500).json({ error: "Failed to fetch readings." });
    }
});


router.post('/preferences/:id', async (req, res) => {
    const { id } = req.params;
    const { startTime, endTime, frequency } = req.body;

    try {
        const device = await Device.findById(id);
        if (!device) {
            return res.status(404).json({ error: 'Device not found.' });
        }

        // Update preferences
        device.preferences = { timeRange: [startTime, endTime], frequency };
        await device.save();

        res.status(200).json({ message: 'Preferences updated successfully.', preferences: device.preferences });
    } catch (err) {
        console.error('Error updating preferences:', err);
        res.status(500).json({ error: 'Failed to update preferences.' });
    }
});

// Endpoint to fetch measurement preferences
router.get('/preferences/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const device = await Device.findById(id);
        if (!device) {
            return res.status(404).json({ error: 'Device not found.' });
        }

        res.status(200).json({ preferences: device.preferences });
    } catch (err) {
        console.error('Error fetching preferences:', err);
        res.status(500).json({ error: 'Failed to fetch preferences.' });
    }
});
router.post('/iot/data', async (req, res) => {
    const { apiKey, heartRate, oxygenSaturation, timestamp } = req.body;

    try {
        // Validate required fields
        if (!apiKey || !heartRate || !oxygenSaturation || !timestamp) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        // Find the device by API key
        const device = await Device.findOne({ apiKey });
        if (!device) {
            return res.status(404).json({ error: "Device not found or invalid API key." });
        }

        // Add new reading to the device
        device.readings.push({
            heartRate: Number(heartRate),
            oxygenSaturation: Number(oxygenSaturation),
            timestamp: new Date(timestamp),
        });

        // Save updated device
        await device.save();

        res.status(200).json({ message: "Data recorded successfully." });
    } catch (err) {
        console.error("Error saving IoT data:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});

module.exports = router;
