"""
API-based Admin mutation acceptance tests.
Uses development-only accounts and records before/after state, audit logs, and persistence.
"""
import json
import os
import time
import urllib.request
from datetime import datetime

API_URL = "http://127.0.0.1:3001"
ADMIN_EMAIL = "admin.full@madar.test"
ADMIN_PASSWORD = "DevPass123!"

RESULTS = []


def api_call(method, path, token=None, payload=None):
    url = f"{API_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(payload).encode() if payload else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode()
            return resp.status, json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"raw": body}
    except Exception as e:
        return 0, {"error": str(e)}


def login(email, password):
    status, data = api_call("POST", "/api/auth/login", payload={"email": email, "password": password})
    if status == 200:
        return data["data"]["tokens"]["accessToken"]
    raise RuntimeError(f"Login failed for {email}: {status} {data}")


def record(step, status, details):
    RESULTS.append({"step": step, "status": status, "details": details})
    print(f"[{status}] {step}")


def find_user_by_email(token, email):
    status, data = api_call("GET", f"/api/admin/users?search={email}&limit=1", token=token)
    if status == 200 and data.get("data"):
        users = data["data"]
        if users:
            return users[0]
    return None


def find_backup(token, backup_id):
    status, data = api_call("GET", "/api/admin/backups?limit=20", token=token)
    if status == 200:
        backups = data.get("data", {}).get("backups", []) if isinstance(data.get("data"), dict) else data.get("data", [])
        for b in backups:
            if b.get("id") == backup_id:
                return b
    return None


def find_audit_log(token, action):
    status, data = api_call("GET", f"/api/admin/audit-logs?action={action}&limit=1", token=token)
    if status == 200:
        logs = data.get("data", {}).get("logs", [])
        if logs:
            return logs[0]
    return None


def main():
    token = login(ADMIN_EMAIL, ADMIN_PASSWORD)
    record("admin login", "PASS", {"email": ADMIN_EMAIL})

    # === Admin Profile ===
    me_before = api_call("GET", "/api/auth/me", token=token)
    new_first_name_ar = f"TestAdmin{int(time.time())}"
    status, data = api_call("PATCH", "/api/auth/me", token=token, payload={
        "firstNameAr": new_first_name_ar,
        "phone": "+966500000001",
        "language": "en"
    })
    me_after = api_call("GET", "/api/auth/me", token=token)
    profile_ok = status == 200 and me_after[1].get("data", {}).get("firstNameAr") == new_first_name_ar
    record("profile update", "PASS" if profile_ok else "FAIL", {
        "status": status,
        "before_firstNameAr": me_before[1].get("data", {}).get("firstNameAr"),
        "after_firstNameAr": me_after[1].get("data", {}).get("firstNameAr"),
        "role_unchanged": me_after[1].get("data", {}).get("role") == me_before[1].get("data", {}).get("role"),
    })
    # rollback
    api_call("PATCH", "/api/auth/me", token=token, payload={
        "firstNameAr": me_before[1].get("data", {}).get("firstNameAr"),
        "phone": me_before[1].get("data", {}).get("phone"),
        "language": me_before[1].get("data", {}).get("preferences", {}).get("language", "ar")
    })

    # === Create development test user ===
    dev_email = f"dev.mutation.{int(time.time())}@madar.test"
    create_payload = {
        "firstName": "Dev",
        "firstNameAr": "ديف",
        "lastName": "Mutation",
        "lastNameAr": "موتشن",
        "email": dev_email,
        "password": "DevPass123!",
        "role": "student",
        "status": "active"
    }
    status, data = api_call("POST", "/api/admin/users", token=token, payload=create_payload)
    dev_user = data.get("data") if status == 201 else find_user_by_email(token, dev_email)
    record("create dev user", "PASS" if status == 201 else "FAIL", {"email": dev_email, "status": status, "id": dev_user.get("_id") if dev_user else None})

    if not dev_user:
        print("Dev user not available; skipping user-dependent tests")
    else:
        dev_id = dev_user.get("_id") or dev_user.get("id")

        # === Disable user ===
        before = api_call("GET", f"/api/admin/users/{dev_id}", token=token)
        status, data = api_call("PUT", f"/api/admin/users/{dev_id}/status", token=token, payload={"status": "banned", "reason": "test disable"})
        after = api_call("GET", f"/api/admin/users/{dev_id}", token=token)
        record("disable dev user", "PASS" if status == 200 and after[1].get("data", {}).get("status") == "banned" else "FAIL", {
            "status_code": status,
            "before_status": before[1].get("data", {}).get("status"),
            "after_status": after[1].get("data", {}).get("status"),
        })

        # === Reactivate user ===
        status, data = api_call("PUT", f"/api/admin/users/{dev_id}/status", token=token, payload={"status": "active", "reason": "test reactivate"})
        after2 = api_call("GET", f"/api/admin/users/{dev_id}", token=token)
        record("reactivate dev user", "PASS" if status == 200 and after2[1].get("data", {}).get("status") == "active" else "FAIL", {
            "status_code": status,
            "after_status": after2[1].get("data", {}).get("status"),
        })

        # === Resend verification ===
        status, data = api_call("POST", f"/api/admin/users/{dev_id}/resend-verification", token=token, payload={"reason": "test"})
        record("resend verification", "PASS" if status == 200 else "FAIL", {"status_code": status, "response": data})

        # === Send reset password ===
        status, data = api_call("POST", f"/api/admin/users/{dev_id}/send-reset-password", token=token, payload={"reason": "test"})
        record("send reset password", "PASS" if status == 200 else "FAIL", {"status_code": status, "response": data})

        # === Invalidate sessions ===
        status, data = api_call("POST", f"/api/admin/users/{dev_id}/invalidate-sessions", token=token)
        record("invalidate sessions", "PASS" if status in (200, 201) else "FAIL", {"status_code": status, "response": data})

    # === Super Admin restriction ===
    status, data = api_call("POST", "/api/admin/users", token=token, payload={
        "firstName": "Bad",
        "firstNameAr": "باد",
        "lastName": "Super",
        "lastNameAr": "سوبر",
        "email": f"bad.super.{int(time.time())}@madar.test",
        "password": "DevPass123!",
        "role": "super_admin"
    })
    record("reject create super_admin", "PASS" if status == 403 else "FAIL", {"status_code": status})

    # === Admin Accounts ===
    admin_email = f"dev.admin.{int(time.time())}@madar.test"
    create_admin_payload = {
        "firstName": "Dev",
        "firstNameAr": "ديف",
        "lastName": "Admin",
        "lastNameAr": "أدمن",
        "email": admin_email,
        "password": "DevPass123!",
        "userType": "admin",
        "permissions": ["users:read", "users:write"],
        "status": "active"
    }
    status, data = api_call("POST", "/api/admin/admin-accounts", token=token, payload=create_admin_payload)
    admin_user = data.get("data") if status == 201 else None
    record("create admin account", "PASS" if status == 201 else "FAIL", {"email": admin_email, "status_code": status})

    # Duplicate email
    status2, data2 = api_call("POST", "/api/admin/admin-accounts", token=token, payload=create_admin_payload)
    record("reject duplicate admin email", "PASS" if status2 == 409 else "FAIL", {"status_code": status2})

    # Reject super_admin
    bad_admin_payload = create_admin_payload.copy()
    bad_admin_payload["email"] = f"bad.admin.{int(time.time())}@madar.test"
    bad_admin_payload["userType"] = "super_admin"
    status3, data3 = api_call("POST", "/api/admin/admin-accounts", token=token, payload=bad_admin_payload)
    record("reject super_admin admin account", "PASS" if status3 == 403 else "FAIL", {"status_code": status3})

    if admin_user:
        admin_id = admin_user.get("_id") or admin_user.get("id")

        # Disable
        status, data = api_call("PATCH", f"/api/admin/admin-accounts/{admin_id}/disable", token=token)
        after = api_call("GET", f"/api/admin/admin-accounts/{admin_id}", token=token)
        record("disable admin account", "PASS" if status == 200 else "FAIL", {"status_code": status})

        # Reactivate
        status, data = api_call("PATCH", f"/api/admin/admin-accounts/{admin_id}/reactivate", token=token)
        record("reactivate admin account", "PASS" if status == 200 else "FAIL", {"status_code": status})

        # Update
        status, data = api_call("PUT", f"/api/admin/admin-accounts/{admin_id}", token=token, payload={
            "firstName": "UpdatedDev",
            "permissions": ["users:read"]
        })
        record("update admin account", "PASS" if status == 200 else "FAIL", {"status_code": status})

    # === Roles and Permissions ===
    role_name = f"dev-role-{int(time.time())}"
    status, data = api_call("POST", "/api/admin/roles", token=token, payload={
        "name": role_name,
        "nameAr": "دور تجريبي",
        "description": "Development operational role",
        "permissions": ["users:read", "users:write"],
        "isSystem": False
    })
    role = data.get("data") if status == 201 else None
    record("create operational role", "PASS" if status == 201 else "FAIL", {"role_name": role_name, "status_code": status})

    # Reject system role name
    status, data = api_call("POST", "/api/admin/roles", token=token, payload={
        "name": "super_admin",
        "permissions": ["users:read"]
    })
    record("reject system role name", "PASS" if status == 403 else "FAIL", {"status_code": status})

    # Reject unknown permission
    status, data = api_call("POST", "/api/admin/roles", token=token, payload={
        "name": f"bad-role-{int(time.time())}",
        "permissions": ["users:read", "unknown:permission"]
    })
    record("reject unknown permission", "PASS" if status in (400, 403) else "FAIL", {"status_code": status})

    if role and admin_user:
        role_id = role.get("_id") or role.get("id")
        admin_id = admin_user.get("_id") or admin_user.get("id")
        status, data = api_call("PUT", f"/api/admin/users/{admin_id}/role", token=token, payload={"roleId": role_id})
        me = api_call("GET", f"/api/admin/admin-accounts/{admin_id}", token=token)
        record("assign role to admin", "PASS" if status == 200 else "FAIL", {"status_code": status})

    # === Backup ===
    status, data = api_call("POST", "/api/admin/backups", token=token)
    backup = data.get("data") if status == 201 else None
    record("create backup", "PASS" if status == 201 else "FAIL", {"status_code": status, "backup": backup})

    if backup:
        backup_id = backup.get("id") or backup.get("_id")
        # Verify
        status, data = api_call("POST", f"/api/admin/backups/{backup_id}/verify", token=token)
        valid = data.get("data", {}).get("valid") if isinstance(data.get("data"), dict) else False
        record("verify backup", "PASS" if status in (200, 201) and valid else "FAIL", {"status_code": status, "valid": valid, "response": data})

        # Restore (safe: only allowed collections per backend code)
        status, data = api_call("POST", f"/api/admin/backups/{backup_id}/restore", token=token)
        record("restore backup (safe collections)", "PASS" if status in (200, 201) else "FAIL", {"status_code": status, "response": data})

    # === Security Alerts ===
    # Generate a repeated-403 alert by making several forbidden requests
    for _ in range(5):
        api_call("POST", "/api/admin/users", token=token, payload={
            "firstName": "Bad", "firstNameAr": "باد", "lastName": "Super", "lastNameAr": "سوبر",
            "email": f"bad.super.{int(time.time())}@madar.test", "password": "DevPass123!", "role": "super_admin"
        })
        time.sleep(0.1)

    status, alerts = api_call("GET", "/api/admin/security-alerts?limit=10", token=token)
    alerts_list = alerts.get("data", {}).get("alerts", []) if isinstance(alerts.get("data"), dict) else []
    alert = alerts_list[0] if alerts_list else None
    if alert:
        alert_id = alert.get("_id") or alert.get("id")
        status, data = api_call("PUT", f"/api/admin/security-alerts/{alert_id}", token=token, payload={
            "status": "investigating",
            "notes": "Test investigation note"
        })
        record("update security alert", "PASS" if status == 200 else "FAIL", {"status_code": status, "alert_type": alert.get("type")})
    else:
        record("update security alert", "BLOCKED", {"reason": "no alerts available"})

    # === Audit Logs ===
    status, data = api_call("GET", "/api/admin/audit-logs?action=LOGIN&limit=5", token=token)
    record("audit logs filter by action", "PASS" if status == 200 else "FAIL", {"status_code": status, "count": len(data.get("data", {}).get("logs", []))})
    status, data = api_call("GET", "/api/admin/audit-logs?severity=critical&limit=5", token=token)
    record("audit logs filter by severity", "PASS" if status == 200 else "FAIL", {"status_code": status, "count": len(data.get("data", {}).get("logs", []))})

    audit = find_audit_log(token, "CREATE_ADMIN_ACCOUNT")
    record("audit log for create admin", "PASS" if audit else "FAIL", {"found": bool(audit)})

    # === Settings ===
    settings_before = api_call("GET", "/api/admin/settings", token=token)
    old_threshold = settings_before[1].get("data", {}).get("analysis", {}).get("matchThreshold")
    new_threshold = 75 if old_threshold != 75 else 70
    status, data = api_call("PUT", "/api/admin/settings", token=token, payload={"analysis.matchThreshold": new_threshold})
    settings_after = api_call("GET", "/api/admin/settings", token=token)
    settings_ok = status == 200 and settings_after[1].get("data", {}).get("analysis", {}).get("matchThreshold") == new_threshold
    record("update platform setting", "PASS" if settings_ok else "FAIL", {
        "status_code": status,
        "before": old_threshold,
        "after": settings_after[1].get("data", {}).get("analysis", {}).get("matchThreshold")
    })
    # rollback
    api_call("PUT", "/api/admin/settings", token=token, payload={"analysis.matchThreshold": old_threshold})
    # reject invalid key (admin.service rejects platform.* keys; request returns 200 with rejected list)
    status, data = api_call("PUT", "/api/admin/settings", token=token, payload={"platform.name": "Hacked"})
    rejected = data.get("data", {}).get("rejected", []) if isinstance(data.get("data"), dict) else []
    record("reject read-only setting", "PASS" if "platform.name" in rejected else "FAIL", {"status_code": status, "rejected": rejected})
    # verify secrets not returned
    settings = settings_after[1].get("data", {})
    secrets_exposed = any(k in settings for k in ["smtpPass", "googleClientSecret", "linkedinClientSecret", "mongoUri"])
    record("settings no secrets exposed", "PASS" if not secrets_exposed else "FAIL", {"exposed_keys": [k for k in ["smtpPass", "googleClientSecret", "linkedinClientSecret", "mongoUri"] if k in settings]})

    # === Email ===
    status, data = api_call("POST", "/api/admin/email-monitoring/test-smtp", token=token)
    smtp_ok = status in (200, 201) and data.get("data", {}).get("success")
    record("SMTP connection test", "PASS" if smtp_ok else "FAIL", {"status_code": status, "response": data})

    if smtp_ok:
        status, data = api_call("POST", "/api/admin/email-monitoring/send-test", token=token, payload={"to": "dev-test@madar.test", "subject": "Admin acceptance test"})
        record("send test email", "PASS" if status in (200, 201) else "FAIL", {"status_code": status, "response": data})
    else:
        record("send test email", "BLOCKED", {"reason": "SMTP not configured or test failed"})

    # === AI Operations ===
    status, data = api_call("GET", "/api/admin/ai-operations?limit=10", token=token)
    ops = data.get("data", {}).get("operations", []) if status == 200 else []
    failed_ops = [o for o in ops if o.get("status") == "failed"]
    if failed_ops:
        op_id = failed_ops[0].get("_id") or failed_ops[0].get("id")
        status, data = api_call("POST", f"/api/admin/ai-operations/{op_id}/retry", token=token)
        record("retry failed AI operation", "PASS" if status == 200 else "FAIL", {"status_code": status, "response": data})
    else:
        record("retry failed AI operation", "BLOCKED", {"reason": "no failed AI operations available; endpoint is placeholder"})

    print("\n=== ADMIN MUTATION TEST RESULTS ===")
    print(json.dumps(RESULTS, indent=2, default=str))
    passed = sum(1 for r in RESULTS if r["status"] == "PASS")
    print(f"\nTotal: {len(RESULTS)}, PASS: {passed}, FAIL: {len(RESULTS) - passed}")


if __name__ == "__main__":
    main()
