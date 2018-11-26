import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import {OSM, TileDebug} from 'ol/source';


const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM()
    }),
    new TileLayer({
      source: new TileDebug()
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1
  })
});
