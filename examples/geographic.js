import {useGeographic} from '../src/ol/proj.js';
import {Map, View, Feature} from '../src/ol/index.js';
import {Point} from '../src/ol/geom.js';
import {Vector as VectorLayer, Tile as TileLayer} from '../src/ol/layer.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';

useGeographic();

const place = [-110, 45];

const point = new Point(place);

const map = new Map({
  target: 'map',
  view: new View({
    center: place,
    zoom: 8
  }),
  layers: [
    new TileLayer({
      source: new OSM()
    }),
    new VectorLayer({
      source: new VectorSource({
        features: [
          new Feature(point)
        ]
      })
    })
  ]
});

const info = document.getElementById('info');
map.on('moveend', function() {
  const view = map.getView();
  const center = view.getCenter();
  info.innerText = `lon: ${center[0].toFixed(2)}, lat: ${center[1].toFixed(2)}`;
});
