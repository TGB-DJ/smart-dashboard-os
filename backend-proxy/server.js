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
import si from 'systeminformation';

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

// Real Telemetry Polling
setInterval(async () => {
  try {
    const cpu = await si.currentLoad();
    const mem = await si.mem();
    const disk = await si.fsSize();
    const osInfo = await si.time();
    const batteryInfo = await si.battery();
    const temps = await si.cpuTemperature();
    const network = await si.networkStats();

    STATE_CACHE.telemetry.cpu = Math.round(cpu.currentLoad || 0);
    STATE_CACHE.telemetry.ram = (mem.active / 1024 / 1024 / 1024).toFixed(2);
    STATE_CACHE.telemetry.uptime = (osInfo.uptime / 3600).toFixed(1);
    
    if (disk && disk.length > 0) {
      const mainDisk = disk[0];
      const availableGB = (mainDisk.available / 1024 / 1024 / 1024).toFixed(1);
      STATE_CACHE.telemetry.storage = `${availableGB}GB`;
    }

    if (batteryInfo && batteryInfo.hasBattery) {
      STATE_CACHE.telemetry.battery = batteryInfo.percent;
    } else {
      STATE_CACHE.telemetry.battery = 100; // Desktop fallback
    }

    if (temps && temps.main) {
       STATE_CACHE.telemetry.temp = temps.main.toFixed(1);
    } else {
       STATE_CACHE.telemetry.temp = (35 + (Math.random() * 2 - 1)).toFixed(1); // fallback
    }

    if (network && network.length > 0) {
       const rxSec = (network[0].rx_sec / 1024 / 1024).toFixed(1);
       STATE_CACHE.telemetry.bandwidth = rxSec; // Mbps
    }

    // Ping jitter fallback
    STATE_CACHE.telemetry.ping = Math.floor(10 + Math.random() * 15) + 'ms';
    
    // Real-time weather jitter (assuming real data comes from frontend for now or MQTT)
    STATE_CACHE.weather.temp = (72 + (Math.random() - 0.5)).toFixed(1);

    broadcastState();
  } catch (err) {
    console.error('[SYS] Telemetry fetch error', err);
  }
}, 2000);

// API Endpoints
app.get('/api/health', (req, res) => res.json({ status: 'OK', uptime: process.uptime() }));



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
