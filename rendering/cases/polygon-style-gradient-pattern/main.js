import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import Feature from '../../../src/ol/Feature.js';
import Polygon from '../../../src/ol/geom/Polygon.js';
import VectorLayer from '../../../src/ol/layer/Vector.js';
import VectorSource from '../../../src/ol/source/Vector.js';
import Style from '../../../src/ol/style/Style.js';
import Fill from '../../../src/ol/style/Fill.js';
import Stroke from '../../../src/ol/style/Stroke.js';


// create gradient
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
const gradient = context.createLinearGradient(0, 0, 30, 0);
gradient.addColorStop(0, 'red');
gradient.addColorStop(1 / 6, 'orange');
gradient.addColorStop(2 / 6, 'yellow');
gradient.addColorStop(3 / 6, 'green');
gradient.addColorStop(4 / 6, 'aqua');
gradient.addColorStop(5 / 6, 'blue');
gradient.addColorStop(1, 'purple');

// create pattern
canvas.width = 11;
canvas.height = 11;
context.fillStyle = 'rgba(102, 0, 102, 0.5)';
context.beginPath();
context.arc(5, 5, 4, 0, 2 * Math.PI);
context.fill();
context.fillStyle = 'rgb(55, 0, 170)';
context.beginPath();
context.arc(5, 5, 2, 0, 2 * Math.PI);
context.fill();
const pattern = context.createPattern(canvas, 'repeat');


const vectorSource = new VectorSource();
let feature;

// rectangle with 1 hole
feature = new Feature({
  geometry: new Polygon([
    [[-22.5, -5], [-22.5, 35], [37.5, 35], [37.5, -5], [-22.5, -5]],
    [[-2.5, 7], [17.5, 7], [17.5, 23], [-2.5, 23], [-2.5, 7]]
  ])
});

feature.setStyle(new Style({
  fill: new Fill({color: pattern}),
  stroke: new Stroke({color: gradient, width: 3})
}));
vectorSource.addFeature(feature);

// rectangle with 2 holes
feature = new Feature({
  geometry: new Polygon([
    [[-37.5, -32.5], [-37.5, 17.5], [32.5, 17.5], [32.5, -32.5], [-37.5, -32.5]],
    [[-33.5, -28.5], [-21.5, -28.5], [-21.5, -16.5], [-33.5, -16.5], [-33.5, -28.5]],
    [[12.5, -28.5], [26.5, -28.5], [26.5, -16.5], [12.5, -16.5], [12.5, -28.5]]
  ])
});

feature.setStyle(new Style({
  fill: new Fill({color: gradient}),
  stroke: new Stroke({color: pattern, width: 5})
}));
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
    resolution: 1
  })
});

render();
