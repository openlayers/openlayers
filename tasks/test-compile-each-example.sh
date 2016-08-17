#!/bin/bash
# This task compiles all examples individually and writes logs in
# build/compiled-examples/logs.

mkdir -p build/compiled-examples
tmp="`mktemp`"
logs="build/compiled-examples/logs"
> $logs

has_errors=0
for i in examples/*.html
do
  echo Testing example $i | tee -a $logs
  key="`basename -s .html $i`"
  [ -f examples/$key.js ] || continue
  grep -q NOCOMPILE examples/$key.js && continue

  make build/compiled-examples/$key.json
  node tasks/build.js build/compiled-examples/$key.json build/compiled-examples/$key.combined.js 2> >(tee $tmp >&2)
  status="$?"
  [ $status -ne 0 ] && has_errors=1
  echo "$status $key examples/$key.js" >> $logs
  cat $tmp >> $logs
done

exit $has_errors
