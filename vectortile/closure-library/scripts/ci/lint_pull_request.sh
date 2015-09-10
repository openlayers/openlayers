#!/bin/bash
#
# Script to run gjslint on only the modified or added files in the current
# branch. Should be run from the base git directory with the PR branch checked
# out.

USER_BASE=$(python -c "import site;import sys;sys.stdout.write(site.USER_BASE)")
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
CHANGED_FILES=$(git diff --name-only --diff-filter=AM master..$CURRENT_BRANCH |
    grep -E "\.js$" | grep -v -E "test\.js$")

if [[ -n "$CHANGED_FILES" ]]; then
  set -x
  $USER_BASE/bin/gjslint --strict --jslint_error=all --exclude_files=deps.js $CHANGED_FILES
else
  echo "No .js files found to lint in this Pull Request."
fi
