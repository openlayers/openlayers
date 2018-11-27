import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import {fromLonLat} from 'ol/proj';
import OSM from 'ol/source/OSM';
import TileJSON from 'ol/source/TileJSON';


const map = new Map({
  layers: [
    new TileLayer({
      className: 'bw',
      source: new OSM()
    }),
    new TileLayer({
      source: new TileJSON({
        url: 'https://api.tiles.mapbox.com/v3/mapbox.va-quake-aug.json?secure',
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
