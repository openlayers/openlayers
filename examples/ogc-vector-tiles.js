import MVT from '../src/ol/format/MVT.js';
import Map from '../src/ol/Map.js';
import OGCVectorTile from '../src/ol/source/OGCVectorTile.js';
import VectorTileLayer from '../src/ol/layer/VectorTile.js';
import View from '../src/ol/View.js';

const map = new Map({
  target: 'map',
  layers: [
    new VectorTileLayer({
      source: new OGCVectorTile({
        url: 'https://maps.gnosis.earth/ogcapi/collections/NaturalEarth:cultural:ne_10m_admin_0_countries/tiles/WebMercatorQuad',
        format: new MVT(),
      }),
      background: '#d1d1d1',
      style: {
        'stroke-width': 0.6,
        'stroke-color': '#8c8b8b',
        'fill-color': '#f7f7e9',
      },
    }),
  ],
  view: new View({
    center: [0, 0],
    zoom: 1,
  }),
});
