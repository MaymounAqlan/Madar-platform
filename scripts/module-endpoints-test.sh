#!/bin/bash
set -e
API=http://localhost:3001/api

login() {
  local email="$1"
  curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$email\",\"password\":\"TestPass123!\"}" | sed 's/.*"accessToken":"\([^"]*\)".*/\1/'
}

call() {
  local token="$1"
  local method="$2"
  local path="$3"
  local body="$4"
  if [ -n "$body" ]; then
    curl -s -o /dev/null -w "%{http_code}\n" -X "$method" "$API$path" -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d "$body"
  else
    curl -s -o /dev/null -w "%{http_code}\n" -X "$method" "$API$path" -H "Authorization: Bearer $token"
  fi
}

echo "=== Student endpoints ==="
ST=$(login "student.ds.test@madar.test")
call "$ST" GET "/students/me"
call "$ST" GET "/students/dashboard"
call "$ST" GET "/jobs"

echo "=== Company endpoints ==="
CO=$(login "company.test@madar.test")
call "$CO" GET "/companies/me"
call "$CO" GET "/companies/dashboard"
call "$CO" GET "/jobs/company"

echo "=== University endpoints ==="
UNI=$(login "university.active@madar.test")
call "$UNI" GET "/universities/me"
call "$UNI" GET "/universities/dashboard"
call "$UNI" GET "/universities/colleges"
call "$UNI" GET "/study-plans"
call "$UNI" GET "/courses"

echo "=== Coordinator endpoints ==="
COORD=$(login "coordinator.test@madar.test")
call "$COORD" GET "/college-coordinators/me"
call "$COORD" GET "/universities/colleges"
call "$COORD" GET "/students?collegeId=me"
call "$COORD" GET "/study-plans"

echo "=== Super Admin endpoints ==="
SA=$(login "superadmin.test@madar.test")
call "$SA" GET "/admin/dashboard-metrics"
call "$SA" GET "/admin/users"
