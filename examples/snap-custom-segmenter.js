import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Draw from '../src/ol/interaction/Draw.js';
import Modify from '../src/ol/interaction/Modify.js';
import Snap from '../src/ol/interaction/Snap.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';

const vector = new VectorLayer({
  background: '#333',
  source: new VectorSource(),
  style: {
    'stroke-color': '#ffcc33',
  },
});

const map = new Map({
  layers: [vector],
  target: 'map',
  view: new View({
    center: [-11000000, 4600000],
    zoom: 4,
  }),
});

const modify = new Modify({
  source: vector.getSource(),
});
map.addInteraction(modify);

const draw = new Draw({
  source: vector.getSource(),
  type: 'LineString',
});
map.addInteraction(draw);

const snap = new Snap({
  source: vector.getSource(),
  segmenters: {
    LineString: (geometry) => {
      const segments = [];
      geometry.forEachSegment((c1, c2) => {
        segments.push([c1, c2], [[(c1[0] + c2[0]) / 2, (c1[1] + c2[1]) / 2]]);
      });
      return segments;
    },
  },
});
map.addInteraction(snap);
