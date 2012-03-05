#!/bin/sh

# Used to update http://openlayers.org/dev/ 


# Get current 'Last Changed Rev'
GITREV=`svn info https://github.com/openlayers/openlayers/ | grep 'Revision' | awk '{print $2}'`
SVNREV=`svn info http://svn.openlayers.org/ | grep 'Revision' | awk '{print $2}'`

# Get the last svn rev
touch /tmp/ol_git_rev
touch /tmp/ol_svn_rev
OLD_GITREV="o`cat /tmp/ol_git_rev`"
OLD_SVNREV="o`cat /tmp/ol_svn_rev`"

# If they're not equal, do some work.
if [ ! o$GITREV = $OLD_GITREV ]; then
    svn revert -R /osgeo/openlayers/docs/dev
    svn up /osgeo/openlayers/docs/dev

    # Also update website
    svn up /osgeo/openlayers/docs/

    cd /osgeo/openlayers/docs/dev/tools/ 
    python exampleparser.py
    cd /osgeo/openlayers/docs/dev/build
    ./build.py -c closure tests.cfg
    ./build.py -c closure mobile.cfg OpenLayers.mobile.js
    ./build.py -c closure light.cfg OpenLayers.light.js
	./build.py -c none tests.cfg OpenLayers.debug.js
	./build.py -c none mobile.cfg OpenLayers.mobile.debug.js
	./build.py -c none light.cfg OpenLayers.light.debug.js
    
    cp OpenLayers.js ..
    cp OpenLayers.*.js ..

    cd ..
    for i in google ie6-style style; do
        csstidy theme/default/$i.css --template=highest theme/default/$i.tidy.css
        cp theme/default/$i.tidy.css theme/default/$i.css
    done

    sed -i -e 's!../lib/OpenLayers.js?mobile!../OpenLayers.mobile.js!' examples/*.html
    sed -i -e 's!../lib/OpenLayers.js!../OpenLayers.js!' examples/*.html
    naturaldocs -i /osgeo/openlayers/docs/dev/lib -o HTML /osgeo/openlayers/dev/apidocs -p /osgeo/openlayers/docs/dev/apidoc_config -s Default OL >/dev/null
    naturaldocs -i /osgeo/openlayers/docs/dev/lib -o HTML /osgeo/openlayers/dev/docs -p /osgeo/openlayers/docs/dev/doc_config -s Default OL >/dev/null
    # Record the revision
    echo -n $GITREV > /tmp/ol_git_rev
fi
if [ ! o$SVNREV = $OLD_SVNREV ]; then
    svn up /osgeo/openlayers/dev/sandbox/
    svn up /osgeo/openlayers/dev/addins/
    # Record the revision
    echo -n $SVNREV > /tmp/ol_svn_rev
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
