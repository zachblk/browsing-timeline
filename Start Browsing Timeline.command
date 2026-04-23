#!/bin/bash
# Double-click this file in Finder to run the app. Edits appear after a refresh — no "build" step.

cd "$(dirname "$0")" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

echo ""
echo "  Browsing Timeline — starting…"
echo "  (First time may take a minute while dependencies install.)"
echo "  Leave this window open while you use the app. Press Ctrl+C to stop."
echo ""

if ! command -v npm >/dev/null 2>&1; then
  osascript -e 'display dialog "This Mac needs Node.js first.\n\n1) Open https://nodejs.org\n2) Download the LTS installer and install it\n3) Double-click \"Start Browsing Timeline\" again" buttons {"OK"} default button 1 with title "Browsing Timeline"' >/dev/null 2>&1
  echo "npm not found — install Node.js from https://nodejs.org (LTS), then try again."
  echo ""
  read -r -p "Press Enter to close…"
  exit 1
fi

npm install
npm start

echo ""
read -r -p "Press Enter to close…"
