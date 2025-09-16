#!/bin/bash

# Test script for JSON:API mock server endpoints
# Usage: ./test-endpoints.sh

echo "🧪 Testing JSON:API Mock Server Endpoints"
echo "=========================================="

# Check if server is running
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "❌ Mock server not running. Start it with: npm run mock-server"
    exit 1
fi

echo "✅ Mock server is running"
echo

# Test valid endpoints
echo "📝 Testing Valid Endpoints:"
echo "--------------------------"

echo "1. GET /api (Root endpoint)"
curl -s -H "Accept: application/vnd.api+json" http://localhost:3001/api | jq -r '.meta.description'
echo

echo "2. GET /api/articles (Collection)"
curl -s -H "Accept: application/vnd.api+json" http://localhost:3001/api/articles | jq -r '.meta.totalResources as $total | "Found \($total) articles"'
echo

echo "3. GET /api/articles/1 (Individual resource)"
curl -s -H "Accept: application/vnd.api+json" http://localhost:3001/api/articles/1 | jq -r '.data.attributes.title'
echo

echo "4. GET /api/articles?include=author (Compound document)"
curl -s -H "Accept: application/vnd.api+json" "http://localhost:3001/api/articles?include=author" | jq -r '.included[0].attributes.firstName + " " + .included[0].attributes.lastName + " included"'
echo

echo "5. GET /api/articles?sort=title (Sorted)"
curl -s -H "Accept: application/vnd.api+json" "http://localhost:3001/api/articles?sort=title" | jq -r '.data[0].attributes.title + " (first sorted result)"'
echo

echo "6. GET /api/articles?fields[articles]=title (Sparse fieldsets)"
curl -s -H "Accept: application/vnd.api+json" "http://localhost:3001/api/articles?fields%5Barticles%5D=title" | jq -r '.data[0].attributes | keys | "Only fields: \(join(", "))"'
echo

echo "7. POST /api/articles (Create resource)"
RESULT=$(curl -s -X POST \
  -H "Content-Type: application/vnd.api+json" \
  -H "Accept: application/vnd.api+json" \
  -d '{
    "data": {
      "type": "articles",
      "attributes": {
        "title": "Test Article",
        "body": "Created via test script"
      }
    }
  }' \
  http://localhost:3001/api/articles)
NEW_ID=$(echo $RESULT | jq -r '.data.id')
echo "Created article with ID: $NEW_ID"
echo

echo "🚫 Testing Invalid Endpoints:"
echo "-----------------------------"

echo "1. Missing jsonapi member"
curl -s -H "Accept: application/vnd.api+json" http://localhost:3001/api/invalid/no-jsonapi | jq -r 'if .jsonapi then "❌ Has jsonapi (should not)" else "✅ Missing jsonapi member" end'
echo

echo "2. Wrong content-type"
HTTP_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code};CONTENT_TYPE:%{content_type}" -H "Accept: application/vnd.api+json" http://localhost:3001/api/invalid/wrong-content-type)
CONTENT_TYPE=$(echo $HTTP_RESPONSE | grep -o 'CONTENT_TYPE:[^;]*' | cut -d: -f2)
if [[ $CONTENT_TYPE == *"application/json"* ]]; then
    echo "✅ Wrong content-type: $CONTENT_TYPE (should be application/vnd.api+json)"
else
    echo "❌ Correct content-type: $CONTENT_TYPE"
fi
echo

echo "3. Missing required fields"
curl -s -H "Accept: application/vnd.api+json" http://localhost:3001/api/invalid/missing-id | jq -r '.data[0] | if .id then "❌ Has id field" else "✅ Missing id field" end'
echo

echo "4. 404 Error format"
curl -s -H "Accept: application/vnd.api+json" http://localhost:3001/api/articles/999 | jq -r '.errors[0].title + ": " + .errors[0].detail'
echo

echo "✅ All endpoint tests completed!"
echo
echo "🔧 Next Steps:"
echo "- Use http://localhost:3001/api/articles in the validator"
echo "- Test with http://localhost:3001/api/invalid/* endpoints for error detection"
echo "- The validator frontend will connect to these endpoints for testing"