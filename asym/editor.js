let scene, camera, renderer, ambientLight, directionalLight;
let currentObject = null;
let objectList = [];
let objectCounter = 1;  // Counter to name objects sequentially

// Helper function to generate a random color
function getRandomColor() {
  const randomColor = Math.floor(Math.random() * 16777215).toString(16);
  return `#${randomColor.padStart(6, '0')}`; // Ensure 6-digit color
}
const g_texture = (src, repeat = 10) => {
  const path = `https://as2.ftcdn.net/v2/jpg/02/57/17/65/1000_F_257176513_GfJoMbU5RrRZoXDgs8pajKzOOpRv7K7E.jpg`;
  const preload = new THREE.TextureLoader().load(
    path ? path : Template,
    (e) => {
      e.mapping = THREE.EquirectangularRefractionMapping;
      e.anisotropy = renderer.capabilities.getMaxAnisotropy();
      e.magFilter = THREE.NearestFilter;
      e.minFilter = THREE.LinearMipmapLinearFilter;
      e.wrapS = e.wrapT = THREE.MirroredRepeatWrapping;
      e.type = THREE.HalfFloatType;
      e.format = THREE.RGBAFormat;
      e.repeat.set(0.9, 0.9);
      e.dispose();
    }
  );
  return preload;
};
// Initialize the scene
function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer();
  const sceneViewer = document.getElementById('sceneViewer');
  renderer.setSize(sceneViewer.clientWidth, sceneViewer.clientHeight);  // Ensure the canvas matches the viewport size
  sceneViewer.appendChild(renderer.domElement);

  // Set the initial background color to blue
  scene.background = new THREE.Color('#008080'); // Blue background

  // Add a big white wireframe box
  const wireframeGeometry = new THREE.BoxGeometry(10, 10, 10);
  const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
  const wireframeBox = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
  scene.add(wireframeBox);

  // Set the camera position
  camera.position.z = 15;

  // Add ambient light
  ambientLight = new THREE.AmbientLight('#008080F', 0.5); // Ambient light
  scene.add(ambientLight);

  // Add directional light (simulating sunlight)
  directionalLight = new THREE.DirectionalLight(0xffffff, 1); // White sunlight
  directionalLight.position.set(10, 10, 10).normalize();
  scene.add(directionalLight);
  function createWaterSurface() {
  // Load the textures
  const textureLoader = new THREE.TextureLoader();

  // Base texture (water surface)
  const baseTexture = textureLoader.load('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2iDkUZqrSe2Aaktm4UgkaR6FHZyoMVUz8uw&s'); // Ensure this path is correct
  baseTexture.wrapS = baseTexture.wrapT = THREE.RepeatWrapping; // Ensure the texture repeats

  // Normal map texture (to simulate waves)
  const normalMap = textureLoader.load('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2iDkUZqrSe2Aaktm4UgkaR6FHZyoMVUz8uw&s'); // Normal map for the water
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping; // Ensure the normal map repeats

  // Set the repeat factor for both the base texture and normal map
  baseTexture.repeat.set(40, 40);  // Repeat the base texture 40 times (both horizontally and vertically)
  normalMap.repeat.set(40, 40);  // Repeat the normal map 40 times

  // Create a large plane geometry at the bottom of the scene
  const geometry = new THREE.PlaneGeometry(100, 100, 1, 1);  // Large plane, you can adjust the size

  // Create the material with the texture and normal map
  const material = new THREE.MeshPhysicalMaterial({
    map: baseTexture,  // Apply the base texture
    normalMap: normalMap,  // Apply the normal map for waves
    metalness: 1,  // High metallic value for water-like effect
    roughness: 0.1,  // Low roughness for a shiny water effect
    envMap: g_texture(),  // Environment map (could be used for reflections)
    envMapIntensity: 1.5,  // Set the intensity for environment map reflections
  });

  // Create the plane mesh
  const waterSurface = new THREE.Mesh(geometry, material);

  // Position the plane at the bottom of the scene
  waterSurface.rotation.x = THREE.MathUtils.degToRad(-87);  // Rotate the plane to be horizontal
  waterSurface.position.y = -7;  // Position it slightly below the camera view

  // Add the water surface to the scene
  scene.add(waterSurface);

  // Animate the normal map scrolling in two directions (to simulate water movement)
  const scrollSpeedX = 0.0001; // Set constant scroll speed for X direction
  const scrollSpeedY = 0.00005; // Set constant scroll speed for Y direction
  let offsetX = 0, offsetY = 0;

  function animateWater() {
    offsetX += scrollSpeedX;  // Increment X offset by a constant value
    offsetY += scrollSpeedY;  // Increment Y offset by a constant value

    // Update the UVs for the normal map to create scrolling effect
    const uvs = geometry.attributes.uv.array; // Access the UVs of the plane geometry

    // Loop through the UV array and update the coordinates for scrolling
    for (let i = 0; i < uvs.length; i += 2) {
      uvs[i] += scrollSpeedX;   // Update the u component (horizontal scrolling)
      uvs[i + 1] += scrollSpeedY; // Update the v component (vertical scrolling)
    }

    geometry.attributes.uv.needsUpdate = true; // Inform Three.js that the UVs have changed

    requestAnimationFrame(animateWater);  // Keep animating the texture
  }

  animateWater();  // Start the animation loop for the normal map scrolling
}


  // Call the function to create the water surface
  createWaterSurface();
  animate();

  // Minimize all panels except the "Add" panel by default
  document.querySelectorAll('.smol').forEach(panel => {
    const button = panel.querySelector('img');  // Get the image inside the panel
    const content = panel.querySelector('.panel-content');
    content.style.display = 'none';  // Hide the content
    button.src = 'eye-closed.png';  // Set the button image to "closed"
  });
}
// Load textures and set up the water surface



// Function to add/remove class when the user scrolls
function handlePanelScroll() {
  const controlsPanels = document.querySelector('.controls-panels');

  // Add class when scrolled down a bit
  if (controlsPanels.scrollTop > 20) {  // Adjust the '20' value based on how far you want to scroll before adding the class
    controlsPanels.classList.add('cBig');
  } else {
    controlsPanels.classList.remove('cBig');
  }
}

// Add the event listener for scroll
document.querySelector('.controls-panels').addEventListener('scroll', handlePanelScroll);

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// Function to toggle panels (hide/show the content)
function togglePanel(panelId) {
  const panel = document.getElementById(panelId);
  const button = panel.querySelector('img');  // Get the image inside the panel
  const content = panel.querySelector('.panel-content');  // Get the content of the panel

  // Toggle the visibility of the content
  if (content.style.display === "none") {
    content.style.display = "block";  // Show content
    button.src = 'eye-open.png';  // Change button image to "open"
  } else {
    content.style.display = "none";  // Hide content
    button.src = 'eye-closed.png';  // Change button image to "closed"
  }
}

// Show the properties panel
function showPanel(panelId) {
  const panel = document.getElementById(panelId);
  const button = panel.querySelector('img');  // Get the image inside the panel
  const content = panel.querySelector('.panel-content');  // Get the content of the panel

  content.style.display = "block";  // Show content
  button.src = 'eye-open.png';  // Change button image to "open"
}

// Add Cube to the scene
function createCube() {
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  const name = `#${objectCounter++} Cube`;
  cube.name = name;
  addToOutliner(cube);
  selectObjectFromOutliner(cube);  // Automatically select the new object
}

// Add Sphere to the scene with random color
function createSphere() {
  const geometry = new THREE.SphereGeometry(1, 32, 32);
  const randomColor = getRandomColor();
  const material = new THREE.MeshBasicMaterial({ color: randomColor });
  const sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);
  const name = `#${objectCounter++} Sphere`;
  sphere.name = name;
  addToOutliner(sphere);
  selectObjectFromOutliner(sphere);  // Automatically select the new object
}

// Add Image to the scene as a plane
function createImage() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const texture = new THREE.Texture(img);
        texture.needsUpdate = true;

        // Create a plane with the same aspect ratio as the image
        const aspectRatio = img.width / img.height;
        const width = 5; // Set plane width (arbitrary size)
        const height = width / aspectRatio; // Calculate height based on aspect ratio
        const geometry = new THREE.PlaneGeometry(width, height);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true, // Allow transparency if image has alpha channel
          opacity: 1.0
        });

        const plane = new THREE.Mesh(geometry, material);
        scene.add(plane);
        const name = `#${objectCounter++} Image`;
        plane.name = name;
        addToOutliner(plane);
        selectObjectFromOutliner(plane);  // Automatically select the new object
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

// Show file input for 3D Model upload
function showGLTFInput() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.gltf,.glb';
  input.onchange = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      const loader = new THREE.GLTFLoader();
      const arrayBuffer = e.target.result;
      loader.parse(arrayBuffer, '', function(gltf) {
        const model = gltf.scene;
        scene.add(model);
        const name = `#${objectCounter++} Model`;
        model.name = name;
        addToOutliner(model);
        selectObjectFromOutliner(model);  // Automatically select the new object
      });
    };
    reader.readAsArrayBuffer(file);
  };
  input.click();
}

// Add the object to the outliner
// Function to handle Outliner item selection
function selectObjectFromOutliner(object) {
  // Remove the "smol" class from the properties panel when an object is selected from the outliner
  document.getElementById('propertiesPanel').classList.remove('smol');
  showPanel('propertiesPanel');

  // Update the selected object in the properties panel
  currentObject = object;
  document.getElementById('objectName').value = object.name;
  document.getElementById('posX').value = object.position.x.toFixed(3);
  document.getElementById('posY').value = object.position.y.toFixed(3);
  document.getElementById('posZ').value = object.position.z.toFixed(3);
  document.getElementById('rotX').value = THREE.MathUtils.radToDeg(object.rotation.x).toFixed(3);
  document.getElementById('rotY').value = THREE.MathUtils.radToDeg(object.rotation.y).toFixed(3);
  document.getElementById('rotZ').value = THREE.MathUtils.radToDeg(object.rotation.z).toFixed(3);
  document.getElementById('scaleX').value = object.scale.x.toFixed(3);
  document.getElementById('scaleY').value = object.scale.y.toFixed(3);
  document.getElementById('scaleZ').value = object.scale.z.toFixed(3);
  document.getElementById('materialColor').value = rgbToHex(object.material ? object.material.color : new THREE.Color(1, 1, 1));

  // Mark the selected object in the outliner and reset the color of others
  const listItems = document.getElementById('outlinerList').children;

  Array.from(listItems).forEach(item => {
    // Reset all items to white
    item.style.textDecoration = 'none';
  });

  // Find the selected item in the list and highlight it in red
  const selectedItem = Array.from(listItems).find(item => (item.textContent- "") === object.name);
  if (selectedItem) {
    item.style.background = 'blue!important'; // Set selected item to red
  }
}

// Function to add the object to the outliner
function addToOutliner(object) {
  objectList.push(object);
  const li = document.createElement('li');
  li.textContent = object.name;
  li.onclick = function() {
    selectObjectFromOutliner(object); // Call selectObjectFromOutliner when an item is clicked
  };
  document.getElementById('outlinerList').appendChild(li);
}

// Convert RGB to Hex color code
function rgbToHex(color) {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

// Update the world background color (for World panel)
function updateWorldColor(event) {
  const color = event.target.value;
  scene.background = new THREE.Color(color);
  ambientLight.color.set(color);
}

// Disable text selection globally (except inputs)
document.body.style.userSelect = 'none';
document.querySelectorAll('input').forEach(input => {
  input.style.userSelect = 'text';  // Allow text selection inside input fields
});

// Apply the changes to the object
function updatePosition() {
  if (currentObject) {
    currentObject.position.set(
      parseFloat(document.getElementById('posX').value),
      parseFloat(document.getElementById('posY').value),
      parseFloat(document.getElementById('posZ').value)
    );
  }
}

// Function to update the name of the selected object
function updateName() {
  if (currentObject) {
    // Get the new name from the input field
    const newName = document.getElementById('objectName').value;

    // Update the name of the object in the scene


    // Update the name in the Outliner (list)
    const listItems = document.getElementById('outlinerList').children;

    // Loop through all list items in the Outliner
    Array.from(listItems).forEach(item => {
      // If the item text matches the current object's name, update it with the new name
      if (item.textContent === currentObject.name) {
        item.textContent = newName;  // Update the list item text
      }
    });
    currentObject.name = newName;
  }
}

function updateRotation() {
  if (currentObject) {
    currentObject.rotation.set(
      THREE.MathUtils.degToRad(parseFloat(document.getElementById('rotX').value)),
      THREE.MathUtils.degToRad(parseFloat(document.getElementById('rotY').value)),
      THREE.MathUtils.degToRad(parseFloat(document.getElementById('rotZ').value))
    );
  }
}

function updateScale() {
  if (currentObject) {
    currentObject.scale.set(
      parseFloat(document.getElementById('scaleX').value),
      parseFloat(document.getElementById('scaleY').value),
      parseFloat(document.getElementById('scaleZ').value)
    );
  }
}

function updateMaterialColor() {
  if (currentObject && currentObject.material) {
    currentObject.material.color.set(document.getElementById('materialColor').value);
  }
}

// Resize the Three.js canvas when the window is resized
window.addEventListener('resize', () => {
  const sceneViewer = document.getElementById('sceneViewer');
  renderer.setSize(sceneViewer.clientWidth, sceneViewer.clientHeight);
  camera.aspect = sceneViewer.clientWidth / sceneViewer.clientHeight;
  camera.updateProjectionMatrix();
});

// Start the editor
init();
