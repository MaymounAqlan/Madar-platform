#!/bin/bash
set -e
API=http://localhost:3001/api
UNI_ID=6a569348aabaf0680a147710
COMP_ID=6a5659e0aabaf0680a147708

login() {
  local email="$1"
  local password="$2"
  curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$email\",\"password\":\"$password\"}" | sed 's/.*"accessToken":"\([^"]*\)".*/\1/'
}

ADMIN_TOKEN=$(login "admin.full@madar.test" "DevPass123!")
SUPER_TOKEN=$(login "superadmin.test@madar.test" "DevPass123!")

echo "=== Admin restrictions (expect 403) ==="

echo "--- Create super_admin as Admin ---"
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$API/admin/users" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"email":"superadmin.forbidden@madar.test","password":"TestPass123!","firstName":"Forbidden","lastName":"Super","firstNameAr":"Forbidden","lastNameAr":"Super","role":"super_admin"}'

echo "--- Approve university as Admin ---"
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH "$API/admin/universities/$UNI_ID/approve" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{}'

echo "--- Suspend university as Admin ---"
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH "$API/admin/universities/$UNI_ID/suspend" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"reason":"test"}'

echo "--- Approve company as Admin ---"
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH "$API/admin/companies/$COMP_ID/approve" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{}'

echo "--- Suspend company as Admin ---"
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH "$API/admin/companies/$COMP_ID/suspend" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"reason":"test"}'

echo ""
echo "=== Super Admin confirmations (expect 2xx) ==="

echo "--- Create admin as Super Admin ---"
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$API/admin/users" -H "Authorization: Bearer $SUPER_TOKEN" -H "Content-Type: application/json" -d '{"email":"admin.created.by.super@madar.test","password":"TestPass123!","firstName":"Created","lastName":"BySuper","firstNameAr":"Created","lastNameAr":"BySuper","role":"admin"}'

echo "--- Suspend university as Super Admin ---"
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH "$API/admin/universities/$UNI_ID/suspend" -H "Authorization: Bearer $SUPER_TOKEN" -H "Content-Type: application/json" -d '{"reason":"test"}'

echo "--- Approve company as Super Admin ---"
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH "$API/admin/companies/$COMP_ID/approve" -H "Authorization: Bearer $SUPER_TOKEN" -H "Content-Type: application/json" -d '{}'
