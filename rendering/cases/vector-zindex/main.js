import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import Feature from '../../../src/ol/Feature.js';
import LineString from '../../../src/ol/geom/LineString.js';
import VectorLayer from '../../../src/ol/layer/Vector.js';
import VectorSource from '../../../src/ol/source/Vector.js';
import Style from '../../../src/ol/style/Style.js';
import Stroke from '../../../src/ol/style/Stroke.js';


const vectorSourceRed = new VectorSource();
const vectorSourceBlue = new VectorSource();
let feature;

feature = new Feature({
  geometry: new LineString([[-60, 20], [45, 20]])
});
feature.setStyle(new Style({
  stroke: new Stroke({color: '#f00', width: 10})
}));
vectorSourceRed.addFeature(feature);


feature = new Feature({
  geometry: new LineString([[0, -50], [0, 60]])
});
feature.setStyle(new Style({
  stroke: new Stroke({color: '#00f', width: 16})
}));
vectorSourceBlue.addFeature(feature);

new Map({
  pixelRatio: 1,
  layers: [
    new VectorLayer({
      zIndex: 1,
      source: vectorSourceRed
    }),
    new VectorLayer({
      source: vectorSourceBlue
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 1
  })
});

render();
