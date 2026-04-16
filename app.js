const exerciseGroups = {
  "Treino A": [
    {name:"Flexão", target:"10-15 reps", tip:"Mantenha o corpo reto e desça controlando.", video:"https://www.youtube.com/watch?v=IODxDxX7oi4", embed:"https://www.youtube.com/embed/IODxDxX7oi4?playsinline=1&rel=0"},
    {name:"Agachamento", target:"15-20 reps", tip:"Desça com o peito aberto e joelhos alinhados.", video:"https://www.youtube.com/watch?v=aclHkVaku9U", embed:"https://www.youtube.com/embed/aclHkVaku9U?playsinline=1&rel=0"},
    {name:"Prancha", target:"30-60s", tip:"Contraia o abdômen e mantenha o quadril firme.", video:"https://www.youtube.com/watch?v=pSHjTRCQxIw", embed:"https://www.youtube.com/embed/pSHjTRCQxIw?playsinline=1&rel=0"}
  ],
  "Treino B": [
    {name:"Afundo", target:"10-12 reps", tip:"Dê um passo confortável e desça em linha reta.", video:"https://www.youtube.com/watch?v=QOVaHwm-Q6U", embed:"https://www.youtube.com/embed/QOVaHwm-Q6U?playsinline=1&rel=0"},
    {name:"Burpee", target:"8-12 reps", tip:"Faça em ritmo constante sem perder a técnica.", video:"https://www.youtube.com/watch?v=TU8QYVW0gDU", embed:"https://www.youtube.com/embed/TU8QYVW0gDU?playsinline=1&rel=0"},
    {name:"Prancha", target:"30-60s", tip:"Contraia o abdômen e mantenha o quadril firme.", video:"https://www.youtube.com/watch?v=pSHjTRCQxIw", embed:"https://www.youtube.com/embed/pSHjTRCQxIw?playsinline=1&rel=0"}
  ],
  "Caminhada": [
    {name:"Caminhada leve", target:"20-40 min", tip:"Mantenha ritmo confortável e contínuo.", video:"https://www.youtube.com/watch?v=ml6cT4AZdqI", embed:"https://www.youtube.com/embed/ml6cT4AZdqI?playsinline=1&rel=0"}
  ]
};

const dietPlan = {
  cafe:["2 a 3 ovos","1 fruta","Café sem açúcar ou com pouco açúcar"],
  almoco:["150 a 200g de frango, peixe ou carne","3 a 5 colheres de arroz","Feijão","Salada à vontade"],
  lanche:["Iogurte natural ou fruta","Castanhas ou amendoim em pequena porção"],
  jantar:["Proteína leve","Legumes ou salada","Carbo moderado se ainda houver fome"],
  evitar:["Refrigerante","Álcool frequente","Fast food frequente","Doces líquidos e exageros à noite"],
  agua:"Meta: 2,5L a 3L por dia"
};

const planOptions = ["Treino A","Treino B","Descanso","Caminhada"];
const defaultWeekPlan = {Seg:"Treino A",Ter:"Treino B",Qua:"Treino A",Qui:"Treino B",Sex:"Treino A",Sab:"Treino B",Dom:"Descanso"};
const phases = ["Adaptação","Base","Intensidade","Definição"];
const KEY = "treino_v8_1_light_stable";
const today = new Date().toISOString().slice(0,10);

const defaultState = {
  tab:"inicio",
  currentIndex:0,
  timerPreset:45,
  timerSeconds:45,
  workoutChecks:{},
  workoutDays:{},
  habits:{},
  history:[],
  weeklyGoal:5,
  measurements:[{date:today,weight:96,waist:108}],
  photo:"",
  weekPlan:defaultWeekPlan,
  profileName:"Lucas",
  profileGoal:"Secar e definir",
  challengeDay:3,
  calorieGoal:2200,
  calorieToday:1800,
  misses:0
};

let state = loadState();
let timerId = null;

function clone(obj){ return JSON.parse(JSON.stringify(obj)); }
function loadState(){
  try{
    const raw = localStorage.getItem(KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      const merged = clone(defaultState);
      Object.keys(parsed).forEach(k => merged[k] = parsed[k]);
      return merged;
    }
    return clone(defaultState);
  } catch(e){
    return clone(defaultState);
  }
}
function saveState(){ localStorage.setItem(KEY, JSON.stringify(state)); }
function addHistory(text){
  const stamp = new Date().toLocaleString("pt-BR");
  state.history.unshift(stamp + " — " + text);
  state.history = state.history.slice(0, 40);
  saveState();
}
function saveProfile(){
  const n = document.getElementById("profileName");
  const g = document.getElementById("profileGoal");
  if(n && g){
    state.profileName = n.value || "Lucas";
    state.profileGoal = g.value || "Secar e definir";
    addHistory("Perfil atualizado");
    render();
  }
}
function saveCalories(){
  const g = document.getElementById("calorieGoal");
  const t = document.getElementById("calorieToday");
  if(g) state.calorieGoal = Number(g.value) || state.calorieGoal;
  if(t) state.calorieToday = Number(t.value) || 0;
  addHistory("Calorias atualizadas");
  render();
}
function weekdayLabel(){ return ["Dom","Seg","Ter","Qua","Qui","Sex","Sab"][new Date().getDay()]; }
function todayPlan(){ return state.weekPlan[weekdayLabel()] || "Treino A"; }
function todayExercises(){
  const p = todayPlan();
  if(p === "Descanso") return [];
  return exerciseGroups[p] || exerciseGroups["Treino A"];
}
function getTodayChecks(){ return state.workoutChecks[today] || {}; }
function setTodayChecks(checks){ state.workoutChecks[today] = checks; saveState(); }
function getTodayHabits(){ return state.habits[today] || {dieta:false, agua:false, sono:false}; }
function setTodayHabits(h){ state.habits[today] = h; saveState(); }
function doneCountToday(){
  const ex = todayExercises();
  const checks = getTodayChecks();
  let count = 0;
  ex.forEach((_, i) => { if(checks[i]) count += 1; });
  return count;
}
function progressToday(){
  const ex = todayExercises();
  if(!ex.length) return state.workoutDays[today] ? 100 : 0;
  return Math.round(doneCountToday() / ex.length * 100);
}
function completedWorkoutDaysCount(){ return Object.values(state.workoutDays).filter(Boolean).length; }
function currentWeekCount(){
  const now = new Date();
  const day = now.getDay();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - day);
  const start = sunday.toISOString().slice(0,10);
  return Object.entries(state.workoutDays).filter(([d, done]) => done && d >= start).length;
}
function calculateStreak(){
  let streak = 0;
  const cursor = new Date();
  while(state.workoutDays[cursor.toISOString().slice(0,10)]){
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
function perfectDaysCount(){
  return Object.values(state.habits).filter(h => h.dieta && h.agua && h.sono).length;
}
function missionStatus(){
  const habits = getTodayHabits();
  return [
    {label:"Treino completo", done:!!state.workoutDays[today]},
    {label:"Seguir dieta", done:!!habits.dieta},
    {label:"Água", done:!!habits.agua},
    {label:"Dormir bem", done:!!habits.sono}
  ];
}
function missionProgress(){
  const m = missionStatus();
  const done = m.filter(x => x.done).length;
  return Math.round(done / m.length * 100);
}
function achievements(){
  const streak = calculateStreak();
  const completed = completedWorkoutDaysCount();
  const perfect = perfectDaysCount();
  return [
    {name:"Primeiro treino", unlocked:completed >= 1},
    {name:"3 dias seguidos", unlocked:streak >= 3},
    {name:"7 dias seguidos", unlocked:streak >= 7},
    {name:"10 treinos", unlocked:completed >= 10},
    {name:"1 dia completo", unlocked:perfect >= 1}
  ];
}
function currentPhase(){
  const week = Math.min(Math.floor((state.challengeDay - 1) / 7), 3);
  return phases[week];
}
function estimatedLossKg(){
  const deficit = Math.max(state.calorieGoal - state.calorieToday, 0);
  return (deficit * 7 / 7700).toFixed(2);
}
function nextStep(){
  if(state.calorieToday > state.calorieGoal) return "Reduzir calorias no restante do dia";
  if(state.misses >= 2) return "Voltar para 2 dias seguidos";
  if(!state.workoutDays[today]) return "Completar o treino de hoje";
  return "Fechar missão com água e sono";
}
function feedback(){
  if(state.misses >= 2) return "Você está saindo da linha";
  if(calculateStreak() >= 7) return "Consistência excelente";
  if(calculateStreak() >= 4) return "Bom ritmo";
  return "Mantenha o foco";
}
function toggleExercise(i){
  const checks = getTodayChecks();
  const next = {...checks, [i]: !checks[i]};
  const ex = todayExercises()[i];
  setTodayChecks(next);
  addHistory((ex ? ex.name : "Exercício") + ": " + (next[i] ? "concluído" : "desmarcado"));
  render();
}
function markWorkoutDone(){
  state.workoutDays[today] = !state.workoutDays[today];
  if(state.workoutDays[today]) state.challengeDay = Math.min(state.challengeDay + 1, 30);
  addHistory("Treino do dia " + (state.workoutDays[today] ? "finalizado" : "reaberto"));
  render();
}
function missDay(){ state.misses += 1; addHistory("Dia perdido"); render(); }
function startWorkout(){
  const ex = todayExercises();
  const checks = getTodayChecks();
  let idx = 0;
  for(let i = 0; i < ex.length; i++){ if(!checks[i]) { idx = i; break; } }
  state.currentIndex = idx;
  state.tab = "treino";
  render();
}
function nextExercise(){
  const ex = todayExercises();
  if(state.currentIndex < ex.length - 1){ state.currentIndex += 1; renderGuideOnly(); saveState(); }
}
function prevExercise(){
  if(state.currentIndex > 0){ state.currentIndex -= 1; renderGuideOnly(); saveState(); }
}
function markAndNext(){
  const exs = todayExercises();
  const i = state.currentIndex;
  const checks = getTodayChecks();
  const next = {...checks, [i]: true};
  setTodayChecks(next);
  addHistory((exs[i] ? exs[i].name : "Exercício") + ": concluído");
  if(i < exs.length - 1) state.currentIndex += 1;
  render();
}
function setTab(tab){ state.tab = tab; render(); }
function setWeeklyGoal(val){
  const n = Number(val);
  if(!isNaN(n) && n > 0 && n <= 14){ state.weeklyGoal = n; render(); }
}
function toggleHabit(name){
  const current = getTodayHabits();
  const h = {...current, [name]: !current[name]};
  setTodayHabits(h);
  addHistory(name + ": " + (h[name] ? "feito" : "desmarcado"));
  render();
}
function setWeekDayPlan(day, value){ state.weekPlan[day] = value; addHistory("Plano " + day + ": " + value); render(); }
function formatTime(total){
  const min = String(Math.floor(total / 60)).padStart(2, "0");
  const sec = String(total % 60).padStart(2, "0");
  return min + ":" + sec;
}
function setTimerPreset(value){ state.timerPreset = value; state.timerSeconds = value; stopTimer(); saveState(); renderGuideOnly(); }
function startTimer(){
  stopTimer();
  timerId = setInterval(() => {
    if(state.timerSeconds > 0){
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
function stopTimer(){ if(timerId) clearInterval(timerId); timerId = null; }
function resetTimer(){ stopTimer(); state.timerSeconds = state.timerPreset; saveState(); renderGuideOnly(); }
function saveMeasurement(){
  const date = document.getElementById("measureDate").value || today;
  const weight = Number(document.getElementById("measureWeight").value);
  const waist = Number(document.getElementById("measureWaist").value);
  if(!weight && !waist) return;
  state.measurements.push({date, weight: weight || null, waist: waist || null});
  state.measurements.sort((a, b) => a.date.localeCompare(b.date));
  addHistory("Medição salva: " + date);
  render();
}
function handlePhotoUpload(event){
  const file = event.target.files && event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    state.photo = e.target.result;
    addHistory("Foto de progresso atualizada");
    render();
  };
  reader.readAsDataURL(file);
}
function simpleLineChart(values, color){
  const clean = values.filter(v => typeof v === "number");
  if(clean.length < 2) return '<div class="small" style="text-align:center">Adicione mais registros para ver o gráfico.</div>';
  const width = 320, height = 160;
  const min = Math.min(...clean), max = Math.max(...clean), range = max - min || 1;
  const points = [];
  values.forEach((v, idx) => {
    if(typeof v !== "number") return;
    const x = (idx / Math.max(values.length - 1, 1)) * (width - 20) + 10;
    const y = height - (((v - min) / range) * (height - 30) + 15);
    points.push(`${x},${y}`);
  });
  return `<svg viewBox="0 0 ${width} ${height}" class="svg-chart" preserveAspectRatio="none"><polyline fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" points="${points.join(" ")}" /></svg>`;
}
function renderAchievements(){
  return achievements().map(item => `<div class="card"><div class="row-between"><div style="font-weight:900;">${item.name}</div><div class="badge ${item.unlocked ? "badge-green" : "badge-gray"}">${item.unlocked ? "Liberada" : "Bloqueada"}</div></div></div>`).join("");
}
function renderVideoEmbed(ex){
  return `<div class="video-wrap"><iframe class="video" src="${ex.embed}" title="${ex.name}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div><a class="link" href="${ex.video}" target="_blank" rel="noreferrer">Abrir no YouTube se o vídeo não tocar</a>`;
}
function openVideoExternal(url){ window.location.href = url; }
function renderGuideOnly(){
  const guide = document.getElementById("guideBox");
  if(!guide) return;
  const exs = todayExercises();
  if(!exs.length){
    guide.innerHTML = `<div class="rest-box"><div style="font-size:18px;font-weight:900;">Hoje é dia de descanso</div><div class="muted" style="margin-top:8px;">Use o dia para recuperar, caminhar leve ou apenas manter a rotina de hábitos.</div></div>`;
    return;
  }
  const i = state.currentIndex;
  const ex = exs[i];
  const done = !!getTodayChecks()[i];
  guide.innerHTML = `
    <div class="row-between">
      <div><div class="exercise-name">${ex.name}</div><div class="muted">${ex.target}</div></div>
      <div class="badge ${done ? "badge-green" : "badge-gray"}">${done ? "Feito" : `${i+1}/${exs.length}`}</div>
    </div>
    ${renderVideoEmbed(ex)}
    <div class="tip">${ex.tip}</div>
    <div class="timer">${formatTime(state.timerSeconds)}</div>
    <div class="small" style="text-align:center">Timer de descanso</div>
    <div class="grid-3" style="margin-top:14px;">
      <button class="btn btn-soft" onclick="setTimerPreset(45)">45s</button>
      <button class="btn btn-soft" onclick="setTimerPreset(60)">60s</button>
      <button class="btn btn-soft" onclick="setTimerPreset(90)">90s</button>
    </div>
    <div class="grid-3" style="margin-top:10px;">
      <button class="btn btn-primary" onclick="startTimer()">Iniciar</button>
      <button class="btn btn-soft" onclick="stopTimer()">Pausar</button>
      <button class="btn btn-soft" onclick="resetTimer()">Resetar</button>
    </div>
    <div class="grid-2" style="margin-top:10px;">
      <button class="btn btn-dark" onclick="openVideoExternal('${ex.video}')">Abrir vídeo</button>
      <button class="btn ${done ? "btn-green" : "btn-gray"}" onclick="markAndNext()">${done ? "Próximo" : "Marcar e próximo"}</button>
    </div>
    <div class="grid-2" style="margin-top:10px;">
      <button class="btn btn-soft" onclick="prevExercise()">Anterior</button>
      <button class="btn btn-soft" onclick="nextExercise()">Próximo</button>
    </div>`;
}
function safeVal(v, suffix){ return (v === null || v === undefined) ? "-" : `${v}${suffix}`; }
function renderInicio(){
  const latest = state.measurements[state.measurements.length - 1] || {};
  const habits = getTodayHabits();
  const perfectToday = habits.dieta && habits.agua && habits.sono;
  const mout = missionStatus().map(m => `<div class="mission-item"><div class="row-between"><div style="font-weight:800">${m.label}</div><div class="badge ${m.done ? "badge-green" : "badge-gray"}">${m.done ? "Ok" : "Pendente"}</div></div></div>`).join("");
  let daysOut = "";
  for(let i = 1; i <= 7; i++){
    const active = i === ((state.challengeDay - 1) % 7) + 1;
    const done = i < ((state.challengeDay - 1) % 7) + 1;
    daysOut += `<div class="day-card ${active ? "active" : ""} ${done ? "done" : ""}"><div class="small">Dia</div><div style="font-weight:900;margin-top:4px">${i}</div></div>`;
  }
  return `
    <div class="card"><div class="row-between"><div><div class="small">TRANSFORMAÇÃO</div><div style="font-size:24px;font-weight:900;margin-top:6px">${state.profileGoal}</div><div class="muted" style="margin-top:6px">${feedback()}</div></div><div class="badge badge-purple">${currentPhase()}</div></div></div>
    <div class="card"><div class="small">PERSONALIZAÇÃO</div><div class="grid-2" style="margin-top:10px;"><input id="profileName" type="text" value="${state.profileName}" placeholder="Seu nome" /><input id="profileGoal" type="text" value="${state.profileGoal}" placeholder="Sua meta" /></div><button class="btn btn-ghost" style="margin-top:10px;" onclick="saveProfile()">Salvar perfil</button></div>
    <div class="focus">
      <div class="row-between"><div><div class="small" style="color:#51634d">MISSÃO DE HOJE</div><div style="font-size:24px;font-weight:900;margin-top:8px;color:#17212b">${todayPlan()}</div><div class="muted" style="margin-top:6px;color:#51634d">${weekdayLabel()} • Dia ${state.challengeDay} de 30</div></div><div class="badge ${todayPlan()==="Descanso" ? "badge-rest" : perfectToday ? "badge-green" : "badge-accent"}">${todayPlan()==="Descanso" ? "Descanso" : `${missionProgress()}%`}</div></div>
      <div class="progress"><div class="fill" style="width:${missionProgress()}%"></div></div>
      <button class="btn btn-primary" style="margin-top:14px;" onclick="startWorkout()">Começar treino</button>
      <button class="btn btn-soft" style="margin-top:10px;" onclick="missDay()">Marcar deslize</button>
    </div>
    <div class="section-title">Missões do dia</div>
    <div class="mission-grid">${mout}</div>
    <div class="section-title">Desafio 30 dias</div>
    <div class="card"><div class="row-between"><div><div class="small">JORNADA</div><div style="font-size:24px;font-weight:900;margin-top:8px">Dia ${state.challengeDay} de 30</div><div class="muted" style="margin-top:6px">${currentPhase()}</div></div><div class="badge badge-purple">Em curso</div></div><div class="day-track">${daysOut}</div></div>
    <div class="section-title">Resumo da semana</div>
    <div class="grid-3">
      <div class="summary-box"><div class="label">Streak</div><div class="value">${calculateStreak()}</div></div>
      <div class="summary-box"><div class="label">Meta</div><div class="value">${currentWeekCount()}/${state.weeklyGoal}</div></div>
      <div class="summary-box"><div class="label">Perda est.</div><div class="value">${estimatedLossKg()}kg</div></div>
    </div>
    <div class="grid-2" style="margin-top:12px;">
      <div class="metric"><div class="label">Peso atual</div><div class="value">${safeVal(latest.weight, " kg")}</div></div>
      <div class="metric"><div class="label">Cintura</div><div class="value">${safeVal(latest.waist, " cm")}</div></div>
    </div>
    <div class="section-title">Conquistas</div>
    ${renderAchievements()}
  `;
}
function renderTreino(){
  const exs = todayExercises();
  if(!exs.length){
    return `<div class="card"><div style="font-size:18px;font-weight:900;">Dia de descanso</div><div class="muted" style="margin-top:8px;">Seu plano de hoje está como descanso. Você pode mudar isso na aba Semana.</div><div class="rest-box"><div style="font-weight:900;">Sugestão</div><div class="muted" style="margin-top:8px;">Faça uma caminhada leve, alongamento ou foque na dieta e hidratação.</div></div></div>`;
  }
  const list = exs.map((ex, i) => {
    const done = !!getTodayChecks()[i];
    return `<div class="plan-item"><div class="row-between"><div style="padding-right:10px;flex:1;"><div class="plan-title">${ex.name}</div><div class="muted">${ex.target}</div><div class="tip">${ex.tip}</div></div><div class="badge ${done ? "badge-green" : "badge-gray"}">${done ? "Feito" : "Pendente"}</div></div>${renderVideoEmbed(ex)}<div class="grid-2" style="margin-top:14px;"><button class="btn btn-primary" onclick="openVideoExternal('${ex.video}')">Abrir vídeo</button><button class="btn ${done ? "btn-green" : "btn-gray"}" onclick="toggleExercise(${i})">${done ? "Concluído" : "Marcar"}</button></div></div>`;
  }).join("");
  return `<div class="card"><div class="row-between"><div><div style="font-size:18px;font-weight:900;">Treino guiado</div><div class="muted">${todayPlan()}</div></div><div class="badge ${state.workoutDays[today] ? "badge-green" : "badge-gray"}">${state.workoutDays[today] ? "Dia finalizado" : "Dia aberto"}</div></div><div id="guideBox" class="guide-box"></div><button class="btn ${state.workoutDays[today] ? "btn-green" : "btn-dark"}" style="margin-top:14px;" onclick="markWorkoutDone()">${state.workoutDays[today] ? "Treino concluído hoje" : "Finalizar treino do dia"}</button></div><div class="section-title">Exercícios de hoje</div>${list}`;
}
function renderHabitos(){
  const habits = getTodayHabits();
  const items = [
    {key:"dieta", label:"Segui a dieta"},
    {key:"agua", label:"Bebi água suficiente"},
    {key:"sono", label:"Dormi bem"}
  ];
  const habitRows = items.map(item => `<div class="habit-item" style="margin-top:12px;"><div class="checkbox-row"><div style="font-weight:800;">${item.label}</div><button class="toggle ${habits[item.key] ? "on" : ""}" onclick="toggleHabit('${item.key}')"></button></div></div>`).join("");
  const history = state.history.length ? state.history.slice(0,10).map(h => `<div class="history-item">${h}</div>`).join("") : `<div class="history-item">Ainda não há atividades registradas.</div>`;
  return `
    <div class="card"><div style="font-size:18px;font-weight:900;">Hábitos essenciais</div><div class="muted">Isso acelera o resultado.</div>${habitRows}</div>
    <div class="card"><div class="row-between"><div><div style="font-size:18px;font-weight:900;">Calorias do dia</div><div class="muted">Controle simples de déficit</div></div><div class="badge badge-accent">${estimatedLossKg()}kg/sem</div></div><input id="calorieGoal" type="number" value="${state.calorieGoal}" placeholder="Meta calórica" /><input id="calorieToday" type="number" value="${state.calorieToday}" placeholder="Consumido hoje" /><button class="btn btn-primary" style="margin-top:10px;" onclick="saveCalories()">Salvar calorias</button><div class="muted" style="margin-top:10px;">Próxima ação: ${nextStep()}</div></div>
    <div class="card"><div class="row-between"><div><div style="font-size:18px;font-weight:900;">Meta semanal</div><div class="muted">Treinos por semana</div></div><div class="badge badge-accent">${currentWeekCount()}/${state.weeklyGoal}</div></div><div class="grid-3" style="margin-top:14px;"><button class="btn btn-soft" onclick="setWeeklyGoal(3)">3x</button><button class="btn btn-soft" onclick="setWeeklyGoal(5)">5x</button><button class="btn btn-soft" onclick="setWeeklyGoal(6)">6x</button></div></div>
    <div class="section-title">Histórico recente</div>
    <div class="list">${history}</div>
  `;
}
function renderProgresso(){
  const weights = state.measurements.map(m => m.weight);
  const waists = state.measurements.map(m => m.waist);
  const labels = state.measurements.slice(-4).map(m => m.date.slice(5));
  const history = state.measurements.slice().reverse().map(m => `<div class="measure-item">${m.date} — ${safeVal(m.weight, " kg")} • ${safeVal(m.waist, " cm")}</div>`).join("");
  return `
    <div class="card"><div style="font-size:18px;font-weight:900;">Registrar medição</div><div class="grid-2" style="margin-top:12px;"><input id="measureWeight" type="number" step="0.1" placeholder="Peso (kg)" /><input id="measureWaist" type="number" step="0.1" placeholder="Cintura (cm)" /></div><input id="measureDate" type="date" value="${today}" style="margin-top:10px;" /><button class="btn btn-primary" style="margin-top:10px;" onclick="saveMeasurement()">Salvar medição</button></div>
    <div class="chart"><div style="font-weight:900;">Gráfico de peso</div>${simpleLineChart(weights, "#7a9c78")}<div class="chart-labels">${labels.map(l => `<div>${l}</div>`).join("")}</div></div>
    <div class="chart"><div style="font-weight:900;">Gráfico de cintura</div>${simpleLineChart(waists, "#c9a876")}<div class="chart-labels">${labels.map(l => `<div>${l}</div>`).join("")}</div></div>
    <div class="section-title">Fotos semanais</div>
    <div class="card"><label class="file-label" for="photoInput">Escolher foto de progresso</label><input id="photoInput" type="file" accept="image/*" onchange="handlePhotoUpload(event)" />${state.photo ? `<img src="${state.photo}" alt="Foto de progresso" class="photo-preview" />` : `<div class="photo-preview"></div>`}</div>
    <div class="section-title">Histórico de medições</div>
    <div class="list">${history}</div>
  `;
}
function renderDieta(){
  const block = (title, arr) => `<div class="diet-item"><div class="diet-title">${title}</div><ul class="diet-list">${arr.map(i => `<li>${i}</li>`).join("")}</ul></div>`;
  return `<div class="card"><div style="font-size:18px;font-weight:900;">Plano alimentar simples</div><div class="muted" style="margin-top:6px;">${dietPlan.agua}</div></div>${block("Café da manhã", dietPlan.cafe)}${block("Almoço", dietPlan.almoco)}${block("Lanche", dietPlan.lanche)}${block("Jantar", dietPlan.jantar)}${block("Evitar", dietPlan.evitar)}`;
}
function renderSemana(){
  const days = ["Seg","Ter","Qua","Qui","Sex","Sab","Dom"];
  const items = days.map(day => {
    const current = state.weekPlan[day] || "Treino A";
    return `<div class="week-item"><div class="row-between"><div><div style="font-weight:900;">${day}</div><div class="muted">Plano atual: ${current}</div></div><select onchange="setWeekDayPlan('${day}', this.value)">${planOptions.map(opt => `<option value="${opt}"${current === opt ? " selected" : ""}>${opt}</option>`).join("")}</select></div></div>`;
  }).join("");
  return `<div class="card"><div style="font-size:18px;font-weight:900;">Treinos da semana</div><div class="muted">Troque qualquer dia quando precisar.</div></div><div class="list">${items}</div>`;
}
function render(){
  document.getElementById("app").innerHTML = `
    <div class="hero"><div class="row"><div class="avatar">${(state.profileName || "L").charAt(0).toUpperCase()}</div><div style="flex:1;"><div class="small" style="color:#7a9c78">APP PREMIUM</div><h1 class="hero-title">${state.profileName}, foco em <span class="accent">transformação</span></h1><p class="hero-sub">${state.profileGoal}</p></div></div></div>
    <div class="tabs">
      <button class="tab ${state.tab === "inicio" ? "active" : ""}" onclick="setTab('inicio')">Início</button>
      <button class="tab ${state.tab === "treino" ? "active" : ""}" onclick="setTab('treino')">Treino</button>
      <button class="tab ${state.tab === "dieta" ? "active" : ""}" onclick="setTab('dieta')">Dieta</button>
      <button class="tab ${state.tab === "semana" ? "active" : ""}" onclick="setTab('semana')">Semana</button>
      <button class="tab ${state.tab === "habitos" ? "active" : ""}" onclick="setTab('habitos')">Hábitos</button>
      <button class="tab ${state.tab === "progresso" ? "active" : ""}" onclick="setTab('progresso')">Progresso</button>
    </div>
    <div id="screen">${state.tab === "inicio" ? renderInicio() : ""}${state.tab === "treino" ? renderTreino() : ""}${state.tab === "dieta" ? renderDieta() : ""}${state.tab === "semana" ? renderSemana() : ""}${state.tab === "habitos" ? renderHabitos() : ""}${state.tab === "progresso" ? renderProgresso() : ""}</div>
    <div class="note">Se o vídeo embutido não tocar no Safari, use o botão do YouTube. Remova e adicione de novo à Tela de Início após atualizar.</div>
  `;
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
window.saveProfile = saveProfile;
window.saveCalories = saveCalories;
window.missDay = missDay;
