<template>
  <div class="h-screen bg-[#020202] text-white font-['Inter'] overflow-hidden selection:bg-emerald-500/30 p-2 sm:p-4 border-[1px] border-white/5 box-border flex flex-col">
    <!-- Atmosphere -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden">
      <div class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse"></div>
      <div class="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style="animation-delay: 2s"></div>
    </div>

    <!-- Navigation Island -->
    <div class="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-[100] px-6 py-2 bg-white/5 backdrop-blur-2xl rounded-full border border-white/10 shadow-2xl transition-all hover:border-emerald-500/30 group">
      <div v-for="i in 3" :key="i" 
           @click="scrollToPage(i)"
           class="w-12 h-1.5 rounded-full transition-all duration-500 cursor-pointer" 
           :class="currentPage === i ? 'bg-emerald-500 w-16 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-white/10 hover:bg-white/20'">
      </div>
    </div>

    <!-- Viewport -->
    <div ref="viewport" class="relative flex-grow flex overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth" @scroll="handleScroll">
      
      <!-- PAGE 1: TELEMETRY & SYSTEM -->
      <section class="flex-none w-full h-full snap-start p-6 sm:p-10 flex flex-col relative overflow-hidden">
        <header class="flex justify-between items-start mb-6">
          <div v-if="config.pageTitles">
            <h2 class="text-4xl font-black tracking-tighter mb-1">{{ config.pageTitles[1] || 'DASHBOARD' }}<span class="text-emerald-500">.</span></h2>
            <p class="text-[10px] text-gray-500 font-bold tracking-[0.2em] uppercase">Core Intelligence Stream</p>
          </div>
          <div class="flex gap-4">
            <div v-if="isDragging" class="px-3 py-1 bg-emerald-500 text-black text-[9px] font-black rounded-full animate-pulse uppercase">Rearranging</div>
            <button @click="openEdit" class="edit-trigger">⚙️ DASHBOARD CONFIG</button>
          </div>
        </header>

        <div class="grid grid-cols-12 gap-8 flex-grow overflow-hidden">
          <!-- Metrics Sidebar (Expanded scroll area) -->
          <div class="col-span-4 flex flex-col gap-6 overflow-hidden">
            <div class="flex-grow overflow-y-auto no-scrollbar pr-1">
              <draggable v-model="allMetricsList" item-key="id" class="grid grid-cols-1 gap-4" @start="isDragging = true" @end="isDragging = false" :delay="500" :delay-on-touch-only="true">
                <template #item="{ element: metric }">
                  <div class="glass-panel p-5 rounded-2xl group transition-all hover:bg-white/[0.03] cursor-grab active:cursor-grabbing relative overflow-hidden">
                    <div class="flex justify-between items-start mb-2">
                      <span class="text-[9px] font-bold tracking-widest text-gray-500 uppercase">{{ metric.label }}</span>
                      <div :class="`w-2 h-2 rounded-full bg-${metric.iconColor}-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]`"></div>
                    </div>
                    <div class="flex items-baseline gap-1">
                      <span class="text-2xl font-black tabular-nums">{{ telemetry[metric.source] || '0' }}{{ metric.unit }}</span>
                      <span class="text-[9px] font-bold text-gray-600 uppercase">{{ metric.suffix }}</span>
                    </div>
                  </div>
                </template>
              </draggable>
            </div>

            <div v-if="weatherData.temp !== null" class="glass-panel p-4 rounded-xl relative group mt-auto">
              <div class="text-[9px] uppercase tracking-widest text-gray-500 mb-3 font-bold">Climate Overview</div>
              <div class="grid grid-cols-3 gap-2 text-center">
                <div class="flex flex-col">
                  <span class="text-lg font-black">{{ weatherData.temp }}°{{ config.tempUnit }}</span>
                  <span class="text-[8px] text-gray-500 uppercase font-bold">Temp</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-lg font-black text-blue-400">{{ weatherData.humidity }}%</span>
                  <span class="text-[8px] text-gray-500 uppercase font-bold">Humid</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-lg font-black text-indigo-400">{{ weatherData.windSpeed }}</span>
                  <span class="text-[8px] text-gray-500 uppercase font-bold">Wind</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Central Clock & Area -->
          <div class="col-span-8 flex flex-col gap-6 overflow-hidden">
            <div class="flex-grow glass-panel rounded-3xl relative overflow-hidden flex flex-col items-center justify-center p-8">
              <canvas ref="clockCanvas" class="absolute inset-0 w-full h-full pointer-events-none opacity-40"></canvas>
              
              <div v-if="config.clockEngine === 'DIGITAL'" class="relative z-10 flex flex-col items-center text-center">
                <div v-if="config.digitalStyle === 'Modern'" class="flex gap-4 items-center">
                  <div class="clock-digit">{{ currentTime.h1 }}{{ currentTime.h2 }}</div>
                  <div class="text-6xl font-black text-emerald-500/50">:</div>
                  <div class="clock-digit">{{ currentTime.m1 }}{{ currentTime.m2 }}</div>
                  <div class="text-4xl font-black text-white/20 tabular-nums ml-2 self-end mb-4">{{ currentTime.s1 }}{{ currentTime.s2 }}</div>
                </div>
                <div v-else-if="config.digitalStyle === 'Cyber'" class="text-center">
                  <div class="text-[160px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/5">{{ currentTime.h1 }}{{ currentTime.h2 }}:{{ currentTime.m1 }}{{ currentTime.m2 }}</div>
                  <div class="text-3xl font-black text-emerald-500 opacity-80 mt-[-20px]">{{ currentTime.s1 }}{{ currentTime.s2 }}</div>
                </div>
                <div v-else class="flex gap-4 items-baseline">
                  <div class="text-9xl font-black tracking-tighter leading-none">{{ currentTime.h1 }}{{ currentTime.h2 }}</div>
                  <div class="text-5xl font-black text-emerald-500">{{ currentTime.m1 }}{{ currentTime.m2 }}</div>
                  <div class="text-2xl font-bold text-gray-700 tabular-nums">{{ currentTime.s1 }}{{ currentTime.s2 }}</div>
                </div>

                <div class="mt-8 space-y-2 animate-fade-in">
                  <div class="text-lg font-bold tracking-[0.15em] text-white/80 uppercase">{{ currentDate }}</div>
                  <div class="flex items-center justify-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
                    <span class="text-xs font-black text-emerald-500 uppercase tracking-[0.4em]">{{ config.customLocation }}</span>
                  </div>
                </div>
              </div>

              <div v-else class="relative z-10 mt-auto mb-4 text-center">
                <div class="text-lg font-bold tracking-[0.15em] text-white/80 uppercase">{{ currentDate }}</div>
                <div class="text-xs font-black text-emerald-500 uppercase tracking-[0.4em] mt-1">{{ config.customLocation }}</div>
              </div>
            </div>

            <!-- Draggable Quick Controls -->
            <div class="h-32 sm:h-40 overflow-hidden">
              <draggable v-model="automation" item-key="id" class="grid grid-cols-4 gap-4 h-full" @start="isDragging = true" @end="isDragging = false" :delay="500" :delay-on-touch-only="true">
                <template #item="{ element: node }">
                  <div @click.stop="toggleNode(node)" 
                       class="node-card glass-panel rounded-2xl p-4 flex flex-col justify-between cursor-grab transition-all active:scale-95 group overflow-hidden" 
                       :class="{ 'node-active': node.state }">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all duration-500" 
                         :class="node.state ? 'bg-emerald-500 text-black node-glow' : 'bg-white/5 text-gray-500'">
                      {{ node.icon }}
                    </div>
                    <div>
                      <div class="text-xs font-black truncate">{{ node.name }}</div>
                      <div class="text-[8px] font-bold text-gray-500 uppercase tracking-widest">{{ node.state ? 'Online' : 'Standby' }}</div>
                    </div>
                  </div>
                </template>
              </draggable>
            </div>
          </div>
        </div>
      </section>

      <!-- PAGE 2: NODES MATRIX -->
      <section class="flex-none w-full h-full snap-start p-6 sm:p-10 flex flex-col overflow-hidden">
        <header class="flex justify-between items-start mb-10">
          <div v-if="config.pageTitles">
            <h2 class="text-5xl font-black tracking-tighter">{{ config.pageTitles[2] || 'NODES' }}<span class="text-emerald-500">.</span></h2>
            <p class="text-xs text-gray-500 font-bold uppercase tracking-widest mt-2">{{ automation.length }} Connected Units</p>
          </div>
          <button @click="openEdit" class="edit-trigger">⚙️ MANAGE MATRIX</button>
        </header>
        <draggable v-model="automation" item-key="id" 
                   class="grid grid-cols-4 gap-6 flex-grow overflow-y-auto no-scrollbar pb-24" 
                   @start="isDragging = true" @end="isDragging = false" :delay="500" :delay-on-touch-only="true">
          <template #item="{ element: node }">
            <div @click.stop="toggleNode(node)" 
                 class="node-card glass-panel p-6 rounded-3xl flex flex-col justify-between cursor-grab transition-all group overflow-hidden" 
                 :class="[node.state ? 'node-active' : '', automation.length > 8 ? 'aspect-video' : 'aspect-square']">
              <div class="flex justify-between items-start">
                <div :class="['rounded-2xl flex items-center justify-center transition-all duration-500', automation.length > 8 ? 'w-12 h-12 text-3xl' : 'w-20 h-20 text-5xl', node.state ? 'bg-emerald-500 text-black node-glow' : 'bg-white/5 text-gray-500']">
                  {{ node.icon }}
                </div>
                <div class="w-3 h-3 rounded-full" :class="node.state ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-gray-800'"></div>
              </div>
              <div class="mt-2">
                <div :class="['font-black truncate', automation.length > 8 ? 'text-xl' : 'text-2xl']">{{ node.name }}</div>
                <div class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">ID: 0{{ node.id }}</div>
              </div>
            </div>
          </template>
        </draggable>
      </section>

      <!-- PAGE 3: ENVIRONMENT CENTER -->
      <section class="flex-none w-full h-full snap-start p-6 sm:p-10 flex flex-col overflow-hidden">
        <header class="flex justify-between items-start mb-6">
          <h2 v-if="config.pageTitles" class="text-5xl font-black tracking-tighter">{{ config.pageTitles[3] || 'CLIMATE' }}<span class="text-blue-500">.</span></h2>
          <button @click="openEdit" class="edit-trigger">⚙️ CLIMATE SETUP</button>
        </header>
        <div class="grid grid-cols-12 gap-8 h-full overflow-hidden pb-24">
          <div class="col-span-8 flex flex-col gap-6">
            <div class="glass-panel p-8 rounded-3xl flex-grow flex flex-col">
              <h3 class="text-xs font-black tracking-widest text-blue-400 uppercase mb-6">Environment Data Hub</h3>
              <div class="flex-grow flex flex-col gap-3">
                <div v-for="i in 5" :key="i" class="flex justify-between items-center p-4 bg-white/[0.01] rounded-2xl border border-white/5">
                  <span class="w-24 text-sm font-bold uppercase text-gray-500">Day {{ i+1 }}</span>
                  <span class="text-2xl">🌤️</span>
                  <span class="text-xl font-black tabular-nums">2{{ i+4 }}°</span>
                  <div class="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden"><div class="h-full bg-blue-500/50" :style="{ width: (40+i*10)+'%' }"></div></div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-span-4 flex flex-col gap-6">
            <div v-for="e in environmentalMetrics" :key="e.id" class="glass-panel p-6 rounded-3xl flex-grow flex flex-col items-center justify-center gap-2">
              <span class="text-[10px] font-black uppercase text-gray-500 tracking-widest">{{ e.label }}</span>
              <span class="text-5xl font-black" :class="`text-${e.color}-500`">{{ e.value }}{{ e.unit }}</span>
              <span class="text-[10px] font-bold text-gray-700 uppercase tracking-widest">{{ e.status }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Global Voice Button -->
    <button @click="startVoice" class="fixed top-8 right-8 w-12 h-12 bg-white/5 hover:bg-emerald-500/20 backdrop-blur-3xl border border-white/10 rounded-full flex items-center justify-center text-xl transition-all z-[100] active:scale-90">
      <span :class="isListening ? 'animate-pulse text-emerald-500' : 'text-white'">🎙️</span>
    </button>

    <!-- Settings Drawer -->
    <Transition name="drawer">
      <div v-if="isEdit" class="fixed inset-0 z-[300] flex justify-end" @click="closeEdit">
        <div class="drawer w-[480px] h-full bg-[#080808]/98 backdrop-blur-3xl border-l border-white/10 p-10 flex flex-col shadow-2xl overflow-hidden" @click.stop>
          <header class="mb-10 flex justify-between items-center">
            <div>
              <h3 class="text-3xl font-black uppercase tracking-tighter">CONTROL CENTER</h3>
              <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Page {{ currentPage }} Optimization</p>
            </div>
            <button @click="isEdit = false" class="text-3xl hover:rotate-90 transition-transform">✕</button>
          </header>

          <div class="flex-grow space-y-12 overflow-y-auto no-scrollbar pr-2 pb-10">
            <!-- Page Title -->
            <div class="space-y-4">
              <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest">Page Display Name</label>
              <input v-model="config.pageTitles[currentPage]" class="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold focus:border-emerald-500 outline-none transition-colors">
            </div>

            <!-- Page 1 Specifics (Expanded Metrics Manager) -->
            <div v-if="currentPage === 1" class="space-y-10 animate-fade-in">
              <div class="space-y-4">
                <label class="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex justify-between items-center">
                  Telemetry Widgets
                  <div class="flex gap-2">
                    <button @click="removeMetric" class="w-8 h-8 rounded-lg bg-red-500/20 text-red-500 flex items-center justify-center font-black">-</button>
                    <span class="w-8 text-center text-white">{{ allMetricsList.length }}</span>
                    <button @click="addMetric" class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-black">+</button>
                  </div>
                </label>
              </div>

              <div class="space-y-4">
                <label class="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Metric Source & Styling</label>
                <div class="space-y-3">
                  <div v-for="metric in allMetricsList" :key="metric.id" class="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                    <div class="flex gap-3">
                      <select v-model="metric.source" class="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] font-bold outline-none text-emerald-500">
                        <option value="battery">POWER</option>
                        <option value="temp">CORE TEMP</option>
                        <option value="cpu">CPU LOAD</option>
                        <option value="ram">RAM USE</option>
                        <option value="storage">STORAGE</option>
                        <option value="gpu">GPU LOAD</option>
                        <option value="net">NETWORK</option>
                      </select>
                      <input v-model="metric.label" class="flex-grow bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs font-bold outline-none focus:border-emerald-500">
                    </div>
                    <div class="flex gap-2">
                      <button v-for="color in ['emerald', 'amber', 'cyan', 'indigo', 'rose']" :key="color" @click="metric.iconColor = color" class="w-6 h-6 rounded-full border border-white/10 transition-all" :class="[`bg-${color}-500`, metric.iconColor === color ? 'scale-125 border-white shadow-xl' : 'opacity-40']"></button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="space-y-4">
                <label class="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Geo-Detection</label>
                <div class="relative">
                  <input v-model="config.customLocation" placeholder="Detecting..." class="w-full bg-white/5 border border-white/10 rounded-xl p-4 pr-12 text-sm font-bold focus:border-emerald-500 outline-none transition-colors">
                  <button @click="autoDetectLocation" class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-emerald-500 flex items-center justify-center transition-all">📍</button>
                </div>
              </div>
            </div>

            <!-- Page 2 Specifics -->
            <div v-if="currentPage === 2" class="space-y-10 animate-fade-in">
              <div class="space-y-4">
                <label class="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex justify-between items-center">
                  Matrix Grid Capacity
                  <div class="flex gap-2">
                    <button @click="removeNode" class="w-8 h-8 rounded-lg bg-red-500/20 text-red-500 flex items-center justify-center font-black">-</button>
                    <span class="w-8 text-center text-white">{{ automation.length }}</span>
                    <button @click="addNode" class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-black">+</button>
                  </div>
                </label>
              </div>
              <div class="space-y-6">
                <div v-for="node in automation" :key="node.id" class="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                  <div class="flex gap-4">
                    <div class="relative group">
                      <button class="w-14 h-14 rounded-2xl bg-white/5 text-3xl flex items-center justify-center hover:bg-emerald-500/20 transition-all">{{ node.icon }}</button>
                      <div class="absolute top-0 left-0 w-max bg-black/95 backdrop-blur-3xl border border-white/10 p-3 rounded-2xl grid grid-cols-4 gap-2 opacity-0 group-hover:opacity-100 transition-all z-[50] shadow-2xl pointer-events-none group-hover:pointer-events-auto scale-90 group-hover:scale-100">
                        <button v-for="emoji in ['💡','🌪️','🔒','🖥️','❄️','📷','🚗','💧','🚪','🔈','🌡️','📺','📻','🖨️','⌨️','🖱️']" :key="emoji" @click="node.icon = emoji" class="w-10 h-10 hover:bg-emerald-500/20 rounded-xl flex items-center justify-center text-xl transition-all">{{ emoji }}</button>
                      </div>
                    </div>
                    <div class="flex-grow space-y-2">
                      <input v-model="node.name" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-emerald-500">
                      <div class="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Source: 0x{{ node.id.toString(16).slice(-4) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button @click="isEdit = false" class="mt-auto w-full py-5 bg-emerald-500 text-black font-black text-[11px] tracking-[0.3em] uppercase rounded-2xl active:scale-95 transition-all shadow-[0_20px_50px_rgba(16,185,129,0.3)]">Deploy Configuration</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue'
import draggable from 'vuedraggable'

const DEFAULT_CONFIG = {
  clockEngine: 'DIGITAL', digitalStyle: 'Modern', analogStyle: 'Neon', analogSweep: true, 
  is24Hour: true, tempUnit: 'C', customLocation: 'Home',
  pageTitles: { 1: 'DASHBOARD', 2: 'NODES', 3: 'CLIMATE' }
}

const savedConfig = JSON.parse(localStorage.getItem('smart_config')) || {}
const config = reactive({ ...DEFAULT_CONFIG, ...savedConfig })
if (!config.pageTitles) config.pageTitles = DEFAULT_CONFIG.pageTitles

const automation = ref(JSON.parse(localStorage.getItem('smart_nodes')) || [
  { id: 1, name: 'Main Lights', state: false, icon: '💡' }, { id: 2, name: 'Air Purifier', state: true, icon: '🌪️' },
  { id: 3, name: 'Door Lock', state: false, icon: '🔒' }, { id: 4, name: 'Media Server', state: true, icon: '🖥️' }
])

const allMetricsList = ref(JSON.parse(localStorage.getItem('smart_metrics_order')) || [
  { id: 1, source: 'battery', label: 'Power', unit: '%', suffix: 'Batt', iconColor: 'emerald' },
  { id: 2, source: 'temp', label: 'Core', unit: '°', suffix: 'Temp', iconColor: 'amber' },
  { id: 3, source: 'cpu', label: 'Load', unit: '%', suffix: 'CPU', iconColor: 'cyan' },
  { id: 4, source: 'ram', label: 'Mem', unit: 'GB', suffix: 'RAM', iconColor: 'indigo' }
])

const telemetry = ref({ battery: 100, temp: 34, cpu: 12, ram: 4.2, storage: 64, gpu: 28, net: 150 })
const weatherData = ref({ temp: null, aqi: 24, uv: 2, humidity: 45, windSpeed: 12 })
const environmentalMetrics = computed(() => [
  { id: 'aqi', label: 'Air Quality', value: weatherData.value.aqi, unit: '', status: 'Optimal', color: 'emerald' },
  { id: 'uv', label: 'UV Index', value: weatherData.value.uv, unit: '', status: 'Low', color: 'amber' },
  { id: 'humidity', label: 'Humidity', value: weatherData.value.humidity, unit: '%', status: 'Healthy', color: 'blue' }
])

watch(config, (v) => localStorage.setItem('smart_config', JSON.stringify(v)), { deep: true })
watch(automation, (v) => localStorage.setItem('smart_nodes', JSON.stringify(v)), { deep: true })
watch(allMetricsList, (v) => localStorage.setItem('smart_metrics_order', JSON.stringify(v)), { deep: true })

const viewport = ref(null), clockCanvas = ref(null), isListening = ref(false), isEdit = ref(false), currentPage = ref(1), isDragging = ref(false)
const currentTime = reactive({ h1: '0', h2: '0', m1: '0', m2: '0', s1: '0', s2: '0' }), currentDate = ref('')

function updateTime() {
  const n = new Date(); let h = n.getHours(); if (!config.is24Hour) h = h % 12 || 12
  const m = n.getMinutes(), s = n.getSeconds(), hS = h.toString().padStart(2, '0'), mS = m.toString().padStart(2, '0'), sS = s.toString().padStart(2, '0')
  currentTime.h1 = hS[0]; currentTime.h2 = hS[1]; currentTime.m1 = mS[0]; currentTime.m2 = mS[1]; currentTime.s1 = sS[0]; currentTime.s2 = sS[1]
  currentDate.value = n.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()
}

function scrollToPage(p) { viewport.value?.scrollTo({ left: (p-1) * window.innerWidth, behavior: 'smooth' }); currentPage.value = p }
function handleScroll() { if (!viewport.value) return; const p = Math.round(viewport.value.scrollLeft / window.innerWidth) + 1; currentPage.value = p }

let clockAnim = null
function render() {
  updateTime()
  if (clockCanvas.value && config.clockEngine === 'ANALOG') {
    const c = clockCanvas.value, ctx = c.getContext('2d')
    c.width = c.offsetWidth * devicePixelRatio; c.height = c.offsetHeight * devicePixelRatio
    ctx.scale(devicePixelRatio, devicePixelRatio); ctx.clearRect(0,0,c.offsetWidth,c.offsetHeight)
    const cx = c.offsetWidth/2, cy = c.offsetHeight/2, r = Math.min(cx, cy) - 40
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1; ctx.stroke()
    const n = new Date(), hr = n.getHours()%12, min = n.getMinutes(), sec = n.getSeconds()
    const sA = (sec * Math.PI)/30 - Math.PI/2, mA = (min * Math.PI)/30 - Math.PI/2, hA = (hr * Math.PI)/6 - Math.PI/2
    const dH = (a, l, w, cl) => { ctx.beginPath(); ctx.lineCap='round'; ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(a)*l, cy+Math.sin(a)*l); ctx.strokeStyle = cl; ctx.lineWidth = w; ctx.stroke() }
    dH(hA, r*0.5, 6, 'white'); dH(mA, r*0.75, 4, 'white'); dH(sA, r*0.85, 2, '#10b981')
  }
  clockAnim = requestAnimationFrame(render)
}

function addNode() { if (automation.value.length < 12) { const newId = Date.now(); automation.value.push({ id: newId, name: `Node 0x${newId.toString(16).slice(-4)}`, state: false, icon: '💡' }) } }
function removeNode() { if (automation.value.length > 1) { automation.value.pop() } }

function addMetric() { if (allMetricsList.value.length < 8) { const mSources = { battery: ['Power', 'Batt', '%', 'emerald'], temp: ['Core', 'Temp', '°', 'amber'], cpu: ['Load', 'CPU', '%', 'cyan'], ram: ['Mem', 'RAM', 'GB', 'indigo'], storage: ['Disk', 'SSD', 'GB', 'rose'], gpu: ['Video', 'GPU', '%', 'amber'], net: ['Link', 'NET', 'Mb', 'cyan'] }; const source = 'storage'; const [l, s, u, c] = mSources[source]; allMetricsList.value.push({ id: Date.now(), source, label: l, suffix: s, unit: u, iconColor: c }) } }
function removeMetric() { if (allMetricsList.value.length > 1) { allMetricsList.value.pop() } }

function toggleNode(n) { if (isDragging.value) return; n.state = !n.state; if(ws?.readyState === 1) ws.send(JSON.stringify({ type: 'TOGGLE_DEVICE', id: n.id, state: n.state })) }
function openEdit() { isEdit.value = true }
function closeEdit(e) { if(e.target === e.currentTarget) isEdit.value = false }

async function autoDetectLocation() {
  const gIP = async () => { try { const r = await fetch('https://ipapi.co/json/'); const d = await r.json(); if(d.latitude) { await fetchWeather(d.latitude, d.longitude); config.customLocation = d.city || 'Home' } } catch(e) {} }
  if(navigator.geolocation) { navigator.geolocation.getCurrentPosition(async (p) => { await fetchWeather(p.coords.latitude, p.coords.longitude); try { const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${p.coords.latitude}&lon=${p.coords.longitude}&format=json`); const d = await r.json(); config.customLocation = d.address?.city || d.address?.town || 'Home' } catch(e) {} }, () => gIP(), { timeout: 10000 }) } else gIP()
}

function startVoice() { const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if(!SR) return; const r = new SR(); r.onstart = () => isListening.value = true; r.onresult = (e) => { const c = e.results[0][0].transcript.toLowerCase(); if(ws?.readyState === 1) ws.send(JSON.stringify({ type: 'VOICE_COMMAND', command: c })) }; r.onend = () => isListening.value = false; r.start() }

let ws = null
onMounted(() => {
  render()
  const h = window.location.hostname; if(h === 'localhost' || /^192\.168\./.test(h)) { ws = new WebSocket(`ws://${h}:3333/api/live-stream`); ws.onmessage = (e) => { try { const d = JSON.parse(e.data); if(d.type === 'SYNC_STATE') telemetry.value = { ...telemetry.value, ...d.payload.telemetry } } catch(err) {} } }
})
onUnmounted(() => { cancelAnimationFrame(clockAnim); ws?.close() })

async function fetchWeather(lat, lon) {
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m`)
    const d = await r.json(); if (d.current_weather) { weatherData.value.temp = d.current_weather.temperature; weatherData.value.windSpeed = d.current_weather.windspeed; weatherData.value.humidity = d.hourly?.relativehumidity_2m[new Date().getHours()] || 45 }
  } catch(e) {}
}
</script>

<style>
.node-card { @apply transition-all duration-500 border border-white/5; }
.node-active { @apply bg-emerald-500/[0.12] border-emerald-500/40; box-shadow: 0 10px 40px -10px rgba(16, 185, 129, 0.25); transform: translateY(-2px); }
.node-glow { filter: drop-shadow(0 0 12px rgba(16, 185, 129, 0.8)); animation: glow-pulse 2s infinite alternate; }
@keyframes glow-pulse { from { filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.6)); } to { filter: drop-shadow(0 0 18px rgba(16, 185, 129, 1)); } }
.edit-trigger { @apply px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-[9px] font-black tracking-widest uppercase transition-all border border-white/5; }
.clock-digit { @apply bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-8xl font-black tabular-nums transition-all shadow-[inset_0_2px_10px_rgba(255,255,255,0.02)]; }
.glass-panel { @apply bg-white/[0.02] backdrop-blur-3xl border border-white/5 shadow-2xl; }
.no-scrollbar::-webkit-scrollbar { display: none; }
.drawer-enter-active, .drawer-leave-active { transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
.drawer-enter-from, .drawer-leave-to { transform: translateX(100%); }
.animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
@keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.sortable-ghost { opacity: 0.2; }
</style>
