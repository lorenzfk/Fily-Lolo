// Axel Virtual Assistant v2.8 – now with Hugging Face chat integration
let shadowOffsetFactor = [-90, -80];
let t = 0, aP = 0;

// Tutorial / mode state
let isInTutorial = true;
let tutorialStep = 0;    // 0 = logo, 1 = initial elements
let dismissed = false;   // once true, Axel stops auto-explaining

// ── HUGGING FACE SETUP ────────────────────────────────────────────────
// Replace with your actual token
const HF_TOKEN = '';
// Model endpoint (you can swap to another HF model if you like)
const HF_MODEL = 'openai-community/gpt2';

// … your existing HF_TOKEN and HF_MODEL setup …

async function queryHF(prompt) {
  const url = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ inputs: prompt })
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('Hugging Face API error:', res.status, body);
    throw new Error(`Hugging Face API returned ${res.status}`);
  }

  const data = await res.json();
  if (Array.isArray(data) && data[0]?.generated_text) {
    return data[0].generated_text;
  }
  if (data.generated_text) {
    return data.generated_text;
  }
  console.error('Unexpected HF response format:', data);
  return '[no response]';
}


// ── MAIN SCRIPT ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // 1️⃣ Container
  const axelContainer = document.createElement('div');
  Object.assign(axelContainer.style, {
    position: 'fixed',
    left: '10px',
    top: (window.innerHeight - 120) + 'px',
    width: '100px',
    height: 'auto',
    zIndex: '99999',
    transition: 'left 1s ease, top 1s ease',
    pointerEvents: 'none' // container itself ignores events
  });
  document.body.appendChild(axelContainer);

  // 2️⃣ Sprite
  const sprite = document.createElement('img');
  sprite.src = 'axel-jump.gif';
  sprite.alt = 'Axel';
  Object.assign(sprite.style, {
    width: '100%',
    userSelect: 'none',
    display: 'block',
    pointerEvents: 'none',
    zIndex: '6',
    transformOrigin: '40% 50%',
    transition: 'transform .1s ease'
  });
  axelContainer.appendChild(sprite);

  // 3️⃣ Bubble
  const bubble = document.createElement('div');
  Object.assign(bubble.style, {
    position: 'fixed',
    userSelect: 'none',
    pointerEvents: 'none', // bubble itself ignores events; its buttons get clicks
    backdropFilter: 'blur(1px)',
    zIndex: '6',
    margin: 'auto',
    borderTop: '2px solid white',
    borderBottom: '2px solid darkgrey',
    borderLeft: '1px solid white',
    borderRight: '1px solid darkgrey',
    padding: '18px',
    background: 'rgba(255,255,255,0.4)',
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

  // — HELPERS —

  // permanently show chat input
  function showChatInput() {
    clearTimeout(bubble._timeout);
    bubble.style.pointerEvents = 'auto';
    bubble.innerHTML =
      '<input type="text" id="axelInput" placeholder="Ask me…" style="flex:1; margin-right:8px; pointer-events:all;">' +
      '<button id="axelSend" style="pointer-events:all;">Send</button>';
    bubble.style.display = 'flex';
  }

  // say & attach “Next” + “Dismiss” buttons
  function say(text, duration = 2500) {
    aP++;
    clearTimeout(bubble._timeout);
    bubble.style.pointerEvents = 'none';
    bubble.textContent = text;
    bubble.innerHTML = text +
      '<button id="axelNext" style="color:yellow; margin-left:8px; pointer-events:all;">Next</button>' +
      '<button id="dismissAxel" style="color:yellow; margin-left:4px; pointer-events:all;">Dismiss Axel</button>';
    bubble.style.display = 'flex';
    bubble._timeout = setTimeout(() => {
      // auto-hide only if not in chat-input mode
      if (!bubble.querySelector('#axelInput')) {
        bubble.style.display = 'none';
      }
    }, duration);
  }

  // compute & apply position, rotation, highlight, shadow
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

    axelContainer.style.left = x + 'px';
    axelContainer.style.top  = y + 'px';

    const cx = x + sprRect.width/2;
    const cy = y + sprRect.height/2;
    const angle = 90 + Math.atan2(ty - cy, tx - cx)*180/Math.PI;
    sprite.style.transform = `rotate(${angle}deg)`;

    // bubble placement
    bubble.style.top  = (y + 80) + 'px';
    bubble.style.left = '50%';

    // highlight target
    document.querySelectorAll('[data-explanation]').forEach(e =>
      e.classList.toggle('highlight', e === el)
    );

    // drop-shadow
    const sx = ((angle/360 - 0.5)*shadowOffsetFactor[0]).toFixed(1);
    const sy = ((angle/360 - 0.5)*shadowOffsetFactor[1]).toFixed(1);
    sprite.style.setProperty(
      'filter',
      `drop-shadow(${sx}px ${sy}px 1px rgba(0,0,0,0.7))`,
      'important'
    );
  }

  // retrieve all visible & unpointed explainables
  const pointed = new Set();
  function getAvailable() {
    return Array.from(document.querySelectorAll('[data-explanation]'))
      .filter(el => {
        const s = getComputedStyle(el);
        return el.offsetWidth>0 && el.offsetHeight>0 && s.visibility!=='hidden';
      })
      .filter(el => !pointed.has(el));
  }
  function explain(el) {
    return el.getAttribute('data-explanation');
  }

  // keep following currentTarget (for smooth scroll support)
  (function followLoop(){
    if (currentTarget) pointTo(currentTarget);
    requestAnimationFrame(followLoop);
  })();

  // 4️⃣ Main cycle every 4s
  const intervalId = setInterval(() => {
    if (dismissed) return;  // stop auto-explain forever

    if (isInTutorial) {
      if (tutorialStep === 0) {
        // step1: logo
        const logo = document.getElementById('logo');
        if (logo) {
          pointed.add(logo);
          say(explain(logo));
          pointTo(logo);
        }
        tutorialStep = 1;
        return;
      }
      if (tutorialStep === 1) {
        // step2: initial elements
        const avail = getAvailable();
        if (avail.length) {
          const el = avail[Math.floor(Math.random()*avail.length)];
          pointed.add(el);
          say(explain(el));
          pointTo(el);
          return;
        }
        // tutorial done → switch to chat
        isInTutorial = false;
        axelContainer.style.left = '10px';
        axelContainer.style.top  = (window.innerHeight - sprite.height - 20) + 'px';
        sprite.style.transform = 'rotate(0deg)';
        showChatInput();
        return;
      }
    } else {
      // chat mode auto-explain new ones
      const avail = getAvailable();
      if (avail.length) {
        const el = avail[0];
        pointed.add(el);
        say(explain(el));
        pointTo(el);
        return;
      }
      // no new: ensure chat positioning & rotation
      axelContainer.style.left = '10px';
      axelContainer.style.top  = (window.innerHeight - sprite.height - 20) + 'px';
      sprite.style.transform = 'rotate(0deg)';
      showChatInput();
    }
  }, 4000);

  // 5️⃣ Click handlers (async for HF)
  document.addEventListener('click', async e => {
    if (e.target.id === 'axelSend') {
      const input = document.getElementById('axelInput');
      const q = input?.value.trim();
      if (!q) return;
      // show thinking
      say('Let me think…', 10000);
      try {
        const answer = await queryHF(q);
        say(answer, 8000);
      } catch (err) {
        console.error(err);
        say('Oops, error. Please try again.', 4000);
      }
      input.value = '';
    }
    if (e.target.id === 'axelNext') {
      // manual next
      const avail = getAvailable();
      if (avail.length) {
        const el = avail[0];
        pointed.add(el);
        say(explain(el));
        pointTo(el);
      } else {
        // no more → return chat
        axelContainer.style.left = '10px';
        axelContainer.style.top  = (window.innerHeight - sprite.height - 20) + 'px';
        sprite.style.transform = 'rotate(0deg)';
        showChatInput();
      }
    }
    if (e.target.id === 'dismissAxel') {
      // stop auto-explain forever
      dismissed = true;
      isInTutorial = false;
      bubble.style.display = 'none';
      axelContainer.style.left = '10px';
      axelContainer.style.top  = (window.innerHeight - sprite.height - 20) + 'px';
      sprite.style.transform = 'rotate(0deg)';
      showChatInput();
    }
  });
});

// 6️⃣ Animation tick
setInterval(() => { t += 0.1; }, 100);
