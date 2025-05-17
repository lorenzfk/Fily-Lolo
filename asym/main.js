// ───────────────────────────────────────────────
// Globals & Helpers
// ───────────────────────────────────────────────
let scene, camera, renderer, ambientLight, directionalLight;
let waterMesh, normalMap1, normalMap2, mixMap;
let currentObject = null, objectList = [], objectCounter = 1;
// ─── New Globals ─────────────────────────────────────────
let yAxisModel;               // the Y-axis helper
let movementMode = 'xz';      // toggle between 'xz' and 'y'
// ─────────────────────────────────────────────────────────

const joystickEl = document.getElementById('joystickContainer'); // your on-screen joystick wrapper

const scrollSpeed1 = new THREE.Vector2(-0.0004, 0.00003);
const scrollSpeed2 = new THREE.Vector2(-0.0001, -0.0001);
// ─── Globals ────────────────────────────────────
let axisModel;       // will hold the loaded GLTF scene
const axisLoader = new THREE.GLTFLoader();
axisLoader.load('axis.glb', gltf => {
  axisModel = gltf.scene;
  
  axisModel.visible = false;
  axisModel.scale.set(2.5,2.5,2.5);     // hide until needed
  scene.add(axisModel);
});
// ─── Load Y-axis helper ─────────────────────────────────

new THREE.GLTFLoader().load('yaxis.glb', gltf => {
  yAxisModel = gltf.scene;
  
  yAxisModel.visible = false;  
  yAxisModel.scale.set(2.5,2.5,2.5);    // start hidden
  scene.add(yAxisModel);
});

// ─────────────────────────────────────────────────────────

// random hex color
function getRandomColor() {
  const rnd = Math.floor(Math.random() * 0xFFFFFF).toString(16);
  return `#${rnd.padStart(6,'0')}`;
}

// make that image your skybox (equirectangular)
new THREE.TextureLoader().load(
  'sky.jpg',
  texture => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.encoding = renderer.outputEncoding; // match your renderer
    scene.background = texture;
  }
);

// env map loader
function g_texture() {
  return new THREE.TextureLoader().load(
    'sky.jpg',
    tex => {
      tex.mapping = THREE.EquirectangularRefractionMapping;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.wrapS = tex.wrapT = THREE.MirroredRepeatWrapping;
      tex.repeat.set(0.9,0.9);
    }
  );
}

// ───────────────────────────────────────────────
// Build water surface + CubeCamera reflections
// ───────────────────────────────────────────────
function createWaterSurface() {
  const loader = new THREE.TextureLoader();
  normalMap1 = loader.load('water.jpeg');
  normalMap2 = loader.load('waterbump.png');
  [normalMap1,normalMap2].forEach(t=>{
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(80,80);
  });

  const cubeRT = new THREE.WebGLCubeRenderTarget(256, {
    format: THREE.RGBAFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    encoding: renderer.outputEncoding
  });

  const mat = new THREE.MeshPhysicalMaterial({
    color:       0xffffff,
    metalness:   1.0,
    roughness:  normalMap2,
    dither:'true',
    bumpMap: normalMap2,
    bumpScale: 10.0,
    envMap:      g_texture(),
    envMapIntensity: 0.9,
    normalMap:   normalMap1,
  });
  

// and still assign the first map & bump map normally:


mat.onBeforeCompile = shader => {
  // 1) inject both uniforms at the top of the fragment shader
  shader.fragmentShader =
    'uniform sampler2D normalMap2;\n' +
    'uniform mat3 normalMatrix;\n' +
    shader.fragmentShader;

  // 2) bind your JS texture to that uniform
  shader.uniforms.normalMap2 = { value: normalMap2 };

  // 3) replace the default normal block
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <normal_fragment_maps>',
    `
    // --- dual normal blend ---
    vec3 n1 = texture2D( normalMap,   vUv ).xyz * 2.0 - 1.0;
    vec3 n2 = texture2D( normalMap2, vUv ).xyz * 2.0 - 1.0;
    vec3 blended = normalize( n1 + n2 );
    normal = normalize( normalMatrix * blended );
    `
  );
};
  const geo = new THREE.PlaneGeometry(400,400);
  waterMesh = new THREE.Mesh(geo, mat);
  waterMesh.rotation.x = -Math.PI/2 + 0.05;
  waterMesh.position.y = -2;
  scene.add(waterMesh);

    waterMesh.name = 'ocean';
  addToOutliner(waterMesh);


  const cubeCam = new THREE.CubeCamera(0.1,1000,cubeRT);
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
    
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio); 
  const cv = document.getElementById('sceneViewer');
  renderer.setSize(cv.clientWidth, cv.clientHeight);
  {
  const w = sceneViewer.clientWidth;
  const h = sceneViewer.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
  cv.appendChild(renderer.domElement);

  scene.background = new THREE.Color('#008080');
  ambientLight   = new THREE.AmbientLight('#008080', 0.5);
  directionalLight = new THREE.DirectionalLight(0xffffff,1);
  directionalLight.position.set(10,10,10).normalize();
  scene.add(ambientLight, directionalLight);
  scene.fog = new THREE.FogExp2(scene.background.color, 0.003);
  renderer.setClearColor(scene.background.color);
  
  // re-enable OrbitControls
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  createWaterSurface();

  // collapse all “smol” panels initially
  document.querySelectorAll('.smol').forEach(panel=>{
    panel.querySelector('.panel-content').style.display = 'none';
    panel.querySelector('img.minimize-button').src = 'eye-closed.png';
  });

  animate();
}

// remove “cBig” and hide joystick when you click the canvas
document.getElementById('sceneViewer').addEventListener('click', ()=>{
  document.querySelector('.controls-panels').classList.remove('cBig');
  //hideJoystick();
});

function animate() {
  requestAnimationFrame(animate);
  // scroll normals
  if (normalMap1 && normalMap2) {
    normalMap1.offset.add(scrollSpeed1);
    normalMap2.offset.add(scrollSpeed2);
  }
  // update cube-camera reflections
  if (waterMesh?.userData.cubeCamera) {
    const cc = waterMesh.userData.cubeCamera;
    waterMesh.visible = false;
    cc.position.copy(waterMesh.position);
    cc.update(renderer, scene);
    waterMesh.visible = true;
  }

  if (axisModel && currentObject && yAxisModel) {
    const joystickEl = document.getElementById('joystick-container');
    const isJoystickVisible = joystickEl && window.getComputedStyle(joystickEl).display !== 'none';
    axisModel.visible = isJoystickVisible;
  }
  
  renderer.render(scene, camera);
}

// kick it all off
init();
// ───────────────────────────────────────────────
// Panel Toggles & Properties
// ───────────────────────────────────────────────
function togglePanel(panelId) {
  const panel  = document.getElementById(panelId);
  const content= panel.querySelector('.panel-content');
  const btn    = panel.querySelector('img.minimize-button');
  if (content.style.display === 'none') {
    content.style.display = 'block'; btn.src = 'eye-open.png';
  } else {
    content.style.display = 'none';  btn.src = 'eye-closed.png';
  }
}
function showPanel(panelId) {
  const panel = document.getElementById(panelId);
  panel.querySelector('.panel-content').style.display = 'block';
  panel.querySelector('img.minimize-button').src = 'eye-open.png';
}

// ───────────────────────────────────────────────
// Add-Object Functions
// ───────────────────────────────────────────────
function createCube() {
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshPhysicalMaterial({ color:getRandomColor(), roughness:0.1})
  );
  scene.add(cube);
  cube.name = `#${objectCounter++} Cube`;
  addToOutliner(cube);
  selectObjectFromOutliner(cube);
}
function createSphere() {
  const sph = new THREE.Mesh(
    new THREE.SphereGeometry(1,32,32),
    new THREE.MeshPhysicalMaterial({ color:getRandomColor(), roughness:0.1 })
  );
  scene.add(sph);
  sph.name = `#${objectCounter++} Sphere`;
  addToOutliner(sph);
  selectObjectFromOutliner(sph);
}
function createImage() {
  const input = document.createElement('input');
  input.type   = 'file';
  input.accept = 'image/*';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e2 => {
      const img = new Image();
      img.onload = () => {
        const ar = img.width / img.height;
        const w = 5, h = w / ar;
        
        // Create texture and enable updates for transparency
        const tex = new THREE.Texture(img);
        tex.needsUpdate = true;

        // Material with transparency
        const material = new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,     // Ensure transparency is enabled
          alphaTest: 0.5,        // Set a threshold for alpha transparency
          opacity: 1.0           // You can adjust this if needed
        });

        // Create the plane geometry and apply the texture
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
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
      new THREE.GLTFLoader().parse(e2.target.result,'',gltf=>{
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
 ['rotX','rotY','rotZ'].forEach((id,i) => {
  const e = obj.rotation;
  const angles = [ e.x, e.y, e.z ];
  document.getElementById(id).value =
    THREE.MathUtils.radToDeg( angles[i] ).toFixed(3);
});
  ['scaleX','scaleY','scaleZ'].forEach((id,i)=>
    document.getElementById(id).value = obj.scale.getComponent(i).toFixed(3)
  );
  document.getElementById('materialColor').value = rgbToHex(obj.material?.color||new THREE.Color(1,1,1));

  Array.from(document.getElementById('outlinerList').children)
       .forEach(li=>li.style.textDecoration='none');
  const sel = Array.from(document.getElementById('outlinerList').children)
                   .find(li=>li.textContent===obj.name);
  if(sel) sel.style.textDecoration='underline';

  // show joystick whenever an object is selected
  showJoystick();
}

// ─────────────────────────────────────────────────────────

// Replace your existing addToOutliner with this:
function addToOutliner(object) {
  objectList.push(object);

  const li = document.createElement('li');
  li.textContent = object.name;
  li.style.display = 'flex';
  li.style.justifyContent = 'space-between';
  li.style.alignItems = 'center';

  // clicking the text still selects
  li.onclick = () => selectObjectFromOutliner(object);

  // create delete button
  const del = document.createElement('img');
  del.src = 'delete.png';
  del.alt = 'Delete';
  del.style.cursor = 'pointer';
  del.style.width = del.style.height = '16px';
  del.style.marginLeft = '8px';

  del.addEventListener('click', e => {
    e.stopPropagation();
    // remove from scene
    scene.remove(object);
    // remove from objectList
    objectList = objectList.filter(o => o !== object);
    // remove this <li>
    li.remove();
    // clear properties panel if that was selected
    if (currentObject === object) {
      currentObject = null;
      document.getElementById('propertiesPanel').classList.add('smol');
      // ...and clear inputs if you like
    }
  });

  li.appendChild(del);
  document.getElementById('outlinerList').appendChild(li);
}



// ───────────────────────────────────────────────
// Property Updaters & Utility
// ───────────────────────────────────────────────
function rgbToHex(color){
  const r=Math.round(color.r*255),
        g=Math.round(color.g*255),
        b=Math.round(color.b*255);
  return `#${((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1)}`;
}
function updateWorldColor(e){
  scene.background = new THREE.Color(e.target.value);
  ambientLight.color.set(e.target.value);
}
function updatePosition(){
  if(!currentObject)return;
  currentObject.position.set(
    +document.getElementById('posX').value,
    +document.getElementById('posY').value,
    +document.getElementById('posZ').value
  );
}
function updateName(){
  if(!currentObject)return;
  const nm = document.getElementById('objectName').value;
  Array.from(document.getElementById('outlinerList').children)
       .forEach(li=>{ if(li.textContent===currentObject.name) li.textContent=nm; });
  currentObject.name = nm;
}
function updateRotation(){
  if(!currentObject)return;
  currentObject.rotation.set(
    THREE.MathUtils.degToRad(+document.getElementById('rotX').value),
    THREE.MathUtils.degToRad(+document.getElementById('rotY').value),
    THREE.MathUtils.degToRad(+document.getElementById('rotZ').value)
  );
}
function updateScale(){
  if(!currentObject)return;
  currentObject.scale.set(
    +document.getElementById('scaleX').value,
    +document.getElementById('scaleY').value,
    +document.getElementById('scaleZ').value
  );
}
function updateMaterialColor(){
  if(currentObject?.material)
    currentObject.material.color.set(document.getElementById('materialColor').value);
}

// handle panel scroll cBig
function handlePanelScroll(){
  const cp = document.querySelector('.controls-panels');
  if(cp.scrollTop>20) cp.classList.add('cBig'); 
  else               cp.classList.remove('cBig');
}

// wire up inputs & buttons
window.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('img.minimize-button')
    .forEach(btn=>btn.addEventListener('click',()=>togglePanel(btn.dataset.panel)));

  document.getElementById('btn-add-cube').addEventListener('click',createCube);
  document.getElementById('btn-add-sphere').addEventListener('click',createSphere);
  document.getElementById('btn-add-gltf').addEventListener('click',showGLTFInput);
  document.getElementById('btn-add-image').addEventListener('click',createImage);
    ['scaleX','scaleY','scaleZ'].forEach(id => {
  const inp = document.getElementById(id);
  inp.step = "0.01";
});
  ['posX','posY','posZ'].forEach(id=>
    document.getElementById(id).addEventListener('change',updatePosition));
  ['rotX','rotY','rotZ'].forEach(id=>
    document.getElementById(id).addEventListener('change',updateRotation));
  ['scaleX','scaleY','scaleZ'].forEach(id=>
    document.getElementById(id).addEventListener('change',updateScale));

  document.getElementById('objectName').addEventListener('change',updateName);
  document.getElementById('materialColor').addEventListener('change',updateMaterialColor);
  document.getElementById('worldColor').addEventListener('change',updateWorldColor);
  document.querySelector('.controls-panels').addEventListener('scroll',handlePanelScroll);
  document.querySelector('#joystick-container').addEventListener('click', () => {
  movementMode = (movementMode === 'xz') ? 'y' : 'xz';
  // show/hide the correct axis helper
  if (axisModel)  axisModel.visible  = (movementMode === 'xz');
  if (yAxisModel) yAxisModel.visible = (movementMode === 'y');

});
});
// ───────────────────────────────────────────────
// Joystick UI Creation
// ───────────────────────────────────────────────
const joystickContainer = document.createElement('div');
joystickContainer.id = 'joystick-container';
joystickContainer.setAttribute('data-explanation','Use this to Move objects. Click for Up/Down!');
Object.assign(joystickContainer.style,{
    userSelect:'none',
  position: 'absolute', bottom:'30%', right:'10px',
  width:'150px', height:'150px',
  borderRadius:'50%', background:'rgba(0,0,0,0.3)',
  display:'none', touchAction:'none'
});
document.body.appendChild(joystickContainer);

const knob = document.createElement('div');
knob.id = 'joystick-knob';
Object.assign(knob.style,{
    userSelect:'none',
  position:'absolute', width:'50px', height:'50px',
  borderRadius:'50%', background:'rgba(255,255,255,0.6)',
  left:'50%', top:'50%', transform:'translate(-50%,-50%)'
});
joystickContainer.appendChild(knob);

let joyActive = false, joyPos = {x:0,y:0};

knob.addEventListener('pointerdown', e=>{ joyActive = true; });
document.addEventListener('pointerup', e=>{
  joyActive = false; joyPos = {x:0,y:0};
  knob.style.transform = 'translate(-50%,-50%)';
});
document.addEventListener('pointermove', e=>{
  if(!joyActive) return;
  const r = joystickContainer.getBoundingClientRect();
  const cx = r.left + r.width/2, cy = r.top + r.height/2;
  joyPos.x = (e.clientX - cx) / (r.width/2);
  joyPos.y = (e.clientY - cy)  / (r.height/2);
  const max = r.width/2 - 25;
  const dx = Math.max(-max,Math.min(max, joyPos.x * max));
  const dy = Math.max(-max,Math.min(max, joyPos.y * max));
  knob.style.transform = `translate(${dx}px,${dy}px)`;
});



// show/hide helpers
function showJoystick(){ joystickContainer.style.display = 'block'; }
function hideJoystick() {
  joystickContainer.style.display = 'none';
  if (axisModel) axisModel.visible = false;
}

// ───────────────────────────────────────────────
// Move the selected object every frame
// ───────────────────────────────────────────────
function updateJoystickMovement(){
  if(currentObject){
    const speed = 0.1;
    axisModel.position.copy(currentObject.position);
    yAxisModel.position.copy(currentObject.position);
    if (movementMode === 'xz') {
      // XZ‐plane movement
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
        
      const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();

      const move = forward.clone().multiplyScalar(-joyPos.y * speed)
                  .add(right.clone().multiplyScalar( joyPos.x * speed));

      currentObject.position.add(move);
      
        axisModel.visible=true;
        yAxisModel.visible=false;


    } else {
          axisModel.visible=false;
        yAxisModel.visible=true;
      // Y‐axis only movement
      currentObject.position.y -= joyPos.y * speed;
    }

    // Update the input fields every frame
    document.getElementById('posX').value = currentObject.position.x.toFixed(3);
    document.getElementById('posY').value = currentObject.position.y.toFixed(3);
    document.getElementById('posZ').value = currentObject.position.z.toFixed(3);
  }

  requestAnimationFrame(updateJoystickMovement);
}

updateJoystickMovement();
