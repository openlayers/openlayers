import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import ImageTile from '../src/ol/source/ImageTile.js';

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const attributions =
  '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

const variables = {
  exposure: 0,
  contrast: 0,
  saturation: 0,
};

const layer = new TileLayer({
  style: {
    exposure: ['var', 'exposure'],
    contrast: ['var', 'contrast'],
    saturation: ['var', 'saturation'],
    variables: variables,
  },
  source: new ImageTile({
    attributions: attributions,
    url: 'https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=' + key,
    tileSize: 512,
    maxZoom: 20,
  }),
});

const map = new Map({
  target: 'map',
  layers: [layer],
  view: new View({
    center: [0, 0],
    zoom: 0,
  }),
});

let variable;
for (variable in variables) {
  const name = variable;
  const element = document.getElementById(name);
  const value = variables[name];
  element.value = value.toString();
  document.getElementById(name + '-value').innerText = value.toFixed(2);
  element.addEventListener('input', function (event) {
    const value = parseFloat(event.target.value);
    document.getElementById(name + '-value').innerText = value.toFixed(2);
    layer.updateStyleVariables({[name]: value});
  });
}
