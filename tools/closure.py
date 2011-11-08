import sys
import os
import tempfile

path = "../tools/closure-compiler.jar"
if not os.path.exists(path):
    raise Exception("No closure-compiler.jar at %s; read README.txt!" % path)

def minimize(code):
    ntf = tempfile.NamedTemporaryFile()
    ntf.write(code)
    ntf.flush()

    ntf2 = tempfile.NamedTemporaryFile()

    os.system("java -jar %s --js %s --js_output_file %s" % (path, ntf.name, ntf2.name))
    data = open(ntf2.name).read()
    ntf.close()
    ntf2.close()
    return data
