// Axel Virtual Assistant v2.2
let shadowOffsetFactor = [30,30];
let t =0;
document.addEventListener('DOMContentLoaded', () => {
  // --- 1. Create Axel container ---
  const axelContainer = document.createElement('div');
  Object.assign(axelContainer.style, {
    position: 'fixed',
    left: '10px',
    top: (window.innerHeight - 120) + 'px',
    width: '100px',
    height: 'auto',
    zIndex: '99999',
    transition: 'left 1s ease, top 1s ease'
  });
  document.body.appendChild(axelContainer);

  // --- 2. Sprite ---
  const sprite = document.createElement('img');
  sprite.src = 'axel-jump.gif';
  sprite.alt = 'Axel';
  Object.assign(sprite.style, {
    width: '100%',
    display: 'block',
    zIndex: '6',
    transformOrigin: 'center center',
    transition: 'transform .1s ease',
  });
  axelContainer.appendChild(sprite);

  // --- 3. Speech bubble ---
  const bubble = document.createElement('div');
  Object.assign(bubble.style, {
    position: 'absolute',
    bottom: '110px',
    left: '0',
    zIndex: '6',
    margin: 'auto',
    padding: '8px 12px',
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
    fontFamily: 'sans-serif',
    fontSize: '14px',
    display: 'none',
    minWidth: '300px',
    textAlign: 'left'
  });
  axelContainer.appendChild(bubble);

  function say(text, duration = 2500) {
    bubble.textContent = text;
    bubble.style.display = 'block';
    clearTimeout(bubble._timeout);
    bubble._timeout = setTimeout(() => {
      bubble.style.display = 'none';
    }, duration);
  }

  // --- 4. Pointing logic ---
  let currentTarget = null;
  function pointTo(el) {
    if (!el) return;
    currentTarget = el;

    const rect = el.getBoundingClientRect();
    const spriteRect = axelContainer.getBoundingClientRect();

    // target center in viewport coords
    const tx = rect.left + rect.width / 2;
    const ty = rect.top + rect.height / 2;

    // position Axel just to the left of the element
    let x = rect.left - spriteRect.width - 20;
    let y = rect.top + (rect.height - spriteRect.height) / 2;

    // clamp to viewport
    x = Math.max(0, Math.min(x, window.innerWidth - spriteRect.width));
    y = Math.max(0, Math.min(y, window.innerHeight - spriteRect.height));

    axelContainer.style.left = x + 'px';
    axelContainer.style.top  = y + 'px';

    // rotate sprite to face the element (+90° to align correctly)
    const cx = x + spriteRect.width / 2;
    const cy = y + spriteRect.height / 2;
    const angle = 90 + Math.atan2(ty - cy, tx - cx) * 180 / Math.PI;
    sprite.style.transform = `rotate(${angle}deg)`;
    sprite.style.zIndex='333';
    sprite.style.overflow='hidden';
    bubble.style.zIndex='-1';
    const shadowOffset = [(((angle / 360)*2)+0.5)*shadowOffsetFactor[0],(((angle / 360)*2)+0.5)*shadowOffsetFactor[1]];
    sprite.style.filter = 'drop-shadow(' + shadowOffset[0] + 'px ' + shadowOffset[1] +'px '+'1px rgba(0,0,0,0.7))';
  }

  // --- 5. Only pick elements with data-explanation ---
  function getRandomElement() {
    const all = Array.from(document.body.querySelectorAll('[data-explanation]')).filter(el => {
      const s = getComputedStyle(el);
      return el.offsetWidth > 0 &&
             el.offsetHeight > 0 &&
             s.visibility !== 'hidden';
    });
    return all.length ? all[Math.floor(Math.random() * all.length)] : null;
  }

  // --- 6. Use data-explanation for speech ---
  function explain(el) {
    return el.getAttribute('data-explanation');
  }

  // --- 7. Continuous follow loop ---
  function followLoop() {
    if (currentTarget) {
      pointTo(currentTarget);
    }
    requestAnimationFrame(followLoop);
  }
  followLoop();

  // --- 8. 4-second cycle with highlight toggle ---
  setInterval(() => {
    const el = getRandomElement();
    if (!el) return;
    // highlight current
    document.querySelectorAll('[data-explanation]').forEach(e =>
      e.classList.toggle('highlight', e === el)
    );
    say(explain(el));
    pointTo(el);
  }, 4000);
});
setInterval(() => {
    t+=0.1;
    //shadowOffsetFactor[0] = (Math.sin(t)+1)*20;
     }, 100);
