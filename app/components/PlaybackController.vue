<script lang="js" setup>
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { scaleX, scaleY, useCurveStore } from '~/stores/curve'
import { getHeightAtTime } from '~/utils/bezier'

// --- 逆向坐标转换 ---
const svgWidth = 1000; const svgHeight = 600; const padding = 60
const curveStore = useCurveStore()
const { points, xMax } = storeToRefs(curveStore)
const yMin = 0
const yMax = Math.max(...points.value.map(p => p.y), 27000 * 1000)

const unscaleX = svgX => ((svgX - padding) / (svgWidth - 2 * padding)) * (curveStore.xMax - curveStore.xMin) + curveStore.xMin
const unscaleY = svgY => ((svgHeight - padding - svgY) / (svgHeight - 2 * padding)) * (yMax - yMin) + yMin

// --- 播放器状态 ---
const currentTime = ref(curveStore.xMin)
const isPlaying = ref(false)
let animationFrameId = null

// --- 将SVG控制点转换为真实数据坐标 ---
const dataControlPoints = computed(() => {
  return curveStore.controlPoints.map(cp => ({
    x: unscaleX(cp.x),
    y: unscaleY(cp.y),
  }))
})

// --- 计算当前高度 ---
const currentHeight = computed(() => {
  return getHeightAtTime(currentTime.value, points.value, dataControlPoints.value)
})

// --- 播放器控制 ---
function playLoop() {
  if (!isPlaying.value)
    return

  currentTime.value += (curveStore.xMax - curveStore.xMin) / 200 // 播放速度
  if (currentTime.value > curveStore.xMax) {
    currentTime.value = curveStore.xMax
    isPlaying.value = false
  }
  animationFrameId = requestAnimationFrame(playLoop)
}

function togglePlay() {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    if (currentTime.value >= curveStore.xMax) {
      currentTime.value = curveStore.xMin // 如果已到终点，则从头开始
    }
    playLoop()
  }
  else {
    cancelAnimationFrame(animationFrameId)
  }
}

function reset() {
  isPlaying.value = false
  cancelAnimationFrame(animationFrameId)
  currentTime.value = curveStore.xMin
}

// 当拖动滑块时，如果正在播放，则暂停
watch(currentTime, (newVal, oldVal) => {
  if (Math.abs(newVal - oldVal) > 1 && isPlaying.value) {
    // 认为是手动拖动
    isPlaying.value = false
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

<template>
  <div class="text-white p-8 bg-gray-800 flex flex-col h-full w-full items-center justify-center space-y-8">
    <h1 class="text-3xl font-bold">
      播放控制器
    </h1>

    <div class="text-center gap-4 grid grid-cols-2 max-w-md w-full">
      <div class="p-4 rounded-lg bg-gray-700">
        <p class="text-sm text-gray-400">
          时间 (s)
        </p>
        <p class="text-3xl font-mono">
          {{ currentTime.toFixed(2) }}
        </p>
      </div>
      <div class="p-4 rounded-lg bg-gray-700">
        <p class="text-sm text-gray-400">
          高度 (km)
        </p>
        <p class="text-3xl font-mono">
          {{ (currentHeight / 1000).toFixed(2) }}
        </p>
      </div>
    </div>

    <div class="max-w-md w-full">
      <input
        v-model.number="currentTime"
        type="range"
        :min="xMin"
        :max="xMax"
        step="0.1"
        class="appearance-none rounded-lg bg-gray-600 h-2 w-full cursor-pointer"
      >
    </div>

    <div class="flex space-x-4">
      <button class="font-semibold px-6 py-2 rounded-md bg-indigo-600 w-24 hover:bg-indigo-500" @click="togglePlay">
        {{ isPlaying ? '暂停' : '播放' }}
      </button>
      <button class="font-semibold px-6 py-2 rounded-md bg-gray-600 hover:bg-gray-500" @click="reset">
        重置
      </button>
    </div>
  </div>
</template>

<style>
/* 美化 range input */
input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: #4f46e5;
  cursor: pointer;
  border-radius: 50%;
}
input[type='range']::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #4f46e5;
  cursor: pointer;
  border-radius: 50%;
}
</style>
