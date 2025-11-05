// 三次贝塞尔曲线的参数方程
function cubicBezier(t, p0, p1, p2, p3) {
  const cX = 3 * (p1.x - p0.x)
  const bX = 3 * (p2.x - p1.x) - cX
  const aX = p3.x - p0.x - cX - bX

  const cY = 3 * (p1.y - p0.y)
  const bY = 3 * (p2.y - p1.y) - cY
  const aY = p3.y - p0.y - cY - bY

  const x = (aX * t ** 3) + (bX * t ** 2) + (cX * t) + p0.x
  const y = (aY * t ** 3) + (bY * t ** 2) + (cY * t) + p0.y

  return { x, y }
}

// 使用二分查找根据 x (时间) 找到贝塞尔曲线上的参数 t
function findTforX(x, p0, p1, p2, p3) {
  let tLow = 0
  let tHigh = 1
  let t = 0.5
  let xAtT = 0

  // 迭代查找，精度足够高即可
  for (let i = 0; i < 20; i++) {
    xAtT = cubicBezier(t, p0, p1, p2, p3).x
    if (Math.abs(xAtT - x) < 0.01) { // 精度阈值
      return t
    }
    if (xAtT < x) {
      tLow = t
    }
    else {
      tHigh = t
    }
    t = (tHigh + tLow) / 2
  }
  return t
}

/**
 * 根据给定的时间，从整条复合贝塞尔曲线中计算出对应的高度
 * @param {number} time - 输入的时间 (x 坐标)
 * @param {Array} points - 原始数据点 (非 SVG 坐标)
 * @param {Array} controlPoints - 控制点 (非 SVG 坐标)
 * @returns {number} - 计算出的高度 (y 坐标)
 */
export function getHeightAtTime(time, points, controlPoints) {
  // 1. 找到时间所在的曲线段
  let segmentIndex = -1
  for (let i = 0; i < points.length - 1; i++) {
    if (time >= points[i].x && time <= points[i + 1].x) {
      segmentIndex = i
      break
    }
  }

  // 如果时间超出范围，返回端点的高度
  if (segmentIndex === -1) {
    if (time < points[0].x)
      return points[0].y
    return points[points.length - 1].y
  }

  // 2. 获取该段曲线的四个定义点
  const p0 = points[segmentIndex]
  const p3 = points[segmentIndex + 1]
  const p1 = controlPoints[segmentIndex * 2]
  const p2 = controlPoints[segmentIndex * 2 + 1]

  // 3. 找到对应于输入时间的参数 t
  const t = findTforX(time, p0, p1, p2, p3)

  // 4. 使用参数 t 计算并返回高度 y
  const finalPoint = cubicBezier(t, p0, p1, p2, p3)
  return finalPoint.y
}
