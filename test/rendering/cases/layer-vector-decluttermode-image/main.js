import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Point from '../../../../src/ol/geom/Point.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import CircleStyle from '../../../../src/ol/style/Circle.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';
import Text from '../../../../src/ol/style/Text.js';

const center = [1825927.7316762917, 6143091.089223046];
const map = new Map({
  pixelRatio: 1,
  target: 'map',
  view: new View({
    center: center,
    zoom: 13,
  }),
});

const source = new VectorSource();
const layer = new VectorLayer({
  declutter: true,
  source: source,
});

source.addFeature(
  new Feature({
    geometry: new Point(center),
    text: 'center',
    zIndex: 1,
  }),
);
source.addFeature(
  new Feature({
    geometry: new Point([center[0] - 1500, center[1]]),
    text: 'west',
    zIndex: 2,
  }),
);
source.addFeature(
  new Feature({
    geometry: new Point([center[0] + 1500, center[1]]),
    text: 'east',
    zIndex: 3,
  }),
);
source.addFeature(
  new Feature({
    geometry: new Point([center[0], center[1] - 750]),
    text: 'south',
    zIndex: 4,
  }),
);
layer.setStyle(function (feature) {
  return new Style({
    zIndex: feature.get('zIndex'),
    image: new CircleStyle({
      declutterMode: 'obstacle',
      radius: 15,
      fill: new Fill({
        color: 'blue',
      }),
    }),
    text: new Text({
      text: feature.get('text'),
      font: 'italic bold 30px Ubuntu',
      stroke: new Stroke({
        color: 'white',
        width: 2,
      }),
      offsetY: -30,
    }),
  });
});
map.addLayer(layer);

render({tolerance: 0.007});
