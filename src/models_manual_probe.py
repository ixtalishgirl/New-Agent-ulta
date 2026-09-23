import json
import sys
import time
import urllib.request

URL = "https://pancreas-smashing-breeching.ngrok-free.dev/generate"
HEADERS = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
}
PAYLOAD = json.dumps({"prompt": "hi", "max_tokens": 8}).encode("utf-8")

req = urllib.request.Request(URL, data=PAYLOAD, headers=HEADERS, method="POST")
start = time.time()
try:
    with urllib.request.urlopen(req, timeout=20) as resp:
        elapsed = round((time.time() - start) * 1000, 2)
        raw = resp.read()
        status = resp.status
        print("STATUS", status)
        print("ELAPSED_MS", elapsed)
        print("HEADERS", dict(resp.headers))
        print("BODY_BYTES", len(raw))
        print("BODY", raw.decode("utf-8", "replace")[:2000])
except Exception as exc:
    elapsed = round((time.time() - start) * 1000, 2)
    print("ERROR", type(exc).__name__, str(exc), "ELAPSED_MS", elapsed)
