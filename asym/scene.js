// scene.js
// ─────────────────────────────────────────────────────────────────────────────
// Entire Three.js scene + water + lights + animation loop

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';

export let scene, camera, renderer, ambientLight, directionalLight;
export let currentObject = null;
export const objectList = [];
let objectCounter = 1;

export function getRandomColor() {
  const c = Math.floor(Math.random() * 0xFFFFFF).toString(16);
  return `#${c.padStart(6, '0')}`;
}

export function g_texture(src) {
  const path = src || 'https://as2.ftcdn.net/v2/jpg/02/57/17/65/1000_F_257176513_GfJoMbU5RrRZoXDgs8pajKzOOpRv7K7E.jpg';
  const tex = new THREE.TextureLoader().load(path, e => {
    e.mapping    = THREE.EquirectangularRefractionMapping;
    e.anisotropy = renderer.capabilities.getMaxAnisotropy();
    e.magFilter  = THREE.NearestFilter;
    e.minFilter  = THREE.LinearMipmapLinearFilter;
    e.wrapS = e.wrapT = THREE.MirroredRepeatWrapping;
    e.type       = THREE.HalfFloatType;
    e.format     = THREE.RGBAFormat;
    e.repeat.set(0.9, 0.9);
  });
  return tex;
}

function createWaterSurface() {
  const TL = new THREE.TextureLoader();
  const base = TL.load('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2iDkUZqrSe2Aaktm4UgkaR6FHZyoMVUz8uw&s');
  const norm = TL.load('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2iDkUZqrSe2Aaktm4UgkaR6FHZyoMVUz8uw&s');
  base.wrapS = base.wrapT = norm.wrapS = norm.wrapT = THREE.RepeatWrapping;
  base.repeat.set(40,40); norm.repeat.set(40,40);

  const geo = new THREE.PlaneGeometry(100,100,1,1);
  const mat = new THREE.MeshPhysicalMaterial({
    map: base,
    normalMap: norm,
    metalness: 1,
    roughness: 0.1,
    envMap: g_texture(),
    envMapIntensity: 1.5
  });
  const water = new THREE.Mesh(geo, mat);
  water.rotation.x = THREE.MathUtils.degToRad(-87);
  water.position.y = -7;
  scene.add(water);

  ;(function tick() {
    const uvs = geo.attributes.uv.array;
    for (let i=0; i<uvs.length; i+=2) {
      uvs[i]   += 0.0001;
      uvs[i+1] += 0.00005;
    }
    geo.attributes.uv.needsUpdate = true;
    requestAnimationFrame(tick);
  })();
}

export function init() {
  scene    = new THREE.Scene();
  camera   = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer();
  const container = document.getElementById('sceneViewer');
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  scene.background = new THREE.Color('#008080');
  const wireframeBox = new THREE.Mesh(
    new THREE.BoxGeometry(10,10,10),
    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true })
  );
  scene.add(wireframeBox);
  camera.position.z = 15;

  ambientLight     = new THREE.AmbientLight('#008080F', 0.5);
  directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10,10,10).normalize();
  scene.add(ambientLight, directionalLight);

  createWaterSurface();

  (function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  })();
}

window.addEventListener('resize', () => {
  const c = document.getElementById('sceneViewer');
  renderer.setSize(c.clientWidth, c.clientHeight);
  camera.aspect = c.clientWidth / c.clientHeight;
  camera.updateProjectionMatrix();
});

// start it
init();
