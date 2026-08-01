import os
import time
import requests

# Local directory where Tekken 8 stores user game data
LOG_DIR = os.path.expandvars(r'%LOCALAPPDATA%\TEKKEN 8\Saved\SaveGames')
DASHBOARD_URL = "https://yourdashboardapi.com"
USER_API_KEY = "USER_SECRET_KEY_HERE"  # Hardcoded or loaded from a config.json file

def parse_latest_match(file_path):
    """
    Safely opens and processes the newest game file to extract match logs.
    Replace this pseudo-logic with your actual binary/text extraction code.
    """
    try:
        with open(file_path, 'rb') as f:
            data = f.read()
            
            # Example payload extraction logic
            match_payload = {
                "user_key": USER_API_KEY,
                "character": "Kazuya",       # Extracted from log
                "opponent": "Reina",         # Extracted from log
                "result": "WIN",             # Extracted from log
                "timestamp": int(time.time())
            }
            return match_payload
    except Exception as e:
        print(f"Error reading match file: {e}")
        return None

def start_watcher():
    print("Tekken 8 Live Dashboard Watcher Started...")
    last_modified = 0
    
    while True:
        try:
            # Find the most recently modified save file in the directory
            files = [os.path.join(LOG_DIR, f) for f in os.listdir(LOG_DIR) if os.path.isfile(os.path.join(LOG_DIR, f))]
            if not files:
                time.sleep(2)
                continue
                
            latest_file = max(files, key=os.path.getmtime)
            current_modified = os.path.getmtime(latest_file)
            
            # If the file changed, a match just concluded
            if current_modified > last_modified and last_modified != 0:
                print("New match data detected! Processing...")
                match_data = parse_latest_match(latest_file)
                
                if match_data:
                    # Push live to your central dashboard database
                    requests.post(DASHBOARD_URL, json=match_data)
                    print("Match synced successfully.")
                    
            last_modified = current_modified
        except Exception as e:
            print(f"Watcher loop error: {e}")
            
        time.sleep(2)  # Check every 2 seconds

if __name__ == "__main__":
    start_watcher()
