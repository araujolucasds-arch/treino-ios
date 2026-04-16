let state=JSON.parse(localStorage.getItem("v12_personal"))||{
  tab:"home",
  progress:30,
  streak:4,
  premium:true
};

function save(){localStorage.setItem("v12_personal",JSON.stringify(state));}
function switchTab(t){state.tab=t;save();render();}

function coach(){
  if(state.progress<30) return "Você começou. Não pare.";
  if(state.progress<60) return "Consistência está te levando longe.";
  if(state.progress<90) return "Você está muito perto do resultado.";
  return "Resultado desbloqueado. Continue.";
}

function complete(){
  state.progress=Math.min(state.progress+10,100);
  state.streak+=1;
  save();
  render();
}

function renderHome(){
  return `<div class="header">Hoje</div>
  <div class="card">
    <div class="badge">Missão do dia</div>
    <div style="margin-top:10px;font-weight:700;">Treino + dieta + água</div>
    <div class="progress"><div class="fill" style="width:${state.progress}%"></div></div>
    <div style="margin-top:8px;color:#6b7280;">${state.progress}% concluído</div>
  </div>
  <div class="card">
    <div style="font-weight:700;">Streak: ${state.streak} dias</div>
    <div style="margin-top:8px;color:#6b7280;"><i>${coach()}</i></div>
  </div>
  <button class="btn primary" onclick="complete()">Completar dia</button>`;
}

function renderTreino(){
  return `<div class="header">Treino</div>
  <div class="card">
    <div style="font-weight:700;">Treino de hoje</div>
    <div style="margin-top:10px;line-height:1.8;">
      Flexão - 15 reps<br>
      Agachamento - 20 reps<br>
      Prancha - 40s
    </div>
  </div>`;
}

function renderPremium(){
  return `<div class="header">Plano</div>
  <div class="card">
    <div style="font-weight:700;">Plano pessoal liberado</div>
    <div style="margin-top:10px;color:#6b7280;">Uso pessoal ativo, sem bloqueios de assinatura.</div>
  </div>
  <div class="card">
    <div style="font-weight:700;">Dieta base</div>
    <div style="margin-top:10px;line-height:1.7;color:#374151;">
      Café: ovos + fruta<br>
      Almoço: proteína + arroz + feijão + salada<br>
      Jantar: proteína + legumes
    </div>
  </div>`;
}

function render(){
  let content="";
  if(state.tab==="home") content=renderHome();
  if(state.tab==="treino") content=renderTreino();
  if(state.tab==="premium") content=renderPremium();

  document.getElementById("app").innerHTML=content+
  `<div class="tabbar">
    <div class="tab ${state.tab==="home"?"active":""}" onclick="switchTab('home')">Home</div>
    <div class="tab ${state.tab==="treino"?"active":""}" onclick="switchTab('treino')">Treino</div>
    <div class="tab ${state.tab==="premium"?"active":""}" onclick="switchTab('premium')">Plano</div>
  </div>`;
}

render();
