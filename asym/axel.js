// Axel Virtual Assistant v2.4 with custom styling & one-time pointing
let shadowOffsetFactor = [-90, -80];
let t = 0;
let aP =0;
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
    userSelect: 'none',
    display: 'block',
    pointerEvents: 'none',
    filter: 'dropShadow(30px 10px 3px RGBA(0,0,0,0.7))',
    zIndex: '6',
    transformOrigin: '40% 50%',
    transition: 'transform .1s ease',
  });
  axelContainer.appendChild(sprite);

  // --- 3. Speech bubble ---
  const bubble = document.createElement('div');
  Object.assign(bubble.style, {
    position: 'fixed',
    userSelect: 'none',
    pointerEvents: 'none',
    backdropFilter: 'blur(1px)',
    zIndex: '6',
    margin: 'auto',
    borderTop: '2px solid white',
    borderBottom: '2px solid darkgrey',
    borderLeft: '1px solid white',
    borderRight: '1px solid darkgrey',
    padding: '18px 18px 18px 18px',
    background: 'RGBA(255,255,255,0.4)',
    borderRadius: '8px',
    transform: 'scaleX(1) scaleY(1) translateX(-50%)',
    boxShadow: '10px 25px 3px rgba(0,0,0,0.3)',
    fontFamily: 'sans-serif',
    fontSize: '14px',
    display: 'none',
    maxWidth: '300px',
    textAlign: 'left'
  });
  axelContainer.appendChild(bubble);

  function say(text, duration = 2500) {
    aP=aP+1;
    bubble.textContent = text;
    bubble.innerHTML = bubble.textContent +
      '<button id="dismissAxel" style="color:yellow">Dismiss Axel</button>';
    bubble.style.display = 'flex';
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
    sprite.style.zIndex = '333';
    sprite.style.overflow = 'hidden';

    // position bubble according to your custom logic
    bubble.style.zIndex = '-1';
    bubble.style.top  = (y + 80) + 'px';
    bubble.style.left = '50%';//((x / 10) + (window.getBoundingClientRect.width / 2)) + 'px';

    // dynamic drop-shadow based on angle
    const shadowOffset = [
      (((angle / 360)) - 0.5) * shadowOffsetFactor[0],
      (((angle / 360)) - 0.5) * shadowOffsetFactor[1]
    ];
    sprite.style.filter = `drop-shadow(${shadowOffset[0]}px ${shadowOffset[1]}px 1px rgba(0,0,0,0.7))!important`;
  }
  

  // --- 5. Track which elements have been pointed at ---
  const pointed = new Set();

  function getNextElement() {
    const all = Array.from(document.body.querySelectorAll('[data-explanation]')).filter(el => {
      const s = getComputedStyle(el);
      return el.offsetWidth > 0 &&
             el.offsetHeight > 0 &&
             s.visibility !== 'hidden';
    });
    const avail = all.filter(el => !pointed.has(el));
    if (!avail.length) return null;
    const el = avail[Math.floor(Math.random() * avail.length)];
    pointed.add(el);
    return el;
  }

  // --- 6. Read explanation ---
  function explain(el) {
    return el.getAttribute('data-explanation');
  }

  // --- 7. Continuous follow loop ---
  (function followLoop() {
    if (currentTarget) pointTo(currentTarget);
    requestAnimationFrame(followLoop);
  })();
  // --- 8. 4-second cycle with highlight & one-time picks ---
  
  setInterval(() => {
    const el = getNextElement();
    if (!el) return;
    document.querySelectorAll('[data-explanation]').forEach(e =>
      e.classList.toggle('highlight', e === el)
    );
    console.log(aP);
    if (aP <1){
        say(explain(document.getElementById('logo')));
        pointTo(document.getElementById('logo'));
    }
    
    else {
        say(explain(el));
        pointTo(el);
    }
    
  }, 4000);
});

// update animation variable
setInterval(() => {
  t += 0.1;
  
}, 100);
