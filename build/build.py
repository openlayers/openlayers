#!/usr/bin/env python

import sys
sys.path.append("../tools")

import jsmin, mergejs

sourceDirectory = "../lib"
configFilename = "library.cfg"
outputFilename = "OpenLayers.js"

if len(sys.argv) > 1:
    configFilename = sys.argv[1]
    extension = configFilename[-4:]

    if extension  != ".cfg":
        configFilename = sys.argv[1] + ".cfg"

if len(sys.argv) > 2:
    outputFilename = sys.argv[2]

print "Merging libraries."
merged = mergejs.run(sourceDirectory, None, configFilename)
print "Compressing."
minimized = jsmin.jsmin(merged)
print "Adding license file."
minimized = file("license.txt").read() + minimized

print "Writing to %s." % outputFilename
file(outputFilename, "w").write(minimized)

print "Done."
