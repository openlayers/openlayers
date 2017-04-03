---
title: Custom builds
layout: doc.hbs
---

# Creating custom builds

OpenLayers is a big library providing a lot of functionality. So it is unlikely that an application will need and use all the functionality OpenLayers provides. This is why creating application-specific OpenLayers builds, with just the functionality your application needs, is often a good idea.

An alternative to creating custom builds is to compile your application code together with OpenLayers. See the [Compiling Application with Closure Compiler](closure.html) tutorial for more information.

This particular tutorial explains how to create custom builds of OpenLayers.

## Requirements

OpenLayers's build tools use Node and Java, so you need to have Node and Java installed on your machine. You can run `node --version` and `java -version` to test that Node and Java are installed, respectively. See [developing guide](https://github.com/openlayers/openlayers/blob/master/DEVELOPING.md) for minimum version numbers required.

## Download OpenLayers

Obviously, creating a custom build requires the OpenLayers source and specific build scripts.

To get the OpenLayers source and the build scripts you can clone the openlayers [repository](https://github.com/openlayers/openlayers), or you can download one of the release archives. You can also download the `openlayers` Node package from the Node package registry, using NPM (the Node Package Manager). This is the method we are going to use in this tutorial.

Create a directory:

    $ mkdir openlayers

Download the OpenLayers distribution using NPM:

    $ npm install openlayers

This will download the latest stable version of OpenLayers, and install it under `node_modules`. You can list the content of `node_modules` to verify that it effectively contains a directory named "openlayers".

The Node packages onto which the `openlayers` package depends are installed under `node_modules/openlayers/node_modules`. That directory should, for example, include `closure-util`, which is the utility library OpenLayers uses for Closure.

You should now have everything you need to create custom builds of OpenLayers!

## Create a build configuration file

Creating a custom build requires writing a build configuration file. The format of build configuration files is JSON. Here is a simple example of a build configuration file:

```json
{
  "exports": [
    "ol.Map",
    "ol.View",
    "ol.control.defaults",
    "ol.layer.Tile",
    "ol.source.OSM"
  ],
  "compile": {
    "externs": [
      "externs/bingmaps.js",
      "externs/cartodb.js",
      "externs/closure-compiler.js",
      "externs/esrijson.js",
      "externs/geojson.js",
      "externs/oli.js",
      "externs/olx.js",
      "externs/proj4js.js",
      "externs/tilejson.js",
      "externs/topojson.js"
    ],
    "extra_annotation_name": [
      "api", "observable"
    ],
    "compilation_level": "ADVANCED",
    "manage_closure_dependencies": true,
    "rewrite_polyfills": false
  }
}
```

Create a file named `ol-custom.json` with that content, and save it under the `node_modules/openlayers/build` directory. (You can save it to any location really.)

The most relevant part of this configuration object is the `"exports"` array. This array declares the functions/constructors you use in your JavaScript code. For example, the above configuration file is what you'd use for the following JavaScript code:

```js
var map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  controls: ol.control.defaults({
    attributionOptions: {
      collapsible: false
    }
  }),
  view: new ol.View({
    center: [0, 0],
    zoom: 4
  })
});
```

Note that this JavaScript code corresponds to OpenLayers's [`simple`](https://openlayers.org/en/master/examples/simple.html) example.

You are now ready to create your first OpenLayers build. Use the following command to create the build:

    $ cd node_modules/openlayers
    $ node tasks/build.js build/ol-custom.json build/ol-custom.js

The build command may take some time, but it should end with an output in the console such as the following:

    info ol Parsing dependencies
    info ol Compiling 364 sources

The build command should have created an `ol-custom.js` file in the `node_modules/openlayers/build` directory. You can verify that the file was created. You can even open it in your editor if you're curious.

As a test, you can use the following HTML file to verify that your custom build works as expected:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>OpenLayers example</title>
    <link rel="stylesheet" href="node_modules/openlayers/css/ol.css" />
    <style>
      #map {
        width: 600px;
        height: 400px;
      }
    </style>
</head>
<body>
    <div id="map"></div>
    <script src="node_modules/openlayers/build/ol-custom.js"></script>
    <script>
    var map = new ol.Map({
      target: 'map',
      layers: [
        new ol.layer.Tile({
          source: new ol.source.OSM()
        })
      ],
      view: new ol.View({
        center: [0, 0],
        zoom: 4
      })
    });
    </script>
</body>
</html>
```

## More on the config file

### `define`'s

Closure allows you to define constants that can be set at compile time. The OpenLayers code defines several such values.

Setting some of these to `false` means that the portions of the code relating to this setting become "dead", i.e. are never executed. As Closure Compiler's `ADVANCED` mode removes dead code, this makes the size of the advanced compiled file smaller.

You might have noticed that the build file you've just created is considerably smaller than the full build, but it can be reduced further. This is because both renderers and other optional code are included by default. We only need one renderer, and we do not use the optional code, so can exclude what we don't use by setting properties with `define`s. So add a define section to the config above:
```
    "define": [
      "ol.ENABLE_WEBGL=false",
      "ol.ENABLE_PROJ4JS=false",
      "ol.ENABLE_RASTER_REPROJECTION=false"
    ],
```

and re-run the build script. The build size should now be smaller.

### Externs

The Closure documentation explains that "externs" are for external names used in the code being compiled. The compiler includes externs for built-ins such as `document`. The `externs` directory of the OpenLayers code includes files for all those used in some part of the library. For example, if you use Bing Maps, you should include the Bing externs file in the `externs` section of the config file.

`oli.js` and `olx.js` are externs files for the OpenLayers API. For example `olx.js` includes extern definitions for OpenLayers's constructor options. `closure-compiler.js` fixes any issues that may arise with a specific compiler version. You should always use these three files as externs when creating custom builds.

### Other compiler options

There are a couple of other compiler options in the config file above. `manage_closure_dependencies` and `rewrite_polyfills` should always be used.

You can specify any of the other compiler options here as needed, such as the renaming reports, output manifest, or source maps. There is a full list of available options in [closure-util](https://github.com/openlayers/closure-util/blob/master/compiler-options.txt).

Note that `build.js` currently requires you to enter an output file and will write the output from the compiler to it; it does not use the `js_output_file` compiler option. If you specify this in the config file, there will be no compiler output, so `build.js`'s output file will be empty.

## A more complicated example

Now let's try a more complicated example: [`heatmaps-earthquakes`](https://openlayers.org/en/master/examples/heatmap-earthquakes.html). The build configuration file looks like this:

```json
{
  "exports": [
    "ol.layer.Heatmap",
    "ol.source.Vector",
    "ol.format.KML",
    "ol.layer.Heatmap#getSource",
    "ol.source.Vector#on",
    "ol.source.Vector.Event#feature",
    "ol.Feature#get",
    "ol.Feature#set",
    "ol.layer.Tile",
    "ol.source.Stamen",
    "ol.Map",
    "ol.View",
    "ol.layer.Heatmap#setRadius",
    "ol.layer.Heatmap#setBlur"
  ],
  "compile": {
    "externs": [
      "externs/bingmaps.js",
      "externs/cartodb.js",
      "externs/closure-compiler.js",
      "externs/esrijson.js",
      "externs/geojson.js",
      "externs/olx.js",
      "externs/oli.js",
      "externs/proj4js.js",
      "externs/tilejson.js",
      "externs/topojson.js"
    ],
    "define": [
      "ol.ENABLE_WEBGL=false",
      "ol.ENABLE_PROJ4JS=false",
      "ol.ENABLE_RASTER_REPROJECTION=false"
    ],
    "compilation_level": "ADVANCED",
    "manage_closure_dependencies": true,
    "rewrite_polyfills": false
  }
}
```

The exports are given here in the order in which they occur in the `heatmaps-earthquakes` example's JavaScript code. In this example we not only use the `ol.` functions and constructors, but also `prototype` methods where the `ol` namespace is not directly used. In the code, we have for example `vector.getSource().on()`. This means we are using the `getSource` method of `layer.Heatmap` and the `on` method of `source.KML`, so this is what has to be exported. Similarly, `event.feature.get()` means we are using the `feature` property of `source.Vector.Event` and the `get` method of `Feature`. If any of these names are left out, the compile will complete successfully, but the missing names will be obfuscated and you will get a 'property undefined' error when you try and run the script.

## Maintaining the code

If you installed OpenLayers from the Node package, you can use `npm` to upgrade to the latest version. If you cloned the Github repo, simply pulling in the latest code may not be enough, as some of the packages used, for example, the compiler, may need upgrading too. Do this by using `npm install` rather than `npm update`.

## Conclusion

This tutorial should have given you the information you need to create custom builds, i.e. builds tailored to your application. See the [tasks readme](https://github.com/openlayers/openlayers/tree/master/tasks/readme.md) for more information on the build scripts and the properties you can use in the build configuration file.
