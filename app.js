/* ==========================================================================
   AMBIENT FLUTE SYNTHESIZER (WEB AUDIO API)
   ========================================================================== */
class FluteSynthesizer {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.noteTimer = null;
    
    // Raag Bhupali (Pentatonic scale: C4, D4, E4, G4, A4, C5, D5, E5)
    // Frequencies in Hz
    this.scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
    
    // Traditional peaceful Indian melody notes (indices from the scale)
    this.melody = [
      0, 1, 2, 3, 4, 3, 2, 1, 
      0, 2, 4, 5, 4, 2, 3, 2,
      5, 7, 5, 4, 3, 4, 2, 1,
      0, 3, 2, 4, 3, 1, 0, 0
    ];
    this.melodyIndex = 0;
  }

  init() {
    if (this.audioCtx) return;
    
    // Create audio context
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContextClass();
    
    // Setup master volume and reverb delay
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.setValueAtTime(0.18, this.audioCtx.currentTime); // Low background volume
    
    // Delay (Echo) effect
    this.delayNode = this.audioCtx.createDelay(1.0);
    this.delayNode.delayTime.setValueAtTime(0.6, this.audioCtx.currentTime);
    
    this.delayFeedback = this.audioCtx.createGain();
    this.delayFeedback.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
    
    // Low pass filter to make the synthesizer sound warm and mellow
    this.filterNode = this.audioCtx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(1200, this.audioCtx.currentTime);
    
    // Connect nodes: Synth -> Filter -> Delay -> Feedback Loop -> Master -> Destination
    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode); // feedback loop
    
    this.filterNode.connect(this.masterGain);
    this.delayNode.connect(this.masterGain);
    
    this.masterGain.connect(this.audioCtx.destination);
  }

  playNote(frequency) {
    if (!this.audioCtx || this.audioCtx.state === 'suspended') return;

    const osc = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    const noteGain = this.audioCtx.createGain();
    
    // Main tone (Triangle wave has a soft, flute-like tone)
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
    
    // Second oscillator (Sine wave at double frequency for pure octave breathiness)
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency * 2, this.audioCtx.currentTime);
    
    // Vibrato effect (soft frequency modulation)
    const vibrato = this.audioCtx.createOscillator();
    const vibratoGain = this.audioCtx.createGain();
    vibrato.frequency.value = 5.5; // 5.5 Hz vibrato speed
    vibratoGain.gain.value = 1.8; // vibrato depth in Hz
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);
    vibratoGain.connect(osc2.frequency);
    
    // Connect osc to noteGain
    osc.connect(noteGain);
    // Mix second oscillator at lower volume for high breathy undertone
    const osc2Gain = this.audioCtx.createGain();
    osc2Gain.gain.value = 0.25;
    osc2.connect(osc2Gain);
    osc2Gain.connect(noteGain);
    
    // Connect note to filter and delay
    noteGain.connect(this.filterNode);
    noteGain.connect(this.delayNode);
    
    // Envelope (soft attack and long release for a shehnai/flute swell)
    const now = this.audioCtx.currentTime;
    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(0.6, now + 0.25); // Attack
    noteGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2); // Decay/Release
    
    // Start and stop
    osc.start(now);
    osc2.start(now);
    vibrato.start(now);
    
    osc.stop(now + 2.3);
    osc2.stop(now + 2.3);
    vibrato.stop(now + 2.3);
  }

  startMelodyLoop() {
    const playNext = () => {
      if (!this.isPlaying) return;
      
      const scaleIndex = this.melody[this.melodyIndex];
      const freq = this.scale[scaleIndex];
      
      this.playNote(freq);
      
      // Move to next note
      this.melodyIndex = (this.melodyIndex + 1) % this.melody.length;
      
      // Schedule next note in 1.4 seconds
      this.noteTimer = setTimeout(playNext, 1400);
    };
    
    playNext();
  }

  toggle() {
    this.init();
    
    if (this.isPlaying) {
      // Pause
      this.isPlaying = false;
      clearTimeout(this.noteTimer);
      if (this.audioCtx.state === 'running') {
        this.audioCtx.suspend();
      }
    } else {
      // Play
      this.isPlaying = true;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      this.startMelodyLoop();
    }
    return this.isPlaying;
  }
}

const synth = new FluteSynthesizer();

// Hook up the audio toggle button
const audioBtn = document.getElementById('audio-toggle');
if (audioBtn) {
  audioBtn.addEventListener('click', () => {
    const isPlaying = synth.toggle();
    if (isPlaying) {
      audioBtn.classList.add('playing');
      audioBtn.querySelector('.music-text').textContent = 'Pause Flute';
    } else {
      audioBtn.classList.remove('playing');
      audioBtn.querySelector('.music-text').textContent = 'Play Flute';
    }
  });
}


/* ==========================================================================
   DYNAMIC FLOATING MARIGOLD PETALS
   ========================================================================== */
function createMarigoldCanvas() {
  const canvas = document.getElementById('marigold-canvas');
  if (!canvas) return;

  const maxPetals = 22;
  
  // Spawn a single petal
  const spawnPetal = () => {
    if (canvas.children.length >= maxPetals) return;

    const petal = document.createElement('div');
    petal.classList.add('marigold-petal');

    // Randomized values for visual elegance
    const size = Math.random() * 10 + 8; // 8px to 18px size
    const left = Math.random() * 100; // 0% to 100% width
    const duration = Math.random() * 8 + 6; // 6s to 14s fall time
    const rotationStart = Math.random() * 360; 
    const delay = Math.random() * 2;

    petal.style.width = `${size}px`;
    petal.style.height = `${size}px`;
    petal.style.left = `${left}%`;
    petal.style.animationDuration = `${duration}s`;
    petal.style.animationDelay = `${delay}s`;
    petal.style.transform = `rotate(${rotationStart}deg)`;
    
    // Randomized golden/orange marigold hues
    const hues = [
      'radial-gradient(circle, #FFA500 20%, #FF8C00 100%)', // Orange-Gold
      'radial-gradient(circle, #FFB300 20%, #FF8C00 100%)', // Warm Yellow
      'radial-gradient(circle, #E65100 20%, #DD2C00 100%)'  // Deep Red-Orange
    ];
    petal.style.background = hues[Math.floor(Math.random() * hues.length)];

    canvas.appendChild(petal);

    // Remove when animation finishes to clean up DOM
    setTimeout(() => {
      petal.remove();
    }, (duration + delay) * 1000);
  };

  // Pre-populate some petals on load
  for (let i = 0; i < 10; i++) {
    setTimeout(spawnPetal, Math.random() * 3000);
  }

  // Continuously spawn petals
  setInterval(spawnPetal, 700);
}


/* ==========================================================================
   COUNTDOWN TIMER (TARGET: 6 JULY 2026 18:30 IST)
   ========================================================================== */
function runCountdown() {
  const targetDate = new Date("2026-07-06T18:30:00+05:30").getTime();
  
  const dEl = document.getElementById('days');
  const hEl = document.getElementById('hours');
  const mEl = document.getElementById('minutes');
  const sEl = document.getElementById('seconds');
  
  if (!dEl) return;

  const update = () => {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      dEl.textContent = "00";
      hEl.textContent = "00";
      mEl.textContent = "00";
      sEl.textContent = "00";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    dEl.textContent = days.toString().padStart(2, '0');
    hEl.textContent = hours.toString().padStart(2, '0');
    mEl.textContent = minutes.toString().padStart(2, '0');
    sEl.textContent = seconds.toString().padStart(2, '0');
  };

  update();
  setInterval(update, 1000);
}


/* ==========================================================================
   RSVP & BLESSINGS WALL SYSTEM (LOCAL STORAGE)
   ========================================================================== */
const SEED_BLESSINGS = [
  {
    name: "Sri Mayadhar Samal & Smt Diptimayee Samal",
    status: "attending",
    message: "May Lord Jagannath guide your steps together as you embark on this beautiful adventure of life. Welcome to the family, son!"
  },
  {
    name: "Swagatika Samal",
    status: "remote",
    message: "Sending all our love and blessings from Seattle. May your bond grow stronger with each passing day. Super excited for both of you!"
  },
  {
    name: "Rashmi & Priyabrata Bal",
    status: "attending",
    message: "Wishing you both a wonderful journey ahead filled with happiness and laughter. Can't wait to celebrate with you in Jajpur!"
  }
];

function initBlessingsWall() {
  const wall = document.getElementById('blessings-wall');
  const form = document.getElementById('rsvp-form');
  if (!wall || !form) return;

  // Load from local storage, fallback to seeds
  let blessings = JSON.parse(localStorage.getItem('wedding_blessings'));
  if (!blessings || blessings.length === 0) {
    blessings = SEED_BLESSINGS;
    localStorage.setItem('wedding_blessings', JSON.stringify(blessings));
  }

  // Render blessings
  const renderBlessings = () => {
    wall.innerHTML = '';
    
    // Display in reverse order (newest first)
    blessings.slice().reverse().forEach(b => {
      const card = document.createElement('div');
      card.classList.add('blessing-card');
      
      const statusText = b.status === 'attending' ? 'Attending' : 'Sending Wishes';
      
      card.innerHTML = `
        <p class="blessing-text">"${escapeHTML(b.message)}"</p>
        <div class="blessing-author-row">
          <span class="blessing-author">${escapeHTML(b.name)}</span>
          <span class="blessing-status-pill ${b.status}">${statusText}</span>
        </div>
      `;
      wall.appendChild(card);
    });
  };

  // Form submission handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('guest-name');
    const statusInput = document.querySelector('input[name="attendance"]:checked');
    const messageInput = document.getElementById('guest-blessing');

    if (!nameInput.value.trim() || !messageInput.value.trim()) return;

    const newBlessing = {
      name: nameInput.value.trim(),
      status: statusInput.value,
      message: messageInput.value.trim()
    };

    // Save to list & local storage
    blessings.push(newBlessing);
    localStorage.setItem('wedding_blessings', JSON.stringify(blessings));

    // Rerender list & reset form
    renderBlessings();
    form.reset();

    // Show a subtle thank you alert
    alert(`Thank you, ${newBlessing.name}! Your blessings have been posted to the wall.`);
  });

  renderBlessings();
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}


/* ==========================================================================
   ADD TO CALENDAR SYSTEM
   ========================================================================== */
function initCalendarButtons() {
  const buttons = document.querySelectorAll('.add-to-calendar');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-event');
      let title = "";
      let dates = "";
      let details = "";
      let location = "";

      if (type === 'wedding') {
        title = "Wedding: Madhusmita weds Baijayanta";
        // July 6, 2026 18:30 to 23:30 IST (which is UTC 13:00 to 18:00)
        dates = "20260706T130000Z/20260706T180000Z";
        details = "Join us to witness the auspicious union and rituals of Madhusmita and Baijayanta.";
        location = "Baba Sameswara Pitha, Arilo, Kantipur, Binjharpur, Jajpur, Odisha";
      } else if (type === 'reception') {
        title = "Reception: Madhusmita weds Baijayanta";
        // July 10, 2026 13:00 to 18:00 IST (which is UTC 07:30 to 12:30)
        dates = "20260710T073000Z/20260710T123000Z";
        details = "Celebrate with us over a grand feast hosted by the Bal Family.";
        location = "Bal Family Residence, Banapur, Binjharpur, Jajpur, Odisha";
      }

      // Generate Google Calendar Link
      const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dates}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
      
      window.open(googleCalUrl, '_blank');
    });
  });
}


/* ==========================================================================
   INITIALIZATION
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  createMarigoldCanvas();
  runCountdown();
  initBlessingsWall();
  initCalendarButtons();
});
