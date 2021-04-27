import {Feature, Map, View} from '../../../../src/ol/index.js';
import {GeoJSON, MVT} from '../../../../src/ol/format.js';
import {VectorTile as VectorTileLayer} from '../../../../src/ol/layer.js';
import {VectorTile as VectorTileSource} from '../../../../src/ol/source.js';
import {fromLonLat} from '../../../../src/ol/proj.js';

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
