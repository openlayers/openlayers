import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import ImageTile from '../src/ol/source/ImageTile.js';
import OSM from '../src/ol/source/OSM.js';

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';

const imagery = new TileLayer({
  className: 'ol-layer-imagery',
  source: new ImageTile({
    attributions:
      '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ',
    url: 'https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=' + key,
    tileSize: 512,
    maxZoom: 20,
  }),
});

const osm = new TileLayer({
  source: new OSM(),
});

const map = new Map({
  layers: [imagery, osm],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

const opacityInput = document.getElementById('opacity-input');
const opacityOutput = document.getElementById('opacity-output');
function update() {
  const opacity = parseFloat(opacityInput.value);
  osm.setOpacity(opacity);
  opacityOutput.innerText = opacity.toFixed(2);
}
opacityInput.addEventListener('input', update);
update();
