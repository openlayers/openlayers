import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Point from '../../../../src/ol/geom/Point.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

const square = new Feature(
  new Polygon([
    [
      [-40, -40],
      [40, -40],
      [40, 40],
      [-40, 40],
      [-40, -40],
    ],
  ]),
);
square.setId('square');

const dot = new Feature(new Point([0, 0]));
dot.setId('dot');

const layer = new VectorLayer({
  source: new VectorSource({features: [square, dot]}),
  style: [
    {
      filter: ['==', ['var', 'highlighted'], ['id']],
      style: {
        'circle-radius': ['var', 'radius'],
        'circle-fill-color': ['var', 'highlightColor'],
      },
    },
    {
      else: true,
      style: {
        'circle-radius': ['var', 'radius'],
        'circle-fill-color': 'blue',
        'stroke-color': ['var', 'strokeColor'],
        'stroke-width': ['var', 'strokeWidth'],
      },
    },
  ],
  variables: {
    highlighted: 'nothing',
    highlightColor: 'red',
    radius: 5,
    strokeColor: 'black',
    strokeWidth: 1,
  },
});

const map = new Map({
  layers: [layer],
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 1,
  }),
});

// updating after a first render must invalidate the render batch, so what is
// drawn is a 20px red dot inside a square outlined with a 6px green stroke
map.once('rendercomplete', () => {
  layer.updateStyleVariables({
    highlighted: 'dot',
    radius: 20,
    strokeColor: 'green',
    strokeWidth: 6,
  });
  render();
});
