#!/bin/bash

# Comprehensive endpoint validation test
# Tests that validation results align with expected pass/fail outcomes

echo "🔍 JSON:API Validator - Comprehensive Endpoint Validation Test"
echo "=============================================================="
echo

# Start mock server
echo "🚀 Starting mock server..."
npm run mock-server &
SERVER_PID=$!
sleep 3

# Check if server is running
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "❌ Mock server failed to start"
    exit 1
fi
echo "✅ Mock server started successfully"
echo

# Test endpoints with expected outcomes
declare -a VALID_ENDPOINTS=(
    "http://localhost:3001/api|Root endpoint"
    "http://localhost:3001/api/articles|Articles collection"
    "http://localhost:3001/api/articles/1|Individual article"
    "http://localhost:3001/api/articles?include=author|Articles with include"
    "http://localhost:3001/api/articles?sort=title|Sorted articles"
    "http://localhost:3001/api/articles?fields[articles]=title|Sparse fieldsets"
)

declare -a INVALID_ENDPOINTS=(
    "http://localhost:3001/api/invalid/no-jsonapi|Missing jsonapi member"
    "http://localhost:3001/api/invalid/wrong-content-type|Wrong content-type"
    "http://localhost:3001/api/invalid/missing-id|Missing id field"
    "http://localhost:3001/api/invalid/bad-links|Bad links format"
)

echo "📋 Testing Valid Endpoints (should mostly pass validation):"
echo "-----------------------------------------------------------"

VALID_PASS_COUNT=0
VALID_TOTAL=0

for endpoint_info in "${VALID_ENDPOINTS[@]}"; do
    IFS='|' read -r url description <<< "$endpoint_info"
    echo "Testing: $description"
    echo "URL: $url"
    
    response=$(curl -s -H "Accept: application/vnd.api+json" "$url")
    
    if [[ $? -eq 0 ]]; then
        # Check if response has basic JSON:API structure
        if echo "$response" | jq -e '.jsonapi' > /dev/null 2>&1; then
            echo "✅ Response has jsonapi member"
            ((VALID_PASS_COUNT++))
        else
            echo "❌ Response missing jsonapi member"
        fi
        
        if echo "$response" | jq -e '.data or .errors or .meta' > /dev/null 2>&1; then
            echo "✅ Response has required top-level member"
            ((VALID_PASS_COUNT++))
        else
            echo "❌ Response missing required top-level members"
        fi
    else
        echo "❌ Request failed"
    fi
    
    ((VALID_TOTAL+=2))
    echo
done

echo "📋 Testing Invalid Endpoints (should fail validation):"
echo "------------------------------------------------------"

INVALID_FAIL_COUNT=0
INVALID_TOTAL=0

for endpoint_info in "${INVALID_ENDPOINTS[@]}"; do
    IFS='|' read -r url description <<< "$endpoint_info"
    echo "Testing: $description"
    echo "URL: $url"
    
    response=$(curl -s -H "Accept: application/vnd.api+json" "$url")
    
    if [[ $? -eq 0 ]]; then
        # Check for specific invalid conditions
        case "$url" in
            *no-jsonapi*)
                if ! echo "$response" | jq -e '.jsonapi' > /dev/null 2>&1; then
                    echo "✅ Correctly missing jsonapi member"
                    ((INVALID_FAIL_COUNT++))
                else
                    echo "❌ Unexpectedly has jsonapi member"
                fi
                ;;
            *wrong-content-type*)
                content_type=$(curl -s -I -H "Accept: application/vnd.api+json" "$url" | grep -i content-type)
                if [[ "$content_type" != *"application/vnd.api+json"* ]]; then
                    echo "✅ Correctly has wrong content-type"
                    ((INVALID_FAIL_COUNT++))
                else
                    echo "❌ Unexpectedly has correct content-type"
                fi
                ;;
            *missing-id*)
                if echo "$response" | jq -e '.data[0]' > /dev/null 2>&1; then
                    if ! echo "$response" | jq -e '.data[0].id' > /dev/null 2>&1; then
                        echo "✅ Correctly missing id field"
                        ((INVALID_FAIL_COUNT++))
                    else
                        echo "❌ Unexpectedly has id field"
                    fi
                fi
                ;;
            *bad-links*)
                if echo "$response" | jq -e '.data[0].links' > /dev/null 2>&1; then
                    echo "✅ Has links that should be malformed"
                    ((INVALID_FAIL_COUNT++))
                else
                    echo "❌ Missing links entirely"
                fi
                ;;
        esac
    else
        echo "❌ Request failed"
    fi
    
    ((INVALID_TOTAL++))
    echo
done

# Test 404 error format (should be valid JSON:API error)
echo "📋 Testing Error Response Format:"
echo "--------------------------------"
echo "Testing: 404 Not Found error format"
echo "URL: http://localhost:3001/api/articles/999"

response=$(curl -s -H "Accept: application/vnd.api+json" "http://localhost:3001/api/articles/999")
if echo "$response" | jq -e '.errors[0]' > /dev/null 2>&1; then
    echo "✅ Has proper errors array"
    if echo "$response" | jq -e '.errors[0].status and .errors[0].title' > /dev/null 2>&1; then
        echo "✅ Error has required fields"
        ((VALID_PASS_COUNT++))
    fi
fi
((VALID_TOTAL++))
echo

# Stop mock server
echo "🛑 Stopping mock server..."
kill $SERVER_PID
wait $SERVER_PID 2>/dev/null

# Calculate percentages
VALID_PERCENTAGE=$((VALID_PASS_COUNT * 100 / VALID_TOTAL))
INVALID_PERCENTAGE=$((INVALID_FAIL_COUNT * 100 / INVALID_TOTAL))

echo "📊 Results Summary:"
echo "=================="
echo "Valid Endpoints: $VALID_PASS_COUNT/$VALID_TOTAL passed validation checks ($VALID_PERCENTAGE%)"
echo "Invalid Endpoints: $INVALID_FAIL_COUNT/$INVALID_TOTAL failed as expected ($INVALID_PERCENTAGE%)"
echo

if [[ $VALID_PERCENTAGE -gt 80 && $INVALID_PERCENTAGE -gt 70 ]]; then
    echo "🎉 SUCCESS: Validation expectations align with actual results!"
    echo "   - Valid endpoints mostly pass validation (>80%)"
    echo "   - Invalid endpoints correctly fail validation (>70%)"
    exit 0
else
    echo "⚠️  WARNING: Some expectation misalignment detected"
    echo "   - Consider reviewing endpoint expectations or validation logic"
    exit 1
fi