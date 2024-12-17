/*
  Optical Heart Rate Detection (PBA Algorithm) using the MAX30105 Breakout
  By: Nathan Seidle @ SparkFun Electronics
  Date: October 2nd, 2016
  https://github.com/sparkfun/MAX30105_Breakout

  This is a demo to show the reading of heart rate or beats per minute (BPM) using
  a Penpheral Beat Amplitude (PBA) algorithm.

  It is best to attach the sensor to your finger using a rubber band or other tightening
  device. Humans are generally bad at applying constant pressure to a thing. When you
  press your finger against the sensor it varies enough to cause the blood in your
  finger to flow differently which causes the sensor readings to go wonky.

  Hardware Connections (Breakoutboard to Arduino):
  -5V = 5V (3.3V is allowed)
  -GND = GND
  -SDA = A4 (or SDA)
  -SCL = A5 (or SCL)
  -INT = Not connected

  The MAX30105 Breakout can handle 5V or 3.3V I2C logic. We recommend powering the board with 5V
  but it will also run at 3.3V.
*/
SYSTEM_THREAD(ENABLED);
SYSTEM_MODE(SEMI_AUTOMATIC);

#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"

MAX30105 particleSensor;

const byte RATE_SIZE = 4; // Increase this for more averaging. 4 is good.
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0; // Time at which the last beat occurred

float beatsPerMinute;
int beatAvg;
float spo2;

unsigned long lastPublishTime = 0;          // Time of the last publish
const unsigned long publishInterval = 3000; // Adjustable interval in milliseconds

// Local storage configuration
const int maxStoredMeasurements = 50;           // Maximum number of measurements to store
const int maxStorageTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
struct Measurement
{
    char data[64];           // Measurement data (e.g., JSON string)
    unsigned long timestamp; // Time of the measurement
};
Measurement storedMeasurements[maxStoredMeasurements];
int storedCount = 0; // Current count of stored measurements

unsigned long lastReconnectAttempt = 0;        // For reconnection retries
const unsigned long reconnectInterval = 10000; // Retry Wi-Fi connection every 10 seconds

void handle(const char *event, const char *data)
{
    // Placeholder for Particle webhook response
}

void setup()
{
    Serial.begin(9600);
    WiFi.on();          // Enable Wi-Fi
    Particle.connect(); // Connect to Particle Cloud
    RGB.control(true);  // Enable manual RGB control

    Serial.println("Initializing...");

    // Subscribe to server responses
    Particle.subscribe("hook-response/bpm", handle, MY_DEVICES);

    // Initialize sensor
    if (!particleSensor.begin(Wire, I2C_SPEED_FAST))
    {
        Serial.println("MAX30105 was not found. Please check wiring/power.");
        while (1)
            ;
    }
    Serial.println("Place your index finger on the sensor with steady pressure.");

    particleSensor.setup();                    // Configure sensor
    particleSensor.setPulseAmplitudeRed(0x0A); // Turn Red LED to low to indicate sensor is running
    particleSensor.setPulseAmplitudeGreen(0);  // Turn off Green LED
}

void loop()
{
    long irValue = particleSensor.getIR();
    long redValue = particleSensor.getRed();
    delay(publishInterval);
    flashLED("blue", 500);
    // Detect heartbeat
    if (checkForBeat(irValue))
    {
        long delta = millis() - lastBeat;
        lastBeat = millis();

        beatsPerMinute = 60 / (delta / 1000.0);

        if (beatsPerMinute < 255 && beatsPerMinute > 20)
        {
            rates[rateSpot++] = (byte)beatsPerMinute;
            rateSpot %= RATE_SIZE;

            beatAvg = 0;
            for (byte x = 0; x < RATE_SIZE; x++)
            {
                beatAvg += rates[x];
            }
            beatAvg /= RATE_SIZE;
        }
    }

    // Calculate SpO₂
    if (redValue > 0 && irValue > 0)
    {
        long redAC = redValue - (redValue / 2);
        long redDC = redValue / 2;
        long irAC = irValue - (irValue / 2);
        long irDC = irValue / 2;

        if (redDC > 0 && irDC > 0)
        {
            float R = (float(redAC) / redDC) / (float(irAC) / irDC);
            spo2 = (110 - 25 * R) + 10;
        }
    }

    unsigned long currentTime = millis();

    if (currentTime - lastPublishTime >= publishInterval)
    {
        lastPublishTime = currentTime;

        if (beatsPerMinute > 55)
        {
            String temp1 = String(beatsPerMinute);
            String temp2 = String(spo2, 2);

            String Send_Data = String::format(
    "{\"apiKey\": \"%s\", \"heartRate\": %.2f, \"oxygenSaturation\": %.2f, \"timestamp\": \"%s\"}",
    "8179a2f630cbc0e30fee746396448fc6",
    beatsPerMinute,
    spo2,
    Time.format(Time.now(), TIME_FORMAT_ISO8601_FULL).c_str()
);  
        

            if (WiFi.ready())
            {
                if (sendToServer(Send_Data))
                {
                    flashLED("green", 500); // Flash green on success
                    Serial.print("IR=");
                    Serial.print(irValue);
                    Serial.print(", BPM=");
                    Serial.print(beatsPerMinute);
                    Serial.print(", Avg BPM=");
                    Serial.print(beatAvg);
                    Serial.print(", SpO2=");
                    Serial.print(spo2, 2);
                    Serial.println();
                }
                else
                {
                    storeLocally(Send_Data); // Store locally if server fails
                }
            }
            else
            {
                flashLED("yellow", 500); // Flash yellow for no Wi-Fi
                storeLocally(Send_Data);
            }
        }

        if (irValue < 50000)
        {
            Serial.println("No finger?");
        }
    }

    // Reconnect Wi-Fi if disconnected
    if (!WiFi.ready() && millis() - lastReconnectAttempt > reconnectInterval)
    {
        lastReconnectAttempt = millis();
        WiFi.connect();
    }

    // Attempt to send stored measurements if Wi-Fi is connected
    if (WiFi.ready() && storedCount > 0)
    {
        sendStoredMeasurements();
    }
}

bool sendToServer(String measurement)
{
    bool published = Particle.publish("temp", measurement, PRIVATE);
    if (published)
    {
        delay(1000); // Simulate waiting for server confirmation
        return true;
    }
    return false;
}

void storeLocally(String measurement)
{
    if (storedCount < maxStoredMeasurements)
    {
        strncpy(storedMeasurements[storedCount].data, measurement.c_str(), sizeof(storedMeasurements[storedCount].data));
        storedMeasurements[storedCount].timestamp = millis();
        storedCount++;
        Serial.println("Measurement stored locally.");
    }
    else
    {
        Serial.println("Local storage full. Dropping measurement.");
    }
}

void sendStoredMeasurements()
{
    for (int i = 0; i < storedCount; i++)
    {
        if (millis() - storedMeasurements[i].timestamp < maxStorageTime)
        {
            if (sendToServer(String(storedMeasurements[i].data)))
            {
                Serial.println("Stored measurement sent successfully.");
                // Shift measurements down
                for (int j = i; j < storedCount - 1; j++)
                {
                    storedMeasurements[j] = storedMeasurements[j + 1];
                }
                storedCount--;
                i--;
            }
            else
            {
                Serial.println("Failed to send stored measurement.");
                break;
            }
        }
        else
        {
            Serial.println("Dropping expired measurement.");
            for (int j = i; j < storedCount - 1; j++)
            {
                storedMeasurements[j] = storedMeasurements[j + 1];
            }
            storedCount--;
            i--;
        }
    }
}

void flashLED(String color, int duration)
{
    if (color == "green")
    {
        RGB.color(0, 255, 0); // Green
    }
    else if (color == "yellow")
    {
        RGB.color(255, 255, 0); // Yellow
    }
    else if(color == "blue") {
        
        RGB.color(0,0, 255);
    }
    else
    {
        RGB.color(0, 0, 0); // Off
    }
    delay(duration);
    RGB.color(0, 0, 0);
}