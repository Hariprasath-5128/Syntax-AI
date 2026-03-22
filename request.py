import requests
import time
import os
from dotenv import load_dotenv

load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")

if not HF_TOKEN:
    raise RuntimeError("HF_TOKEN not found")

API_URL = "https://router.huggingface.co/hf-inference/models/google/codegemma-7b-it"

HEADERS = {
    "Authorization": f"Bearer {HF_TOKEN}",
    "Content-Type": "application/json"
}

PAYLOAD = {
    "inputs": "Write a Python function to sort a list.",
    "parameters": {
        "max_new_tokens": 120,
        "temperature": 0.2,
        "return_full_text": False
    }
}

for attempt in range(1, 6):
    print(f"Attempt {attempt}...")

    r = requests.post(API_URL, headers=HEADERS, json=PAYLOAD, timeout=60)

    if r.status_code == 200:
        print("\n✅ AI Response:")
        print(r.json()[0]["generated_text"])
        break

    elif r.status_code == 503:
        print("⏳ Cold start, retrying...")
        time.sleep(10)

    else:
        print(f"\n❌ Error {r.status_code}")
        print(r.text)
        break
