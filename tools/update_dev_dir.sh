#!/bin/sh

# Used to update http://openlayers.org/dev/ 

svn up /www/openlayers/docs/dev; 

# Get current Revision
REV=`svn info /www/openlayers/docs/dev/ | grep Revision | awk '{print $2}'`

# Get the last svn rev
touch /tmp/ol_svn_rev
OLD_REV="o`cat /tmp/ol_svn_rev`"

# If they're not equal, do some work.
if [ ! o$REV = $OLD_REV ]; then

    cd /www/openlayers/docs/dev/tools/ 
    python exampleparser.py
    cd /www/openlayers/docs/dev/build
    ./build.py
    
    cp OpenLayers.js ..
    cd ..
    
    sed -i -e 's!../lib/OpenLayers.js!../OpenLayers.js!' examples/*.html

    # Record the revision
    echo -n $REV > /tmp/ol_svn_rev
fi    
