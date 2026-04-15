const exercises = [
  { name: "Flexão", target: "10-15 reps", tip: "Mantenha o corpo reto e desça controlando.", video: "https://www.youtube.com/watch?v=IODxDxX7oi4" },
  { name: "Agachamento", target: "15-20 reps", tip: "Desça com o peito aberto e joelhos alinhados.", video: "https://www.youtube.com/watch?v=aclHkVaku9U" },
  { name: "Prancha", target: "30-60s", tip: "Contraia o abdômen e mantenha o quadril firme.", video: "https://www.youtube.com/watch?v=pSHjTRCQxIw" },
  { name: "Afundo", target: "10-12 reps", tip: "Dê um passo confortável e desça em linha reta.", video: "https://www.youtube.com/watch?v=QOVaHwm-Q6U" },
  { name: "Burpee", target: "8-12 reps", tip: "Faça em ritmo constante sem perder a técnica.", video: "https://www.youtube.com/watch?v=TU8QYVW0gDU" }
];

const KEY = "treino_videos_ios_v3_data";
const today = new Date().toISOString().slice(0, 10);

const defaultState = {
  tab: "inicio",
  currentIndex: 0,
  timerPreset: 45,
  timerSeconds: 45,
  workoutChecks: {},
  workoutDays: {},
  habits: {},
  history: [],
  weeklyGoal: 5,
  measurements: [{ date: today, weight: 96, waist: 108 }],
  photo: ""
};

let state = loadState();
let timerId = null;

function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? Object.assign({}, defaultState, JSON.parse(raw)) : JSON.parse(JSON.stringify(defaultState));
  } catch {
    return JSON.parse(JSON.stringify(defaultState));
  }
}

function saveState() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function addHistory(text) {
  const stamp = new Date().toLocaleString("pt-BR");
  state.history.unshift(stamp + " — " + text);
  state.history = state.history.slice(0, 20);
  saveState();
}

function getTodayChecks() { return state.workoutChecks[today] || {}; }
function setTodayChecks(checks) { state.workoutChecks[today] = checks; saveState(); }
function getTodayHabits() { return state.habits[today] || { dieta: false, agua: false, sono: false }; }
function setTodayHabits(h) { state.habits[today] = h; saveState(); }
function doneCountToday() { return exercises.filter((_, i) => getTodayChecks()[i]).length; }
function progressToday() { return Math.round((doneCountToday() / exercises.length) * 100); }
function completedWorkoutDaysCount() { return Object.values(state.workoutDays).filter(Boolean).length; }

function currentWeekCount() {
  const now = new Date();
  const day = now.getDay();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - day);
  const start = sunday.toISOString().slice(0, 10);
  return Object.entries(state.workoutDays).filter(([date, done]) => done && date >= start).length;
}

function calculateStreak() {
  let streak = 0;
  const cursor = new Date();
  while (state.workoutDays[cursor.toISOString().slice(0, 10)]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function achievements() {
  const streak = calculateStreak();
  const completed = completedWorkoutDaysCount();
  const habits = Object.values(state.habits).filter(h => h.dieta && h.agua && h.sono).length;
  return [
    { name: "Primeiro treino", unlocked: completed >= 1 },
    { name: "3 dias seguidos", unlocked: streak >= 3 },
    { name: "7 dias seguidos", unlocked: streak >= 7 },
    { name: "10 treinos", unlocked: completed >= 10 },
    { name: "1 dia completo", unlocked: habits >= 1 }
  ];
}

function toggleExercise(i) {
  const checks = Object.assign({}, getTodayChecks(), { [i]: !getTodayChecks()[i] });
  setTodayChecks(checks);
  addHistory(exercises[i].name + ": " + (checks[i] ? "concluído" : "desmarcado"));
  render();
}

function markWorkoutDone() {
  state.workoutDays[today] = !state.workoutDays[today];
  addHistory("Treino do dia " + (state.workoutDays[today] ? "finalizado" : "reaberto"));
  saveState();
  render();
}

function startWorkout() {
  const firstPending = exercises.findIndex((_, i) => !getTodayChecks()[i]);
  state.currentIndex = firstPending >= 0 ? firstPending : 0;
  state.tab = "treino";
  saveState();
  render();
}

function openVideo(i) { window.open(exercises[i].video, "_blank"); }
function nextExercise() { if (state.currentIndex < exercises.length - 1) { state.currentIndex += 1; saveState(); renderGuideOnly(); } }
function prevExercise() { if (state.currentIndex > 0) { state.currentIndex -= 1; saveState(); renderGuideOnly(); } }

function markAndNext() {
  const i = state.currentIndex;
  const checks = Object.assign({}, getTodayChecks(), { [i]: true });
  setTodayChecks(checks);
  addHistory(exercises[i].name + ": concluído");
  if (i < exercises.length - 1) state.currentIndex += 1;
  saveState();
  render();
}

function setTab(tab) { state.tab = tab; saveState(); render(); }
function setWeeklyGoal(val) { const n = Number(val); if (!Number.isNaN(n) && n > 0 && n <= 14) { state.weeklyGoal = n; saveState(); render(); } }
function toggleHabit(name) { const h = Object.assign({}, getTodayHabits(), { [name]: !getTodayHabits()[name] }); setTodayHabits(h); addHistory(name + ": " + (h[name] ? "feito" : "desmarcado")); render(); }

function formatTime(total) {
  const min = String(Math.floor(total / 60)).padStart(2, "0");
  const sec = String(total % 60).padStart(2, "0");
  return min + ":" + sec;
}
function setTimerPreset(value) { state.timerPreset = value; state.timerSeconds = value; stopTimer(); saveState(); renderGuideOnly(); }
function startTimer() {
  stopTimer();
  timerId = setInterval(() => {
    if (state.timerSeconds > 0) {
      state.timerSeconds -= 1;
      saveState();
      renderGuideOnly();
    } else {
      stopTimer();
      addHistory("Timer finalizado");
      render();
    }
  }, 1000);
}
function stopTimer() { if (timerId) clearInterval(timerId); timerId = null; }
function resetTimer() { stopTimer(); state.timerSeconds = state.timerPreset; saveState(); renderGuideOnly(); }

function saveMeasurement() {
  const date = document.getElementById("measureDate").value || today;
  const weight = Number(document.getElementById("measureWeight").value);
  const waist = Number(document.getElementById("measureWaist").value);
  if (!weight && !waist) return;
  state.measurements.push({ date: date, weight: weight || null, waist: waist || null });
  state.measurements.sort((a, b) => a.date.localeCompare(b.date));
  addHistory("Medição salva: " + date);
  saveState();
  render();
}

function handlePhotoUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    state.photo = e.target.result;
    addHistory("Foto de progresso atualizada");
    saveState();
    render();
  };
  reader.readAsDataURL(file);
}

function simpleLineChart(values, color) {
  const clean = values.filter(v => typeof v === "number");
  if (clean.length < 2) return '<div class="small center">Adicione mais registros para ver o gráfico.</div>';
  const width = 320, height = 160;
  const min = Math.min.apply(null, clean);
  const max = Math.max.apply(null, clean);
  const range = max - min || 1;
  const points = values.map((v, idx) => {
    if (typeof v !== "number") return null;
    const x = (idx / Math.max(values.length - 1, 1)) * (width - 20) + 10;
    const y = height - (((v - min) / range) * (height - 30) + 15);
    return x + "," + y;
  }).filter(Boolean).join(" ");
  return '<svg viewBox="0 0 ' + width + ' ' + height + '" class="svg-chart" preserveAspectRatio="none"><polyline fill="none" stroke="' + color + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" points="' + points + '" /></svg>';
}

function renderAchievements() {
  return achievements().map(a => '<div class="card"><div class="row-between"><div style="font-weight:800;">' + a.name + '</div><div class="badge ' + (a.unlocked ? 'badge-done' : 'badge-pending') + '">' + (a.unlocked ? 'Liberada' : 'Bloqueada') + '</div></div></div>').join("");
}

function renderGuideOnly() {
  const guide = document.getElementById("guideBox");
  if (!guide) return;
  const i = state.currentIndex;
  const ex = exercises[i];
  const done = !!getTodayChecks()[i];
  guide.innerHTML =
    '<div class="row-between"><div><div class="exercise-name">' + ex.name + '</div><div class="muted">' + ex.target + '</div></div><div class="badge ' + (done ? 'badge-done' : 'badge-pending') + '">' + (done ? 'Feito' : ((i + 1) + '/' + exercises.length)) + '</div></div>' +
    '<div class="tip">' + ex.tip + '</div>' +
    '<div class="timer">' + formatTime(state.timerSeconds) + '</div><div class="small center">Timer de descanso</div>' +
    '<div class="grid-3" style="margin-top:14px;"><button class="btn btn-soft" onclick="setTimerPreset(45)">45s</button><button class="btn btn-soft" onclick="setTimerPreset(60)">60s</button><button class="btn btn-soft" onclick="setTimerPreset(90)">90s</button></div>' +
    '<div class="grid-3" style="margin-top:10px;"><button class="btn btn-primary" onclick="startTimer()">Iniciar</button><button class="btn btn-soft" onclick="stopTimer()">Pausar</button><button class="btn btn-soft" onclick="resetTimer()">Resetar</button></div>' +
    '<div class="grid-2" style="margin-top:10px;"><button class="btn btn-dark" onclick="openVideo(' + i + ')">Assistir vídeo</button><button class="btn ' + (done ? 'btn-green' : 'btn-gray') + '" onclick="markAndNext()">' + (done ? 'Próximo' : 'Marcar e próximo') + '</button></div>' +
    '<div class="grid-2" style="margin-top:10px;"><button class="btn btn-soft" onclick="prevExercise()">Anterior</button><button class="btn btn-soft" onclick="nextExercise()">Próximo</button></div>';
}

function renderInicio() {
  const latest = state.measurements[state.measurements.length - 1] || {};
  const habits = getTodayHabits();
  const perfectToday = habits.dieta && habits.agua && habits.sono;
  return '<div class="grid-2"><div class="metric"><div class="metric-label">Streak</div><div class="metric-value">' + calculateStreak() + ' dias</div></div><div class="metric"><div class="metric-label">Meta semanal</div><div class="metric-value">' + currentWeekCount() + '/' + state.weeklyGoal + '</div></div></div>' +
    '<div class="grid-2" style="margin-top:10px;"><div class="metric"><div class="metric-label">Peso atual</div><div class="metric-value">' + (latest.weight ?? "-") + ' kg</div></div><div class="metric"><div class="metric-label">Cintura</div><div class="metric-value">' + (latest.waist ?? "-") + ' cm</div></div></div>' +
    '<div class="card"><div class="row-between"><div><div style="font-size:18px;font-weight:800;">Seu dia</div><div class="muted">Treino, hábitos e consistência.</div></div><div class="badge ' + (perfectToday ? 'badge-done' : 'badge-pending') + '">' + (perfectToday ? 'Completo' : 'Em andamento') + '</div></div><button class="btn btn-primary" style="margin-top:14px;" onclick="startWorkout()">Começar treino</button><button class="btn btn-soft" style="margin-top:10px;" onclick="setTab(\'habitos\')">Abrir hábitos</button></div>' +
    '<div class="section-title">Conquistas</div>' + renderAchievements();
}

function renderTreino() {
  let list = '';
  exercises.forEach((ex, i) => {
    const done = !!getTodayChecks()[i];
    list += '<div class="card"><div class="row-between"><div style="padding-right:10px;"><div class="exercise-name">' + ex.name + '</div><div class="muted">' + ex.target + '</div><div class="tip">' + ex.tip + '</div></div><div class="badge ' + (done ? 'badge-done' : 'badge-pending') + '">' + (done ? 'Feito' : 'Pendente') + '</div></div><div class="grid-2" style="margin-top:14px;"><button class="btn btn-primary" onclick="openVideo(' + i + ')">Assistir vídeo</button><button class="btn ' + (done ? 'btn-green' : 'btn-gray') + '" onclick="toggleExercise(' + i + ')">' + (done ? 'Concluído' : 'Marcar') + '</button></div></div>';
  });
  return '<div class="card"><div class="row-between"><div><div style="font-size:18px;font-weight:800;">Treino guiado</div><div class="muted">Assista, marque e avance.</div></div><div class="badge ' + (state.workoutDays[today] ? 'badge-done' : 'badge-pending') + '">' + (state.workoutDays[today] ? 'Dia finalizado' : 'Dia aberto') + '</div></div><div id="guideBox" class="guide-box"></div><button class="btn ' + (state.workoutDays[today] ? 'btn-green' : 'btn-dark') + '" style="margin-top:14px;" onclick="markWorkoutDone()">' + (state.workoutDays[today] ? 'Treino concluído hoje' : 'Finalizar treino do dia') + '</button></div><div class="section-title">Exercícios</div>' + list;
}

function renderHabitos() {
  const habits = getTodayHabits();
  return '<div class="card"><div style="font-size:18px;font-weight:800;">Check diário</div><div class="muted">Marque dieta, água e sono.</div>' +
    ['dieta','agua','sono'].map(key => '<div class="habit-item" style="margin-top:12px;"><div class="checkbox-row"><div style="font-weight:700;">' + (key === 'dieta' ? 'Segui a dieta' : key === 'agua' ? 'Bebi água suficiente' : 'Dormi bem') + '</div><button class="toggle ' + (habits[key] ? 'on' : '') + '" onclick="toggleHabit(\'' + key + '\')"></button></div></div>').join('') +
    '</div><div class="card"><div class="row-between"><div><div style="font-size:18px;font-weight:800;">Meta semanal</div><div class="muted">Treinos por semana</div></div><div class="badge badge-done">' + currentWeekCount() + '/' + state.weeklyGoal + '</div></div><div class="grid-3" style="margin-top:14px;"><button class="btn btn-soft" onclick="setWeeklyGoal(3)">3x</button><button class="btn btn-soft" onclick="setWeeklyGoal(5)">5x</button><button class="btn btn-soft" onclick="setWeeklyGoal(6)">6x</button></div></div><div class="section-title">Histórico recente</div><div class="list">' + (state.history.length ? state.history.slice(0, 10).map(item => '<div class="history-item">' + item + '</div>').join('') : '<div class="history-item">Ainda não há atividades registradas.</div>') + '</div>';
}

function renderProgresso() {
  const weights = state.measurements.map(m => m.weight);
  const waists = state.measurements.map(m => m.waist);
  const labels = state.measurements.slice(-4).map(m => m.date.slice(5));
  return '<div class="card"><div style="font-size:18px;font-weight:800;">Registrar medição</div><div class="grid-2" style="margin-top:12px;"><input id="measureWeight" type="number" step="0.1" placeholder="Peso (kg)" /><input id="measureWaist" type="number" step="0.1" placeholder="Cintura (cm)" /></div><input id="measureDate" type="date" value="' + today + '" style="margin-top:10px;" /><button class="btn btn-primary" style="margin-top:10px;" onclick="saveMeasurement()">Salvar medição</button></div>' +
    '<div class="chart"><div style="font-weight:800;">Gráfico de peso</div>' + simpleLineChart(weights, '#2563eb') + '<div class="chart-labels">' + labels.map(l => '<div>' + l + '</div>').join('') + '</div></div>' +
    '<div class="chart"><div style="font-weight:800;">Gráfico de cintura</div>' + simpleLineChart(waists, '#16a34a') + '<div class="chart-labels">' + labels.map(l => '<div>' + l + '</div>').join('') + '</div></div>' +
    '<div class="section-title">Fotos semanais</div><div class="card"><label class="file-label" for="photoInput">Escolher foto de progresso</label><input id="photoInput" type="file" accept="image/*" onchange="handlePhotoUpload(event)" />' + (state.photo ? '<img src="' + state.photo + '" alt="Foto de progresso" class="photo-preview" />' : '<div class="photo-preview"></div>') + '</div>' +
    '<div class="section-title">Histórico de medições</div><div class="list">' + state.measurements.slice().reverse().map(m => '<div class="measure-item">' + m.date + ' — ' + (m.weight ?? '-') + ' kg • ' + (m.waist ?? '-') + ' cm</div>').join('') + '</div>';
}

function render() {
  document.getElementById("app").innerHTML =
    '<div class="hero"><h1>Treino com Vídeos V3</h1><p>Agora com treino guiado, hábitos, meta semanal, medições, gráficos, streak e conquistas.</p><div class="progress-row"><div>Progresso de hoje</div><div style="font-size:18px;font-weight:800;">' + progressToday() + '%</div></div><div class="progress-bar-bg"><div class="progress-bar-fill" style="width:' + progressToday() + '%"></div></div></div>' +
    '<div class="tabs"><button class="tab ' + (state.tab === 'inicio' ? 'active' : '') + '" onclick="setTab(\'inicio\')">Início</button><button class="tab ' + (state.tab === 'treino' ? 'active' : '') + '" onclick="setTab(\'treino\')">Treino</button><button class="tab ' + (state.tab === 'habitos' ? 'active' : '') + '" onclick="setTab(\'habitos\')">Hábitos</button><button class="tab ' + (state.tab === 'progresso' ? 'active' : '') + '" onclick="setTab(\'progresso\')">Progresso</button></div>' +
    '<div id="screen">' + (state.tab === 'inicio' ? renderInicio() : '') + (state.tab === 'treino' ? renderTreino() : '') + (state.tab === 'habitos' ? renderHabitos() : '') + (state.tab === 'progresso' ? renderProgresso() : '') + '</div>' +
    '<div class="note">Conteúdo educativo. Não substitui orientação médica ou profissional individual.</div>';
  renderGuideOnly();
  saveState();
}

render();

window.toggleExercise = toggleExercise;
window.markWorkoutDone = markWorkoutDone;
window.startWorkout = startWorkout;
window.openVideo = openVideo;
window.nextExercise = nextExercise;
window.prevExercise = prevExercise;
window.markAndNext = markAndNext;
window.setTab = setTab;
window.setWeeklyGoal = setWeeklyGoal;
window.toggleHabit = toggleHabit;
window.setTimerPreset = setTimerPreset;
window.startTimer = startTimer;
window.stopTimer = stopTimer;
window.resetTimer = resetTimer;
window.saveMeasurement = saveMeasurement;
window.handlePhotoUpload = handlePhotoUpload;
