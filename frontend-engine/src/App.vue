<template>
  <div class="min-h-screen bg-[#050505] text-white font-['Inter'] overflow-hidden selection:bg-emerald-500/30">
    <!-- Main Background / Atmosphere -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden">
      <div class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse"></div>
      <div class="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style="animation-delay: 2s"></div>
    </div>

    <!-- PWA / Offline Status Island -->
    <Transition name="island">
      <div v-if="persistentAlert" class="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-2 bg-red-500/20 backdrop-blur-xl border border-red-500/30 rounded-full text-[11px] font-bold tracking-widest uppercase flex items-center gap-3">
        <span class="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
        {{ persistentAlert }}
      </div>
    </Transition>

    <!-- App Context / Viewport -->
    <div ref="viewport" class="relative h-screen flex overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth">
      
      <!-- PAGE 1: TELEMETRY & SYSTEM -->
      <section class="flex-none w-screen h-full snap-start p-10 flex flex-col relative">
        <div class="grid grid-cols-12 gap-8 h-full">
          
          <!-- Left Column: Metrics & Health -->
          <div class="col-span-4 flex flex-col gap-6">
            <header class="mb-4">
              <h2 class="text-4xl font-black tracking-tighter mb-1">DASHBOARD<span class="text-emerald-500">.</span></h2>
              <p class="text-xs text-gray-500 font-medium tracking-[0.2em] uppercase">{{ currentDate }}</p>
            </header>

            <!-- Real-time Metrics Grid -->
            <div class="grid grid-cols-1 gap-4 flex-grow">
              <div v-for="metric in allMetricsList" :key="metric.id" class="glass-panel p-6 rounded-2xl group transition-all hover:bg-white/[0.03]">
                <div class="flex justify-between items-start mb-2">
                  <span class="text-[10px] font-bold tracking-widest text-gray-500 uppercase">{{ metric.label }}</span>
                  <div :class="`w-2 h-2 rounded-full bg-${metric.iconColor}-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]`"></div>
                </div>
                <div class="flex items-baseline gap-1">
                  <span class="text-3xl font-black tabular-nums">{{ telemetry[metric.id] }}{{ metric.unit }}</span>
                  <span class="text-[10px] font-bold text-gray-600 uppercase">{{ metric.suffix }}</span>
                </div>
                <div class="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div class="h-full bg-emerald-500 transition-all duration-1000" :style="{ width: telemetry[metric.id] + '%' }"></div>
                </div>
              </div>
            </div>

            <!-- Live weather preview -->
            <div v-if="weatherData.temp !== null" class="glass-panel p-4 rounded-xl relative group">
              <button @click="refreshWeather(false)" class="absolute top-2 right-2 text-[10px] text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">↻ Refresh</button>
              <div class="text-[9px] uppercase tracking-widest text-gray-500 mb-3 font-bold">Live Readings: {{ config.customLocation }}</div>
              <div class="grid grid-cols-3 gap-3 text-center">
                <div class="flex flex-col">
                  <span class="text-lg font-black">{{ formatMetricValue(weatherData.temp, 'temp') }}°{{ config.tempUnit }}</span>
                  <span class="text-[9px] text-gray-500 uppercase tracking-widest">Temp</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-lg font-black text-blue-400">{{ weatherData.humidity }}%</span>
                  <span class="text-[9px] text-gray-500 uppercase tracking-widest">Humidity</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-lg font-black text-indigo-400">{{ weatherData.windSpeed }}</span>
                  <span class="text-[9px] text-gray-500 uppercase tracking-widest">km/h Wind</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Middle Column: Main Visualizer / Clock Center -->
          <div class="col-span-8 flex flex-col gap-6">
            <div ref="clockStack" class="flex-grow glass-panel rounded-3xl relative overflow-hidden snap-y snap-mandatory scroll-smooth no-scrollbar" @mousedown="startGlobalHold('Settings')" @mouseup="endGlobalHold" @mouseleave="endGlobalHold">
              
              <!-- CLOCK MODE 1: THE ENGINE -->
              <div class="h-full w-full snap-start flex items-center justify-center relative cursor-none group">
                <canvas ref="clockCanvas" class="absolute inset-0 w-full h-full"></canvas>
                
                <!-- Digital Clock Overlay (Anti-Jitter) -->
                <div v-if="config.clockEngine === 'DIGITAL'" class="relative z-10 flex flex-col items-center select-none" :class="{ 'animate-clock-change': isChangingClock }">
                  <div class="flex gap-4 sm:gap-6 items-center">
                    <div class="flex gap-1 sm:gap-2">
                      <div class="clock-digit">{{ currentTime.h1 }}</div>
                      <div class="clock-digit">{{ currentTime.h2 }}</div>
                    </div>
                    <div class="text-6xl sm:text-8xl font-black text-emerald-500/50 animate-pulse">:</div>
                    <div class="flex gap-1 sm:gap-2">
                      <div class="clock-digit">{{ currentTime.m1 }}</div>
                      <div class="clock-digit">{{ currentTime.m2 }}</div>
                    </div>
                  </div>
                  <div class="mt-4 flex gap-4 text-xs font-bold tracking-[0.5em] text-gray-500 uppercase">
                    <span>{{ currentDate.split(',')[0] }}</span>
                    <span class="text-emerald-500/50">//</span>
                    <span>{{ currentDate.split(',')[1] }}</span>
                  </div>
                </div>

                <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div v-for="i in 3" :key="i" class="w-1.5 h-1.5 rounded-full" :class="i === 1 ? 'bg-emerald-500' : 'bg-white/10'"></div>
                </div>
              </div>

              <!-- CLOCK MODE 2: THE CALENDAR -->
              <div class="h-full w-full snap-start p-12 flex flex-col">
                <h3 class="text-xs font-bold tracking-[0.3em] text-emerald-500 uppercase mb-8">Up Next / Schedule</h3>
                <div class="flex-grow space-y-4 overflow-y-auto no-scrollbar">
                  <div v-for="(event, i) in calendarEvents" :key="i" class="flex gap-6 items-center p-6 bg-white/[0.02] border border-white/5 rounded-2xl transition-all hover:bg-white/[0.05]">
                    <div class="text-2xl font-black text-gray-700 w-16">{{ event.time }}</div>
                    <div>
                      <div class="text-lg font-bold">{{ event.title }}</div>
                      <div class="text-xs text-gray-500 uppercase tracking-widest">{{ event.location }}</div>
                    </div>
                  </div>
                  <div v-if="calendarEvents.length === 0" class="h-full flex items-center justify-center text-gray-600 text-sm italic">
                    No remaining events for today.
                  </div>
                </div>
              </div>
            </div>

            <!-- Bottom Bar: Quick Automation -->
            <div class="h-48 grid grid-cols-4 gap-6">
              <div v-for="node in automation.slice(0,4)" :key="node.id" 
                   @click="toggleDevice(node)"
                   class="glass-panel rounded-2xl p-6 flex flex-col justify-between cursor-pointer transition-all active:scale-95 group relative overflow-hidden"
                   :class="node.state ? 'bg-emerald-500/10 border-emerald-500/30' : 'hover:bg-white/[0.03]'">
                <div class="flex justify-between items-start">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all"
                       :class="node.state ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-white/5 text-gray-400'">
                    {{ node.icon }}
                  </div>
                  <div class="w-2 h-2 rounded-full" :class="node.state ? 'bg-emerald-500 animate-pulse' : 'bg-gray-700'"></div>
                </div>
                <div>
                  <div class="text-sm font-black">{{ node.name }}</div>
                  <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{{ node.state ? 'Active' : 'Standby' }}</div>
                </div>
                <div class="absolute -right-4 -bottom-4 text-6xl opacity-[0.03] group-hover:opacity-[0.05] transition-opacity select-none font-black">{{ node.id }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- PAGE 2: FULL AUTOMATION GRID -->
      <section class="flex-none w-screen h-full snap-start p-10 flex flex-col">
        <header class="flex justify-between items-end mb-10">
          <div>
            <h2 class="text-5xl font-black tracking-tighter">NODES<span class="text-emerald-500">.</span></h2>
            <p class="text-xs text-gray-500 font-bold tracking-[0.2em] uppercase">Control Matrix / {{ automation.length }} Connected</p>
          </div>
          <div class="flex gap-4">
            <button @click="openEditMode" class="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all">Configure</button>
          </div>
        </header>

        <div class="flex-grow grid grid-cols-4 gap-6 overflow-y-auto no-scrollbar pr-4 pb-10">
          <div v-for="node in automation" :key="node.id"
               @click="toggleDevice(node)"
               class="glass-panel p-8 rounded-3xl flex flex-col justify-between aspect-square cursor-pointer transition-all hover:bg-white/[0.03] group relative"
               :class="node.state ? 'bg-emerald-500/10 border-emerald-500/30' : ''">
            <div class="flex justify-between items-start">
              <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-all"
                   :class="node.state ? 'bg-emerald-500 text-black' : 'bg-white/5 text-gray-500'">
                {{ node.icon }}
              </div>
              <div class="flex flex-col items-end">
                <div class="text-[10px] font-black text-gray-600 mb-1">0{{ node.id }}</div>
                <div class="w-3 h-3 rounded-full" :class="node.state ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gray-800'"></div>
              </div>
            </div>
            <div>
              <div class="text-2xl font-black mb-1">{{ node.name }}</div>
              <div class="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{{ node.state ? 'System Online' : 'Offline / Idle' }}</div>
            </div>
            <!-- Interactive Visual Feedback -->
            <div v-if="node.state" class="absolute bottom-8 right-8 flex gap-1 items-end h-4">
              <div v-for="i in 3" :key="i" class="w-1 bg-emerald-500/50 rounded-full animate-[wave-peak_1s_infinite]" :style="{ animationDelay: (i * 0.2) + 's' }"></div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- UI Overlay Elements -->
    <div class="fixed top-8 right-8 z-[100] flex gap-4 items-center">
      <div v-if="isListening" class="px-4 py-2 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-full animate-pulse flex items-center gap-2">
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
        </span>
        Listening
      </div>
      <button @click="startVoiceRecognition" class="w-12 h-12 bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-xl transition-all active:scale-90">
        🎙️
      </button>
    </div>

    <!-- Bottom Navigation / Progress -->
    <div class="fixed bottom-10 left-1/2 -translate-x-1/2 flex gap-4 z-[90]">
      <div v-for="i in 2" :key="i" class="w-20 h-1 rounded-full transition-all duration-500" :class="currentPage === i ? 'bg-emerald-500' : 'bg-white/10'"></div>
    </div>

    <!-- Global Alert Toast -->
    <Transition name="island">
      <div v-if="alertMessage" class="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-8 py-3 bg-white text-black text-[11px] font-black tracking-widest uppercase rounded-full shadow-2xl flex items-center gap-3">
        ⚡ {{ alertMessage }}
      </div>
    </Transition>

    <!-- SETTINGS / CUSTOMIZER DRAWER -->
    <Transition name="drawer">
      <div v-if="isEditMode" class="fixed inset-0 z-[200] flex justify-end" @click="handleGlobalClick">
        <div class="edit-drawer w-[450px] h-full bg-[#080808]/95 backdrop-blur-3xl border-l border-white/10 p-12 flex flex-col shadow-[-50px_0_100px_rgba(0,0,0,0.5)]">
          <header class="mb-12 flex justify-between items-center">
            <div>
              <h3 class="text-3xl font-black tracking-tighter">SETTINGS</h3>
              <p class="text-[10px] text-gray-500 font-bold tracking-[0.2em] uppercase">Tailor your interface</p>
            </div>
            <button @click="isEditMode = false" class="text-2xl hover:rotate-90 transition-transform">✕</button>
          </header>

          <div class="space-y-12 overflow-y-auto no-scrollbar pr-4">
            <!-- Appearance Section -->
            <div class="space-y-6">
              <label class="text-[10px] font-black tracking-[0.3em] text-emerald-500 uppercase block">Engine Architecture</label>
              <div class="grid grid-cols-2 gap-4">
                <button v-for="mode in ['DIGITAL', 'ANALOG']" :key="mode" 
                        @click="config.clockEngine = mode"
                        class="p-4 rounded-xl border text-[11px] font-bold tracking-widest transition-all"
                        :class="config.clockEngine === mode ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-white/5 border-white/5 text-gray-400'">
                  {{ mode }}
                </button>
              </div>
            </div>

            <!-- Dynamic Settings -->
            <div class="space-y-6">
              <label class="text-[10px] font-black tracking-[0.3em] text-emerald-500 uppercase block">Analog Aesthetics</label>
              <div class="grid grid-cols-2 gap-4">
                <button v-for="style in ['Minimal', 'Chronograph', 'Neon']" :key="style" 
                        @click="config.analogStyle = style"
                        class="p-4 rounded-xl border text-[11px] font-bold tracking-widest transition-all"
                        :class="config.analogStyle === style ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-white/5 border-white/5 text-gray-400'">
                  {{ style }}
                </button>
              </div>
            </div>

            <div class="space-y-6">
              <label class="text-[10px] font-black tracking-[0.3em] text-emerald-500 uppercase block">Weather Localization</label>
              <input v-model="config.customLocation" placeholder="Enter City..." 
                     class="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold focus:outline-none focus:border-emerald-500 transition-colors">
              <p class="text-[9px] text-gray-600 leading-relaxed font-bold">Location data is used for local weather polling and regional telemetry sync.</p>
            </div>

            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-xs font-bold">Analog Sweep Motion</span>
                <button @click="config.analogSweep = !config.analogSweep" 
                        class="w-12 h-6 rounded-full relative transition-colors"
                        :class="config.analogSweep ? 'bg-emerald-500' : 'bg-gray-800'">
                  <div class="absolute top-1 w-4 h-4 bg-white rounded-full transition-all" :class="config.analogSweep ? 'left-7' : 'left-1'"></div>
                </button>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs font-bold">24-Hour Format</span>
                <button @click="config.is24Hour = !config.is24Hour" 
                        class="w-12 h-6 rounded-full relative transition-colors"
                        :class="config.is24Hour ? 'bg-emerald-500' : 'bg-gray-800'">
                  <div class="absolute top-1 w-4 h-4 bg-white rounded-full transition-all" :class="config.is24Hour ? 'left-7' : 'left-1'"></div>
                </button>
              </div>
            </div>

            <div class="pt-8 mt-12 border-t border-white/5">
              <button @click="isEditMode = false; showAlert('Config Saved Locally')" 
                      class="w-full py-4 bg-emerald-500 text-black font-black text-[12px] tracking-[0.3em] uppercase rounded-xl shadow-[0_20px_40px_rgba(16,185,129,0.3)] transition-all active:scale-95">
                Commit Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue'

// --- STATE MANAGEMENT ---
const config = reactive(JSON.parse(localStorage.getItem('smart_config')) || {
  clockEngine: 'DIGITAL',
  analogStyle: 'Neon',
  analogSweep: true,
  is24Hour: true,
  tempUnit: 'C',
  customLocation: 'Loading...',
  theme: 'Midnight'
})

const automation = ref(JSON.parse(localStorage.getItem('smart_nodes')) || [
  { id: 1, name: 'Main Lights', state: false, icon: '💡' },
  { id: 2, name: 'Air Purifier', state: true, icon: '🌪️' },
  { id: 3, name: 'Door Lock', state: false, icon: '🔒' },
  { id: 4, name: 'Media Server', state: true, icon: '🖥️' },
  { id: 5, name: 'HVAC Unit', state: false, icon: '❄️' },
  { id: 6, name: 'Security Cam', state: true, icon: '📷' },
  { id: 7, name: 'Garage Gate', state: false, icon: '🚗' },
  { id: 8, name: 'Garden Mist', state: false, icon: '💧' }
])

// Persistent storage watchers
watch(config, (val) => localStorage.setItem('smart_config', JSON.stringify(val)), { deep: true })
watch(automation, (val) => localStorage.setItem('smart_nodes', JSON.stringify(val)), { deep: true })

// --- UI STATE ---
const viewport = ref(null)
const clockStack = ref(null)
const clockCanvas = ref(null)
const alertMessage = ref('')
const persistentAlert = ref('')
const isListening = ref(false)
const isEditMode = ref(false)
const drawerOpenTime = ref(0)
const currentPage = ref(1)
const isChangingClock = ref(false)

const telemetry = ref({
  battery: 100,
  temp: 34,
  cpu: 12,
  ram: 4.2,
  storage: '124',
  weather: 'Sunny'
})

const weatherData = ref({
  temp: null,
  aqi: 24,
  uv: 2,
  humidity: 45,
  windSpeed: 12,
  precipitation: 0
})

const calendarEvents = ref([
  { time: '14:00', title: 'Product Design Sync', location: 'Meeting Room A' },
  { time: '16:30', title: 'Smart Node Calibration', location: 'Lab 04' },
  { time: '19:00', title: 'System Backup Cycle', location: 'Cloud Edge' }
])

const currentTime = reactive({ h1: '0', h2: '0', m1: '0', m2: '0', s: '00' })
const currentDate = ref('')

const accentColor = computed(() => {
  if (config.analogStyle === 'Neon') return '#10b981'
  if (config.analogStyle === 'Chronograph') return '#3b82f6'
  return '#ffffff'
})

// --- CORE ENGINES ---

function updateDate() {
  const now = new Date()
  const options = { weekday: 'long', month: 'long', day: 'numeric' }
  currentDate.value = now.toLocaleDateString('en-US', options).toUpperCase()
}

// Logic for anti-jitter digital clock
function updateDigitalClock() {
  const now = new Date()
  let h = now.getHours()
  if (!config.is24Hour) h = h % 12 || 12
  const m = now.getMinutes()
  const s = now.getSeconds()

  const hStr = h.toString().padStart(2, '0')
  const mStr = m.toString().padStart(2, '0')

  currentTime.h1 = hStr[0]
  currentTime.h2 = hStr[1]
  currentTime.m1 = mStr[0]
  currentTime.m2 = mStr[1]
  currentTime.s = s.toString().padStart(2, '0')
}

let clockAnimFrame = null
function renderClock() {
  updateDigitalClock()
  
  if (!clockCanvas.value) {
    clockAnimFrame = requestAnimationFrame(renderClock)
    return
  }

  const canvas = clockCanvas.value
  const ctx = canvas.getContext('2d')
  const width = canvas.width = canvas.offsetWidth * window.devicePixelRatio
  const height = canvas.height = canvas.offsetHeight * window.devicePixelRatio
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

  const now = new Date()
  ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

  if (config.clockEngine === 'ANALOG') {
    const cx = canvas.offsetWidth / 2
    const cy = canvas.offsetHeight / 2 - 20
    const r = 160

    // Dial
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = config.analogStyle === 'Neon' ? accentColor.value : 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 4
    if (config.analogStyle === 'Neon') {
      ctx.shadowColor = accentColor.value
      ctx.shadowBlur = 20
    }
    ctx.stroke()
    ctx.shadowBlur = 0

    // Ticks
    if (config.analogStyle !== 'Minimal') {
      for (let i = 0; i < 60; i++) {
        const angle = (i * Math.PI) / 30
        const isMajor = i % 5 === 0
        const innerR = isMajor ? r - 20 : r - 10
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR)
        ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r)
        ctx.strokeStyle = isMajor ? accentColor.value : 'rgba(255,255,255,0.2)'
        ctx.lineWidth = isMajor ? 3 : 1
        ctx.stroke()
      }
    }

    // Hands
    const h = now.getHours() % 12
    const m = now.getMinutes()
    const s = now.getSeconds()
    const ms = now.getMilliseconds()
    const sweep = config.analogSweep ? (ms / 1000) : 0

    const sAng = ((s + sweep) * Math.PI) / 30 - Math.PI / 2
    const mAng = ((m + s / 60) * Math.PI) / 30 - Math.PI / 2
    const hAng = ((h + m / 60) * Math.PI) / 6 - Math.PI / 2

    const drawHand = (angle, len, wide, color, glow = false) => {
      ctx.beginPath()
      ctx.lineCap = 'round'
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len)
      ctx.strokeStyle = color
      ctx.lineWidth = wide
      if (glow) {
        ctx.shadowColor = color
        ctx.shadowBlur = 15
      }
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    drawHand(hAng, r * 0.5, 8, 'white')
    drawHand(mAng, r * 0.75, 5, 'white')
    drawHand(sAng, r * 0.85, 2, accentColor.value, config.analogStyle === 'Neon')

    ctx.beginPath()
    ctx.arc(cx, cy, 6, 0, Math.PI * 2)
    ctx.fillStyle = accentColor.value
    ctx.fill()
  }

  clockAnimFrame = requestAnimationFrame(renderClock)
}

// --- WEATHER & LOCATION ---
async function fetchWeatherByCoords(lat, lon) {
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,windspeed_10m`)
    const data = await res.json()
    if (data.current_weather) {
      weatherData.value.temp = data.current_weather.temperature
      weatherData.value.windSpeed = data.current_weather.windspeed
      if (data.hourly) {
        const hourIdx = new Date().getHours()
        weatherData.value.humidity = data.hourly.relativehumidity_2m[hourIdx]
      }
      telemetry.value.weather = `Temp: ${data.current_weather.temperature}°`
    }
  } catch (e) { console.log('Weather Fetch Error', e) }
}

async function refreshWeather(silent = false) {
  if (!config.customLocation || config.customLocation === 'Loading...') return
  try {
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(config.customLocation)}&count=1`)
    const geoData = await geoRes.json()
    if (geoData.results && geoData.results.length > 0) {
      const loc = geoData.results[0]
      await fetchWeatherByCoords(loc.latitude, loc.longitude)
      if (!silent) showAlert('Weather Updated')
    }
  } catch(err) { if (!silent) showAlert('Refresh Failed') }
}

let weatherTimer = null
watch(() => config.customLocation, (newVal) => {
  if(!newVal || newVal === 'Loading...') return
  clearTimeout(weatherTimer)
  weatherTimer = setTimeout(refreshWeather, 1000)
})

// --- SYSTEM UTILS ---
function formatMetricValue(val, metricId) {
  if (val === null) return '--'
  return val
}

function showAlert(msg) {
  alertMessage.value = msg
  setTimeout(() => { alertMessage.value = '' }, 3000)
}

function openEditMode() {
  isEditMode.value = true
  drawerOpenTime.value = Date.now()
}

function handleGlobalClick(e) {
  if (isEditMode.value && (Date.now() - drawerOpenTime.value > 500)) {
    const drawer = document.querySelector('.edit-drawer')
    if (drawer && !drawer.contains(e.target)) isEditMode.value = false
  }
}

let globalHoldTimer = null
function startGlobalHold(target) {
  globalHoldTimer = setTimeout(openEditMode, 1000)
}
function endGlobalHold() { clearTimeout(globalHoldTimer) }

function handleKeydown(e) {
  if (isEditMode.value) return
  const w = window.innerWidth
  if (e.key === 'ArrowRight') viewport.value?.scrollBy({ left: w, behavior: 'smooth' })
  if (e.key === 'ArrowLeft') viewport.value?.scrollBy({ left: -w, behavior: 'smooth' })
}

// --- WEBSOCKETS (MOCK/LOCAL) ---
let ws = null
function connectWebSocket() {
  const host = window.location.hostname
  const isLocal = host === 'localhost' || host === '127.0.0.1' || /^192\.168\./.test(host)
  if (!isLocal) return

  try {
    ws = new WebSocket(`ws://${host}:3333/api/live-stream`)
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'SYNC_STATE') telemetry.value = { ...telemetry.value, ...data.payload.telemetry }
      } catch(e) {}
    }
    ws.onclose = () => setTimeout(connectWebSocket, 5000)
  } catch(e) {}
}

function toggleDevice(device) {
  device.state = !device.state
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'TOGGLE_DEVICE', id: device.id, state: device.state }))
  }
}

function startVoiceRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) { showAlert('Voice Not Supported'); return }
  const recognition = new SpeechRecognition()
  recognition.onstart = () => { isListening.value = true }
  recognition.onresult = (e) => {
    const cmd = e.results[0][0].transcript.toLowerCase()
    showAlert(`CMD: ${cmd}`)
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'VOICE_COMMAND', command: cmd }))
  }
  recognition.onend = () => { isListening.value = false }
  recognition.start()
}

let autoRefreshInterval = null

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  updateDate()
  renderClock()
  connectWebSocket()

  // --- ROBUST LOCATION ENGINE ---
  const getIPLoc = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/')
      const data = await res.json()
      if (data.latitude && data.longitude) {
        await fetchWeatherByCoords(data.latitude, data.longitude)
        config.customLocation = data.city || 'Home'
      }
    } catch(e) {}
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords
        await fetchWeatherByCoords(lat, lon)
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
          const d = await r.json()
          config.customLocation = d.address?.city || d.address?.town || 'Home'
        } catch(e) {}
      },
      () => getIPLoc(),
      { timeout: 10000 }
    )
  } else { getIPLoc() }

  autoRefreshInterval = setInterval(() => refreshWeather(true), 60000)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (clockAnimFrame) cancelAnimationFrame(clockAnimFrame)
  if (ws) ws.close()
  if (autoRefreshInterval) clearInterval(autoRefreshInterval)
})
</script>

<style>
.animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
@keyframes wave-peak { 0%, 100% { height: 10%; } 50% { height: 100%; } }

.clock-digit {
  @apply w-[1.2ch] h-[1.5ch] bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-6xl sm:text-8xl font-black tabular-nums transition-all duration-300;
}

.glass-panel {
  @apply bg-white/[0.02] backdrop-blur-2xl border border-white/5 shadow-2xl;
}

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.island-enter-active, .island-leave-active { transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
.island-enter-from, .island-leave-to { opacity: 0; transform: translate(-50%, -20px) scale(0.9); }

.drawer-enter-active, .drawer-leave-active { transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
.drawer-enter-from, .drawer-leave-to { transform: translateX(100%); }
</style>
