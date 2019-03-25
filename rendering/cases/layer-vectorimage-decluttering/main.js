import Feature from '../../../src/ol/Feature.js';
import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import VectorSource from '../../../src/ol/source/Vector.js';
import Style from '../../../src/ol/style/Style.js';
import Stroke from '../../../src/ol/style/Stroke.js';
import VectorImageLayer from '../../../src/ol/layer/VectorImage.js';
import CircleStyle from '../../../src/ol/style/Circle.js';
import Point from '../../../src/ol/geom/Point.js';
import LineString from '../../../src/ol/geom/LineString.js';
import Text from '../../../src/ol/style/Text.js';

const center = [1825927.7316762917, 6143091.089223046];

const source = new VectorSource();
const vectorLayer1 = new VectorImageLayer({
  source: source,
  style: function(feature) {
    return new Style({
      image: new CircleStyle({
        radius: 15,
        stroke: new Stroke({
          color: 'blue'
        })
      }),
      text: new Text({
        text: feature.get('text'),
        font: '16px Ubuntu'
      })
    });
  }
});

const centerFeature = new Feature({
  geometry: new Point(center),
  text: 'center'
});
source.addFeature(centerFeature);
source.addFeature(new Feature({
  geometry: new Point([center[0] - 540, center[1]]),
  text: 'west'
}));
source.addFeature(new Feature({
  geometry: new Point([center[0] + 540, center[1]]),
  text: 'east'
}));

const line = new Feature(new LineString([
  [center[0] - 650, center[1] - 200],
  [center[0] + 650, center[1] - 200]
]));
line.setStyle(new Style({
  stroke: new Stroke({
    color: '#CCC',
    width: 12
  }),
  text: new Text({
    placement: 'line',
    text: 'east-west',
    font: '16px Ubuntu'
  })
}));
source.addFeature(line);

const map = new Map({
  pixelRatio: 1,
  layers: [
    vectorLayer1
  ],
  target: 'map',
  view: new View({
    center: center,
    zoom: 13
  })
});

map.getView().fit(source.getExtent());

render({tolerance: 0.02});
