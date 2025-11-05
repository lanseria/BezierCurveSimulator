import { defineStore } from 'pinia'
import { reactive } from 'vue'

// --- 这些配置项和函数需要在多个组件中共享 ---

// SVG 和坐标系配置
const svgWidth = 1000
const svgHeight = 600
const padding = 60

// 初始数据点 (原始数据)
const initialPoints = [
  { x: -300, y: 0 },
  { x: 0, y: 0 },
  { x: 72, y: 1250 * 1000 },
  { x: 145, y: 7500 * 1000 },
  { x: 195, y: 9500 * 1000 },
  { x: 380, y: 22000 * 1000 },
  { x: 490, y: 26000 * 1000 },
]

// 计算坐标轴范围
const xMin = Math.min(...initialPoints.map(p => p.x), -350)
const xMax = Math.max(...initialPoints.map(p => p.x), 500)
const yMin = 0
const yMax = Math.max(...initialPoints.map(p => p.y), 27000 * 1000)

// 坐标转换函数
export const scaleX = val => padding + ((val - xMin) / (xMax - xMin)) * (svgWidth - 2 * padding)
export const scaleY = val => (svgHeight - padding) - ((val - yMin) / (yMax - yMin)) * (svgHeight - 2 * padding)

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
