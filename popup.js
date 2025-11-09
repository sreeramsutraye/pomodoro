const timeEl   = document.getElementById("time");
const phaseChip= document.getElementById("phaseChip");
const subtitle = document.getElementById("subtitle");
const cycleEl  = document.getElementById("cycle");
const statusDot= document.getElementById("statusDot");
const ring     = document.getElementById("ring");

const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const resetBtn = document.getElementById("reset");
const skipBtn  = document.getElementById("skip");
const opts     = document.getElementById("opts");

let tickTimer = null;

const titleFor = (p) => p === "focus" ? "Focus" : p === "long" ? "Long Break" : "Short Break";
const subtitleFor = (running, p) =>
  running ? (p === "focus" ? "Deep work in progress…" : "Take a breather 😌")
          : "Paused";

function mmss(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

async function getState() {
  return await chrome.runtime.sendMessage({ type: "GET_STATE" });
}

function progressPercent(remaining, total) {
  const pct = Math.max(0, Math.min(1, 1 - remaining / total));
  return Math.round(pct * 100);
}

async function refresh() {
  const { state, settings } = await getState();

  const totalMinutes =
    state.phase === "focus"
      ? settings.focusM
      : state.phase === "long"
      ? settings.longBreakM
      : settings.shortBreakM;

  const totalMs = totalMinutes * 60_000;

  const remaining = state.running && state.endTime
    ? Math.max(0, state.endTime - Date.now())
    : (state.remainingMs ?? totalMs);

  // Progress ring + texts
  const pct = progressPercent(remaining, totalMs);
  ring.style.setProperty("--pct", pct);
  timeEl.textContent = mmss(remaining);

  phaseChip.textContent = titleFor(state.phase);
  subtitle.textContent = subtitleFor(state.running, state.phase);
  cycleEl.textContent = `Cycle: ${state.cycleCount || 0}`;

  // Status dot + pulse
  if (state.running) {
    statusDot.textContent = "Running";
    statusDot.classList.remove("idle");
    statusDot.classList.add("run");
    if (state.phase === "focus") {
      ring.classList.add("pulse");
    } else {
      ring.classList.remove("pulse");
    }
  } else {
    statusDot.textContent = "Idle";
    statusDot.classList.add("idle");
    statusDot.classList.remove("run");
    ring.classList.remove("pulse");
  }

  // Local 1s tick when open
  clearInterval(tickTimer);
  if (state.running && state.endTime) {
    tickTimer = setInterval(() => {
      const ms = Math.max(0, state.endTime - Date.now());
      timeEl.textContent = mmss(ms);
      const p = progressPercent(ms, totalMs);
      ring.style.setProperty("--pct", p);
      if (ms <= 0) clearInterval(tickTimer);
    }, 1000);
  }
}

/* Actions */
startBtn.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "START" });
  refresh();
});
pauseBtn.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "PAUSE" });
  refresh();
});
resetBtn.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "RESET" });
  refresh();
});
skipBtn.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "SKIP" });
});

opts.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "STATE_UPDATED") refresh();
});
window.addEventListener("load", refresh);
document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
