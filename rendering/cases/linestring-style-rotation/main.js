import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import Feature from '../../../src/ol/Feature.js';
import LineString from '../../../src/ol/geom/LineString.js';
import VectorLayer from '../../../src/ol/layer/Vector.js';
import VectorSource from '../../../src/ol/source/Vector.js';
import Style from '../../../src/ol/style/Style.js';
import Stroke from '../../../src/ol/style/Stroke.js';


const vectorSource = new VectorSource();
let feature;

feature = new Feature({
  geometry: new LineString([[-60, 60], [45, 60]])
});
vectorSource.addFeature(feature);

feature = new Feature({
  geometry: new LineString([[-60, -50], [30, 10]])
});
feature.setStyle(new Style({
  stroke: new Stroke({color: '#f00', width: 3})
}));
vectorSource.addFeature(feature);

feature = new Feature({
  geometry: new LineString([[-110, -100], [0, 100], [100, -90]])
});
feature.setStyle(new Style({
  stroke: new Stroke({
    color: 'rgba(55, 55, 55, 0.75)',
    width: 5,
    lineCap: 'square',
    lineDash: [4, 8],
    lineJoin: 'round'
  })
}));
vectorSource.addFeature(feature);

feature = new Feature({
  geometry: new LineString([[-80, 80], [80, 80], [-40, -90]])
});
feature.setStyle([
  new Style({
    stroke: new Stroke({color: '#F2F211', width: 5})
  }),
  new Style({
    stroke: new Stroke({color: '#292921', width: 1})
  })
]);
vectorSource.addFeature(feature);


new Map({
  pixelRatio: 1,
  layers: [
    new VectorLayer({
      source: vectorSource
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 1,
    rotation: Math.PI / 4
  })
});

render({tolerance: 0.01});
