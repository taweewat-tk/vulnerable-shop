#!/usr/bin/env bash
# Run the flaky suite 20 times and report how often it went green.
#
# jest.config.js keeps flaky.test.ts in testPathIgnorePatterns so the plain
# `npm test` stays deterministic. We opt back in here by overriding the ignore
# list on the CLI (node_modules only) — otherwise jest matches zero tests and
# every iteration reports "No tests found" (exit 1), masking the real flicker.
set -uo pipefail

pass=0
fail=0

for i in $(seq 1 20); do
  if npx jest src/__tests__/flaky.test.ts --randomize --testPathIgnorePatterns /node_modules/ --silent >/dev/null 2>&1; then
    pass=$((pass + 1))
    printf '.'
  else
    fail=$((fail + 1))
    printf 'x'
  fi
done

printf '\n\nเขียว %d / 20 · แดง %d / 20\n' "$pass" "$fail"

if [ "$pass" -eq 20 ] || [ "$fail" -eq 20 ]; then
  echo "ยังไม่กระพริบ — ต้องปรับเกณฑ์ในเทสต์ให้ผลไม่คงที่"
  exit 1
fi
