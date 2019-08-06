import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';
import XYZ from '../src/ol/source/XYZ.js';
import {transformExtent, fromLonLat} from '../src/ol/proj.js';

const mapExtent = [-112.261791, 35.983744, -112.113981, 36.132062];

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      maxZoom: 14, // visible at zoom levels 14 and below
      source: new OSM()
    }),
    new TileLayer({
      minZoom: 14, // visible at zoom levels above 14
      source: new XYZ({
        attributions: 'Tiles © USGS, rendered with ' +
        '<a href="http://www.maptiler.com/">MapTiler</a>',
        url: 'https://tileserver.maptiler.com/grandcanyon/{z}/{x}/{y}.png'
      })
    })
  ],
  view: new View({
    center: fromLonLat([-112.18688965, 36.057944835]),
    zoom: 15,
    maxZoom: 18,
    extent: transformExtent(mapExtent, 'EPSG:4326', 'EPSG:3857'),
    constrainOnlyCenter: true
  })
});
