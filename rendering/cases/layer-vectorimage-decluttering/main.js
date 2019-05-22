import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import VectorSource from '../../../src/ol/source/Vector.js';
import VectorImageLayer from '../../../src/ol/layer/VectorImage.js';
import Feature from '../../../src/ol/Feature.js';
import Point from '../../../src/ol/geom/Point.js';
import Style from '../../../src/ol/style/Style.js';
import Text from '../../../src/ol/style/Text.js';
import CircleStyle from '../../../src/ol/style/Circle.js';
import Fill from '../../../src/ol/style/Fill.js';
import Stroke from '../../../src/ol/style/Stroke.js';
import LineString from '../../../src/ol/geom/LineString.js';

let center = [1825927.7316762917, 6143091.089223046];
const map = new Map({
  pixelRatio: 1,
  target: 'map',
  view: new View({
    center: center,
    zoom: 13
  })
});

const source1 = new VectorSource();
const layer1 = new VectorImageLayer({
  declutter: true,
  source: source1
});

const source2 = new VectorSource();
const layer2 = new VectorImageLayer({
  declutter: true,
  source: source2
});

const source3 = new VectorSource();
const layer3 = new VectorImageLayer({
  declutter: true,
  source: source3
});

const source4 = new VectorSource();
const layer4 = new VectorImageLayer({
  declutter: true,
  source: source4
});

const feature1 = new Feature({
  geometry: new Point(center),
  zIndex: 2
});
source1.addFeature(feature1);
source1.addFeature(new Feature({
  geometry: new Point([center[0] - 540, center[1]]),
  zIndex: 3
}));
source1.addFeature(new Feature({
  geometry: new Point([center[0] + 540, center[1]]),
  zIndex: 1
}));
layer1.setStyle(function(feature) {
  return new Style({
    zIndex: feature.get('zIndex'),
    image: new CircleStyle({
      radius: 15,
      fill: new Fill({
        color: 'blue'
      })
    })
  });
});
map.addLayer(layer1);

center = [center[0] + 500, center[1] + 700];
const feature2 = new Feature({
  geometry: new Point(center),
  text: 'center',
  zIndex: 2
});
source2.addFeature(feature2);
source2.addFeature(new Feature({
  geometry: new Point([center[0] - 540, center[1]]),
  text: 'west',
  zIndex: 3
}));
source2.addFeature(new Feature({
  geometry: new Point([center[0] + 540, center[1]]),
  text: 'east',
  zIndex: 1
}));
layer2.setStyle(function(feature) {
  return new Style({
    zIndex: feature.get('zIndex'),
    text: new Text({
      text: feature.get('text'),
      font: 'italic bold 18px Ubuntu'
    })
  });
});
map.addLayer(layer2);

center = [center[0] + 500, center[1] + 300];
source3.addFeature(new Feature({
  geometry: new Point(center),
  text: 'center'
}));
source3.addFeature(new Feature({
  geometry: new Point([center[0] - 540, center[1]]),
  text: 'west'
}));
source3.addFeature(new Feature({
  geometry: new Point([center[0] + 540, center[1]]),
  text: 'east'
}));
layer3.setStyle(function(feature) {
  return new Style({
    image: new CircleStyle({
      radius: 10,
      stroke: new Stroke({
        color: 'red',
        width: 8
      })
    }),
    text: new Text({
      text: feature.get('text'),
      font: 'italic bold 18px Ubuntu',
      textBaseline: 'bottom',
      offsetY: -12
    })
  });
});
map.addLayer(layer3);

center = [center[0] - 2000, center[1] - 2000];
const point = new Feature(new Point(center));
point.setStyle(new Style({
  zIndex: 1,
  image: new CircleStyle({
    radius: 8,
    stroke: new Stroke({
      color: 'blue',
      width: 4
    })
  })
}));
const line = new Feature(new LineString([
  [center[0] - 650, center[1] - 200],
  [center[0] + 650, center[1] - 200]
]));
line.setStyle(new Style({
  zIndex: 2,
  stroke: new Stroke({
    color: '#CCC',
    width: 12
  }),
  text: new Text({
    placement: 'line',
    text: 'east-west',
    font: 'italic bold 18px Ubuntu',
    overflow: true
  })
}));
source4.addFeature(point);
source4.addFeature(line);
map.addLayer(layer4);

render({tolerance: 0.007});
