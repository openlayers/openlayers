#!/usr/bin/env python


import os.path
import urllib2
from httplib2 import Http
from bottle import request, response,route, run, abort
from bottle import static_file, HTTPError

@route('/proxy')
def proxy():
    url = urllib2.unquote(request.GET.get('url'))
    http = Http(disable_ssl_certificate_validation=True)
    h = dict(request.headers)
    h.pop("Host", h)
    try:
        resp, content = http.request(url, headers=h)
    except:
        raise HTTPError(502, "Bad Gateway")
    
    if resp.status != 200:
        abort(resp.status)
   
    response.content_type = resp['content-type']
    response.set_header('Content-Length', resp['content-length'])
    
    return content


@route('/<filepath:path>')
def server_static(filepath):
    print filepath
    root = os.path.join(os.path.dirname(os.path.realpath(__file__)), '')

    return static_file(filepath, root= root)



run(host='localhost', port=9001, reloader=True, debug=True)


