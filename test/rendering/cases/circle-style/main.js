import Circle from '../../../../src/ol/style/Circle.js';
import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import Point from '../../../../src/ol/geom/Point.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';

const ellipse = new Feature(new Point([-50, -50]));

ellipse.setStyle(
  new Style({
    image: new Circle({
      radius: 30,
      scale: [1, 0.5],
      stroke: new Stroke({
        color: '#00f',
        width: 3,
      }),
    }),
  })
);

const vectorSource = new VectorSource();

vectorSource.addFeatures([
  new Feature({
    geometry: new Point([-50, 50]),
    radius: 10,
  }),
  new Feature({
    geometry: new Point([50, -50]),
    radius: 20,
  }),
  new Feature({
    geometry: new Point([50, 50]),
    radius: 30,
  }),
  ellipse,
]);

const style = new Style({
  image: new Circle({
    radius: 1,
    stroke: new Stroke({
      color: '#00f',
      width: 3,
    }),
  }),
});

new Map({
  pixelRatio: 2,
  layers: [
    new VectorLayer({
      source: vectorSource,
      style: function (feature) {
        style.getImage().setRadius(feature.get('radius'));
        return style;
      },
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 1,
  }),
});

render();
