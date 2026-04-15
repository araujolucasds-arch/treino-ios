var exerciseGroups = {
  "Treino A": [
    { name: "Flexão", target: "10-15 reps", tip: "Mantenha o corpo reto e desça controlando.", video: "https://www.youtube.com/watch?v=IODxDxX7oi4", embed: "https://www.youtube.com/embed/IODxDxX7oi4?playsinline=1&rel=0" },
    { name: "Agachamento", target: "15-20 reps", tip: "Desça com o peito aberto e joelhos alinhados.", video: "https://www.youtube.com/watch?v=aclHkVaku9U", embed: "https://www.youtube.com/embed/aclHkVaku9U?playsinline=1&rel=0" },
    { name: "Prancha", target: "30-60s", tip: "Contraia o abdômen e mantenha o quadril firme.", video: "https://www.youtube.com/watch?v=pSHjTRCQxIw", embed: "https://www.youtube.com/embed/pSHjTRCQxIw?playsinline=1&rel=0" }
  ],
  "Treino B": [
    { name: "Afundo", target: "10-12 reps", tip: "Dê um passo confortável e desça em linha reta.", video: "https://www.youtube.com/watch?v=QOVaHwm-Q6U", embed: "https://www.youtube.com/embed/QOVaHwm-Q6U?playsinline=1&rel=0" },
    { name: "Burpee", target: "8-12 reps", tip: "Faça em ritmo constante sem perder a técnica.", video: "https://www.youtube.com/watch?v=TU8QYVW0gDU", embed: "https://www.youtube.com/embed/TU8QYVW0gDU?playsinline=1&rel=0" },
    { name: "Prancha", target: "30-60s", tip: "Contraia o abdômen e mantenha o quadril firme.", video: "https://www.youtube.com/watch?v=pSHjTRCQxIw", embed: "https://www.youtube.com/embed/pSHjTRCQxIw?playsinline=1&rel=0" }
  ],
  "Caminhada": [
    { name: "Caminhada leve", target: "20-40 min", tip: "Mantenha ritmo confortável e contínuo.", video: "https://www.youtube.com/watch?v=ml6cT4AZdqI", embed: "https://www.youtube.com/embed/ml6cT4AZdqI?playsinline=1&rel=0" }
  ]
};

var dietPlan = {
  cafe: ["2 a 3 ovos", "1 fruta", "Café sem açúcar ou com pouco açúcar"],
  almoco: ["150 a 200g de frango, peixe ou carne", "3 a 5 colheres de arroz", "Feijão", "Salada à vontade"],
  lanche: ["Iogurte natural ou fruta", "Castanhas ou amendoim em pequena porção"],
  jantar: ["Proteína leve", "Legumes ou salada", "Carbo moderado se ainda houver fome"],
  evitar: ["Refrigerante", "Álcool frequente", "Fast food frequente", "Doces líquidos e exageros à noite"],
  agua: "Meta: 2,5L a 3L por dia"
};

var planOptions = ["Treino A", "Treino B", "Descanso", "Caminhada"];
var defaultWeekPlan = { Seg: "Treino A", Ter: "Treino B", Qua: "Treino A", Qui: "Treino B", Sex: "Treino A", Sab: "Treino B", Dom: "Descanso" };
var KEY = "treino_videos_ios_v5_safari_fix";
var today = new Date().toISOString().slice(0, 10);

var defaultState = {
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
  photo: "",
  weekPlan: defaultWeekPlan
};

var state = loadState();
var timerId = null;

function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
function loadState() {
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      var merged = clone(defaultState);
      for (var k in parsed) merged[k] = parsed[k];
      return merged;
    }
    return clone(defaultState);
  } catch (e) {
    return clone(defaultState);
  }
}
function saveState() { localStorage.setItem(KEY, JSON.stringify(state)); }
function addHistory(text) {
  var stamp = new Date().toLocaleString("pt-BR");
  state.history.unshift(stamp + " — " + text);
  state.history = state.history.slice(0, 30);
  saveState();
}
function weekdayLabel() { return ["Dom","Seg","Ter","Qua","Qui","Sex","Sab"][new Date().getDay()]; }
function todayPlan() { return state.weekPlan[weekdayLabel()] || "Treino A"; }
function todayExercises() {
  var plan = todayPlan();
  if (plan === "Descanso") return [];
  return exerciseGroups[plan] || exerciseGroups["Treino A"];
}
function getTodayChecks() { return state.workoutChecks[today] || {}; }
function setTodayChecks(checks) { state.workoutChecks[today] = checks; saveState(); }
function getTodayHabits() { return state.habits[today] || { dieta: false, agua: false, sono: false }; }
function setTodayHabits(h) { state.habits[today] = h; saveState(); }
function doneCountToday() {
  var ex = todayExercises();
  var checks = getTodayChecks();
  var count = 0;
  for (var i = 0; i < ex.length; i++) if (checks[i]) count++;
  return count;
}
function progressToday() {
  var ex = todayExercises();
  if (!ex.length) return state.workoutDays[today] ? 100 : 0;
  return Math.round((doneCountToday() / ex.length) * 100);
}
function completedWorkoutDaysCount() {
  var vals = Object.values(state.workoutDays);
  var count = 0;
  for (var i = 0; i < vals.length; i++) if (vals[i]) count++;
  return count;
}
function currentWeekCount() {
  var now = new Date();
  var day = now.getDay();
  var sunday = new Date(now);
  sunday.setDate(now.getDate() - day);
  var start = sunday.toISOString().slice(0, 10);
  var entries = Object.entries(state.workoutDays);
  var count = 0;
  for (var i = 0; i < entries.length; i++) {
    if (entries[i][1] && entries[i][0] >= start) count++;
  }
  return count;
}
function calculateStreak() {
  var streak = 0;
  var cursor = new Date();
  while (state.workoutDays[cursor.toISOString().slice(0, 10)]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
function achievements() {
  var streak = calculateStreak();
  var completed = completedWorkoutDaysCount();
  var habits = Object.values(state.habits);
  var perfect = 0;
  for (var i = 0; i < habits.length; i++) {
    if (habits[i].dieta && habits[i].agua && habits[i].sono) perfect++;
  }
  return [
    { name: "Primeiro treino", unlocked: completed >= 1 },
    { name: "3 dias seguidos", unlocked: streak >= 3 },
    { name: "7 dias seguidos", unlocked: streak >= 7 },
    { name: "10 treinos", unlocked: completed >= 10 },
    { name: "1 dia completo", unlocked: perfect >= 1 }
  ];
}
function toggleExercise(i) {
  var checks = getTodayChecks();
  var next = {};
  for (var k in checks) next[k] = checks[k];
  next[i] = !checks[i];
  setTodayChecks(next);
  var ex = todayExercises()[i];
  addHistory((ex ? ex.name : "Exercício") + ": " + (next[i] ? "concluído" : "desmarcado"));
  render();
}
function markWorkoutDone() {
  state.workoutDays[today] = !state.workoutDays[today];
  addHistory("Treino do dia " + (state.workoutDays[today] ? "finalizado" : "reaberto"));
  saveState();
  render();
}
function startWorkout() {
  var ex = todayExercises();
  var checks = getTodayChecks();
  var idx = 0;
  for (var i = 0; i < ex.length; i++) {
    if (!checks[i]) { idx = i; break; }
  }
  state.currentIndex = idx;
  state.tab = "treino";
  saveState();
  render();
}
function nextExercise() {
  var ex = todayExercises();
  if (state.currentIndex < ex.length - 1) {
    state.currentIndex += 1;
    saveState();
    renderGuideOnly();
  }
}
function prevExercise() {
  if (state.currentIndex > 0) {
    state.currentIndex -= 1;
    saveState();
    renderGuideOnly();
  }
}
function markAndNext() {
  var exs = todayExercises();
  var i = state.currentIndex;
  var checks = getTodayChecks();
  var next = {};
  for (var k in checks) next[k] = checks[k];
  next[i] = true;
  setTodayChecks(next);
  addHistory((exs[i] ? exs[i].name : "Exercício") + ": concluído");
  if (i < exs.length - 1) state.currentIndex += 1;
  saveState();
  render();
}
function setTab(tab) { state.tab = tab; saveState(); render(); }
function setWeeklyGoal(val) {
  var n = Number(val);
  if (!isNaN(n) && n > 0 && n <= 14) {
    state.weeklyGoal = n;
    saveState();
    render();
  }
}
function toggleHabit(name) {
  var current = getTodayHabits();
  var h = { dieta: current.dieta, agua: current.agua, sono: current.sono };
  h[name] = !current[name];
  setTodayHabits(h);
  addHistory(name + ": " + (h[name] ? "feito" : "desmarcado"));
  render();
}
function setWeekDayPlan(day, value) {
  state.weekPlan[day] = value;
  addHistory("Plano " + day + ": " + value);
  saveState();
  render();
}
function formatTime(total) {
  var min = String(Math.floor(total / 60)).padStart(2, "0");
  var sec = String(total % 60).padStart(2, "0");
  return min + ":" + sec;
}
function setTimerPreset(value) { state.timerPreset = value; state.timerSeconds = value; stopTimer(); saveState(); renderGuideOnly(); }
function startTimer() {
  stopTimer();
  timerId = setInterval(function() {
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
  var date = document.getElementById("measureDate").value || today;
  var weight = Number(document.getElementById("measureWeight").value);
  var waist = Number(document.getElementById("measureWaist").value);
  if (!weight && !waist) return;
  state.measurements.push({ date: date, weight: weight || null, waist: waist || null });
  state.measurements.sort(function(a,b){ return a.date.localeCompare(b.date); });
  addHistory("Medição salva: " + date);
  saveState();
  render();
}
function handlePhotoUpload(event) {
  var file = event.target.files && event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    state.photo = e.target.result;
    addHistory("Foto de progresso atualizada");
    saveState();
    render();
  };
  reader.readAsDataURL(file);
}
function simpleLineChart(values, color) {
  var clean = values.filter(function(v){ return typeof v === "number"; });
  if (clean.length < 2) return '<div class="small center">Adicione mais registros para ver o gráfico.</div>';
  var width = 320, height = 160;
  var min = Math.min.apply(null, clean);
  var max = Math.max.apply(null, clean);
  var range = max - min || 1;
  var points = [];
  for (var idx = 0; idx < values.length; idx++) {
    var v = values[idx];
    if (typeof v !== "number") continue;
    var x = (idx / Math.max(values.length - 1, 1)) * (width - 20) + 10;
    var y = height - (((v - min) / range) * (height - 30) + 15);
    points.push(x + "," + y);
  }
  return '<svg viewBox="0 0 ' + width + ' ' + height + '" class="svg-chart" preserveAspectRatio="none"><polyline fill="none" stroke="' + color + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" points="' + points.join(" ") + '" /></svg>';
}
function renderAchievements() {
  var items = achievements();
  var out = "";
  for (var i = 0; i < items.length; i++) {
    out += '<div class="card"><div class="row-between"><div style="font-weight:900;">' + items[i].name + '</div><div class="badge ' + (items[i].unlocked ? 'badge-done' : 'badge-pending') + '">' + (items[i].unlocked ? 'Liberada' : 'Bloqueada') + '</div></div></div>';
  }
  return out;
}
function renderVideoEmbed(ex) {
  return '<div class="video-frame-wrap"><iframe class="video-frame" src="' + ex.embed + '" title="' + ex.name + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div><a class="link" href="' + ex.video + '" target="_blank" rel="noreferrer">Abrir no YouTube se o vídeo não tocar</a>';
}
function openVideoExternal(url) { window.open(url, "_blank"); }
function renderGuideOnly() {
  var guide = document.getElementById("guideBox");
  if (!guide) return;
  var exs = todayExercises();
  if (!exs.length) {
    guide.innerHTML = '<div class="rest-box"><div style="font-size:18px;font-weight:900;">Hoje é dia de descanso</div><div class="muted" style="margin-top:8px;">Use o dia para recuperar, caminhar leve ou apenas manter a rotina de hábitos.</div></div>';
    return;
  }
  var i = state.currentIndex;
  var ex = exs[i];
  var done = !!getTodayChecks()[i];
  guide.innerHTML =
    '<div class="row-between"><div><div class="exercise-name">' + ex.name + '</div><div class="muted">' + ex.target + '</div></div><div class="badge ' + (done ? 'badge-done' : 'badge-pending') + '">' + (done ? 'Feito' : ((i + 1) + '/' + exs.length)) + '</div></div>' +
    renderVideoEmbed(ex) +
    '<div class="tip">' + ex.tip + '</div>' +
    '<div class="timer">' + formatTime(state.timerSeconds) + '</div><div class="small center">Timer de descanso</div>' +
    '<div class="grid-3" style="margin-top:14px;"><button class="btn btn-soft" onclick="setTimerPreset(45)">45s</button><button class="btn btn-soft" onclick="setTimerPreset(60)">60s</button><button class="btn btn-soft" onclick="setTimerPreset(90)">90s</button></div>' +
    '<div class="grid-3" style="margin-top:10px;"><button class="btn btn-primary" onclick="startTimer()">Iniciar</button><button class="btn btn-soft" onclick="stopTimer()">Pausar</button><button class="btn btn-soft" onclick="resetTimer()">Resetar</button></div>' +
    '<div class="grid-2" style="margin-top:10px;"><button class="btn btn-dark" onclick="openVideoExternal(\'' + ex.video + '\')">Abrir vídeo</button><button class="btn ' + (done ? 'btn-green' : 'btn-gray') + '" onclick="markAndNext()">' + (done ? 'Próximo' : 'Marcar e próximo') + '</button></div>' +
    '<div class="grid-2" style="margin-top:10px;"><button class="btn btn-soft" onclick="prevExercise()">Anterior</button><button class="btn btn-soft" onclick="nextExercise()">Próximo</button></div>';
}
function safeVal(v, suffix) { return (v === null || v === undefined) ? "-" : (v + suffix); }
function renderInicio() {
  var latest = state.measurements[state.measurements.length - 1] || {};
  var habits = getTodayHabits();
  var perfectToday = habits.dieta && habits.agua && habits.sono;
  return '<div class="kpi-strip"><div class="kpi"><div class="small" style="color:#dbeafe">Streak</div><div class="value">' + calculateStreak() + '</div></div><div class="kpi"><div class="small" style="color:#dbeafe">Meta</div><div class="value">' + currentWeekCount() + '/' + state.weeklyGoal + '</div></div><div class="kpi"><div class="small" style="color:#dbeafe">Hoje</div><div class="value">' + progressToday() + '%</div></div></div>' +
    '<div class="today-plan"><div class="row-between"><div><div style="font-size:18px;font-weight:900;">Plano de hoje</div><div class="muted" style="color:#dbeafe;margin-top:6px;">' + weekdayLabel() + ' • ' + todayPlan() + '</div></div><div class="badge ' + (todayPlan() === "Descanso" ? 'badge-rest' : perfectToday ? 'badge-done' : 'badge-pending') + '">' + (todayPlan() === "Descanso" ? 'Descanso' : perfectToday ? 'Completo' : 'Ativo') + '</div></div><button class="btn btn-primary" style="margin-top:14px;" onclick="startWorkout()">Começar treino</button></div>' +
    '<div class="grid-2" style="margin-top:12px;"><div class="metric"><div class="metric-label">Peso atual</div><div class="metric-value">' + safeVal(latest.weight, ' kg') + '</div></div><div class="metric"><div class="metric-label">Cintura</div><div class="metric-value">' + safeVal(latest.waist, ' cm') + '</div></div></div>' +
    '<div class="section-title">Conquistas</div>' + renderAchievements();
}
function renderTreino() {
  var exs = todayExercises();
  if (!exs.length) {
    return '<div class="card"><div style="font-size:18px;font-weight:900;">Dia de descanso</div><div class="muted" style="margin-top:8px;">Seu plano de hoje está como descanso. Você pode mudar isso na aba Semana.</div><div class="rest-box"><div style="font-weight:900;">Sugestão</div><div class="muted" style="margin-top:8px;">Faça uma caminhada leve, alongamento ou foque na dieta e hidratação.</div></div></div>';
  }
  var list = '';
  for (var i = 0; i < exs.length; i++) {
    var ex = exs[i];
    var done = !!getTodayChecks()[i];
    list += '<div class="card"><div class="row-between"><div style="padding-right:10px;flex:1;"><div class="exercise-name">' + ex.name + '</div><div class="muted">' + ex.target + '</div><div class="tip">' + ex.tip + '</div></div><div class="badge ' + (done ? 'badge-done' : 'badge-pending') + '">' + (done ? 'Feito' : 'Pendente') + '</div></div>' + renderVideoEmbed(ex) + '<div class="grid-2" style="margin-top:14px;"><button class="btn btn-primary" onclick="openVideoExternal(\'' + ex.video + '\')">Abrir vídeo</button><button class="btn ' + (done ? 'btn-green' : 'btn-gray') + '" onclick="toggleExercise(' + i + ')">' + (done ? 'Concluído' : 'Marcar') + '</button></div></div>';
  }
  return '<div class="card"><div class="row-between"><div><div style="font-size:18px;font-weight:900;">Treino guiado</div><div class="muted">' + todayPlan() + '</div></div><div class="badge ' + (state.workoutDays[today] ? 'badge-done' : 'badge-pending') + '">' + (state.workoutDays[today] ? 'Dia finalizado' : 'Dia aberto') + '</div></div><div id="guideBox" class="guide-box"></div><button class="btn ' + (state.workoutDays[today] ? 'btn-green' : 'btn-dark') + '" style="margin-top:14px;" onclick="markWorkoutDone()">' + (state.workoutDays[today] ? 'Treino concluído hoje' : 'Finalizar treino do dia') + '</button></div><div class="section-title">Exercícios de hoje</div>' + list;
}
function renderHabitos() {
  var habits = getTodayHabits();
  var items = ['dieta','agua','sono'];
  var out = '<div class="card"><div style="font-size:18px;font-weight:900;">Check diário</div><div class="muted">Marque dieta, água e sono.</div>';
  for (var i = 0; i < items.length; i++) {
    var key = items[i];
    var label = key === 'dieta' ? 'Segui a dieta' : key === 'agua' ? 'Bebi água suficiente' : 'Dormi bem';
    out += '<div class="habit-item" style="margin-top:12px;"><div class="checkbox-row"><div style="font-weight:800;">' + label + '</div><button class="toggle ' + (habits[key] ? 'on' : '') + '" onclick="toggleHabit(\'' + key + '\')"></button></div></div>';
  }
  out += '</div><div class="card"><div class="row-between"><div><div style="font-size:18px;font-weight:900;">Meta semanal</div><div class="muted">Treinos por semana</div></div><div class="badge badge-done">' + currentWeekCount() + '/' + state.weeklyGoal + '</div></div><div class="grid-3" style="margin-top:14px;"><button class="btn btn-soft" onclick="setWeeklyGoal(3)">3x</button><button class="btn btn-soft" onclick="setWeeklyGoal(5)">5x</button><button class="btn btn-soft" onclick="setWeeklyGoal(6)">6x</button></div></div>';
  out += '<div class="section-title">Histórico recente</div><div class="list">';
  if (state.history.length) {
    for (var j = 0; j < Math.min(10, state.history.length); j++) out += '<div class="history-item">' + state.history[j] + '</div>';
  } else {
    out += '<div class="history-item">Ainda não há atividades registradas.</div>';
  }
  out += '</div>';
  return out;
}
function renderProgresso() {
  var weights = state.measurements.map(function(m){ return m.weight; });
  var waists = state.measurements.map(function(m){ return m.waist; });
  var labels = state.measurements.slice(-4).map(function(m){ return m.date.slice(5); });
  var out = '<div class="card"><div style="font-size:18px;font-weight:900;">Registrar medição</div><div class="grid-2" style="margin-top:12px;"><input id="measureWeight" type="number" step="0.1" placeholder="Peso (kg)" /><input id="measureWaist" type="number" step="0.1" placeholder="Cintura (cm)" /></div><input id="measureDate" type="date" value="' + today + '" style="margin-top:10px;" /><button class="btn btn-primary" style="margin-top:10px;" onclick="saveMeasurement()">Salvar medição</button></div>';
  out += '<div class="chart"><div style="font-weight:900;">Gráfico de peso</div>' + simpleLineChart(weights, '#2563eb') + '<div class="chart-labels">' + labels.map(function(l){ return '<div>' + l + '</div>'; }).join('') + '</div></div>';
  out += '<div class="chart"><div style="font-weight:900;">Gráfico de cintura</div>' + simpleLineChart(waists, '#16a34a') + '<div class="chart-labels">' + labels.map(function(l){ return '<div>' + l + '</div>'; }).join('') + '</div></div>';
  out += '<div class="section-title">Fotos semanais</div><div class="card"><label class="file-label" for="photoInput">Escolher foto de progresso</label><input id="photoInput" type="file" accept="image/*" onchange="handlePhotoUpload(event)" />' + (state.photo ? '<img src="' + state.photo + '" alt="Foto de progresso" class="photo-preview" />' : '<div class="photo-preview"></div>') + '</div>';
  out += '<div class="section-title">Histórico de medições</div><div class="list">';
  for (var i = state.measurements.length - 1; i >= 0; i--) {
    var m = state.measurements[i];
    out += '<div class="measure-item">' + m.date + ' — ' + safeVal(m.weight, ' kg') + ' • ' + safeVal(m.waist, ' cm') + '</div>';
  }
  out += '</div>';
  return out;
}
function renderDieta() {
  function block(title, arr) {
    return '<div class="diet-item"><div class="diet-title">' + title + '</div><ul class="diet-list">' + arr.map(function(i){ return '<li>' + i + '</li>'; }).join('') + '</ul></div>';
  }
  return '<div class="card"><div style="font-size:18px;font-weight:900;">Plano alimentar simples</div><div class="muted" style="margin-top:6px;">' + dietPlan.agua + '</div></div>' +
    block('Café da manhã', dietPlan.cafe) +
    block('Almoço', dietPlan.almoco) +
    block('Lanche', dietPlan.lanche) +
    block('Jantar', dietPlan.jantar) +
    block('Evitar', dietPlan.evitar);
}
function renderSemana() {
  var days = ["Seg","Ter","Qua","Qui","Sex","Sab","Dom"];
  var out = '<div class="card"><div style="font-size:18px;font-weight:900;">Treinos da semana</div><div class="muted">Troque qualquer dia quando precisar.</div></div><div class="list">';
  for (var i = 0; i < days.length; i++) {
    var day = days[i];
    var current = state.weekPlan[day] || "Treino A";
    out += '<div class="week-item"><div class="row-between"><div><div style="font-weight:900;">' + day + '</div><div class="muted">Plano atual: ' + current + '</div></div><select onchange="setWeekDayPlan(\'' + day + '\', this.value)">';
    for (var j = 0; j < planOptions.length; j++) {
      var opt = planOptions[j];
      out += '<option value="' + opt + '"' + (current === opt ? ' selected' : '') + '>' + opt + '</option>';
    }
    out += '</select></div></div>';
  }
  out += '</div>';
  return out;
}
function render() {
  document.getElementById("app").innerHTML =
    '<div class="hero"><h1>Treino com Vídeos V5</h1><p>Versão profissional com treino do dia dinâmico, vídeos no app, dieta, semana editável e progresso completo.</p><div class="progress-row"><div>Progresso de hoje</div><div style="font-size:18px;font-weight:900;">' + progressToday() + '%</div></div><div class="progress-bar-bg"><div class="progress-bar-fill" style="width:' + progressToday() + '%"></div></div></div>' +
    '<div class="tabs"><button class="tab ' + (state.tab === 'inicio' ? 'active' : '') + '" onclick="setTab(\'inicio\')">Início</button><button class="tab ' + (state.tab === 'treino' ? 'active' : '') + '" onclick="setTab(\'treino\')">Treino</button><button class="tab ' + (state.tab === 'dieta' ? 'active' : '') + '" onclick="setTab(\'dieta\')">Dieta</button><button class="tab ' + (state.tab === 'semana' ? 'active' : '') + '" onclick="setTab(\'semana\')">Semana</button><button class="tab ' + (state.tab === 'habitos' ? 'active' : '') + '" onclick="setTab(\'habitos\')">Hábitos</button><button class="tab ' + (state.tab === 'progresso' ? 'active' : '') + '" onclick="setTab(\'progresso\')">Progresso</button></div>' +
    '<div id="screen">' +
      (state.tab === 'inicio' ? renderInicio() : '') +
      (state.tab === 'treino' ? renderTreino() : '') +
      (state.tab === 'dieta' ? renderDieta() : '') +
      (state.tab === 'semana' ? renderSemana() : '') +
      (state.tab === 'habitos' ? renderHabitos() : '') +
      (state.tab === 'progresso' ? renderProgresso() : '') +
    '</div>' +
    '<div class="note">Se o vídeo embutido não tocar no Safari, use o botão do YouTube. Se instalou na Tela de Início, remova e adicione novamente após atualizar.</div>';
  renderGuideOnly();
  saveState();
}

render();

window.toggleExercise = toggleExercise;
window.markWorkoutDone = markWorkoutDone;
window.startWorkout = startWorkout;
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
window.setWeekDayPlan = setWeekDayPlan;
window.openVideoExternal = openVideoExternal;
