# Build Utilities

This directory contains utilities used for building OpenLayers applications, 
generating the API docs, and building hosted versions of the library.

## Dependencies

OpenLayers is built using [Closure Compiler][closure].  The [plovr][plovr] build
tool simplifies building with Closure Compiler and comes with a built-in version
of the Closure Library and Compiler.  Both the Compiler and plovr require Java
version 1.6 or above.  This directory includes a bash/batch script for driving
plovr.  For pulling down plovr and accessing it in a cross-platform way,
[Ant][ant] is used.

The instructions below assume that you have added the `ol` bash/batch script to
your path (type `ol` and see usage docs to confirm this is set up).

[closure]: https://developers.google.com/closure/compiler/
[plovr]: http://plovr.com/
[ant]: http://ant.apache.org/

## Building an Application

To compile an application together with OpenLayers, you will provide a build
configuration file for the compiler.  See the `demo` folder for example 
configuration files (e.g. `map.json`).

Compile your application with the `build` command:

    ol build path/to/config.json

Substitute the path to your build configuration file above.

## Building the API Docs

From within the root of the OpenLayers directory, use the `doc` command to build
the API docs:

    ol doc

This will generate documentation in the `jsdoc` directory.

## Building the Hosted Library

To compile the full OpenLayers api, use the `build` command from the root of the
OpenLayers directory:

    ol build

This will generate an `api.js` script in the same directory.  (This is equivalent to `ol build path/to/ol/api.json`.)

