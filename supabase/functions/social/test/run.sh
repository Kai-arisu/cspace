#!/bin/bash
# Runs the sign-in flow for all five platforms against fake platform servers and a fake database.
# Needs deno (npm i deno). Usage: bash supabase/functions/social/test/run.sh
cd "$(dirname "$0")"
python3 - <<'PY'
src=open('../index.ts').read()
src=src.replace('import "jsr:@supabase/functions-js/edge-runtime.d.ts";','').replace('import { createClient } from "jsr:@supabase/supabase-js@2";','import { createClient } from "./fakesb.ts";')
src=src.replace('Deno.serve(async (req: Request) => {','export const handler = async (req: Request) => {',1).rstrip()
open('fn.ts','w').write(src[:-3]+'};\n')
PY
${DENO:-deno} run -A test.ts; s=$?; rm -f fn.ts; exit $s
