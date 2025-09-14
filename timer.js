let durationSec = 0;
let remaining = durationSec;
let timerId = null;
let running = false;
let isPaused = false; // track if user paused

// DOM Elements
const timeDisplay = document.getElementById('timeDisplay');
const potFill = document.getElementById('potFill');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const timeInput = document.getElementById('timeInput'); // hh:mm:ss input
const labelInput = document.getElementById('labelInput');
const sessionLabel = document.getElementById("sessionLabel");

// Create Reset button and append
const resetBtn = document.createElement('button');
resetBtn.textContent = "Reset";
pauseBtn.parentNode.appendChild(resetBtn);

// Update session label
labelInput.addEventListener("input", () => {
  sessionLabel.textContent = labelInput.value;
});

// Convert hh:mm:ss to seconds
function parseTimeInput(str) {
    const parts = str.split(':').map(Number);
    const h = parts[0] || 0;
    const m = parts[1] || 0;
    const s = parts[2] || 0;
    return h * 3600 + m * 60 + s;
}

// Format seconds as hh:mm:ss
function formatTime(s){
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

// Render timer and pot fill
function render(){
    timeDisplay.textContent = formatTime(remaining);
    const pct = durationSec ? (1 - remaining / durationSec) * 100 : 0;
    potFill.style.height = pct + '%';
}

// Save session to localStorage
function saveSession() {
    const elapsed = durationSec - remaining;
    if (elapsed > 0) {
        const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
        sessions.unshift({
            id: Date.now(),
            lengthSec: elapsed,
            label: labelInput.value || 'Focus',
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('sessions', JSON.stringify(sessions));
    }
}

// Play alarm for 2 seconds
function playAlarm() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = "square";  // alarm-like sound
    oscillator.frequency.setValueAtTime(1000, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime); 

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 2); // play for 2 seconds
}

// Tick
function tick(){
    if (remaining <= 0){ 
        saveSession();
        clearInterval(timerId);
        running = false;
        isPaused = false;
        pauseBtn.textContent = "Pause";
        playAlarm();  // play alarm when finished
        return; 
    }
    remaining--; 
    render();
}

// Start
function start(){ 
    if (running) return; 
    running = true; 
    isPaused = false;
    timerId = setInterval(tick, 1000); 
    pauseBtn.textContent = "Pause"; 
}

// Pause / Resume toggle
function pause(){ 
    if (!running && isPaused) { // resume
        start();
    } else if (running) { // pause
        running = false; 
        clearInterval(timerId); 
        isPaused = true;
        pauseBtn.textContent = "Resume";
    }
}

// Reset
function reset(){
    saveSession();

    clearInterval(timerId); 
    running = false;
    isPaused = false;
    remaining = 0;       
    durationSec = 0;     
    render();

    pauseBtn.textContent = "Pause";
    sessionLabel.textContent = ""; // clear label
}

// Button listeners
startBtn.addEventListener('click', ()=>{
    const totalSeconds = parseTimeInput(timeInput.value);
    durationSec = Math.max(30, totalSeconds); 
    remaining = durationSec;
    render();
    start();
});

pauseBtn.addEventListener('click', pause);
resetBtn.addEventListener('click', reset);

// Initial render
render();
