import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {fromLonLat} from '../src/ol/proj.js';
import OSM from '../src/ol/source/OSM.js';
import TileJSON from '../src/ol/source/TileJSON.js';

const key = 'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiY2pzbmg0Nmk5MGF5NzQzbzRnbDNoeHJrbiJ9.7_-_gL8ur7ZtEiNwRfCy7Q';

const map = new Map({
  layers: [
    new TileLayer({
      className: 'bw',
      source: new OSM()
    }),
    new TileLayer({
      source: new TileJSON({
        url: 'https://api.tiles.mapbox.com/v4/mapbox.va-quake-aug.json?secure&access_token=' + key,
        crossOrigin: 'anonymous',
        // this layer has transparency, so do not fade tiles:
        transition: 0
      })
    })
  ],
  target: 'map',
  view: new View({
    center: fromLonLat([-77.93255, 37.9555]),
    zoom: 7
  })
});
