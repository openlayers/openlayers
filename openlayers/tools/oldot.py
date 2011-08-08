import re
import os    
def run():
    sourceDirectory = "../lib/OpenLayers"    
    allFiles = []
    SUFFIX_JAVASCRIPT = ".js"
    ## Find all the Javascript source files
    for root, dirs, files in os.walk(sourceDirectory):
        for filename in files:
            if filename.endswith(SUFFIX_JAVASCRIPT) and not filename.startswith("."):
                filepath = os.path.join(root, filename)[len(sourceDirectory)+1:]
                filepath = filepath.replace("\\", "/")
                data = open(os.path.join(sourceDirectory, filepath)).read()
                parents = re.search("OpenLayers.Class\((.*?){", data, 
                      re.DOTALL)
                if parents:
                    parents = [x.strip() for x in parents.group(1).strip().strip(",").split(",")]
                else: 
                    parents = []
                cls = "OpenLayers.%s" % filepath.strip(".js").replace("/", ".")
                allFiles.append([cls, parents])
    return allFiles
print """
digraph name {
  fontname = "Helvetica"
  fontsize = 8
  K = 0.6

  node [
    fontname = "Helvetica"
    fontsize = 8
    shape = "plaintext"
  ]
"""

for i in run():
    print i[0].replace(".", "_")
    for item in i[1]:
        if not item: continue
        print "%s -> %s" % (i[0].replace(".","_"), item.replace(".", "_"))
    print "; "

print """}"""
