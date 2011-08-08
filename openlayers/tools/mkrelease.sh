#!/bin/sh -x

svn export http://svn.openlayers.org/tags/openlayers/release-$VERSION OpenLayers-$VERSION
cd OpenLayers-$VERSION/build
./build.py
mkdir /osgeo/openlayers/docs/api/$VERSION
cd ..
cp build/OpenLayers.js /osgeo/openlayers/docs/api/$VERSION
cp -a img/ /osgeo/openlayers/docs/api/$VERSION
cp -a theme/ /osgeo/openlayers/docs/api/$VERSION


# First remove all .pyc files from the directory.
  rm tools/*.pyc
  # move single file version
  cp build/OpenLayers.js OpenLayers.js
  rm build/OpenLayers.js
  
  cd ..
  mkdir OpenLayers-$VERSION/doc/devdocs
  naturaldocs -i OpenLayers-$VERSION/lib -o HTML OpenLayers-$VERSION/doc/devdocs -p OpenLayers-$VERSION/doc_config -s Default OL
  mkdir OpenLayers-$VERSION/doc/apidocs
  naturaldocs -i OpenLayers-$VERSION/lib -o HTML OpenLayers-$VERSION/doc/apidocs -p OpenLayers-$VERSION/apidoc_config -s Default OL

  tar cvfz OpenLayers-$VERSION.tar.gz OpenLayers-$VERSION/
  cp OpenLayers-$VERSION.tar.gz /osgeo/openlayers/docs/download
  zip -9r OpenLayers-$VERSION.zip OpenLayers-$VERSION/

