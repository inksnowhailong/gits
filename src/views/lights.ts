import {
  ColorRepresentation,
  DirectionalLight,
  DirectionalLightHelper,
  Scene,
  PointLight,
  PointLightHelper,
  SpotLight,
  SpotLightHelper,
  Light
} from 'three'

/**
 * @description 光源结果接口，定义了光源对象的基本属性和方法
 * @template T 光源类型，继承自Three.js的Light基类
 */
export interface LightResult<T extends Light> {
  /** 光源对象的响应式引用 */
  lightRef: Ref<T>
  /** 是否显示光源辅助器的响应式引用 */
  openHelper: Ref<boolean>
  /** 更新光源位置的方法 */
  updatePosition: (x: number, y: number, z: number) => void
  /** 更新光源目标位置的方法（可选） */
  updateTarget?: (x: number, y: number, z: number) => void
  /** 将光源添加到场景的方法 */
  joinScene: (scene: Scene) => void
  [key: string]: any
}

/**
 * @description: 使用 DirectionalLight 光源
 * @param {array} option
 * @return {*}
 */
export function useDirectionalLight(color?: ColorRepresentation, intensity?: number, DSize?: number) {
  const light = new DirectionalLight(color, intensity)
  light.castShadow = true
  const lightRef = shallowRef(light)
  const helper = new DirectionalLightHelper(light, DSize)
  const openHelper = ref(false)
  watchEffect(() => {
    if (openHelper.value) {
      lightRef.value.add(helper)
    } else {
      lightRef.value.remove(helper)
    }
  })
  return {
    lightRef,
    openHelper,
    setDefaultPosition: () => {
      lightRef.value.position.set(200, 300, 200)
      lightRef.value.target.position.set(0, 0, 0)
    },
    updatePosition: (x: number, y: number, z: number) => {
      lightRef.value.position.set(x, y, z)
    },
    updateTarget: (x: number, y: number, z: number) => {
      lightRef.value.target.position.set(x, y, z)
      helper.update()
    },
    joinScene: (scene: Scene) => {
      scene.add(lightRef.value)
      scene.add(lightRef.value.target)
    }
  } satisfies LightResult<DirectionalLight>
}

/**
 * @description: 点光源
 * @param {type} params
 * @return {*}
 */
export function usePointLight<P extends ConstructorParameters<typeof PointLight>>(PSize: number = 1, ...option: P) {
  const light = new PointLight(...option, PSize)
  const lightRef = shallowRef(light)
  const helper = new PointLightHelper(light, PSize)
  const openHelper = ref(false)
  watchEffect(() => {
    if (openHelper.value) {
      lightRef.value.add(helper)
    } else {
      lightRef.value.remove(helper)
    }
  })
  return {
    lightRef,
    openHelper,
    updatePosition: (x: number, y: number, z: number) => {
      lightRef.value.position.set(x, y, z)
    },
    joinScene: (scene: Scene) => {
      scene.add(lightRef.value)
    }
  } satisfies LightResult<PointLight>
}

/**
 * @description: 聚光灯
 * @return {*}
 */
export function useSpotLight(color?: ColorRepresentation, intensity?: number, DSize: number = 10) {
  const light = new SpotLight(color, intensity)
  light.castShadow = true
  const lightRef = shallowRef(light)
  const helper = new SpotLightHelper(light, DSize)
  const openHelper = ref(false)
  watchEffect(() => {
    if (openHelper.value) {
      lightRef.value.add(helper)
    } else {
      lightRef.value.remove(helper)
    }
  })
  return {
    lightRef,
    openHelper,
    updatePosition: (x: number, y: number, z: number) => {
      lightRef.value.position.set(x, y, z)
    },
    updateTarget: (x: number, y: number, z: number) => {
      lightRef.value.target.position.set(x, y, z)
      helper.update()
    },
    joinScene: (scene: Scene) => {
      scene.add(lightRef.value)
    }
  } satisfies LightResult<SpotLight>
}
