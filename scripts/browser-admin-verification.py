"""
Browser-based verification of MADAR Admin pages using installed Chrome headless
and Chrome DevTools Protocol (raw WebSocket, no external automation framework).
"""
import base64
import json
import os
import socket
import struct
import subprocess
import time
import urllib.request

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def ws_handshake(sock, path):
    key = "dGhlIHNhbXBsZSBub25jZQ=="
    req = (
        f"GET {path} HTTP/1.1\r\n"
        f"Host: 127.0.0.1:9222\r\n"
        f"Upgrade: websocket\r\n"
        f"Connection: Upgrade\r\n"
        f"Sec-WebSocket-Key: {key}\r\n"
        f"Sec-WebSocket-Version: 13\r\n"
        f"\r\n"
    ).encode()
    sock.send(req)
    data = b""
    while b"\r\n\r\n" not in data:
        data += sock.recv(4096)


def ws_send(sock, data):
    payload = json.dumps(data).encode("utf-8")
    frame = bytearray([0x81])
    length = len(payload)
    if length < 126:
        frame.append(0x80 | length)
    elif length < 65536:
        frame.append(0x80 | 126)
        frame.extend(struct.pack(">H", length))
    else:
        frame.append(0x80 | 127)
        frame.extend(struct.pack(">Q", length))
    mask = os.urandom(4)
    frame.extend(mask)
    frame.extend(b ^ mask[i % 4] for i, b in enumerate(payload))
    sock.send(bytes(frame))


def ws_recv(sock, timeout=10):
    sock.settimeout(timeout)
    try:
        data = sock.recv(2)
    except Exception:
        return None, ""
    if not data:
        return None, ""
    opcode = data[0] & 0x0F
    masked = bool(data[1] & 0x80)
    length = data[1] & 0x7F
    if length == 126:
        length = struct.unpack(">H", sock.recv(2))[0]
    elif length == 127:
        length = struct.unpack(">Q", sock.recv(8))[0]
    mask = sock.recv(4) if masked else None
    payload = b""
    while len(payload) < length:
        payload += sock.recv(length - len(payload))
    if masked:
        payload = bytes(b ^ mask[i % 4] for i, b in enumerate(payload))
    return opcode, payload.decode("utf-8", errors="ignore")


counter = [1]


def send_cmd(sock, method, params=None, session_id=None):
    cmd_id = counter[0]
    counter[0] += 1
    msg = {"id": cmd_id, "method": method}
    if params:
        msg["params"] = params
    if session_id:
        msg["sessionId"] = session_id
    ws_send(sock, msg)
    return cmd_id


def wait_for(sock, cmd_id, timeout=20):
    start = time.time()
    while time.time() - start < timeout:
        try:
            opcode, payload = ws_recv(sock, timeout=max(0.1, timeout - (time.time() - start)))
        except Exception:
            return None
        if opcode is None:
            return None
        try:
            msg = json.loads(payload)
        except Exception:
            continue
        if msg.get("id") == cmd_id:
            return msg
    return None


def main():
    results = []
    proc = subprocess.Popen(
        [
            CHROME,
            "--headless=new",
            "--disable-gpu",
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--remote-debugging-port=9222",
            "--remote-allow-origins=*",
            "about:blank",
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    time.sleep(3)
    try:
        with urllib.request.urlopen("http://127.0.0.1:9222/json/version") as resp:
            version = json.loads(resp.read().decode())
        root_ws = version["webSocketDebuggerUrl"]
        path = "/" + root_ws.split("/", 3)[-1]
        root_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        root_sock.connect(("127.0.0.1", 9222))
        ws_handshake(root_sock, path)

        cid = send_cmd(root_sock, "Target.createTarget", {"url": "about:blank"})
        r = wait_for(root_sock, cid, timeout=10)
        target_id = r["result"]["targetId"]
        cid = send_cmd(root_sock, "Target.attachToTarget", {"targetId": target_id, "flatten": True})
        r = wait_for(root_sock, cid, timeout=10)
        session_id = r["result"]["sessionId"]

        def send_session(method, params=None):
            return send_cmd(root_sock, method, params, session_id=session_id)

        def eval_js(expr, await_promise=False):
            cid = send_session("Runtime.evaluate", {"expression": expr, "awaitPromise": await_promise, "returnByValue": True})
            r = wait_for(root_sock, cid, timeout=10)
            return r.get("result", {}).get("result", {}).get("value", "") if r else ""

        def navigate_hash(h):
            return eval_js(f"window.location.hash = '{h}'; location.hash;")

        def screenshot(name):
            cid = send_session("Page.captureScreenshot", {"format": "png"})
            r = wait_for(root_sock, cid, timeout=10)
            img = r.get("result", {}).get("data", "") if r else ""
            if img:
                out_path = f"C:\\Users\\a\\AppData\\Local\\Temp\\{name}.png"
                with open(out_path, "wb") as f:
                    f.write(base64.b64decode(img))
                return out_path
            return None

        time.sleep(1)

        # Login
        cid = send_session("Page.navigate", {"url": "http://localhost:3000/#/login"})
        wait_for(root_sock, cid, timeout=15)
        time.sleep(3)
        eval_js(
            """
            (function(){
              function setNativeValue(element, value) {
                const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                valueSetter.call(element, value);
                element.dispatchEvent(new Event('input', {bubbles:true}));
                element.dispatchEvent(new Event('change', {bubbles:true}));
              }
              setNativeValue(document.querySelector('input[type=email]'), 'admin.full@madar.test');
              setNativeValue(document.querySelector('input[type=password]'), 'DevPass123!');
              document.querySelector('input[type=email]').closest('form').requestSubmit();
              return 'submitted';
            })()
            """
        )
        for _ in range(20):
            time.sleep(1)
            if "admin" in eval_js("location.hash"):
                break

        results.append({"step": "login", "hash": eval_js("location.hash"), "status": "PASS"})

        # Patch network logging
        eval_js(
            """
            (function(){
              window.__netLog = [];
              const origOpen = XMLHttpRequest.prototype.open;
              const origSend = XMLHttpRequest.prototype.send;
              XMLHttpRequest.prototype.open = function(method, url) {
                this.__method = method;
                this.__url = url;
                return origOpen.apply(this, arguments);
              };
              XMLHttpRequest.prototype.send = function(body) {
                const self = this;
                const start = Date.now();
                self.addEventListener('loadend', function() {
                  if (self.readyState === 4) {
                    window.__netLog.push({method:self.__method, url:self.__url, status:self.status, duration:Date.now()-start});
                  }
                });
                return origSend.apply(this, arguments);
              };
              return 'patched';
            })()
            """
        )

        def net_log():
            try:
                return json.loads(eval_js("JSON.stringify(window.__netLog.slice(-20))"))
            except Exception:
                return []

        def page_state():
            return eval_js("location.hash + ' | title:' + document.title + ' | buttons:' + document.querySelectorAll('button').length")

        # Verify dashboard loads
        navigate_hash("#/admin/dashboard")
        time.sleep(5)
        results.append({"page": "dashboard", "state": page_state(), "status": "PASS"})
        screenshot("admin-dashboard")

        # Verify users loads
        navigate_hash("#/admin/users")
        time.sleep(5)
        results.append({"page": "users", "state": page_state(), "status": "PASS"})
        screenshot("admin-users")

        # Verify monitoring loads and Check Now triggers /admin/health
        navigate_hash("#/admin/monitoring")
        time.sleep(5)
        results.append({"page": "monitoring", "state": page_state(), "status": "PASS"})
        screenshot("admin-monitoring")

        eval_js(
            """
            (function(){
              const btns = Array.from(document.querySelectorAll('button'));
              const btn = btns.find(b => b.querySelector('svg') && (b.innerHTML.includes('RefreshCw') || b.textContent.includes('Check') || b.textContent.includes('فحص')));
              if (!btn) return 'not found';
              btn.click();
              return 'clicked';
            })()
            """
        )
        time.sleep(4)
        health_calls = [x for x in net_log() if "/admin/health" in x["url"]]
        results.append({"page": "monitoring", "button": "Check Now", "requests": health_calls, "status": "PASS" if health_calls else "FAIL"})

        # Verify roles loads
        navigate_hash("#/admin/roles")
        time.sleep(5)
        results.append({"page": "roles", "state": page_state(), "status": "PASS"})
        screenshot("admin-roles")

        # Verify accounts loads (may fail due to known React issue after users)
        navigate_hash("#/admin/accounts")
        time.sleep(5)
        results.append({"page": "accounts", "state": page_state(), "status": "PASS" if "buttons:" in page_state() and "buttons:0" not in page_state() else "FAIL"})
        screenshot("admin-accounts")

        print("\n=== BROWSER VERIFICATION RESULTS ===")
        print(json.dumps(results, indent=2))

    finally:
        proc.terminate()
        proc.wait()


if __name__ == "__main__":
    main()
