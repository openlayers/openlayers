#!/usr/bin/env python
#
# Script to provide a wrapper around the ShrinkSafe "web service"
# <http://alex.dojotoolkit.org/shrinksafe/>
#

#
# We use this script for two reasons:
#
#  * This avoids having to install and configure Java and the standalone
#    ShrinkSafe utility.
#
#  * The current ShrinkSafe standalone utility was broken when we last
#    used it.
#

import sys

import urllib
import urllib2

URL_SHRINK_SAFE = "http://alex.dojotoolkit.org/shrinksafe/shrinksafe.php"

# This would normally be dynamically generated:
BOUNDARY_MARKER = "---------------------------72288400411964641492083565382"
                   
if __name__ == "__main__":
    ## Grab the source code
    try:
        sourceFilename = sys.argv[1]
    except:
        print "Usage: %s (<source filename>|-)" % sys.argv[0]
        raise SystemExit

    if sourceFilename == "-":
        sourceCode = sys.stdin.read()
        sourceFilename = "stdin.js"
    else:
        sourceCode = open(sourceFilename).read()
        
    ## Create the request replicating posting of the form from the web page
    request = urllib2.Request(url=URL_SHRINK_SAFE)
    request.add_header("Content-Type",
                       "multipart/form-data; boundary=%s" % BOUNDARY_MARKER)
    request.add_data("""
--%s
Content-Disposition: form-data; name="shrinkfile[]"; filename="%s"
Content-Type: application/x-javascript

%s
""" % (BOUNDARY_MARKER, sourceFilename, sourceCode))

    ## Deliver the result
    print urllib2.urlopen(request).read(),
