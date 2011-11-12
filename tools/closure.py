import sys
import os
import tempfile

path = "../tools/closure-compiler.jar"
if not os.path.exists(path):
    raise Exception("No closure-compiler.jar at %s; read README.txt!" % path)

def minimize(code):
    ntf = tempfile.NamedTemporaryFile()
    ntf.close()
    open(ntf.name, "w").write(code)

    ntf2 = tempfile.NamedTemporaryFile()
    ntf2.close()

    os.system("java -jar %s --js %s --js_output_file %s" % (path, ntf.name, ntf2.name))
    data = open(ntf2.name).read()
    os.unlink(ntf.name) 
    os.unlink(ntf2.name) 
    return data
