# Tasks

This directory contains utility scripts for working with the library.


## `build.js`

Builds the library based on a configuration file.  See the `--help` option for more detail.

    node tasks/build.js --help

### Build configuration files

Build configuration files are JSON files that are used to determine what should be exported from the library and what options should be passed to the compiler.

 * **exports** - `Array.<string>` An array of symbol names or patterns to be exported (names that are used in your application).  For example, including `"ol.Map"` will export the map constructor.  Method names are prefixed with `#`.  So `"ol.Map#getView"` will export the map's `getView` method.  You can use a `*` at the end to match multiple names.  The pattern `"ol.Map#*"` will export all map methods.

 * **compile** - `Object` An object whose properties are [Closure Compiler options](https://github.com/openlayers/closure-util/blob/master/compiler-options.txt).  Property names match the option names without the `--` prefix (e.g. `"compilation_level": "ADVANCED_OPTIMIZATIONS"` would set the `--compilation_level` option).  Where an option can be specified multiple times, use an array for the value (e.g. `"externs": ["one.js", "two.js"]`).  Where an option is used as a flag, use a boolean value (e.g. `"use_types_for_optimization": true`).

Below is a complete `build.json` configuration file that would generate a build including every symbol in the library (much more than you'd ever need).

```json
{
  "exports": ["*"],
  "compile": {
    "compilation_level": "ADVANCED_OPTIMIZATIONS",
    "use_types_for_optimization": true,
    "externs": [
      "externs/olx.js",
      "externs/oli.js",
      "externs/geojson.js"
    ],
    "define": [
      "ol.ENABLE_PROJ4JS=false",
      "goog.dom.ASSUME_STANDARDS_MODE=true",
      "goog.DEBUG=false"
    ],
    "output_wrapper": "(function(){%output%})();"
  }
}
```

To generate a build named `ol.min.js` with the `build.json`, you would run this:

    node tasks/build.js build.json ol.min.js


## `generate-exports.js`

Called internally to generate a `build/exports.js` file optionally with a limited set of exports.


## `generate-symbols.js`

Called internally to parse the library for API annotations and write out a `build/symbols.json` file.


## `parse-examples.js`

Called after install to generate an example index.  After new examples are added, run `node tasks/parse-examples.js` to regenerate the example index.


## `serve.js`

Run a debug server that provides all library sources unminified.  Provides a static server for examples and tests.  See the `--help` option for more detail.

    node tasks/serve.js --help
