import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import ImageLayer from '../src/ol/layer/Image.js';
import OGCMap from '../src/ol/source/OGCMap.js';

const map = new Map({
  target: 'map',
  layers: [
    new ImageLayer({
      source: new OGCMap({
        url: 'https://maps.gnosis.earth/ogcapi/collections/blueMarble/map',
      }),
    }),
  ],
  view: new View({
    center: [0, 0],
    zoom: 4,
  }),
});
