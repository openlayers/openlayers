---
title: Basic project setup using NPM and Browserify
layout: doc.hbs
---

# Introduction

When going beyond modifying existing examples you might be looking for a
way to setup your own code with dependency management together with external
dependencies like OpenLayers 3.

This tutorial serves as a suggested project setup using NPM and Browserify
for the most basic needs. There are several other options and in particular
you might be interested in 
[compiling your own code together with OpenLayers 3](closure.html).

## Initial steps

Create a new empty directory for your project and navigate to it by running
`mkdir new-project && cd new-project`. Initialize your project using `npm init`
and answer the questions asked.

At this point you can ask NPM to add required dependencies by running
`npm install --save-dev openlayers browserify watchify uglify-js`. Watchify and
Uglify will be used to monitor for changes and to build into a minified
bundle.

## Application code and index.html

Place your application code in `index.js`. Here is a simple starting point:

```js
var ol = require('openlayers');
 
var map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  view: new ol.View({
    center: [0, 0],
    zoom: 0
  })
});
```

You will also need an `ìndex.html` file that will use your bundle. Here is a simple
example:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Using Browserify with OpenLayers</title>
    <link rel="stylesheet" href="node_modules/openlayers/dist/ol.css" type="text/css">
    <style>
      #map {
        width: 400px;
        height: 250px;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="bundle.js"></script>
  </body>
</html>
```

## Creating a bundle

With simple scripts you can introduce the commands `npm run build` and `npm start` to
manually build your bundle and watch for changes, respectively. Add the following
to the script section in `package.json`:

```json
"scripts": {
  "start": "watchify index.js --outfile bundle.js",
  "build": "browserify index.js | uglifyjs --compress --output bundle.js"
}
```

Note that `bundle.js` will contain your application code and all dependencies
used in your application, in this case the official full build of OpenLayers 3.
If you only need parts of OpenLayers 3 you can create
[custom builds](../../builder).
