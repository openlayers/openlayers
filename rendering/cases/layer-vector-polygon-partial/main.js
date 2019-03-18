import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import VectorLayer from '../../../src/ol/layer/Vector.js';
import VectorSource from '../../../src/ol/source/Vector.js';
import Feature from '../../../src/ol/Feature.js';
import Polygon from '../../../src/ol/geom/Polygon.js';
import Style from '../../../src/ol/style/Style.js';
import Stroke from '../../../src/ol/style/Stroke.js';
import Fill from '../../../src/ol/style/Fill.js';

const src = new VectorSource({
  features: [
    new Feature(new Polygon([[
      [-22, 18],
      [-22, 78],
      [-9, 78],
      [-9, 18],
      [-22, 18]
    ]])),
    new Feature(new Polygon([[
      [-9, 18],
      [-9, 78],
      [4, 78],
      [4, 18],
      [-9, 18]
    ]]))
  ]
});
const layer = new VectorLayer({
  renderBuffer: 0,
  source: src,
  style: new Style({
    stroke: new Stroke({
      color: [0, 0, 0, 1],
      width: 2
    }),
    fill: new Fill({
      color: [255, 0, 0, 1]
    })
  })
});
const view = new View({
  center: [-9.5, 78],
  zoom: 2,
  projection: 'EPSG:4326'
});
new Map({
  pixelRatio: 1,
  layers: [layer],
  target: 'map',
  view: view
});

render();
