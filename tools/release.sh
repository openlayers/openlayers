#!/bin/sh

VERSION=$1

svn export http://svn.openlayers.org/tags/openlayers/release-$VERSION OpenLayers-$VERSION
cd OpenLayers-$VERSION/build
./build.py full
cp OpenLayers.js ..

cd ..

mkdir doc/devdocs
mkdir doc/apidocs
rm tools/*.pyc

mkdir /www/openlayers/htdocs/api/$VERSION
cp OpenLayers.js /www/openlayers/htdocs/api/$VERSION
cp -a img/ /www/openlayers/htdocs/api/$VERSION
cp -a theme/ /www/openlayers/htdocs/api/$VERSION

cd ..

~/nd/NaturalDocs -i OpenLayers-$VERSION/lib -o HTML OpenLayers-$VERSION/doc/devdocs -p OpenLayers-$VERSION/doc_config -s Small OL
~/nd/NaturalDocs -i OpenLayers-$VERSION/lib -o HTML OpenLayers-$VERSION/doc/apidocs -p OpenLayers-$VERSION/apidoc_config -s Small OL

tar cvfz OpenLayers-$VERSION.tar.gz OpenLayers-$VERSION/
zip -9r OpenLayers-$VERSION.zip OpenLayers-$VERSION/

cp OpenLayers-$VERSION.* /www/openlayers/htdocs/download 
