from selenium import selenium
import time

while True:

    browsers = ['firefox']
    for b in browsers:
        s = selenium("localhost", 4444, "*%s" % b, "http://openlayers.org/")
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
                html = s.get_eval("window.document.getElementById('results').innerHTML")
                all_html = """<html>
  <head>    
    <meta content="text/html; charset=utf-8" http-equiv="content-type" />
  </head>
  <body>%s</body></html>""" % html

                f = open("fail.%s.%s.html" % (time.time(), b), "w")
                f.write(all_html)
                f.close()
        except Exception, E:
            print "Error: ", E
        s.stop()

    print "sleeping for one hour"
    time.sleep(3600)            
