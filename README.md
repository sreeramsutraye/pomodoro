# 🍅 Focus Tomato (Pomodoro Timer)

A beautiful and functional Pomodoro timer Chrome extension that helps you stay focused and productive using the Pomodoro Technique. Built with Manifest V3, it features customizable timers, visual progress tracking, notifications, and a sleek user interface.

## ✨ Features

- **Customizable Timers**: Set your preferred focus, short break, and long break durations
- **Cycle Tracking**: Automatically switches to long breaks after completing a set number of focus cycles
- **Visual Progress Ring**: Real-time circular progress indicator showing time remaining
- **Badge Countdown**: Extension icon badge displays remaining minutes for quick reference
- **Desktop Notifications**: Get notified when each phase (focus/break) completes
- **Timer Controls**: Start, pause, reset, and skip functionality
- **Persistent State**: Timer continues running even when the popup is closed
- **Modern UI**: Clean, minimalist interface with smooth animations
- **Settings Panel**: Easy-to-access settings directly from the popup

## 🚀 Installation

### From Chrome Web Store (if published)
1. Visit the Chrome Web Store listing
2. Click "Add to Chrome"
3. Confirm the installation

### Manual Installation (Developer Mode)
1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right)
4. Click "Load unpacked"
5. Select the `pomodoro` directory containing the extension files
6. The extension icon should now appear in your Chrome toolbar

## 📖 Usage

### Basic Usage

1. **Click the extension icon** in your Chrome toolbar to open the popup
2. **Start a session**: Click the "Start" button to begin a focus timer
3. **Monitor progress**: Watch the circular progress ring and time display
4. **Take breaks**: The timer automatically switches between focus and break periods
5. **Control the timer**: Use the Start, Pause, Reset, or Skip buttons as needed

### Timer Phases

- **Focus Phase**: Default 25 minutes of focused work
- **Short Break**: Default 5 minutes break after each focus session
- **Long Break**: Default 15 minutes break after every 4 focus cycles

### Customizing Settings

1. Click the settings icon (⚙️) in the popup
2. Adjust the following settings:
   - **Focus Duration**: Length of focus sessions (minutes)
   - **Short Break**: Length of short breaks (minutes)
   - **Long Break**: Length of long breaks (minutes)
   - **Cycles Before Long Break**: Number of focus sessions before a long break
3. Click "Save" to apply your changes

### Badge Indicator

The extension icon badge shows:
- **Remaining minutes** while the timer is running
- **⏸** when the timer is paused
- **—** when the timer is idle

## 🛠️ Technical Details

### Built With

- **Manifest V3**: Latest Chrome extension architecture
- **Vanilla JavaScript**: No framework dependencies
- **Chrome APIs**: 
  - `chrome.alarms` - Timer functionality
  - `chrome.notifications` - Desktop notifications
  - `chrome.storage` - Persistent state and settings
  - `chrome.action` - Badge updates

### File Structure

```
pomodoro/
├── icons/              # Extension icons (16x16, 48x48, 128x128)
├── manifest.json       # Extension manifest
├── popup.html          # Popup UI structure
├── popup.css           # Popup styles
├── popup.js            # Popup logic and UI updates
├── sw.js               # Service worker (background script)
├── options.html        # Options page
├── options.js          # Options page logic
└── README.md           # This file
```

### Default Settings

- Focus Duration: 25 minutes
- Short Break: 5 minutes
- Long Break: 15 minutes
- Cycles Before Long Break: 4

## 🔧 Development

### Prerequisites

- Google Chrome browser
- Basic knowledge of JavaScript and Chrome Extension APIs

### Local Development

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd pomodoro
   ```

2. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `pomodoro` directory

3. Make changes to the code
4. Reload the extension in `chrome://extensions/` to see changes
5. Test the extension functionality

### Key Components

- **Service Worker (sw.js)**: Handles timer logic, alarms, notifications, and state management
- **Popup (popup.js)**: Manages UI updates, user interactions, and real-time timer display
- **Options (options.js)**: Handles settings persistence and configuration

## 📝 Permissions

This extension requires the following permissions:

- **alarms**: To schedule and manage timer alarms
- **notifications**: To show desktop notifications when phases complete
- **storage**: To persist timer state and user settings locally

## 🎯 Pomodoro Technique

The Pomodoro Technique is a time management method that uses a timer to break work into intervals, traditionally 25 minutes in length, separated by short breaks. This extension implements this technique with customizable intervals to fit your workflow.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License (or your preferred license).

## 🙏 Acknowledgments

- Inspired by the Pomodoro Technique created by Francesco Cirillo
- Built with modern web technologies and Chrome Extension APIs

---

**Happy focusing! 🍅✨**
