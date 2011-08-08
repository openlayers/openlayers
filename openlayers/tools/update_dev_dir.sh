#!/bin/sh

# Used to update http://openlayers.org/dev/ 


# Get current 'Last Changed Rev'
REV=`svn info http://svn.openlayers.org/ | grep 'Revision' | awk '{print $2}'`

# Get the last svn rev
touch /tmp/ol_svn_rev
OLD_REV="o`cat /tmp/ol_svn_rev`"

# If they're not equal, do some work.
if [ ! o$REV = $OLD_REV ]; then
    svn revert -R /osgeo/openlayers/docs/dev
    svn up /osgeo/openlayers/docs/dev

    # Also update website
    svn up /osgeo/openlayers/docs/

    cd /osgeo/openlayers/docs/dev/tools/ 
    python exampleparser.py
    cd /osgeo/openlayers/docs/dev/build
    ./build.py -c closure tests.cfg
    ./build.py -c closure mobile.cfg OpenLayers.mobile.js
    
    cp OpenLayers.js ..
    cp OpenLayers.mobile.js ..

    cd ..
    for i in google ie6-style style; do
        csstidy theme/default/$i.css --template=highest theme/default/$i.tidy.css
        cp theme/default/$i.tidy.css theme/default/$i.css
    done

    sed -i -e 's!../lib/OpenLayers.js?mobile!../OpenLayers.mobile.js!' examples/*.html
    sed -i -e 's!../lib/OpenLayers.js!../OpenLayers.js!' examples/*.html
    naturaldocs -i /osgeo/openlayers/docs/dev/lib -o HTML /osgeo/openlayers/dev/apidocs -p /osgeo/openlayers/docs/dev/apidoc_config -s Default OL >/dev/null
    naturaldocs -i /osgeo/openlayers/docs/dev/lib -o HTML /osgeo/openlayers/dev/docs -p /osgeo/openlayers/docs/dev/doc_config -s Default OL >/dev/null
    
    svn up /osgeo/openlayers/dev/sandbox/
    # Record the revision
    echo -n $REV > /tmp/ol_svn_rev
fi    
   
svn up /osgeo/openlayers/documentation-checkout
REV=`svn info /osgeo/openlayers/documentation-checkout | grep 'Last Changed Rev' | awk '{print $4}'`
# Get the last svn rev
touch /tmp/ol_doc_rev
OLD_REV="o`cat /tmp/ol_doc_rev`"
# If they're not equal, do some work.
if [ ! o$REV = $OLD_REV ]; then
    cd /osgeo/openlayers/documentation-checkout
    make html > /dev/null
    cp -r _build/html/*  /osgeo/openlayers/documentation
    
    echo -n $REV > /tmp/ol_doc_rev
fi    
