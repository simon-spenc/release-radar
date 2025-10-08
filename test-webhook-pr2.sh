#!/bin/bash

PAYLOAD=$(cat <<'PAYLOAD_EOF'
{
  "action": "closed",
  "pull_request": {
    "number": 2,
    "title": "feat: Upgrade to Claude Sonnet 4.5 model",
    "body": "## Summary\n\nUpgrades the LLM integration to use the latest Claude Sonnet 4.5 model.\n\n## Changes\n\n- Updated model from claude-3-5-sonnet-20241022 to claude-sonnet-4-5-20250929\n- Removes deprecation warnings\n- Provides better performance and accuracy",
    "html_url": "https://github.com/simon-spenc/release-radar/pull/2",
    "user": {
      "login": "simon-spenc"
    },
    "merged_at": "2025-10-08T06:30:30Z",
    "additions": 1,
    "deletions": 1,
    "changed_files": 1
  },
  "repository": {
    "full_name": "simon-spenc/release-radar"
  }
}
PAYLOAD_EOF
)

SECRET="d657359437d2639d1bb0f2da7b9fb3f9921b919402a52be7ba91700c9a2cac0a"
SIGNATURE="sha256=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')"

curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: $SIGNATURE" \
  -d "$PAYLOAD" \
  https://release-radar.vercel.app/api/webhooks/github | jq '.'
