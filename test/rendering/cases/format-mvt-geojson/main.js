import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import MVT from '../../../../src/ol/format/MVT.js';
import VectorTileLayer from '../../../../src/ol/layer/VectorTile.js';
import {fromLonLat} from '../../../../src/ol/proj.js';
import VectorTileSource from '../../../../src/ol/source/VectorTile.js';

const center = fromLonLat([0.26, 24.08]);

const map = new Map({
  layers: [
    new VectorTileLayer({
      source: new VectorTileSource({
        format: new MVT(),
        url: '/data/{z}-{x}-{y}.mvt',
        minZoom: 7,
        maxZoom: 7,
      }),
    }),
    new VectorTileLayer({
      source: new VectorTileSource({
        format: new MVT({
          featureClass: Feature,
        }),
        url: '/data/{z}-{x}-{y}.mvt',
        minZoom: 7,
        maxZoom: 7,
      }),
    }),
    new VectorTileLayer({
      source: new VectorTileSource({
        format: new GeoJSON(),
        url: '/data/{z}-{x}-{y}.geojson',
        minZoom: 7,
        maxZoom: 7,
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: center,
    zoom: 10,
  }),
});

map.getTargetElement().style.background = 'gray';

render();
