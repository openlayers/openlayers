---
title: Custom build examples
layout: doc.hbs
---

# Custom Build Examples

_Note_: the tutorial assumes Unix-style filesystem; those using Windows will have to adjust the addressing as appropriate. It also assumes the `node` binary is called `node`.

## Requirements
Obviously, you will need the OL source to build from, and the build scripts, so clone the Github repo or download one of the archives. The build tools run under Node, so you will need to install that if it is not already installed. The compiler runs under Java, so this will have to be installed too. If you're not very familiar with the Java environment, run `java -version` in the command line to test that this is installed correctly.

You will then need to install the dependencies in the directory you install the OL repository to; as these are in `dependencies` in the `package.json`, `npm i --production` should suffice. This includes the `closure-util` module, which will download the Closure library and the compiler.

Now you need an html file to load in the browser. A simple skeleton might be:
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>OL3 example</title>
    <link rel="stylesheet" href="http://openlayers.org/en/master/css/ol.css" />
</head>
<body>
    <div id="map" style="height: 400px"></div>
    <script src="ol-build.js"></script>
    <script src="myApp.js"></script>
</body>
</html>
```
Note that the CSS is being loaded from `master`; change this as appropriate if you want the file for a specific version.

`build/` is in `.gitignore`, so you can put what you like in there without Git thinking this is a file it needs to track. This is a suggested place to put the various files you need for this tutorial.

Now read the `readme` in `tasks/`, which gives some more details of how to run the `build.js` script. You need a config file to tell the script what to do, and then specify an output file; in the html file above, this is `ol-build.js` but of course you can call this whatever you like.

As discussed before, you can compile your app in with the ol build or load it separately. It's likely that most developers will want to load their app separately, so we'll look at examples for that first.

## Simple example
Let's start with something simple, namely `examples/simple.js`. The html above will load the OL build and then the script. The examples in the repo are set up to be compiled in with the OL code, so include `goog.require`s. You can't use these in your app, as `goog` isn't defined anywhere. So you can either copy the repo example into your working directory and then edit out the requires, or you can copy the hosted version which has already stripped these out: `http://openlayers.org/en/master/examples/simple.js` (as with `ol.css`, change `master` as appropriate). You'll also have to edit out the `renderer` line, as `examplesNS` isn't in your environment. You can also remove the typecast for the attributionOptions, though it doesn't harm anything if you leave it in there. See `examples/readme` for an explanation of the differences between the repo examples and application code.

`tasks/readme` gives a sample config file for the full build. This uses advanced optimizations, and defines the exports and externs. The compiler needs to know which symbols are used in the app &ndash; the _exports_ &ndash; so those we use need to be entered in the exports section of the config file. We also need the `olx` externs (more on this below), so our config file looks like this:

```json
{
  "exports": ["ol.Map",
              "ol.View",
              "ol.control.defaults",
              "ol.layer.Tile",
              "ol.source.OSM"
             ],
  "compile": {
    "externs": [
      "externs/olx.js"
    ],
    "define": [
      "goog.dom.ASSUME_STANDARDS_MODE=true",
      "goog.DEBUG=false"
    ],
    "compilation_level": "ADVANCED_OPTIMIZATIONS",
    "use_types_for_optimization": true,
    "manage_closure_dependencies": true
  }
}
```

As `tasks/readme` explains, the paths in the config file are relative to the directory where the task is run. So this assumes that we're running the build task from the root of the OL directory, with the externs file in `externs/`. The symbols (classes) are as in the require statements; we use the `control.defaults` property, so exporting this automatically gives us the `control` namespace.

Now, build this with
```
node tasks/build.js build/config.json build/ol-build.js
```
assuming you have put the config in `build/config.json`. It tells you it is 'Parsing dependencies' and 'Compiling sources'. When it's finished, if you look at `build/` you will see there are 2 new files, the build itself and another one called `info.json`. This is a complete list of dependencies in json format, used for generating the dependency tree, and is produced by `tasks/generate-info.js`, run by the build script.

The build is now ready, so if you load your html file, the map should now be displayed. Success! If you look in console, you will see there is an `ol` object containing the exported names, plus a `map` object which is the instance created by the script. Note that the `map` object only contains those methods you exported; you cannot for example do `map.getControls()` as you did not export that name.

The build script runs `tasks/generate-exports.js`, which generates an export file based on the list defined in the config file. This uses a temporary file, but if you want to see the output you can run it as a separate task: `node tasks/generate-exports.js -c build/config.json exports.js`. If you then look at the `exports.js` output, you can see that the exported symbols and properties are listed as the appropriate `goog` functions. You may notice a couple of other symbols, like `ol.ViewHint`, which are dependencies and need to be exported, but aren't directly used in applications.

## More on the config file
### define
Closure allows you to define constants that can be set at compile time. The `define` config property above sets 2 `goog` properties for the Closure library, and the OL code also has defined values you can set. Setting some of these to false means that the portions of the code relating to this setting become 'dead', i.e. are never executed. As advanced mode removes dead code, this makes the size of the advanced compiled file smaller. You might have noticed that the build file you've just created is considerably smaller than the full build, but it can be reduced further. This is because all 3 renderers and all layer types are included by default. We only need one renderer, and only need the tile layer, so can exclude the others by setting these properties with `define`s. So add the following to the define section of the config above:
```
      "ol.ENABLE_DOM=false",
      "ol.ENABLE_WEBGL=false",
      "ol.ENABLE_PROJ4JS=false",
      "ol.ENABLE_IMAGE=false",
      "ol.ENABLE_VECTOR=false",
```
and re-run the build script. The build size should now be smaller.

### Externs
The Closure documentation explains that 'externs' are for external names used in the code being compiled. The compiler includes externs for built-ins such as `document`. The `externs` directory of the OL code includes files for all those used in some part of the library. For example, if you use Bings maps, you should include the Bing externs file in the `externs` section of the config file.

`oli` is a special namespace, originally for those functions needed if you want to extend an OL object, for example, a custom control. Event properties are also part of the `oli` namespace, so include this file if you want to use a property returned in an event object, for example, `event.pixel`.

The constructor options are not exported in the usual way, but are in a separate `olx` namespace and handled as externs. This is a problematic area, because it means the options are not directly tied to the exported properties/symbols. `externs/olx.js` includes all the options, including those you are not using. This means firstly that the compiled file is larger than it needs to be. Secondly, it means the externs file includes options for namespaces that are not in your build; for example, the map options include `overlays`, which refers to `ol.Overlay` which is not in the example build above. You can create your own `olx` externs file which only includes those that you use, and if you compile using this instead of the OL-supplied file, you will see that the compiled file is a bit smaller. However, your build file will include references for other options that you do not use, for example, `olx.ProjectionOptions`. The compiler by default treats these missing references as warnings not errors, so the file will be compiled and will work correctly with both the OL-supplied externs file and the app-specific file, but if you change the reporting level, for example, with `warning_level: verbose`, you will see a large number of warnings about missing this and unknown that. Up to you how you want to handle this; the simplest is always to use the full supplied `olx.js` and ignore the warnings.

### Other compiler options
There are a couple of other compiler options in the config file above. `manage_closure_dependencies` should always be used. `use_types_for_optimization` should be used when you are compiling the OL library on its own.

The config file used by the supplied full build (`config/ol.json`) uses specific settings for error reporting (`jscomp_error`), but the defaults should be sufficient for most purposes. It also specifies `"output_wrapper": "(function(){%output%})();"`; advanced_optimizations creates a number of global variables, so wrapping the output in a function like this keeps them out of the global namespace.

You can specify any of the other compiler options here as needed, such as the renaming reports, output manifest, or source maps. There is a full list of available options in [closure-util](https://github.com/openlayers/closure-util/blob/master/compiler-options.txt). Note that `build.js` currently requires you to enter an output file and will write the output from the compiler to it; it does not use the `js_output_file` compiler option. If you specify this in the config file, there will be no compiler output, so `build.js`'s output file will be empty.

## A more complicated example
As the name suggests, the simple example is, well, simple. Now let's try a more complicated example: `heatmaps-earthquakes.js`. Again, you will have to remove the `goog.require` statements if you copy this from `examples/`. The config file looks like this:

```json
{
  "exports": [
    "ol.layer.Heatmap",
    "ol.source.KML",
    "ol.layer.Heatmap#getSource",
    "ol.source.KML#on",
    "ol.source.VectorEvent#feature",
    "ol.Feature#get",
    "ol.Feature#set",
    "ol.layer.Tile",
    "ol.source.Stamen",
    "ol.Map",
    "ol.View"
  ],
  "compile": {
    "externs": [
      "externs/olx.js",
      "externs/oli.js"
    ],
    "define": [
      "ol.ENABLE_DOM=false",
      "ol.ENABLE_WEBGL=false",
      "ol.ENABLE_PROJ4JS=false",
      "ol.ENABLE_IMAGE=false",
      "goog.dom.ASSUME_STANDARDS_MODE=true",
      "goog.DEBUG=false"
    ],
    "compilation_level": "ADVANCED_OPTIMIZATIONS",
    "use_types_for_optimization": true,
    "manage_closure_dependencies": true
  }
}
```

The exports are given here in the order in which they occur in the script. In this script we not only have the `ol...` symbols, but also prototype methods where the `ol` namespace is not directly used. In the code, we have for example `vector.getSource().on()`. This means we are using the `getSource` method of `layer.Heatmap` and the `on` method of `source.KML`, so this is what has to be exported. Similarly, `event.feature.get()` means we are using the `feature` property of `source.VectorEvent` and the `get` method of `Feature`. If any of these names are left out, the compile will complete successfully, but the missing names will be obfuscated and you will get a 'property undefined' error when you try and run the script.

As this script uses a vector layer, this has to be enabled by removing `"ol.ENABLE_VECTOR=false"` in the `define` section of the config. Also, as we are using event objects, `"externs/oli.js"` has to be included in the `externs` section.

Rerun the build script, and reload the html file, and you should now see this new map. The build will of course be larger, as you are exporting more (which means your app is doing more).

You should now have the basic principles of defining the appropriate exports and compile options; try more complicated examples, or apply these principles to your own code. Don't forget to include externs for the external code you use, such as proj4js or GeoJSON.

For those who want to compile application code together with the OL3 library, a [further page](buildInExamples.md) describes an example.

## A note on simple/whitespace builds
Although advanced optimizations is recommended for production code, if you want to create a simple or even whitespace build for development, you can use `build.js` for this too. In this case, define the `exports` section as before, and change `compilation_level`. `externs` should be removed, as should `use_types_for_optimization`, which is only relevant for advanced builds. You can use the `define` flags, but the build size will not be reduced, as only advanced optimizations removes unused code. If you use whitespace, use an `output_wrapper` of `var CLOSURE_NO_DEPS=true;%output%` so it doesn't try and load a non-existent `deps.js`.