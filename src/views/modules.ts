import {
  AxesHelper,
  BufferGeometry,
  Color,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Line,
  Material,
  Mesh,
  Path,
  Scene,
  ShaderMaterial,
  Shape,
  Vector2,
  Vector3,
  AdditiveBlending,
  Points,
  Box3,
  CylinderGeometry,
  MeshBasicMaterial,
  BufferAttribute
} from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils'
// import { geoAlbers } from 'd3'

// interface ModuleResult extends Record<string, any> {
//   openHelper: Ref<boolean>
//   updatePosition: (x: number, y: number, z: number) => void
//   joinScene: (scene: Scene) => void
// }

/**
 * 将 GeoJSON Polygon/MultiPolygon 转为 js Shape 数组
 * @param geoJson GeoJSON 对象
 * @param project 坐标投影函数 (lng, lat) => [x, y]
 * @returns Shape 数组
 */
export function geoJsonToShapes(geoJson: any) {
  /**
   * @description: 收集所有点 为后续 让地图回归中心点
   * @param {any} geoJson
   * @return {*}
   */
  function collectAllCoords(geoJson: any): [number, number][] {
    const coords: [number, number][] = []
    geoJson.features.forEach((feature: any) => {
      const geom = feature.geometry
      let coordinates: [number, number][] = []
      if (geom.type === 'Polygon') {
        coordinates = [geom.coordinates]
      } else if (geom.type === 'MultiPolygon') {
        coordinates = geom.coordinates
      }
      geom.coordinates.forEach((polygon: any) => {
        polygon.forEach((ring: any) => {
          ring.forEach(([lng, lat]: [number, number]) => coords.push([lng, lat]))
        })
      })
    })
    return coords
  }

  const coords = collectAllCoords(geoJson)
  const length = coords.length
  const centerSum = coords.reduce(
    (pre, cur) => {
      pre[0] += cur[0]
      pre[1] += cur[1]
      return pre
    },
    [0, 0]
  )

  const centerLng = Number((centerSum[0] / length).toFixed(4))
  const centerLat = Number((centerSum[1] / length).toFixed(4))

  const proj = (lng: number, lat: number): [number, number] => {
    const [x, y] = [lng - centerLng, lat - centerLat]

    return [x * 0.9, y * 1.1]
  }
  //  建立一个propertiesMap，用于存储每个shape对应的properties
  const propertiesShapeMap: Record<string, any> = {}
  //  形状数组
  const shapes: Record<string, Shape[]> = {}
  geoJson.features.forEach((feature: any) => {
    const geom = feature.geometry
    propertiesShapeMap[feature.properties.adcode] = feature.properties
    let coordinates
    if (geom.type === 'Polygon') {
      coordinates = [geom.coordinates]
    } else if (geom.type === 'MultiPolygon') {
      coordinates = geom.coordinates
    }
    coordinates.forEach((polygon: any) => {
      const shape = polygonToShape(polygon, proj)

      shapes[feature.properties.adcode] ??= []
      shapes[feature.properties.adcode].push(shape)
    })
  })
  return { shapes, propertiesShapeMap }
}

/** 辅助函数：Polygon 坐标转 Shape */
function polygonToShape(coordinates: number[][][], project: (lng: number, lat: number) => [number, number]): Shape {
  const shape = new Shape()
  coordinates.forEach((ring, i) => {
    ring.forEach(([lng, lat], j) => {
      const [x, y] = project(lng, lat)
      if (j === 0) {
        if (i === 0) shape.moveTo(x, y)
        else shape.holes.push(new Path([new Vector2(x, y)]))
      } else {
        if (i === 0) shape.lineTo(x, y)
        else shape.holes[shape.holes.length - 1].lineTo(x, y)
      }
    })
  })
  return shape
}

/**
 * @description: geoJson 转 geometry
 * @param {Object} mapGeoJson
 * @return {*}
 */
export async function useMapGeometry(mapGeoJson: Object, MapMaterial: Material) {
  const { shapes, propertiesShapeMap } = geoJsonToShapes(mapGeoJson)
  const geometryGroup = new Group()
  console.time('GeometryWorkertask')
  splitObjectByKeys(shapes, 4).forEach((shapes) =>
    GeometryWorkertask(shapes).then((module) => {
      // 循环每个任务的结果
      for (const adcode in module) {
        const { geometry, borderLine: borderLineGeometrys } = module[adcode]
        // 板块
        const mesh = new Mesh(geometry, MapMaterial)
        mesh.userData.properties = propertiesShapeMap[adcode]
        mesh.castShadow = true
        mesh.receiveShadow = true
        geometryGroup.add(mesh)
        // 边界线
        borderLineGeometrys.forEach((borderLineGeometry) => {
          const borderLine = new Line(borderLineGeometry, new MeshBasicMaterial({ color: '#fff' }))
          borderLine.position.set(0, 0, -6.8)
          geometryGroup.add(borderLine)
        })
      }
      console.timeEnd('GeometryWorkertask')
    })
  )


  // for (const adcode in shapes) {
  //   const geometrys = shapes[adcode].reduce(
  //     (pre, shape) => {
  //       // 板块形状
  //       const geometry = new ExtrudeGeometry(shape, { depth: 3 })
  //       // 边界线形状
  //       const borderLine = createBorderLineGeometry(shape)
  //       pre.geometrys.push(geometry)
  //       pre.borderLines.push(borderLine)
  //       return pre
  //     },
  //     {
  //       geometrys: [] as ExtrudeGeometry[],
  //       borderLines: [] as BufferGeometry[]
  //     }
  //   )
  //   const geometry = BufferGeometryUtils.mergeGeometries(geometrys.geometrys)
  //   geometrys.borderLines.forEach((LineG) => {
  //     const borderLine = new Line(LineG, createFlowLineMaterial('#fff'))
  //     borderLine.position.set(0, 0, -6.8)
  //     geometryGroup.add(borderLine)
  //   })
  //   // 修正法线，提升立体感
  //   const mesh = new Mesh(geometry, MapMaterial)
  //   // 加入地区相关数据
  //   mesh.userData.properties = propertiesShapeMap[adcode]
  //   mesh.castShadow = true
  //   mesh.receiveShadow = true

  //   geometry.computeVertexNormals()
  //   geometryGroup.add(mesh)

  // }
  // console.timeEnd('GeometryWorkertask')
  const MapGeometry = shallowRef(geometryGroup)
  // 辅助线
  const helper = new AxesHelper(500)
  const openHelper = ref(false)
  watchEffect(() => {
    if (openHelper.value) {
      MapGeometry.value.add(helper)
    } else {
      MapGeometry.value.remove(helper)
    }
  })
  return {
    MapGeometry,
    joinScene: (scene: Scene) => {
      scene.add(MapGeometry.value)
    },
    openHelper,
    updatePosition: (x: number, y: number, z: number) => {
      MapGeometry.value.position.set(x, y, z)
    },
    updateMapMaterial: (material: Material) => {
      MapGeometry.value.traverse((child) => {
        if (child instanceof Mesh) {
          child.material = material
        }
      })
    }
  }
}

/**
 * @description: 边界线生成
 * @param {Shape} shape
 * @param {Color} color
 * @return {*}
 */
function createBorderLineGeometry(shape: Shape) {
  const points = shape.getPoints()
  // points.push(new Vector2(NaN, NaN))
  function createFlowLineGeometry(points: Vector3[]) {
    const geometry = new BufferGeometry().setFromPoints(points)
    // 计算累计长度
    let totalLength = 0
    const lengths = [0]
    for (let i = 1; i < points.length; i++) {
      totalLength += points[i].distanceTo(points[i - 1])
      lengths.push(totalLength)
    }
    // 归一化
    const progress = lengths.map((l) => l / totalLength)
    geometry.setAttribute('aProgress', new Float32BufferAttribute(progress, 1))
    return geometry
  }
  const geometry = createFlowLineGeometry(points.map((p) => new Vector3(p.x, p.y, 10.01)))
  return geometry
}
/**
 * @description: 边界线的流光动画材质
 * @param {Color} color
 * @return {*}
 */
export function createFlowLineMaterial(color: Color | string | number) {
  function createLineMaterial(color = '#fff', flowColor = '#00ffff', speed = 1) {
    return new ShaderMaterial({
      uniforms: {
        u_color: { value: new Color(color) },
        u_flowColor: { value: new Color(flowColor) },
        u_time: { value: 0 },
        u_speed: { value: speed }
      },
      vertexShader: `
          attribute float aProgress;
          varying float vProgress;
          void main() {
            vProgress = aProgress;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
      fragmentShader: `
          uniform vec3 u_color;
          uniform vec3 u_flowColor;
          uniform float u_time;
          uniform float u_speed;
          varying float vProgress;
          void main() {
            float repeat = 2.0; // 流光段数量
            float flow = mod(vProgress * repeat + u_time * u_speed, 1.0);
            float intensity = smoothstep(0.1, 0.9, flow); // 极窄区间
            vec3 glowColor = u_flowColor * 2.5; // 流光更亮
            vec3 baseColor = u_color * 1.5;
            vec3 finalColor = mix(baseColor, glowColor, intensity);
            gl_FragColor = vec4(finalColor, 1.0);
          }
        `,
      blending: AdditiveBlending,
      transparent: true
    })
  }
  const flowLineMaterial = createLineMaterial('#fff', '#00ffff', 0.2)

  //   // 流光动画 页面销毁时取消动画
  let animateId: number
  function animate() {
    animateId = requestAnimationFrame(animate)
    flowLineMaterial.uniforms.u_time.value = performance.now() * 0.001 // 秒
  }
  setTimeout(() => {
    animate()
  }, Math.random() * 10)
  onScopeDispose(() => {
    cancelAnimationFrame(animateId)
  })
  flowLineMaterial.userData.animate = animate
  return flowLineMaterial
}

/**
 * 将对象按 key 平均拆分为 n 份
 * @param obj 原对象
 * @param n 份数
 * @returns 拆分后的对象数组
 */
function splitObjectByKeys<T>(obj: Record<string, T>, n: number): Record<string, T>[] {
  const keys = Object.keys(obj)
  const result: Record<string, T>[] = Array.from({ length: n }, () => ({}))
  keys.forEach((key, idx) => {
    const groupIdx = idx % n
    result[groupIdx][key] = obj[key]
  })
  return result
}

/**
 * @description: 几何体生成任务
 * @param {Record<string, Shape[]>} shapes
 * @param {Record<string, any>} propertiesShapeMap
 * @param {Material} MapMaterial
 * @return {*}
 */
async function GeometryWorkertask(shapes: Record<string, Shape[]>): Promise<
  Record<
    string,
    {
      geometry: BufferGeometry
      borderLine: BufferGeometry[]
    }
  >
> {
  const worker = new Worker(new URL('@/utils/workers/worker.ts', import.meta.url), {
    type: 'module'
  })
  // 将 shape 转换为 buffer 数据
  const shapeBufferData: Record<string, any> = {}
  const transferList: ArrayBuffer[] = []
  for (const adcode in shapes) {
    const shape = shapes[adcode]
    const shapeBuffer = shape.map((s) => {
      const { buffer, meta } = shapeToArrayBuffer(s)
      transferList.push(buffer)
      return { buffer, meta }
    })
    shapeBufferData[adcode] = shapeBuffer
  }
  worker.postMessage({ shapes: shapeBufferData }, transferList)

  return new Promise((resolve) => {
    worker.onmessage = (e: MessageEvent<{ result: Record<string, any> }>) => {
      const { result } = e.data
      const geometryResult: Record<string, any> = {}
      for (const adcode in result) {
        const { geometrys: geometrysBuffers, borderLines: borderLinesBuffers } = result[adcode]
        // 构建板块模型
        const geometrys = []
        for (const geometrysBuffer of geometrysBuffers) {
          const geometry = new BufferGeometry()
          geometry.setAttribute('position', new BufferAttribute(new Float32Array(geometrysBuffer.position), 3))
          if (geometrysBuffer.index) {
            geometry.setIndex(new BufferAttribute(new Uint16Array(geometrysBuffer.index), 1))
          }
          geometry.computeVertexNormals()
          geometrys.push(geometry)
        }

        // 构建边界线模型
        const borderLines = []
        for (const borderLinesBuffer of borderLinesBuffers) {
          const borderLine = new BufferGeometry()
          borderLine.setAttribute('position', new BufferAttribute(new Float32Array(borderLinesBuffer.position), 3))
          // borderLine.setIndex(new BufferAttribute(new Uint16Array(borderLinesBuffer.index), 1))
          borderLine.computeVertexNormals()
          borderLines.push(borderLine)
        }

        geometryResult[adcode] = {
          geometry: BufferGeometryUtils.mergeGeometries(geometrys),
          borderLine: borderLines
        }
      }
      resolve(geometryResult)
    }
  })
}
/**
 * @description: 数据转换，提高传输效率
 * @param {Shape} shape
 * @return {*}
 */
function shapeToArrayBuffer(shape: Shape){
  const outer = shape.getPoints()
  const holes = shape.holes.map(h => h.getPoints())

  const outerLength = outer.length
  const holeCounts = holes.map(h => h.length)
  const totalPoints = outerLength + holeCounts.reduce((a, b) => a + b, 0)

  const buffer = new ArrayBuffer(totalPoints * 2 * 4) // 每个点2个float，每个float占4字节
  const view = new Float32Array(buffer)

  let offset = 0
  for (const p of outer) {
    view[offset++] = p.x
    view[offset++] = p.y
  }
  for (const hole of holes) {
    for (const p of hole) {
      view[offset++] = p.x
      view[offset++] = p.y
    }
  }
  return {
    buffer,
    meta: {
      outerLength,
      holeCounts
    }
  }
}
/**
 * @description: 给模型添加天气模型组件（仅添加柱子，icon和天气后续实现）
 * @param {Mesh} geometry three.js的Mesh模型
 * @param {string} adCode 行政区划代码（暂未使用）
 * @return {void}
 */
export function useWeather(geometry: Mesh, adCode: string): void {
  if (!geometry || !(geometry instanceof Mesh)) {
    // 参数校验
    throw new Error('geometry 必须为有效的 THREE.Mesh 实例')
  }
  // 计算模型包围盒
  const box = new Box3().setFromObject(geometry)
  const center = new Vector3()
  box.getCenter(center)
  const size = new Vector3()
  box.getSize(size)
  // 柱子参数
  const height = size.z * 0.5 // 柱子高度为模型高度一半
  const radius = height / 10 // 柱子底面半径
  // 柱子底部位置
  const cylinderBottom = center.clone()
  cylinderBottom.z = box.max.z // 柱子底部在模型顶部
  // 创建柱子
  const cylinderGeometry = new CylinderGeometry(radius, radius, height, 32)
  const cylinderMaterial = new MeshBasicMaterial({ color: new Color('#3498db') }) // 蓝色
  const cylinder = new Mesh(cylinderGeometry, cylinderMaterial)
  // 柱子中心对齐模型中心
  cylinder.position.copy(center)
  cylinder.position.z = box.max.z + height / 2 // 柱子底部贴模型顶部
  // 添加到模型
  geometry.add(cylinder)
}
