import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { chartConfig } from '~/constants' // 导入公共配置

// SVG 和坐标系配置
const { svgWidth, svgHeight, padding } = chartConfig

// 初始数据点
const initialPoints = [
  { x: -300, y: 0, name: 'ENGINE CHILL' },
  { x: 0, y: 0, name: 'LIFTOFF' },
  { x: 72, y: 1250 * 1000, name: 'MAX-Q' },
  { x: 145, y: 7500 * 1000, name: 'STAGE SEP' },
  { x: 195, y: 9500 * 1000, name: 'FAIRING' },
  { x: 380, y: 22000 * 1000, name: 'ENTRY BURN' },
  { x: 490, y: 26000 * 1000, name: 'LANDING BURN' },
  { x: 530, y: 27600 * 1000, name: 'SECO-1 ' },
]

// 计算坐标轴范围
const xMin = Math.min(...initialPoints.map(p => p.x), -350)
const xMax = Math.max(...initialPoints.map(p => p.x), 500)
const yMin = 0
const yMax = Math.max(...initialPoints.map(p => p.y), 27000 * 1000)

// 可绘制区域的宽度和高度
const drawableWidth = svgWidth - padding.left - padding.right
const drawableHeight = svgHeight - padding.top - padding.bottom

// 坐标转换函数 (已更新)
export const scaleX = val => padding.left + ((val - xMin) / (xMax - xMin)) * drawableWidth
export const scaleY = val => (svgHeight - padding.bottom) - ((val - yMin) / (yMax - yMin)) * drawableHeight

export const useCurveStore = defineStore('curve', () => {
  // --- State ---
  const points = reactive(initialPoints)
  const controlPoints = reactive([])

  // --- Actions ---
  function initializeControlPoints() {
    // 确保只初始化一次
    if (controlPoints.length > 0)
      return

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i]
      const p2 = points[i + 1]
      // 初始控制点大致放在两个数据点之间 (使用 SVG 坐标)
      controlPoints.push({
        x: scaleX(p1.x + (p2.x - p1.x) * 0.25),
        y: scaleY(p1.y + (p2.y - p1.y) * 0.25),
      })
      controlPoints.push({
        x: scaleX(p1.x + (p2.x - p1.x) * 0.75),
        y: scaleY(p1.y + (p2.y - p1.y) * 0.75),
      })
    }
  }

  function updateControlPoint(index, position) {
    if (controlPoints[index]) {
      controlPoints[index].x = position.x
      controlPoints[index].y = position.y
    }
  }

  // 初始化
  initializeControlPoints()

  return { points, controlPoints, updateControlPoint, xMin, xMax }
})
