
// prevent Ctrl+wheel zoom
document.addEventListener('wheel', e => {
  if (e.ctrlKey) {
    e.preventDefault();
  }
}, { passive: false });

// prevent Ctrl+Plus, Ctrl+Minus, Ctrl+0
document.addEventListener('keydown', e => {
  const zKeys = ['=', '+', '-', '_', '0'];
  if ((e.ctrlKey || e.metaKey) && zKeys.includes(e.key)) {
    e.preventDefault();
  }
});

// on iOS Safari you can also block gesture events
document.addEventListener('gesturestart', e => {
  e.preventDefault();
});