# Heart Rate Monitoring Web Application

This project is a web application designed to monitor heart rate and blood oxygen saturation levels. Users can view weekly summaries, detailed daily insights, and configure measurement settings.

---

## **How to Run the Project from Scratch**

### **1. Clone the Repository**

Clone the repository to your local machine:
```bash
git clone https://github.com/your-repo/heart-rate-monitoring.git
cd heart-rate-monitoring
```

### **2. Install Dependencies**

Ensure you have Node.js and npm installed. Then, install the required dependencies:
```bash
npm install
```

### **3. Setup MongoDB**

1. Make sure MongoDB is installed and running on your machine or server.
2. Create a database named `heartRateDB`.
3. Update the MongoDB connection URI in `db.js` if necessary:
```javascript
mongoose.connect('mongodb://127.0.0.1/heartRateDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
```

### **4. Start the Server**

Run the following command to start the server:
```bash
npm start
```

The application will be accessible at `http://localhost:3000/`.

---

## **Endpoints Documentation**

### **Authentication**

#### `POST /auth/register`
- **Description**: Registers a new user.
- **Request Body**:
  ```json
  {
      "email": "user@example.com",
      "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
      "message": "User (user@example.com) has been registered.",
      "user": {
          "email": "user@example.com",
          "_id": "..."
      }
  }
  ```

#### `POST /auth/login`
- **Description**: Logs in an existing user.
- **Request Body**:
  ```json
  {
      "email": "user@example.com",
      "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
      "token": "<JWT_TOKEN>"
  }
  ```

### **Heart Rate Data**

#### `GET /api/heart-rate/weekly-summary`
- **Description**: Retrieves the average, minimum, and maximum heart rates over the past 7 days.
- **Response**:
  ```json
  {
      "average": 72,
      "minimum": 60,
      "maximum": 90
  }
  ```

#### `GET /api/heart-rate/daily-details?date=YYYY-MM-DD`
- **Description**: Retrieves heart rate and oxygen saturation readings for a specific day.
- **Response**:
  ```json
  {
      "heartRateReadings": [
          { "time": "08:00", "value": 75 },
          { "time": "08:10", "value": 80 }
      ],
      "oxygenSaturationReadings": [
          { "time": "08:00", "value": 98 },
          { "time": "08:10", "value": 97 }
      ]
  }
  ```

#### `POST /api/heart-rate/update-settings`
- **Description**: Updates the time range and frequency for data collection.
- **Request Body**:
  ```json
  {
      "startTime": "08:00",
      "endTime": "20:00",
      "frequency": 10
  }
  ```
- **Response**:
  ```json
  {
      "message": "Settings updated successfully."
  }
  ```

---

## **Links**

- **Server**: [http://localhost:3000/](http://localhost:3000/)
- **Pitch Video**: [https://example.com/pitch-video](https://example.com/pitch-video)
- **Demonstration Video**: [https://example.com/demo-video](https://example.com/demo-video)

---

## **Login Credentials**

Use the following credentials to log in with an existing user account that has recently collected data:

- **Email**: `testuser@example.com`
- **Password**: `password123`

---

## **Additional Notes**

- Ensure MongoDB is running before starting the application.
- Use a third-party plotting library like Chart.js for rendering graphs on the client-side.
- The `/public` folder contains the front-end assets, including `dashboard.js` for plotting data dynamically.

