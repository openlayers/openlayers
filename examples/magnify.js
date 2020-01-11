import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {fromLonLat} from '../src/ol/proj.js';
import XYZ from '../src/ol/source/XYZ.js';
import {getRenderPixel} from '../src/ol/render.js';

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const attributions = '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

const imagery = new TileLayer({
  source: new XYZ({
    attributions: attributions,
    url: 'https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key=' + key,
    maxZoom: 20,
    crossOrigin: ''
  })
});

const container = document.getElementById('map');

const map = new Map({
  layers: [imagery],
  target: container,
  view: new View({
    center: fromLonLat([-109, 46.5]),
    zoom: 6
  })
});

let radius = 75;
document.addEventListener('keydown', function(evt) {
  if (evt.which === 38) {
    radius = Math.min(radius + 5, 150);
    map.render();
    evt.preventDefault();
  } else if (evt.which === 40) {
    radius = Math.max(radius - 5, 25);
    map.render();
    evt.preventDefault();
  }
});

// get the pixel position with every move
let mousePosition = null;

container.addEventListener('mousemove', function(event) {
  mousePosition = map.getEventPixel(event);
  map.render();
});

container.addEventListener('mouseout', function() {
  mousePosition = null;
  map.render();
});

// after rendering the layer, show an oversampled version around the pointer
imagery.on('postrender', function(event) {
  if (mousePosition) {
    const pixel = getRenderPixel(event, mousePosition);
    const offset = getRenderPixel(event, [mousePosition[0] + radius, mousePosition[1]]);
    const half = Math.sqrt(Math.pow(offset[0] - pixel[0], 2) + Math.pow(offset[1] - pixel[1], 2));
    const context = event.context;
    const centerX = pixel[0];
    const centerY = pixel[1];
    const originX = centerX - half;
    const originY = centerY - half;
    const size = Math.round(2 * half + 1);
    const sourceData = context.getImageData(originX, originY, size, size).data;
    const dest = context.createImageData(size, size);
    const destData = dest.data;
    for (let j = 0; j < size; ++j) {
      for (let i = 0; i < size; ++i) {
        const dI = i - half;
        const dJ = j - half;
        const dist = Math.sqrt(dI * dI + dJ * dJ);
        let sourceI = i;
        let sourceJ = j;
        if (dist < half) {
          sourceI = Math.round(half + dI / 2);
          sourceJ = Math.round(half + dJ / 2);
        }
        const destOffset = (j * size + i) * 4;
        const sourceOffset = (sourceJ * size + sourceI) * 4;
        destData[destOffset] = sourceData[sourceOffset];
        destData[destOffset + 1] = sourceData[sourceOffset + 1];
        destData[destOffset + 2] = sourceData[sourceOffset + 2];
        destData[destOffset + 3] = sourceData[sourceOffset + 3];
      }
    }
    context.beginPath();
    context.arc(centerX, centerY, half, 0, 2 * Math.PI);
    context.lineWidth = 3 * half / radius;
    context.strokeStyle = 'rgba(255,255,255,0.5)';
    context.putImageData(dest, originX, originY);
    context.stroke();
    context.restore();
  }
});
