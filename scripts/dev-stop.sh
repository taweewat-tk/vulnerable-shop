#!/usr/bin/env bash
# Stop the background dev server started by scripts/dev-bg.sh.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .dev.pid ]; then
  echo "ไม่มี .dev.pid — server ไม่ได้รันอยู่"
  exit 0
fi

pid="$(cat .dev.pid)"
if kill -0 "$pid" 2>/dev/null; then
  kill "$pid"
  # `npm run dev` wraps `tsx watch`, which forks a node child process that
  # does the actual listening. Sending TERM to the recorded (npm) pid
  # cascades down through tsx watch to that child in practice, but the
  # teardown is not instantaneous — poll briefly instead of assuming the
  # process (and the port) is gone the instant `kill` returns.
  for _ in $(seq 1 20); do
    kill -0 "$pid" 2>/dev/null || break
    sleep 0.25
  done
  if kill -0 "$pid" 2>/dev/null; then
    echo "pid $pid ยังไม่ตาย — บังคับปิดด้วย kill -9"
    kill -9 "$pid" 2>/dev/null || true
    sleep 0.25
  fi
  if kill -0 "$pid" 2>/dev/null; then
    echo "WARNING: pid $pid is still alive after kill -9 — could not confirm the server stopped. Check 'lsof -ti tcp:3000' for the process still listening, and see .dev.log for details."
  else
    echo "ปิด server แล้ว (pid $pid)"
  fi
else
  echo "pid $pid ไม่ได้รันอยู่แล้ว"
fi
rm -f .dev.pid
