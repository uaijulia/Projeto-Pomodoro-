const MODES = {
  work: { duration: 25 * 60, label: 'foco', display: '25:00' },
  break: { duration: 5 * 60, label: 'pausa', display: '05:00' },
};

const STORAGE_KEY = 'pomodoroTimerState';

let currentMode = 'work';
let totalSeconds = MODES.work.duration;
let remaining = totalSeconds;
let running = false;
let interval = null;
let pomodoros = 0;
let minutesFocused = 0;
let startedAt = null;

const timerDisplay = document.getElementById('timerDisplay');
const timerLabel = document.getElementById('timerLabel');
const btnStart = document.getElementById('btnStart');
const ringProgress = document.getElementById('ringProgress');
const pomodorosEl = document.getElementById('pomodorosCount');
const minutesEl = document.getElementById('minutesCount');
const toastEl = document.getElementById('toast');
const btnWork = document.getElementById('btnWork');
const btnBreak = document.getElementById('btnBreak');

const CIRCUMFERENCE = 2 * Math.PI * 100;

function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function saveState() {
  const state = {
    currentMode,
    totalSeconds,
    remaining,
    running,
    pomodoros,
    minutesFocused,
    startedAt,
    savedAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function updateStats() {
  pomodorosEl.textContent = pomodoros;
  minutesEl.textContent = minutesFocused;
}

function updateRing() {
  const fraction = remaining / totalSeconds;
  const offset = CIRCUMFERENCE * (1 - fraction);
  ringProgress.style.strokeDashoffset = offset;
}

function applyModeStyles(mode) {
  btnWork.className = 'mode-btn' + (mode === 'work' ? ' active-work' : '');
  btnBreak.className = 'mode-btn' + (mode === 'break' ? ' active-break' : '');

  if (mode === 'break') {
    ringProgress.classList.add('break-mode');
    btnStart.classList.add('break-active');
  } else {
    ringProgress.classList.remove('break-mode');
    btnStart.classList.remove('break-active');
  }
}

function renderTimer() {
  timerLabel.textContent = MODES[currentMode].label;
  timerDisplay.textContent = formatTime(remaining);
  applyModeStyles(currentMode);
  updateStats();
  updateRing();
}

function setMode(mode, shouldSave = true) {
  if (running) return;
  currentMode = mode;
  totalSeconds = MODES[mode].duration;
  remaining = totalSeconds;
  startedAt = null;
  renderTimer();
  if (shouldSave) saveState();
}

function startInterval() {
  clearInterval(interval);
  interval = setInterval(tick, 1000);
}

function toggleTimer() {
  if (running) {
    clearInterval(interval);
    running = false;
    startedAt = null;
    btnStart.textContent = 'Continuar';
  } else {
    running = true;
    startedAt = Date.now();
    btnStart.textContent = 'Pausar';
    startInterval();
  }
  saveState();
}

function tick() {
  if (remaining <= 0) {
    clearInterval(interval);
    running = false;
    startedAt = null;
    onPhaseComplete();
    return;
  }

  remaining--;

  if (currentMode === 'work') {
    minutesFocused = pomodoros * 25 + Math.floor((totalSeconds - remaining) / 60);
  }

  renderTimer();
  saveState();
}

function onPhaseComplete() {
  if (currentMode === 'work') {
    pomodoros++;
    minutesFocused = pomodoros * 25;
    renderTimer();
    saveState();
    showToast('🍅 Pomodoro concluído! Hora da pausa.');
    setTimeout(() => setMode('break'), 1200);
  } else {
    showToast('✨ Pausa encerrada. Pronta para mais um foco?');
    setTimeout(() => setMode('work'), 1200);
  }
  btnStart.textContent = 'Iniciar';
}

function resetTimer() {
  clearInterval(interval);
  running = false;
  startedAt = null;
  remaining = totalSeconds;
  btnStart.textContent = 'Iniciar';
  renderTimer();
  saveState();
}

function skipPhase() {
  clearInterval(interval);
  running = false;
  startedAt = null;
  remaining = 0;
  onPhaseComplete();
}

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 3500);
}

function restoreState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    renderTimer();
    return;
  }

  try {
    const state = JSON.parse(saved);
    currentMode = state.currentMode in MODES ? state.currentMode : 'work';
    totalSeconds = MODES[currentMode].duration;
    remaining = typeof state.remaining === 'number' ? state.remaining : totalSeconds;
    running = Boolean(state.running);
    pomodoros = typeof state.pomodoros === 'number' ? state.pomodoros : 0;
    minutesFocused = typeof state.minutesFocused === 'number' ? state.minutesFocused : pomodoros * 25;
    startedAt = typeof state.startedAt === 'number' ? state.startedAt : null;

    if (running && startedAt) {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      remaining = Math.max(0, remaining - elapsed);

      if (currentMode === 'work') {
        minutesFocused = pomodoros * 25 + Math.floor((totalSeconds - remaining) / 60);
      }

      if (remaining <= 0) {
        running = false;
        startedAt = null;
        renderTimer();
        onPhaseComplete();
        return;
      }

      btnStart.textContent = 'Pausar';
      renderTimer();
      startInterval();
      saveState();
      return;
    }

    btnStart.textContent = remaining < totalSeconds ? 'Continuar' : 'Iniciar';
    renderTimer();
    saveState();
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    renderTimer();
  }
}

restoreState();