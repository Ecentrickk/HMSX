/**
 * ==============================================================================
 * H1MS HARDWARE DAEMON (DEMO)
 * ==============================================================================
 * 
 * This is a standalone Node.js script that demonstrates how you can bridge
 * physical medical hardware (like an ECG or continuous vital signs monitor)
 * with the H1MS server over a local LAN connection.
 * 
 * In a real hospital environment, this script (or something like it written in 
 * Python, C++, or Node) would run on a Raspberry Pi or a lightweight local 
 * server connected to the medical device via USB, Serial, or Bluetooth.
 * 
 * It reads the live serial data from the machine, formats it, and POSTs it 
 * to the H1MS /api/pulse webhook on the local network.
 * 
 * Usage for testing:
 * node scripts/hardware-daemon.js <patient_id>
 */

const http = require('http');

const API_URL = 'http://localhost:3000/api/pulse'; // Replace with the actual H1MS LAN IP when deployed (e.g., 192.168.1.100)
const API_KEY = process.env.HARDWARE_API_KEY || 'demo-key';

const patientId = process.argv[2];

if (!patientId) {
  console.error("Usage: node hardware-daemon.js <patient_id>");
  process.exit(1);
}

console.log(`Starting Hardware Daemon Simulation for Patient ID: ${patientId}`);
console.log(`Target LAN Server: ${API_URL}`);

// Simulate a continuous medical monitor sending data every 5 seconds
setInterval(() => {
  // Mock data that would normally come from the Serial/Bluetooth port
  const payload = JSON.stringify({
    patientId: patientId,
    heartRate: Math.floor(Math.random() * (90 - 60) + 60), // Random 60-90 bpm
    oxygenSat: Math.floor(Math.random() * (100 - 95) + 95), // Random 95-100%
    bloodPressureSystolic: Math.floor(Math.random() * (130 - 110) + 110),
    bloodPressureDiastolic: Math.floor(Math.random() * (85 - 70) + 70),
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'x-api-key': API_KEY
    }
  };

  const req = http.request(API_URL, options, (res) => {
    if (res.statusCode === 200) {
      console.log(`[OK] Vitals dispatched successfully to H1MS.`);
    } else {
      console.warn(`[WARN] Server rejected payload. Status: ${res.statusCode}`);
    }
  });

  req.on('error', (e) => {
    console.error(`[ERROR] Connection failed: ${e.message}`);
  });

  req.write(payload);
  req.end();
}, 5000);
