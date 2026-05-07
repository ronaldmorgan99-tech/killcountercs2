# CS2 Aegis Agent (Windows Client)

This folder contains the Python agent that runs on your Windows gaming PC. It captures your screen, safely crops the kill feed area, and sends it to the central dashboard for AI analysis.

## Project Structure

```
client/
├── kill_tracker.py    # Main Windows agent code
├── requirements.txt   # Python dependencies
├── config.example.json # Example configuration
└── README.md          # This file
```

## Setup Instructions

1. **Install Python 3**: Download and install Python 3.10+ from python.org. Ensure you check "Add Python to PATH" during installation.
2. **Create a Virtual Environment**:
   ```cmd
   cd client
   python -m venv venv
   venv\Scripts\activate
   ```
3. **Install Dependencies**:
   ```cmd
   pip install -r requirements.txt
   ```
4. **Configuration**:
   Copy `config.example.json` to `config.json` and configure it:
   - `player_name`: Your exact in-game CS2 name.
   - `api_url`: The URL of your local Node.js dashboard (e.g., http://192.168.1.50:3000).
   - `hotkey`: The trigger key (default: "f9").
   - `crop`: Percentage-based coordinates for your kill feed. Defaults are optimized for standard 16:9 resolutions.

## Running in Development

Make sure your virtual environment is active, then run:

```cmd
python kill_tracker.py
```

*Note: Windows Defender or your Firewall may ask for network permissions. Allow them so the agent can communicate with your local dashboard.*

## Packaging into a Windows .exe

To create a single, standalone executable that you can run without Python installed, use PyInstaller:

1. Install PyInstaller:
   ```cmd
   pip install pyinstaller
   ```
2. Build the executable:
   ```cmd
   pyinstaller --onefile --noconsole --name "Aegis_Agent" kill_tracker.py
   ```
   *Flags explained:*
   - `--onefile`: Bundles everything into a single `.exe`.
   - `--noconsole`: Hides the command prompt window (runs in the background).

3. The final executable will be located at `dist/Aegis_Agent.exe`.
   - Place this `.exe` in a folder of your choice.
   - Make sure your `config.json` is located in the exact same folder as the `.exe`.

## Multimodal Prompt Used

The system sends the cropped image along with this strict prompt to the Gemma 4 vision model (via the Gemini SDK in the Node dashboard):

```text
This is a Counter-Strike 2 kill feed screenshot. 
Analyze the feed and identify ALL victims killed by "{{PLAYER_NAME}}".
Only include victims where "{{PLAYER_NAME}}" is the killer.
Include a confidence score for each detection.
If no kills are visible for "{{PLAYER_NAME}}", return an empty list.
```

The response is strictly validated against a JSON schema to ensure stability and proper parsing.
