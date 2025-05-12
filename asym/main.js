// ───────────────────────────────────────────────
// Globals & Helpers
// ───────────────────────────────────────────────
let scene, camera, renderer, ambientLight, directionalLight;
let waterMesh, normalMap1, normalMap2;
let currentObject = null, objectList = [], objectCounter = 1;

// scroll speeds for the two normal maps
const scrollSpeed1 = new THREE.Vector2(0.001,  0.0005);
const scrollSpeed2 = new THREE.Vector2(-0.0007, -0.0003);

function getRandomColor() {
  const randomColor = Math.floor(Math.random() * 0xFFFFFF).toString(16);
  return `#${randomColor.padStart(6, '0')}`;
}

function g_texture() {
  return new THREE.TextureLoader().load(
    'https://as2.ftcdn.net/v2/jpg/02/57/17/65/1000_F_257176513_GfJoMbU5RrRZoXDgs8pajKzOOpRv7K7E.jpg',
    tex => {
      tex.mapping     = THREE.EquirectangularRefractionMapping;
      tex.anisotropy  = renderer.capabilities.getMaxAnisotropy();
      tex.magFilter   = THREE.NearestFilter;
      tex.minFilter   = THREE.LinearMipmapLinearFilter;
      tex.wrapS = tex.wrapT = THREE.MirroredRepeatWrapping;
      tex.repeat.set(0.9, 0.9);
    }
  );
}

// ───────────────────────────────────────────────
// Build water plane + CubeCamera reflections
// ───────────────────────────────────────────────
function createWaterSurface() {
  const loader = new THREE.TextureLoader();
  normalMap1 = loader.load('https://threejs.org/examples/textures/waternormals.jpg');
  normalMap2 = loader.load('https://threejs.org/examples/textures/waternormals.jpg');
  [normalMap1, normalMap2].forEach(t => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(40, 40);
  });

  const cubeRT = new THREE.WebGLCubeRenderTarget(256, {
    format: THREE.RGBAFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    encoding: renderer.outputEncoding
  });

  const mat = new THREE.MeshPhysicalMaterial({
    color:            0xffffff,
    metalness:        1.0,
    transmission:1.0,
    ior: 1.4,
    roughness:        0.1,
    glass: 0.9,
    specular: 0.1,
    thickness: 1.0,
    dither: true,
    reflex:.5,
    envMap:           g_texture(),
    envMapIntensity:  1.5,
    normalMap:        normalMap1,
    bumpMap:          normalMap2,
    bumpScale:        0.5
  });

  const geo = new THREE.PlaneGeometry(200, 130);
  waterMesh = new THREE.Mesh(geo, mat);
  waterMesh.rotation.x = -Math.PI/2 + 0.05;
  waterMesh.position.y = -7;
  scene.add(waterMesh);

  const cubeCam = new THREE.CubeCamera(0.1, 1000, cubeRT);
  cubeCam.position.copy(waterMesh.position);
  scene.add(cubeCam);
  waterMesh.userData.cubeCamera = cubeCam;
}

// ───────────────────────────────────────────────
// Init & Render Loop
// ───────────────────────────────────────────────
function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.z = 10;

  renderer = new THREE.WebGLRenderer();
  const cv = document.getElementById('sceneViewer');
  renderer.setSize(cv.clientWidth, cv.clientHeight);
  cv.appendChild(renderer.domElement);

  scene.background = new THREE.Color('#008080');
  ambientLight = new THREE.AmbientLight('#008080F', 0.5);
  directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 10, 10).normalize();
  scene.add(ambientLight, directionalLight);

  createWaterSurface();

  // collapse all "smol" panels initially
  document.querySelectorAll('.smol').forEach(panel => {
    panel.querySelector('.panel-content').style.display = 'none';
    panel.querySelector('img.minimize-button').src = 'eye-closed.png';
  });

  animate();
}

function animate() {
  requestAnimationFrame(animate);

  // scroll normals
  if (normalMap1 && normalMap2) {
    normalMap1.offset.add(scrollSpeed1);
    normalMap2.offset.add(scrollSpeed2);
  }

  // update reflections
  if (waterMesh && waterMesh.userData.cubeCamera) {
    const cc = waterMesh.userData.cubeCamera;
    waterMesh.visible = false;
    cc.position.copy(waterMesh.position);
    cc.update(renderer, scene);
    waterMesh.visible = true;
  }

  renderer.render(scene, camera);
}
// ───────────────────────────────────────────────
// Panel Toggles & Properties
// ───────────────────────────────────────────────
function togglePanel(panelId) {
  const panel  = document.getElementById(panelId);
  const content= panel.querySelector('.panel-content');
  const btn    = panel.querySelector('img.minimize-button');
  if (content.style.display === 'none') {
    content.style.display = 'block';
    btn.src = 'eye-open.png';
  } else {
    content.style.display = 'none';
    btn.src = 'eye-closed.png';
  }
}

function showPanel(panelId) {
  const panel = document.getElementById(panelId);
  panel.querySelector('.panel-content').style.display = 'block';
  panel.querySelector('img.minimize-button').src = 'eye-open.png';
}

// ───────────────────────────────────────────────
// Add‐Object Functions
// ───────────────────────────────────────────────
function createCube() {
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  scene.add(cube);
  cube.name = `#${objectCounter++} Cube`;
  addToOutliner(cube);
  selectObjectFromOutliner(cube);
}

function createSphere() {
  const sph = new THREE.Mesh(
    new THREE.SphereGeometry(1,32,32),
    new THREE.MeshBasicMaterial({ color: getRandomColor() })
  );
  scene.add(sph);
  sph.name = `#${objectCounter++} Sphere`;
  addToOutliner(sph);
  selectObjectFromOutliner(sph);
}

function createImage() {
  const input = document.createElement('input');
  input.type    = 'file';
  input.accept  = 'image/*';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e2 => {
      const img = new Image();
      img.onload = () => {
        const tex = new THREE.Texture(img);
        tex.needsUpdate = true;
        const ar = img.width/img.height, w=5, h=w/ar;
        const plane = new THREE.Mesh(
          new THREE.PlaneGeometry(w,h),
          new THREE.MeshBasicMaterial({ map:tex, transparent:true })
        );
        scene.add(plane);
        plane.name = `#${objectCounter++} Image`;
        addToOutliner(plane);
        selectObjectFromOutliner(plane);
      };
      img.src = e2.target.result;
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function showGLTFInput() {
  const input = document.createElement('input');
  input.type   = 'file';
  input.accept = '.gltf,.glb';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e2 => {
      new THREE.GLTFLoader().parse(e2.target.result, '', gltf => {
        const model = gltf.scene;
        scene.add(model);
        model.name = `#${objectCounter++} Model`;
        addToOutliner(model);
        selectObjectFromOutliner(model);
      });
    };
    reader.readAsArrayBuffer(file);
  };
  input.click();
}

// ───────────────────────────────────────────────
// Outliner Selection & Updates
// ───────────────────────────────────────────────
function selectObjectFromOutliner(obj) {
  document.getElementById('propertiesPanel').classList.remove('smol');
  showPanel('propertiesPanel');
  currentObject = obj;

  document.getElementById('objectName').value = obj.name;
  ['posX','posY','posZ'].forEach((id,i)=>
    document.getElementById(id).value = obj.position.getComponent(i).toFixed(3)
  );
  ['rotX','rotY','rotZ'].forEach((id,i)=>
    document.getElementById(id).value = THREE.MathUtils.radToDeg(obj.rotation.getComponent(i)).toFixed(3)
  );
  ['scaleX','scaleY','scaleZ'].forEach((id,i)=>
    document.getElementById(id).value = obj.scale.getComponent(i).toFixed(3)
  );
  document.getElementById('materialColor').value = rgbToHex(obj.material?.color || new THREE.Color(1,1,1));

  Array.from(document.getElementById('outlinerList').children)
    .forEach(li => li.style.color = 'white');
  const sel = Array.from(document.getElementById('outlinerList').children)
    .find(li => li.textContent === obj.name);
  if (sel) sel.style.color = 'red';
}

function addToOutliner(obj) {
  objectList.push(obj);
  const li = document.createElement('li');
  li.textContent = obj.name;
  li.onclick = () => selectObjectFromOutliner(obj);
  document.getElementById('outlinerList').appendChild(li);
}

// ───────────────────────────────────────────────
// Utility Updaters
// ───────────────────────────────────────────────
function rgbToHex(color) {
  const r = Math.round(color.r * 255),
        g = Math.round(color.g * 255),
        b = Math.round(color.b * 255);
  return `#${((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1)}`;
}

function updateWorldColor(e) {
  scene.background = new THREE.Color(e.target.value);
  ambientLight.color.set(e.target.value);
}

function updatePosition() {
  if (!currentObject) return;
  currentObject.position.set(
    +document.getElementById('posX').value,
    +document.getElementById('posY').value,
    +document.getElementById('posZ').value
  );
}

function updateName() {
  if (!currentObject) return;
  const nm = document.getElementById('objectName').value;
  Array.from(document.getElementById('outlinerList').children)
    .forEach(li => {
      if (li.textContent === currentObject.name) li.textContent = nm;
    });
  currentObject.name = nm;
}

function updateRotation() {
  if (!currentObject) return;
  currentObject.rotation.set(
    THREE.MathUtils.degToRad(+document.getElementById('rotX').value),
    THREE.MathUtils.degToRad(+document.getElementById('rotY').value),
    THREE.MathUtils.degToRad(+document.getElementById('rotZ').value)
  );
}

function updateScale() {
  if (!currentObject) return;
  currentObject.scale.set(
    +document.getElementById('scaleX').value,
    +document.getElementById('scaleY').value,
    +document.getElementById('scaleZ').value
  );
}

function updateMaterialColor() {
  if (currentObject?.material) {
    currentObject.material.color.set(document.getElementById('materialColor').value);
  }
}

// ───────────────────────────────────────────────
// Panel Scroll Shrink/Expand
// ───────────────────────────────────────────────
function handlePanelScroll() {
  const cp = document.querySelector('.controls-panels');
  if (cp.scrollTop > 20) cp.classList.add('cBig');
  else              cp.classList.remove('cBig');
}
// ───────────────────────────────────────────────
// Wire up UI event listeners
// ───────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Panel toggles
  document.querySelectorAll('img.minimize-button').forEach(btn => {
    btn.addEventListener('click', () => togglePanel(btn.dataset.panel));
  });

  // Add‐object buttons
  document.getElementById('btn-add-cube').addEventListener('click', createCube);
  document.getElementById('btn-add-sphere').addEventListener('click', createSphere);
  document.getElementById('btn-add-gltf').addEventListener('click', showGLTFInput);

  // Property inputs → update calls
  ['posX','posY','posZ'].forEach(id =>
    document.getElementById(id).addEventListener('change', updatePosition)
  );
  ['rotX','rotY','rotZ'].forEach(id =>
    document.getElementById(id).addEventListener('change', updateRotation)
  );
  ['scaleX','scaleY','scaleZ'].forEach(id =>
    document.getElementById(id).addEventListener('change', updateScale)
  );
  document.getElementById('objectName').addEventListener('change', updateName);
  document.getElementById('materialColor').addEventListener('change', updateMaterialColor);
  document.getElementById('worldColor').addEventListener('change', updateWorldColor);

  // Scroll shrink/expand
  const cp = document.querySelector('.controls-panels');
  if (cp) cp.addEventListener('scroll', handlePanelScroll);

  // Start everything
  init();
});

// ───────────────────────────────────────────────
// Handle window resize
// ───────────────────────────────────────────────
window.addEventListener('resize', () => {
  const cv = document.getElementById('sceneViewer');
  renderer.setSize(cv.clientWidth, cv.clientHeight);
  camera.aspect = cv.clientWidth / cv.clientHeight;
  camera.updateProjectionMatrix();
});
