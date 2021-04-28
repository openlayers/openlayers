import Feature from '../../../../src/ol/Feature.js';
import Icon from '../../../../src/ol/style/Icon.js';
import Map from '../../../../src/ol/Map.js';
import Point from '../../../../src/ol/geom/Point.js';
import Style from '../../../../src/ol/style/Style.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';

const features = [
  new Feature({
    geometry: new Point([-1, 12]),
    scale: [-8, -8],
    anchor: [0.5, 0.5],
    rotated: 0,
  }),
];
for (let i = 0; i < 2; ++i) {
  const x = i * 5;
  features.push(
    new Feature({
      geometry: new Point([x + 2, 2]),
      scale: [1.5, 1],
      anchor: [1, 0.5],
      rotated: i,
    }),
    new Feature({
      geometry: new Point([x + 3, 2]),
      scale: [1.5, 1],
      anchor: [0.5, 0.5],
      rotated: i,
    }),
    new Feature({
      geometry: new Point([x + 4, 2]),
      scale: [1.5, 1],
      anchor: [0, 0.5],
      rotated: i,
    }),
    new Feature({
      geometry: new Point([x + 2, 4]),
      scale: [-1, 1],
      anchor: [0, 0.5],
      rotated: i,
    }),
    new Feature({
      geometry: new Point([x + 3, 4]),
      scale: [-1, 1],
      anchor: [0.5, 0.5],
      rotated: i,
    }),
    new Feature({
      geometry: new Point([x + 4, 4]),
      scale: [-1, 1],
      anchor: [1, 0.5],
      rotated: i,
    }),
    new Feature({
      geometry: new Point([x + 2, 6]),
      scale: [1, -1],
      anchor: [0.5, 1],
      rotated: i,
    }),
    new Feature({
      geometry: new Point([x + 3, 6]),
      scale: [1, -1],
      anchor: [0.5, 0.5],
      rotated: i,
    }),
    new Feature({
      geometry: new Point([x + 4, 6]),
      scale: [1, -1],
      anchor: [0.5, 0],
      rotated: i,
    }),
    new Feature({
      geometry: new Point([x + 2, 8]),
      scale: [1, 1.5],
      anchor: [0.5, 0],
      rotated: i,
    }),
    new Feature({
      geometry: new Point([x + 3, 8]),
      scale: [1, 1.5],
      anchor: [0.5, 0.5],
      rotated: i,
    }),
    new Feature({
      geometry: new Point([x + 4, 8]),
      scale: [1, 1.5],
      anchor: [0.5, 1],
      rotated: i,
    })
  );
}

const vectorSource = new VectorSource({
  features: features,
});

const style = new Style({
  image: new Icon({
    src: '/data/fish.png',
  }),
});

const vectorLayer = new VectorLayer({
  source: vectorSource,
  style: function (feature) {
    style.getImage().setScale(feature.get('scale'));
    style.getImage().setAnchor(feature.get('anchor'));
    style.getImage().setRotation((feature.get('rotated') * Math.PI) / 4);
    return style;
  },
  renderBuffer: 25,
});

const map = new Map({
  pixelRatio: 1,
  layers: [vectorLayer],
  target: 'map',
  view: new View(),
});
map.getView().fit([0, 0, 11, 11]);

render();
