const db = require("../db");

const deviceSchema = new db.Schema({
    name: { type: String, required: true },
    userId: { type: db.Schema.Types.ObjectId, ref: "User", required: true },
    apiKey: { type: String, required: true }, // API key for the IoT device
    readings: [
        {
            timestamp: { type: Date, default: Date.now },
            heartRate: { type: Number, required: true },
            oxygenSaturation: { type: Number, required: true }
        }
    ],
    preferences: {
        timeRange: { type: [Number], default: [0, 23] }, // Start and end hours
        frequency: { type: Number, default: 5 } // Measurement frequency
    }
});

const Device = db.model("Device", deviceSchema);
module.exports = Device;
