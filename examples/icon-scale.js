import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import Point from '../src/ol/geom/Point.js';
import TileJSON from '../src/ol/source/TileJSON.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {Circle, Fill, Icon, Stroke, Style, Text} from '../src/ol/style.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';

const iconFeature = new Feature({
  geometry: new Point([0, 0]),
});

const iconStyle = new Style({
  image: new Icon({
    anchor: [0.5, 1],
    src: 'data/world.png',
  }),
  text: new Text({
    text: 'World\nText',
    font: 'bold 30px Calibri,sans-serif',
    fill: new Fill({
      color: 'black',
    }),
    stroke: new Stroke({
      color: 'white',
      width: 2,
    }),
  }),
});

const pointStyle = new Style({
  image: new Circle({
    radius: 7,
    fill: new Fill({
      color: 'black',
    }),
    stroke: new Stroke({
      color: 'white',
      width: 2,
    }),
  }),
});

iconFeature.setStyle([pointStyle, iconStyle]);

const vectorSource = new VectorSource({
  features: [iconFeature],
});

const vectorLayer = new VectorLayer({
  source: vectorSource,
});

const rasterLayer = new TileLayer({
  source: new TileJSON({
    url: 'https://a.tiles.mapbox.com/v3/aj.1x1-degrees.json?secure=1',
    crossOrigin: '',
  }),
});

const map = new Map({
  layers: [rasterLayer, vectorLayer],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 3,
  }),
});

const textAlignments = ['left', 'center', 'right'];
const textBaselines = ['top', 'middle', 'bottom'];
const controls = {};
const controlIds = [
  'rotation',
  'rotateWithView',
  'scaleX',
  'scaleY',
  'anchorX',
  'anchorY',
  'displacementX',
  'displacementY',
  'textRotation',
  'textRotateWithView',
  'textScaleX',
  'textScaleY',
  'textAlign',
  'textBaseline',
  'textOffsetX',
  'textOffsetY',
];
controlIds.forEach(function (id) {
  const control = document.getElementById(id);
  const output = document.getElementById(id + 'Out');
  function setOutput() {
    const value = parseFloat(control.value);
    if (control.type === 'checkbox') {
      output.innerText = control.checked;
    } else if (id === 'textAlign') {
      output.innerText = textAlignments[value];
    } else if (id === 'textBaseline') {
      output.innerText = textBaselines[value];
    } else {
      output.innerText = control.step.startsWith('0.')
        ? value.toFixed(2)
        : value;
    }
  }
  control.addEventListener('input', function () {
    setOutput();
    updateStyle();
  });
  setOutput();
  controls[id] = control;
});

function updateStyle() {
  iconStyle
    .getImage()
    .setRotation(parseFloat(controls['rotation'].value) * Math.PI);

  iconStyle.getImage().setRotateWithView(controls['rotateWithView'].checked);

  iconStyle
    .getImage()
    .setScale([
      parseFloat(controls['scaleX'].value),
      parseFloat(controls['scaleY'].value),
    ]);

  iconStyle
    .getImage()
    .setAnchor([
      parseFloat(controls['anchorX'].value),
      parseFloat(controls['anchorY'].value),
    ]);

  iconStyle
    .getImage()
    .setDisplacement([
      parseFloat(controls['displacementX'].value),
      parseFloat(controls['displacementY'].value),
    ]);

  iconStyle
    .getText()
    .setRotation(parseFloat(controls['textRotation'].value) * Math.PI);

  iconStyle.getText().setRotateWithView(controls['textRotateWithView'].checked);

  iconStyle
    .getText()
    .setScale([
      parseFloat(controls['textScaleX'].value),
      parseFloat(controls['textScaleY'].value),
    ]);

  iconStyle
    .getText()
    .setTextAlign(textAlignments[parseFloat(controls['textAlign'].value)]);

  iconStyle
    .getText()
    .setTextBaseline(textBaselines[parseFloat(controls['textBaseline'].value)]);

  iconStyle.getText().setOffsetX(parseFloat(controls['textOffsetX'].value));
  iconStyle.getText().setOffsetY(parseFloat(controls['textOffsetY'].value));

  iconFeature.changed();
}
updateStyle();

// change mouse cursor when over marker
map.on('pointermove', function (e) {
  const hit = map.hasFeatureAtPixel(e.pixel);
  map.getTargetElement().style.cursor = hit ? 'pointer' : '';
});
