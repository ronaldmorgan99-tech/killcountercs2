# CS2 Aegis Agent & Tablet Dashboard

AEGIS is an AI-powered kill tracker for Counter-Strike 2. It uses a lightweight Windows agent to capture your screen when triggered, crops the kill feed, and passes it through an optional local OCR filter to save API calls. If the kill feed requires visual confirmation, it sends the screenshot to a Gemma-4 Vision model to accurately extract the kills. Results are sent to a real-time Tablet Dashboard hosted on your network.

[SCREENSHOT HERE]

## Table of Contents
1. [System Architecture](#system-architecture)
2. [System Requirements & Dependencies](#system-requirements--dependencies)
3. [Installation & Setup](#installation--setup)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [Building the Executable](#building-the-executable)
7. [User Interface Documentation](#user-interface-documentation)
8. [Advanced Features](#advanced-features)
9. [Troubleshooting](#troubleshooting)

## System Architecture
- **Windows Agent (Python):** Runs locally on your CS2 machine. Listens for the hotkey, takes screenshot, performs local OCR, and pushes images to the dashboard.
- **Backend & AI Integration (Node.js):** Hosts the HTTP API and interfaces with the Gemini API to analyze images using `gemma-4-vision`.
- **Tablet Dashboard (React):** A real-time visual interface accessible from an iPad or secondary monitor to view confirmed eliminations.

## System Requirements & Dependencies
- **OS:** Windows 10 or 11 (for the Agent).
- **Python:** Python 3.10+ (must be in system PATH).
- **Node.js:** Node.js 18+ (if hosting the dashboard locally).
- **CS2:** Counter-Strike 2 running in Fullscreen Borderless or Windowed mode.

**Python Dependencies:**
- `mss` (Fast screen capture)
- `keyboard` (Global hotkey listener)
- `requests` (API communication)
- `Pillow` (Image cropping and processing)
- `pytesseract` (Optional local OCR)
- `python-dotenv` (Environment variables)

## Installation & Setup

### 1. Setup the Dashboard Server
By default, your AI Studio environment hosts the Node server. If running locally:
```bash
npm install
npm run build
npm start
```
Note the URL where the dashboard is hosted. (e.g., `http://192.168.1.50:3000`).

### 2. Configure the Gemini API Key
The server requires a Gemini API key. In AI Studio, this is managed in the Secrets panel. For local execution:
- Rename `.env.example` to `.env`
- Add: `GEMINI_API_KEY="your-api-key"`

### 3. Install Python & Dependencies
Download Python from [python.org](https://python.org). Make sure to check the box: "Add Python to PATH".
Open a terminal in the `client/` folder:
```cmd
cd client
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

*(Optional)* Install Tesseract OCR:
Download and install [Tesseract for Windows](https://github.com/UB-Mannheim/tesseract/wiki). Ensure `tesseract.exe` is in your Windows PATH to enable local OCR fallback.

## Configuration

In the `client/` folder, copy `config.example.json` to `config.json`.

```json
{
  "player_name": "YourInGameName",
  "hotkey": "f9",
  "crop": {
    "top": 20,
    "left": 75,
    "width": 15,
    "height": 15
  },
  "confidence_threshold": 0.7,
  "api_url": "http://YOUR_DASHBOARD_URL_HERE:3000"
}
```

### Hotkey Settings
Change `"hotkey": "f9"` to any valid keybinding string (e.g., `"ctrl+alt+k"`).

### Capture Region Setup
The kill feed region is configured via the `crop` object using percentages of your screen resolution:
- `top`: Percentage from the top edge.
- `left`: Percentage from the left edge.
- `width`: Width of the capture.
- `height`: Height of the capture.
Adjust these values to perfectly frame the CS2 killfeed area on your specific monitor aspect ratio.

## Running the Application

### Starting the Agent
With the virtual environment active in the `client/` folder:
```cmd
python kill_tracker.py
```
*Note: A Windows Firewall or Defender prompt may appear. Click "Allow Access" so the agent can communicate over your local network.*

### Accessing the Tablet Interface
Open the browser on your tablet/iPad and navigate to the `api_url` defined in your config (e.g., `http://192.168.1.50:3000`). Make sure your tablet is connected to the same Wi-Fi network as the server.

### Stopping & Restarting
- **Dashboard:** Press `Ctrl+C` in the Node terminal.
- **Agent:** Focus the Python console and press `Ctrl+C`.

## Building the Executable

You can package the Python agent into a standalone `.exe`.

```cmd
cd client
venv\Scripts\activate
pip install pyinstaller
pyinstaller --onefile --noconsole --name "Aegis_Agent" kill_tracker.py
```

The executable will be generated at `client/dist/Aegis_Agent.exe`. Move this file to any folder you like. It will automatically read `<your-folder>/config.json` next to it. 

*(Warning: Since `--noconsole` is used, the script runs in the background. To close it, use Task Manager: Details -> Aegis_Agent.exe -> End Task.)*

## User Interface Documentation

### 1. Windows System Tray Menu
**Location:** Windows taskbar running in the background.
**Displays:** A red AEGIS icon allowing you to manage the Python agent.
- **Right-Click Menu:**
  - **Quit Aegis Agent:** Safely shuts down the hotkey listener and background worker.

### 2. Header & Status Indicators
**Location:** Top of the Dashboard.
**Displays:**
- Application Title and Version.
- **Connection Indicator:** Shows "API: Connected" when the dashboard is securely connected to the backend.
- **Hotkey Setting:** Displays the hotkey used by the agent (e.g., `[F9]`).
- **Settings Button:** A cog icon to flip the interface to the Configuration view.

### 3. Session Statistics (Sidebar)
**Location:** Left Panel.
**Displays:**
- **Total Kills:** The total number of confirmed eliminations in the current session.
- **Agent Profile:** Displays the configured active `Player_Name`.
- **System Health:** A progress bar that visually represents the connection stability and backend health (e.g., websocket connection state and system latency). When connected, it shows a stable percentage (e.g., 85%), indicating the server is running and ready for analysis requests.
- **Tablet Connection:** Shows active polling endpoint.

### 4. Live Detection Log (Main Area)
**Location:** Center/Lower Area.
**Displays:** A table of all recent kills.
- **Columns:** Timestamp, Action Status, Victim Detected, Inference Source (Gemma or OCR).
**Behavior:** Automatically updates in real-time. Automatically scrolls to the newest log. If no kills are recorded, displays a "Awaiting Combat Data" placeholder.
[SCREENSHOT HERE]

### 5. Vision Model Analysis Panel
**Location:** Right Sidebar.
**Displays:**
- A wireframe visual indicator showing the currently processing frame. Dims when idle, pulses blue when actively performing an HTTP call to Gemini.
- **Model Intelligence Status:** Shows raw JSON output or a mocking block of the confidence score, last victim, and engine status.
- **Clear Model Cache Button:** Erases the current front-end cache. (Currently a UI element).

### Setup Instructions & Settings UI
**Location:** Accessed via the top-right Settings Cog.
**Displays:** Instructions and settings for configuring the Windows Agent and connecting it to the Dashboard.
- **In-Game Player Name (Field):** Input field to set your exact CS2 username. Stored locally to ensure the dashboard accurately identifies your kills.
- **Capture Region configuration:** Visual reference displaying your current static Kill Feed crop configuration (`Top`, `Left`, `Width`, `Height` percentages) that should be copied into `config.json`.
- **Agent Target:** Instructions for assigning the Player Name.
- **Integration Endpoint:** Provides the EXACT URL the Python client needs in its `api_url` configuration.
- **Save & Return Button:** Saves the in-game player name locally and flips the view back to the main UI.

### HTTP API Endpoints
**Location:** Internal network service over port 3000.
**Endpoints:**
- `GET /api/kills`: Returns the full kill history and total count in JSON format.
- `GET /api/config`: Returns the current configuration settings (player name, crop coordinates).
- `POST /api/capture`: Used by the Agent to push screen captures (base64) for Vision Model analysis.
- `POST /api/report-kill`: Used internally to register valid confirmed kills.

## Advanced Features

### Local OCR Fallback
To save API usage and latency, the system optionally utilizes `pytesseract`. If the agent captures the screen and local OCR detects your `player_name` with high confidence, it immediately logs the kill and bypasses the Gemma 4 Vision API call entirely. 

### Duplicate Suppression
If you spam the hotkey during a firefight, multiple screenshots might capture the identical kill feed. The server maintains a rolling 5-second cache. If a kill containing the identical Victim Name is detected within 5 seconds of the last instance, the duplicate is suppressed and not added to the log.

### Logging System
All confirmed eliminations are appended to `cs2_kills.log` at the root of the project running the Node server.
Format: `[TIMESTAMP] VICTIM: VictimName | CONF: 0.99`

## Troubleshooting

- **Agent doesn't capture / Hotkey fails:** Ensure `keyboard` has administrator privileges. Run your command prompt or `Aegis_Agent.exe` as Administrator.
- **"Connection Refused" in Python Console:** The agent cannot reach the Node server. Make sure the Node server is running and the `api_url` in `config.json` correctly matches the dashboard IP/Port. Check Windows Firewall rules.
- **Gemini Returns "0 Kills" frequently:** Your configured `crop` region is likely misaligned, or your `player_name` in `config.json` does not identically match your CS2 in-game name (including capitalization).
- **Tablet interface doesn't load:** The Node server must be bound to `0.0.0.0` (which it is by default). Ensure your tablet is not isolated on a Guest Wi-Fi. Access via the Host PC's localized IPv4 address (e.g. `http://192.168.1.X:3000`).
