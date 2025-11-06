<script lang="js" setup>
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { chartConfig } from '~/constants' // 导入公共配置
import { scaleX, scaleY, useCurveStore } from '~/stores/curve'

// --- 使用 Pinia Store ---
const curveStore = useCurveStore()
const { points, controlPoints } = storeToRefs(curveStore)

// --- 从公共配置中获取配置项 ---
const { svgWidth, svgHeight, padding } = chartConfig

// --- 坐标轴刻度 ---
const xTicks = [-300, -200, -100, 0, 100, 200, 300, 400, 500]
const yTicks = [0, 5000000, 10000000, 15000000, 20000000, 25000000]

// --- 动态生成 SVG 路径 ---
const pathData = computed(() => {
  if (points.value.length === 0)
    return ''
  let path = `M ${scaleX(points.value[0].x)} ${scaleY(points.value[0].y)}`
  for (let i = 0; i < points.value.length - 1; i++) {
    const cp1 = controlPoints.value[i * 2]
    const cp2 = controlPoints.value[i * 2 + 1]
    const p2 = points.value[i + 1]
    path += ` C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${scaleX(p2.x)},${scaleY(p2.y)}`
  }
  return path
})

// --- 拖拽逻辑 ---
const svgRef = ref(null)
const draggingIndex = ref(null)

function getMousePosition(event) {
  if (!svgRef.value)
    return { x: 0, y: 0 }
  const CTM = svgRef.value.getScreenCTM()
  if (!CTM)
    return { x: 0, y: 0 }
  return {
    x: (event.clientX - CTM.e) / CTM.a,
    y: (event.clientY - CTM.f) / CTM.d,
  }
}

function startDrag(index, event) {
  draggingIndex.value = index
  event.preventDefault()
}

function drag(event) {
  if (draggingIndex.value !== null) {
    const pos = getMousePosition(event)
    curveStore.updateControlPoint(draggingIndex.value, pos)
  }
}

function stopDrag() {
  draggingIndex.value = null
}

onMounted(() => {
  window.addEventListener('mousemove', drag)
  window.addEventListener('mouseup', stopDrag)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', drag)
  window.removeEventListener('mouseup', stopDrag)
})
</script>

<template>
  <div class="text-white p-8 border-r border-gray-700 bg-gray-900 flex flex-col h-full w-full items-center justify-center">
    <h1 class="text-3xl font-bold mb-4">
      曲线编辑器
    </h1>
    <p class="text-gray-400 mb-8">
      拖拽蓝色控制点以调整曲线
    </p>
    <svg ref="svgRef" :viewBox="`0 0 ${svgWidth} ${svgHeight}`" class="rounded-lg bg-gray-800 max-w-7xl w-full">
      <g class="text-gray-500">
        <!-- X 轴 -->
        <line :x1="padding.left" :y1="svgHeight - padding.bottom" :x2="svgWidth - padding.right" :y2="svgHeight - padding.bottom" stroke="currentColor" />
        <!-- Y 轴 -->
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
      <path :d="pathData" fill="none" stroke="#4f46e5" :stroke-width="2" />
      <g stroke="#60a5fa" stroke-width="0.5" stroke-dasharray="2 2">
        <template v-for="(point, index) in points.slice(0, -1)" :key="`line-${index}`">
          <line :x1="scaleX(point.x)" :y1="scaleY(point.y)" :x2="controlPoints[index * 2].x" :y2="controlPoints[index * 2].y" />
          <line :x1="scaleX(points[index + 1].x)" :y1="scaleY(points[index + 1].y)" :x2="controlPoints[index * 2 + 1].x" :y2="controlPoints[index * 2 + 1].y" />
        </template>
      </g>
      <g v-for="(point, index) in points" :key="`point-group-${index}`">
        <circle :cx="scaleX(point.x)" :cy="scaleY(point.y)" r="4" fill="#c2410c" class="cursor-not-allowed" />
        <text
          text-anchor="end"
          :x="scaleX(point.x) - 2"
          :y="scaleY(point.y) - 8"
          fill="#cbd5e1"
          class="text-xs pointer-events-none select-none"
        >
          {{ point.name }}
        </text>
      </g>
      <g><circle v-for="(cp, index) in controlPoints" :key="`cp-${index}`" :cx="cp.x" :cy="cp.y" r="6" fill="#3b82f6" class="cursor-move" @mousedown="startDrag(index, $event)" /></g>
    </svg>
  </div>
</template>
