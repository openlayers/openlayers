import Circle from '../../../../src/ol/style/Circle.js';
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
import {getVectorContext} from '../../../../src/ol/render.js';

const offsetX = new Style({
  image: new Circle({
    radius: 5,
    fill: new Fill({
      color: 'green',
    }),
  }),
  text: new Text({
    font: '24px Ubuntu',
    text: 'offsetX',
    offsetX: -40,
    rotation: Math.PI / 4,
    fill: new Stroke({
      color: 'green',
    }),
  }),
});

const noOffset = new Style({
  image: new Circle({
    radius: 5,
    fill: new Fill({
      color: 'black',
    }),
  }),
  text: new Text({
    font: '24px Ubuntu',
    text: 'no offset',
    rotation: Math.PI / 4,
    fill: new Stroke({
      color: 'black',
    }),
  }),
});

const offsetY = new Style({
  image: new Circle({
    radius: 5,
    fill: new Fill({
      color: 'red',
    }),
  }),
  text: new Text({
    font: '24px Ubuntu',
    text: 'offsetY',
    offsetY: -20,
    rotation: Math.PI / 4,
    fill: new Stroke({
      color: 'red',
    }),
  }),
});

const vectorSource = new VectorSource();
const vectorLayer = new VectorLayer({
  source: vectorSource,
});

let feature;

feature = new Feature({
  geometry: new Point([-50, -50]),
});
feature.setStyle(offsetX);
vectorSource.addFeature(feature);

feature = new Feature({
  geometry: new Point([-50, 0]),
});
feature.setStyle(noOffset);
vectorSource.addFeature(feature);

feature = new Feature({
  geometry: new Point([-50, 50]),
});
feature.setStyle(offsetY);
vectorSource.addFeature(feature);

vectorLayer.on('postrender', function (event) {
  const vectorContext = getVectorContext(event);

  feature = new Feature({
    geometry: new Point([50, -50]),
  });
  vectorContext.drawFeature(feature, offsetX);

  feature = new Feature({
    geometry: new Point([50, 0]),
  });
  vectorContext.drawFeature(feature, noOffset);

  feature = new Feature({
    geometry: new Point([50, 50]),
  });
  vectorContext.drawFeature(feature, offsetY);
});

new Map({
  pixelRatio: 1,
  layers: [vectorLayer],
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 1,
  }),
});

render({tolerance: 0.02});
