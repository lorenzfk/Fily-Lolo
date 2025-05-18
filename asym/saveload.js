// Function to save the scene
function saveScene() {
  const sceneJson = scene.toJSON();

  // Ensure that sceneJson.children exists and is an array
  if (sceneJson.children && Array.isArray(sceneJson.children)) {
    // Filter out objects named 'axis' from the scene before saving
    sceneJson.children = sceneJson.children.filter(child => child.name !== 'axis');
  }

  const blob = new Blob([JSON.stringify(sceneJson)], { type: 'application/json' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'untitled.space';
  link.click();
}


// Function to trigger the file input
function triggerFileInput() {
  document.getElementById('sceneFileInput').click();
}

// Event listener for file input
document.getElementById('sceneFileInput').addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (file) {
    document.getElementById('loadButton').style.display = 'block';  // Show load button
    document.getElementById('loadButton').classList.add('highlight');  // Show load button
  } else {
    document.getElementById('sceneFileInput').style.opacity = '1.0';  
    document.getElementById('loadButton').style.display = 'none';  // Hide load button if no file is selected
  }
});
