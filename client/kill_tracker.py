# Counter-Strike 2 AI Kill Tracker Agent
import mss
import keyboard
import requests
import json
import base64
import time
import os
import threading
import queue
import hashlib
from datetime import datetime
from PIL import Image
from io import BytesIO
import pystray
from pystray import MenuItem as item
from dotenv import load_dotenv

load_dotenv()

# --- CONFIGURATION ---
CONFIG_FILE = "config.json"
DEFAULT_CONFIG = {
    "player_name": "LocalPlayer",
    "hotkey": "f9",
    "crop": {
        "top": 20,    # Default % from top
        "left": 75,   # Default % from left
        "width": 15,  # Default % width
        "height": 15  # Default % height
    },
    "confidence_threshold": 0.7,
    "api_url": os.getenv("APP_URL", "http://localhost:3000")
}

def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            return {**DEFAULT_CONFIG, **json.load(f)}
    return DEFAULT_CONFIG

config = load_config()
capture_queue = queue.Queue()
recent_kills_cache = {} # Victim -> Timestamp deduplication

def get_crop_box(screen_width, screen_height):
    c = config["crop"]
    left = int(screen_width * (c["left"] / 100))
    top = int(screen_height * (c["top"] / 100))
    right = left + int(screen_width * (c["width"] / 100))
    bottom = top + int(screen_height * (c["height"] / 100))
    return (left, top, right, bottom)

def perform_local_ocr(image):
    """Optional local OCR to save API calls. Requires pytesseract."""
    try:
        import pytesseract
        # Define white color range for CS2 kill feed text
        text = pytesseract.image_to_string(image)
        if config["player_name"].lower() in text.lower():
            # Basic parsing - extremely fast fallback
            return [{"victim": "Local OCR Detected", "confidence": 0.85}]
    except ImportError:
        pass
    return None

def process_worker():
    """Worker thread to handle AI inference without blocking gameplay."""
    while True:
        screenshot_data = capture_queue.get()
        if screenshot_data is None: break
        
        try:
            # MODULAR: OCR Check First
            from PIL import Image
            import io
            img_bytes = base64.b64decode(screenshot_data)
            img = Image.open(io.BytesIO(img_bytes))
            
            try:
                ocr_results = perform_local_ocr(img)
                if ocr_results:
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] OCR match - skipping API.")
                    requests.post(f"{config['api_url']}/api/report-kill", json={"kills": ocr_results})
                    continue
            except Exception as ocr_err:
                print(f"OCR gracefully bypassed: {ocr_err}")

            # API Inference
            response = requests.post(
                f"{config['api_url']}/api/capture",
                json={
                    "screenshot": screenshot_data,
                    "playerName": config["player_name"]
                },
                timeout=10
            )
        except Exception as e:
            print(f"Worker Error: {e}")
        finally:
            capture_queue.task_done()

# Start worker thread
threading.Thread(target=process_worker, daemon=True).start()

def on_trigger():
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Triggering capture...")
    
    with mss.mss() as sct:
        monitor = sct.monitors[1] # Primary monitor
        screenshot = sct.grab(monitor)
        img = Image.frombytes("RGB", screenshot.size, screenshot.bgra, "raw", "BGRX")
        
        # Crop to Kill Feed
        crop_box = get_crop_box(img.width, img.height)
        cropped_img = img.crop(crop_box)
        
        # Convert to Base64
        buffered = BytesIO()
        cropped_img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        
        # Add to processing queue
        capture_queue.put(img_str)

print(f"--- AEGIS AGENT ACTIVE ---")
print(f"Player: {config['player_name']}")
print(f"Hotkey: {config['hotkey'].upper()}")
print(f"Dashboard: {config['api_url']}")

keyboard.add_hotkey(config["hotkey"], on_trigger)

def quit_app(icon, item):
    icon.stop()
    os._exit(0)

def setup_tray():
    # Create a simple red box icon
    image = Image.new('RGB', (64, 64), color = (210, 40, 40))
    menu = (item('Quit Aegis Agent', quit_app),)
    icon = pystray.Icon("Aegis", image, "Aegis Kill Tracker", menu)
    icon.run()

try:
    print("Agent running in background. Check System Tray to exit.")
    setup_tray()
except Exception as e:
    print("Tray error (running purely in console):", e)
    keyboard.wait()
except KeyboardInterrupt:
    print("Exiting...")
