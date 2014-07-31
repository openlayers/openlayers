#!/bin/sh

# check if we can checkout safely
git diff --quiet HEAD
if [ $? -ne 0 ]; then
  echo "Please commit your changes first"
  exit 1
fi

# define functions
size() {
  echo $(cat build/ol.js | wc -c)
}

size_zipped() {
  echo $(gzip -cq build/ol.js | wc -c)
}

abs() {
  diff=$(expr $1 - $2)
  if [ "$diff" -ge 0 ]; then
    echo -n "+"
  fi
  echo $diff
}

rel() {
  diff=$(expr $1 - $2)
  if [ "$diff" -eq 0 ]; then
    rel="0.00"
  else
    rel=$(echo "$diff $2" | awk '{printf "%0.2f", 100*$1/$2}')
  fi
  if [ "$diff" -ge 0 ]; then
    echo -n "+"
  fi
  echo $rel
}

# get results for new commit
size1=$(size)
size1z=$(size_zipped)

# find merge base on master branch
git fetch -q origin master:master
hash0=$(git merge-base master HEAD)
hash1=$(git rev-parse HEAD)
branch=$(git rev-parse --abbrev-ref HEAD)

# switch to merge base
git checkout -q ${hash0}

# reference build
./build.py -c > /dev/null 2>&1
./build.py build > /dev/null 2>&1

# get reference results
size0=$(size)
size0z=$(size_zipped)

# cleanup build
# FIXME run reference build before ci
# so we end up with the correct build?
./build.py -c > /dev/null 2>&1

# switch back to original branch
git checkout -q ${branch}

# calculate differences
abs=$(abs $size1 $size0)
absz=$(abs $size1z $size0z)

rel=$(rel $size1 $size0)
relz=$(rel $size1z $size0z)

# publish results
echo "$hash0 (master)"
echo "uncompressed:  $size0 bytes"
echo "compressed:    $size0z bytes"
echo ""
echo "$hash1 ($branch)"
echo "uncompressed:  $size1 bytes"
echo "compressed:    $size1z bytes"
echo ""
echo "BENCHMARK RESULTS"
echo "uncompressed:  $abs bytes ($rel%)"
echo "compressed:    $absz bytes ($relz%)"
echo ""
