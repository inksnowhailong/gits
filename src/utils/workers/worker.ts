/// <reference lib="webworker" />
import {
  ExtrudeGeometry,
  BufferGeometry,
  Line,
  Mesh,
  AdditiveBlending,
  Color,
  Float32BufferAttribute,
  ShaderMaterial,
  Shape,
  Vector3,
  Group,
  ShapeJSON
} from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils'
self.onmessage = function (e) {
  const { shapes } = e.data
  const result: Record<string, any> = {}
  const shapesObj = JSON.parse(shapes)
  const transferList: ArrayBuffer[] = []
  for (const adcode in shapesObj) {
    // 每个地区的几何体的buffer数据
    const geometrys = shapesObj[adcode].reduce(
      (pre: { geometrys: any[]; borderLines: any[] }, shapeJson: ShapeJSON) => {
        const shape = new Shape().fromJSON(shapeJson)
        // 板块形状，生成并转换为buffer
        const geometry = new ExtrudeGeometry(shape, { depth: 3 })
        const position = geometry.getAttribute('position').array
        const index = geometry.index?.array
        pre.geometrys.push({
          position: position.buffer,
          index: index?.buffer,
          positionCount: geometry.getAttribute('position').count,
          indexCount: geometry.index?.count
        })
        // buffer标记
        transferList.push(position.buffer as ArrayBuffer)
        index && transferList.push(index.buffer as ArrayBuffer)
        // 边界线形状
        const borderLine = createBorderLineBuffer(shape)
         // buffer标记
        transferList.push(borderLine.position)
        transferList.push(borderLine.aProgress)
        pre.borderLines.push(borderLine)
        return pre
      },
      {
        geometrys: [],
        borderLines: []
      }
    )
    result[adcode] = geometrys
  }
  self.postMessage({ result },  transferList)
}

/**
 * @description: 生成边界线的 buffer 数据
 * @param {any} shapeJson  // Shape 的 JSON 数据
 * @return {object} { position: Float32Array, aProgress: Float32Array }
 */
function createBorderLineBuffer(shape: Shape) {
  const points = shape.getPoints().map((p) => new Vector3(p.x, p.y, 10.01))

  // 顶点坐标
  const position = new Float32Array(points.length * 3)
  for (let i = 0; i < points.length; i++) {
    position[i * 3] = points[i].x
    position[i * 3 + 1] = points[i].y
    position[i * 3 + 2] = points[i].z
  }

  // 计算累计长度
  let totalLength = 0
  const lengths = [0]
  for (let i = 1; i < points.length; i++) {
    totalLength += points[i].distanceTo(points[i - 1])
    lengths.push(totalLength)
  }
  // 归一化
  const aProgress = new Float32Array(lengths.map((l) => l / totalLength))

  return { position: position.buffer, aProgress: aProgress.buffer, pointCount: aProgress.length }
}
