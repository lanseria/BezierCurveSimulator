// 坐标点接口定义
import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { chartConfig } from '~/constants'

interface Point {
  x: number
  y: number
  name: string
}

// 控制点接口定义
interface ControlPoint {
  x: number
  y: number
}

// 位置接口定义
interface Position {
  x: number
  y: number
} // 导入公共配置

// SVG 和坐标系配置
const { svgWidth, svgHeight, padding } = chartConfig

// 初始数据点
const initialPoints: Point[] = [
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
export const scaleX = (val: number): number => padding.left + ((val - xMin) / (xMax - xMin)) * drawableWidth
export const scaleY = (val: number): number => (svgHeight - padding.bottom) - ((val - yMin) / (yMax - yMin)) * drawableHeight

export const useCurveStore = defineStore('curve', () => {
  // --- State ---
  const points = reactive(initialPoints)
  const controlPoints = reactive<ControlPoint[]>([])

  // --- Actions ---
  function initializeControlPoints(): void {
    // 确保只初始化一次
    if (controlPoints.length > 0)
      return

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i]!
      const p2 = points[i + 1]!
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

  function updateControlPoint(index: number, position: Position): void {
    if (controlPoints[index]) {
      controlPoints[index].x = position.x
      controlPoints[index].y = position.y
    }
  }

  /**
   * 使用 Catmull-Rom 到贝塞尔的转换算法来平滑整条曲线
   */
  function smoothCurve(): void {
    if (points.length < 2)
      return

    const newControlPoints: ControlPoint[] = []
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = (i === 0) ? points[i]! : points[i - 1]!
      const p1 = points[i]!
      const p2 = points[i + 1]!
      const p3 = (i + 2 > points.length - 1) ? points[i + 1]! : points[i + 2]!

      // Catmull-Rom to Bezier conversion formula
      const cp1_x = p1.x + (p2.x - p0.x) / 6
      const cp1_y = p1.y + (p2.y - p0.y) / 6
      const cp2_x = p2.x - (p3.x - p1.x) / 6
      const cp2_y = p2.y - (p3.y - p1.y) / 6

      newControlPoints.push({ x: scaleX(cp1_x), y: scaleY(cp1_y) })
      newControlPoints.push({ x: scaleX(cp2_x), y: scaleY(cp2_y) })
    }
    // 原子性地更新数组以保证响应性
    controlPoints.splice(0, controlPoints.length, ...newControlPoints)
  }

  /**
   * 将指定索引的控制点重置为其初始默认位置
   * @param index - 控制点的索引
   */
  function resetControlPoint(index: number): void {
    if (controlPoints[index] === undefined)
      return

    // 1. 确定这个控制点属于哪个线段
    const segmentIndex = Math.floor(index / 2)
    const p1 = points[segmentIndex]!
    const p2 = points[segmentIndex + 1]!

    if (!p1 || !p2)
      return

    // 2. 确定是线段中的第一个还是第二个控制点
    const isFirstInPair = index % 2 === 0
    const factor = isFirstInPair ? 0.25 : 0.75

    // 3. 计算初始位置（与 initializeControlPoints 中的逻辑相同）
    const newX = scaleX(p1.x + (p2.x - p1.x) * factor)
    const newY = scaleY(p1.y + (p2.y - p1.y) * factor)

    // 4. 更新该控制点的位置
    controlPoints[index].x = newX
    controlPoints[index].y = newY
  }

  // 初始化
  initializeControlPoints()

  return { points, controlPoints, updateControlPoint, smoothCurve, resetControlPoint, xMin, xMax }
})
