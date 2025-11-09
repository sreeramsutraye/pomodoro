const DEFAULTS = {
    focusM: 25,
    shortBreakM: 5,
    longBreakM: 15,
    cyclesBeforeLong: 4
};

const STATE_KEY = "state";
const SETTINGS_KEY = "settings";

/**
 * state shape:
 * {
 *   phase: "focus" | "short" | "long",
 *   running: boolean,
 *   endTime: number | null,          // epoch ms
 *   remainingMs: number | null,      // when paused
 *   cycleCount: number               // completed focus blocks
 * }
 */

chrome.runtime.onInstalled.addListener(async () => {
    const { settings } = await chrome.storage.local.get(SETTINGS_KEY);
    if (!settings) {
        await chrome.storage.local.set({ [SETTINGS_KEY]: DEFAULTS });
    }
    // Initialize default state
    const { state } = await chrome.storage.local.get(STATE_KEY);
    if (!state) {
        await chrome.storage.local.set({
            [STATE_KEY]: {
                phase: "focus",
                running: false,
                endTime: null,
                remainingMs: null,
                cycleCount: 0
            }
        });
    }
    await updateBadge("—");
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== "pomodoro_end") return;

    const [{ state }, { settings }] = await Promise.all([
        chrome.storage.local.get(STATE_KEY),
        chrome.storage.local.get(SETTINGS_KEY)
    ]);

    // Only proceed if we were running
    if (!state?.running) return;

    // Phase transition
    let nextPhase = "short";
    let nextMinutes = settings.shortBreakM;

    if (state.phase === "focus") {
        const nextCycleCount = (state.cycleCount || 0) + 1;
        const useLong = nextCycleCount % settings.cyclesBeforeLong === 0;
        nextPhase = useLong ? "long" : "short";
        nextMinutes = useLong ? settings.longBreakM : settings.shortBreakM;
        state.cycleCount = nextCycleCount;
    } else {
        // Coming from a break -> go to focus
        nextPhase = "focus";
        nextMinutes = settings.focusM;
    }

    const endTime = Date.now() + nextMinutes * 60_000;

    const newState = {
        ...state,
        phase: nextPhase,
        endTime,
        running: true,
        remainingMs: null
    };

    await chrome.storage.local.set({ [STATE_KEY]: newState });
    await chrome.alarms.create("pomodoro_end", { when: endTime });
    await notifyPhase(nextPhase);
    await tickBadgeUntil(endTime);
    await pingPopups();
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    (async () => {
        if (msg?.type === "START") {
            const { settings } = await chrome.storage.local.get(SETTINGS_KEY);
            const { state } = await chrome.storage.local.get(STATE_KEY);

            const minutes =
                state.phase === "focus"
                    ? settings.focusM
                    : state.phase === "long"
                        ? settings.longBreakM
                        : settings.shortBreakM;

            const baseline = state.remainingMs ?? minutes * 60_000;
            const endTime = Date.now() + baseline;

            const newState = {
                ...state,
                running: true,
                endTime,
                remainingMs: null
            };

            await chrome.storage.local.set({ [STATE_KEY]: newState });
            await chrome.alarms.create("pomodoro_end", { when: endTime });
            await tickBadgeUntil(endTime);
            sendResponse({ ok: true });
            await pingPopups();
        }

        if (msg?.type === "PAUSE") {
            const { state } = await chrome.storage.local.get(STATE_KEY);
            if (!state?.running || !state?.endTime) {
                sendResponse({ ok: true });
                return;
            }
            const remainingMs = Math.max(0, state.endTime - Date.now());
            const newState = {
                ...state,
                running: false,
                endTime: null,
                remainingMs
            };
            await chrome.alarms.clear("pomodoro_end");
            await chrome.storage.local.set({ [STATE_KEY]: newState });
            await updateBadge("⏸");
            sendResponse({ ok: true });
            await pingPopups();
        }

        if (msg?.type === "RESET") {
            const { state } = await chrome.storage.local.get(STATE_KEY);
            const newState = {
                ...state,
                running: false,
                endTime: null,
                remainingMs: null,
                phase: "focus"
            };
            await chrome.alarms.clear("pomodoro_end");
            await chrome.storage.local.set({ [STATE_KEY]: newState });
            await updateBadge("—");
            sendResponse({ ok: true });
            await pingPopups();
        }

        if (msg?.type === "SKIP") {
            // Pretend the alarm fired
            await chrome.alarms.create("pomodoro_end", { when: Date.now() + 100 });
            sendResponse({ ok: true });
        }

        if (msg?.type === "GET_STATE") {
            const payload = await chrome.storage.local.get([STATE_KEY, SETTINGS_KEY]);
            sendResponse(payload);
        }
    })();
    // Keep the message channel open for async sendResponse
    return true;
});

async function notifyPhase(phase) {
    const titles = {
        focus: "Time to Focus",
        short: "Short Break",
        long: "Long Break"
    };
    await chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: titles[phase] || "Pomodoro",
        message:
            phase === "focus"
                ? "Let’s get back to deep work."
                : phase === "long"
                    ? "Enjoy a longer break!"
                    : "Stretch, hydrate, breathe."
    });
}

async function updateBadge(text) {
    await chrome.action.setBadgeText({ text: String(text ?? "") });
    await chrome.action.setBadgeBackgroundColor({ color: [220, 38, 38, 255] }); // red
}

// Keep the badge showing the remaining minutes (MM) while running
async function tickBadgeUntil(endTime) {
    // A lightweight single tick — the popup has the nice 1s display.
    const update = async () => {
        const ms = Math.max(0, endTime - Date.now());
        const m = Math.floor(ms / 60_000);
        await updateBadge(m > 99 ? "99" : (m >= 1 ? String(m) : "0"));
    };
    await update();

    // Schedule a cheap minute-based badge update
    chrome.alarms.create("badge_tick", { when: Date.now() + 60_000 });
}
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== "badge_tick") return;
    const { state } = await chrome.storage.local.get(STATE_KEY);
    if (state?.running && state?.endTime) {
        await tickBadgeUntil(state.endTime);
    }
});

async function pingPopups() {
    // Let any open popup refresh its UI
    chrome.runtime.sendMessage({ type: "STATE_UPDATED" }).catch(() => { });
}
