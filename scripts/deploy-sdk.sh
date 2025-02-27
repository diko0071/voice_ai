#!/bin/bash

# Voice AI SDK Deployment Script
# This script prepares and deploys the Voice AI SDK to a specified destination

# Set default values
DEFAULT_DEST="./dist"
DEST=${1:-$DEFAULT_DEST}
VERSION=$(node -e "console.log(require('./package.json').version)")
TIMESTAMP=$(date +"%Y%m%d%H%M%S")

# Create directories
mkdir -p "$DEST"
mkdir -p "$DEST/sdk"

# Display banner
echo "======================================================"
echo "  Voice AI SDK Deployment"
echo "  Version: $VERSION"
echo "  Timestamp: $TIMESTAMP"
echo "  Destination: $DEST"
echo "======================================================"

# Minify SDK if needed
if [ ! -f "public/sdk/voice-ai-sdk.min.js" ] || [ "public/sdk/voice-ai-sdk.js" -nt "public/sdk/voice-ai-sdk.min.js" ]; then
  echo "Minifying SDK..."
  npm run minify
else
  echo "SDK already minified and up to date."
fi

# Copy SDK files
echo "Copying SDK files to $DEST/sdk..."
cp public/sdk/voice-ai-sdk.min.js "$DEST/sdk/"
cp public/sdk/voice-ai-styles.css "$DEST/sdk/"
cp public/sdk/demo.html "$DEST/sdk/"
cp public/microphone.svg "$DEST/sdk/"

# Create version info file
echo "Creating version info file..."
cat > "$DEST/sdk/version.json" << EOF
{
  "version": "$VERSION",
  "buildDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "buildTimestamp": "$TIMESTAMP"
}
EOF

# Create README for the SDK distribution
echo "Creating README for the SDK distribution..."
cat > "$DEST/sdk/README.md" << EOF
# Voice AI SDK

Version: $VERSION
Build Date: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

## Files

- \`voice-ai-sdk.min.js\`: Minified JavaScript SDK
- \`voice-ai-styles.css\`: CSS styles for the SDK
- \`demo.html\`: Demo page showcasing the SDK
- \`version.json\`: Version information

## Integration

For detailed integration instructions, please refer to the main project documentation:
https://github.com/your-username/voice-ai/blob/main/INTEGRATION.md

## Basic Usage

\`\`\`html
<!-- Include the SDK -->
<script src="voice-ai-sdk.min.js"></script>
<link rel="stylesheet" href="voice-ai-styles.css">

<!-- Initialize the SDK -->
<script>
  document.addEventListener('DOMContentLoaded', function() {
    window.VoiceAI.init({
      clientId: 'your_client_id',
      serverUrl: 'https://your-voice-ai-server.com',
      position: 'bottom-right',
      theme: 'light'
    });
  });
</script>
\`\`\`
EOF

# Create a zip archive
echo "Creating zip archive..."
(cd "$DEST" && zip -r "voice-ai-sdk-$VERSION-$TIMESTAMP.zip" sdk)

echo "======================================================"
echo "  Deployment Complete!"
echo "  SDK files are available at: $DEST/sdk"
echo "  Zip archive: $DEST/voice-ai-sdk-$VERSION-$TIMESTAMP.zip"
echo "======================================================" 