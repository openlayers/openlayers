#!/bin/sh

# check to see if the hosted examples or API docs need an update
cd /osgeo/openlayers/repos/openlayers
REMOTE_HEAD=`git ls-remote https://github.com/openlayers/openlayers/ | grep HEAD | awk '{print $1}'`
LOCAL_HEAD=`git rev-parse HEAD`

# if there's something different in the remote, update and build
if [ ! o$REMOTE_HEAD = o$LOCAL_HEAD ]; then
    
    git checkout master
    git clean -f
    git pull origin master
    
    # copy everything over to the dev dir within the website (keep the clone clean)
    rsync -r --exclude=.git . /osgeo/openlayers/sites/openlayers.org/dev
    
    # make examples use built lib
    cd /osgeo/openlayers/sites/openlayers.org/dev/tools

    python exampleparser.py /osgeo/openlayers/repos/openlayers/examples /osgeo/openlayers/sites/openlayers.org/dev/examples
    
    if [ ! -f closure-compiler.jar ]; then
        wget -c http://closure-compiler.googlecode.com/files/compiler-latest.zip
        unzip compiler-latest.zip 
        mv compiler.jar closure-compiler.jar
    fi

    cd /osgeo/openlayers/sites/openlayers.org/dev/build
    ./build.py -c closure tests.cfg
    ./build.py -c closure mobile.cfg OpenLayers.mobile.js
    ./build.py -c closure light.cfg OpenLayers.light.js
    ./build.py -c none tests.cfg OpenLayers.debug.js
    ./build.py -c none mobile.cfg OpenLayers.mobile.debug.js
    ./build.py -c none light.cfg OpenLayers.light.debug.js
    cp OpenLayers*.js ..

    cd /osgeo/openlayers/sites/openlayers.org/dev
    sed -i -e 's!../lib/OpenLayers.js?mobile!../OpenLayers.mobile.js!' examples/*.html
    sed -i -e 's!../lib/OpenLayers.js!../OpenLayers.js!' examples/*.html

    # update the API docs
    if [ ! -d /osgeo/openlayers/sites/dev.openlayers.org/apidocs ]; then
        mkdir -p /osgeo/openlayers/sites/dev.openlayers.org/apidocs
    fi
    if [ ! -d /osgeo/openlayers/sites/dev.openlayers.org/docs ]; then
        mkdir -p /osgeo/openlayers/sites/dev.openlayers.org/docs
    fi
    naturaldocs --input lib --output HTML /osgeo/openlayers/sites/dev.openlayers.org/apidocs -p apidoc_config -s Default OL
    naturaldocs --input lib --output HTML /osgeo/openlayers/sites/dev.openlayers.org/docs -p doc_config -s Default OL

fi

# check to see if the website needs an update
cd /osgeo/openlayers/repos/website
REMOTE_HEAD=`git ls-remote https://github.com/openlayers/website/ | grep HEAD | awk '{print $1}'`
LOCAL_HEAD=`git rev-parse HEAD`

# if there's something different in the remote, update the clone
if [ ! o$REMOTE_HEAD = o$LOCAL_HEAD ]; then
    
    git checkout master
    git clean -f
    git pull origin master
    
    # copy everything over to the website dir (keep the clone clean)
    # can't use --delete here because of nested dev dir from above
    rsync -r --exclude=.git . /osgeo/openlayers/sites/openlayers.org
    
fi

# check to see if prose docs need an update
cd /osgeo/openlayers/repos/docs
REMOTE_HEAD=`git ls-remote https://github.com/openlayers/docs/ | grep HEAD | awk '{print $1}'`
LOCAL_HEAD=`git rev-parse HEAD`

# if there's something different in the remote, update the clone
if [ ! o$REMOTE_HEAD = o$LOCAL_HEAD ]; then
    
    git checkout master
    git clean -f
    git pull origin master

    mkdir -p /osgeo/openlayers/sites/docs.openlayers.org /tmp/ol/docs/build/doctrees
    sphinx-build -b html -d /tmp/ol/docs/build/doctrees . /osgeo/openlayers/sites/docs.openlayers.org
    
fi

## UPDATES FROM THE OLD SVN REPO

# Get current 'Last Changed Rev'
SVNREV=`svn info http://svn.openlayers.org/ | grep 'Revision' | awk '{print $2}'`

# Get the last svn rev
touch /tmp/ol_svn_rev
OLD_SVNREV="o`cat /tmp/ol_svn_rev`"

# If they're not equal, do some work.
if [ ! o$SVNREV = $OLD_SVNREV ]; then
    svn up /osgeo/openlayers/repos/old_svn_repo/
    # Record the revision
    echo -n $SVNREV > /tmp/ol_svn_rev
fi
