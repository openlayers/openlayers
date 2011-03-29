#!/usr/bin/env python
#
# Merge multiple JavaScript source code files into one.
#
# Usage:
# This script requires source files to have dependencies specified in them.
#
# Dependencies are specified with a comment of the form:
#
#     // @requires <file path>
#
#  e.g.
#
#    // @requires Geo/DataSource.js
#
# This script should be executed like so:
#
#     mergejs.py <output.js> <directory> [...]
#
# e.g.
#
#     mergejs.py openlayers.js Geo/ CrossBrowser/
#
#  This example will cause the script to walk the `Geo` and
#  `CrossBrowser` directories--and subdirectories thereof--and import
#  all `*.js` files encountered. The dependency declarations will be extracted
#  and then the source code from imported files will be output to 
#  a file named `openlayers.js` in an order which fulfils the dependencies
#  specified.
#
#
# Note: This is a very rough initial version of this code.
#
# -- Copyright 2005-2011 OpenLayers contributors / OpenLayers project --
#

# TODO: Allow files to be excluded. e.g. `Crossbrowser/DebugMode.js`?
# TODO: Report error when dependency can not be found rather than KeyError.

import re
import os
import sys

SUFFIX_JAVASCRIPT = ".js"

RE_REQUIRE = "@requires?:? (.*)\n" # TODO: Ensure in comment?

class MissingImport(Exception):
    """Exception raised when a listed import is not found in the lib."""

class SourceFile:
    """
    Represents a Javascript source code file.
    """

    def __init__(self, filepath, source):
        """
        """
        self.filepath = filepath
        self.source = source

        self.requiredBy = []


    def _getRequirements(self):
        """
        Extracts the dependencies specified in the source code and returns
        a list of them.
        """
        # TODO: Cache?
        return re.findall(RE_REQUIRE, self.source)

    requires = property(fget=_getRequirements, doc="")



def usage(filename):
    """
    Displays a usage message.
    """
    print "%s [-c <config file>] <output.js> <directory> [...]" % filename


class Config:
    """
    Represents a parsed configuration file.

    A configuration file should be of the following form:

        [first]
        3rd/prototype.js
        core/application.js
        core/params.js
        # A comment

        [last]
        core/api.js # Another comment

        [exclude]
        3rd/logger.js
        exclude/this/dir

    All headings are required.

    The files listed in the `first` section will be forced to load
    *before* all other files (in the order listed). The files in `last`
    section will be forced to load *after* all the other files (in the
    order listed).

    The files list in the `exclude` section will not be imported.

    Any text appearing after a # symbol indicates a comment.
    
    """

    def __init__(self, filename):
        """
        Parses the content of the named file and stores the values.
        """
        lines = [re.sub("#.*?$", "", line).strip() # Assumes end-of-line character is present
                 for line in open(filename)
                 if line.strip() and not line.strip().startswith("#")] # Skip blank lines and comments

        self.forceFirst = lines[lines.index("[first]") + 1:lines.index("[last]")]

        self.forceLast = lines[lines.index("[last]") + 1:lines.index("[include]")]
        self.include =  lines[lines.index("[include]") + 1:lines.index("[exclude]")]
        self.exclude =  lines[lines.index("[exclude]") + 1:]

def undesired(filepath, excludes):
    # exclude file if listed
    exclude = filepath in excludes
    if not exclude:
        # check if directory is listed
        for excludepath in excludes:
            if not excludepath.endswith("/"):
                excludepath += "/"
            if filepath.startswith(excludepath):
                exclude = True
                break
    return exclude
            

def run (sourceDirectory, outputFilename = None, configFile = None):
    cfg = None
    if configFile:
        cfg = Config(configFile)

    allFiles = []

    ## Find all the Javascript source files
    for root, dirs, files in os.walk(sourceDirectory):
        for filename in files:
            if filename.endswith(SUFFIX_JAVASCRIPT) and not filename.startswith("."):
                filepath = os.path.join(root, filename)[len(sourceDirectory)+1:]
                filepath = filepath.replace("\\", "/")
                if cfg and cfg.include:
                    if filepath in cfg.include or filepath in cfg.forceFirst:
                        allFiles.append(filepath)
                elif (not cfg) or (not undesired(filepath, cfg.exclude)):
                    allFiles.append(filepath)

    ## Header inserted at the start of each file in the output
    HEADER = "/* " + "=" * 70 + "\n    %s\n" + "   " + "=" * 70 + " */\n\n"

    files = {}

    ## Import file source code
    ## TODO: Do import when we walk the directories above?
    for filepath in allFiles:
        print "Importing: %s" % filepath
        fullpath = os.path.join(sourceDirectory, filepath).strip()
        content = open(fullpath, "U").read() # TODO: Ensure end of line @ EOF?
        files[filepath] = SourceFile(filepath, content) # TODO: Chop path?

    print

    from toposort import toposort

    complete = False
    resolution_pass = 1

    while not complete:
        complete = True

        ## Resolve the dependencies
        print "Resolution pass %s... " % resolution_pass
        resolution_pass += 1 

        for filepath, info in files.items():
            for path in info.requires:
                if not files.has_key(path):
                    complete = False
                    fullpath = os.path.join(sourceDirectory, path).strip()
                    if os.path.exists(fullpath):
                        print "Importing: %s" % path
                        content = open(fullpath, "U").read() # TODO: Ensure end of line @ EOF?
                        files[path] = SourceFile(path, content) # TODO: Chop path?
                    else:
                        raise MissingImport("File '%s' not found (required by '%s')." % (path, filepath))
        
    # create dictionary of dependencies
    dependencies = {}
    for filepath, info in files.items():
        dependencies[filepath] = info.requires

    print "Sorting..."
    order = toposort(dependencies) #[x for x in toposort(dependencies)]

    ## Move forced first and last files to the required position
    if cfg:
        print "Re-ordering files..."
        order = cfg.forceFirst + [item
                     for item in order
                     if ((item not in cfg.forceFirst) and
                         (item not in cfg.forceLast))] + cfg.forceLast
    
    print
    ## Output the files in the determined order
    result = []

    for fp in order:
        f = files[fp]
        print "Exporting: ", f.filepath
        result.append(HEADER % f.filepath)
        source = f.source
        result.append(source)
        if not source.endswith("\n"):
            result.append("\n")

    print "\nTotal files merged: %d " % len(files)

    if outputFilename:
        print "\nGenerating: %s" % (outputFilename)
        open(outputFilename, "w").write("".join(result))
    return "".join(result)

if __name__ == "__main__":
    import getopt

    options, args = getopt.getopt(sys.argv[1:], "-c:")
    
    try:
        outputFilename = args[0]
    except IndexError:
        usage(sys.argv[0])
        raise SystemExit
    else:
        sourceDirectory = args[1]
        if not sourceDirectory:
            usage(sys.argv[0])
            raise SystemExit

    configFile = None
    if options and options[0][0] == "-c":
        configFile = options[0][1]
        print "Parsing configuration file: %s" % filename

    run( sourceDirectory, outputFilename, configFile )
