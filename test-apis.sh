#!/bin/bash
# Test all PHASE 1 APIs
# Usage: bash test-apis.sh

echo "🧪 TESTING PHASE 1 APIs - Mbole Pay"
echo "====================================\n"

BASE_URL="http://localhost:3000"
COOKIE_JAR="cookies.txt"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function to test endpoints
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_code=$4
    
    echo -e "${YELLOW}Testing: $method $endpoint${NC}"
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -b $COOKIE_JAR -c $COOKIE_JAR)
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" \
            -b $COOKIE_JAR -c $COOKIE_JAR)
    fi
    
    body=$(echo "$response" | head -n -1)
    http_code=$(echo "$response" | tail -n 1)
    
    if [ "$http_code" == "$expected_code" ] || [ "$expected_code" == "*" ]; then
        echo -e "${GREEN}✓ PASS (HTTP $http_code)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}✗ FAIL (Expected $expected_code, got $http_code)${NC}"
        echo "$body"
    fi
    echo ""
}

echo "1️⃣  Setup: Login First (Required for all tests)"
echo "=============================================="
# You need to replace these with actual test credentials
LOGIN_DATA='{
  "email": "test@mbole.com",
  "password": "testpassword123"
}'
# Note: This assumes signup/login endpoint exists
# test_endpoint "POST" "/api/auth/signin" "$LOGIN_DATA" "200"

echo -e "${YELLOW}Note: Manual login required. Set your session cookie before running tests.${NC}\n"

echo "2️⃣  TEST: Group Management APIs"
echo "================================"

# Create test group first
CREATE_GROUP='{
  "name": "Test Savings Group",
  "description": "API Testing",
  "contributionAmount": 5000,
  "frequency": "MONTHLY",
  "cycleType": "ROTATING"
}'
echo "Creating test group..."
# test_endpoint "POST" "/api/groups" "$CREATE_GROUP" "201"

# Get group details
echo "Getting group details..."
# test_endpoint "GET" "/api/groups/GROUP_ID_HERE" "" "200"

# Update group
UPDATE_GROUP='{
  "name": "Updated Test Group",
  "contributionAmount": 10000
}'
echo "Updating group..."
# test_endpoint "PUT" "/api/groups/GROUP_ID_HERE" "$UPDATE_GROUP" "200"

# List members
echo "Listing group members..."
# test_endpoint "GET" "/api/groups/GROUP_ID_HERE/members" "" "200"

echo -e "\n3️⃣  TEST: Contribution APIs"
echo "============================"

# Create contribution
CREATE_CONTRIB='{
  "groupId": "GROUP_ID_HERE",
  "userId": "USER_ID_HERE",
  "amount": 5000,
  "dueDate": "2026-04-15T00:00:00Z"
}'
echo "Creating contribution..."
# test_endpoint "POST" "/api/contributions" "$CREATE_CONTRIB" "201"

# List contributions
echo "Listing contributions..."
# test_endpoint "GET" "/api/contributions?limit=10" "" "200"

# Update contribution status
UPDATE_CONTRIB='{
  "status": "PAID"
}'
echo "Marking contribution as paid..."
# test_endpoint "PUT" "/api/contributions/CONTRIB_ID_HERE" "$UPDATE_CONTRIB" "200"

# Get statistics
echo "Getting contribution statistics..."
# test_endpoint "GET" "/api/contributions/stats" "" "200"

echo -e "\n${GREEN}✅ Test suite completed${NC}"
echo "Notes:"
echo "- Replace GROUP_ID_HERE, USER_ID_HERE, CONTRIB_ID_HERE with actual IDs"
echo "- Ensure you're logged in before running tests"
echo "- Check API_TESTING_GUIDE.md for detailed endpoint documentation"
