import { AmbientLight, AxesHelper, Camera, Color, PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
/** 初始化场景基础配置 */
interface InitScenebase {
  /** 场景对象 */
  scene: Scene
  /** 主相机对象 */
  camera: Camera
  /** 渲染器对象 */
  renderer: WebGLRenderer
  /** 轨道控制器，可选 */
  controls?: OrbitControls
  /** 环境光 */
  ambientLight: AmbientLight | undefined

  /** 循环渲染方法 */
  renderLoop: () => void
  /** 窗口尺寸自适应方法 */
  resize: (width: number, height: number) => void
  /** 清理场景方法 */
  clear: () => void
  /** 暂停渲染方法 */
  pause: () => void
  /** 恢复渲染方法 */
  resume: () => void
  /** 开启环境光 */
  openAmbientLight: () => void
  /** 关闭环境光 */
  closeAmbientLight: () => void
}

/**
 * @description: 基础场景设置，包含场景、相机、渲染器、轨道控制器
 * @return {*}
 */
export class SceneBase implements InitScenebase {
  camera: Camera
  renderer: WebGLRenderer
  controls?: OrbitControls | undefined
  canvas: HTMLCanvasElement
  scene: Scene
  isPause: boolean = false
  ambientLight: AmbientLight | undefined
  openHelper: boolean = false
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.scene = new Scene()
    this.scene.background = new Color('#00000000')
    this.camera = new PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000)
    this.camera.position.set(0, 0, 100)
    this.renderer = new WebGLRenderer({ canvas })
    this.renderer.shadowMap.enabled = true
    this.resize(canvas.width, canvas.height)
    this.controls = new OrbitControls(this.camera, canvas)
  }

  renderLoop() {
    if (!this.isPause) {
      this.renderer.render(this.scene, this.camera)
      this.controls?.update()
      requestAnimationFrame(this.renderLoop.bind(this))
    }
  }

  resize(width: number, height: number) {
    this.renderer.setSize(width, height)
  }

  clear() {
    this.isPause = true
    this.scene.clear()
  }
  pause() {
    this.isPause = true
  }
  resume() {
    this.isPause = false
  }
  openAmbientLight() {
    if (!this.ambientLight) {
      this.ambientLight = new AmbientLight('#ffffff', 1)
      this.scene.add(this.ambientLight)
    }
  }
  closeAmbientLight() {
    this.ambientLight && this.scene.remove(this.ambientLight)
  }
  triggerHelper() {
    this.openHelper = !this.openHelper
    const helper = new AxesHelper(100)
    if (this.openHelper) {
      this.scene.add(helper)
    } else {
      this.scene.remove(helper)
    }
  }
}
