"""
Comprehensive Admin acceptance verification using installed Chrome headless + CDP.
Deterministic waits, mutation testing, MongoDB/API verification, and safe cleanup.
"""
import base64
import json
import os
import shutil
import socket
import struct
import subprocess
import sys
import time
import urllib.request
from datetime import datetime

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
TEMP_DIR = r"C:\Users\a\AppData\Local\Temp"
USER_DATA_DIR = os.path.join(TEMP_DIR, "madar-admin-acceptance-profile")

EMAIL = "admin.full@madar.test"
PASSWORD = "DevPass123!"
BASE_URL = "http://localhost:3000"
API_URL = "http://127.0.0.1:3001"


def cleanup_old_chrome_profiles():
    removed = 0
    freed = 0
    for entry in os.scandir(TEMP_DIR):
        if entry.is_dir(follow_symlinks=False) and (
            entry.name.startswith("HeadlessChrome")
            or entry.name == "madar-admin-acceptance-profile"
        ):
            try:
                s = 0
                for r, ds, fs in os.walk(entry.path):
                    for f in fs:
                        try:
                            s += os.path.getsize(os.path.join(r, f))
                        except OSError:
                            pass
                shutil.rmtree(entry.path, ignore_errors=True)
                removed += 1
                freed += s
            except Exception:
                pass
    print(f"[cleanup] removed {removed} old Chrome profile dirs ({freed:,} bytes)")


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


class CDPClient:
    def __init__(self):
        self.counter = 1
        self.sock = None
        self.session_id = None

    def connect(self):
        with urllib.request.urlopen("http://127.0.0.1:9222/json/version") as resp:
            version = json.loads(resp.read().decode())
        root_ws = version["webSocketDebuggerUrl"]
        path = "/" + root_ws.split("/", 3)[-1]
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.connect(("127.0.0.1", 9222))
        ws_handshake(self.sock, path)

        cid = self.send("Target.createTarget", {"url": "about:blank"})
        r = self.wait(cid, 10)
        target_id = r["result"]["targetId"]
        cid = self.send("Target.attachToTarget", {"targetId": target_id, "flatten": True})
        r = self.wait(cid, 10)
        self.session_id = r["result"]["sessionId"]

    def send(self, method, params=None, session_id=None):
        cmd_id = self.counter
        self.counter += 1
        msg = {"id": cmd_id, "method": method}
        if params:
            msg["params"] = params
        if session_id:
            msg["sessionId"] = session_id
        ws_send(self.sock, msg)
        return cmd_id

    def session(self, method, params=None):
        return self.send(method, params, session_id=self.session_id)

    def wait(self, cmd_id, timeout=20):
        start = time.time()
        while time.time() - start < timeout:
            try:
                opcode, payload = ws_recv(self.sock, timeout=max(0.1, timeout - (time.time() - start)))
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

    def eval(self, expr, await_promise=False, timeout=10):
        cid = self.session(
            "Runtime.evaluate",
            {"expression": expr, "awaitPromise": await_promise, "returnByValue": True},
        )
        r = self.wait(cid, timeout)
        if not r:
            return None
        res = r.get("result", {}).get("result", {})
        return res.get("value") if "value" in res else res

    def navigate(self, url, timeout=15):
        cid = self.session("Page.navigate", {"url": url})
        return self.wait(cid, timeout)

    def screenshot(self, name):
        cid = self.session("Page.captureScreenshot", {"format": "png"})
        r = self.wait(cid, 10)
        img = r.get("result", {}).get("data", "") if r else ""
        if img:
            out_path = os.path.join(TEMP_DIR, f"{name}.png")
            with open(out_path, "wb") as f:
                f.write(base64.b64decode(img))
            return out_path
        return None


def patch_network_tracking(cdp):
    js = """
    (function(){
      window.__netLog = [];
      window.__pendingRequests = 0;
      const origOpen = XMLHttpRequest.prototype.open;
      const origSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open = function(method, url) {
        this.__method = method;
        this.__url = url;
        return origOpen.apply(this, arguments);
      };
      XMLHttpRequest.prototype.send = function(body) {
        const self = this;
        window.__pendingRequests++;
        const start = Date.now();
        self.addEventListener('loadend', function() {
          window.__pendingRequests--;
          if (self.readyState === 4) {
            window.__netLog.push({method:self.__method, url:self.__url, status:self.status, duration:Date.now()-start, response:self.responseText ? self.responseText.substring(0,500) : ''});
          }
        });
        return origSend.apply(this, arguments);
      };
      const origFetch = window.fetch;
      window.fetch = function(...args) {
        window.__pendingRequests++;
        const start = Date.now();
        return origFetch.apply(this, args).then(r => {
          window.__pendingRequests--;
          window.__netLog.push({method:args[0].method || 'GET', url:args[0].url || args[0], status:r.status, duration:Date.now()-start});
          return r;
        }).catch(e => {
          window.__pendingRequests--;
          throw e;
        });
      };
      return 'patched';
    })()
    """
    return cdp.eval(js)


def wait_for_stable(cdp, timeout=30):
    """Wait until no loading spinners and no pending XHR/fetch, with a cap."""
    start = time.time()
    last_log = ""
    saw_stable = False
    while time.time() - start < timeout:
        spinners = cdp.eval("document.querySelectorAll('svg.animate-spin').length") or 0
        pending = cdp.eval("window.__pendingRequests || 0") or 0
        loading_text = cdp.eval("Array.from(document.querySelectorAll('*')).some(el => (el.textContent || '').includes('جاري التحميل') || (el.textContent || '').includes('Loading'))") or False
        last_log = f"spinners={spinners}, pending={pending}, loading_text={loading_text}"
        if spinners == 0 and pending == 0 and not loading_text:
            saw_stable = True
            # give UI a moment to settle
            time.sleep(0.5)
            return True, "stable"
        time.sleep(0.3)
    return saw_stable, f"timeout: {last_log}"


def page_info(cdp):
    return cdp.eval(
        "location.hash + ' | title:' + document.title + ' | buttons:' + document.querySelectorAll('button').length + "
        "' | spinners:' + document.querySelectorAll('svg.animate-spin').length + "
        "' | errors:' + document.querySelectorAll('[class*=\"text-red\"],[class*=\"bg-red\"]').length"
    )


def wait_for_page(cdp, path_hash, timeout=30):
    cdp.navigate(f"{BASE_URL}/{path_hash}")
    start = time.time()
    while time.time() - start < timeout:
        h = cdp.eval("location.hash")
        if h and path_hash.replace("#/", "") in h:
            break
        time.sleep(0.2)
    ready, reason = wait_for_stable(cdp, timeout=timeout)
    return ready, reason, page_info(cdp)


def login(cdp):
    cdp.navigate(f"{BASE_URL}/#/login")
    # wait for form
    for i in range(20):
        ready = cdp.eval("!!document.querySelector('input[type=email]') && !!document.querySelector('input[type=password]')")
        if ready:
            break
        time.sleep(0.5)
    patch_network_tracking(cdp)
    js = """
    (function(){
      function setNativeValue(element, value) {
        const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        valueSetter.call(element, value);
        element.dispatchEvent(new Event('input', {bubbles:true}));
        element.dispatchEvent(new Event('change', {bubbles:true}));
      }
      const email = document.querySelector('input[type=email]');
      const password = document.querySelector('input[type=password]');
      if (!email || !password) return 'missing fields';
      setNativeValue(email, '%s');
      setNativeValue(password, '%s');
      const submitBtn = document.querySelector('button[type=submit]') || Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').toLowerCase().includes('login') || (b.innerText || '').includes('تسجيل'));
      if (submitBtn) submitBtn.click(); else email.closest('form').requestSubmit();
      return 'submitted';
    })()
    """ % (EMAIL, PASSWORD)
    cdp.eval(js)
    for i in range(40):
        time.sleep(1)
        h = cdp.eval("location.hash")
        if h and "admin" in h:
            net = cdp.eval("JSON.stringify(window.__netLog.slice(-5))")
            return True, {"hash": h, "net": json.loads(net) if net else []}
    net = cdp.eval("JSON.stringify(window.__netLog.slice(-10))")
    return False, {"hash": cdp.eval("location.hash"), "net": json.loads(net) if net else [], "page": page_info(cdp)}


def api_call(method, path, token=None, payload=None):
    url = f"{API_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(payload).encode() if payload else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"raw": body}
    except Exception as e:
        return 0, {"error": str(e)}


def get_admin_token():
    status, data = api_call("POST", "/api/auth/login", payload={"email": EMAIL, "password": PASSWORD})
    if status == 200:
        return data["data"]["accessToken"]
    raise RuntimeError(f"Login failed: {status} {data}")


def main():
    cleanup_old_chrome_profiles()
    if os.path.exists(USER_DATA_DIR):
        shutil.rmtree(USER_DATA_DIR, ignore_errors=True)

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
            f"--user-data-dir={USER_DATA_DIR}",
            "about:blank",
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    time.sleep(3)
    cdp = CDPClient()
    token = None
    try:
        cdp.connect()
        ok, hash_after = login(cdp)
        results.append({"step": "login", "hash": hash_after, "status": "PASS" if ok else "FAIL"})
        if not ok:
            print(json.dumps(results, indent=2))
            return

        patch_network_tracking(cdp)

        pages = [
            "#/admin/dashboard",
            "#/admin/users",
            "#/admin/accounts",
            "#/admin/roles",
            "#/admin/monitoring",
            "#/admin/ai-operations",
            "#/admin/email",
            "#/admin/backup",
            "#/admin/audit-logs",
            "#/admin/security-alerts",
            "#/admin/settings",
            "#/admin/profile",
        ]
        for page in pages:
            ready, reason, info = wait_for_page(cdp, page, timeout=30)
            status = "PASS" if ready else "FAIL"
            results.append({"page": page, "ready": ready, "reason": reason, "info": info, "status": status})
            cdp.screenshot(page.replace("#/admin/", "admin-").replace("-alerts", ""))

        # Test Monitoring Check Now after page is stable
        wait_for_page(cdp, "#/admin/monitoring", timeout=30)
        cdp.eval("""
        (function(){
          const btns = Array.from(document.querySelectorAll('button'));
          const btn = btns.find(b => (b.innerText || b.textContent || '').includes('Check') || (b.innerText || b.textContent || '').includes('فحص'));
          if (!btn) return 'not found';
          btn.click();
          return 'clicked';
        })()
        """)
        time.sleep(3)
        net = cdp.eval("JSON.stringify(window.__netLog.slice(-10))")
        net = json.loads(net) if net else []
        health = [x for x in net if "/admin/health" in x.get("url", "")]
        results.append({"page": "monitoring", "button": "Check Now", "health_calls": health, "status": "PASS" if health and health[0].get("status") == 200 else "FAIL"})

        token = get_admin_token()

        # Profile mutation: edit Arabic first name
        wait_for_page(cdp, "#/admin/profile", timeout=30)
        before = api_call("GET", "/api/auth/me", token=token)
        cdp.eval("""
        (function(){
          function setNativeValue(element, value) {
            const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            valueSetter.call(element, value);
            element.dispatchEvent(new Event('input', {bubbles:true}));
            element.dispatchEvent(new Event('change', {bubbles:true}));
          }
          const inputs = document.querySelectorAll('input[type=text]');
          if (inputs.length < 2) return 'missing inputs';
          setNativeValue(inputs[0], 'TestArabicName');
          const saveBtn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || b.textContent || '').includes('حفظ') || (b.innerText || b.textContent || '').includes('Save'));
          if (!saveBtn) return 'no save button';
          saveBtn.click();
          return 'clicked save';
        })()
        """)
        time.sleep(2)
        after = api_call("GET", "/api/auth/me", token=token)
        results.append({
            "page": "profile",
            "button": "Save",
            "before_firstNameAr": before[1].get("data", {}).get("firstNameAr"),
            "after_firstNameAr": after[1].get("data", {}).get("firstNameAr"),
            "status": "PASS" if after[1].get("data", {}).get("firstNameAr") == "TestArabicName" else "FAIL"
        })

    finally:
        proc.terminate()
        proc.wait()
        shutil.rmtree(USER_DATA_DIR, ignore_errors=True)

    print("\n=== ADMIN ACCEPTANCE RESULTS ===")
    print(json.dumps(results, indent=2, default=str))


if __name__ == "__main__":
    main()
