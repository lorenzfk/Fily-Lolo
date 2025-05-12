// controls.js
// ─────────────────────────────────────────────────────────────────────────────

import {
  scene,
  ambientLight,
  objectList,
  getRandomColor
} from './scene.js';

// track the selected object
let currentObject = null;

// 1) panel scroll
function handlePanelScroll() {
  const cp = document.querySelector('.controls-panels');
  if (!cp) return;
  cp.classList.toggle('cBig', cp.scrollTop > 20);
}

// 2) show/hide panels
function togglePanel(panelId) {
  const p = document.getElementById(panelId);
  const img = p.querySelector('img.minimize-button');
  const content = p.querySelector('.panel-content');
  const open = content.style.display === 'none';
  content.style.display = open ? 'block' : 'none';
  img.src = open ? 'eye-open.png' : 'eye-closed.png';
}

// 3) Outliner click → properties
function selectObjectFromOutliner(obj) {
  currentObject = obj;

  // reveal properties panel
  const PP = document.getElementById('propertiesPanel');
  PP.classList.remove('smol');
  PP.querySelector('.panel-content').style.display = 'block';
  PP.querySelector('img.minimize-button').src = 'eye-open.png';

  // fill fields
  document.getElementById('objectName').value = obj.name;
  ['X','Y','Z'].forEach(A => {
    const low = A.toLowerCase();
    document.getElementById('pos'+A).value = obj.position[low].toFixed(3);
    document.getElementById('rot'+A).value = THREE.MathUtils
      .radToDeg(obj.rotation[low])
      .toFixed(3);
    document.getElementById('scale'+A).value = obj.scale[low].toFixed(3);
  });
  document.getElementById('materialColor').value = obj.material
    ? `#${obj.material.color.getHexString()}`
    : '#ffffff';

  // highlight in list
  document.querySelectorAll('#outlinerList li').forEach(li => {
    li.style.color = (li.textContent === obj.name ? 'red' : 'white');
  });
}

// 4) add new LI to outliner
function addToOutliner(obj) {
  objectList.push(obj);
  const li = document.createElement('li');
  li.textContent = obj.name;
  li.onclick = () => selectObjectFromOutliner(obj);
  document.getElementById('outlinerList').appendChild(li);
}

// 5) creation functions
function createCube() {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  scene.add(m);
  m.name = `#${objectList.length+1} Cube`;
  addToOutliner(m);
  selectObjectFromOutliner(m);
}

function createSphere() {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(1,32,32),
    new THREE.MeshBasicMaterial({ color: getRandomColor() })
  );
  scene.add(m);
  m.name = `#${objectList.length+1} Sphere`;
  addToOutliner(m);
  selectObjectFromOutliner(m);
}

function createImage() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = e => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = e2 => {
      const img = new Image();
      img.onload = () => {
        const tex = new THREE.Texture(img);
        tex.needsUpdate = true;
        const ar = img.width/img.height, w=5, h=w/ar;
        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(w,h),
          new THREE.MeshBasicMaterial({ map:tex, transparent:true })
        );
        scene.add(mesh);
        mesh.name = `#${objectList.length+1} Image`;
        addToOutliner(mesh);
        selectObjectFromOutliner(mesh);
      };
      img.src = e2.target.result;
    };
    r.readAsDataURL(f);
  };
  inp.click();
}

function showGLTFInput() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.gltf,.glb';
  inp.onchange = e => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = e2 => {
      new THREE.GLTFLoader().parse(e2.target.result, '', gltf => {
        const model = gltf.scene;
        scene.add(model);
        model.name = `#${objectList.length+1} Model`;
        addToOutliner(model);
        selectObjectFromOutliner(model);
      });
    };
    r.readAsArrayBuffer(f);
  };
  inp.click();
}

// 6) property updates
function updateWorldColor(e) {
  const c = new THREE.Color(e.target.value);
  scene.background = c;
  ambientLight.color.set(c);
}

function updatePosition() {
  if (!currentObject) return;
  ['X','Y','Z'].forEach(A => {
    currentObject.position[A.toLowerCase()] =
      parseFloat(document.getElementById('pos'+A).value);
  });
}

function updateRotation() {
  if (!currentObject) return;
  ['X','Y','Z'].forEach(A => {
    currentObject.rotation[A.toLowerCase()] =
      THREE.MathUtils.degToRad(parseFloat(
        document.getElementById('rot'+A).value
      ));
  });
}

function updateScale() {
  if (!currentObject) return;
  ['X','Y','Z'].forEach(A => {
    currentObject.scale[A.toLowerCase()] =
      parseFloat(document.getElementById('scale'+A).value);
  });
}

function updateName() {
  if (!currentObject) return;
  const nn = document.getElementById('objectName').value;
  document.querySelectorAll('#outlinerList li').forEach(li => {
    if (li.textContent === currentObject.name) li.textContent = nn;
  });
  currentObject.name = nn;
}

function updateMaterialColor() {
  if (!currentObject || !currentObject.material) return;
  currentObject.material.color.set(
    document.getElementById('materialColor').value
  );
}

// 7) bootstrap on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  // hide all smol panels
  document.querySelectorAll('.smol .panel-content').forEach(c => c.style.display = 'none');
  document.querySelectorAll('.smol img.minimize-button')
    .forEach(img => img.src = 'eye-closed.png');

  // scroll listener
  const cp = document.querySelector('.controls-panels');
  if (cp) cp.addEventListener('scroll', handlePanelScroll);

  // expose your handlers globally so your existing onclick/onchange attrs work
  Object.assign(window, {
    togglePanel,
    createCube,
    createSphere,
    createImage,
    showGLTFInput,
    updateWorldColor,
    updatePosition,
    updateRotation,
    updateScale,
    updateName,
    updateMaterialColor
  });
});
