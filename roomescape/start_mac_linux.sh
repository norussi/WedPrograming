#!/usr/bin/env sh
set -e
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo 'Node.js 18+ is required: https://nodejs.org/'
  exit 1
fi
if [ ! -d node_modules ]; then
  echo 'Installing dependencies...'
  npm install
fi
echo 'Game: http://localhost:3000'
npm start
