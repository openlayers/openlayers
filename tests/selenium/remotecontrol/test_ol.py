from selenium import selenium
import time
import sys
from ConfigParser import ConfigParser

if len(sys.argv) > 2: 
    filename = sys.argv[2]
else:
    filename = "config.cfg"

c = ConfigParser()
c.read(filename)

targets = {}

sections = c.sections()
for s in sections:
    targets[s] = dict(c.items(s))
    targets[s]['name'] = s

if sys.argv[1] == "all":
    browsers = list(targets.values())
elif sys.argv[1] not in targets:
    print "Invalid target"
    sys.exit()
else:    
    browsers = [targets[sys.argv[1]]]


if 1:
    for b in browsers:
        print "Running %s on %s" % (b['name'], b['host']) 
        s = selenium(b['host'], 4444, "*%s" % b['browsercmd'], "http://openlayers.org/")
        s.start()
        try:
            s.open("/dev/tests/run-tests.html?run=all")
            
            count = 0
            while count == 0: 
                count = int(s.get_eval("window.document.getElementById('testtable').getElementsByTagName('tr').length"))
                time.sleep(5)
                
            ok = 0 
            fail = 0
            
            while True:
                ok = int(s.get_eval('window.Test.AnotherWay._g_ok_pages'))
                fail = int(s.get_eval('window.Test.AnotherWay._g_fail_pages'))
                if (ok + fail) >= count:
                    break 
                time.sleep(10)
            
            if fail:
                print "Failed: %s" % fail
                html = s.get_eval("window.document.getElementById('results').innerHTML").decode("utf-8")
                all_html = """<html>
  <head>    
    <meta content="text/html; charset=utf-8" http-equiv="content-type" />
  </head>
  <body>%s</body></html>""" % html

                f = open("fail.%s.%s.html" % (time.time(), b['name']), "w")
                f.write(all_html.encode)
                f.close()
        except Exception, E:
            print "Error: ", E
        s.stop()

