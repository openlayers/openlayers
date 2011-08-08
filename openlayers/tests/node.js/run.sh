#!/bin/sh
cp mockdom.js node.js ../../lib
cp node-tests.cfg ../../build
cd ../../build
python build.py -c none node-tests
cd ../tests/node.js/

node run-test.js
rm ../../lib/mockdom.js
rm ../../lib/node.js
