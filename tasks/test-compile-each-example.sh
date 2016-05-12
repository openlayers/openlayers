#!/bin/bash
# This task compiles all examples individually and writes logs in
# build/compiled-examples/logs.

tmp="`mktemp`"
logs="build/compiled-examples/logs"
> $logs

for i in examples/*.html
do
  echo Testing example $i | tee -a $logs
  key="`basename -s .html $i`"
  grep -q NOCOMPILE examples/$key.js && continue

  make build/compiled-examples/$key.json
  node tasks/build.js build/compiled-examples/$key.json build/compiled-examples/$key.combined.js 2> >(tee $tmp >&2)
  echo "$? $key examples/$key.js" >> $logs
  cat $tmp >> $logs
done
