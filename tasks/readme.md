# Tasks

This directory contains utility scripts for working with the library.


## `build.js`

Builds the library based on a configuration file.  See the `--help` option for more detail.

    node tasks/build.js --help

### Build configuration files

Build configuration files are JSON files that are used to determine what should be exported from the library and what options should be passed to the compiler.

**Required configuration properties**

  * **exports** - `Array.<string>` An array of symbol names or patterns to be exported (names that are used in your application).  For example, including `"ol.Map"` will export the map namespace including the constructor.  Method names are prefixed with `#`.  So `"ol.Map#getViewport"` will export the map's `getViewport` method.  You can use a `*` at the end to match multiple names.  The pattern `"ol.Map#*"` will export all exportable map methods.  
   Note that only the 'exportable' names can be listed here, that is, those that are part of the supported API (see apidoc/readme.md for more details). If you want to include a property or method that is not part of the API (and be aware that these may change or be removed), you will have to specifically export these yourself, for example, with `goog.exportProperty`.  
   Note too that the supplied observable properties together with their accessors, like `getView` in `ol.Map`, are always exported (with `goog.exportProperty` in the source). You do not have to include these, though it does not harm if you do.
   Finally, although the term 'exports' is not relevant for simple and whitespace builds, you should still list the names you use as you would with advanced. A build will be created with those classes/namespaces that contain these exported methods.

**Optional configuration properties**

  * **compile** - `Object` An object whose properties are [Closure Compiler options](https://github.com/openlayers/closure-util/blob/master/compiler-options.txt).  Property names match the option names without the `--` prefix (e.g. `"compilation_level": "ADVANCED"` would set the `--compilation_level` option).  Where an option can be specified multiple times, use an array for the value (e.g. `"externs": ["one.js", "two.js"]`).  Where an option is used as a flag, use a boolean value (e.g. `"use_types_for_optimization": true`).

    If the **compile** object is not provided, the build task will generate a "debug" build of the library without any variable naming or other minification.  This is suitable for development or debugging purposes, but should not be used in production.

  * **umd** - `boolean` Optional flag to wrap the build in [UMD syntax](https://github.com/umdjs/umd).  If set to `true`, the build output can be used with a CommonJS module loader (e.g. [Browserify](http://browserify.org/)), an AMD script loader (e.g. [RequireJS](http://requirejs.org/)), or just loaded with a `<script>` tag.  If this option is specified, the **namespace** and any **compile.output_wrapper** options will be ignored.

  * **src** - `Array.<string>` Optional array of [path patterns](https://github.com/isaacs/minimatch/blob/master/README.md) for source files, that is, those that provide the symbols/names included in `exports`.  By default, all of the library source files will be included (`'src/**/*.js'`).  If you want to provide additional source files to be configured together with the library, you need to provide path patterns to your source files *and* the library source files.  Note that these patterns are `/` delimited even on Windows.  There is a bit of special handling with the `src` config.

  * **cwd** - `string` Optional path to be used as the current working directory.  All paths in the `compile` object are assumed to be relative to `cwd`.  Default is the root of the ol3 repository.

  * **namespace** - `string` Optional namespace for exporting the `ol` object.  By default, `ol` is assigned to the global object.

  * **jvm** - `Array.<string>` Optional array of [command line options](https://github.com/google/closure-compiler/wiki/FAQ#what-are-the-recommended-java-vm-command-line-options) for the compiler.  By default, the Compiler is run with `['-server', '-XX:+TieredCompilation']`.

The build task generates a list of source files sorted in dependency order and passes these to the compiler.  This takes the place of the `--js` options that you would use when calling the compiler directly.  If you want to add additional source files, typically you would use the `src` array described above.  This works with sources that have `goog.require` and/or `goog.provide` calls (which are used to sort dependencies).  If you want to force the inclusion of files that don't use `goog.require` or `goog.provide`, you can use the `js` property of the `compile` object.  Paths in the `js` array will be passed to the compiler **after** all other source files. Note that there is currently no facility for adding files to the build file after compilation; you will have to do this yourself if you want this.

Paths in your config file should be relative to the current working directory (when you call `node tasks/build.js`).  Note that this means paths are not necessarily relative to the config file itself.

Below is a complete `build.json` configuration file that would generate a 'full' build including every exportable symbol in the library (much more than you'd ever need).

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
      "externs/topojson.js"
    ],
    "define": [
      "goog.DEBUG=false"
    ],
    "compilation_level": "ADVANCED",
    "output_wrapper": "(function(){%output%})();",
    "use_types_for_optimization": true,
    "manage_closure_dependencies": true
  }
}
```

To generate a build named `ol.min.js` with the `build.json`, you would run this:

    node tasks/build.js build.json ol.min.js

To export the `ol` symbol to somewhere other than the global namespace, a `namespace` option is available. This can e.g. be useful for creating an ol3 AMD module, by simply providing a build configuration like the following:

```json
{
  "exports": ["*"],
  "namespace": "AMD",
  "compile": {
    "compilation_level": "ADVANCED",
    "output_wrapper": "define('ol',function(){var AMD={};%output%return AMD.ol;});"
  }
}
```

The `defines` section of `build.json` above lists common settings for the Closure library in production code. The OL3 library also defines constants that can be set in this section at compile time. These are all defined in the `ol.js` source file; see the comments in this file to see what effect setting these would have. Some of them can reduce the size of the build in advanced mode.

## `generate-exports.js`

Called internally to generate a `build/exports.js` file optionally with a limited set of exports.


## `generate-externs.js`

Can be called to generate a Closure externs file for the full OpenLayers 3 API.
See the `--help` option for more detail.

    node tasks/generate-externs.js --help

This is useful for projects that use the Closure Compiler to build, but want to use OpenLayers 3 as external library rather than building together with OpenLayers 3.


## `generate-info.js`

Called internally to parse the library for annotations and write out a `build/info.json` file.


## `build-examples.js`

Builds examples and the example index.

## `check-example.js`

Runs an example in PhantomJS and returns an exit code != 0 after printing a stack trace when something is wrong with the example.

To check the `simple.html` example when on master, first run the `build-examples.js` task, then invoke

    node tasks/check-example.js build/hosted/master/simple.html


## `serve.js`

Run a debug server that provides all library sources unminified.  Provides a static server for examples and tests.  See the `--help` option for more detail.

    node tasks/serve.js --help


## `test.js`

Run the tests once in a headless browser.  Note that you can also run the tests by running the `serve.js` task and then visiting the root of the test directory in your browser.
