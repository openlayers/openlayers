# Tasks

This directory contains utility scripts for working with the library.


## `build.js`

Builds the library based on a configuration file.  See the `--help` option for more detail.

    node tasks/build.js --help

### Build configuration files

Build configuration files are JSON files that are used to determine what should be exported from the library and what options should be passed to the compiler.

**Required configuration properties**

 * **exports** - `Array.<string>` An array of symbol names or patterns to be exported (names that are used in your application).  For example, including `"ol.Map"` will export the map constructor.  Method names are prefixed with `#`.  So `"ol.Map#getView"` will export the map's `getView` method.  You can use a `*` at the end to match multiple names.  The pattern `"ol.Map#*"` will export all map methods.

 * **compile** - `Object` An object whose properties are [Closure Compiler options](https://github.com/openlayers/closure-util/blob/master/compiler-options.txt).  Property names match the option names without the `--` prefix (e.g. `"compilation_level": "ADVANCED_OPTIMIZATIONS"` would set the `--compilation_level` option).  Where an option can be specified multiple times, use an array for the value (e.g. `"externs": ["one.js", "two.js"]`).  Where an option is used as a flag, use a boolean value (e.g. `"use_types_for_optimization": true`).

**Optional configuration properties**

 * **src** - `Array.<string>` Optional array of [path patterns](https://github.com/isaacs/minimatch/blob/master/README.md) for source files.  This defaults to `["src/**/*.js"]` which will match all `.js` files in the `src` directory.  To include a different set of source files, provide an array of path patterns.  Note that these patterns are `/` delimited even on Windows.

 * **jvm** - `Array.<string>` Optional array of [command line options](https://code.google.com/p/closure-compiler/wiki/FAQ#What_are_the_recommended_Java_VM_command-line_options?) for the compiler.  By default, the Compiler is run with `['-server', '-XX:+TieredCompilation']`.

The build task generates a list of source files sorted in dependency order and passes these to the compiler.  This takes the place of the `--js` options that you would use when calling the compiler directly.  If you want to add additional source files, typically you would use the `src` array described above.  This works with sources that have `goog.require` and/or `goog.provide` calls (which are used to sort dependencies).  If you want to force the inclusion of files that don't use `goog.require` or `goog.provide`, you can use the `js` property of the `compile` object.  Paths in the `js` array will be passed to the compiler **after** all other source files.

Paths in your config file should be relative to the current working directory (when you call `node tasks/build.js`).  Note that this means paths are not necessarily relative to the config file itself.

Below is a complete `build.json` configuration file that would generate a build including every symbol in the library (much more than you'd ever need).

```json
{
  "exports": ["*"],
  "compile": {
    "externs": [
      "externs/bingmaps.js",
      "externs/geojson.js",
      "externs/oli.js",
      "externs/olx.js",
      "externs/proj4js.js",
      "externs/tilejson.js",
      "externs/topojson.js",
      "externs/vbarray.js"
    ],
    "define": [
      "goog.dom.ASSUME_STANDARDS_MODE=true",
      "goog.DEBUG=false"
    ],
    "compilation_level": "ADVANCED_OPTIMIZATIONS",
    "output_wrapper": "(function(){%output%})();",
    "use_types_for_optimization": true
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
