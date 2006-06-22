#!/bin/sh

#
# Script to build compressed single file version of OpenLayers library
#

OUTPUT_FILENAME=OpenLayers.js
TMP_OUTPUT_FILENAME=tmp.${OUTPUT_FILENAME}

TOOLS_DIR=../tools

CFG_FILENAME=library.cfg

SRC_DIR=../lib

CMD_MERGE_JS=${TOOLS_DIR}/mergejs.py

CMD_SHRINKSAFE=${TOOLS_DIR}/shrinksafe.py
CMD_JSMIN=${TOOLS_DIR}/jsmin.py

LICENSE_HEADER_FILENAME=license.txt


## Generate "fat" single file library version
${CMD_MERGE_JS} -c ${CFG_FILENAME} ${TMP_OUTPUT_FILENAME} ${SRC_DIR}


## Compress ("shrink") the single file library version

echo
echo Shrinking and post-processing...
# (We also append the license header here.)
cat ${LICENSE_HEADER_FILENAME} > ${OUTPUT_FILENAME}
${CMD_JSMIN} <${TMP_OUTPUT_FILENAME} >> ${OUTPUT_FILENAME}

echo Cleaning up...
rm $TMP_OUTPUT_FILENAME

echo
echo Done.
