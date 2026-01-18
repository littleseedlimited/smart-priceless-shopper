import os
import requests
from dotenv import load_dotenv

load_dotenv()

# Fallback token if not in env
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8572310430:AAG_PxjRMAiAFWtLN0f7SfD4yEWD5l3qnas")

print(f"--- Telegram Bot Diagnostic ---")
print(f"Token (First 10 chars): {TOKEN[:10]}...")

def test_token():
    url = f"https://api.telegram.org/bot{TOKEN}/getMe"
    try:
        res = requests.get(url, timeout=10)
        if res.status_code == 200:
            data = res.json()
            print(f"[OK] Token is VALID!")
            print(f"Bot Name: {data['result']['first_name']}")
            print(f"Bot Username: @{data['result']['username']}")
        else:
            print(f"[ERROR] Token is INVALID! Status Code: {res.status_code}")
            print(f"Response: {res.text}")
    except Exception as e:
        print(f"[ERROR] Connection Error: {e}")

def clear_webhook():
    url = f"https://api.telegram.org/bot{TOKEN}/deleteWebhook"
    try:
        res = requests.get(url, timeout=10)
        if res.status_code == 200:
            print(f"[OK] Webhook deleted/cleared successfully.")
        else:
            print(f"[ERROR] Failed to delete webhook: {res.text}")
    except Exception as e:
        print(f"[ERROR] Error deleting webhook: {e}")

if __name__ == "__main__":
    test_token()
    clear_webhook()
