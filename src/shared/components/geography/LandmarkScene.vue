<template>
  <span ref="host" class="miniature-scene" @pointermove="move" @pointerleave="rest">
    <LandmarkMiniature v-if="failed" :kind="kind" />
  </span>
</template>
<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as T from 'three'
import { buildLandmark } from '../../domain/geography/landmark-models.js'
import LandmarkMiniature from './LandmarkMiniature.vue'
import { useMotionPreferences } from '../../composables/useMotionPreferences.js'
const { motionEnabled } = useMotionPreferences()
const props=defineProps({kind:String, active:Boolean})
const host=ref(null), failed=ref(false)
let renderer,scene,camera,model,observer,frame,dead=false,target=0,tilt=0
function draw() {
  if(dead || !renderer || !model) return
  if (!motionEnabled.value) { target=0;tilt=0;model.rotation.x=0;model.rotation.y=0 }
  const rotation=!motionEnabled.value ? 0 : target+(props.active ? .12 : 0)
  model.rotation.y+=(rotation-model.rotation.y)*.13
  model.rotation.x+=(tilt-model.rotation.x)*.13
  renderer.render(scene,camera)
  if(Math.abs(rotation-model.rotation.y)>.001 || Math.abs(tilt-model.rotation.x)>.001) frame=requestAnimationFrame(draw)
}
function render(){cancelAnimationFrame(frame);if(!dead && !failed.value)frame=requestAnimationFrame(draw)}
function release() {
  cancelAnimationFrame(frame)
  observer?.disconnect(); observer=undefined
  const materials=new Set(), geometries=new Set()
  model?.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const material of (Array.isArray(o.material)?o.material:[o.material]))if(material)materials.add(material)})
  geometries.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose())
  const previous=renderer
  renderer=scene=camera=model=undefined
  previous?.domElement.removeEventListener('webglcontextlost', fallback)
  previous?.dispose(); previous?.forceContextLoss(); previous?.domElement.remove()
}
function fallback(){failed.value=true;release()}
function move(event){if(!motionEnabled.value)return;const r=host.value.getBoundingClientRect();target=((event.clientX-r.left)/r.width-.5)*.65;tilt=((event.clientY-r.top)/r.height-.5)*.12;render()}
function rest(){target=0;tilt=0;render()}
watch(()=>props.active,render)
watch(motionEnabled,render)
onMounted(()=>{
  try {
    renderer=new T.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace
    host.value.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true')
    renderer.domElement.addEventListener('webglcontextlost',fallback)
    scene=new T.Scene();scene.add(new T.HemisphereLight('#fff6df','#496571',2.8));const sun=new T.DirectionalLight('#ffe4b1',3.5);sun.position.set(-3,6,5);scene.add(sun)
    model=buildLandmark(props.kind);scene.add(model)
    camera=new T.OrthographicCamera(-1.8,1.8,2.2,-2.2,.1,50);camera.position.set(4,3.6,6);camera.lookAt(0,1.25,0)
    observer=new ResizeObserver(()=>{if(!host.value)return;const {width,height}=host.value.getBoundingClientRect();if(!width||!height)return;const half=props.kind==='tower'?1.8:1.6;camera.left=-half;camera.right=half;camera.top=half*height/width;camera.bottom=-camera.top;camera.updateProjectionMatrix();renderer.setSize(width,height,false);render()});observer.observe(host.value)
  } catch { fallback() }
})
onUnmounted(()=>{dead=true;release()})
</script>
<style scoped>
.miniature-scene{display:block;width:100%;height:100%;filter:drop-shadow(0 7px 5px #10252d55)}
.miniature-scene :deep(canvas),.miniature-scene :deep(svg){width:100%;height:100%;display:block}
</style>
