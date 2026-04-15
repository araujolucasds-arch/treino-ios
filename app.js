const exercises = [
  { name: "Flexão", target: "10-15 reps", tip: "Mantenha o corpo reto e desça controlando.", video: "https://www.youtube.com/watch?v=IODxDxX7oi4" },
  { name: "Agachamento", target: "15-20 reps", tip: "Desça com o peito aberto e joelhos alinhados.", video: "https://www.youtube.com/watch?v=aclHkVaku9U" },
  { name: "Prancha", target: "30-60s", tip: "Contraia o abdômen e mantenha o quadril firme.", video: "https://www.youtube.com/watch?v=pSHjTRCQxIw" },
  { name: "Afundo", target: "10-12 reps", tip: "Dê um passo confortável e desça em linha reta.", video: "https://www.youtube.com/watch?v=QOVaHwm-Q6U" },
  { name: "Burpee", target: "8-12 reps", tip: "Faça em ritmo constante sem perder a técnica.", video: "https://www.youtube.com/watch?v=TU8QYVW0gDU" }
];

const storageKey = "treino_videos_ios_v2";
const historyKey = "treino_videos_ios_history_v2";
let checks = JSON.parse(localStorage.getItem(storageKey) || "{}");
let history = JSON.parse(localStorage.getItem(historyKey) || "[]");
let currentIndex = 0;
let timerSeconds = 45;
let timerId = null;

function save() {
  localStorage.setItem(storageKey, JSON.stringify(checks));
  localStorage.setItem(historyKey, JSON.stringify(history));
}

function formatTime(total) {
  const min = String(Math.floor(total / 60)).padStart(2, "0");
  const sec = String(total % 60).padStart(2, "0");
  return `${min}:${sec}`;
}

function addHistory(text) {
  const stamp = new Date().toLocaleString("pt-BR");
  history.unshift(`${stamp} — ${text}`);
  history = history.slice(0, 12);
  save();
}

function toggleCheck(i) {
  checks[i] = !checks[i];
  addHistory(`${exercises[i].name}: ${checks[i] ? "concluído" : "desmarcado"}`);
  save();
  render();
}

function startWorkout() {
  const firstPending = exercises.findIndex((_, i) => !checks[i]);
  currentIndex = firstPending >= 0 ? firstPending : 0;
  render();
  document.getElementById("guideBox").scrollIntoView({ behavior: "smooth", block: "start" });
}

function openVideo(i) {
  window.open(exercises[i].video, "_blank");
}

function nextExercise() {
  if (currentIndex < exercises.length - 1) {
    currentIndex += 1;
    renderGuideOnly();
  }
}

function prevExercise() {
  if (currentIndex > 0) {
    currentIndex -= 1;
    renderGuideOnly();
  }
}

function markAndNext() {
  checks[currentIndex] = true;
  addHistory(`${exercises[currentIndex].name}: concluído`);
  save();
  if (currentIndex < exercises.length - 1) {
    currentIndex += 1;
  }
  render();
}

function setTimerPreset(value) {
  timerSeconds = value;
  stopTimer();
  renderGuideOnly();
}

function startTimer() {
  stopTimer();
  timerId = setInterval(() => {
    if (timerSeconds > 0) {
      timerSeconds -= 1;
      renderGuideOnly();
    } else {
      stopTimer();
      addHistory("Timer finalizado");
      render();
    }
  }, 1000);
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function resetTimer() {
  stopTimer();
  timerSeconds = 45;
  renderGuideOnly();
}

function renderGuideOnly() {
  const ex = exercises[currentIndex];
  const guide = document.getElementById("guideBox");
  if (!guide) return;
  guide.innerHTML = `
    <div class="guide-header">
      <div>
        <div class="guide-name">${ex.name}</div>
        <div class="target">${ex.target}</div>
      </div>
      <div class="badge ${checks[currentIndex] ? 'badge-done' : 'badge-pending'}">
        ${checks[currentIndex] ? 'Feito' : `${currentIndex + 1}/${exercises.length}`}
      </div>
    </div>
    <div class="tip">${ex.tip}</div>
    <div class="timer">${formatTime(timerSeconds)}</div>
    <div class="timer-label">Timer de descanso</div>
    <div class="grid">
      <button class="small-btn" onclick="setTimerPreset(45)">45s</button>
      <button class="small-btn" onclick="setTimerPreset(60)">60s</button>
      <button class="small-btn" onclick="setTimerPreset(90)">90s</button>
    </div>
    <div class="grid">
      <button class="small-btn" onclick="startTimer()">Iniciar</button>
      <button class="small-btn" onclick="stopTimer()">Pausar</button>
      <button class="small-btn" onclick="resetTimer()">Resetar</button>
    </div>
    <div class="primary-row">
      <button class="btn btn-pending" onclick="openVideo(${currentIndex})">Assistir vídeo</button>
      <button class="btn ${checks[currentIndex] ? 'btn-done' : 'btn-pending'}" onclick="markAndNext()">
        ${checks[currentIndex] ? 'Próximo' : 'Marcar e próximo'}
      </button>
    </div>
    <div class="primary-row">
      <button class="small-btn" onclick="prevExercise()">Anterior</button>
      <button class="small-btn" onclick="nextExercise()">Próximo</button>
    </div>
  `;
}

function render() {
  const done = Object.values(checks).filter(Boolean).length;
  const progress = Math.round((done / exercises.length) * 100);

  let html = `
    <div class="top">
      <h1 class="title">Treino com Vídeos V2</h1>
      <div class="sub">Modo guiado, timer de descanso e progresso salvo no navegador.</div>
      <div class="progress">Progresso: ${progress}%</div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width:${progress}%"></div>
      </div>
      <button class="big-action" onclick="startWorkout()">Começar treino</button>
    </div>

    <div class="section-title">Treino guiado</div>
    <div id="guideBox" class="guide-box"></div>

    <div class="section-title">Exercícios</div>
  `;

  exercises.forEach((ex, i) => {
    html += `
      <div class="card">
        <div class="row">
          <div style="flex:1;">
            <div class="name">${ex.name}</div>
            <div class="target">${ex.target}</div>
            <div class="tip">${ex.tip}</div>
          </div>
          <div class="badge ${checks[i] ? 'badge-done' : 'badge-pending'}">
            ${checks[i] ? 'Feito' : 'Pendente'}
          </div>
        </div>
        <button class="btn ${checks[i] ? 'btn-done' : 'btn-pending'}" onclick="toggleCheck(${i})">
          ${checks[i] ? 'Concluído' : 'Marcar'}
        </button>
        <a class="video-link" href="${ex.video}" target="_blank" rel="noreferrer">▶ Assistir vídeo</a>
      </div>
    `;
  });

  html += `<div class="section-title">Histórico recente</div>`;
  if (history.length === 0) {
    html += `<div class="history-item">Ainda não há atividades registradas.</div>`;
  } else {
    history.forEach(item => {
      html += `<div class="history-item">${item}</div>`;
    });
  }

  html += `<div class="note">Seu progresso fica salvo neste navegador.</div>`;
  document.getElementById("app").innerHTML = html;
  renderGuideOnly();
}

render();

window.toggleCheck = toggleCheck;
window.startWorkout = startWorkout;
window.openVideo = openVideo;
window.nextExercise = nextExercise;
window.prevExercise = prevExercise;
window.markAndNext = markAndNext;
window.setTimerPreset = setTimerPreset;
window.startTimer = startTimer;
window.stopTimer = stopTimer;
window.resetTimer = resetTimer;
