<template>
  <div class="h-screen w-screen bg-os-bg overflow-hidden fixed inset-0 font-sans select-none" :style="{ '--os-indigo': accentColor }">
    
    <!-- SYSTEM ALERT LAYER (Dynamic Island) -->
    <Transition name="island">
      <div v-if="alertMessage || persistentAlert" class="fixed top-6 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full glass-panel z-[100] flex items-center gap-3 shadow-xl" :class="persistentAlert ? 'border-red-500/50 bg-red-900/40' : ''">
        <div class="w-2 h-2 rounded-full animate-pulse" :class="persistentAlert ? 'bg-red-500' : 'bg-[var(--os-indigo)]'"></div>
        <span class="text-xs font-bold uppercase tracking-widest text-white/90">{{ persistentAlert || alertMessage }}</span>
      </div>
    </Transition>

    <!-- HORIZONTAL VIEWPORT CAROUSEL -->
    <div 
      ref="viewport" 
      class="flex w-screen h-screen overflow-x-auto snap-x snap-mandatory no-scrollbar will-change-transform"
      @keydown="handleKeydown"
      tabindex="0"
    >
      
      <!-- PAGE 1: CORE AMBIENT ENGINE & VERTICAL STACK -->
      <div class="flex-none w-screen h-screen snap-start flex flex-col overflow-y-auto snap-y snap-mandatory no-scrollbar" ref="clockStack">
        
        <!-- 1.1: Clock Node -->
        <div 
          class="flex-none w-screen h-screen snap-start relative flex flex-col items-center justify-center cursor-pointer group"
          @pointerdown="startGlobalHold('clock')"
          @pointerup="endGlobalHold"
          @pointerleave="endGlobalHold"
        >
          <!-- WebGL/Canvas Fallback for Time -->
          <canvas ref="clockCanvas" class="absolute inset-0 pointer-events-none z-0" width="1560" height="720"></canvas>
          
          <!-- HTML Overlay for Digital Clock (Prevents Jitter via tabular-nums) -->
          <div v-if="config.clockEngine === 'DIGITAL'" class="absolute z-10 flex flex-col items-center justify-center font-black pointer-events-none transition-lcd select-none" :style="{ fontFamily: config.typography, color: accentColor, opacity: isChangingClock ? 0 : 1 }">
             <div class="text-[180px] leading-none whitespace-nowrap tracking-tighter" style="font-variant-numeric: tabular-nums;">{{ digitalTimeString }}</div>
             <div class="text-2xl font-bold tracking-[0.5em] uppercase mt-2 text-white/60" style="font-family: 'Inter', sans-serif;">{{ digitalDateString }}</div>
          </div>
          
          <!-- Smart Greeting -->
          <div class="absolute top-16 px-8 py-3 rounded-full glass-panel text-sm font-bold uppercase tracking-widest text-white/60 transition-all opacity-0 group-hover:opacity-100">{{ currentGreeting }}</div>

          <div class="absolute bottom-8 animate-bounce opacity-30 text-[10px] tracking-[0.5em] uppercase pointer-events-none">Swipe Down For Environment</div>
        </div>

        <!-- 1.2: Environment Weather Metrics -->
        <div class="flex-none w-screen h-screen snap-start p-16 flex flex-col justify-center relative" @pointerdown="startGlobalHold('environment')" @pointerup="endGlobalHold" @pointerleave="endGlobalHold">
          <h2 class="text-5xl font-black mb-12 text-white/40 italic uppercase tracking-tighter">Environment <span class="opacity-100" style="color: var(--os-indigo)">Intel</span></h2>
          <div class="grid grid-cols-4 gap-6 z-10 w-full max-w-7xl mx-auto flex-1 max-h-[75vh]">
            
            <!-- Location Precision -->
            <div class="glass-panel p-8 rounded-[32px] relative overflow-hidden group col-span-2">
              <div class="absolute -right-8 -bottom-12 text-[150px] opacity-[0.03] rotate-12 group-hover:scale-110 transition-transform duration-700">📍</div>
              <div class="text-[10px] uppercase text-gray-400 font-bold tracking-[0.3em] mb-3">Location Precision</div>
              <div class="text-4xl font-black tracking-tighter truncate mt-4" style="color: var(--os-indigo); font-family: 'JetBrains Mono', monospace;">{{ config.customLocation || config.location?.name || 'AQUIRING...' }}</div>
              <div class="text-[10px] text-white/40 mt-auto pt-6 flex items-center gap-2 uppercase tracking-widest font-bold">
                <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Live GPS Lock
              </div>
            </div>

            <!-- Atmosphere AQI -->
            <div class="glass-panel p-8 rounded-[32px] relative overflow-hidden group">
              <div class="absolute -right-8 -bottom-12 text-[100px] opacity-[0.03] -rotate-12 group-hover:scale-110 transition-transform duration-700">💨</div>
              <div class="text-[10px] uppercase text-gray-400 font-bold tracking-[0.3em] mb-3">Atmosphere AQI</div>
              <div class="flex items-end gap-2 mt-4">
                <div class="text-5xl font-black text-emerald-400 leading-none">{{ weatherData.aqi || '--' }}</div>
                <div class="text-xs text-emerald-400/60 font-bold mb-1 tracking-widest uppercase">PM2.5</div>
              </div>
              <div class="mt-auto pt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div class="h-full bg-emerald-400 w-[30%] shadow-[0_0_10px_#34d399]"></div>
              </div>
            </div>

            <!-- UV Index -->
            <div class="glass-panel p-8 rounded-[32px] relative overflow-hidden group">
              <div class="absolute -right-8 -bottom-12 text-[100px] opacity-[0.03] rotate-45 group-hover:scale-110 transition-transform duration-700">☀️</div>
              <div class="text-[10px] uppercase text-gray-400 font-bold tracking-[0.3em] mb-3">Ultraviolet</div>
              <div class="text-5xl font-black text-amber-400 leading-none mt-4">{{ weatherData.uv || '--' }}</div>
              <div class="text-[10px] text-amber-400/70 mt-auto pt-6 font-bold uppercase tracking-widest">Moderate</div>
            </div>

            <!-- Climate Temp -->
            <div class="glass-panel p-8 rounded-[32px] relative overflow-hidden group">
              <div class="absolute -right-8 -bottom-12 text-[100px] opacity-[0.03] rotate-12 group-hover:scale-110 transition-transform duration-700">🌡️</div>
              <div class="text-[10px] uppercase text-gray-400 font-bold tracking-[0.3em] mb-3">Climate Temp</div>
              <div class="text-5xl font-black leading-none flex items-start mt-4">
                {{ weatherData.temp || '--' }}<span class="text-2xl mt-1 ml-1 text-white/30 font-light">°C</span>
              </div>
              <div class="text-[10px] text-cyan-400/70 mt-auto pt-6 font-bold uppercase tracking-widest flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Cooling Req
              </div>
            </div>

            <!-- Humidity -->
            <div class="glass-panel p-8 rounded-[32px] relative overflow-hidden group">
              <div class="absolute -right-8 -bottom-12 text-[100px] opacity-[0.03] rotate-12 group-hover:scale-110 transition-transform duration-700">💧</div>
              <div class="text-[10px] uppercase text-gray-400 font-bold tracking-[0.3em] mb-3">Humidity</div>
              <div class="text-5xl font-black leading-none flex items-start text-blue-400 mt-4">
                {{ weatherData.humidity || '--' }}<span class="text-2xl mt-1 ml-1 text-white/30 font-light">%</span>
              </div>
            </div>

            <!-- Wind Speed -->
            <div class="glass-panel p-8 rounded-[32px] relative overflow-hidden group">
              <div class="absolute -right-8 -bottom-12 text-[100px] opacity-[0.03] rotate-12 group-hover:scale-110 transition-transform duration-700">🌪️</div>
              <div class="text-[10px] uppercase text-gray-400 font-bold tracking-[0.3em] mb-3">Wind Speed</div>
              <div class="text-5xl font-black leading-none flex items-start text-indigo-400 mt-4">
                {{ weatherData.windSpeed || '--' }}<span class="text-2xl mt-1 ml-1 text-white/30 font-light">km/h</span>
              </div>
            </div>

            <!-- Precipitation -->
            <div class="glass-panel p-8 rounded-[32px] relative overflow-hidden group">
              <div class="absolute -right-8 -bottom-12 text-[100px] opacity-[0.03] rotate-12 group-hover:scale-110 transition-transform duration-700">☔</div>
              <div class="text-[10px] uppercase text-gray-400 font-bold tracking-[0.3em] mb-3">Precipitation</div>
              <div class="text-5xl font-black leading-none flex items-start text-purple-400 mt-4">
                {{ weatherData.precipitation || '--' }}<span class="text-2xl mt-1 ml-1 text-white/30 font-light">mm</span>
              </div>
            </div>

          </div><!-- /grid -->
        </div><!-- /environment panel -->

      </div><!-- /clockStack -->


      <!-- PAGE 2: SMART HOME CONTROL -->
      <div class="flex-none w-screen h-screen snap-start p-16 flex flex-col relative overflow-hidden" @pointerdown="startGlobalHold('smarthome')" @pointerup="endGlobalHold" @pointerleave="endGlobalHold">
        <h1 class="text-6xl font-black mb-12 text-white/40 italic uppercase tracking-tighter">Smart Home <span class="opacity-100" style="color: var(--os-indigo)">Control</span></h1>
        
        <!-- Dynamic Auto-Adjusting Grid -->
        <div class="grid gap-8 z-10 relative flex-1 min-h-0" :style="gridStyle">
          <div 
            v-for="device in automation" 
            :key="device.id"
            @click="toggleDevice(device)"
            class="glass-panel rounded-[32px] p-8 flex flex-col justify-between cursor-pointer transition-all duration-300 transition-lcd"
            :style="device.state ? `background: rgba(255,255,255,0.1); border-color: var(--os-indigo); box-shadow: 0 0 40px var(--os-indigo)` : ''"
          >
            <div class="text-4xl mb-4">{{ device.icon }}</div>
            <div>
              <div class="text-2xl font-bold mb-1 leading-tight">{{ device.name }}</div>
              <div class="text-[10px] uppercase tracking-widest" :class="device.state ? 'text-white' : 'text-gray-500'">
                {{ device.state ? 'Active' : 'Standby' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Voice Recognition Visualizer Layer -->
        <div class="absolute bottom-0 left-0 right-0 h-40 flex flex-col items-center justify-end pb-8 z-20">
          <div class="flex items-end gap-1 h-16 mb-4 transition-opacity duration-300 transition-lcd" :class="isListening ? 'opacity-100' : 'opacity-0'">
             <div v-for="i in 10" :key="i" class="w-1 rounded-full animate-[wave-peak_1.2s_infinite_ease-in-out]" :style="{ backgroundColor: 'var(--os-indigo)', animationDelay: `${i * 0.1}s` }"></div>
          </div>
          <button 
            @click="startVoiceRecognition"
            class="w-20 h-20 rounded-full glass-panel flex items-center justify-center active:scale-95 transition-transform border border-white/10"
          >
            <div class="w-10 h-10 bg-white rounded-full transition-shadow" :style="isListening ? `box-shadow: 0 0 30px var(--os-indigo); background: var(--os-indigo)` : ''"></div>
          </button>
        </div>
      </div>

      <!-- PAGE 3: DEVICE HEALTH -->
      <div class="flex-none w-screen h-screen snap-start flex flex-col overflow-y-auto snap-y snap-mandatory no-scrollbar" @pointerdown="startGlobalHold('health')" @pointerup="endGlobalHold" @pointerleave="endGlobalHold">
        <div class="flex-none w-screen h-screen snap-start p-16">
          <h1 class="text-6xl font-black mb-12 text-white/40 italic uppercase tracking-tighter">Device <span class="opacity-100" style="color: var(--os-indigo)">Health</span></h1>
          <div class="grid grid-cols-3 gap-6">
            
            <div v-for="mId in config.visibleMetrics" :key="mId" class="glass-panel p-8 rounded-[32px] flex items-center gap-6 group hover:scale-[1.02] transition-transform relative overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div v-if="getMetricDef(mId).iconColor === 'indigo' || getMetricDef(mId).iconColor === 'white'" class="text-4xl font-black flex items-baseline z-10" :style="{ color: 'var(--os-indigo)' }">
                {{ telemetry[mId] || 0 }}<span class="text-xl ml-1 text-white/40">{{ getMetricDef(mId).unit }}</span>
              </div>
              
              <div v-else class="w-20 h-20 rounded-full border-[4px] flex items-center justify-center text-2xl font-black z-10" :class="`border-${getMetricDef(mId).iconColor}-500/40 text-${getMetricDef(mId).iconColor}-400 shadow-[0_0_15px_rgba(0,0,0,0.5)] shadow-${getMetricDef(mId).iconColor}-500/20`">
                {{ telemetry[mId] || 0 }}<span class="text-xs ml-1 opacity-70">{{ getMetricDef(mId).unit }}</span>
              </div>
              
              <div class="z-10">
                <div class="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">{{ getMetricDef(mId).label }}</div>
                <div class="text-xl font-bold">{{ getMetricDef(mId).suffix }}</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- GLOBAL EDIT MODE OVERLAY (Sliding Drawer for Live Previews) -->
    <div 
      class="fixed top-0 bottom-0 right-0 w-[500px] bg-os-bg/90 backdrop-blur-[64px] z-[200] p-10 flex flex-col border-l border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] text-white transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
      :style="{ transform: isEditMode ? 'translateX(0)' : 'translateX(100%)' }"
    >
      <div class="flex justify-between items-center mb-8">
        <h2 class="text-3xl font-black uppercase tracking-widest text-white/90">Customizer</h2>
        <button @click="isEditMode = false" class="px-6 py-3 glass-panel rounded-full text-xs font-bold uppercase tracking-widest bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/40 transition-colors">Close</button>
      </div>

      <div class="flex-1 overflow-y-auto no-scrollbar space-y-10 pr-4">
        
        <!-- ================= CLOCK OPTIONS ================= -->
        <div v-if="isEditMode === 'clock'" class="space-y-10 animate-fade-in">
          <!-- Accent Color Picker -->
          <div>
            <h3 class="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4">Accent Color</h3>
            <div class="flex flex-wrap gap-4">
              <button v-for="color in themeColors" :key="color.hex" @click="accentColor = color.hex" class="w-12 h-12 rounded-full border-[3px] transition-transform hover:scale-110" :style="{ backgroundColor: color.hex, borderColor: accentColor === color.hex ? '#fff' : 'transparent', transform: accentColor === color.hex ? 'scale(1.15)' : 'scale(1)' }"></button>
            </div>
          </div>

          <!-- Clock Type Picker -->
          <div>
            <h3 class="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4">Clock Engine</h3>
            <div class="flex gap-4">
              <button @click="changeClockSetting('clockEngine', 'DIGITAL')" class="flex-1 py-3 glass-panel rounded-xl font-bold text-sm border-2 transition-all" :style="{ borderColor: config.clockEngine === 'DIGITAL' ? accentColor : 'transparent', color: config.clockEngine === 'DIGITAL' ? accentColor : 'white' }">DIGITAL</button>
              <button @click="changeClockSetting('clockEngine', 'ANALOG')" class="flex-1 py-3 glass-panel rounded-xl font-bold text-sm border-2 transition-all" :style="{ borderColor: config.clockEngine === 'ANALOG' ? accentColor : 'transparent', color: config.clockEngine === 'ANALOG' ? accentColor : 'white' }">ANALOG</button>
            </div>
          </div>

          <!-- DIGITAL SPECIFIC -->
          <div v-if="config.clockEngine === 'DIGITAL'" class="mb-10 animate-fade-in">
            <div class="flex items-center justify-between mb-4">
              <div class="text-sm font-bold text-gray-400 uppercase tracking-widest">Typography Face</div>
              <button @click="config.showSeconds = !config.showSeconds" class="text-xs px-3 py-1.5 rounded-full font-bold transition-colors" :style="config.showSeconds ? 'background: var(--os-indigo); color: white' : 'background: rgba(255,255,255,0.1); color: #aaa'">SECONDS: {{ config.showSeconds ? 'ON' : 'OFF' }}</button>
            </div>
            <div class="h-64 overflow-y-auto no-scrollbar grid grid-cols-2 gap-3 pr-2">
              <div v-for="font in availableFonts" :key="font" @click="changeClockSetting('typography', font)" 
                   class="cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center justify-center text-xl"
                   :style="{ fontFamily: font, borderColor: config.typography === font ? 'var(--os-indigo)' : 'transparent', background: config.typography === font ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)' }">
                {{ font }}
              </div>
            </div>
          </div>

          <!-- ANALOG SPECIFIC -->
          <div v-if="config.clockEngine === 'ANALOG'" class="mb-10 animate-fade-in">
            <div class="flex items-center justify-between mb-4">
              <div class="text-sm font-bold text-gray-400 uppercase tracking-widest">Analog Dial Style</div>
              <button @click="config.analogSweep = !config.analogSweep" class="text-xs px-3 py-1.5 rounded-full font-bold transition-colors" :style="config.analogSweep ? 'background: var(--os-indigo); color: white' : 'background: rgba(255,255,255,0.1); color: #aaa'">MOTION: {{ config.analogSweep ? 'SWEEP' : 'TICK' }}</button>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div v-for="style in ['Minimal', 'Standard', 'Chronograph', 'Neon']" :key="style" @click="changeClockSetting('analogStyle', style)"
                   class="cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center justify-center font-bold"
                   :style="{ borderColor: config.analogStyle === style ? 'var(--os-indigo)' : 'transparent', background: config.analogStyle === style ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)' }">
                {{ style }}
              </div>
            </div>
          </div>
        </div>

        <!-- ================= ENVIRONMENT OPTIONS ================= -->
        <div v-if="isEditMode === 'environment'" class="space-y-10 animate-fade-in">
          <!-- Location Picker -->
          <div>
            <h3 class="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4">Dashboard Location</h3>
            <input type="text" v-model="config.customLocation" placeholder="Enter City (e.g. New York, London)" class="w-full bg-white/5 border-2 border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:outline-none focus:border-[var(--os-indigo)] transition-colors mb-2" />
            <div class="text-[10px] text-gray-500 uppercase tracking-widest">Controls the Environment Intel weather data.</div>
          </div>
        </div>

        <!-- ================= HEALTH / TELEMETRY OPTIONS ================= -->
        <div v-if="isEditMode === 'health'" class="space-y-10 animate-fade-in">
          <!-- Telemetry Configuration -->
          <div>
            <h3 class="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4">Visible Metrics ({{ config.visibleMetrics.length }}/10)</h3>
            <div class="grid grid-cols-2 gap-2">
              <button 
                v-for="m in allMetricsList" 
                :key="m.id" 
                @click="toggleMetric(m.id)" 
                class="px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-left truncate"
                :style="config.visibleMetrics.includes(m.id) ? { backgroundColor: 'var(--os-indigo)', color: '#fff' } : {}"
                :class="config.visibleMetrics.includes(m.id) ? 'shadow-lg' : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'"
              >
                {{ m.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- ================= SMART HOME OPTIONS ================= -->
        <div v-if="isEditMode === 'smarthome'" class="space-y-10 animate-fade-in">
          <!-- Smart Home Manager -->
          <div>
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-xs text-gray-400 font-bold uppercase tracking-widest">Smart Devices ({{ automation.length }}/10)</h3>
              <button v-if="automation.length < 10" @click="addMockDevice" class="px-4 py-2 glass-panel rounded-full text-[10px] font-black text-white/80 uppercase hover:bg-white/10 transition-colors">+ Add Node</button>
            </div>
            <div class="flex flex-col gap-3">
              <div v-for="dev in automation" :key="dev.id" class="px-5 py-3 glass-panel rounded-xl flex items-center justify-between group">
                 <div class="flex flex-col gap-1 flex-1">
                   <div class="flex items-center gap-4">
                     <span class="text-xl">{{ dev.icon }}</span>
                     <input type="text" v-model="dev.name" @blur="syncDevices" class="bg-transparent border-b-2 border-transparent hover:border-white/20 focus:border-[var(--os-indigo)] focus:outline-none font-bold text-sm text-white w-full transition-colors py-1" />
                   </div>
                   <div class="flex items-center gap-4 pl-10">
                     <input type="text" v-model="dev.ip" @blur="syncDevices" placeholder="IP Address (192.168.1.x) or MQTT Topic" class="bg-transparent text-[10px] text-gray-500 font-mono tracking-widest focus:outline-none focus:text-[var(--os-indigo)] w-full transition-colors" />
                   </div>
                 </div>
                 <button @click="removeDevice(dev.id)" class="ml-4 w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-xs font-black hover:bg-red-500/40 transition-colors opacity-0 group-hover:opacity-100">✕</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>


  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, reactive } from 'vue'

// --- GLOBAL STATE ---
const savedConfig = localStorage.getItem('osConfig')
const initialConfig = savedConfig ? JSON.parse(savedConfig) : {
  clockEngine: 'DIGITAL',
  typography: 'Inter',
  analogStyle: 'Standard',
  analogSweep: false,
  showSeconds: true,
  customLocation: '',
  visibleMetrics: ['battery', 'temp', 'cpu', 'storage', 'ram', 'ping']
}

const config = reactive(initialConfig)

watch(config, (newVal) => {
  localStorage.setItem('osConfig', JSON.stringify(newVal))
}, { deep: true })

const weatherData = ref({ temp: 22.4, aqi: 12, uv: 3.5 })

const currentTime = ref(new Date())
let timeInterval = null

onMounted(() => {
  timeInterval = setInterval(() => {
    currentTime.value = new Date()
  }, 200)
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
})

const digitalTimeString = computed(() => {
  return currentTime.value.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: config.showSeconds ? '2-digit' : undefined 
  })
})

const digitalDateString = computed(() => {
  return currentTime.value.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
})

let weatherTimer = null
watch(() => config.customLocation, (newVal) => {
  if(!newVal) return
  clearTimeout(weatherTimer)
  weatherTimer = setTimeout(async () => {
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(newVal)}&count=1`)
      const geoData = await geoRes.json()
      if (geoData.results && geoData.results.length > 0) {
        const loc = geoData.results[0]
        const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,us_aqi&daily=uv_index_max&timezone=auto`)
        const wData = await wRes.json()
        weatherData.value = {
          temp: wData.current.temperature_2m,
          aqi: wData.current.us_aqi || Math.floor(Math.random() * 50),
          uv: wData.daily.uv_index_max ? wData.daily.uv_index_max[0] : (Math.random() * 8).toFixed(1)
        }
      }
    } catch(err) {
      console.log("Weather Fetch Error", err)
    }
  }, 1000)
})

const allMetricsList = [
  { id: 'battery', label: 'Power Level', unit: '%', suffix: 'Optimal', iconColor: 'emerald' },
  { id: 'temp', label: 'Core Temp', unit: '°', suffix: 'Stable', iconColor: 'amber' },
  { id: 'cpu', label: 'CPU Load', unit: '%', suffix: 'Processing', iconColor: 'cyan' },
  { id: 'ram', label: 'Memory', unit: 'GB', suffix: 'Allocated', iconColor: 'indigo' },
  { id: 'storage', label: 'Storage', unit: '', suffix: 'Available', iconColor: 'indigo' },
  { id: 'ping', label: 'Ping', unit: '', suffix: 'Connected', iconColor: 'amber' },
  { id: 'gpu', label: 'GPU Load', unit: '%', suffix: 'Rendering', iconColor: 'rose' },
  { id: 'diskIO', label: 'Disk I/O', unit: ' MB/s', suffix: 'Reading', iconColor: 'emerald' },
  { id: 'bandwidth', label: 'Bandwidth', unit: ' Mbps', suffix: 'Streaming', iconColor: 'cyan' },
  { id: 'uptime', label: 'Uptime', unit: ' Hr', suffix: 'Online', iconColor: 'indigo' }
]

function getMetricDef(id) {
  return allMetricsList.find(m => m.id === id) || allMetricsList[0]
}

function toggleMetric(id) {
  if (config.visibleMetrics.includes(id)) {
    config.visibleMetrics = config.visibleMetrics.filter(m => m !== id)
  } else {
    config.visibleMetrics.push(id)
  }
}

const currentGreeting = ref('Systems nominal.')
const greetingsLib = [
  "Systems nominal, Commander.", "Awaiting input.", "Dashboard OS operational.", 
  "All protocols green.", "Environment stable.", "Good to see you.", 
  "Sensors calibrated.", "Network synced.", "Power levels optimal."
]
function updateGreeting() {
  const hour = new Date().getHours()
  let prefix = "Good Evening."
  if(hour < 12) prefix = "Good Morning."
  else if(hour < 18) prefix = "Good Afternoon."
  currentGreeting.value = `${prefix} ${greetingsLib[Math.floor(Math.random() * greetingsLib.length)]}`
}
setInterval(updateGreeting, 30000)

const savedAutomation = localStorage.getItem('osAutomation')
const initialAutomation = savedAutomation ? JSON.parse(savedAutomation) : []
const automation = ref(initialAutomation)

watch(automation, (newVal) => {
  localStorage.setItem('osAutomation', JSON.stringify(newVal))
}, { deep: true })
const telemetry = ref({ battery: 100, temp: 35, storage: '128GB', ping: '10ms', weather: {} })
const alertMessage = ref('')
const persistentAlert = ref('')
const isListening = ref(false)
const clockStack = ref(null)
const viewport = ref(null)
const isChangingClock = ref(false)
const showCalendarDetails = ref(false)
const calendarEvents = ref([])

const availableFonts = ['Inter', 'Orbitron', 'Bebas Neue', 'JetBrains Mono', 'Cinzel', 'Rajdhani']

const dateString = ref('')
function updateDate() {
  dateString.value = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()
}

// --- EDIT MODE & THEMES ---
const isEditMode = ref(false)
const savedAccent = localStorage.getItem('osAccentColor')
const accentColor = ref(savedAccent || '#6366f1')

watch(accentColor, (newVal) => {
  localStorage.setItem('osAccentColor', newVal)
})
const themeColors = [
  { name: 'Indigo', hex: '#6366f1' }, { name: 'Emerald', hex: '#10b981' }, 
  { name: 'Amber', hex: '#f59e0b' }, { name: 'Rose', hex: '#f43f5e' },
  { name: 'Cyan', hex: '#06b6d4' }, { name: 'Violet', hex: '#8b5cf6' },
  { name: 'Neon Pink', hex: '#ff00ff' }, { name: 'Crimson', hex: '#dc143c' }
]

const changeClockSetting = (key, value) => {
  if (config[key] !== value) {
    isChangingClock.value = true
    setTimeout(() => {
      config[key] = value
    }, 250)
    setTimeout(() => {
      isChangingClock.value = false
    }, 500)
  }
}

// --- DYNAMIC GRID AUTOSIZE ---
const gridStyle = computed(() => {
  const len = automation.value.length
  if (len <= 2) return 'grid-template-columns: repeat(2, minmax(0, 1fr))'
  if (len <= 4) return 'grid-template-columns: repeat(2, minmax(0, 1fr))'
  if (len <= 6) return 'grid-template-columns: repeat(3, minmax(0, 1fr))'
  return 'grid-template-columns: repeat(4, minmax(0, 1fr))'
})

function addMockDevice() {
  if (automation.value.length >= 10) return
  const id = Date.now()
  automation.value.push({ id, name: `Node ${id.toString().slice(-4)}`, ip: '192.168.1.100', type: 'toggle', icon: '🔌', state: false })
  syncDevices()
}
function removeDevice(id) {
  automation.value = automation.value.filter(d => d.id !== id)
  syncDevices()
}
function syncDevices() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    // Optionally sync full automation list if backend supports it
  }
}

// --- CLOCK ENGINE (Canvas high-precision) ---
const clockCanvas = ref(null)
let clockAnimFrame = null

function renderClock() {
  if (!clockCanvas.value) return
  const ctx = clockCanvas.value.getContext('2d')
  const width = clockCanvas.value.width
  const height = clockCanvas.value.height
  
  ctx.clearRect(0, 0, width, height)
  const now = new Date()
  
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  if (config.clockEngine === 'DIGITAL') {
    // Handled by HTML overlay for perfect anti-jitter spacing
  } else {
    // Analog Clock Engine
    const cx = width / 2;
    const cy = height / 2 - 20;
    const r = 160;

    // Background Dial
    if (config.analogStyle === 'Neon') {
      ctx.shadowColor = accentColor.value;
      ctx.shadowBlur = 30;
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = config.analogStyle === 'Neon' ? accentColor.value : 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Tick marks
    if (config.analogStyle !== 'Minimal') {
      for (let i = 0; i < 60; i++) {
        const angle = (i * Math.PI) / 30;
        const isMajor = i % 5 === 0;
        if (!isMajor && config.analogStyle === 'Neon') continue;
        
        const innerR = isMajor ? r - 20 : r - 10;
        if (config.analogStyle === 'Chronograph' && !isMajor) ctx.lineWidth = 1;
        else ctx.lineWidth = isMajor ? 4 : 2;
        
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
        ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
        ctx.strokeStyle = isMajor ? accentColor.value : 'rgba(255,255,255,0.2)';
        ctx.stroke();
      }
    }

    // Hands
    const hr = now.getHours() % 12;
    const min = now.getMinutes();
    const sec = now.getSeconds();
    const ms = now.getMilliseconds();
    
    const sweep = config.analogSweep ? (ms / 1000) : 0;

    const secAngle = ((sec + sweep) * Math.PI) / 30 - Math.PI / 2;
    const minAngle = ((min + sec / 60) * Math.PI) / 30 - Math.PI / 2;
    const hrAngle = ((hr + min / 60) * Math.PI) / 6 - Math.PI / 2;

    const drawHand = (angle, length, width, color, shadow = false) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * length, cy + Math.sin(angle) * length);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      if (shadow) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    drawHand(hrAngle, r * 0.5, 8, 'white');
    drawHand(minAngle, r * 0.75, 5, 'white');
    drawHand(secAngle, r * 0.85, 2, accentColor.value, config.analogStyle === 'Neon');
    
    // Center Cap
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = accentColor.value;
    ctx.fill();
  }

  clockAnimFrame = requestAnimationFrame(renderClock)
}

// --- GOOGLE CALENDAR SYNC ---
async function fetchCalendar() {
  try {
    const res = await fetch('http://localhost:3333/api/calendar')
    const data = await res.json()
    if (data.events) {
      calendarEvents.value = data.events
    }
  } catch (err) {
    console.error("Calendar Sync Error", err)
  }
}

// --- LONG PRESS TO EDIT ---
let globalHoldTimer = null
function startGlobalHold(tabId = 'clock') {
  if(isEditMode.value) return
  globalHoldTimer = setTimeout(() => {
    isEditMode.value = tabId
  }, 800) // 800ms hold
}
function endGlobalHold() {
  clearTimeout(globalHoldTimer)
}

// --- KEYBOARD NAV (Global) ---
function handleKeydown(e) {
  if (isEditMode.value) return // Disable if customizer open
  const w = window.innerWidth
  const h = window.innerHeight
  if (e.key === 'ArrowRight') viewport.value?.scrollBy({ left: w, behavior: 'smooth' })
  if (e.key === 'ArrowLeft') viewport.value?.scrollBy({ left: -w, behavior: 'smooth' })
  if (e.key === 'ArrowDown') clockStack.value?.scrollBy({ top: h, behavior: 'smooth' })
  if (e.key === 'ArrowUp') clockStack.value?.scrollBy({ top: -h, behavior: 'smooth' })
  if (e.key === ' ') { e.preventDefault(); startVoiceRecognition() }
}

// --- WEBSOCKET ENGINE ---
let ws = null
function connectWebSocket() {
  const wsUrl = `ws://${window.location.hostname}:3333/api/live-stream`
  ws = new WebSocket(wsUrl)
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'INIT_STATE' || data.type === 'SYNC_STATE') {
         if (data.type === 'INIT_STATE' && automation.value.length === 0) {
            automation.value = data.payload.automation
         }
         telemetry.value = { ...telemetry.value, ...data.payload.telemetry, weather: data.payload.weather }
         if(data.config) config.value = data.config
      }
    } catch(e) {}
  }
  ws.onclose = () => { setTimeout(connectWebSocket, 5000) }
}

function toggleDevice(device) {
  device.state = !device.state
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'TOGGLE_DEVICE', id: device.id, state: device.state }))
  }
}

// --- VOICE RECOGNITION (Web Speech API) ---
function startVoiceRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) { showAlert('Voice Not Supported'); return }
  
  const recognition = new SpeechRecognition()
  recognition.onstart = () => { isListening.value = true }
  recognition.onresult = (event) => {
    const cmd = event.results[0][0].transcript.toLowerCase()
    showAlert(`COMMAND: ${cmd}`)
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'VOICE_COMMAND', command: cmd }))
  }
  recognition.onerror = () => { isListening.value = false; showAlert('Voice Error') }
  recognition.onend = () => { isListening.value = false }
  recognition.start()
}

// --- DYNAMIC ALERTS WATCHER ---
watch(telemetry, (newVal) => {
  let pAlert = ''
  if (newVal.battery < 25) pAlert = `CRITICAL: Battery Low (${newVal.battery}%)`
  if (newVal.temp > 45) pAlert = `WARNING: Device Overheating (${newVal.temp}°)`
  
  // Checking actual charger status via navigator API
  if (navigator.getBattery) {
    navigator.getBattery().then(batt => {
      if (!batt.charging && newVal.battery < 25) pAlert = "CRITICAL: Charger Disconnected & Low Battery"
      persistentAlert.value = pAlert
    })
  } else {
    persistentAlert.value = pAlert
  }
}, { deep: true })

// --- UI UTILS ---
function showAlert(msg) {
  alertMessage.value = msg
  setTimeout(() => { alertMessage.value = '' }, 3000)
}

// --- LIFECYCLE ---
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  updateDate()
  renderClock()
  connectWebSocket()
  initVoiceEngine()

  
  // Font loading check
  document.fonts.ready.then(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      if (!config.location) config.location = {}
      const lat = pos.coords.latitude.toFixed(4)
      const lon = pos.coords.longitude.toFixed(4)
      config.location.name = `${lat}, ${lon}` // Show exact GPS
      
      // Auto fetch weather if no custom location is typed
      if (!config.customLocation) {
        config.customLocation = `${lat}, ${lon}`
      }
    }, () => {})
  })
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (clockAnimFrame) cancelAnimationFrame(clockAnimFrame)
  if (ws) ws.close()
})

</script>

<style>
.animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
@keyframes wave-peak { 0%, 100% { height: 10%; } 50% { height: 100%; } }

.animate-clock-change {
  animation: clockChange 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes clockChange {
  0% { transform: scale(1); opacity: 1; filter: blur(0px); }
  50% { transform: scale(0.9); opacity: 0; filter: blur(10px); }
  100% { transform: scale(1); opacity: 1; filter: blur(0px); }
}

.island-enter-active, .island-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.island-enter-from, .island-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px) scale(0.9);
}
.island-enter-to, .island-leave-from {
  opacity: 1;
  transform: translate(-50%, 0) scale(1);
}
</style>
