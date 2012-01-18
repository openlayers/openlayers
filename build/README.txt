The OpenLayers build tool supports several different
forms of compressing your javascript code, and a method
of describing build profiles to create customized 
OpenLayers builds with only the components you need.

When building a file, you can choose to build with several
different compression options to the Python-based build.py
script. The following is an example script:

python build.py -c closure full OpenLayers-closure.js

This script selects the 'closure' compression mechanism,
uses a config file called 'full.cfg', and writes the output
to OpenLayers-closure.js.

The options available for compression are:

 * closure
   This requires you to have a closure-compiler.jar in your
   tools directory. You can do this by fetching the compiler
   from:

     http://closure-compiler.googlecode.com/files/compiler-latest.zip

   Then unzipping that file, and placing compiler.jar into tools
   and renaming it closure-compiler.jar.

 * closure_ws
   This uses the closure compiler webservice. This will only work
   for files source Javascript files which are under 1MB. (Note that
   the default OpenLayers full build is not under 1MB.)

 * jsmin
   jsmin is the default compiler, and uses the Python-based
   jsmin script to compress the Javascript. 

 * minimize
   This is a simple whitespace removing Python script, designed
   to fill in when other tools are unavailable.

 * none
   None will leave the Javascript uncompressed.


For more information on the build script and custom build profiles,
see http://docs.openlayers.org/library/deploying.html
