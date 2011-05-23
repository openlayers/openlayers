#!/bin/sh

RELEASE=$1
RC=$2

svn co http://svn.openlayers.org/branches/openlayers/$RELEASE
cd $RELEASE
sed -i -e "s/OpenLayers.VERSION_NUMBER=.*/OpenLayers.VERSION_NUMBER=\"Release $1-$2\";/" lib/OpenLayers.js 
sed -i -e "s/VERSION_NUMBER: .*,/VERSION_NUMBER: \"Release $1-$2\",/" lib/OpenLayers/SingleFile.js
svn diff;
sleep 10;
svn ci -m "Updating version numbers for $1-$2".
svn cp -m "Tagging the $1-$2 release." http://svn.openlayers.org/branches/openlayers/$1 http://svn.openlayers.org/tags/openlayers/release-$1-$2
