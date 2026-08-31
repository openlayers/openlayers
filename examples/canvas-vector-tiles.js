import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import MVT from '../src/ol/format/MVT.js';
import Link from '../src/ol/interaction/Link.js';
import VectorTileLayer from '../src/ol/layer/VectorTile.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';

const key =
  'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiY2t0cGdwMHVnMGdlbzMxbDhwazBic2xrNSJ9.WbcTL9uj8JPAsnT9mgb7oQ';

const map = new Map({
  layers: [
    new VectorTileLayer({
      source: new VectorTileSource({
        attributions:
          '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> ' +
          '© <a href="https://www.openstreetmap.org/copyright">' +
          'OpenStreetMap contributors</a>',
        format: new MVT(),
        url:
          'https://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/' +
          '{z}/{x}/{y}.vector.pbf?access_token=' +
          key,
      }),
      style: {
        'fill-color': '#eee',
        'stroke-color': 'rgba(136,136,136, 0.5)',
        'stroke-width': 1,
        'circle-radius': 2,
        'circle-fill-color': '#000',
        'text-value': ['case', ['has', 'name_en'], ['get', 'name_en'], ''],
        'text-font': 'bold 18px sans-serif',
        'text-fill-color': '#334',
        'text-stroke-color': 'rgba(255,255,255,0.8)',
        'text-stroke-width': 2,
      },
      declutter: true,
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

map.addInteraction(new Link());
