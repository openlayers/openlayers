import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import {Vector as VectorLayer, Tile as TileLayer} from '../../../src/ol/layer.js';
import {Vector as VectorSource, XYZ} from '../../../src/ol/source.js';
import GeoJSON from '../../../src/ol/format/GeoJSON.js';
import {Style, Stroke} from '../../../src/ol/style.js';

new Map({
  layers: [
    new TileLayer({
      source: new XYZ({
        url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
        maxZoom: 3
      })
    }),
    new VectorLayer({
      style: new Style({
        stroke: new Stroke({
          color: 'rgba(255,255,255,0.5)',
          width: 0.75
        })
      }),
      source: new VectorSource({
        url: '/data/countries.json',
        format: new GeoJSON()
      })
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

render();
