import CircleStyle from '../../../../src/ol/style/Circle.js';
import Feature from '../../../../src/ol/Feature.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Map from '../../../../src/ol/Map.js';
import Point from '../../../../src/ol/geom/Point.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';
import Text from '../../../../src/ol/style/Text.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';

const center = [1825927.7316762917, 6143091.089223046];
const map = new Map({
  pixelRatio: 1,
  target: 'map',
  view: new View({
    center: center,
    zoom: 12.7,
  }),
});

const sourceBlue = new VectorSource();
sourceBlue.addFeatures([
  new Feature({
    geometry: new Point([center[0] + 1000 + 540, center[1] + 900 - 600]),
    text: 'top-blue',
  }),
]);
// on-top blue circle.
// shows that objects (red layer) will not serve as obstacles for layers on-top.
map.addLayer(
  new VectorLayer({
    zIndex: 4,
    declutter: true,
    source: sourceBlue,
    style: function (feature) {
      return new Style({
        image: new CircleStyle({
          radius: 10,
          stroke: new Stroke({
            color: 'blue',
            width: 8,
          }),
          declutterMode: 'declutter',
        }),
        text: new Text({
          text: feature.get('text'),
          font: 'italic bold 18px Ubuntu',
          textBaseline: 'bottom',
          offsetY: -15,
        }),
      });
    },
  })
);

const sourceRed = new VectorSource();
sourceRed.addFeatures([
  new Feature({
    geometry: new Point([center[0] + 1000, center[1] + 1000 - 200]),
    text: 'c-red',
  }),
  new Feature({
    geometry: new Point([center[0] + 1000 - 540, center[1] + 1000]),
    text: 'w-red',
  }),
  new Feature({
    geometry: new Point([center[0] + 1000 + 540, center[1] + 1000 - 400]),
    text: 'e-red',
  }),
]);
// red circles are always drawn, but serve as obstacles.
// however, they cannot serve as obstacles for layers on-top (blue layer).
// texts are decluttered against each other and the circles.
// circles are drawn on non-declutter executor, i.e. behind decluttered labels and objects.
map.addLayer(
  new VectorLayer({
    zIndex: 3,
    declutter: true,
    source: sourceRed,
    style: function (feature) {
      return new Style({
        image: new CircleStyle({
          radius: 10,
          stroke: new Stroke({
            color: 'red',
            width: 8,
          }),
          declutterMode: 'obstacle',
        }),
        text: new Text({
          text: feature.get('text'),
          font: 'italic bold 18px Ubuntu',
          textBaseline: 'bottom',
          offsetY: -15,
        }),
      });
    },
  })
);

const sourceOrange = new VectorSource();
sourceOrange.addFeatures([
  new Feature({
    geometry: new Point([center[0], center[1]]),
    text: 'c-orange',
  }),
  new Feature({
    geometry: new Point([center[0] - 540, center[1]]),
    text: 'w-orange',
  }),
  new Feature({
    geometry: new Point([center[0] + 540, center[1]]),
    text: 'e-orange',
  }),
]);
// orange circles are always drawn.
// texts are decluttered against each other and the blue/red layer circles/texts.
map.addLayer(
  new VectorLayer({
    zIndex: 2,
    declutter: true,
    source: sourceOrange,
    style: function (feature) {
      return new Style({
        image: new CircleStyle({
          radius: 15,
          fill: new Fill({
            color: 'orange',
          }),
          declutterMode: 'none',
        }),
        text: new Text({
          text: feature.get('text'),
          font: 'italic bold 18px Ubuntu',
          textBaseline: 'bottom',
          offsetX: -25,
          offsetY: -17,
        }),
      });
    },
  })
);

const sourceCyan = new VectorSource();
sourceCyan.addFeatures([
  new Feature({
    geometry: new Point([center[0] + 1000 - 700, center[1] - 100]),
    text: 'w-cyan',
  }),
  new Feature({
    geometry: new Point([center[0] + 1000, center[1] - 400]),
    text: 'c-cyan',
  }),
  new Feature({
    geometry: new Point([center[0] + 1000 + 700, center[1] - 700]),
    text: 'e-cyan',
  }),
]);
// cyan circles are always drawn.
// texts are decluttered against each others (and blue/red/orange layers).
// the circles of the orange layer and this layer are no obstactles for texts.
// the texts are decluttered and thus above the circles of the orange layer.
map.addLayer(
  new VectorLayer({
    zIndex: 1,
    declutter: true,
    source: sourceCyan,
    style: function (feature) {
      return new Style({
        image: new CircleStyle({
          radius: 15,
          fill: new Fill({
            color: 'cyan',
          }),
          declutterMode: 'none',
        }),
        text: new Text({
          text: feature.get('text'),
          font: 'italic bold 18px Ubuntu',
          textBaseline: 'middle',
          textAlign: 'right',
          offsetX: -19,
        }),
      });
    },
  })
);

render({tolerance: 0.007});
