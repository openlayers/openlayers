#!/bin/sh

# Used to update http://openlayers.org/dev/ 

svn up /www/openlayers/docs/dev; 

# Get current 'Last Changed Rev'
REV=`svn info /www/openlayers/docs/dev/ | grep 'Last Changed Rev' | awk '{print $4}'`

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
    perl /home/crschmidt/NaturalDocs -i /www/openlayers/docs/dev/lib -o HTML /www/openlayers/dev/apidocs -p /www/openlayers/docs/dev/apidoc_config -s Default OL >/dev/null
    perl /home/crschmidt/NaturalDocs -i /www/openlayers/docs/dev/lib -o HTML /www/openlayers/dev/docs -p /www/openlayers/docs/dev/doc_config -s Default OL >/dev/null

    # Record the revision
    echo -n $REV > /tmp/ol_svn_rev
fi    
   
svn up /www/openlayers/documentation-checkout
REV=`svn info /www/openlayers/documentation-checkout | grep 'Last Changed Rev' | awk '{print $4}'`
# Get the last svn rev
touch /tmp/ol_doc_rev
OLD_REV="o`cat /tmp/ol_doc_rev`"
# If they're not equal, do some work.
if [ ! o$REV = $OLD_REV ]; then
    cd /www/openlayers/documentation-checkout
    make html > /dev/null
    cp -r _build/html/*  /www/openlayers/documentation
    
    echo -n $REV > /tmp/ol_doc_rev
fi    
