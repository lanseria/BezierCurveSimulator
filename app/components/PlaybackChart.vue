<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed, onUnmounted, ref, watch } from 'vue'
import { chartConfig } from '~/constants'
import { scaleX, scaleY, useCurveStore } from '~/stores/curve'
import { getHeightAtTime } from '~/utils/bezier'

// --- 从公共配置和 Store 中获取数据 ---
const { svgWidth, svgHeight, padding } = chartConfig
const curveStore = useCurveStore()
const { points, controlPoints: svgControlPoints } = storeToRefs(curveStore)

// --- 逆向坐标转换逻辑 ---
const yMin = 0
const yMax = Math.max(...points.value.map(p => p.y), 27000 * 1000)
const drawableWidth = svgWidth - padding.left - padding.right
const drawableHeight = svgHeight - padding.top - padding.bottom
const unscaleX = (svgX: number): number => (((svgX - padding.left) / drawableWidth) * (curveStore.xMax - curveStore.xMin)) + curveStore.xMin
const unscaleY = (svgY: number): number => (((svgHeight - padding.bottom - svgY) / drawableHeight) * (yMax - yMin)) + yMin

// --- 播放器状态 ---
const currentTime = ref(curveStore.xMin)
const isPlaying = ref(false)
let animationFrameId: number | null = null

// --- 计算属性 ---

// 将 SVG 控制点转换为真实数据坐标，用于计算
const dataControlPoints = computed(() => {
  return svgControlPoints.value.map(cp => ({
    x: unscaleX(cp.x),
    y: unscaleY(cp.y),
  }))
})

// 根据当前时间计算高度
const currentHeight = computed(() => {
  return getHeightAtTime(currentTime.value, points.value, dataControlPoints.value)
})

// 计算指示器在 SVG 上的位置
const indicatorPosition = computed(() => ({
  x: scaleX(currentTime.value),
  y: scaleY(currentHeight.value),
}))

// SVG 路径数据
const pathData = computed(() => {
  if (points.value.length === 0)
    return ''
  const firstPoint = points.value[0]!
  let path = `M ${scaleX(firstPoint.x)} ${scaleY(firstPoint.y)}`
  for (let i = 0; i < points.value.length - 1; i++) {
    const cp1 = svgControlPoints.value[i * 2]!
    const cp2 = svgControlPoints.value[i * 2 + 1]!
    const p2 = points.value[i + 1]!
    path += ` C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${scaleX(p2.x)},${scaleY(p2.y)}`
  }
  return path
})

// --- 播放器控制 ---
function playLoop(): void {
  if (!isPlaying.value)
    return
  currentTime.value += (curveStore.xMax - curveStore.xMin) / 200 // 播放速度
  if (currentTime.value > curveStore.xMax) {
    currentTime.value = curveStore.xMax
    isPlaying.value = false
  }
  if (animationFrameId !== null) {
    animationFrameId = requestAnimationFrame(playLoop)
  }
}

function togglePlay(): void {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    if (currentTime.value >= curveStore.xMax) {
      currentTime.value = curveStore.xMin // 如果已到终点，则从头开始
    }
    playLoop()
  }
  else {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
  }
}

function reset(): void {
  isPlaying.value = false
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  currentTime.value = curveStore.xMin
}

// 监视手动拖动滑块
watch(currentTime, (newVal, oldVal) => {
  const step = (curveStore.xMax - curveStore.xMin) / 200
  if (Math.abs(newVal - oldVal) > step * 1.1 && isPlaying.value) {
    isPlaying.value = false
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
  }
})

// 清理副作用
onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
})

// --- 坐标轴刻度 ---
const xTicks: number[] = [-300, -200, -100, 0, 100, 200, 300, 400, 500]
const yTicks: number[] = [0, 5000000, 10000000, 15000000, 20000000, 25000000]
</script>

<template>
  <div class="text-white p-8 bg-gray-900 flex flex-col h-full w-full items-center justify-center">
    <h1 class="text-3xl font-bold mb-4">
      播放模拟器
    </h1>
    <p class="text-gray-400 mb-8">
      拖动下方滑块或点击播放按钮
    </p>

    <!-- 图表SVG -->
    <svg :viewBox="`0 0 ${svgWidth} ${svgHeight}`" class="rounded-lg bg-gray-800 max-w-7xl w-full">
      <!-- 坐标轴和刻度 -->
      <g class="text-gray-500">
        <line :x1="padding.left" :y1="svgHeight - padding.bottom" :x2="svgWidth - padding.right" :y2="svgHeight - padding.bottom" stroke="currentColor" />
        <line :x1="padding.left" :y1="padding.top" :x2="padding.left" :y2="svgHeight - padding.bottom" stroke="currentColor" />
      </g>
      <g class="text-xs text-gray-400">
        <g v-for="x in xTicks" :key="`x-${x}`" :transform="`translate(${scaleX(x)}, ${svgHeight - padding.bottom})`">
          <line y2="5" stroke="currentColor" /><text y="20" text-anchor="middle" fill="currentColor">{{ x }}s</text>
        </g>
        <g v-for="y in yTicks" :key="`y-${y}`" :transform="`translate(${padding.left}, ${scaleY(y)})`">
          <line x2="-5" stroke="currentColor" /><text x="-10" dy="0.32em" text-anchor="end" fill="currentColor">{{ y / 1000 }}k km</text>
        </g>
      </g>

      <!-- 贝塞尔曲线 -->
      <path :d="pathData" fill="none" stroke="#4f46e5" :stroke-width="2" />

      <!-- 关键数据点和标签 -->
      <g v-for="(point, index) in points" :key="`point-group-${index}`">
        <circle :cx="scaleX(point.x)" :cy="scaleY(point.y)" r="4" fill="#c2410c" />
        <text :x="scaleX(point.x) + 10" :y="scaleY(point.y) + 5" fill="#cbd5e1" class="text-xs pointer-events-none select-none">{{ point.name }}</text>
      </g>

      <!-- 播放指示器 (核心部分) -->
      <g v-if="currentTime >= curveStore.xMin && currentTime <= curveStore.xMax" class="pointer-events-none">
        <!-- 指示器圆点 -->
        <circle :cx="indicatorPosition.x" :cy="indicatorPosition.y" r="6" fill="#10b981" stroke="white" stroke-width="2" />

        <!-- 连接到坐标轴的虚线 -->
        <line
          :x1="indicatorPosition.x" :y1="indicatorPosition.y"
          :x2="indicatorPosition.x" :y2="svgHeight - padding.bottom"
          stroke="#10b981" stroke-width="1.5" stroke-dasharray="4 4"
        />
        <line
          :x1="indicatorPosition.x" :y1="indicatorPosition.y"
          :x2="padding.left" :y2="indicatorPosition.y"
          stroke="#10b981" stroke-width="1.5" stroke-dasharray="4 4"
        />

        <!-- 坐标轴上的数值标签 -->
        <g :transform="`translate(${indicatorPosition.x}, ${svgHeight - padding.bottom})`">
          <text text-anchor="start" fill="white" font-weight="bold" font-size="4">{{ currentTime.toFixed(1) }}s</text>
        </g>
        <g :transform="`translate(${padding.left}, ${indicatorPosition.y})`">
          <text x="-5" text-anchor="middle" dy="0.32em" fill="white" font-weight="bold" font-size="4">{{ (currentHeight / 1000).toFixed(1) }}km</text>
        </g>
      </g>
    </svg>

    <!-- 控制器 -->
    <div class="mt-8 flex flex-col max-w-3xl w-full items-center space-y-6">
      <input
        v-model.number="currentTime"
        type="range"
        :min="curveStore.xMin"
        :max="curveStore.xMax"
        step="0.1"
        class="appearance-none rounded-lg bg-gray-600 h-2 w-full cursor-pointer"
      >
      <div class="flex space-x-4">
        <button class="font-semibold px-6 py-2 rounded-md bg-indigo-600 w-24 hover:bg-indigo-500" @click="togglePlay">
          {{ isPlaying ? '暂停' : '播放' }}
        </button>
        <button class="font-semibold px-6 py-2 rounded-md bg-gray-600 hover:bg-gray-500" @click="reset">
          重置
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 美化 range input */
input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: #4f46e5;
  cursor: pointer;
  border-radius: 50%;
  margin-top: -2px; /* 垂直居中 */
}
input[type='range']::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #4f46e5;
  cursor: pointer;
  border-radius: 50%;
}
</style>
