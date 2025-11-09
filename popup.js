const timeEl = document.getElementById("time");
const phaseEl = document.getElementById("phase");
const cycleEl = document.getElementById("cycle");
const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const resetBtn = document.getElementById("reset");
const skipBtn = document.getElementById("skip");
const opts = document.getElementById("opts");

let tickTimer = null;

function mmss(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function titleFor(phase) {
  return phase === "focus"
    ? "Focus"
    : phase === "long"
    ? "Long Break"
    : "Short Break";
}

async function refresh() {
  const { state, settings } = await chrome.runtime.sendMessage({ type: "GET_STATE" });
  phaseEl.textContent = titleFor(state.phase);
  cycleEl.textContent = `Cycle: ${state.cycleCount || 0}`;

  const baseMinutes =
    state.phase === "focus"
      ? settings.focusM
      : state.phase === "long"
      ? settings.longBreakM
      : settings.shortBreakM;

  let remaining = state.running && state.endTime
    ? Math.max(0, state.endTime - Date.now())
    : (state.remainingMs ?? baseMinutes * 60_000);

  timeEl.textContent = mmss(remaining);

  // Maintain a local 1s tick while popup is open
  clearInterval(tickTimer);
  if (state.running && state.endTime) {
    tickTimer = setInterval(() => {
      const ms = Math.max(0, state.endTime - Date.now());
      timeEl.textContent = mmss(ms);
      if (ms <= 0) clearInterval(tickTimer);
    }, 1000);
  }
}

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

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refresh();
});
window.addEventListener("load", refresh);
