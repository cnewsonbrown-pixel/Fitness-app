#!/bin/bash

# FitStudio API Test Script
# Run this script to test the authentication and tenant endpoints

BASE_URL="${API_URL:-http://localhost:3000/api/v1}"
CONTENT_TYPE="Content-Type: application/json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0

# Helper functions
print_test() {
    echo -e "\n${YELLOW}Testing: $1${NC}"
}

print_pass() {
    echo -e "${GREEN}✓ PASSED${NC}: $1"
    ((PASSED++))
}

print_fail() {
    echo -e "${RED}✗ FAILED${NC}: $1"
    ((FAILED++))
}

check_status() {
    local expected=$1
    local actual=$2
    local description=$3

    if [ "$actual" -eq "$expected" ]; then
        print_pass "$description (HTTP $actual)"
        return 0
    else
        print_fail "$description (Expected HTTP $expected, got HTTP $actual)"
        return 1
    fi
}

check_json() {
    local response=$1
    local field=$2
    local expected=$3
    local description=$4

    local actual=$(echo "$response" | jq -r "$field")

    if [ "$actual" == "$expected" ]; then
        print_pass "$description"
        return 0
    else
        print_fail "$description (Expected '$expected', got '$actual')"
        return 1
    fi
}

echo "================================================"
echo "FitStudio API Test Suite"
echo "Base URL: $BASE_URL"
echo "================================================"

# =========================================
# 1. Health Check
# =========================================
print_test "Health Check"

RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

check_status 200 "$HTTP_CODE" "Health endpoint returns 200"
check_json "$BODY" ".success" "true" "Health check success is true"
check_json "$BODY" ".data.status" "healthy" "Health status is healthy"

# =========================================
# 2. Registration - Success
# =========================================
print_test "User Registration (Success)"

TIMESTAMP=$(date +%s)
TEST_EMAIL="test${TIMESTAMP}@example.com"
TEST_PASSWORD="TestPass123"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/register" \
    -H "$CONTENT_TYPE" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\",
        \"firstName\": \"Test\",
        \"lastName\": \"User\"
    }")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

check_status 201 "$HTTP_CODE" "Registration returns 201"
check_json "$BODY" ".success" "true" "Registration success is true"

# Extract tokens for later use
ACCESS_TOKEN=$(echo "$BODY" | jq -r '.data.tokens.accessToken')
REFRESH_TOKEN=$(echo "$BODY" | jq -r '.data.tokens.refreshToken')

if [ "$ACCESS_TOKEN" != "null" ] && [ -n "$ACCESS_TOKEN" ]; then
    print_pass "Access token received"
else
    print_fail "Access token not received"
fi

# =========================================
# 3. Registration - Duplicate Email
# =========================================
print_test "User Registration (Duplicate Email)"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/register" \
    -H "$CONTENT_TYPE" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\",
        \"firstName\": \"Test\",
        \"lastName\": \"User\"
    }")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

check_status 409 "$HTTP_CODE" "Duplicate registration returns 409"
check_json "$BODY" ".success" "false" "Duplicate registration fails"

# =========================================
# 4. Registration - Invalid Password
# =========================================
print_test "User Registration (Weak Password)"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/register" \
    -H "$CONTENT_TYPE" \
    -d "{
        \"email\": \"weak${TIMESTAMP}@example.com\",
        \"password\": \"weak\",
        \"firstName\": \"Test\",
        \"lastName\": \"User\"
    }")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

check_status 400 "$HTTP_CODE" "Weak password returns 400"

# =========================================
# 5. Login - Success
# =========================================
print_test "User Login (Success)"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
    -H "$CONTENT_TYPE" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
    }")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

check_status 200 "$HTTP_CODE" "Login returns 200"
check_json "$BODY" ".success" "true" "Login success is true"

# Update tokens
ACCESS_TOKEN=$(echo "$BODY" | jq -r '.data.tokens.accessToken')
REFRESH_TOKEN=$(echo "$BODY" | jq -r '.data.tokens.refreshToken')

# =========================================
# 6. Login - Wrong Password
# =========================================
print_test "User Login (Wrong Password)"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
    -H "$CONTENT_TYPE" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"WrongPassword123\"
    }")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

check_status 401 "$HTTP_CODE" "Wrong password returns 401"

# =========================================
# 7. Get Current User (Authenticated)
# =========================================
print_test "Get Current User (Authenticated)"

RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/auth/me" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

check_status 200 "$HTTP_CODE" "Get me returns 200"
check_json "$BODY" ".data.user.email" "$TEST_EMAIL" "User email matches"

# =========================================
# 8. Get Current User (No Token)
# =========================================
print_test "Get Current User (No Token)"

RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/auth/me")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

check_status 401 "$HTTP_CODE" "No token returns 401"

# =========================================
# 9. Refresh Token
# =========================================
print_test "Refresh Token"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/refresh" \
    -H "$CONTENT_TYPE" \
    -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

check_status 200 "$HTTP_CODE" "Refresh returns 200"

NEW_ACCESS_TOKEN=$(echo "$BODY" | jq -r '.data.tokens.accessToken')
NEW_REFRESH_TOKEN=$(echo "$BODY" | jq -r '.data.tokens.refreshToken')

if [ "$NEW_ACCESS_TOKEN" != "$ACCESS_TOKEN" ]; then
    print_pass "New access token is different"
else
    print_fail "Access token should be rotated"
fi

# Update tokens
ACCESS_TOKEN=$NEW_ACCESS_TOKEN
REFRESH_TOKEN=$NEW_REFRESH_TOKEN

# =========================================
# 10. Check Slug Availability
# =========================================
print_test "Check Slug Availability"

RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/tenants/check-slug/my-new-studio")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

check_status 200 "$HTTP_CODE" "Check slug returns 200"
check_json "$BODY" ".data.available" "true" "Slug is available"

# =========================================
# 11. Create Tenant (Studio)
# =========================================
print_test "Create Tenant (Studio)"

STUDIO_SLUG="test-studio-${TIMESTAMP}"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/tenants" \
    -H "$CONTENT_TYPE" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d "{
        \"name\": \"Test Fitness Studio\",
        \"slug\": \"$STUDIO_SLUG\"
    }")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

check_status 201 "$HTTP_CODE" "Create tenant returns 201"
check_json "$BODY" ".data.tenant.slug" "$STUDIO_SLUG" "Tenant slug matches"

# =========================================
# 12. Get Tenant by Slug (Public)
# =========================================
print_test "Get Tenant by Slug (Public)"

RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/tenants/$STUDIO_SLUG")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

check_status 200 "$HTTP_CODE" "Get tenant by slug returns 200"
check_json "$BODY" ".data.tenant.slug" "$STUDIO_SLUG" "Tenant slug matches"

# =========================================
# 13. Verify Slug No Longer Available
# =========================================
print_test "Check Slug (Taken)"

RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/tenants/check-slug/$STUDIO_SLUG")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

check_status 200 "$HTTP_CODE" "Check slug returns 200"
check_json "$BODY" ".data.available" "false" "Slug is no longer available"

# =========================================
# 14. Logout
# =========================================
print_test "Logout"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/logout" \
    -H "$CONTENT_TYPE" \
    -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

check_status 200 "$HTTP_CODE" "Logout returns 200"

# =========================================
# 15. Refresh Token After Logout (Should Fail)
# =========================================
print_test "Refresh Token After Logout"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/refresh" \
    -H "$CONTENT_TYPE" \
    -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

check_status 401 "$HTTP_CODE" "Refresh after logout returns 401"

# =========================================
# 16. 404 for Unknown Route
# =========================================
print_test "Unknown Route"

RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/unknown-route")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

check_status 404 "$HTTP_CODE" "Unknown route returns 404"

# =========================================
# Summary
# =========================================
echo ""
echo "================================================"
echo "Test Summary"
echo "================================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi
