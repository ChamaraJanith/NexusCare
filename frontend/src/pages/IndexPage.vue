<template>
  <q-page class="bg-black overflow-hidden flex flex-center">
    <canvas ref="threeCanvas" class="absolute-full"></canvas>

    <div class="content-overlay full-width">
      <div class="text-center q-mb-xl animate-fade-in">
        <h1 class="nexus-logo text-weight-bolder q-my-none">NEXUS CARE</h1>
        <div class="text-cyan-4 text-h6 font-orbitron opacity-70">
          Smart Healthcare · Microservices · AI [cite: 30, 31]
        </div>
      </div>

      <div class="row q-col-gutter-lg justify-center q-px-md">
        <div v-for="(node, index) in nodes" :key="index" class="col-12 col-sm-6 col-md-3">
          <q-card class="nexus-card glass">
            <q-card-section class="text-center">
              <div class="orb-container q-mb-md">
                <div class="orb-glow" :style="{ backgroundColor: node.color }"></div>
                <q-icon :name="node.icon" size="3rem" class="relative-position z-top" />
              </div>

              <div class="text-h6 text-white text-weight-bold">{{ node.title }}</div>
              <div class="text-caption text-cyan-2 q-mb-sm">{{ node.id }}</div>
              <p class="text-grey-5 text-caption h-40">{{ node.desc }}</p>

              <q-btn
                :to="node.link"
                :label="node.link ? 'Launch Node' : 'Service Locked'"
                flat
                rounded
                :color="node.link ? 'cyan' : 'grey-7'"
                class="full-width nexus-btn"
                :disable="!node.link"
              />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <div class="fixed-bottom q-pa-md row justify-between items-center bg-glass-dark">
        <div class="row items-center q-gutter-sm">
          <q-badge rounded color="green" class="pulse" />
          <span class="text-caption text-grey-4">ALL SYSTEMS OPERATIONAL [cite: 37]</span>
        </div>
        <div class="text-caption text-cyan opacity-50">V 1.0.4 | MICROSERVICE ARCHITECTURE</div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

const threeCanvas = ref(null)
let renderer, scene, camera, points

const nodes = [
  { id: 'MS1', title: 'Patient Portal', icon: 'person', color: '#2196F3', desc: 'Manage profiles, reports & history [cite: 16, 18]', link: null },
  { id: 'MS2', title: 'Doctor Hub', icon: 'medical_services', color: '#F44336', desc: 'Consultations & prescriptions [cite: 21, 22]', link: null },
  { id: 'MS3', title: 'Appointment', icon: 'event', color: '#FF9800', desc: 'Real-time booking engine [cite: 23]', link: null },
  { id: 'MS4', title: 'Interaction', icon: 'auto_awesome', color: '#00BCD4', desc: 'AI Symptoms & Telemedicine [cite: 24, 30]', link: '/symptoms' }
]

const initThree = () => {
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000)
  camera.position.z = 400

  renderer = new THREE.WebGLRenderer({ canvas: threeCanvas.value, alpha: true, antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)

  const geometry = new THREE.BufferGeometry()
  const vertices = []
  for (let i = 0; i < 6000; i++) {
    vertices.push(Math.random() * 2000 - 1000, Math.random() * 2000 - 1000, Math.random() * 2000 - 1000)
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))

  const material = new THREE.PointsMaterial({ color: 0x00ffff, size: 1.5, transparent: true, opacity: 0.6 })
  points = new THREE.Points(geometry, material)
  scene.add(points)
}

const animate = () => {
  requestAnimationFrame(animate)
  points.rotation.y += 0.0008
  points.rotation.x += 0.0004
  renderer.render(scene, camera)
}

onMounted(() => {
  initThree()
  animate()
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })
})

onUnmounted(() => {
  renderer.dispose()
})
</script>

<style scoped>
.font-orbitron { font-family: 'Orbitron', sans-serif; letter-spacing: 2px; }

.nexus-logo {
  font-size: clamp(3rem, 8vw, 6rem);
  color: #fff;
  text-shadow: 0 0 20px rgba(0, 255, 255, 0.7);
  letter-spacing: 15px;
}

.glass {
  background: rgba(255, 255, 255, 0.03) !important;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(0, 255, 255, 0.1);
  border-radius: 20px;
}

.nexus-card {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.nexus-card:hover {
  transform: translateY(-15px) scale(1.02);
  border-color: #00ffff;
  box-shadow: 0 10px 30px rgba(0, 255, 255, 0.2);
}

.orb-container {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orb-glow {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  filter: blur(20px);
  opacity: 0.4;
}

.h-40 { height: 40px; }

.bg-glass-dark {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.pulse {
  animation: shadow-pulse 2s infinite;
}

@keyframes shadow-pulse {
  0% { box-shadow: 0 0 0 0px rgba(0, 255, 0, 0.4); }
  100% { box-shadow: 0 0 0 10px rgba(0, 255, 0, 0); }
}

.absolute-full { position: fixed; top: 0; left: 0; z-index: 0; }
.content-overlay { position: relative; z-index: 10; padding-bottom: 80px; }
</style>
