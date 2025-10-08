#!/bin/bash

# Test webhook endpoint by sending a simulated GitHub PR merged event
# This tests the webhook without actually setting up the webhook in GitHub

echo "🧪 Testing GitHub webhook endpoint..."
echo ""

# Create a sample webhook payload for a merged PR
PAYLOAD=$(cat <<'EOF'
{
  "action": "closed",
  "pull_request": {
    "number": 1,
    "title": "docs: Improve README with features and deployment info",
    "body": "## Summary\n\nThis PR improves the README with:\n- ✨ Features section highlighting key capabilities\n- 🌐 Live demo link to Vercel deployment\n- 📊 Updated roadmap showing Phase 2.5 completion\n- ✅ List of completed features",
    "html_url": "https://github.com/simon-spenc/release-radar/pull/1",
    "user": {
      "login": "simon-spenc"
    },
    "merged_at": "2025-10-08T06:21:24Z",
    "additions": 28,
    "deletions": 14,
    "changed_files": 1
  },
  "repository": {
    "full_name": "simon-spenc/release-radar"
  }
}
EOF
)

# Calculate HMAC signature
SECRET="d657359437d2639d1bb0f2da7b9fb3f9921b919402a52be7ba91700c9a2cac0a"
SIGNATURE="sha256=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')"

echo "Payload:"
echo "$PAYLOAD" | jq '.'
echo ""
echo "Signature: $SIGNATURE"
echo ""

# Send to production endpoint
echo "Sending to https://release-radar.vercel.app/api/webhooks/github"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: $SIGNATURE" \
  -d "$PAYLOAD" \
  https://release-radar.vercel.app/api/webhooks/github)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response (HTTP $HTTP_CODE):"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Webhook processed successfully!"
  echo ""
  echo "Check the dashboard: https://release-radar.vercel.app/dashboard/pending"
else
  echo "❌ Webhook failed with HTTP $HTTP_CODE"
fi
