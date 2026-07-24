#!/bin/bash
set -e
API=http://localhost:3001/api
TOKEN=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" -d '{"email":"admin.full@madar.test","password":"DevPass123!"}' | sed 's/.*"accessToken":"\([^"]*\)".*/\1/')
echo "TOKEN=$TOKEN"

auth="Authorization: Bearer $TOKEN"

call() {
  local method="$1"
  local path="$2"
  local name="$3"
  local body="${4:-}"
  echo "--- $name ---"
  if [ -n "$body" ]; then
    curl -s -X "$method" "$API$path" -H "$auth" -H "Content-Type: application/json" -d "$body" | head -c 500
  else
    curl -s -X "$method" "$API$path" -H "$auth" | head -c 500
  fi
  echo
}

call GET /admin/health "Admin Health"
call GET /admin/dashboard-metrics "Dashboard Metrics"
call GET "/admin/users?page=1&limit=5" "Users List"
call GET /admin/admin-accounts "Admin Accounts"
call GET /admin/roles "Roles"
call GET /admin/permissions "Permissions"
call GET /admin/audit-logs "Audit Logs"
call GET /admin/activity-log "Activity Log"
call GET /admin/ai-operations "AI Operations"
call GET /admin/email-monitoring "Email Monitoring"
call GET /admin/backups "Backups"
call GET /admin/security-alerts "Security Alerts"
call GET /admin/security-status "Security Status"
call GET /admin/settings "Settings"
call GET /admin/monitoring "Monitoring"
call GET /admin/companies "Companies"
call GET /admin/universities "Universities"
