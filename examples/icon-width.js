import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Point from '../src/ol/geom/Point.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import Icon from '../src/ol/style/Icon.js';
import Style from '../src/ol/style/Style.js';

const widthInput = document.getElementById('width-input');
const heightInput = document.getElementById('height-input');
const clearWidthButton = document.getElementById('clear-width-button');
const clearHeightButton = document.getElementById('clear-height-button');
const scaleSpan = document.getElementById('scale');

const iconFeature = new Feature({
  geometry: new Point([0, 0]),
  name: 'Null Island',
  population: 4000,
  rainfall: 500,
});
const iconStyle = new Style({
  image: new Icon({
    src: 'data/icon.png',
    width: Number(widthInput.value),
    height: Number(heightInput.value),
  }),
});
iconFeature.setStyle(iconStyle);

widthInput.addEventListener('input', (event) => {
  const currentIcon = iconStyle.getImage();
  iconStyle.setImage(
    new Icon({
      src: 'data/icon.png',
      width: Number(event.target.value),
      height: currentIcon.getHeight(),
    }),
  );
  iconFeature.setStyle(iconStyle);
});
heightInput.addEventListener('input', (event) => {
  const currentIcon = iconStyle.getImage();
  iconStyle.setImage(
    new Icon({
      src: 'data/icon.png',
      height: Number(event.target.value),
      width: currentIcon.getWidth(),
    }),
  );
  iconFeature.setStyle(iconStyle);
});
clearWidthButton.addEventListener('click', () => {
  const currentIcon = iconStyle.getImage();
  iconStyle.setImage(
    new Icon({
      src: 'data/icon.png',
      height: currentIcon.getHeight(),
    }),
  );
  iconFeature.setStyle(iconStyle);
  widthInput.value = String(Math.round(iconStyle.getImage().getWidth()));
  scaleSpan.innerText = formatScale(iconStyle.getImage().getScale());
  iconFeature.setStyle(iconStyle);
});
clearHeightButton.addEventListener('click', () => {
  const currentIcon = iconStyle.getImage();
  iconStyle.setImage(
    new Icon({
      src: 'data/icon.png',
      width: currentIcon.getWidth(),
    }),
  );
  iconFeature.setStyle(iconStyle);
  heightInput.value = String(Math.round(iconStyle.getImage().getHeight()));
  iconFeature.setStyle(iconStyle);
});

const vectorSource = new VectorSource({
  features: [iconFeature],
});

const vectorLayer = new VectorLayer({
  source: vectorSource,
});

const map = new Map({
  layers: [vectorLayer],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 3,
  }),
});
map.on(
  'rendercomplete',
  () => (scaleSpan.innerText = formatScale(iconStyle.getImage().getScale())),
);

function formatScale(scale) {
  return Array.isArray(scale)
    ? '[' + scale?.map((v) => v.toFixed(2)).join(', ') + ']'
    : scale;
}
