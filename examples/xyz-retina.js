import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import {transform, transformExtent} from 'ol/proj';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';

const mapMinZoom = 1;
const mapMaxZoom = 15;
const mapExtent = [-112.261791, 35.983744, -112.113981, 36.132062];

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM()
    }),
    new TileLayer({
      extent: transformExtent(mapExtent, 'EPSG:4326', 'EPSG:3857'),
      source: new XYZ({
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
