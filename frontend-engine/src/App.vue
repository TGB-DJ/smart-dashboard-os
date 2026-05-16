<template>
  <div class="h-screen w-screen bg-os-bg overflow-hidden fixed inset-0 font-sans select-none" :style="{ '--os-indigo': accentColor }" @click="handleGlobalClick">
    
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
          
          <!-- HTML Overlay for Digital Clock (Stable tabular layout) -->
          <div v-if="config.clockEngine === 'DIGITAL'" class="absolute z-10 flex flex-col items-center justify-center font-black pointer-events-none transition-lcd select-none" :style="{ fontFamily: config.typography, color: accentColor, opacity: isChangingClock ? 0 : 1 }">
             <div class="text-[180px] leading-none whitespace-nowrap flex items-baseline gap-1" style="font-variant-numeric: tabular-nums;">
               <span class="inline-block w-[1.1ch] text-center">{{ digitalTimeParts.hh }}</span>
               <span class="opacity-40 animate-pulse">:</span>
               <span class="inline-block w-[1.1ch] text-center">{{ digitalTimeParts.mm }}</span>
               <template v-if="config.showSeconds">
                 <span class="opacity-40 animate-pulse text-[0.8em]">:</span>
                 <span class="inline-block w-[1.1ch] text-center text-[0.8em]">{{ digitalTimeParts.ss }}</span>
               </template>
             </div>

             <!-- Date + Live Temp -->
             <div class="flex items-center gap-5 mt-2" style="font-family: 'Inter', sans-serif;">
               <div class="text-2xl font-bold tracking-[0.5em] uppercase text-white/60">{{ digitalDateString }}</div>
               <div v-if="weatherData.temp !== null"
                 class="px-4 py-1.5 rounded-full border text-lg font-black tracking-widest"
                 :style="{ borderColor: accentColor + '60', background: accentColor + '15', color: accentColor }"
               >{{ displayTemp }}{{ config.tempUnit === 'F' ? '°F' : '°C' }}</div>
             </div>

             <!-- Location name -->
             <div v-if="config.customLocation" class="mt-3 text-sm font-bold tracking-[0.3em] uppercase text-white/30 flex items-center gap-2" style="font-family: 'Inter', sans-serif;">
               <span class="text-xs opacity-60 animate-pulse">📍</span> {{ config.customLocation }}
             </div>
          </div>
          
          <!-- Smart Greeting -->
          <div class="absolute top-16 px-8 py-3 rounded-full glass-panel text-sm font-bold uppercase tracking-widest text-white/60 transition-all opacity-0 group-hover:opacity-100">{{ currentGreeting }}</div>

          <div class="absolute bottom-8 animate-bounce opacity-30 text-[10px] tracking-[0.5em] uppercase pointer-events-none">Swipe Down For Environment</div>
        </div>

        <!-- 1.2: Environment Weather Metrics -->
        <div class="flex-none w-screen h-screen snap-start p-16 flex flex-col justify-center relative" @pointerdown="startGlobalHold('environment')" @pointerup="endGlobalHold" @pointerleave="endGlobalHold">
          <h2 class="text-5xl font-black mb-12 text-white/40 italic uppercase tracking-tighter">Environment <span class="opacity-100" style="color: var(--os-indigo)">Intel</span></h2>
          <div
            class="grid grid-cols-4 gap-6 z-10 w-full max-w-7xl mx-auto flex-1 max-h-[75vh]"
            @dragover.prevent
          >
            <div
              v-for="(metric, idx) in config.envMetricOrder"
              :key="metric.id"
              :class="[
                'glass-panel p-8 rounded-[32px] relative overflow-hidden group transition-all duration-200 cursor-grab active:cursor-grabbing',
                metric.id === 'location' ? 'col-span-2' : '',
                dragOverEnvIdx === idx ? 'ring-2 ring-[var(--os-indigo)] scale-[1.02]' : ''
              ]"
              draggable="true"
              @dragstart="onEnvDragStart(idx)"
              @dragover.prevent="dragOverEnvIdx = idx"
              @dragleave="dragOverEnvIdx = null"
              @drop.prevent="onEnvDrop(idx)"
              @dragend="dragOverEnvIdx = null"
            >
              <div class="absolute -right-8 -bottom-12 text-[120px] opacity-[0.03] rotate-12 group-hover:scale-110 transition-transform duration-700">{{ metric.icon }}</div>
              <div class="text-[10px] uppercase text-gray-400 font-bold tracking-[0.3em] mb-3">{{ metric.label }}</div>

              <!-- Location card -->
              <template v-if="metric.id === 'location'">
                <div class="text-4xl font-black tracking-tighter truncate mt-4" :style="{ color: accentColor, fontFamily: 'JetBrains Mono, monospace' }">{{ config.customLocation || config.location?.name || 'ACQUIRING...' }}</div>
                <div class="text-[10px] text-white/40 mt-auto pt-6 flex items-center gap-2 uppercase tracking-widest font-bold">
                  <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Live GPS Lock
                </div>
              </template>

              <!-- AQI card -->
              <template v-else-if="metric.id === 'aqi'">
                <div class="flex items-end gap-2 mt-4">
                  <div class="text-5xl font-black text-emerald-400 leading-none">{{ weatherData.aqi ?? '--' }}</div>
                  <div class="text-xs text-emerald-400/60 font-bold mb-1 tracking-widest uppercase">PM2.5</div>
                </div>
                <div class="mt-auto pt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div class="h-full bg-emerald-400 shadow-[0_0_10px_#34d399]" :style="{ width: weatherData.aqi ? Math.min(weatherData.aqi / 3, 100) + '%' : '0%' }"></div>
                </div>
              </template>

              <!-- Generic metric card -->
              <template v-else>
                <div class="text-5xl font-black leading-none flex items-start mt-4" :class="metric.color">
                  {{ formatMetricValue(weatherData[metric.dataKey], metric.id) }}<span class="text-2xl mt-1 ml-1 text-white/30 font-light">{{ metric.id === 'temp' ? (config.tempUnit === 'F' ? '°F' : '°C') : metric.unit }}</span>
                </div>
                <div v-if="metric.sub" class="text-[10px] mt-auto pt-6 font-bold uppercase tracking-widest" :class="metric.color + '/70'">{{ metric.sub }}</div>
              </template>

            </div>
          </div><!-- /env grid -->
        </div><!-- /environment panel -->

      </div><!-- /clockStack -->


      <!-- PAGE 2: SMART HOME CONTROL -->
      <div class="flex-none w-screen h-screen snap-start p-16 flex flex-col relative overflow-hidden" @pointerdown="startGlobalHold('smarthome')" @pointerup="endGlobalHold" @pointerleave="endGlobalHold">
        <h1 class="text-6xl font-black mb-12 text-white/40 italic uppercase tracking-tighter">Smart Home <span class="opacity-100" style="color: var(--os-indigo)">Control</span></h1>
        
        <!-- Dynamic Auto-Adjusting Grid -->
        <div v-if="automation.length > 0" class="grid gap-8 z-10 relative flex-1 min-h-0 items-center content-center" :style="gridStyle">
          <div 
            v-for="device in automation" 
            :key="device.id"
            @click="toggleDevice(device)"
            class="glass-panel rounded-[40px] p-10 flex flex-col justify-between cursor-pointer transition-all duration-500 group relative overflow-hidden"
            :class="device.state ? 'scale-[1.02]' : 'hover:scale-[1.02]'"
            :style="device.state
              ? `background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%); border-color: ${device.color || 'var(--os-indigo)'}; box-shadow: 0 20px 50px -10px ${device.color || 'var(--os-indigo)'}44`
              : 'background: rgba(255,255,255,0.03);'"
          >
            <!-- Glow Background Effect -->
            <div class="absolute -right-10 -top-10 w-40 h-40 rounded-full blur-[60px] opacity-20 transition-opacity duration-500" :style="{ backgroundColor: device.color || 'var(--os-indigo)', opacity: device.state ? 0.4 : 0.1 }"></div>

            <div class="flex items-start justify-between">
              <div class="text-5xl transition-transform duration-500 group-hover:scale-110" :style="{ color: device.color || 'inherit' }">{{ device.icon }}</div>
              <div v-if="device.state" class="w-3 h-3 rounded-full animate-pulse" :style="{ backgroundColor: device.color || 'var(--os-indigo)' }"></div>
            </div>
            
            <div class="mt-8">
              <div class="text-3xl font-black mb-2 leading-tight tracking-tight text-white/90">{{ device.name }}</div>
              <div class="flex items-center gap-2">
                <div class="text-[10px] uppercase tracking-[0.3em] font-bold" :class="device.state ? 'text-white' : 'text-gray-500'">
                  {{ device.state ? 'System Active' : 'Standby Mode' }}
                </div>
                <div class="h-[1px] flex-1 bg-white/10"></div>
              </div>
            </div>

            <!-- Interaction Hint -->
            <div class="absolute bottom-4 right-8 text-[8px] uppercase tracking-widest text-white/20 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Tap to toggle</div>
          </div>
        </div>

        <!-- Empty State Placeholder -->
        <div v-else class="flex-1 flex flex-col items-center justify-center z-10 opacity-30">
          <div class="text-8xl mb-6">🛰️</div>
          <div class="text-xl font-bold uppercase tracking-[0.4em]">No Nodes Detected</div>
          <div class="text-[10px] mt-4 uppercase tracking-widest">Hold to open customizer and add devices</div>
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
            
            <div
              v-for="(mId, idx) in config.visibleMetrics" :key="mId"
              class="glass-panel p-8 rounded-[32px] flex items-center gap-6 group hover:scale-[1.02] transition-all relative overflow-hidden cursor-grab active:cursor-grabbing"
              :class="dragOverHealthIdx === idx ? 'ring-2 ring-[var(--os-indigo)] scale-[1.02]' : ''"
              draggable="true"
              @dragstart="onHealthDragStart(idx)"
              @dragover.prevent="dragOverHealthIdx = idx"
              @dragleave="dragOverHealthIdx = null"
              @drop.prevent="onHealthDrop(idx)"
              @dragend="dragOverHealthIdx = null"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div v-if="getMetricDef(mId).iconColor === 'indigo' || getMetricDef(mId).iconColor === 'white'" class="text-4xl font-black flex items-baseline z-10" :style="{ color: 'var(--os-indigo)' }">
                {{ formatMetricValue(telemetry[mId], mId) }}<span class="text-xl ml-1 text-white/40">{{ mId === 'temp' ? (config.tempUnit === 'F' ? '°F' : '°C') : getMetricDef(mId).unit }}</span>
              </div>
              
              <div v-else class="w-20 h-20 rounded-full border-[4px] flex items-center justify-center text-2xl font-black z-10" :class="`border-${getMetricDef(mId).iconColor}-500/40 text-${getMetricDef(mId).iconColor}-400 shadow-[0_0_15px_rgba(0,0,0,0.5)] shadow-${getMetricDef(mId).iconColor}-500/20`">
                {{ formatMetricValue(telemetry[mId], mId) }}<span class="text-xs ml-1 opacity-70">{{ mId === 'temp' ? (config.tempUnit === 'F' ? '°F' : '°C') : getMetricDef(mId).unit }}</span>
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

    <!-- GLOBAL BRANDING FOOTER -->
    <div class="fixed bottom-6 right-8 z-[50] flex items-center gap-3 pointer-events-none select-none opacity-40 hover:opacity-100 transition-opacity duration-500">
      <div class="h-[1px] w-8 bg-gradient-to-r from-transparent to-white/40"></div>
      <div class="text-[9px] font-black uppercase tracking-[0.4em] text-white/60 whitespace-nowrap" style="font-family: 'Inter', sans-serif;">
        CJ <span class="text-white">PRODUCTION</span> <span class="opacity-40">© 2026</span>
      </div>
    </div>

    <!-- GLOBAL EDIT MODE OVERLAY (Sliding Drawer for Live Previews) -->
    <div 
      class="edit-drawer fixed top-0 bottom-0 right-0 w-[500px] bg-os-bg/90 backdrop-blur-[64px] z-[200] p-10 flex flex-col border-l border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] text-white transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
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
              <div class="flex items-center gap-2">
                <button @click="config.showSeconds = !config.showSeconds" class="text-xs px-3 py-1.5 rounded-full font-bold transition-colors" :style="config.showSeconds ? 'background: var(--os-indigo); color: white' : 'background: rgba(255,255,255,0.1); color: #aaa'">SECONDS: {{ config.showSeconds ? 'ON' : 'OFF' }}</button>
                <button @click="config.tempUnit = config.tempUnit === 'C' ? 'F' : 'C'" class="text-xs px-3 py-1.5 rounded-full font-bold transition-colors" :style="'background: var(--os-indigo); color: white'">°{{ config.tempUnit }}</button>
              </div>
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
            <div class="flex gap-3 mb-3">
              <input type="text" v-model="config.customLocation" placeholder="Enter city (e.g. Chennai, London)" class="flex-1 bg-white/5 border-2 border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:outline-none focus:border-[var(--os-indigo)] transition-colors" />
              <button
                @click="useGPSLocation"
                :disabled="isLocating"
                class="px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest border-2 transition-all flex items-center gap-2 flex-shrink-0"
                :style="isLocating ? 'background: rgba(255,255,255,0.05); color: #666; border-color: transparent' : 'border-color: var(--os-indigo); color: var(--os-indigo); background: rgba(99,102,241,0.1)'"
              >
                <span>{{ isLocating ? '⏳' : '📍' }}</span>
                {{ isLocating ? 'Locating...' : 'Auto' }}
              </button>
            </div>
            <div class="text-[10px] text-gray-500 uppercase tracking-widest mb-4">Type a city name or tap Auto to use your device GPS.</div>

            <!-- Live weather preview -->
            <div v-if="weatherData.temp !== null" class="glass-panel p-4 rounded-xl relative group">
              <button @click="refreshWeather" class="absolute top-2 right-2 text-[10px] text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">↻ Refresh</button>
              <div class="text-[9px] uppercase tracking-widest text-gray-500 mb-3 font-bold">Live Readings — {{ config.customLocation }}</div>
              <div class="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div class="text-lg font-black">{{ formatMetricValue(weatherData.temp, 'temp') }}°{{ config.tempUnit }}</div>
                  <div class="text-[9px] text-gray-500 uppercase tracking-widest">Temp</div>
                </div>
                <div>
                  <div class="text-lg font-black text-blue-400">{{ weatherData.humidity }}%</div>
                  <div class="text-[9px] text-gray-500 uppercase tracking-widest">Humidity</div>
                </div>
                <div>
                  <div class="text-lg font-black text-indigo-400">{{ weatherData.windSpeed }}</div>
                  <div class="text-[9px] text-gray-500 uppercase tracking-widest">km/h Wind</div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-4 text-gray-600 text-xs">No weather data yet. Enter a location or tap Auto.</div>
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
        <div v-if="isEditMode === 'smarthome'" class="space-y-6 animate-fade-in">
          <div class="flex justify-between items-center">
            <h3 class="text-xs text-gray-400 font-bold uppercase tracking-widest">Smart Devices ({{ automation.length }}/10)</h3>
            <button v-if="automation.length < 10" @click="addMockDevice" class="px-4 py-2 glass-panel rounded-full text-[10px] font-black text-white/80 uppercase hover:bg-white/10 transition-colors">+ Add Node</button>
          </div>

          <!-- Device List -->
          <div class="flex flex-col gap-3">
            <div v-for="dev in automation" :key="dev.id" class="glass-panel rounded-2xl overflow-hidden">

              <!-- Device Row -->
              <div class="px-5 py-3 flex items-center justify-between group">
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <!-- Icon Button -->
                  <button
                    @click.stop="startEditDevice(dev)"
                    class="text-2xl w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all flex-shrink-0"
                    :style="{ borderColor: editingDeviceId === dev.id ? (dev.color || accentColor) : 'transparent', background: editingDeviceId === dev.id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)' }"
                  >{{ dev.icon }}</button>
                  <!-- Name -->
                  <input type="text" v-model="dev.name" class="bg-transparent border-b-2 border-transparent hover:border-white/20 focus:border-[var(--os-indigo)] focus:outline-none font-bold text-sm text-white flex-1 min-w-0 transition-colors py-1" />
                </div>
                <button @click="removeDevice(dev.id)" class="ml-3 w-7 h-7 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-xs font-black hover:bg-red-500/40 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0">✕</button>
              </div>

              <!-- Expanded Edit Panel -->
              <div v-if="editingDeviceId === dev.id" class="border-t border-white/5 px-5 py-4 space-y-4 animate-fade-in">

                <!-- Color Picker -->
                <div>
                  <div class="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-2">Accent Color</div>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="c in deviceColors" :key="c.hex"
                      @click="setDeviceColor(dev, c.hex)"
                      class="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                      :style="{ backgroundColor: c.hex, borderColor: dev.color === c.hex ? '#fff' : 'transparent', transform: dev.color === c.hex ? 'scale(1.2)' : 'scale(1)' }"
                    ></button>
                  </div>
                </div>

                <!-- IP Address -->
                <div>
                  <div class="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-2">IP / MQTT Topic</div>
                  <input type="text" v-model="dev.ip" placeholder="192.168.1.x or mqtt/topic" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 focus:outline-none focus:border-[var(--os-indigo)] transition-colors" />
                </div>

                <!-- Icon Picker Toggle -->
                <div>
                  <button @click="showIconPicker = !showIconPicker" class="text-[9px] uppercase tracking-widest text-gray-400 font-bold flex items-center gap-2 hover:text-white transition-colors">
                    <span>{{ showIconPicker ? '▲' : '▼' }}</span> Pick Icon
                  </button>
                  <div v-if="showIconPicker" class="mt-3 space-y-3 max-h-72 overflow-y-auto no-scrollbar">
                    <div v-for="(icons, cat) in deviceIconLib" :key="cat">
                      <div class="text-[8px] uppercase tracking-widest text-gray-600 font-bold mb-1">{{ cat }}</div>
                      <div class="flex flex-wrap gap-2">
                        <button
                          v-for="ic in icons" :key="ic"
                          @click="setDeviceIcon(dev, ic)"
                          class="text-xl w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                          :class="dev.icon === ic ? 'bg-white/15 ring-1 ring-white/40' : 'bg-white/5 hover:bg-white/10'"
                        >{{ ic }}</button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Customizer Footer Branding -->
      <div class="mt-auto pt-10 pb-4 opacity-30 text-center flex flex-col items-center">
        <div class="h-[1px] w-12 bg-white/20 mb-6"></div>
        <div class="text-[10px] font-black uppercase tracking-[0.5em] text-white">CJ PRODUCTION</div>
        <div class="text-[8px] uppercase tracking-widest mt-2 font-bold text-white/60">Standard Edition — Core v1.0.4</div>
      </div>
    </div>


  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, reactive } from 'vue'

// --- GLOBAL STATE ---
const ENV_METRIC_DEFAULT = [
  { id: 'location', label: 'Location Precision', icon: '📍' },
  { id: 'aqi',      label: 'Atmosphere AQI',     icon: '💨' },
  { id: 'uv',       label: 'Ultraviolet',         icon: '☀️', dataKey: 'uv',          unit: '',    color: 'text-amber-400', sub: 'UV Index' },
  { id: 'temp',     label: 'Climate Temp',        icon: '🌡️', dataKey: 'temp',        unit: '°C',  color: 'text-white',    sub: 'Cooling Req' },
  { id: 'humidity', label: 'Humidity',            icon: '💧', dataKey: 'humidity',    unit: '%',   color: 'text-blue-400',  sub: null },
  { id: 'wind',     label: 'Wind Speed',          icon: '🌪️', dataKey: 'windSpeed',   unit: 'km/h',color: 'text-indigo-400',sub: null },
  { id: 'precip',   label: 'Precipitation',       icon: '☔', dataKey: 'precipitation',unit: 'mm', color: 'text-purple-400',sub: null }
]

const savedConfig = localStorage.getItem('osConfig')
const initialConfig = savedConfig ? JSON.parse(savedConfig) : {
  clockEngine: 'DIGITAL',
  typography: 'Inter',
  analogStyle: 'Standard',
  analogSweep: false,
  showSeconds: true,
  tempUnit: 'C',
  customLocation: '',
  visibleMetrics: ['battery', 'temp', 'cpu', 'storage', 'ram', 'ping'],
  envMetricOrder: ENV_METRIC_DEFAULT
}
// Backfill missing keys for existing saved configs
if (!initialConfig.envMetricOrder) initialConfig.envMetricOrder = ENV_METRIC_DEFAULT

const config = reactive(initialConfig)

watch(config, (newVal) => {
  localStorage.setItem('osConfig', JSON.stringify(newVal))
}, { deep: true })

const weatherData = ref({ temp: null, aqi: null, uv: null, humidity: null, windSpeed: null, precipitation: null })

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

const digitalTimeParts = computed(() => {
  const date = currentTime.value
  const hh = date.getHours().toString().padStart(2, '0')
  const mm = date.getMinutes().toString().padStart(2, '0')
  const ss = date.getSeconds().toString().padStart(2, '0')
  return { hh, mm, ss }
})

const digitalDateString = computed(() => {
  return currentTime.value.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
})

const displayTemp = computed(() => {
  if (weatherData.value.temp === null) return null
  if (config.tempUnit === 'F') return Math.round(weatherData.value.temp * 9 / 5 + 32)
  return Math.round(weatherData.value.temp * 10) / 10
})

const isLocating = ref(false)

async function fetchWeatherByCoords(lat, lon) {
  try {
    // Forecast API: temp, humidity, wind, precipitation
    const [wRes, aqRes] = await Promise.all([
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation` +
        `&daily=uv_index_max&timezone=auto&forecast_days=1`
      ),
      fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}` +
        `&current=us_aqi&timezone=auto`
      )
    ])
    const wData = await wRes.json()
    const aqData = await aqRes.json()
    const cur = wData.current
    const aqCur = aqData.current
    weatherData.value = {
      temp: cur?.temperature_2m ?? null,
      humidity: cur?.relative_humidity_2m ?? null,
      windSpeed: cur?.wind_speed_10m ?? null,
      precipitation: cur?.precipitation ?? null,
      aqi: aqCur?.us_aqi ?? null,
      uv: wData.daily?.uv_index_max?.[0] ?? null
    }
  } catch(err) {
    console.log('[Weather] Fetch error', err)
  }
}

async function useGPSLocation() {
  if (!navigator.geolocation) { showAlert('GPS not available'); return }
  isLocating.value = true
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude
    const lon = pos.coords.longitude
    // Reverse geocode to get city name
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
      const d = await r.json()
      const city = d.address?.city || d.address?.town || d.address?.village || d.address?.county || `${lat.toFixed(2)}, ${lon.toFixed(2)}`
      config.customLocation = city
    } catch {
      config.customLocation = `${lat.toFixed(4)}, ${lon.toFixed(4)}`
    }
    await fetchWeatherByCoords(lat, lon)
    isLocating.value = false
  }, () => {
    showAlert('GPS permission denied')
    isLocating.value = false
  })
}

// --- DRAG TO REORDER ---
const dragEnvFromIdx = ref(null)
const dragOverEnvIdx = ref(null)
const dragHealthFromIdx = ref(null)
const dragOverHealthIdx = ref(null)

function onEnvDragStart(idx) { dragEnvFromIdx.value = idx }
function onEnvDrop(toIdx) {
  if (dragEnvFromIdx.value === null || dragEnvFromIdx.value === toIdx) return
  const arr = [...config.envMetricOrder]
  const [item] = arr.splice(dragEnvFromIdx.value, 1)
  arr.splice(toIdx, 0, item)
  config.envMetricOrder = arr
  dragEnvFromIdx.value = null
  dragOverEnvIdx.value = null
}
function onHealthDragStart(idx) { dragHealthFromIdx.value = idx }
function onHealthDrop(toIdx) {
  if (dragHealthFromIdx.value === null || dragHealthFromIdx.value === toIdx) return
  const arr = [...config.visibleMetrics]
  const [item] = arr.splice(dragHealthFromIdx.value, 1)
  arr.splice(toIdx, 0, item)
  config.visibleMetrics = arr
  dragHealthFromIdx.value = null
  dragOverHealthIdx.value = null
}

// --- DEVICE ICON LIBRARY ---
const deviceIconLib = {
  'Lights':    ['💡','🔦','🕯️','🪔','🌟','💫','✨','🔆','🌠','🎇'],
  'Climate':   ['❄️','🌡️','🌬️','💨','🌀','🔥','♨️','🌊','🌤️','⛅'],
  'Fans':      ['🌪️','🍃','💭','🌫️','🌈','⚡','🔄','🔃','↩️','🔁'],
  'Appliances':['📺','🖥️','🎮','📻','🎵','🎶','🔊','📡','⌨️','🖱️'],
  'Security':  ['🔒','🔐','🚨','📹','👁️','🛡️','🔑','🗝️','🚪','🪟'],
  'Power':     ['🔌','🔋','⚡','🔆','🌐','🖧','🛜','📶','💻','🖨️'],
  'Kitchen':   ['🍳','☕','🫖','🥤','🧊','🧺','🫙','🍽️','🥘','🫕'],
  'Other':     ['🏠','🌿','🛁','🚿','🧹','🪴','🛋️','🪞','🛏️','🪑']
}

const deviceColors = [
  { name: 'Indigo',  hex: '#6366f1' }, { name: 'Emerald', hex: '#10b981' },
  { name: 'Amber',   hex: '#f59e0b' }, { name: 'Rose',    hex: '#f43f5e' },
  { name: 'Cyan',    hex: '#06b6d4' }, { name: 'Violet',  hex: '#8b5cf6' },
  { name: 'Pink',    hex: '#ec4899' }, { name: 'Lime',    hex: '#84cc16' },
  { name: 'Orange',  hex: '#f97316' }, { name: 'White',   hex: '#ffffff' }
]

const editingDeviceId = ref(null)
const showIconPicker = ref(false)

function startEditDevice(dev) {
  editingDeviceId.value = editingDeviceId.value === dev.id ? null : dev.id
  showIconPicker.value = false
}
function setDeviceIcon(dev, icon) {
  dev.icon = icon
  showIconPicker.value = false
}
function setDeviceColor(dev, hex) {
  dev.color = hex
}

async function refreshWeather() {
  if (!config.customLocation) return
  try {
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(config.customLocation)}&count=1`)
    const geoData = await geoRes.json()
    if (geoData.results && geoData.results.length > 0) {
      const loc = geoData.results[0]
      await fetchWeatherByCoords(loc.latitude, loc.longitude)
      showAlert('Weather Updated')
    }
  } catch(err) {
    showAlert('Refresh Failed')
  }
}

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
        await fetchWeatherByCoords(loc.latitude, loc.longitude)
      }
    } catch(err) {
      console.log('[Geo] Fetch error', err)
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

function formatMetricValue(val, metricId) {
  if (val === null || val === undefined) return '--'
  if (metricId === 'temp') {
    if (config.tempUnit === 'F') return Math.round(val * 9 / 5 + 32)
    return Math.round(val * 10) / 10
  }
  return val
}

const currentGreeting = ref('Systems nominal.')
const greetingsLib = [
  "Systems nominal, Commander.", "Awaiting input.", "Dashboard OS operational.", 
  "All protocols green.", "Environment stable.", "Good to see you.", 
  "Sensors calibrated.", "Network synced.", "Power levels optimal.",
  "CJ PRODUCTION Core active.", "Premium OS calibrated."
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
const initialAutomation = savedAutomation ? JSON.parse(savedAutomation) : [
  { id: 1, name: 'Main Gallery', icon: '🖼️', state: false, color: '#6366f1', status: 'STANDBY' },
  { id: 2, name: 'Air Exchange', icon: '🌀', state: true, color: '#06b6d4', status: 'ACTIVE' },
  { id: 3, name: 'Ambient Light', icon: '💡', state: false, color: '#f59e0b', status: 'STANDBY' }
]
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
  if (len === 0) return 'display: none;'
  if (len === 1) return 'grid-template-columns: 1fr; max-width: 500px; margin: 0 auto;'
  if (len === 2) return 'grid-template-columns: repeat(2, 1fr); max-width: 900px; margin: 0 auto;'
  return 'grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));'
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

// --- WEBSOCKET ENGINE (LAN only — skipped on cloud hosting) ---
let ws = null
function connectWebSocket() {
  const host = window.location.hostname
  // Only connect if running on localhost or a LAN IP — never on Netlify
  const isLocal = host === 'localhost' || host === '127.0.0.1' || /^192\.168\./.test(host) || /^10\./.test(host)
  if (!isLocal) return

  const wsUrl = `ws://${host}:3333/api/live-stream`
  try {
    ws = new WebSocket(wsUrl)
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'INIT_STATE' || data.type === 'SYNC_STATE') {
          if (data.type === 'INIT_STATE' && automation.value.length === 0) {
            automation.value = data.payload.automation
          }
          telemetry.value = { ...telemetry.value, ...data.payload.telemetry, weather: data.payload.weather }
          if (data.config) config.value = data.config
        }
      } catch(e) {}
    }
    ws.onclose = () => { setTimeout(connectWebSocket, 5000) }
    ws.onerror = () => { ws = null } // Fail silently
  } catch(e) {}
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

function handleGlobalClick(e) {
  // If edit mode is on and we click outside the drawer, close it
  if (isEditMode.value) {
    const drawer = document.querySelector('.edit-drawer')
    if (drawer && !drawer.contains(e.target)) {
      isEditMode.value = false
    }
  }
}

// --- LIFECYCLE ---
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  updateDate()
  renderClock()
  connectWebSocket()
  initVoiceEngine()

  // Sync real battery if possible
  if (navigator.getBattery) {
    navigator.getBattery().then(batt => {
      telemetry.value.battery = Math.round(batt.level * 100)
      batt.addEventListener('levelchange', () => {
        telemetry.value.battery = Math.round(batt.level * 100)
      })
    })
  }

  
  // --- AUTO LOCATION ---
  const geoOptions = { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords
      await fetchWeatherByCoords(lat, lon)
      
      // Update location name via reverse geocode
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
        const d = await r.json()
        const city = d.address?.city || d.address?.town || d.address?.village || d.address?.suburb || d.address?.county
        if (city) {
          config.customLocation = city
          showAlert(`Location: ${city}`)
        }
      } catch(e) {
        console.log('[GPS] Reverse Geocode failed', e)
      }
    },
    (err) => {
      console.log('[GPS] Failed or Denied', err)
      // Fallback to saved location if available
      if (config.customLocation) {
        const saved = config.customLocation
        config.customLocation = ''
        setTimeout(() => { config.customLocation = saved }, 100)
      }
    },
    geoOptions
  )
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
