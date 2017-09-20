#!/usr/bin/env python

""" Minimal web server with proxy

    Everything but '/proxy?url=' is considered a static file
"""

import os
import mimetypes
import urllib2

from urlparse import parse_qs
from wsgiref.simple_server import make_server

def static(environ, start_response, path):

        filepath = os.path.join(os.path.dirname(os.path.realpath(__file__)), path[1:])

        if os.path.exists(filepath):
            mime = mimetypes.guess_type(filepath)
            response_body = open(filepath).read()
            status = '200 OK'
            headers = [('Content-type', mime[0]),
                       ('Content-Length', str(len(response_body)))]

        else:
            headers = []
            status = '404 Not found'
            response_body = 'File not found'

        start_response(status, headers)

        return [response_body]

   

def proxy(environ, start_response):
    qs =  environ['QUERY_STRING']
    params = parse_qs(qs)


    if 'url' in params:
        print params['url']
        url = urllib2.unquote(params['url'][0])

        headers = {'Referer' : environ.get('HTTP_REFERER','')}
                
        request = urllib2.Request(url, None, headers)

        response = urllib2.urlopen(request)

        if response.code == 200:
            headers = response.headers
            print headers,dir(headers), headers.keys()
            content =  response.read()

            headers = [('Content-Type',headers.get('content-type')), 
                       ('Content-Length', headers.get('content-length'))]

            start_response("200 OK", headers)
            return content



def app(environ, start_response):
    path    = environ['PATH_INFO']
    method  = environ['REQUEST_METHOD']
    
    if method == 'POST':
            status = '405 Method Not Allowed'
            headers = [('Content-type', 'text/plain')]
            start_response(status, headers)
            return ['POST is not supported']
    else:

      if path.startswith('/proxy'):
          return proxy(environ, start_response)
      else:
          return static(environ, start_response, path)

      
      start_response("200 OK", [])
      return ["Some content"]



if __name__ == '__main__':

    PORT = 9000
    httpd = make_server('', PORT, app)
    print "Serving on port %d..." % PORT

    # Serve until process is killed
    httpd.serve_forever()
