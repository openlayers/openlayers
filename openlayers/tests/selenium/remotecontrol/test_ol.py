from selenium import selenium
import time
import sys
from ConfigParser import ConfigParser

MAX_TEST_LENGTH = 300
if len(sys.argv) > 2: 
    filename = sys.argv[2]
else:
    filename = "config.cfg"

c = ConfigParser()
c.read(filename)

targets = {}

server = c.get('config', 'server') 
url= c.get('config', 'url')
if c.has_option('config', 'timeout'):
    MAX_TEST_LENGTH = int(c.get('config', 'timeout'))


sections = c.sections()
for s in sections:
    if s == 'config':
       continue
    targets[s] = dict(c.items(s))
    targets[s]['name'] = s

if sys.argv[1] == "all":
    browsers = list(targets.values())
elif sys.argv[1] not in targets:
    print "Invalid target"
    sys.exit()
else:    
    browsers = [targets[sys.argv[1]]]

keep_going = True

if 1:
    for b in browsers:
        if not keep_going: 
            continue

        print "Running %s on %s" % (b['name'], b['host']) 
        s = selenium(b['host'], 4444, "*%s" % b['browsercmd'], server)
        s.start()
        try:
            s.open_window(url, "test_running")
            time.sleep(2)
            s.select_window("test_running")
            time.sleep(2)
            s.refresh()
            
            count = 0
            while count == 0: 
                count = int(s.get_eval("window.document.getElementById('testtable').getElementsByTagName('tr').length"))
                time.sleep(5)
                
            ok = 0 
            fail = 0
            last_change = time.time()
            while True:
                new_ok = int(s.get_eval('window.Test.AnotherWay._g_ok_pages'))
                new_fail = int(s.get_eval('window.Test.AnotherWay._g_fail_pages'))
                if new_ok != ok or new_fail != fail:
                    ok = new_ok
                    fail = new_fail
                    last_change = time.time()
                    
                if (ok + fail) >= count:
                    break 
                if time.time() - last_change > MAX_TEST_LENGTH:
                    raise Exception("Failed: with %s okay and %s failed, ran out of time: %s is more than %s" % (ok, fail, (time.time() - last_change), MAX_TEST_LENGTH))      
                time.sleep(10)
            
            if fail:
                print "Failed: %s" % fail
                html = s.get_eval("window.document.getElementById('results').innerHTML").encode("utf-8")
                all_html = """<html>
  <head>    
    <meta content="text/html; charset=utf-8" http-equiv="content-type" />
  </head>
  <body>%s</body></html>""" % html

                f = open("fail.%s.%s.html" % (time.time(), b['name']), "w")
                f.write(all_html)
                f.close()
        except KeyboardInterrupt, E:
            keep_going = False
            print "Stopped by keyboard interrupt"
        except Exception, E:
            print "Error: ", E
        s.stop()

