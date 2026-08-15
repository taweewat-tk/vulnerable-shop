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

# Gate B-QA #2 (CHALLENGE.md): หลังแก้ต้องเขียว 20/20
#
# เงื่อนไขเดิมตั้งกลับด้าน — มัน exit 1 เมื่อ pass ครบ 20 ("ยังไม่กระพริบ")
# ผลคือ ตอนเทสต์ยังกระพริบ (ผลผสม) script กลับ exit 0 = ปล่อยผ่าน
# และพอแก้สาเหตุรากสำเร็จจนเขียวครบ script กลับ exit 1 = ตก
# ซึ่งตรงข้ามกับเกณฑ์ที่ CHALLENGE.md:36 ระบุไว้
if [ "$pass" -eq 20 ]; then
  echo "ผ่าน — flaky suite เขียว 20/20 (ไม่กระพริบแล้ว)"
  exit 0
fi

echo "ยังไม่ผ่าน — ต้องเขียวครบ 20/20 · ยังแดงอยู่ $fail รอบ"
echo "หาสาเหตุรากให้เจอ (เวลา / ลำดับ / state ร่วม) ห้ามแก้ด้วย retry หรือเพิ่ม timeout"
exit 1
