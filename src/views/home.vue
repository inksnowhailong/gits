<script setup lang="ts">
import geoJson from '@/assets/china.json'
import { SceneBase } from '@/views/SceneBase'
import { useMapGeometry, useWeather, createFlowLineMaterial } from './modules'
import { MeshStandardMaterial } from 'three'
import { useDirectionalLight, usePointLight, useSpotLight } from './lights'
// 初始化配置
const canvasRef = ref<HTMLCanvasElement>()
let sceneBase: SceneBase | undefined = undefined
// useWeather(, '110000')
// 定向光
const DLight = useDirectionalLight(0xffffff, 8, 10)
// 点光源
// const PointLight = usePointLight(40, 0xffffff, 40)
//聚光灯
// const SpotLight = useSpotLight(0xffffff, 1000)

onMounted(() => {
  console.time('sceneBase')
  sceneBase = new SceneBase(canvasRef.value!)
  sceneBase.openAmbientLight()
  sceneBase.renderLoop()
  sceneBase.triggerHelper()
  // 地图模型
  useMapGeometry(
    geoJson,
    new MeshStandardMaterial({
      color: '#1e3a8a',
      metalness: 0.6, // 金属度（0~1，越高越像金属，越有反射）
      roughness: 0.8, // 粗糙度（0~1，越低越光滑，越有高光）
      flatShading: true
    })
  ).then((Map) => {
    // 地图模型
    Map.joinScene(sceneBase!.scene)
    Map.MapGeometry.value.rotation.set(-1.5, 0, 0)
    Map.MapGeometry.value.scale.set(1.5, 1.5, 1.5)
  })

  DLight.joinScene(sceneBase!.scene)
  DLight.updatePosition(200, 300, 200)
  DLight.updateTarget(0, 0, 0)
  DLight.openHelper.value = true

  // SpotLight.joinScene(sceneBase!.scene)
  // SpotLight.updatePosition(-20, 60, -40)
  // SpotLight.updateTarget(0, 0, 0)
  // SpotLight.openHelper.value = true
  // SpotLight.lightRef.value.angle = Math.PI / 2
  console.timeEnd('sceneBase')
})

onScopeDispose(() => {
  sceneBase?.clear()
})
</script>

<template>
  <div class="w-[800px] h-[800px] m-auto">
    <canvas class="w-full h-full" width="800" height="800" ref="canvasRef"></canvas>
  </div>
</template>

<style scoped lang="scss"></style>
