const timeEl    = document.getElementById("time");
const phaseChip = document.getElementById("phaseChip");
const subtitle  = document.getElementById("subtitle");
const cycleEl   = document.getElementById("cycle");
const statusDot = document.getElementById("statusDot");
const ring      = document.getElementById("ring");

const startBtn  = document.getElementById("start");
const pauseBtn  = document.getElementById("pause");
const resetBtn  = document.getElementById("reset");
const skipBtn   = document.getElementById("skip");

const toggleSettingsBtn = document.getElementById("toggleSettings");
const settingsPanel     = document.getElementById("settingsPanel");
const saveBtn           = document.getElementById("saveSettings");
const closeBtn          = document.getElementById("closeSettings");

// Settings inputs
const inputs = {
  focusM: document.getElementById("focusM"),
  shortBreakM: document.getElementById("shortBreakM"),
  longBreakM: document.getElementById("longBreakM"),
  cyclesBeforeLong: document.getElementById("cyclesBeforeLong"),
};

let tickTimer = null;

const titleFor = (p) => p === "focus" ? "Focus" : p === "long" ? "Long Break" : "Short Break";
const subtitleFor = (running, p) =>
  running ? (p === "focus" ? "Deep work in progress…" : "Take a breather 😌") : "Paused";

function mmss(ms){
  const s = Math.max(0, Math.floor(ms/1000));
  return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
}
function progressPercent(remaining, total){
  const pct = Math.max(0, Math.min(1, 1 - remaining/total));
  return Math.round(pct * 100);
}
async function getState(){ return await chrome.runtime.sendMessage({ type:"GET_STATE" }); }

async function loadSettingsIntoUI(){
  const { settings } = await chrome.runtime.sendMessage({ type:"GET_STATE" });
  const s = settings || { focusM:25, shortBreakM:5, longBreakM:15, cyclesBeforeLong:4 };
  inputs.focusM.value = s.focusM;
  inputs.shortBreakM.value = s.shortBreakM;
  inputs.longBreakM.value = s.longBreakM;
  inputs.cyclesBeforeLong.value = s.cyclesBeforeLong;
}

async function saveSettings(){
  const s = {
    focusM: Math.max(1, parseInt(inputs.focusM.value || "0", 10)),
    shortBreakM: Math.max(1, parseInt(inputs.shortBreakM.value || "0", 10)),
    longBreakM: Math.max(1, parseInt(inputs.longBreakM.value || "0", 10)),
    cyclesBeforeLong: Math.max(1, parseInt(inputs.cyclesBeforeLong.value || "0", 10)),
  };
  await chrome.storage.local.set({ settings: s });
  // inform background/popup to refresh calculations
  chrome.runtime.sendMessage({ type: "STATE_UPDATED" }).catch(()=>{});
}

async function refresh(){
  const { state, settings } = await getState();

  const totalMinutes =
    state.phase === "focus" ? settings.focusM :
    state.phase === "long"  ? settings.longBreakM :
                              settings.shortBreakM;
  const totalMs = totalMinutes * 60_000;

  const remaining = state.running && state.endTime
    ? Math.max(0, state.endTime - Date.now())
    : (state.remainingMs ?? totalMs);

  const pct = progressPercent(remaining, totalMs);
  ring.style.setProperty("--pct", pct);
  timeEl.textContent = mmss(remaining);

  phaseChip.textContent = titleFor(state.phase);
  subtitle.textContent = subtitleFor(state.running, state.phase);
  cycleEl.textContent = `Cycle: ${state.cycleCount || 0}`;

  if (state.running){
    statusDot.textContent = "Running";
    statusDot.classList.remove("idle"); statusDot.classList.add("run");
    if (state.phase === "focus") ring.classList.add("pulse"); else ring.classList.remove("pulse");
  } else {
    statusDot.textContent = "Idle";
    statusDot.classList.add("idle"); statusDot.classList.remove("run");
    ring.classList.remove("pulse");
  }

  clearInterval(tickTimer);
  if (state.running && state.endTime){
    tickTimer = setInterval(()=>{
      const ms = Math.max(0, state.endTime - Date.now());
      timeEl.textContent = mmss(ms);
      ring.style.setProperty("--pct", progressPercent(ms, totalMs));
      if (ms <= 0) clearInterval(tickTimer);
    }, 1000);
  }
}

/* Controls */
startBtn.addEventListener("click", async ()=>{ await chrome.runtime.sendMessage({ type:"START" }); refresh(); });
pauseBtn.addEventListener("click", async ()=>{ await chrome.runtime.sendMessage({ type:"PAUSE" }); refresh(); });
resetBtn.addEventListener("click", async ()=>{ await chrome.runtime.sendMessage({ type:"RESET" }); refresh(); });
skipBtn .addEventListener("click", async ()=>{ await chrome.runtime.sendMessage({ type:"SKIP"  }); });

/* Settings panel toggle */
function setSettingsOpen(open){
  if (open){
    settingsPanel.hidden = false;
    toggleSettingsBtn.setAttribute("aria-expanded","true");
    loadSettingsIntoUI();
  } else {
    settingsPanel.hidden = true;
    toggleSettingsBtn.setAttribute("aria-expanded","false");
  }
}
toggleSettingsBtn.addEventListener("click", ()=>{
  const open = settingsPanel.hidden;
  setSettingsOpen(open);
});
closeBtn.addEventListener("click", ()=> setSettingsOpen(false));
saveBtn.addEventListener("click", async ()=>{
  await saveSettings();
  setSettingsOpen(false);
});

/* Sync updates coming from background */
chrome.runtime.onMessage.addListener((msg)=>{ if (msg?.type === "STATE_UPDATED") refresh(); });

window.addEventListener("load", ()=>{ refresh(); });
document.addEventListener("visibilitychange", ()=>{ if (!document.hidden) refresh(); });
