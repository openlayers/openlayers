#!/usr/bin/env python

import sys
import os
sys.path.append("../tools")
import mergejs
import optparse

def build(config_file = None, output_file = None, options = None):
    have_compressor = []
    try:
        import jsmin
        have_compressor.append("jsmin")
    except ImportError:
        print "No jsmin"
    try:
        # tools/closure_library_jscompiler.py from: 
        #       http://code.google.com/p/closure-library/source/browse/trunk/closure/bin/build/jscompiler.py
        import closure_library_jscompiler as closureCompiler
        have_compressor.append("closure")
    except Exception, E:
        print "No closure (%s)" % E
    try:
        import closure_ws
        have_compressor.append("closure_ws")
    except ImportError:
        print "No closure_ws"
    
    try:
        import minimize
        have_compressor.append("minimize")
    except ImportError:
        print "No minimize"

    try:
        import uglify_js
        uglify_js.check_available()
        have_compressor.append("uglify-js")
    except Exception, E:
        print "No uglify-js (%s)" % E

    use_compressor = None
    if options.compressor and options.compressor in have_compressor:
        use_compressor = options.compressor

    sourceDirectory = "../lib"
    configFilename = "full.cfg"
    outputFilename = "OpenLayers.js"

    if config_file:
        configFilename = config_file
        extension = configFilename[-4:]

        if extension  != ".cfg":
            configFilename = config_file + ".cfg"

    if output_file:
        outputFilename = output_file

    print "Merging libraries."
    try:
        if use_compressor == "closure" or use_compressor == 'uglify-js':
            sourceFiles = mergejs.getNames(sourceDirectory, configFilename)
        else:
            merged = mergejs.run(sourceDirectory, None, configFilename)
    except mergejs.MissingImport, E:
        print "\nAbnormal termination."
        sys.exit("ERROR: %s" % E)

    if options.amdname:
        options.amdname = "'" + options.amdname + "',"
    else:
        options.amdname = ""
        
    if options.amd == 'pre':
        print "\nAdding AMD function."
        merged = "define(%sfunction(){%sreturn OpenLayers;});" % (options.amdname, merged)
    
    print "Compressing using %s" % use_compressor
    if use_compressor == "jsmin":
        minimized = jsmin.jsmin(merged)
    elif use_compressor == "minimize":
        minimized = minimize.minimize(merged)
    elif use_compressor == "closure_ws":
        if len(merged) > 1000000: # The maximum file size for this web service is 1000 KB.
            print "\nPre-compressing using jsmin"
            merged = jsmin.jsmin(merged)
        print "\nIs being compressed using Closure Compiler Service."
        try:
            minimized = closure_ws.minimize(merged)
        except Exception, E:
            print "\nAbnormal termination."
            sys.exit("ERROR: Closure Compilation using Web service failed!\n%s" % E)
        if len(minimized) <= 2:
            print "\nAbnormal termination due to compilation errors."
            sys.exit("ERROR: Closure Compilation using Web service failed!")
        else:
            print "Closure Compilation using Web service has completed successfully."
    elif use_compressor == "closure":
        jscompilerJar = "../tools/closure-compiler.jar"
        if not os.path.isfile(jscompilerJar):
            print "\nNo closure-compiler.jar; read README.txt!"
            sys.exit("ERROR: Closure Compiler \"%s\" does not exist! Read README.txt" % jscompilerJar)
        minimized = closureCompiler.Compile(
            jscompilerJar, 
            sourceFiles, [
                "--externs", "closure-compiler/Externs.js",
                "--jscomp_warning", "checkVars",   # To enable "undefinedVars"
                "--jscomp_error",   "checkRegExp", # Also necessary to enable "undefinedVars"
                "--jscomp_error",   "undefinedVars"
            ]
        )
        if minimized is None:
            print "\nAbnormal termination due to compilation errors." 
            sys.exit("ERROR: Closure Compilation failed! See compilation errors.") 
        print "Closure Compilation has completed successfully."
    elif use_compressor == "uglify-js":
        minimized = uglify_js.compile(sourceFiles)
        if minimized is None:
            print "\nAbnormal termination due to compilation errors."
            sys.exit("ERROR: Uglify JS compilation failed! See compilation errors.")

        print "Uglify JS compilation has completed successfully."

    else: # fallback
        minimized = merged 

    if options.amd == 'post':
        print "\nAdding AMD function."
        minimized = "define(%sfunction(){%sreturn OpenLayers;});" % (options.amdname, minimized)
    
    if options.status:
        print "\nAdding status file."
        minimized = "// status: " + file(options.status).read() + minimized
    
    print "\nAdding license file."
    minimized = file("license.txt").read() + minimized

    print "Writing to %s." % outputFilename
    file(outputFilename, "w").write(minimized)

    print "Done."

if __name__ == '__main__':
  opt = optparse.OptionParser(usage="%s [options] [config_file] [output_file]\n  Default config_file is 'full.cfg', Default output_file is 'OpenLayers.js'")
  opt.add_option("-c", "--compressor", dest="compressor", help="compression method: one of 'jsmin' (default), 'minimize', 'closure_ws', 'closure', or 'none'", default="jsmin")
  opt.add_option("-s", "--status", dest="status", help="name of a file whose contents will be added as a comment at the front of the output file. For example, when building from a git repo, you can save the output of 'git describe --tags' in this file. Default is no file.", default=False)
  opt.add_option("--amd", dest="amd", help="output should be AMD module; wrap merged files in define function; can be either 'pre' (before compilation) or 'post' (after compilation). Wrapping the OpenLayers var in a function means the filesize can be reduced by the closure compiler using 'pre', but be aware that a few functions depend on the OpenLayers variable being present. Either option can be used with jsmin or minimize compression. Default false, not AMD.", default=False)
  opt.add_option("--amdname", dest="amdname", help="only useful with amd option. Name of AMD module. Default no name, anonymous module.", default=False)
  (options, args) = opt.parse_args()
  if not len(args):
    build(options=options)
  elif len(args) == 1:
    build(args[0], options=options)
  elif len(args) == 2:
    build(args[0], args[1], options=options)
  else:
    print "Wrong number of arguments"