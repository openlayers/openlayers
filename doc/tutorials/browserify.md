---
title: Basic project setup using NPM and Browserify
layout: doc.hbs
---

# Introduction

When going beyond modifying existing examples you might be looking for a way to setup your own code with dependency management together with external dependencies like OpenLayers.

This tutorial serves as a suggested project setup using NPM and Browserify for the most basic needs. There are several other options, and in particular you might be interested in a more modern one (ES2015) [using Webpack with OpenLayers](https://gist.github.com/tschaub/79025aef325cd2837364400a105405b8).

## Initial steps

Create a new empty directory for your project and navigate to it by running `mkdir new-project && cd new-project`. Initialize your project using `npm init` and answer the questions asked.

Add OpenLayers as dependency to your application with `npm install --save ol`.

At this point you can ask NPM to add required development dependencies by running
```
npm install --save-dev cssify browserify cssify http-server uglify-js watchify
npm install --save-dev babelify babel-plugin-transform-es2015-modules-commonjs
```
We will be using `cssify` to include the css definitions required by OpenLayers in our bundle. `watchify`, `http-server` and `uglify-js` are used to monitor for changes and to build into a minified bundle. `babelify` and `babel-plugin-transform-es2015-modules-commonjs` are used to make the `ol` package, which was created using ES2015 modules, work with CommonJS.

## Application code and index.html

Place your application code in `index.js`. Here is a simple starting point:

```js
require('ol/ol.css');
var ol_Map = require('ol/map').default;
var ol_layer_Tile = require('ol/layer/tile').default;
var ol_source_OSM = require('ol/source/osm').default;
var ol_View = require('ol/view').default;

var map = new ol_Map({
  target: 'map',
  layers: [
    new ol_layer_Tile({
      source: new ol_source_OSM()
    })
  ],
  view: new ol_View({
    center: [0, 0],
    zoom: 0
  })
});
```

You will also need an `ìndex.html` file that will use your bundle. Here is a simple example:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Using Browserify with OpenLayers</title>
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

With simple scripts you can introduce the commands `npm run build` and `npm start` to manually build your bundle and watch for changes, respectively. Add the following to the script section in `package.json`:

```json
"scripts": {
  "start": "watchify index.js -g cssify --outfile bundle.js & http-server",
  "build": "browserify -g cssify index.js | uglifyjs --compress --output bundle.js"
}
```
Now to test your application open http://localhost:8080/ in your browser. `watchify` will update `bundle.js` whenever you change something. You simply need to reload the page in your browser to see the changes.
```
$ npm start
```

Note that `bundle.js` will contain your application code and all dependencies used in your application. From OpenLayers, it only contains the required components.
