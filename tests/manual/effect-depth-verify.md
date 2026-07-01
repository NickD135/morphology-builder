# Effect Depth — Verification Runbook

Server (no-cache), from repo root:
```bash
python3 - <<'PY'
import http.server, socketserver
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control','no-store, max-age=0')
        super().end_headers()
socketserver.TCPServer(("0.0.0.0",8091), H).serve_forever()
PY
```

Playwright (Test 2 session set BEFORE navigating; every reload cache-busts):

1. Set `sessionStorage['wordlab_session_v1']` to the Test 2 student session, then `browser_navigate` to `http://localhost:8091/scientist.html?cb=<ts>`.
2. Equip an effect, then assert layers exist and are ordered:
   ```js
   const el = document.querySelector('.lab-charwrap');
   const b = el.querySelector('.wlfx-behind'), f = el.querySelector('.wlfx-front');
   const cz = +getComputedStyle(el.querySelector('svg')).zIndex || 5;
   return { hasBehind: !!b, hasFront: !!f,
            behindZ: +getComputedStyle(b).zIndex, charZ: cz, frontZ: +getComputedStyle(f).zIndex,
            ordered: (+getComputedStyle(b).zIndex < cz) && (cz < +getComputedStyle(f).zIndex) };
   ```
   Expect `hasBehind && hasFront && ordered === true`.
3. Unequip / equip a different effect, then assert zero leftovers:
   ```js
   const el = document.querySelector('.lab-charwrap');
   return { behindNodes: el.querySelectorAll('.wlfx-behind').length,
            frontNodes: el.querySelectorAll('.wlfx-front').length };
   ```
   After stop → both `0`. After switching to another effect → both `1` (idempotent, single pair).
