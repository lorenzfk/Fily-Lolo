// Axel Virtual Assistant v2.9e – polls for new explainables while in tutorial/chat mode
let shadowOffsetFactor = [-90, -80];
let t = 0, aP = 0;

// Tutorial / mode state
let isInTutorial = true;    // controls both initial tutorial and live explain watching
let tutorialStep = 0;       // 0 = logo, 1 = initial elements, ≥2 = chat/live watch
let dismissed = false;      // once true, Axel stops all explaining
let awaitingNext = false;

// ── MAIN SCRIPT ───────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Container
  const axelContainer = document.createElement('div');
  Object.assign(axelContainer.style, {
    position: 'fixed',
    left: '10px',
    top: `${window.innerHeight - 120}px`,
    width: '100px',
    zIndex: '99999',
    transition: 'left 1s ease, top 1s ease',
    pointerEvents: 'none'
  });
  document.body.appendChild(axelContainer);

  // Sprite
  const sprite = document.createElement('img');
  sprite.src = 'axel-jump.gif';
  sprite.alt = 'Axel';
  Object.assign(sprite.style, {
    width: '100%',
    userSelect: 'none',
    pointerEvents: 'none',
    transformOrigin: '40% 50%',
    transition: 'transform .1s ease'
  });
  axelContainer.appendChild(sprite);

  // Bubble
  const bubble = document.createElement('div');
  Object.assign(bubble.style, {
    position: 'fixed',
    pointerEvents: 'none',
    backdropFilter: 'blur(1px)',
    zIndex: '6',
    padding: '18px',
    background: 'rgba(255,255,255,0.4)',
    borderRadius: '8px',
    transform: 'translateX(-50%)',
    boxShadow: '10px 25px 3px rgba(0,0,0,0.3)',
    fontFamily: 'sans-serif',
    fontSize: '14px',
    display: 'none',
    maxWidth: '300px',
    textAlign: 'left',
    marginTop:'80px'
  });
  axelContainer.appendChild(bubble);

  // state for tracking explained elements
  const pointed = new Set();

  function getAvailable() {
    return Array.from(document.querySelectorAll('[data-explanation]'))
      .filter(el => {
        const s = getComputedStyle(el);
        return el.offsetWidth > 0 && el.offsetHeight > 0 && s.visibility !== 'hidden';
      })
      .filter(el => !pointed.has(el));
  }
  function explain(el) {
    return el.getAttribute('data-explanation');
  }

  // Show chat input and reposition to #axelChill if present
  function showChatInput() {
    clearTimeout(bubble._timeout);
    const chill = document.getElementById('axelChill');
    if (chill) pointTo(chill);

    bubble.style.pointerEvents = 'auto';
    bubble.innerHTML =
      '<input type="text" id="axelInput" placeholder="Ask axel…" style="flex:1;margin-right:8px;pointer-events:all;">' +
      '<button id="axelSend" style="pointer-events:all;">Send</button>';
    bubble.style.display = 'flex';
  }

  // Say text with Next + Dismiss
  function say(text) {
    aP++;
    bubble.style.pointerEvents = 'none';
    bubble.innerHTML = text +
      '<button id="axelNext" style="color:yellow;margin-left:8px;pointer-events:all;">Next</button>' +
      '<button id="dismissAxel" style="color:yellow;margin-left:4px;pointer-events:all;">Dismiss Axel</button>';
    bubble.style.display = 'flex';
    awaitingNext = true;
  }

  let currentTarget = null;
  function pointTo(el) {
    if (!el) return;
    currentTarget = el;

    const rect = el.getBoundingClientRect();
    const sprRect = axelContainer.getBoundingClientRect();
    const tx = rect.left + rect.width/2;
    const ty = rect.top + rect.height/2;

    let x = rect.left - sprRect.width - 20;
    let y = rect.top + (rect.height - sprRect.height)/2;
    x = Math.max(0, Math.min(x, window.innerWidth - sprRect.width));
    y = Math.max(0, Math.min(y, window.innerHeight - sprRect.height));

    axelContainer.style.left = `${x}px`;
    axelContainer.style.top  = `${y}px`;

    const cx = x + sprRect.width/2;
    const cy = y + sprRect.height/2;
    const angle = 90 + Math.atan2(ty - cy, tx - cx)*180/Math.PI;
    sprite.style.transform = `rotate(${angle}deg)`;

    bubble.style.top  = `${y }px`;
    bubble.style.left = '50%';

    document.querySelectorAll('[data-explanation]').forEach(e =>
      e.classList.toggle('highlight', e === el)
    );

    const sx = ((angle/360 - 0.5)*shadowOffsetFactor[0]).toFixed(1);
    const sy = ((angle/360 - 0.5)*shadowOffsetFactor[1]).toFixed(1);
    sprite.style.setProperty(
      'filter',
      `drop-shadow(${sx}px ${sy}px 1px rgba(0,0,0,0.7))`,
      'important'
    );
  }

  // Advance logic: tutorial and live-watching
  function advance() {
    if (dismissed) return;
    awaitingNext = false;

    // Tutorial initial steps
    if (isInTutorial && tutorialStep === 0) {
      const logo = document.getElementById('logo');
      if (logo) {
        pointed.add(logo);
        say(explain(logo));
        pointTo(logo);
      }
      tutorialStep = 1;
      return;
    }
    if (isInTutorial && tutorialStep === 1) {
      const avail = getAvailable();
      if (avail.length) {
        const el = avail[Math.floor(Math.random()*avail.length)];
        pointed.add(el);
        say(explain(el));
        pointTo(el);
        return;
      }
      // initial tutorial done; move to chat posture but stay in live-watch mode
      tutorialStep = 2;
      axelContainer.style.left = '10px';
      axelContainer.style.top  = `${window.innerHeight - sprite.height - 20}px`;
      sprite.style.transform = 'rotate(0deg)';
      showChatInput();
      return;
    }

    // Live-watch (tutorialStep >= 2 && isInTutorial)
    if (isInTutorial && tutorialStep >= 2) {
      const avail = getAvailable();
      if (avail.length) {
        const el = avail[0];
        pointed.add(el);
        say(explain(el));
        pointTo(el);
        return;
      }
      // no new explainables → stay in chat posture
      axelContainer.style.left = '10px';
      axelContainer.style.top  = `${window.innerHeight - sprite.height - 20}px`;
      sprite.style.transform = 'rotate(0deg)';
      showChatInput();
      return;
    }
  }

  // Kick off first step
  advance();

  // Periodically check for new explainables while in live-watch
  setInterval(() => {
    if (isInTutorial && tutorialStep >= 2 && !awaitingNext && !dismissed) {
      const avail = getAvailable();
      if (avail.length) advance();
    }
  }, 2000);

  // Follow loop for scroll/resize
  (function followLoop(){
    if (currentTarget) pointTo(currentTarget);
    requestAnimationFrame(followLoop);
  })();

  // Click handlers
  document.addEventListener('click', e => {
    if (awaitingNext && e.target === currentTarget) {
      advance();
    }
    if (awaitingNext && e.target.id === 'axelNext') {
      advance();
    }
    if (e.target.id === 'dismissAxel') {
      dismissed = true;
      isInTutorial = false;
      bubble.style.display = 'none';
      axelContainer.style.left = '10px';
      axelContainer.style.top  = `${window.innerHeight - sprite.height - 20}px`;
      sprite.style.transform = 'rotate(0deg)';
      showChatInput();
    }
    if (e.target.id === 'axelSend') {
      const input = document.getElementById('axelInput');
      const q = input?.value.trim();
      if (q) {

        say(`You asked: "${q}" but since my amazing AI capabilities have not been implemented yet, i cannot answer anything of value. `);
        input.value = '';
      }
    }
  });
});

// Animation tick
setInterval(() => { t += 0.1; }, 100);
