#!/usr/bin/env python


"""This is a blind proxy that we use to get around browser
restrictions that prevent the Javascript from loading pages not on the
same server as the Javascript.  This has several problems: it's less
efficient, it might break some sites, and it's a security risk because
people can use this proxy to browse the web and possibly do bad stuff
with it.  If you can get your code signed (see:
http://trac.openlayers.org/wiki/HowToSignJavascript), then you should
modify Parameters.js so that this isn't used.  Otherwise, you're stuck
with it.  It only loads pages via http and https, but it can load any
content type. XML and HTML are both currently used by Openlayers."""

import urllib
import cgi

fs = cgi.FieldStorage()
url = fs.getvalue('url', "http://openlayers.org")

# Designed to prevent Open Proxy type stuff.

allowedHosts = ['www.openlayers.org', 'openlayers.org', 'octo.metacarta.com']

try:
    host = url.split("/")[2]
    if allowedHosts and not host in allowedHosts:
        print "Status: 502 Bad Gateway"
        print "Content-Type: text/plain"
        print
        print "This proxy does not allow you to access that location."
    
    elif url.startswith("http://") or url.startswith("https://"):
    
        y = urllib.urlopen(url)
        
        headers = str(y.info()).split('\n')
        for h in headers:
            if h.startswith("Content-Type:"):
                print h
        print
        
        print y.read()
        
        y.close()
    else:
        print """Content-Type: text/plain
 
Illegal request."""
except Exception, E:
    print "Status: 500 Unexpected Error"
    print "Content-Type: text/plain"
    print 
    print "Some unexpected error occurred. Error text was:", E
