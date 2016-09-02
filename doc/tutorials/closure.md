---
title: Compiling Application with Closure Compiler
layout: doc.hbs
---

# Compiling Application with Closure Compiler

The OpenLayers 3 code uses the Closure Library, and it is compiled with the
Closure Compiler. Using OpenLayers 3 in an application does not require using
Closure. But using Closure in an OpenLayers 3 application is possible. And this
is what this tutorial is about.

This tutorial will teach you how to set up an OpenLayers 3 application based on
the [`closure-util`](https://github.com/openlayers/closure-util) node package,
which provides utilities for working with Closure. Using `closure-util` is one
way to use Closure in a web application, but there are others. This tutorial
just covers the "`closure-util`" way.

The `closure-util` documentation is available on the [`closure-util` readme
page](https://github.com/openlayers/closure-util/blob/master/readme.md). You
don't need to read the `closure-util` documentation to follow this tutorial,
but it's available in `closure-util`'s [readme
file](https://github.com/openlayers/closure-util/blob/master/readme.md) if you
need it.

Also, the sample application built in this tutorial is
[available](https://github.com/openlayers/openlayers-closure-application) on
GitHub.

## Advantages of using Closure

This tutorial will show you how to use the Closure Compiler to compile an
application and OpenLayers 3 together. Compiling the application code together
with the OpenLayers 3 code has a number of advantages.

First of all, it allows you to only "pay" for the OpenLayers 3 code your
application uses, as the compiler will exclude the OpenLayers 3 code that the
application doesn't use. And there is no need to write and maintain a list of
"exports", which is necessary when creating custom builds of OpenLayers 3.

Also, compiling the application and OpenLayers 3 together allows using
OpenLayers 3 functions and objects that are not part of the official OpenLayers
3 API. Using non-API functions and objects may be risky, but it is mitigated by
the fact that the compiler will complain if you use functions or objects
that are not in OpenLayers 3 anymore.

## Setting up the Application

First, create a directory for the application. We will name that directory
`openlayers-closure-application` in this tutorial.

    $ mkdir openlayers-closure-application

Now change to that directory:

    $ cd openlayers-closure-application

Our application will be a `node` application, and the `openlayers` and
`closure-util` node packages will be downloaded from the node package registry
using the `npm` command line tool.

So we're going to create a `package.json` file for the application, which every
node application includes. This file basically includes metadata for the
application.

Create the application's `package.json` file:

    $ npm init

You can pretty much use the default answers to the questions `npm init` asks
you.

Now install OpenLayers 3 using:

    $ npm install openlayers --save

The `--save` flag persists the `openlayers` dependency in the application's
`package.json` file. You can edit `package.json` to verify that the dependency
was added.

`closure-util` is a dependency of the `openlayers` package, so it should have
been installed with `openlayers`. Use the following to verify that
`closure-util` is installed:

    $ ./node_modules/openlayers/node_modules/.bin/closure-util

    command argument is required

    Usage: node closure-util <command> [options]

    command     
      update-compiler     Update the Compiler
      update-library      Update the Library
      update              Update both the Library and the Compiler
      build               Build with Closure Compiler
      serve               Start the development server

    Options:
       -l LEVEL, --loglevel LEVEL   Log level  [info]


## Create an OpenLayers 3 map

You're now going to create a JavaScript file that creates an OpenLayers 3 map.
This is the file that we will define the application's entry point.

First of all create an `src` directory at the root of the application:

    $ mkdir src

Now add a file `main.js` to `src`, with the following content:

```js
goog.provide('app');

goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');


/**
 * @type {ol.Map}
 */
app.map = new ol.Map({
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
```

`goog.provide('app')` creates the namespace `app` for the application. The
`goog.require` statements that follow define the OpenLayers constructors and
namespaces that the application uses. The rest of the code just creates the
OpenLayers map as you would do in any OpenLayers application.

## Compiling the Application

We're now going to compile the application and OpenLayers 3 together, using the
Closure Compiler and `closure-util`. For this we need to create a JSON config
file, that we will then pass as an input file to the `closure-util` command.

The minimum config file looks like this:

```json
{
  "lib": [
    "node_modules/openlayers/src/**/*.js",
    "node_modules/openlayers/build/ol.ext/**/*.js",
    "src/**/*.js"
  ],
  "compile": {
    "closure_entry_point": "app",
    "externs": [
      "node_modules/openlayers/externs/bingmaps.js",
      "node_modules/openlayers/externs/cartodb.js",
      "node_modules/openlayers/externs/closure-compiler.js",
      "node_modules/openlayers/externs/esrijson.js",
      "node_modules/openlayers/externs/geojson.js",
      "node_modules/openlayers/externs/proj4js.js",
      "node_modules/openlayers/externs/tilejson.js",
      "node_modules/openlayers/externs/topojson.js"
    ],
    "define": [
      "goog.DEBUG=false",
      "ol.ENABLE_DOM=false",
      "ol.ENABLE_WEBGL=false"
    ],
    "js": [
      "node_modules/openlayers/externs/olx.js",
      "node_modules/openlayers/externs/oli.js"
    ],
    "extra_annotation_name": [
      "api", "observable"
    ],
    "compilation_level": "ADVANCED",
    "warning_level": "VERBOSE",
    "output_wrapper": "(function(){%output%})();",
    "use_types_for_optimization": true
  }
}
```

Create a `config.json` file with the above content at the root of the
application directory.

We can now use `closure-util` to compile the code:

    $ ./node_modules/openlayers/node_modules/.bin/closure-util build config.json app.js

The resulting `app.js` file, which you can view in your editor if you're
curious, includes a minified version of the application code (`main.js`), and
the OpenLayers 3 code that the application code uses.

Here is a version of `config.json` with more compilation checks enabled:

```json
{
  "lib": [
    "node_modules/openlayers/src/**/*.js",
    "node_modules/openlayers/build/ol.ext/**/*.js",
    "src/**/*.js"
  ],
  "compile": {
    "closure_entry_point": "app",
    "externs": [
      "node_modules/openlayers/externs/bingmaps.js",
      "node_modules/openlayers/externs/cartodb.js",
      "node_modules/openlayers/externs/closure-compiler.js",
      "node_modules/openlayers/externs/esrijson.js",
      "node_modules/openlayers/externs/geojson.js",
      "node_modules/openlayers/externs/proj4js.js",
      "node_modules/openlayers/externs/tilejson.js",
      "node_modules/openlayers/externs/topojson.js"
    ],
    "define": [
      "goog.DEBUG=false",
      "ol.ENABLE_DOM=false",
      "ol.ENABLE_WEBGL=false"
    ],
    "js": [
      "node_modules/openlayers/externs/olx.js",
      "node_modules/openlayers/externs/oli.js"
    ],
    "jscomp_error": [
      "*"
    ],
    "jscomp_off": [
      "unknownDefines",
      "lintChecks",
      "analyzerChecks"
    ],
    "extra_annotation_name": [
      "api", "observable"
    ],
    "compilation_level": "ADVANCED",
    "warning_level": "VERBOSE",
    "output_wrapper": "(function(){%output%})();",
    "use_types_for_optimization": true
  }
}
```

## Create an HTML file for the Application

You can now go ahead and create a simple HTML for the application. Create
a `index.html` file with the following content at the root the application
directory:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="chrome=1">
    <meta name="viewport" content="initial-scale=1.0, user-scalable=no, width=device-width">
    <link rel="stylesheet" href="node_modules/openlayers/css/ol.css" type="text/css">
    <title>Simple example</title>
    <style>
      #map {
        width: 600px;
        height: 400px;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="app.js" type="text/javascript"></script>
  </body>
</html>
```

Note that the page includes a `script` tag referencing the `app.js` file,
which is the file resulting from the compilation.

You are done!

## Run Application in Debug Mode

As a bonus, we're going to show how to use `closure-util` to run the
application in "debug" mode, where the original application and OpenLayers
scripts are loaded one by one in the page.

Start the `closure-util` development server:

    $ ./node_modules/openlayers/node_modules/.bin/closure-util serve config.json

Now change the `script` tag to the following in the `index.html` file:

```html
      <script src="@?main=src/main.js" type="text/javascript"></script>
```

Reload the page in your browser and you should see that scripts are now loaded
individually, making debugging much easier.
