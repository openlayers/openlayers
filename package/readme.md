# `ol`

[OpenLayers](https://openlayers.org/) for module loaders.

**Note: This is still a work in progress.  Not yet ready for production.**

## Usage

Add the `ol` package as a dependency to your project.

    npm install ol@beta --save

Import just what you need for your application:

```js
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

var map = new Map({
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
