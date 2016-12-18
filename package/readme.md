# `ol`

[OpenLayers](https://openlayers.org/) for CommonJS module loaders.

**Note: This is still a work in progress.  Not yet ready for production.**

## Usage

Add the `ol` package as a dependency to your project.

    npm install ol@beta --save

Require just what you need for your application:

```js
var OLMap = require('ol/Map');
var View = require('ol/View');
var TileLayer = require('ol/layer/Tile');
var OSM = require('ol/source/OSM');

var map = new OLMap({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});
```
