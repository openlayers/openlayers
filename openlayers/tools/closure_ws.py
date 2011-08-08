#!/usr/bin/python

import httplib, urllib, sys
import time
# Define the parameters for the POST request and encode them in
# a URL-safe format.

def minimize(code):

    params = urllib.urlencode([
        ('js_code', code),
        ('compilation_level', 'SIMPLE_OPTIMIZATIONS'),
        ('output_format', 'text'),
        ('output_info', 'compiled_code'),
      ])
    
    t = time.time()
    # Always use the following value for the Content-type header.
    headers = { "Content-type": "application/x-www-form-urlencoded" }
    conn = httplib.HTTPConnection('closure-compiler.appspot.com')
    conn.request('POST', '/compile', params, headers)
    response = conn.getresponse()
    data = response.read()
    conn.close()
    if data.startswith("Error"):
        raise Exception(data)
    print "%.3f seconds to compile" % (time.time() - t) 
    return data
