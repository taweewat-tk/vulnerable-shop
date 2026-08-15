#!/usr/bin/env bash
# Start the dev server in the background so one terminal is enough.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -f .dev.pid ] && kill -0 "$(cat .dev.pid)" 2>/dev/null; then
  echo "server รันอยู่แล้ว (pid $(cat .dev.pid)) — ดู log ด้วย: tail -f .dev.log"
  exit 0
fi

npm run dev >.dev.log 2>&1 &
echo $! >.dev.pid

for _ in $(seq 1 40); do
  if curl -fsS "http://localhost:${PORT:-3000}/search?q=Mug" >/dev/null 2>&1; then
    echo "server พร้อมแล้วที่ http://localhost:${PORT:-3000} (pid $(cat .dev.pid))"
    echo "ดู log: tail -f .dev.log   ·   ปิด: npm run dev:stop"
    exit 0
  fi
  sleep 0.25
done

echo "server ไม่ขึ้นภายใน 10 วินาที — ดู .dev.log"
exit 1
