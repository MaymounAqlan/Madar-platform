#!/bin/bash
set -e
API=http://localhost:3001/api

declare -A accounts
accounts=(
  ["student.ds.test@madar.test"]="student"
  ["company.test@madar.test"]="company"
  ["university.active@madar.test"]="university"
  ["coordinator.test@madar.test"]="coordinator"
  ["superadmin.test@madar.test"]="super_admin"
)

login() {
  local email="$1"
  local password="$2"
  curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$email\",\"password\":\"$password\"}"
}

for email in "${!accounts[@]}"; do
  role="${accounts[$email]}"
  echo "=== $email ($role) ==="
  resp=$(login "$email" "DevPass123!")
  token=$(echo "$resp" | sed 's/.*"accessToken":"\([^"]*\)".*/\1/')
  if [ -z "$token" ] || [ "$token" = "$resp" ]; then
    echo "FAIL login: $resp" | head -c 300
    echo
    continue
  fi
  echo "login OK"
  me=$(curl -s "$API/auth/me" -H "Authorization: Bearer $token")
  me_role=$(echo "$me" | sed 's/.*"role":"\([^"]*\)".*/\1/')
  echo "me role: $me_role"
  if [ "$me_role" != "$role" ]; then
    echo "FAIL role mismatch: expected $role, got $me_role"
  else
    echo "role OK"
  fi
  refresh=$(echo "$resp" | sed 's/.*"refreshToken":"\([^"]*\)".*/\1/')
  refresh_resp=$(curl -s -X POST "$API/auth/refresh" -H "Content-Type: application/json" -d "{\"refreshToken\":\"$refresh\"}")
  new_token=$(echo "$refresh_resp" | sed 's/.*"accessToken":"\([^"]*\)".*/\1/')
  if [ -n "$new_token" ] && [ "$new_token" != "$refresh_resp" ]; then
    echo "refresh OK"
  else
    echo "FAIL refresh: $refresh_resp" | head -c 300
    echo
  fi
  logout_resp=$(curl -s -X POST "$API/auth/logout" -H "Authorization: Bearer $token")
  echo "logout: $(echo "$logout_resp" | head -c 200)"
  echo ""
done

echo "=== Pending university status ==="
resp=$(login "university.pending@madar.test" "DevPass123!")
token=$(echo "$resp" | sed 's/.*"accessToken":"\([^"]*\)".*/\1/')
if [ -n "$token" ] && [ "$token" != "$resp" ]; then
  echo "pending university login OK"
  me=$(curl -s "$API/auth/me" -H "Authorization: Bearer $token")
  echo "status: $(echo "$me" | sed 's/.*"status":"\([^"]*\)".*/\1/')"
else
  echo "FAIL: $resp" | head -c 300
  echo
fi
