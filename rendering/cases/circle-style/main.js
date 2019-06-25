import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import Feature from '../../../src/ol/Feature.js';
import Point from '../../../src/ol/geom/Point.js';
import VectorLayer from '../../../src/ol/layer/Vector.js';
import VectorSource from '../../../src/ol/source/Vector.js';
import Circle from '../../../src/ol/style/Circle.js';
import Style from '../../../src/ol/style/Style.js';
import Stroke from '../../../src/ol/style/Stroke.js';


const vectorSource = new VectorSource();

vectorSource.addFeatures([
  new Feature({
    geometry: new Point([-50, 50]),
    radius: 10
  }),
  new Feature({
    geometry: new Point([50, -50]),
    radius: 20
  }),
  new Feature({
    geometry: new Point([50, 50]),
    radius: 30
  })
]);

const style = new Style({
  image: new Circle({
    radius: 1,
    stroke: new Stroke({
      color: '#00f',
      width: 3
    })
  })
});

new Map({
  pixelRatio: 1,
  layers: [
    new VectorLayer({
      source: vectorSource,
      style: function(feature) {
        style.getImage().setRadius(feature.get('radius'));
        return style;
      }
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 1
  })
});

render();
