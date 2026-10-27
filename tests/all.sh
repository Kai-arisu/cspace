#!/bin/bash
# run every CI suite; prints one line per suite
cd "$(dirname "$0")/.."
for t in audit3 audit4 audit5 audit6 audit7 search kit share scope team wbframe rail motion look calsync invitemail push t19 t20 notify onboard isobell offline; do printf "%s " $t; timeout 200 node tests/$t.js 2>&1 | grep -E "^FAIL|ALL PASSED|FAILURES" | head -4 | tr "\n" " "; echo; done
