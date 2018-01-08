import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {transform, transformExtent} from '../src/ol/proj.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';
import _ol_source_XYZ_ from '../src/ol/source/XYZ.js';

var mapMinZoom = 1;
var mapMaxZoom = 15;
var mapExtent = [-112.261791, 35.983744, -112.113981, 36.132062];

var map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new _ol_source_OSM_()
    }),
    new TileLayer({
      extent: transformExtent(mapExtent, 'EPSG:4326', 'EPSG:3857'),
      source: new _ol_source_XYZ_({
        attributions: 'Tiles © USGS, rendered with ' +
            '<a href="http://www.maptiler.com/">MapTiler</a>',
        url: 'https://tileserver.maptiler.com/grandcanyon@2x/{z}/{x}/{y}.png',
        tilePixelRatio: 2, // THIS IS IMPORTANT
        minZoom: mapMinZoom,
        maxZoom: mapMaxZoom
      })
    })
  ],
  view: new View({
    projection: 'EPSG:3857',
    center: transform([-112.18688965, 36.057944835],
        'EPSG:4326', 'EPSG:3857'),
    zoom: 12
  })
});
