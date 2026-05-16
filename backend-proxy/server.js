/**
 * BACKEND PROXY GATEWAY
 * Enterprise Edge Gateway for Smart Dashboard
 */
import express from 'express';
import { WebSocketServer } from 'ws';
import mqtt from 'mqtt';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, '../profile.config.json');

// Initialize Express
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/api/live-stream' });

// Load Configuration
let config = {};
try {
  config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  console.log('[SYS] Configuration Loaded.');
} catch (e) {
  console.error('[ERR] Failed to load profile.config.json', e);
}

// In-Memory State Cache
const STATE_CACHE = {
  automation: config.automation || [],
  telemetry: { battery: 100, temp: 35, storage: '128GB', ping: '12ms', cpu: 14, ram: 1.4, gpu: 22, diskIO: 45, bandwidth: 120, uptime: 24 },
  weather: { temp: 72, aqi: 12, uv: 3.5 }
};

// WebSocket Broadcaster
function broadcastState() {
  const payload = JSON.stringify({ type: 'SYNC_STATE', payload: STATE_CACHE });
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(payload);
  });
}

// WebSocket Connection Handler
wss.on('connection', (ws) => {
  console.log('[WS] Client Connected');
  ws.send(JSON.stringify({ type: 'INIT_STATE', payload: STATE_CACHE, config: config }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'TOGGLE_DEVICE') {
        const device = STATE_CACHE.automation.find(d => d.id === data.id);
        if (device) {
          device.state = data.state;
          broadcastState();
        }
      } else if (data.type === 'SLIDER_UPDATE') {
        const device = STATE_CACHE.automation.find(d => d.id === data.id);
        if (device) {
          device.state = data.state;
          broadcastState();
        }
      } else if (data.type === 'VOICE_COMMAND') {
        console.log('[VOICE] Command Received:', data.command);
        // Map simple mock voice commands
        if (data.command.includes('light')) {
           const light = STATE_CACHE.automation.find(d => d.id === 'light_main');
           if(light) { light.state = !light.state; broadcastState(); }
        }
      }
    } catch (e) {
      console.error('[WS ERR] Invalid payload', e);
    }
  });
});

// MQTT Client Configuration (Local Listener)
// Note: Fallback to mock data if broker is not available
const mqttClient = mqtt.connect('mqtt://localhost:1883', { reconnectPeriod: 5000 });
mqttClient.on('connect', () => {
  console.log('[MQTT] Connected to Local Broker');
  mqttClient.subscribe('kiosk/telemetry');
});

mqttClient.on('message', (topic, message) => {
  if (topic === 'kiosk/telemetry') {
    try {
      // String handling pipeline to bypass heavy parsing where possible
      const raw = message.toString();
      const payload = JSON.parse(raw);
      STATE_CACHE.telemetry = { ...STATE_CACHE.telemetry, ...payload };
      broadcastState();
    } catch(e) {}
  }
});

// Mock Telemetry Polling (Real-time jitter)
setInterval(() => {
  STATE_CACHE.telemetry.temp = (35 + (Math.random() * 2 - 1)).toFixed(1); // Temp fluctuation
  STATE_CACHE.telemetry.ping = Math.floor(10 + Math.random() * 15) + 'ms';
  STATE_CACHE.telemetry.cpu = Math.floor(12 + Math.random() * 15); // 12-27%
  STATE_CACHE.telemetry.ram = (1.4 + Math.random() * 0.2).toFixed(2); // 1.4-1.6GB
  STATE_CACHE.telemetry.gpu = Math.floor(20 + Math.random() * 10); // GPU
  STATE_CACHE.telemetry.diskIO = Math.floor(30 + Math.random() * 20); // Disk IO MB/s
  STATE_CACHE.telemetry.bandwidth = Math.floor(100 + Math.random() * 50); // Mbps

  // Simulate battery drain very slowly, occasionally test critical
  if(Math.random() > 0.99) STATE_CACHE.telemetry.battery -= 1;
  if(STATE_CACHE.telemetry.battery < 0) STATE_CACHE.telemetry.battery = 100;
  
  // Real-time weather jitter
  STATE_CACHE.weather.temp = (72 + (Math.random() - 0.5)).toFixed(1);

  broadcastState();
}, 2000);

// API Endpoints
app.get('/api/health', (req, res) => res.json({ status: 'OK', uptime: process.uptime() }));

// =========================================================================
// GOOGLE CALENDAR API INTEGRATION
// Project ID: i-matrix-496521-a1 (Project Number: 486577178504)
// =========================================================================
app.get('/api/calendar', async (req, res) => {
  try {
    // Looks for the downloaded Service Account key in the root folder
    const credsPath = path.join(__dirname, '../google-credentials.json');
    if (!fs.existsSync(credsPath)) {
      return res.status(404).json({ error: 'Missing google-credentials.json file. Please download it from GCP.' });
    }
    
    // Authenticate using the Service Account
    const auth = new google.auth.GoogleAuth({
      keyFile: credsPath,
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    const calendar = google.calendar({ version: 'v3', auth });
    
    // Fetch the 5 most recent upcoming events
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 5,
      singleEvents: true,
      orderBy: 'startTime',
    });

    res.json({ events: response.data.items });
  } catch (error) {
    console.error('[CALENDAR ERR]', error.message);
    res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// AMAZON ALEXA SMART HOME INTEGRATION
// Skill ID: amzn1.ask.skill.b33a7451-f854-4d93-aa21-18b048bc38e7
// =========================================================================
app.use(express.json()); // Ensure JSON body parsing is active

app.post('/api/alexa/fulfillment', (req, res) => {
  const { request, session } = req.body;
  
  // 1. Validate the Skill ID matches your Amazon account
  if (session?.application?.applicationId !== 'amzn1.ask.skill.b33a7451-f854-4d93-aa21-18b048bc38e7') {
    return res.status(403).json({ error: 'Unauthorized Alexa Skill ID' });
  }

  // 2. Process Voice Commands (e.g., "Alexa, turn on the Living Room light")
  if (request?.type === 'IntentRequest' && request?.intent?.name === 'TurnOnIntent') {
    // Modify local state and broadcast to the Vue Dashboard immediately
    const deviceName = request.intent.slots.Device.value;
    console.log(`[ALEXA] Voice command received to turn ON: ${deviceName}`);
    
    // (Actual local network trigger logic would execute here)
    
    res.json({
      version: '1.0',
      response: {
        outputSpeech: { type: 'PlainText', text: `Okay, turning on ${deviceName}.` },
        shouldEndSession: true
      }
    });
  } else {
    res.json({ version: '1.0', response: { shouldEndSession: true } });
  }
});

const PORT = process.env.PORT || 3333;
server.listen(PORT, () => {
  console.log(`[SYS] Edge Gateway running on port ${PORT}`);
});
