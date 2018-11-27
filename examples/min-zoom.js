import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

const viewport = document.getElementById('map');

function getMinZoom() {
  const width = viewport.clientWidth;
  return Math.ceil(Math.LOG2E * Math.log(width / 256));
}

const initialZoom = getMinZoom();

const view = new View({
  center: [0, 0],
  minZoom: initialZoom,
  zoom: initialZoom
});

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  target: 'map',
  view: view
});

window.addEventListener('resize', function() {
  const minZoom = getMinZoom();
  if (minZoom !== view.getMinZoom()) {
    view.setMinZoom(minZoom);
  }
});
