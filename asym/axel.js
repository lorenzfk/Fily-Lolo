// Axel Virtual Assistant v2.1
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
    zIndex:'6',
    transformOrigin: 'center center',
    transition: 'transform 1s ease',
    filter:'drop-shadow(2px 10px 1px RGBA(0,0,0,0.7))'
  });
  axelContainer.appendChild(sprite);

  // --- 3. Speech bubble ---
  const bubble = document.createElement('div');
  Object.assign(bubble.style, {
    position: 'absolute',
    bottom: '110px',
    left: '0',
    transform: '',
    zIndex:'-2',
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

    // rotate sprite to face the element
    const cx = x + spriteRect.width  / 2;
    const cy = y + spriteRect.height / 2;
    const angle = 90+Math.atan2(ty - cy, tx - cx) * 180 / Math.PI;
    sprite.style.transform = `rotate(${angle}deg)`;
    bubble.style.top = sprite.style.top +'px';
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

  // 4-second loop
  setInterval(() => {
    
    const el = getRandomElement();
    if (!el) return;
    document.querySelectorAll('[data-explanation]').forEach(e =>
    e.classList.toggle('highlight', e === el)
    );
    say(explain(el));
    pointTo(el);
  }, 4000);
  // highlight only the current element


  // --- 7. Re-anchor on scroll/resize ---
  window.addEventListener('scroll', () => pointTo(currentTarget));
  window.addEventListener('resize', () => pointTo(currentTarget));
});
