const SETTINGS_KEY = "settings";
const fields = ["focusM", "shortBreakM", "longBreakM", "cyclesBeforeLong"];

async function load() {
  const { settings } = await chrome.storage.local.get(SETTINGS_KEY);
  const s = settings || { focusM: 25, shortBreakM: 5, longBreakM: 15, cyclesBeforeLong: 4 };
  fields.forEach((k) => (document.getElementById(k).value = s[k]));
}

async function save() {
  const s = Object.fromEntries(
    fields.map((k) => [k, Math.max(1, parseInt(document.getElementById(k).value || "0", 10))])
  );
  await chrome.storage.local.set({ [SETTINGS_KEY]: s });
  // Let popup reflect any future changes
  chrome.runtime.sendMessage({ type: "STATE_UPDATED" }).catch(() => {});
  alert("Saved!");
}

document.getElementById("save").addEventListener("click", save);
load();
