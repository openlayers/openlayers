#!/bin/sh
VERSION=$1
echo "Building OpenLayers $VERSION"
svn export http://svn.openlayers.org/tags/openlayers/release-$VERSION OpenLayers-$VERSION
cd OpenLayers-$VERSION/build
./build.sh
mkdir /www/openlayers/htdocs/api/$VERSION
cp OpenLayers.js /www/openlayers/htdocs/api/$VERSION
cd ..
cp -a img/ /www/openlayers/htdocs/api/$VERSION
rm tools/*.pyc
cd ..
tar -zvcf OpenLayers-$VERSION.tar.gz OpenLayers-$VERSION
cp OpenLayers-$VERSION.tar.gz /www/openlayers/htdocs/download/
